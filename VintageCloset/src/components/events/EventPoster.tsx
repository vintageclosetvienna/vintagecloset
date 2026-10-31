'use client';

import React from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { ArrowRight } from '@phosphor-icons/react';
import type { Event } from '@/lib/events-data';
import { formatEventDate } from '@/lib/events-data';
import { weekendLabel } from '@/lib/popup';

/* An event poster in a post frame (his reference: an Instagram poster post): the venue on top, the poster whole (4:5, never
   cropped), the date and the way in below. Events page side column; homepage, leading to the events page. */

export function EventPoster({ event, venue, href, cta = 'Line up & details' }: { event: Event; venue: string; href?: string; cta?: string }) {
  const to = href || `/events/${event.slug}`;
  return (
    <Link href={to} className="group block rounded-2xl bg-white border border-hairline shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
      <div className="flex items-center gap-2.5 px-3.5 py-2.5">
        <span className="h-7 w-7 rounded-full p-[1.5px] bg-gradient-to-br from-brand-teal to-brand-plum">
          <span className="relative block h-full w-full rounded-full bg-white overflow-hidden">
            <SafeImage src="/brand/app-icon-192.png" alt="" fill sizes="28px" className="object-cover" />
          </span>
        </span>
        <span className="min-w-0">
          <span className="block text-[12px] font-bold text-ink leading-tight truncate">{venue}</span>
          <span className="block text-[10px] text-muted leading-tight truncate">{event.location}</span>
        </span>
      </div>
      <div className="relative aspect-[4/5] bg-ink/90">
        {event.image ? (
          <SafeImage src={event.image} alt={event.title} fill sizes="(max-width: 768px) 90vw, 340px" className="object-contain" />
        ) : null}
      </div>
      <div className="px-3.5 py-3">
        <p className="text-sm font-display font-bold text-ink leading-snug line-clamp-2">{event.title}</p>
        <p className="text-xs text-muted mt-0.5">{event.endDate ? weekendLabel(event.date, event.endDate) : formatEventDate(event.date)}{event.time ? ` · ${event.time}` : ''}</p>
        <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-brand-plum group-hover:gap-2.5 transition-all">
          {cta} <ArrowRight size={12} weight="bold" />
        </span>
      </div>
    </Link>
  );
}
