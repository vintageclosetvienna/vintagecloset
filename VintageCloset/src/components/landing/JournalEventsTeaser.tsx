'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Reveal } from '@/components/shared/Reveal';
import { ArrowRight, Calendar, BookOpen } from '@phosphor-icons/react';
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

  const shortDate = nextEvent ? getShortDate(nextEvent.date) : null;

  // Don't render if both are empty and not loading
  if (!isLoading && !featuredArticle && !nextEvent) {
    return null;
  }

  return (
    <section className="py-24 lg:py-32 bg-surface">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto items-stretch">
          
          {/* Journal Card */}
          <Reveal className="group relative bg-white rounded-[2rem] p-8 md:p-10 shadow-sm hover:shadow-2xl transition-all duration-500 border border-hairline overflow-hidden hover:-translate-y-1 w-full max-w-xl h-full">
            <Link href={featuredArticle ? `/journal/${featuredArticle.slug}` : '/journal'} className="block h-full">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity transform group-hover:scale-110 duration-700">
                <BookOpen size={200} />
              </div>
              
              <div className="relative z-10 h-full flex flex-col items-start">
                <span className="inline-block mb-6 text-xs font-bold uppercase tracking-[0.15em] text-accent-start bg-accent-start/5 px-3 py-1 rounded-full">From the Journal</span>
                
                {isLoading ? (
                  <div className="space-y-4 flex-1 w-full">
                    <div className="h-8 bg-surface rounded w-3/4 animate-pulse" />
                    <div className="h-8 bg-surface rounded w-1/2 animate-pulse" />
                    <div className="h-5 bg-surface rounded w-full animate-pulse mt-4" />
                    <div className="h-5 bg-surface rounded w-2/3 animate-pulse" />
                  </div>
                ) : featuredArticle ? (
                  <>
                    <h3 className="text-3xl md:text-4xl font-display font-bold text-ink mb-4 leading-tight group-hover:text-accent-start transition-colors duration-300">
                      {featuredArticle.title}
                    </h3>
                    <p className="text-muted text-lg mb-10 flex-1 leading-relaxed max-w-sm">
                      {featuredArticle.excerpt}
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-3xl md:text-4xl font-display font-bold text-ink mb-4 leading-tight group-hover:text-accent-start transition-colors duration-300">
                      Stories Coming Soon
                    </h3>
                    <p className="text-muted text-lg mb-10 flex-1 leading-relaxed max-w-sm">
                      We&apos;re crafting stories about vintage culture, style guides, and more. Stay tuned.
                    </p>
                  </>
                )}
                
                <div className="mt-auto">
                  <Button variant="text" className="pl-0 group-hover:pl-2 transition-all text-base font-bold">
                    {featuredArticle ? 'Read Article' : 'Explore Journal'} <ArrowRight className="ml-2" weight="bold" />
                  </Button>
                </div>
              </div>
            </Link>
          </Reveal>

          {/* Event Card */}
          <Reveal delay={0.1} className="group relative bg-ink rounded-[2rem] p-8 md:p-10 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden text-white hover:-translate-y-1 w-full max-w-xl">
            <Link href="/events" className="block h-full">
              {nextEvent?.image && (
                <Image 
                  src={nextEvent.image}
                  alt="Event Background"
                  fill
                  className="object-cover opacity-20 group-hover:opacity-30 transition-opacity duration-700 scale-105 group-hover:scale-100"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent opacity-80" />
              
              <div className="relative z-10 h-full flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <span className="inline-block px-3 py-1 bg-accent-start rounded-full text-xs font-bold uppercase tracking-[0.15em] text-white shadow-lg">
                    {nextEvent ? (nextEvent.status === 'Coming Soon' ? 'Coming Soon' : 'Upcoming Event') : 'Events'}
                  </span>
                  <Calendar size={28} className="text-white/40" weight="duotone" />
                </div>
                
                {isLoading ? (
                  <div className="space-y-4 flex-1">
                    <div className="h-12 bg-white/10 rounded w-1/3 animate-pulse" />
                    <div className="h-6 bg-white/10 rounded w-2/3 animate-pulse" />
                    <div className="h-4 bg-white/10 rounded w-1/2 animate-pulse" />
                  </div>
                ) : nextEvent && shortDate ? (
                  <div className="mb-8">
                    <div className="text-5xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-br from-white to-white/50 mb-2 tracking-tighter">
                      {shortDate.day} <span className="text-lg align-top text-white/40 font-medium tracking-normal ml-1">{shortDate.month}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{nextEvent.title}</h3>
                    <p className="text-white/60 text-base flex items-center gap-2">
                      {nextEvent.location}
                    </p>
                  </div>
                ) : (
                  <div className="mb-8">
                    <h3 className="text-2xl font-bold mb-2">Events Coming Soon</h3>
                    <p className="text-white/60 text-base">
                      Pop-ups, markets, and community gatherings in Vienna. Check back for dates.
                    </p>
                  </div>
                )}
                
                <div className="mt-auto pt-6 border-t border-white/10">
                  <Button variant="primary" className="w-full bg-white text-ink hover:bg-gray-100 border-none h-11 text-base shadow-lg font-bold">
                    {nextEvent ? (nextEvent.status === 'Coming Soon' ? 'Get Notified' : 'RSVP Now') : 'View Events'}
                  </Button>
                </div>
              </div>
            </Link>
          </Reveal>

        </div>
      </div>
    </section>
  );
}
