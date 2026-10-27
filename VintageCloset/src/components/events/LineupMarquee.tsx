'use client';

import Link from 'next/link';
import type { Event } from '@/lib/events-data';
import { isOpenSlot, postcardPath, SAMPLE_CARDS, sampleCardPath, viennaToday, weekendLabel, type LineupSlot } from '@/lib/popup';

type Tile =
  | { kind: 'dj'; key: string; event: Event; slot: LineupSlot }
  | { kind: 'sample'; key: string; sample: (typeof SAMPLE_CARDS)[number]; event?: Event; slot?: LineupSlot };

/**
 * Endless line-up row for the events page: every booked DJ's one-of-one card slides
 * to the left in a loop (same marquee as the menu's "Just in"; pauses on hover).
 * The eight example cards fill the row by default (marked Sample) and point at the open slots.
 */
export function LineupMarquee({ events }: { events: Event[] }) {
  const today = viennaToday();
  const upcoming = events.filter((e) => (e.endDate || e.date) >= today);
  const booked: Tile[] = upcoming.flatMap((event) =>
    event.lineup.filter((s) => !isOpenSlot(s)).map((slot) => ({ kind: 'dj' as const, key: `${event.id}-${slot.id}`, event, slot })),
  );
  // The example cards are the default show-off; each one advertises the next open slot
  const openSlots = upcoming.flatMap((event) => event.lineup.filter(isOpenSlot).map((slot) => ({ event, slot })));
  const samples: Tile[] = SAMPLE_CARDS.slice(0, Math.max(3, 8 - booked.length)).map((sample, i) => ({
    kind: 'sample' as const,
    key: `sample-${sample.n}`,
    sample,
    ...(openSlots[i] ?? {}),
  }));
  const base = [...booked, ...samples];

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
          {booked.length ? `${booked.length} DJ${booked.length === 1 ? '' : 's'} booked so far — tap a card for the weekend.` : 'Secret line up — the first names drop soon.'}
        </p>
      </div>
      <div className="marquee-fade">
        <div className="marquee-track flex w-max py-4" style={{ animationDuration: `${row.length * 5}s` }}>
          {items.map((tile, i) => {
            const hidden = i >= row.length;
            const event = tile.event;
            const slot = tile.slot;
            const date = event && slot ? (slot.day === 'Sun' ? event.endDate || event.date : event.date) : null;
            const src = tile.kind === 'dj' ? postcardPath(tile.event.slug, tile.slot.id) : sampleCardPath(tile.sample.n);
            const title = tile.kind === 'dj' ? tile.slot.name : date ? 'Open slot — your card here' : 'Sample card';
            const sub = date && slot ? `${weekendLabel(date)} · ${slot.time}` : 'Every artist gets a one-of-one card';
            return (
              <Link
                key={`${tile.key}-${i}`}
                href={event ? `/events/${event.slug}` : '/events'}
                aria-hidden={hidden}
                tabIndex={hidden ? -1 : undefined}
                className="group mr-4 w-[180px] shrink-0 md:mr-6 md:w-[240px]"
                style={{ transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}
              >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={tile.kind === 'dj' ? `${tile.slot.name} — ${sub}` : 'Example artist card'}
                    loading="lazy"
                    className="aspect-[4/5] w-full rounded-2xl object-cover shadow-lg transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-0 group-hover:shadow-2xl"
                  />
                  {tile.kind === 'sample' ? (
                    <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-plum">
                      Sample
                    </span>
                  ) : null}
                </div>
                <p className="mt-2 truncate text-sm font-semibold">{title}</p>
                <p className="truncate text-xs text-muted">{sub}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
