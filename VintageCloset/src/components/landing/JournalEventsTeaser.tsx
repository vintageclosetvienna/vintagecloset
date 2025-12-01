'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, CalendarBlank, MapPin, Clock } from '@phosphor-icons/react';
import { Reveal } from '@/components/shared/Reveal';
import { Button } from '@/components/ui/Button';
import { getNextEvent, Event, getShortDate } from '@/lib/events-data';
import { getFeaturedArticle, JournalArticle } from '@/lib/journal-data';

export function JournalEventsTeaser() {
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  const [featuredArticle, setFeaturedArticle] = useState<JournalArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [eventData, articleData] = await Promise.all([
          getNextEvent(),
          getFeaturedArticle(),
        ]);
        setNextEvent(eventData);
        setFeaturedArticle(articleData);
      } catch (error) {
        console.error('Error fetching teaser data:', error);
        setNextEvent(null);
        setFeaturedArticle(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <section className="py-16 md:py-24 px-4 bg-surface">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8 justify-center items-stretch max-w-fit mx-auto">
          {/* Journal Card */}
          <Reveal direction="up" delay={0}>
            <Link href="/journal" className="group block h-full">
              <div className="bg-white rounded-2xl p-8 md:p-10 border border-hairline hover:border-accent-start/30 transition-all duration-300 hover:shadow-xl hover:shadow-accent-start/5 w-full md:w-[420px] h-[320px] flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-accent-start mb-4">
                  The Journal
                </span>
                
                {isLoading ? (
                  <div className="animate-pulse flex-1">
                    <div className="h-8 bg-surface rounded w-3/4 mb-4" />
                    <div className="h-4 bg-surface rounded w-full mb-2" />
                    <div className="h-4 bg-surface rounded w-2/3" />
                  </div>
                ) : (
                  <>
                    <h3 className="text-3xl md:text-4xl font-display font-bold text-ink mb-4 leading-tight group-hover:text-accent-start transition-colors duration-300">
                      {featuredArticle?.title || 'No articles yet'}
                    </h3>
                    <p className="text-muted text-lg mb-10 flex-1 leading-relaxed max-w-sm">
                      {featuredArticle?.excerpt || 'Check back soon for stories and updates.'}
                    </p>
                  </>
                )}
                
                <div className="flex items-center gap-2 text-accent-start font-medium group-hover:gap-3 transition-all duration-300 mt-auto">
                  {featuredArticle ? 'Read Article' : 'View Journal'}
                  <ArrowRight size={18} weight="bold" />
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Events Card */}
          <Reveal direction="up" delay={0.1}>
            <Link href="/events" className="group block h-full">
              <div className="bg-ink rounded-2xl p-8 md:p-10 hover:bg-ink/95 transition-all duration-300 hover:shadow-xl w-full md:w-[420px] h-[320px] flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-accent-start mb-4">
                  Upcoming Event
                </span>
                
                {isLoading ? (
                  <div className="animate-pulse flex-1">
                    <div className="h-8 bg-white/10 rounded w-3/4 mb-4" />
                    <div className="h-4 bg-white/10 rounded w-full mb-2" />
                    <div className="h-4 bg-white/10 rounded w-2/3" />
                  </div>
                ) : nextEvent ? (
                  <>
                    <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 leading-tight group-hover:text-accent-start transition-colors duration-300">
                      {nextEvent.title}
                    </h3>
                    
                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex items-center gap-2 text-white/70">
                        <CalendarBlank size={16} weight="bold" />
                        <span className="text-sm">{getShortDate(nextEvent.date).month} {getShortDate(nextEvent.date).day}</span>
                      </div>
                      {nextEvent.time && (
                        <div className="flex items-center gap-2 text-white/70">
                          <Clock size={16} weight="bold" />
                          <span className="text-sm">{nextEvent.time}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-white/70">
                        <MapPin size={16} weight="bold" />
                        <span className="text-sm">{nextEvent.location}</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 leading-tight">
                      Coming Soon
                    </h3>
                    <p className="text-white/60 text-lg mb-6 flex-1">
                      Stay tuned for upcoming events and pop-ups in Vienna.
                    </p>
                  </>
                )}
                
                <div className="flex items-center gap-2 text-accent-start font-medium group-hover:gap-3 transition-all duration-300 mt-auto">
                  {nextEvent ? 'View Details' : 'View Events'}
                  <ArrowRight size={18} weight="bold" />
                </div>
              </div>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

