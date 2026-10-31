'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { isLiveWeekend, isOpenSlot, weekendLabel } from '@/lib/popup';
import { LineupMarquee } from '@/components/events/LineupMarquee';
import { Reveal } from '@/components/shared/Reveal';
import { Button } from '@/components/ui/Button';
import { SafeImage } from '@/components/ui/SafeImage';
import { MapPin, Clock, CalendarCheck, ArrowRight, Bell, CaretDown } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'framer-motion';
import { EventPoster } from '@/components/events/EventPoster';
import { 
  getEvents, 
  Event,
  formatEventDate,
  getShortDate,
  placeOf,
  postersOf,
  EVENT_PLACES,
  type EventPlace,
} from '@/lib/events-data';
import { getSiteImage } from '@/lib/site-images';

function EventCardSkeleton() {
  return (
    <div className="w-full bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-hairline animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
        <div className="h-[200px] md:h-[260px] bg-surface" />
        <div className="p-6 md:p-8 space-y-4">
          <div className="h-4 bg-surface rounded w-1/3" />
          <div className="h-6 bg-surface rounded w-3/4" />
          <div className="h-4 bg-surface rounded w-full" />
          <div className="h-4 bg-surface rounded w-2/3" />
          <div className="h-10 bg-surface rounded w-32 mt-4" />
        </div>
      </div>
    </div>
  );
}

function EventCard({ event, idx }: { event: Event; idx: number }) {
  const shortDate = getShortDate(event.date);
  return (
      <Reveal key={event.id} delay={idx * 0.1} width="100%">
        <article className="group w-full bg-white rounded-2xl md:rounded-3xl overflow-hidden border border-hairline shadow-sm hover:shadow-xl transition-all duration-500">
          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr]">
            {/* Image - Fixed size container */}
            <div className="relative h-[200px] md:h-[260px] overflow-hidden">
              {event.image ? (
                <Image 
                  src={event.image} 
                  alt={event.title} 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-surface flex items-center justify-center">
                  <CalendarCheck size={64} className="text-muted" />
                </div>
              )}
              {/* Status Badge */}
              <div className="absolute top-4 left-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md shadow-sm ${
                  event.status === 'Now Open'
                    ? 'bg-brand-teal-bright text-brand-plum'
                    : event.status === 'Upcoming' 
                    ? 'bg-white/95 backdrop-blur-sm text-accent-start' 
                    : 'bg-ink/80 backdrop-blur-sm text-white'
                }`}>
                  {event.status === 'Now Open' ? <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> : <CalendarCheck weight="bold" size={12} />}
                  {event.status}
                </span>
              </div>
            </div>
            
            {/* Content - Fixed height to match image */}
            <div className="p-6 md:p-8 h-auto md:min-h-[260px] flex flex-col">
              {/* Header Row */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl md:text-2xl font-display font-bold text-ink group-hover:text-accent-start transition-colors leading-tight truncate">
                    {event.title}
                  </h2>
                  <p className="text-sm text-muted mt-1">{event.endDate ? weekendLabel(event.date, event.endDate) : formatEventDate(event.date)}</p>
                </div>
                
                {/* Date Box */}
                <div className="hidden md:flex flex-col items-center justify-center w-16 h-16 bg-surface rounded-xl border border-hairline flex-shrink-0">
                  <span className="text-xl font-display font-bold text-accent-start leading-none">
                    {shortDate.day}
                  </span>
                  <span className="text-[10px] font-bold text-muted uppercase mt-0.5">
                    {shortDate.month}
                  </span>
                </div>
              </div>
              
              {/* Description - Fixed height with clamp */}
              <p className="text-muted text-sm leading-relaxed line-clamp-2 mb-auto">
                {event.description}
              </p>
              
              {/* Meta Info - Fixed position at bottom */}
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted mb-4 mt-4">
                <div className="flex items-center gap-2">
                  <MapPin weight="bold" size={14} className="text-accent-start flex-shrink-0" />
                  <span className="text-xs">{event.location}</span>
                </div>
                {event.time && (
                  <div className="flex items-center gap-2">
                    <Clock weight="bold" size={14} className="text-accent-start flex-shrink-0" />
                    <span className="text-xs">{event.time}</span>
                  </div>
                )}
              </div>
              
              {/* Line-up preview and the way into the weekend page */}
              {event.lineup.length > 0 ? (
                <div className="mb-4 flex flex-wrap gap-1.5">
                  {event.lineup.map((slot) => (
                    <span
                      key={slot.id}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        isOpenSlot(slot)
                          ? 'border border-dashed border-brand-teal text-brand-teal'
                          : 'bg-brand-teal/15 text-brand-plum'
                      }`}
                    >
                      {slot.day} · {isOpenSlot(slot) ? 'open' : slot.name}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="flex items-center gap-3">
                <Link href={`/events/${event.slug}`}>
                  <Button size="sm" className="min-w-[120px]">
                    {event.status === 'Past' ? 'See the photos' : 'Line up & details'}
                  </Button>
                </Link>
                {isLiveWeekend(event.date, event.endDate) ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-plum">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live now
                  </span>
                ) : event.spotsLeft !== null ? (
                  <span className="text-xs text-muted">{event.spotsLeft} spots left</span>
                ) : null}
              </div>
            </div>
          </div>
        </article>
      </Reveal>
  );
}

// One expandable card per place (his ask 31 Oct): 1090 shop events (with the Infinito hub) and 1070 pop up weekends
function PlaceGroup({ place, events, open, onToggle }: { place: EventPlace; events: Event[]; open: boolean; onToggle: () => void }) {
  const P = EVENT_PLACES[place];
  const next = events.find((e) => e.status !== 'Past');
  return (
    <section className={`rounded-3xl border border-hairline bg-white/60 transition-shadow ${open ? 'shadow-lg' : 'shadow-sm hover:shadow-md'}`}>
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full flex items-center gap-4 p-5 md:p-6 text-left">
        <div className="flex -space-x-3 flex-shrink-0">
          {events.filter((e) => e.image).slice(0, 3).map((e) => (
            <span key={e.id} className="relative h-12 w-12 md:h-14 md:w-14 rounded-xl overflow-hidden border-2 border-white shadow-sm bg-surface">
              <SafeImage src={e.image} alt="" fill sizes="56px" className="object-cover" />
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl md:text-2xl font-display font-bold text-ink leading-tight">{P.title}</h2>
          <p className="text-sm text-muted mt-0.5 line-clamp-1">{P.sub}</p>
          <p className="text-xs text-muted mt-1 flex items-center gap-1.5"><MapPin size={12} weight="bold" className="text-accent-start" /> {P.address}
            <span className="mx-1">·</span> {events.length} event{events.length === 1 ? '' : 's'}{next ? (next.status === 'Now Open' ? ' · now open' : ` · next ${formatEventDate(next.date)}`) : ''}</p>
        </div>
        <CaretDown size={22} weight="bold" className={`text-muted flex-shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .35 }} className="overflow-hidden">
            <div className="grid grid-cols-1 gap-6 md:gap-8 px-3 pb-3 md:px-5 md:pb-5">
              {events.length === 0
                ? <p className="text-sm text-muted px-2 pb-4">No events here yet.</p>
                : events.map((event, idx) => <EventCard key={event.id} event={event} idx={idx} />)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openPlace, setOpenPlace] = useState<EventPlace | null>(null);
  const [heroImage, setHeroImage] = useState('https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [eventsData, heroImg] = await Promise.all([
          getEvents(),
          getSiteImage('events-hero')
        ]);
        setEvents(eventsData);
        const soon = eventsData.filter((e) => e.status !== 'Past').sort((x, y) => x.date.localeCompare(y.date))[0];
        setOpenPlace(soon ? placeOf(soon) : 'popup1070');
        if (heroImg) setHeroImage(heroImg.url);
      } catch (error) {
        console.error('Error fetching data:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Quietly refresh every minute, so a newly announced DJ swaps in without a reload
  useEffect(() => {
    const id = window.setInterval(() => {
      getEvents().then((fresh) => {
        if (fresh.length) setEvents(fresh);
      }).catch(() => undefined);
    }, 60_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] md:min-h-[55vh] flex items-end overflow-hidden">
        <SafeImage 
          src={heroImage}
          alt="Community Events"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
        
        <div className="container mx-auto px-4 pb-12 md:pb-16 relative z-10">
          <Reveal>
            <div className="max-w-2xl text-center md:text-left mx-auto md:mx-0">
              <span className="inline-block px-3 py-1 bg-gradient-to-r from-accent-start to-accent-end text-white text-xs font-bold uppercase tracking-wider rounded-md mb-4">
                Vienna Community
              </span>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-4 leading-[1.05]">
                Events
              </h1>
              
              <p className="text-lg md:text-xl text-white/80 max-w-lg leading-relaxed mx-auto md:mx-0">
                Join us for exclusive drops, markets, and community gatherings. Connect with the Vienna vintage scene.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Line-up showoff: every DJ card sliding left in a loop */}
      {!isLoading ? <LineupMarquee events={events} /> : null}

      {/* Events List */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 lg:gap-10 items-start">
          <div className="grid grid-cols-1 gap-6 md:gap-8 min-w-0">
            {isLoading ? (
              // Loading skeletons
              [...Array(3)].map((_, i) => (
                <EventCardSkeleton key={i} />
              ))
            ) : events.length === 0 ? (
              // Empty state
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <CalendarCheck size={32} className="text-muted" />
                </div>
                <h2 className="text-xl font-display font-bold text-ink mb-2">No upcoming events</h2>
                <p className="text-muted">Check back soon for new events and gatherings.</p>
              </div>
            ) : (
              // Events list
              <>
                {(Object.keys(EVENT_PLACES) as EventPlace[]).map((place) => (
                  <PlaceGroup key={place} place={place} events={events.filter((e) => placeOf(e) === place)}
                    open={openPlace === place} onToggle={() => setOpenPlace(openPlace === place ? null : place)} />
                ))}
              </>
            )}
          </div>
          {/* the posters, beside the list (his reference: a poster post) */}
          {!isLoading && postersOf(events).length > 0 && (
            <aside className="lg:sticky lg:top-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
              {postersOf(events).map(({ place, event }) => (
                <EventPoster key={place} event={event} venue={EVENT_PLACES[place].venue} />
              ))}
            </aside>
          )}
          </div>
        </div>
      </section>

      {/* Past Events Teaser */}
      <section className="py-16 md:py-20 bg-white border-t border-hairline">
        <div className="container mx-auto px-4">
          <Reveal className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-ink mb-4">
              Missed an Event?
            </h2>
            <p className="text-muted mb-8 max-w-md mx-auto">
              Check out recaps and photos from our past community gatherings in The Journal.
            </p>
            <Button variant="secondary" className="group">
              Browse Past Events <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" weight="bold" size={16} />
            </Button>
          </Reveal>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-16 md:py-24 bg-ink text-white relative overflow-hidden">
        {/* Decorative gradient */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-accent-start/20 to-transparent blur-[100px] pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <Reveal className="max-w-2xl mx-auto text-center">
            <div className="w-14 h-14 mx-auto mb-6 rounded-full bg-white/10 flex items-center justify-center">
              <Bell size={28} className="text-white" weight="duotone" />
            </div>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Never Miss a Drop
            </h2>
            <p className="text-white/70 text-lg mb-8 max-w-md mx-auto">
              Get exclusive early access to events and be the first to know about new collections.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="your@email.com"
                className="flex-1 h-12 px-4 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-accent-start focus:ring-2 focus:ring-accent-start/30 transition-all"
              />
              <Button className="h-12 px-6 bg-white text-ink hover:bg-white/90">
                Subscribe
              </Button>
            </div>
            <p className="text-xs text-white/50 mt-4">
              No spam. Unsubscribe anytime.
            </p>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
