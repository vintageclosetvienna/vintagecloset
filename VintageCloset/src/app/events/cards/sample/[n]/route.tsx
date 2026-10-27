import { artistCardResponse } from '@/lib/artist-card';
import { SAMPLE_CARDS } from '@/lib/popup';

// The eight example artist cards, used as the default show-off on the events page.
export const revalidate = 86400;

const COVER = 'https://ybbfeprueeeijqlbtxts.supabase.co/storage/v1/object/public/product-images/1793032344313-wprhw1.jpg';

export async function GET(request: Request, { params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const card = SAMPLE_CARDS.find((c) => String(c.n) === n);
  if (!card) return new Response('Not found', { status: 404 });
  return artistCardResponse({
    seed: card.seed,
    name: card.name,
    genre: card.genre,
    when: `${card.day === 'Sun' ? 'Sunday' : 'Saturday'} · 18:00 – 21:00`,
    handle: '@vintage_closet_vienna',
    photo: COVER,
    origin: new URL(request.url).origin,
  });
}
