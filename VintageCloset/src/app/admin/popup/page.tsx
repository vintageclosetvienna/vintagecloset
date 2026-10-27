'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowSquareOut,
  Camera,
  Check,
  Copy,
  Eye,
  EyeSlash,
  Images,
  MusicNotes,
  NotePencil,
  Plus,
  ShareNetwork,
  Sparkle,
  Spinner,
  Star,
  Trash,
  WhatsappLogo,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { ShareStory } from '@/components/events/ShareStory';
import { authFetch } from '@/lib/auth-fetch';
import { getAllEvents, type Event } from '@/lib/events-data';
import { supabase } from '@/lib/supabase';
import {
  DAY_LABEL,
  POPUP_SERIES,
  isLiveWeekend,
  isOpenSlot,
  storyCardPath,
  viennaToday,
  weekendLabel,
  type LineupSlot,
} from '@/lib/popup';

type StepId = 'lineup' | 'info' | 'photos' | 'journal' | 'share';

const STEPS: { id: StepId; label: string; hint: string; icon: typeof MusicNotes }[] = [
  { id: 'lineup', label: 'Line up', hint: 'DJs + invite links', icon: MusicNotes },
  { id: 'info', label: 'Today', hint: 'Times + a note', icon: NotePencil },
  { id: 'photos', label: 'Photos', hint: 'Gallery + cover', icon: Camera },
  { id: 'journal', label: 'Journal', hint: 'AI draft article', icon: Sparkle },
  { id: 'share', label: 'Share', hint: 'Story cards', icon: ShareNetwork },
];

/**
 * Pop up control room: one weekend at a time, five steps in a row. Line-up,
 * today's info, photos, a generated journal draft and the story cards to share.
 */
export default function PopupAdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [step, setStep] = useState<StepId>('lineup');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  const apply = useCallback((list: Event[]) => {
    const all = list.filter((e) => e.series === POPUP_SERIES).sort((a, b) => a.date.localeCompare(b.date));
    setEvents(all);
    setSelectedId((current) => {
      if (current && all.some((e) => e.id === current)) return current;
      const today = viennaToday();
      return (all.find((e) => (e.endDate || e.date) >= today) ?? all[all.length - 1])?.id ?? null;
    });
    setLoading(false);
  }, []);

  const reload = useCallback(async () => apply(await getAllEvents()), [apply]);

  useEffect(() => {
    let active = true;
    getAllEvents().then((list) => {
      if (active) apply(list);
    });
    return () => {
      active = false;
    };
  }, [apply]);

  const event = events.find((e) => e.id === selectedId) ?? null;

  /** Saves fields straight to the events row (team RLS), then refreshes. */
  const save = useCallback(
    async (patch: Record<string, unknown>, message = 'Saved') => {
      if (!event) return false;
      const { error } = await supabase.from('events').update(patch as never).eq('id', event.id);
      if (error) {
        notify(`Could not save: ${error.message}`);
        return false;
      }
      await reload();
      notify(message);
      return true;
    },
    [event, notify, reload],
  );

  const done: Record<StepId, boolean> = useMemo(
    () => ({
      lineup: !!event && event.lineup.some((s) => !isOpenSlot(s)),
      info: !!event && event.todayNote.trim().length > 0,
      photos: !!event && event.gallery.length > 0,
      journal: false,
      share: false,
    }),
    [event],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size={28} className="animate-spin text-brand-teal" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <header className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-plum">Pop up · Bandgasse 43</p>
        <h1 className="sticker-text font-display text-4xl md:text-5xl">Music pop up</h1>
        <p className="mt-2 text-sm text-muted">Pick the weekend, then go left to right. Everything saves right away.</p>
      </header>

      {/* Weekends */}
      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-2">
        {events.map((e, i) => {
          const live = isLiveWeekend(e.date, e.endDate);
          const active = e.id === selectedId;
          const filled = e.lineup.filter((s) => !isOpenSlot(s)).length;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => setSelectedId(e.id)}
              className={`shrink-0 rounded-2xl border-2 px-4 py-3 text-left transition-all ${
                active ? 'border-brand-plum bg-brand-plum text-white shadow-lg' : 'border-hairline bg-white hover:border-brand-teal'
              } ${e.status === 'Past' && !active ? 'opacity-60' : ''}`}
            >
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider">
                {live ? <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" /> : null}
                Weekend {i + 1}
              </p>
              <p className="whitespace-nowrap text-sm font-semibold">{weekendLabel(e.date, e.endDate)}</p>
              <p className={`text-[11px] ${active ? 'text-white/70' : 'text-muted'}`}>
                {filled}/{e.lineup.length} DJs · {e.gallery.length} photos
              </p>
            </button>
          );
        })}
      </div>

      {event ? (
        <>
          {/* Pipeline */}
          <div className="mb-6 grid grid-cols-5 gap-1.5 md:gap-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const active = s.id === step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(s.id)}
                  className={`relative flex flex-col items-center gap-1 rounded-2xl border-2 p-2 text-center transition-all md:p-4 ${
                    active ? 'border-brand-teal bg-brand-teal/10' : 'border-hairline bg-white hover:border-brand-teal/60'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full md:h-11 md:w-11 ${
                      done[s.id] ? 'bg-brand-teal text-white' : active ? 'bg-brand-plum text-white' : 'bg-surface text-ink'
                    }`}
                  >
                    {done[s.id] ? <Check weight="bold" size={18} /> : <Icon weight="bold" size={18} />}
                  </span>
                  <span className="text-[11px] font-bold md:text-sm">{i + 1}. {s.label}</span>
                  <span className="hidden text-[11px] text-muted md:block">{s.hint}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            <motion.section
              key={`${event.id}-${step}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-3xl border border-hairline bg-white p-4 shadow-sm md:p-6"
            >
              {step === 'lineup' ? <LineupStep event={event} save={save} notify={notify} /> : null}
              {step === 'info' ? <InfoStep event={event} save={save} /> : null}
              {step === 'photos' ? <PhotosStep event={event} save={save} notify={notify} /> : null}
              {step === 'journal' ? <JournalStep event={event} notify={notify} /> : null}
              {step === 'share' ? <ShareStep event={event} /> : null}

              <div className="mt-6 flex items-center justify-between border-t border-hairline pt-4">
                <Link href={`/events/${event.slug}`} target="_blank" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-plum">
                  <ArrowSquareOut size={16} weight="bold" /> Open public page
                </Link>
                {step !== 'share' ? (
                  <Button size="sm" onClick={() => setStep(STEPS[STEPS.findIndex((s) => s.id === step) + 1].id)}>
                    Next step →
                  </Button>
                ) : null}
              </div>
            </motion.section>
          </AnimatePresence>
        </>
      ) : (
        <p className="text-muted">No pop up weekends found.</p>
      )}

      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-xl"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

type SaveFn = (patch: Record<string, unknown>, message?: string) => Promise<boolean>;

function LineupStep({ event, save, notify }: { event: Event; save: SaveFn; notify: (t: string) => void }) {
  const [slots, setSlots] = useState<LineupSlot[]>(event.lineup);
  const [inviting, setInviting] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, string>>({});
  const dirty = JSON.stringify(slots) !== JSON.stringify(event.lineup);

  const update = (id: string, patch: Partial<LineupSlot>) =>
    setSlots((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const addSlot = (day: LineupSlot['day']) =>
    setSlots((list) => [...list, { id: `s${Date.now().toString(36)}`, day, time: '' }]);

  const persist = async () => {
    const clean = slots.map((s) => Object.fromEntries(Object.entries(s).filter(([, v]) => v !== undefined && v !== '')));
    await save({ lineup: clean }, 'Line up saved');
  };

  const invite = async (slot: LineupSlot) => {
    if (dirty) await persist();
    setInviting(slot.id);
    try {
      const response = await authFetch('/api/popup/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, slotId: slot.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');
      setLinks((all) => ({ ...all, [slot.id]: data.url }));
      await navigator.clipboard.writeText(data.url).catch(() => undefined);
      notify('DJ link copied');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not create the link');
    } finally {
      setInviting(null);
    }
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Who plays?</h2>
      <p className="mb-4 text-sm text-muted">Type today&apos;s DJ name, or send the DJ their own link so they fill in photo, Instagram and genre themselves. Empty = shows as open slot.</p>
      <div className="grid gap-6 md:grid-cols-2">
        {(['Sat', 'Sun'] as const).map((day) => (
          <div key={day} className="rounded-2xl bg-surface p-3">
            <p className="mb-2 font-display font-bold">{DAY_LABEL[day]} · {weekendLabel(day === 'Sat' ? event.date : event.endDate || event.date)}</p>
            <div className="grid gap-2">
              {slots.filter((s) => s.day === day).map((slot) => (
                <div key={slot.id} className={`rounded-xl border-2 bg-white p-3 ${isOpenSlot(slot) ? 'border-dashed border-brand-teal/50' : 'border-transparent'}`}>
                  <div className="flex gap-2">
                    <input
                      value={slot.time}
                      onChange={(e) => update(slot.id, { time: e.target.value })}
                      placeholder="15:00 – 18:00"
                      className="w-28 rounded-lg border border-hairline px-2 py-2 text-xs"
                    />
                    <input
                      value={slot.name ?? ''}
                      onChange={(e) => update(slot.id, { name: e.target.value })}
                      placeholder="DJ name (empty = open)"
                      className="min-w-0 flex-1 rounded-lg border border-hairline px-2 py-2 text-sm font-semibold"
                    />
                    <button type="button" aria-label="Remove slot" onClick={() => setSlots((list) => list.filter((s) => s.id !== slot.id))} className="px-1 text-muted hover:text-red-500">
                      <Trash size={16} />
                    </button>
                  </div>
                  {!isOpenSlot(slot) ? (
                    <div className="mt-2 flex gap-2">
                      <input value={slot.instagram ?? ''} onChange={(e) => update(slot.id, { instagram: e.target.value })} placeholder="@instagram" className="min-w-0 flex-1 rounded-lg border border-hairline px-2 py-1.5 text-xs" />
                      <input value={slot.genre ?? ''} onChange={(e) => update(slot.id, { genre: e.target.value })} placeholder="Genre" className="min-w-0 flex-1 rounded-lg border border-hairline px-2 py-1.5 text-xs" />
                    </div>
                  ) : null}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => invite(slot)}
                      disabled={inviting === slot.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-brand-teal px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60"
                    >
                      {inviting === slot.id ? <Spinner size={12} className="animate-spin" /> : <Copy size={12} weight="bold" />}
                      DJ link
                    </button>
                    {links[slot.id] ? (
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Hey! You play at the Vintage Closet pop up (${DAY_LABEL[slot.day]} ${slot.time}). Add your name, photo and Instagram here and get your story card: ${links[slot.id]}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        <WhatsappLogo size={12} weight="bold" /> Send to DJ
                      </a>
                    ) : null}
                    {slot.photo ? <span className="text-[11px] text-brand-teal">photo ✓</span> : null}
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => addSlot(day)} className="inline-flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-hairline py-2 text-xs font-semibold text-muted hover:border-brand-teal hover:text-brand-teal">
                <Plus size={14} weight="bold" /> Add slot
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex justify-end">
        <Button onClick={persist} disabled={!dirty}>{dirty ? 'Save line up' : 'Saved'}</Button>
      </div>
    </div>
  );
}

function InfoStep({ event, save }: { event: Event; save: SaveFn }) {
  const [time, setTime] = useState(event.time);
  const [note, setNote] = useState(event.todayNote);
  const [busy, setBusy] = useState(false);

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold">Today&apos;s info</h2>
        <p className="text-sm text-muted">The note shows on the event page and feeds the journal article (drinks, special guest, a new rail, the weather…).</p>
      </div>
      <label className="grid gap-1 text-sm font-semibold">
        Opening hours
        <input value={time} onChange={(e) => setTime(e.target.value)} className="rounded-xl border border-hairline px-3 py-2.5 font-normal" />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Note for today
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={600} placeholder="e.g. Free mulled wine from 18:00, new 90s denim rail, open decks after 20:00" className="rounded-xl border border-hairline px-3 py-2.5 font-normal" />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => save({ is_published: !event.isPublished }, event.isPublished ? 'Hidden from the site' : 'Visible on the site')}
          className="inline-flex items-center gap-2 rounded-full border border-hairline px-4 py-2 text-sm font-semibold"
        >
          {event.isPublished ? <Eye size={16} /> : <EyeSlash size={16} />}
          {event.isPublished ? 'Visible on site' : 'Hidden'}
        </button>
        <Button
          isLoading={busy}
          onClick={async () => {
            setBusy(true);
            await save({ time, today_note: note.trim() || null }, 'Info saved');
            setBusy(false);
          }}
        >
          Save info
        </Button>
      </div>
    </div>
  );
}

function PhotosStep({ event, save, notify }: { event: Event; save: SaveFn; notify: (t: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const urls: string[] = [];
    setUploading(files.length);
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${event.id}/gallery-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error } = await supabase.storage.from('event-images').upload(path, file, { cacheControl: '3600' });
      if (error) {
        notify(`Upload failed: ${error.message}`);
        continue;
      }
      urls.push(supabase.storage.from('event-images').getPublicUrl(path).data.publicUrl);
      setUploading((n) => n - 1);
    }
    setUploading(0);
    if (urls.length) await save({ gallery: [...event.gallery, ...urls] }, `${urls.length} photo${urls.length === 1 ? '' : 's'} added`);
  };

  return (
    <div>
      <h2 className="font-display text-2xl font-bold">Photos</h2>
      <p className="mb-4 text-sm text-muted">Add photos from today. The star makes one the cover of the event and the article. Removing only takes it off the gallery; the file stays saved.</p>
      <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { void upload(e.target.files); e.target.value = ''; }} />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={uploading > 0}
        className="mb-4 flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-brand-teal bg-brand-teal/5 py-8 text-brand-plum"
      >
        {uploading > 0 ? <Spinner size={28} className="animate-spin" /> : <Images size={28} weight="duotone" />}
        <span className="text-sm font-bold">{uploading > 0 ? `Uploading ${uploading}…` : 'Add photos'}</span>
      </button>
      <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
        {event.gallery.map((src) => (
          <div key={src} className={`group relative aspect-square overflow-hidden rounded-xl ring-4 ${src === event.image ? 'ring-brand-teal' : 'ring-transparent'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 p-1.5">
              <button type="button" aria-label="Make cover" onClick={() => save({ image: src }, 'Cover set')} className="rounded-full bg-white/90 p-1.5 text-brand-plum">
                <Star size={14} weight={src === event.image ? 'fill' : 'bold'} />
              </button>
              <button type="button" aria-label="Remove from gallery" onClick={() => save({ gallery: event.gallery.filter((g) => g !== src) }, 'Removed from gallery')} className="rounded-full bg-white/90 p-1.5 text-red-500">
                <Trash size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function JournalStep({ event, notify }: { event: Event; notify: (t: string) => void }) {
  const today = viennaToday();
  const [day, setDay] = useState<LineupSlot['day']>(event.endDate && today === event.endDate ? 'Sun' : 'Sat');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ title: string; slug: string } | null>(null);

  const write = async () => {
    setBusy(true);
    try {
      const response = await authFetch('/api/popup/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event.id, day }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed');
      setResult({ title: data.title, slug: data.slug });
      notify('Draft article ready');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Could not write the article');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4">
      <div>
        <h2 className="font-display text-2xl font-bold">Journal article</h2>
        <p className="text-sm text-muted">The AI writes a short vintage-zine recap from the line up, your note and the photos. It is saved as a <b>draft</b>: check it in Journal, then publish.</p>
      </div>
      <div className="flex gap-2">
        {(['Sat', 'Sun'] as const).map((d) => (
          <button key={d} type="button" onClick={() => setDay(d)} className={`rounded-full px-4 py-2 text-sm font-semibold ${day === d ? 'bg-brand-plum text-white' : 'border border-hairline'}`}>
            {DAY_LABEL[d]}
          </button>
        ))}
      </div>
      <Button size="lg" isLoading={busy} onClick={write} className="w-full md:w-auto">
        <Sparkle size={18} weight="fill" className="mr-2" /> Write today&apos;s article
      </Button>
      {result ? (
        <div className="rounded-2xl border-2 border-brand-teal bg-brand-teal/5 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-teal">Draft saved</p>
          <p className="font-display text-lg font-bold">{result.title}</p>
          <Link href="/admin/journal" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-plum">
            <ArrowSquareOut size={14} weight="bold" /> Open in Journal to check and publish
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function ShareStep({ event }: { event: Event }) {
  const booked = event.lineup.filter((s) => !isOpenSlot(s));
  return (
    <div className="grid gap-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Share</h2>
        <p className="text-sm text-muted">On your phone, &quot;Share story card&quot; opens the share sheet with the picture, so it goes straight into an Instagram or WhatsApp story.</p>
      </div>
      <div className="grid items-center gap-4 rounded-2xl bg-surface p-4 md:grid-cols-[140px_1fr]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={storyCardPath(event.slug)} alt="Weekend story card" className="w-28 rounded-xl shadow-lg md:w-full" />
        <div>
          <p className="mb-2 font-display font-bold">Weekend card</p>
          <ShareStory cardPath={storyCardPath(event.slug)} pagePath={`/events/${event.slug}`} text={`${event.title} at Vintage Closet 🎶`} fileName={event.slug} compact />
        </div>
      </div>
      {booked.map((slot) => (
        <div key={slot.id} className="grid items-center gap-4 rounded-2xl bg-surface p-4 md:grid-cols-[140px_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={storyCardPath(event.slug, slot.id)} alt={`${slot.name} story card`} className="w-28 rounded-xl shadow-lg md:w-full" loading="lazy" />
          <div>
            <p className="mb-2 font-display font-bold">{slot.name} · {DAY_LABEL[slot.day]} {slot.time}</p>
            <ShareStory cardPath={storyCardPath(event.slug, slot.id)} pagePath={`/events/${event.slug}`} text={`${slot.name} plays at Vintage Closet 🎶`} fileName={`${event.slug}-${slot.id}`} compact />
          </div>
        </div>
      ))}
      {booked.length === 0 ? <p className="text-sm text-muted">Add DJ names in step 1 to get a card for each DJ.</p> : null}
    </div>
  );
}
