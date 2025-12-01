'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Reveal } from '@/components/shared/Reveal';
import { Button } from '@/components/ui/Button';
import { MapPin, Clock, CalendarCheck, ArrowRight, Bell } from '@phosphor-icons/react';
import { 
  getEvents, 
  Event,
  formatEventDate,
  getShortDate,
} from '@/lib/events-data';

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

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      setIsLoading(true);
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
        setEvents([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] md:min-h-[55vh] flex items-end overflow-hidden">
        <Image 
          src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop"
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

      {/* Events List */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 gap-8 md:gap-10">
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
              events.map((event, idx) => {
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
                              event.status === 'Upcoming' 
                                ? 'bg-white/95 backdrop-blur-sm text-accent-start' 
                                : 'bg-ink/80 backdrop-blur-sm text-white'
                            }`}>
                              <CalendarCheck weight="bold" size={12} />
                              {event.status}
                            </span>
                          </div>
                        </div>
                        
                        {/* Content - Fixed height to match image */}
                        <div className="p-6 md:p-8 h-auto md:h-[260px] flex flex-col">
                          {/* Header Row */}
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="min-w-0 flex-1">
                              <h2 className="text-xl md:text-2xl font-display font-bold text-ink group-hover:text-accent-start transition-colors leading-tight truncate">
                                {event.title}
                              </h2>
                              <p className="text-sm text-muted mt-1">{formatEventDate(event.date)}</p>
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
                          <p className="text-muted text-sm leading-relaxed line-clamp-2 h-[40px] mb-auto">
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
                          
                          {/* Actions - Fixed at bottom */}
                          <div className="flex items-center gap-3">
                            {event.status === 'Upcoming' ? (
                              <>
                                <Button size="sm" className="min-w-[120px]">
                                  RSVP Now
                                </Button>
                                {event.spotsLeft !== null && (
                                  <span className="text-xs text-muted">{event.spotsLeft} spots left</span>
                                )}
                              </>
                            ) : (
                              <Button variant="secondary" size="sm" className="group/btn">
                                <Bell weight="bold" size={14} className="mr-2" />
                                Notify Me
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  </Reveal>
                );
              })
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
