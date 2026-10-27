import { createClient } from '@supabase/supabase-js';
import { artistCardResponse } from '@/lib/artist-card';
import { isOpenSlot, parseLineup, weekendLabel } from '@/lib/popup';

// One-of-one artist card for a DJ: ?dj=<slot id>. The design comes from the seed stored on
// the slot when the DJ (or the team) first saved the name, so it never changes and no two
// artists share a card. Slots saved before seeds existed fall back to event + slot + name.
export const revalidate = 60;

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(request.url);
  const djId = url.searchParams.get('dj') || '';

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: false } },
  );
  const { data: event } = await supabase
    .from('events')
    .select('id, date, end_date, image, lineup')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  if (!event) return new Response('Not found', { status: 404 });
  const dj = parseLineup(event.lineup).find((slot) => slot.id === djId && !isOpenSlot(slot));
  if (!dj) return new Response('Not found', { status: 404 });

  const dayDate = dj.day === 'Sun' ? event.end_date || event.date : event.date;
  return artistCardResponse({
    seed: dj.cardSeed || `${event.id}:${dj.id}:${dj.name}`,
    name: dj.name || '',
    genre: dj.genre,
    when: `${weekendLabel(dayDate)} · ${dj.time}`,
    handle: dj.instagram ? `@${dj.instagram}` : 'Bandgasse 43 · 1070 Wien',
    photo: dj.photo || event.image,
    origin: url.origin,
  });
}
