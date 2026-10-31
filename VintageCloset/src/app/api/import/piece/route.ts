import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { generateListing } from '@/lib/ai-listing';
import { importAuthorized as authorized, importReady as ready } from '@/lib/import-auth';
import { getDesigners } from '@/lib/designers';
import { CATEGORIES_BY_GENDER, PRODUCT_GENDERS, ProductGender } from '@/lib/product-categories';

/*
 * App import (Rennstern app → Vintage clothes pipeline → Publish): every piece becomes a DRAFT in admin › Drafts.
 * Nothing reaches the shop until you set the price and publish it there.
 *
 *   GET                         → { ready, authorized }  (is the import set up; is this key right; no secrets)
 *   POST { action: 'start', ref, count }
 *                               → the draft for this piece (same ref = same draft) + one signed upload link per photo
 *                                 (photos go straight to Storage, past Vercel's 4.5 MB request limit)
 *   POST { action: 'finish', draft_id, ref, count, facts }
 *                               → photos attached, the website's AI writes title, description and era (same as the
 *                                 admin autofill), the app's label reading (brand, size) fills what the AI leaves open
 *
 * Auth: "Authorization: Bearer <VINTAGE_IMPORT_KEY>" (Vercel env, Production; the app keeps it in the Mac's Keychain).
 */

// The AI listing (photos + web search) can take a minute or more
export const maxDuration = 300;

const BUCKET = 'product-images';
const MAX_PHOTOS = 12;

interface Facts {
  category?: string;
  gender?: string;
  size?: string;
  brand?: string;
  label_text?: string;
}

const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export async function POST(request: NextRequest) {
  if (!ready()) {
    return NextResponse.json({ error: 'The import is not set up yet (VINTAGE_IMPORT_KEY missing on Vercel).' }, { status: 503 });
  }
  if (!authorized(request)) {
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
  const photoPaths = (id: string) => Array.from({ length: count }, (_, i) => `${id}/${i}.jpg`);

  if (body.action === 'start') {
    // one draft per piece: sending the same piece again updates it instead of making a second one
    const { data: draft, error } = await db
      .from('product_drafts')
      .upsert({ source: 'rennstern-app', source_ref: ref } as never, { onConflict: 'source,source_ref' })
      .select('id')
      .single();
    if (error || !draft) {
      return NextResponse.json({ error: `Could not create the draft: ${error?.message || 'unknown'}` }, { status: 500 });
    }
    const id = (draft as { id: string }).id;

    const uploads: { path: string; url: string }[] = [];
    for (const path of photoPaths(id)) {
      const { data, error: e } = await db.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
      if (e || !data) {
        return NextResponse.json({ error: `Could not prepare the photo upload: ${e?.message || 'unknown'}` }, { status: 500 });
      }
      uploads.push({ path, url: data.signedUrl });
    }
    return NextResponse.json({ ok: true, draft_id: id, uploads });
  }

  if (body.action === 'finish') {
    const id = text(body.draft_id, 64);
    const { data: draft } = await db.from('product_drafts').select('id, source_ref').eq('id', id).single();
    if (!draft || (draft as { source_ref: string }).source_ref !== ref) {
      return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });
    }

    // the photos that arrived (in the app's order: front, back, side, on model, details, label); old extras are removed
    const { data: files } = await db.storage.from(BUCKET).list(id);
    const wanted = new Set(photoPaths(id).map((p) => p.split('/')[1]));
    const have = new Set((files || []).map((f) => f.name));
    const missing = [...wanted].filter((n) => !have.has(n));
    if (missing.length) {
      return NextResponse.json({ error: `${missing.length} photo(s) did not arrive; send the piece again.` }, { status: 400 });
    }
    const extra = (files || []).map((f) => f.name).filter((n) => !wanted.has(n));
    if (extra.length) await db.storage.from(BUCKET).remove(extra.map((n) => `${id}/${n}`));
    const v = Date.now();
    const images = photoPaths(id).map((p) => `${db.storage.from(BUCKET).getPublicUrl(p).data.publicUrl}?v=${v}`);

    const f = (body.facts || {}) as Facts;
    const gender = PRODUCT_GENDERS.includes(f.gender as ProductGender) ? (f.gender as ProductGender) : null;
    const category = gender && f.category && CATEGORIES_BY_GENDER[gender].includes(f.category) ? f.category : '';
    const facts = {
      images,
      brand: text(f.brand, 60) || null,
      label_text: text(f.label_text, 300) || null,
      size: text(f.size, 30),
      gender,
      category,
      ai_status: 'pending' as const,
      ai_error: null,
    };
    await db.from('product_drafts').update(facts as never).eq('id', id);

    // the website's AI writes the listing; what the app read on the label is a hint, the photos decide
    const notes = [
      facts.label_text ? `The shop's app read this on the label: "${facts.label_text}".` : '',
      facts.brand ? `Brand on the label: ${facts.brand}.` : '',
      facts.size ? `Size on the label: ${facts.size}.` : '',
      category ? `The app sorted it as ${gender} ${category}.` : '',
      // the shop's partner collectives, brands and designers: their cards on the homepage light up from the title
      `Partner labels sold here: ${(await getDesigners()).map((d) => d.name).join(', ')}. If the label, tag or logo shows one of them, put that exact name in the title.`,
    ].filter(Boolean).join(' ');
    let update: Record<string, unknown>;
    try {
      const ai = await generateListing('', images.slice(0, 6), notes);
      update = {
        title: ai.title,
        description: ai.description || null,
        era: ai.era || null,
        size: facts.size || ai.size,                 // the label reading wins: it is the tag's exact text
        gender: ai.gender || gender,
        category: ai.category || ((ai.gender || gender) === gender ? category : ''),
        ai_status: 'done',
        ai_error: null,
      };
    } catch (e) {
      update = {
        title: [facts.brand, category].filter(Boolean).join(' ') || 'New piece',
        ai_status: 'failed',
        ai_error: e instanceof Error ? e.message.slice(0, 300) : 'AI listing failed',
      };
    }
    const { data: saved, error } = await db.from('product_drafts').update(update as never).eq('id', id).select('id, title, ai_status').single();
    if (error) {
      return NextResponse.json({ error: `Could not save the draft: ${error.message}` }, { status: 500 });
    }
    return NextResponse.json({ ok: true, draft_id: id, ...(saved as object), admin: '/admin/drafts' });
  }

  return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
}
