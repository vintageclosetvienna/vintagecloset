import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { cleanHandle, parseLineup, type LineupSlot } from '@/lib/popup';

// A DJ's own link: read the slot, save name / genre / links / bio and a photo.
// The token is the only key; it is 144 random bits and never shown in public data.

const MAX_PHOTO = 6 * 1024 * 1024;
const PHOTO_TYPES: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

type InviteRow = { event_id: string; slot_id: string };

/** Real image bytes, not just the type the browser claims. */
function looksLikeImage(bytes: Uint8Array, type: string): boolean {
  const hex = Buffer.from(bytes.subarray(0, 12)).toString('hex');
  if (type === 'image/jpeg') return hex.startsWith('ffd8ff');
  if (type === 'image/png') return hex.startsWith('89504e470d0a1a0a');
  if (type === 'image/webp') return hex.startsWith('52494646') && hex.slice(16, 24) === '57454250';
  return false;
}
type EventRow = {
  id: string;
  slug: string;
  title: string;
  date: string;
  end_date: string | null;
  time: string | null;
  location: string;
  image: string | null;
  lineup: unknown;
};

async function load(token: string) {
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(token)) return null;
  const db = createServerClient();
  const { data: invite } = await db
    .from('event_dj_invites' as never)
    .select('event_id, slot_id')
    .eq('token', token)
    .maybeSingle();
  const row = invite as InviteRow | null;
  if (!row) return null;
  const { data } = await db
    .from('events')
    .select('id, slug, title, date, end_date, time, location, image, lineup')
    .eq('id', row.event_id)
    .maybeSingle();
  const event = data as unknown as EventRow | null;
  if (!event) return null;
  // Links stop working a week after the weekend
  const last = new Date(`${event.end_date || event.date}T23:59:59Z`).getTime();
  if (Date.now() > last + 7 * 24 * 3600 * 1000) return null;
  const lineup = parseLineup(event.lineup);
  const slot = lineup.find((s) => s.id === row.slot_id);
  if (!slot) return null;
  return { db, event, lineup, slot };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const found = await load((await params).token);
  if (!found) return NextResponse.json({ error: 'This link is not valid any more.' }, { status: 404 });
  const { event, slot } = found;
  return NextResponse.json({
    event: {
      slug: event.slug,
      title: event.title,
      date: event.date,
      endDate: event.end_date,
      time: event.time,
      location: event.location,
      image: event.image,
    },
    slot,
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const token = (await params).token;
  const found = await load(token);
  if (!found) return NextResponse.json({ error: 'This link is not valid any more.' }, { status: 404 });
  const { db, event, lineup, slot } = found;

  const form = await request.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Please send the form again.' }, { status: 400 });
  const text = (key: string, max: number) => String(form.get(key) ?? '').trim().slice(0, max);

  const name = text('name', 60);
  if (!name) return NextResponse.json({ error: 'Please add your DJ name.' }, { status: 400 });
  const soundcloud = text('soundcloud', 200);

  const next: LineupSlot = {
    ...slot,
    name,
    genre: text('genre', 60) || undefined,
    instagram: cleanHandle(text('instagram', 80)),
    soundcloud: /^https:\/\/(www\.|on\.)?(soundcloud\.com|mixcloud\.com)\//i.test(soundcloud) ? soundcloud : undefined,
    bio: text('bio', 280) || undefined,
  };

  const photo = form.get('photo');
  if (photo instanceof File && photo.size > 0) {
    const ext = PHOTO_TYPES[photo.type];
    if (!ext) return NextResponse.json({ error: 'Photo must be JPG, PNG or WebP.' }, { status: 400 });
    if (photo.size > MAX_PHOTO) return NextResponse.json({ error: 'Photo is too big (max 6 MB).' }, { status: 400 });
    const bytes = new Uint8Array(await photo.arrayBuffer());
    if (!looksLikeImage(bytes, photo.type)) return NextResponse.json({ error: 'That file is not a real photo.' }, { status: 400 });
    const path = `${event.id}/dj-${slot.id}-${Date.now()}.${ext}`;
    const { error } = await db.storage
      .from('event-images')
      .upload(path, Buffer.from(bytes), { contentType: photo.type, upsert: false });
    if (error) return NextResponse.json({ error: 'Photo upload failed, please try again.' }, { status: 500 });
    next.photo = db.storage.from('event-images').getPublicUrl(path).data.publicUrl;
  }

  // Strip empty fields so the jsonb stays tidy
  const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== undefined && v !== ''));
  // Re-read the line up right before writing, so changes made meanwhile (team or other DJs) stay
  const { data: fresh } = await db.from('events').select('lineup').eq('id', event.id).maybeSingle();
  const current = fresh ? parseLineup((fresh as unknown as { lineup: unknown }).lineup) : lineup;
  const updated = current.map((s) => (s.id === slot.id ? clean : s));
  const { error } = await db.from('events').update({ lineup: updated } as never).eq('id', event.id);
  if (error) return NextResponse.json({ error: 'Could not save, please try again.' }, { status: 500 });

  await db.from('event_dj_invites' as never).update({ used_at: new Date().toISOString() } as never).eq('token', token);
  return NextResponse.json({ ok: true, slot: clean, slug: event.slug });
}
