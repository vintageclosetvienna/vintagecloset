import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';
import { isOpenSlot, parseLineup, postcardDesign, weekendLabel } from '@/lib/popup';

// Vintage postcard (1080 x 1350, Instagram post size) for one DJ: ?dj=<slot id>.
// Every artist gets their own colourway, stamp angle, postmark and serial, seeded from
// the event + slot, so the card is unique but always the same for that artist.
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
    .select('id, title, date, end_date, location, image, lineup')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  if (!event) return new Response('Not found', { status: 404 });
  const dj = parseLineup(event.lineup).find((slot) => slot.id === djId && !isOpenSlot(slot));
  if (!dj) return new Response('Not found', { status: 404 });

  const d = postcardDesign(`${event.id}:${dj.id}`);
  const dayDate = dj.day === 'Sun' ? event.end_date || event.date : event.date;
  const logo = `${url.origin}/brand/vintage-closet-logo.png`;
  const photo = dj.photo || event.image;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: d.paper, padding: 48 }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: `6px solid ${d.ink}`, borderRadius: 28, padding: 48, position: 'relative' }}>
          {/* Header line */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" width={220} height={110} style={{ objectFit: 'contain' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', color: d.ink }}>
              <span style={{ fontSize: 26, letterSpacing: 6 }}>POST CARD</span>
              <span style={{ fontSize: 22, opacity: 0.7 }}>{`No. ${d.serial}`}</span>
            </div>
          </div>

          {/* Stamp with the artist photo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
            <div
              style={{
                display: 'flex',
                padding: 18,
                background: '#ffffff',
                border: `8px dashed ${d.ink}`,
                transform: `rotate(${d.tilt}deg)`,
                boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              }}
            >
              {photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photo} alt="" width={520} height={560} style={{ objectFit: 'cover', filter: 'sepia(0.25) contrast(1.05)' }} />
              ) : (
                <div style={{ width: 520, height: 560, display: 'flex', background: d.accent }} />
              )}
            </div>
          </div>

          {/* Postmark */}
          <div
            style={{
              position: 'absolute',
              top: 170,
              right: 40,
              width: 210,
              height: 210,
              background: d.paper,
              borderRadius: 999,
              border: `5px solid ${d.ink}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: d.ink,
              opacity: 0.85,
              transform: `rotate(${-d.tilt * 2}deg)`,
              fontSize: 19,
              textAlign: 'center',
            }}
          >
            <span style={{ letterSpacing: 4 }}>{d.postmark}</span>
            <span style={{ fontSize: 40, fontWeight: 900, margin: '6px 0' }}>{dayDate.slice(8, 10) + '.' + dayDate.slice(5, 7)}</span>
            <span style={{ letterSpacing: 4 }}>1070 WIEN</span>
          </div>

          <div style={{ flex: 1, display: 'flex' }} />

          {/* Credentials */}
          <div style={{ display: 'flex', flexDirection: 'column', color: d.ink }}>
            <span style={{ fontSize: 26, letterSpacing: 6, color: d.accent }}>VINTAGE CREDENTIALS</span>
            <span style={{ fontSize: 96, fontWeight: 900, lineHeight: 1, marginTop: 10, color: d.title, textShadow: `6px 7px 0 ${d.ink}` }}>{dj.name}</span>
            <span style={{ fontSize: 34, marginTop: 14 }}>{`${d.rank}${dj.genre ? ` · ${dj.genre}` : ''}`}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26, paddingTop: 22, borderTop: `3px dashed ${d.ink}`, fontSize: 28 }}>
              <span>{`${weekendLabel(dayDate)} · ${dj.time}`}</span>
              <span>{dj.instagram ? `@${dj.instagram}` : event.location}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1350 },
  );
}
