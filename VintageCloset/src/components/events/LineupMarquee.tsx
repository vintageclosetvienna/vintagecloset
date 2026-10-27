'use client';

import Link from 'next/link';
import type { Event } from '@/lib/events-data';
import { isOpenSlot, postcardPath, SAMPLE_CARDS, sampleCardPath, viennaToday, weekendLabel, type LineupSlot } from '@/lib/popup';

type Tile = { key: string; event: Event; slot: LineupSlot; open: boolean; sample: (typeof SAMPLE_CARDS)[number] };

const MAX_TILES = 12;

/**
 * Endless line-up row for the events page (same marquee as the menu's "Just in"; pauses on hover).
 * One tile per upcoming slot, in date order: an open slot shows a small, blurred sample card;
 * as soon as an artist is saved for that slot, the tile becomes their own sharp card in the same place.
 */
export function LineupMarquee({ events }: { events: Event[] }) {
  const today = viennaToday();
  const upcoming = events
    .filter((e) => (e.endDate || e.date) >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const slots = upcoming.flatMap((event) => event.lineup.map((slot) => ({ event, slot }))).slice(0, MAX_TILES);
  // Open slots take the sample cards in turn (the nth open slot gets sample n)
  const openOrder = slots.map((_, i) => slots.slice(0, i).filter((s) => isOpenSlot(s.slot)).length);
  const base: Tile[] = slots.map(({ event, slot }, i) => ({
    key: `${event.id}-${slot.id}`,
    event,
    slot,
    open: isOpenSlot(slot),
    sample: SAMPLE_CARDS[openOrder[i] % SAMPLE_CARDS.length],
  }));
  if (base.length === 0) return null;
  const bookedCount = base.filter((t) => !t.open).length;

  // Repeat until the row is wider than the screen, then double it for the seamless loop
  let row = base;
  while (row.length < 8) row = [...row, ...base];
  const items = [...row, ...row];

  return (
    <section className="overflow-hidden border-b border-hairline bg-white py-10 md:py-14">
      <div className="container mx-auto mb-6 flex items-end justify-between gap-4 px-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-plum">Pop up · Bandgasse 43</p>
          <h2 className="sticker-text font-display text-3xl md:text-4xl">The line up</h2>
        </div>
        <p className="hidden max-w-xs text-right text-sm text-muted md:block">
          {bookedCount
            ? `${bookedCount} DJ${bookedCount === 1 ? '' : 's'} revealed so far — the blurry ones are still open.`
            : 'Secret line up — each card comes into focus when its artist is announced.'}
        </p>
      </div>
      <div className="marquee-fade">
        <div className="marquee-track flex w-max items-end py-4" style={{ animationDuration: `${row.length * 5}s` }}>
          {items.map((tile, i) => {
            const hidden = i >= row.length;
            const { event, slot, open } = tile;
            const date = slot.day === 'Sun' ? event.endDate || event.date : event.date;
            const when = `${weekendLabel(date)} · ${slot.time}`;
            return (
              <Link
                key={`${tile.key}-${i}`}
                href={`/events/${event.slug}`}
                aria-hidden={hidden}
                tabIndex={hidden ? -1 : undefined}
                className={`group mr-4 shrink-0 md:mr-6 ${open ? 'w-[120px] md:w-[150px]' : 'w-[180px] md:w-[240px]'}`}
                style={{ transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}
              >
                <div className="relative overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={open ? sampleCardPath(tile.sample.n) : postcardPath(event.slug, slot.id)}
                    alt={open ? 'Open slot — artist not announced yet' : `${slot.name} — ${when}`}
                    loading="lazy"
                    className={`aspect-[4/5] w-full object-cover shadow-lg transition-all duration-500 group-hover:-translate-y-1 ${
                      open ? 'scale-110 blur-md group-hover:blur-sm' : 'group-hover:rotate-0 group-hover:shadow-2xl'
                    }`}
                  />
                  {open ? (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-plum shadow">
                        ? Open slot
                      </span>
                    </span>
                  ) : null}
                </div>
                <p className={`mt-2 truncate font-semibold ${open ? 'text-xs text-muted' : 'text-sm'}`}>{open ? 'To be announced' : slot.name}</p>
                <p className="truncate text-[11px] text-muted">{when}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
