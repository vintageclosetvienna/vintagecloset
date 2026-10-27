import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { DAY_LABEL, isOpenSlot, parseLineup, weekendLabel } from '@/lib/popup';

// Instagram / WhatsApp story card (1080 x 1920) for a pop up weekend, or for one DJ with ?dj=<slot id>.
export const revalidate = 60;

const TEAL = '#4CC2BA';
const TEAL_BRIGHT = '#01DBCA';
const PLUM = '#602140';
const CREAM = '#F6EFE4';

export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const url = new URL(request.url);
  const djId = url.searchParams.get('dj');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { auth: { persistSession: false } },
  );
  const { data: event } = await supabase
    .from('events')
    .select('title, date, end_date, time, location, image, lineup')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  if (!event) return new Response('Not found', { status: 404 });

  const lineup = parseLineup(event.lineup);
  const dj = djId ? lineup.find((slot) => slot.id === djId && !isOpenSlot(slot)) : undefined;
  const booked = lineup.filter((slot) => !isOpenSlot(slot));
  const background = dj?.photo || event.image;
  const logo = `${url.origin}/brand/vintage-closet-logo.png`;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: PLUM, position: 'relative' }}>
        {background ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={background} alt="" width={1080} height={1920} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : null}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', background: 'linear-gradient(180deg, rgba(96,33,64,0.15) 0%, rgba(96,33,64,0.35) 45%, rgba(40,10,25,0.92) 100%)' }} />

        {/* Ticket stub at the top */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '80px 72px 0', position: 'relative' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" width={300} height={150} style={{ objectFit: 'contain' }} />
          <div style={{ display: 'flex', background: TEAL_BRIGHT, color: PLUM, fontSize: 34, fontWeight: 800, padding: '14px 28px', borderRadius: 999, transform: 'rotate(4deg)' }}>
            POP UP · LIVE SETS
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex' }} />

        <div style={{ display: 'flex', flexDirection: 'column', padding: '0 72px 110px', position: 'relative' }}>
          {dj ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 44, color: CREAM, letterSpacing: 6 }}>
                {`${DAY_LABEL[dj.day].toUpperCase()} · ${dj.time}`}
              </div>
              <div style={{ display: 'flex', fontSize: 150, fontWeight: 900, color: TEAL, lineHeight: 1, marginTop: 18, textShadow: `8px 10px 0 ${PLUM}` }}>
                {dj.name}
              </div>
              {dj.genre ? (
                <div style={{ display: 'flex', fontSize: 46, color: CREAM, marginTop: 24 }}>{dj.genre}</div>
              ) : null}
              {dj.instagram ? (
                <div style={{ display: 'flex', fontSize: 42, color: TEAL_BRIGHT, marginTop: 14 }}>{`@${dj.instagram}`}</div>
              ) : null}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', fontSize: 120, fontWeight: 900, color: TEAL, lineHeight: 1.05, textShadow: `8px 10px 0 ${PLUM}` }}>
                {event.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', marginTop: 36 }}>
                {booked.length > 0 ? (
                  booked.slice(0, 6).map((slot) => (
                    <div key={slot.id} style={{ display: 'flex', fontSize: 48, color: CREAM, marginTop: 10 }}>
                      <span style={{ color: TEAL_BRIGHT, width: 130 }}>{slot.day.toUpperCase()}</span>
                      <span style={{ fontWeight: 800 }}>{slot.name}</span>
                    </div>
                  ))
                ) : (
                  <div style={{ display: 'flex', fontSize: 52, color: CREAM }}>Secret line up · open decks</div>
                )}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', marginTop: 56, borderTop: `4px dashed ${TEAL}`, paddingTop: 36, justifyContent: 'space-between', color: CREAM, fontSize: 40 }}>
            <span>{weekendLabel(event.date, event.end_date)}</span>
            <span>{event.time || ''}</span>
          </div>
          <div style={{ display: 'flex', color: CREAM, fontSize: 40, marginTop: 12 }}>{event.location}</div>
          <div style={{ display: 'flex', color: TEAL_BRIGHT, fontSize: 36, marginTop: 28 }}>vintagecloset.app/events</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
