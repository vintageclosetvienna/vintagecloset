'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { EventPoster } from '@/components/events/EventPoster';
import { getEvents, postersOf, EVENT_PLACES, type Event, type EventPlace } from '@/lib/events-data';

/* Homepage: the current event posters (1090 shop / Infinito hub, 1070 pop up), each leading to the events page */
export function HomePosters() {
  const [posters, setPosters] = useState<{ place: EventPlace; event: Event }[]>([]);
  useEffect(() => {
    getEvents().then((ev) => setPosters(postersOf(ev))).catch(() => setPosters([]));
  }, []);
  if (posters.length === 0) return null;
  return (
    <section className="px-4 md:px-6 py-10 md:py-14" aria-label="Event posters">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl md:text-3xl text-ink">On at the shops</h2>
        <Link href="/events" className="text-xs uppercase tracking-[0.2em] text-muted hover:text-ink">All events →</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-8 max-w-5xl">
        {posters.map(({ place, event }) => (
          <EventPoster key={place} event={event} venue={EVENT_PLACES[place].venue} href="/events" cta="See the events" />
        ))}
      </div>
    </section>
  );
}
