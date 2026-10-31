'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CaretLeft,
  CaretRight,
  Clock,
  InstagramLogo,
  MapPin,
  MusicNotes,
  Spinner,
  SoundcloudLogo,
  VinylRecord,
  X,
} from '@phosphor-icons/react';
import { SafeImage } from '@/components/ui/SafeImage';
import { ShareStory } from '@/components/events/ShareStory';
import { getEvent, type Event } from '@/lib/events-data';
import { DAY_LABEL, isLiveWeekend, isOpenSlot, storyCardPath, weekendLabel, type LineupSlot } from '@/lib/popup';

/** One pop up weekend: line-up (open slots stay visible), gallery with lightbox, story cards to share. */
export default function EventWeekendPage() {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState<number | null>(null);

  useEffect(() => {
    getEvent(slug)
      .then(setEvent)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <Spinner size={32} className="animate-spin text-brand-teal" />
      </div>
    );
  }
  if (!event) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="font-display text-3xl font-bold">Event not found</h1>
        <Link href="/events" className="text-sm font-semibold text-brand-plum underline">
          All events
        </Link>
      </div>
    );
  }

  const live = isLiveWeekend(event.date, event.endDate);
  const days = (['Sat', 'Sun'] as const).map((day) => ({ day, slots: event.lineup.filter((s) => s.day === day) }));
  const openCount = event.lineup.filter(isOpenSlot).length;
  const photos = event.gallery;

  return (
    <div className="min-h-screen bg-surface">
      {/* Hero */}
      <section className="relative flex min-h-[62vh] items-end overflow-hidden">
        <SafeImage src={event.image || photos[0] || ''} alt={event.title} fill priority className="object-cover animate-[kenburns_24s_ease-in-out_infinite_alternate]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a0a19] via-[#2a0a19]/55 to-transparent" />
        <div className="container relative z-10 mx-auto px-4 pb-12 pt-32">
          <Link href="/events" className="mb-6 inline-flex items-center gap-2 text-sm text-white/80 hover:text-white">
            <ArrowLeft size={16} weight="bold" /> All events
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-teal-bright px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-plum">
              {event.series || /1070|bandgasse/i.test(event.location) ? 'Pop up · Bandgasse 43' : 'Shop · Spitalgasse 13'}
            </span>
            {live ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-plum">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Live this weekend
              </span>
            ) : event.status === 'Now Open' ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-plum">
                <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> Now open
              </span>
            ) : event.status === 'Past' ? (
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">Recap</span>
            ) : null}
          </div>
          <motion.h1
            initial={{ opacity: 0, y: 24, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            transition={{ type: 'spring', damping: 16 }}
            className="sticker-text mt-4 font-display text-5xl md:text-7xl"
          >
            {event.title}
          </motion.h1>
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-white/90">
            <span className="inline-flex items-center gap-2"><VinylRecord size={18} weight="bold" className="text-brand-teal" />{weekendLabel(event.date, event.endDate)}</span>
            {event.time ? <span className="inline-flex items-center gap-2"><Clock size={18} weight="bold" className="text-brand-teal" />{event.time}</span> : null}
            <span className="inline-flex items-center gap-2"><MapPin size={18} weight="bold" className="text-brand-teal" />{event.location}</span>
          </div>
        </div>
      </section>

      <div className="container mx-auto grid gap-12 px-4 py-12 md:py-16">
        {event.todayNote ? (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-2xl rounded-3xl border-2 border-dashed border-brand-teal bg-white p-6 text-center text-lg leading-relaxed"
          >
            {event.todayNote}
          </motion.p>
        ) : null}

        {/* Line-up */}
        <section>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-plum">Line up</p>
              <h2 className="font-display text-3xl font-bold md:text-4xl">Who plays</h2>
            </div>
            {openCount > 0 ? (
              <p className="text-sm text-muted">
                {openCount} slot{openCount === 1 ? '' : 's'} still open — want to play? DM{' '}
                <a href="https://www.instagram.com/vintage_closet_vienna/" target="_blank" rel="noreferrer" className="font-semibold text-brand-plum underline">
                  @vintage_closet_vienna
                </a>
              </p>
            ) : null}
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            {days.map(({ day, slots }) => (
              <div key={day}>
                <p className="mb-3 font-display text-lg font-bold">
                  {DAY_LABEL[day]} <span className="text-muted">· {weekendLabel(day === 'Sat' ? event.date : event.endDate || event.date)}</span>
                </p>
                <div className="grid gap-3">
                  {slots.map((slot, i) => (
                    <DjCard key={slot.id} slot={slot} index={i} slug={event.slug} />
                  ))}
                  {slots.length === 0 ? <p className="text-sm text-muted">Open decks all day.</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gallery */}
        <section>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-plum">Gallery</p>
          <h2 className="mb-6 font-display text-3xl font-bold md:text-4xl">{photos.length ? 'Moments' : 'Photos coming soon'}</h2>
          {photos.length ? (
            <div className="columns-2 gap-3 md:columns-3 [&>*]:mb-3">
              {photos.map((src, i) => (
                <motion.button
                  key={src}
                  type="button"
                  onClick={() => setPhoto(i)}
                  initial={{ opacity: 0, y: 20, rotate: i % 2 ? 1.5 : -1.5 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ rotate: 0, scale: 1.02 }}
                  viewport={{ once: true, margin: '-40px' }}
                  className="block w-full overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={`${event.title} photo ${i + 1}`} loading="lazy" className="w-full" />
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-hairline bg-white p-10 text-center text-muted">
              Come by, dance, dig through the racks — the photos land here after the weekend.
            </div>
          )}
        </section>

        {/* Share */}
        <section className="rounded-3xl bg-brand-plum p-6 text-white md:p-10">
          <div className="grid items-center gap-8 md:grid-cols-[1fr_220px]">
            <div>
              <h2 className="sticker-text font-display text-3xl md:text-4xl">Bring your friends</h2>
              <p className="mt-3 max-w-md text-white/80">Share the story card straight to Instagram or WhatsApp — it carries the date, the line up and the address.</p>
              <div className="mt-6">
                <ShareStory
                  cardPath={storyCardPath(event.slug)}
                  pagePath={`/events/${event.slug}`}
                  text={`${event.title} at Vintage Closet, ${weekendLabel(event.date, event.endDate)} 🎶`}
                  fileName={event.slug}
                />
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={storyCardPath(event.slug)} alt="Story card preview" className="mx-auto w-44 rotate-3 rounded-2xl border-4 border-white shadow-2xl md:w-full" loading="lazy" />
          </div>
        </section>

        {event.journalSlug ? (
          <Link href={`/journal/${event.journalSlug}`} className="mx-auto text-sm font-semibold text-brand-plum underline">
            Read about the pop up in the Journal →
          </Link>
        ) : null}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {photo !== null && photos[photo] ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
            onClick={() => setPhoto(null)}
          >
            <motion.img
              key={photos[photo]}
              src={photos[photo]}
              alt=""
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-h-[85vh] max-w-full rounded-xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button type="button" aria-label="Close" className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white" onClick={() => setPhoto(null)}>
              <X size={20} />
            </button>
            {photos.length > 1 ? (
              <>
                <button type="button" aria-label="Previous photo" className="absolute left-3 rounded-full bg-white/10 p-3 text-white" onClick={(e) => { e.stopPropagation(); setPhoto((photo - 1 + photos.length) % photos.length); }}>
                  <CaretLeft size={22} />
                </button>
                <button type="button" aria-label="Next photo" className="absolute right-3 rounded-full bg-white/10 p-3 text-white" onClick={(e) => { e.stopPropagation(); setPhoto((photo + 1) % photos.length); }}>
                  <CaretRight size={22} />
                </button>
              </>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function DjCard({ slot, index, slug }: { slot: LineupSlot; index: number; slug: string }) {
  if (isOpenSlot(slot)) {
    return (
      <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-brand-teal/60 bg-white/60 p-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-brand-teal text-brand-teal">
          <VinylRecord size={28} className="animate-[spin_6s_linear_infinite]" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal">{slot.time}</p>
          <p className="font-display text-lg font-bold">Open slot</p>
          <p className="text-sm text-muted">Secret guest or open decks</p>
        </div>
      </div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08 }}
      className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-hairline"
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-brand-teal/20 ring-4 ring-brand-teal">
        {slot.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slot.photo} alt={slot.name} className="h-full w-full object-cover" />
        ) : (
          <MusicNotes size={28} className="absolute inset-0 m-auto text-brand-plum" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider text-brand-plum">{slot.time}</p>
        <p className="truncate font-display text-lg font-bold">{slot.name}</p>
        {slot.genre ? <p className="truncate text-sm text-muted">{slot.genre}</p> : null}
        <div className="mt-1 flex gap-3">
          {slot.instagram ? (
            <a href={`https://www.instagram.com/${slot.instagram}/`} target="_blank" rel="noreferrer" aria-label={`${slot.name} on Instagram`} className="text-muted hover:text-brand-plum">
              <InstagramLogo size={18} weight="bold" />
            </a>
          ) : null}
          {slot.soundcloud?.startsWith('https://') ? (
            <a href={slot.soundcloud} target="_blank" rel="noreferrer" aria-label={`${slot.name} on SoundCloud`} className="text-muted hover:text-brand-plum">
              <SoundcloudLogo size={18} weight="bold" />
            </a>
          ) : null}
        </div>
      </div>
      <a href={storyCardPath(slug, slot.id)} target="_blank" rel="noreferrer" className="shrink-0 rounded-full border border-hairline px-3 py-1.5 text-xs font-semibold hover:border-brand-plum hover:text-brand-plum">
        Card
      </a>
    </motion.div>
  );
}
