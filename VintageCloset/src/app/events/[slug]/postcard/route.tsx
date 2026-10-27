import { ImageResponse } from 'next/og';
import type { ReactNode } from 'react';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { isOpenSlot, parseLineup, postcardDesign, weekendLabel, type PostcardDesign } from '@/lib/popup';

// One-of-one artist card (1080 x 1350, Instagram post size) for a DJ: ?dj=<slot id>.
// Six card types (cassette, record sleeve, gig poster, polaroid, ticket, travel postcard),
// each with its own palette, pattern, photo look, tilt, wording and serial, all seeded from
// event + slot: unique per artist, and always the same card for that artist.
export const revalidate = 60;

type Card = { d: PostcardDesign; name: string; meta: string; when: string; handle: string; photo: string | null; logo: string };

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

  const d = postcardDesign(`${event.id}:${dj.id}:${dj.name}`);
  const dayDate = dj.day === 'Sun' ? event.end_date || event.date : event.date;
  const card: Card = {
    d,
    name: dj.name || '',
    meta: [d.rank, dj.genre].filter(Boolean).join(' · '),
    when: `${weekendLabel(dayDate)} · ${dj.time}`,
    handle: dj.instagram ? `@${dj.instagram}` : 'Bandgasse 43 · 1070 Wien',
    photo: dj.photo || event.image,
    logo: `${url.origin}/brand/vintage-closet-logo.png`,
  };

  const layouts: Record<PostcardDesign['layout'], (c: Card) => ReactNode> = {
    cassette: Cassette,
    sleeve: Sleeve,
    poster: Poster,
    polaroid: Polaroid,
    ticket: Ticket,
    travel: Travel,
  };

  // Bold display face for names and big type (Archivo Black, SIL Open Font License)
  const archivo = await readFile(join(process.cwd(), 'src/assets/fonts/ArchivoBlack-Regular.ttf'));

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', backgroundColor: d.bg, backgroundImage: d.pattern }}>
        {layouts[d.layout](card)}
      </div>
    ),
    { width: 1080, height: 1350, fonts: [{ name: 'Archivo', data: archivo, weight: 400, style: 'normal' }] },
  );
}

/* eslint-disable @next/next/no-img-element */

function Photo({ c, w, h, radius = 0, style = {} }: { c: Card; w: number; h: number; radius?: number; style?: Record<string, unknown> }) {
  return c.photo ? (
    <img src={c.photo} alt="" width={w} height={h} style={{ objectFit: 'cover', borderRadius: radius, filter: c.d.filter, ...style }} />
  ) : (
    <div style={{ width: w, height: h, borderRadius: radius, display: 'flex', background: c.d.accent, ...style }} />
  );
}

function Logo({ c, w = 200 }: { c: Card; w?: number }) {
  return <img src={c.logo} alt="" width={w} height={w / 2} style={{ objectFit: 'contain' }} />;
}

const dark = (d: PostcardDesign) => (d.title === '#ffffff' ? d.accent : d.title);

/** Cassette tape: name on the label, photo in the tape window, J-card text below. */
function Cassette(c: Card) {
  const { d } = c;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 70 }}>
      <div style={{ display: 'flex', fontSize: 30, letterSpacing: 10, color: d.ink, marginBottom: 34 }}>{`SIDE ${d.side} · ${d.word}`}</div>
      <div style={{ display: 'flex', flexDirection: 'column', width: 920, height: 600, background: '#1b1b1b', borderRadius: 40, padding: 34, transform: `rotate(${d.tilt}deg)`, boxShadow: '0 30px 60px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, background: d.paper, borderRadius: 18, padding: '22px 30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 24, color: '#333' }}>
            <span>{`C-${d.serial.slice(0, 2)} · ${d.postmark}`}</span>
            <span>{`SIDE ${d.side}`}</span>
          </div>
          <div style={{ display: 'flex', fontSize: 80, fontFamily: 'Archivo', color: dark(d), lineHeight: 1, marginTop: 6 }}>{c.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, marginTop: 16 }}>
            <div style={{ display: 'flex', width: 120, height: 120, borderRadius: 999, background: '#1b1b1b', border: `16px solid ${d.accent}` }} />
            <div style={{ display: 'flex', margin: '0 36px' }}><Photo c={c} w={300} h={170} radius={14} /></div>
            <div style={{ display: 'flex', width: 120, height: 120, borderRadius: 999, background: '#1b1b1b', border: `16px solid ${d.accent}` }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 60, color: d.ink }}>
        <span style={{ fontSize: 40, fontWeight: 800 }}>{c.meta}</span>
        <span style={{ fontSize: 32, marginTop: 10 }}>{c.when}</span>
        <span style={{ fontSize: 30, marginTop: 6 }}>{c.handle}</span>
      </div>
      <div style={{ display: 'flex', marginTop: 40 }}><Logo c={c} w={180} /></div>
    </div>
  );
}

/** Record sleeve: vinyl sliding out of a coloured sleeve, the photo as the centre label. */
function Sleeve(c: Card) {
  const { d } = c;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 70 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo c={c} w={190} />
        <span style={{ fontSize: 28, letterSpacing: 8, color: d.ink }}>{`LP · ${d.serial}`}</span>
      </div>
      <div style={{ display: 'flex', position: 'relative', height: 760, marginTop: 30 }}>
        <div style={{ position: 'absolute', left: 300, top: 40, width: 640, height: 640, borderRadius: 999, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ display: 'flex', width: 560, height: 560, borderRadius: 999, border: '3px solid #2c2c2c', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', width: 470, height: 470, borderRadius: 999, border: '3px solid #2c2c2c', alignItems: 'center', justifyContent: 'center' }}>
              <Photo c={c} w={260} h={260} radius={999} />
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, top: 0, width: 600, height: 720, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 40, background: d.accent, transform: `rotate(${d.tilt}deg)`, boxShadow: '20px 20px 0 rgba(0,0,0,0.25)' }}>
          <span style={{ fontSize: 28, letterSpacing: 6, color: d.paper }}>{d.word}</span>
          <span style={{ fontSize: 96, fontFamily: 'Archivo', lineHeight: 0.95, color: d.paper }}>{c.name}</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', color: d.ink, marginTop: 20 }}>
        <span style={{ fontSize: 40, fontWeight: 800 }}>{c.meta}</span>
        <span style={{ fontSize: 32, marginTop: 8 }}>{`${c.when} · ${c.handle}`}</span>
      </div>
    </div>
  );
}

/** Gig poster: huge stacked type, a photo and a tilted date block. */
function Poster(c: Card) {
  const { d } = c;
  const words = c.name.toUpperCase().split(/\s+/).slice(0, 3);
  const [date, time] = c.when.split(' · ');
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 30, letterSpacing: 8, color: d.ink }}>
        <span>{d.word}</span>
        <span>{`No.${d.serial}`}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 30, transform: `rotate(${d.tilt / 2}deg)` }}>
        {words.map((w, i) => (
          <span key={i} style={{ fontSize: words.length > 2 ? 140 : 180, fontFamily: 'Archivo', lineHeight: 0.92, color: i % 2 ? d.accent : d.title, letterSpacing: -4 }}>{w}</span>
        ))}
      </div>
      <div style={{ display: 'flex', marginTop: 40 }}>
        <Photo c={c} w={620} h={420} style={{ border: `10px solid ${d.ink}` }} />
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: 300, marginLeft: 20, background: d.ink, color: d.bg, transform: `rotate(${-d.tilt * 2}deg)`, padding: 16 }}>
          <span style={{ fontSize: 30, letterSpacing: 6 }}>LIVE</span>
          <span style={{ fontSize: 56, fontFamily: 'Archivo', textAlign: 'center', lineHeight: 1 }}>{date}</span>
          <span style={{ fontSize: 28, marginTop: 8 }}>{time}</span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', color: d.ink }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 38, fontWeight: 800 }}>{c.meta}</span>
          <span style={{ fontSize: 30 }}>{c.handle}</span>
        </div>
        <Logo c={c} w={180} />
      </div>
    </div>
  );
}

/** Polaroid on a pinboard: tape, a caption and a round sticker. */
function Polaroid(c: Card) {
  const { d } = c;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 70 }}>
      <div style={{ display: 'flex', flexDirection: 'column', background: '#fbfaf6', padding: '36px 36px 30px', marginTop: 30, transform: `rotate(${d.tilt}deg)`, boxShadow: '0 30px 60px rgba(0,0,0,0.35)', position: 'relative' }}>
        <div style={{ position: 'absolute', top: -30, left: 290, width: 220, height: 60, background: d.accent, opacity: 0.8, transform: 'rotate(-4deg)', display: 'flex' }} />
        <Photo c={c} w={760} h={760} />
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 24, color: '#222' }}>
          <span style={{ fontSize: 78, fontFamily: 'Archivo', color: dark(d) }}>{c.name}</span>
          <span style={{ fontSize: 30, marginTop: 4 }}>{`${c.when} · ${c.handle}`}</span>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 60, bottom: 110, width: 250, height: 250, borderRadius: 999, background: d.ink, color: d.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `rotate(${12 - d.tilt}deg)`, textAlign: 'center', padding: 24 }}>
        <span style={{ fontSize: 22, letterSpacing: 3 }}>{d.word}</span>
        <span style={{ fontSize: 30, fontFamily: 'Archivo', marginTop: 6 }}>{d.rank}</span>
      </div>
      <div style={{ position: 'absolute', left: 70, bottom: 60, display: 'flex' }}><Logo c={c} w={200} /></div>
    </div>
  );
}

/** Concert ticket: photo on top, perforated stub with a barcode from the serial. */
function Ticket(c: Card) {
  const { d } = c;
  const bars = d.serial.split('').flatMap((n, i) => [Number(n) + 2, (i % 3) + 1, Number(n) % 4 + 1]);
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 60 }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: 860, background: d.paper, borderRadius: 30, transform: `rotate(${d.tilt}deg)`, boxShadow: '0 30px 60px rgba(0,0,0,0.35)', overflow: 'hidden' }}>
        <Photo c={c} w={860} h={500} />
        <div style={{ display: 'flex', flexDirection: 'column', padding: '34px 44px', color: '#222' }}>
          <span style={{ fontSize: 28, letterSpacing: 8, color: dark(d) }}>{`ADMIT ONE · ${d.word}`}</span>
          <span style={{ fontSize: 90, fontFamily: 'Archivo', lineHeight: 1, marginTop: 8 }}>{c.name}</span>
          <span style={{ fontSize: 34, marginTop: 12 }}>{c.meta}</span>
        </div>
        <div style={{ display: 'flex', borderTop: '6px dashed #333', padding: '26px 44px', justifyContent: 'space-between', alignItems: 'center', color: '#222' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 30, fontWeight: 800 }}>{c.when}</span>
            <span style={{ fontSize: 26 }}>{c.handle}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', height: 90 }}>
            {bars.map((b, i) => (
              <div key={i} style={{ display: 'flex', width: b * 2, height: 90, marginLeft: 4, background: '#222' }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** "Greetings from" travel postcard: the name in big letters over the photo, stamp in the corner. */
function Travel(c: Card) {
  const { d } = c;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 60 }}>
      <div style={{ display: 'flex', position: 'relative', height: 820, borderRadius: 30, overflow: 'hidden', border: `12px solid ${d.paper}` }}>
        <Photo c={c} w={936} h={796} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'linear-gradient(180deg, rgba(0,0,0,0.05) 20%, rgba(0,0,0,0.6) 100%)' }}>
          <span style={{ fontSize: 46, color: '#fff', transform: 'rotate(-6deg)', marginBottom: 10 }}>Greetings from</span>
          <span style={{ fontSize: 118, fontFamily: 'Archivo', color: d.title === '#ffffff' ? '#ffffff' : d.title, lineHeight: 0.95, textAlign: 'center', textShadow: `8px 8px 0 ${d.accent}`, transform: `rotate(${d.tilt}deg)`, padding: '0 30px' }}>{c.name}</span>
        </div>
        <div style={{ position: 'absolute', top: 30, right: 30, width: 170, height: 200, background: d.paper, border: '6px dashed #333', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#333', transform: `rotate(${-d.tilt}deg)` }}>
          <span style={{ fontSize: 20, letterSpacing: 2 }}>{d.postmark}</span>
          <span style={{ fontSize: 54, fontFamily: 'Archivo' }}>{d.serial.slice(0, 2)}</span>
          <span style={{ fontSize: 20 }}>WIEN</span>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, color: d.ink }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 40, fontWeight: 800 }}>{c.meta}</span>
          <span style={{ fontSize: 32, marginTop: 6 }}>{c.when}</span>
          <span style={{ fontSize: 30 }}>{c.handle}</span>
        </div>
        <Logo c={c} w={200} />
      </div>
    </div>
  );
}
