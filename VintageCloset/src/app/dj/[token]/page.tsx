'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Check, MusicNotes, Spinner, X } from '@phosphor-icons/react';
import { ShareStory } from '@/components/events/ShareStory';
import Link from 'next/link';
import { DAY_LABEL, postcardPath, storyCardPath, weekendLabel, type LineupSlot } from '@/lib/popup';

type Invite = {
  event: { slug: string; title: string; date: string; endDate: string | null; time: string | null; location: string; image: string | null };
  slot: LineupSlot;
};

/** A DJ's own link: fill in name, photo and links, then share the personal story card with fans. */
export default function DjInvitePage() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [cardVersion, setCardVersion] = useState(0);
  // The card pops up every time this link opens, until the DJ has shared it once (or the link expires)
  const [popup, setPopup] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const sharedKey = `vc.dj.shared.${token}`;
  const markShared = () => {
    try {
      window.localStorage.setItem(sharedKey, '1');
    } catch {
      /* private mode */
    }
  };
  const form = useRef<HTMLFormElement>(null);

  useEffect(() => {
    fetch(`/api/popup/dj/${token}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'This link is not valid.');
        setInvite(data);
        setSaved(!!data.slot.name);
        let shared = false;
        try {
          shared = window.localStorage.getItem(sharedKey) === '1';
        } catch {
          /* private mode */
        }
        if (data.slot.name && !shared) window.setTimeout(() => setPopup(true), 500);
      })
      .catch((e: Error) => setError(e.message));
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.current) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/popup/dj/${token}`, { method: 'POST', body: new FormData(form.current) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save.');
      setInvite((current) => (current ? { ...current, slot: data.slot } : current));
      setSaved(true);
      setCardVersion((v) => v + 1);
      setFlipped(false);
      setPopup(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save.');
    } finally {
      setSaving(false);
    }
  };

  if (!invite) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 text-center">
        {error ? <p className="text-lg font-semibold">{error}</p> : <Spinner size={32} className="animate-spin text-brand-teal" />}
      </div>
    );
  }

  const { event, slot } = invite;
  const dayDate = slot.day === 'Sun' ? event.endDate || event.date : event.date;
  const card = `${storyCardPath(event.slug, slot.id)}&v=${cardVersion}`;
  const postcard = `${postcardPath(event.slug, slot.id)}&v=${cardVersion}`;

  return (
    <div className="min-h-screen bg-surface pb-16">
      <section className="bg-brand-plum px-4 pb-10 pt-28 text-white">
        <div className="mx-auto max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-teal-bright">You&apos;re on the line up</p>
          <motion.h1 initial={{ rotate: -4, scale: 0.9 }} animate={{ rotate: -2, scale: 1 }} className="sticker-text mt-2 font-display text-5xl">
            {event.title}
          </motion.h1>
          <p className="mt-3 text-white/85">
            {DAY_LABEL[slot.day]} · {weekendLabel(dayDate)} · {slot.time}
            <br />
            {event.location}
          </p>
        </div>
      </section>

      <div className="mx-auto grid max-w-xl gap-8 px-4 pt-8">
        <form ref={form} onSubmit={submit} className="grid gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-hairline">
          <h2 className="font-display text-2xl font-bold">Your artist info</h2>
          <label className="mx-auto flex cursor-pointer flex-col items-center gap-2">
            <span className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-brand-teal/15 ring-4 ring-brand-teal">
              {preview || slot.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview || slot.photo} alt="" className="h-full w-full object-cover" />
              ) : (
                <MusicNotes size={36} className="text-brand-plum" />
              )}
              <span className="absolute bottom-1 right-1 rounded-full bg-brand-plum p-1.5 text-white"><Camera size={14} weight="bold" /></span>
            </span>
            <span className="text-xs font-semibold text-muted">Your photo (goes on your story card)</span>
            <input
              name="photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                setPreview(file ? URL.createObjectURL(file) : null);
              }}
            />
          </label>
          <Field name="name" label="DJ name" defaultValue={slot.name} required />
          <Field name="genre" label="Sound / genre" defaultValue={slot.genre} placeholder="e.g. 90s house, disco edits" />
          <Field name="instagram" label="Instagram" defaultValue={slot.instagram ? `@${slot.instagram}` : ''} placeholder="@yourname" />
          <Field name="soundcloud" label="SoundCloud or Mixcloud link" defaultValue={slot.soundcloud} placeholder="https://soundcloud.com/…" />
          <label className="grid gap-1 text-sm font-semibold">
            Short bio
            <textarea name="bio" defaultValue={slot.bio} maxLength={280} rows={3} className="rounded-xl border border-hairline px-3 py-2.5 font-normal" />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button type="submit" disabled={saving} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink font-bold text-white disabled:opacity-60">
            {saving ? <Spinner size={18} className="animate-spin" /> : saved ? <Check size={18} weight="bold" /> : null}
            {saving ? 'Saving…' : saved ? 'Saved — update again' : 'Save my info'}
          </button>
        </form>

        {saved ? (
          <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="grid gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-hairline">
            <h2 className="font-display text-2xl font-bold">Tell your fans</h2>
            <p className="text-sm text-muted">Your personal story card. On your phone, &quot;Share story card&quot; sends it straight into your Instagram or WhatsApp story.</p>
            <div className="grid grid-cols-2 items-end gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={card} alt="Your story card" className="w-full -rotate-2 rounded-2xl shadow-2xl" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={postcard} alt="Your vintage postcard" className="w-full rotate-2 rounded-xl shadow-2xl" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-plum">Story card</p>
            <ShareStory cardPath={card} pagePath={`/events/${event.slug}`} text={`I play at the Vintage Closet pop up, ${DAY_LABEL[slot.day]} ${slot.time} 🎶`} fileName={`${event.slug}-${slot.id}`} onShared={markShared} />
            <p className="mt-2 text-xs font-bold uppercase tracking-wider text-brand-plum">Your one-of-one postcard · vintage credentials</p>
            <ShareStory cardPath={postcard} pagePath={`/events/${event.slug}`} text={`My Vintage Closet credentials 📮 ${DAY_LABEL[slot.day]} ${slot.time}`} fileName={`${event.slug}-${slot.id}-postcard`} compact onShared={markShared} />
            <Link href="/new-arrivals" className="mt-2 flex items-center justify-between rounded-2xl bg-brand-teal-bright/20 p-4">
              <span>
                <span className="block font-display font-bold">Dress the part</span>
                <span className="text-sm text-muted">Dig through the new arrivals before your set.</span>
              </span>
              <span className="shrink-0 rounded-full bg-brand-plum px-4 py-2 text-sm font-bold text-white">New arrivals →</span>
            </Link>
          </motion.section>
        ) : null}
      </div>

      <AnimatePresence>
        {popup && saved ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ y: 40, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              transition={{ type: 'spring', damping: 18 }}
              className="relative w-full max-w-sm rounded-3xl bg-white p-5 text-center"
            >
              <button type="button" aria-label="Close" onClick={() => setPopup(false)} className="absolute right-3 top-3 rounded-full bg-surface p-2">
                <X size={16} />
              </button>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-plum">Your one-of-one card</p>
              <h2 className="font-display text-2xl font-bold">{flipped ? `${slot.name}, this one is yours` : 'Tap to reveal'}</h2>
              <button type="button" onClick={() => setFlipped(true)} className="mx-auto mt-4 block w-60 [perspective:1000px]">
                <motion.div animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.7 }} className="relative aspect-[4/5] [transform-style:preserve-3d]">
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-brand-plum [backface-visibility:hidden]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/brand/vintage-closet-logo.png" alt="" className="w-32 animate-pulse" />
                    <span className="mt-3 text-xs font-bold uppercase tracking-[0.25em] text-brand-teal-bright">Tap</span>
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={postcard} alt="Your card" className="absolute inset-0 h-full w-full rounded-2xl object-cover shadow-xl [backface-visibility:hidden] [transform:rotateY(180deg)]" />
                </motion.div>
              </button>
              {flipped ? (
                <div className="mt-4 grid gap-2 text-left">
                  <ShareStory cardPath={postcard} pagePath={`/events/${event.slug}`} text={`My Vintage Closet card 📮 ${DAY_LABEL[slot.day]} ${slot.time}`} fileName={`${event.slug}-${slot.id}-card`} compact onShared={markShared} />
                  <p className="text-xs text-muted">This keeps popping up until you share it once.</p>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Field({ name, label, defaultValue, placeholder, required }: { name: string; label: string; defaultValue?: string; placeholder?: string; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-semibold">
      {label}
      <input name={name} defaultValue={defaultValue} placeholder={placeholder} required={required} className="rounded-xl border border-hairline px-3 py-2.5 font-normal" />
    </label>
  );
}
