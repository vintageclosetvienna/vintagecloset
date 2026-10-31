import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateListing } from '@/lib/ai-listing';
import { importAuthorized, importReady } from '@/lib/import-auth';

/*
 * App import of a model look (Rennstern app → Vintage clothes pipeline → Publish): the model photos of one look go to the
 * site gallery (site-images bucket, lookbook/<look>/) and become one swipe card in the homepage photo wall (site_images,
 * section 'lookbook', one row per photo, keys look-<look>-<n>). The same photos still arrive as a product draft through
 * /api/import/piece; this only adds the gallery card.
 *
 *   POST { action: 'start', ref, count }            → one signed upload link per photo (straight to Storage)
 *   POST { action: 'finish', ref, count, title? }   → photos checked, the website's AI writes a short caption, card live
 *
 * Auth: "Authorization: Bearer <VINTAGE_IMPORT_KEY>", same key as the piece import.
 */

export const maxDuration = 300;

const BUCKET = 'site-images';
const SECTION = 'lookbook';
const MAX_PHOTOS = 12;

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** The first sentence or two, at most ~150 characters: a caption, not a listing. */
function shortCaption(description: string): string {
  const sentences = description.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]+/g) || [description];
  let out = '';
  for (const s of sentences) {
    if ((out + s).length > 150) break;
    out += s;
  }
  return (out || sentences[0].slice(0, 147) + '…').trim();
}

export async function POST(request: NextRequest) {
  if (!importReady()) {
    return NextResponse.json({ error: 'The import is not set up yet (VINTAGE_IMPORT_KEY missing on Vercel).' }, { status: 503 });
  }
  if (!importAuthorized(request)) {
    return NextResponse.json({ error: 'Wrong or missing import key.' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  const ref = text(body.ref, 200);
  const count = Number(body.count);
  if (!ref || !Number.isInteger(count) || count < 1 || count > MAX_PHOTOS) {
    return NextResponse.json({ error: `ref and count (1–${MAX_PHOTOS}) are required.` }, { status: 400 });
  }

  const db = createServerClient();
  const look = createHash('sha1').update(ref).digest('hex').slice(0, 12);   // same look = same card, sent again it updates
  const folder = `${SECTION}/${look}`;
  const paths = Array.from({ length: count }, (_, i) => `${folder}/${i}.jpg`);

  if (body.action === 'start') {
    const uploads: { path: string; url: string }[] = [];
    for (const path of paths) {
      const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
      if (error || !data) {
        return NextResponse.json({ error: `Could not prepare the photo upload: ${error?.message || 'unknown'}` }, { status: 500 });
      }
      uploads.push({ path, url: data.signedUrl });
    }
    return NextResponse.json({ ok: true, look, uploads });
  }

  if (body.action === 'finish') {
    const { data: files } = await db.storage.from(BUCKET).list(folder);
    const wanted = new Set(paths.map((p) => p.split('/').pop() as string));
    const have = new Set((files || []).map((f) => f.name));
    const missing = [...wanted].filter((n) => !have.has(n));
    if (missing.length) {
      return NextResponse.json({ error: `${missing.length} photo(s) did not arrive; send the look again.` }, { status: 400 });
    }
    const extra = (files || []).map((f) => f.name).filter((n) => !wanted.has(n));
    if (extra.length) await db.storage.from(BUCKET).remove(extra.map((n) => `${folder}/${n}`));
    const v = Date.now();
    const urls = paths.map((p) => `${db.storage.from(BUCKET).getPublicUrl(p).data.publicUrl}?v=${v}`);

    let title = text(body.title, 80);
    let caption = '';
    try {
      const ai = await generateListing(title, urls.slice(0, 4),
        'These are lookbook photos of a model wearing one vintage look from the shop. Name the look in the title; the description is read as a short photo caption.');
      title = title || ai.title;
      caption = ai.description ? shortCaption(ai.description) : '';
    } catch {
      title = title || 'New look';
    }

    const rows = urls.map((url, i) => ({
      key: `look-${look}-${i}`,
      section: SECTION,
      label: title,
      description: caption,
      url,
      sort_order: i,
      is_active: true,
      object_position: 'center top',
    }));
    const { error } = await db.from('site_images').upsert(rows as never, { onConflict: 'key' });
    if (error) {
      return NextResponse.json({ error: `Could not save the look: ${error.message}` }, { status: 500 });
    }
    // a look sent again with fewer photos: its old extra cards go
    const { data: old } = await db.from('site_images').select('key').like('key', `look-${look}-%`);
    const stale = ((old || []) as { key: string }[]).map((r) => r.key).filter((k) => Number(k.split('-').pop()) >= count);
    if (stale.length) await db.from('site_images').delete().in('key', stale);

    return NextResponse.json({ ok: true, look, title, caption, photos: count });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
