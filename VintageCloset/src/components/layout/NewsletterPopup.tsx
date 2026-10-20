'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CircleNotch, EnvelopeSimple } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { getMediaCarouselImages } from '@/lib/site-images';

// Pop-up timing; how to change it: SETTINGS-GUIDE.md → Newsletter
const SHOW_AFTER_MS = 8000;
const HIDE_DAYS_AFTER_CLOSE = 30;
const STORAGE_KEY = 'vc-newsletter';
const HIDDEN_ON = ['/checkout', '/admin', '/newsletter'];

const GENDERS = [
  { id: 'women', label: 'Women' },
  { id: 'men', label: 'Men' },
  { id: 'unisex', label: 'Unisex' },
] as const;

type Gender = (typeof GENDERS)[number]['id'];

const CONSENT_LABEL =
  'I agree to receive the Vintage Closet newsletter (new drops, early access, events) by email. I can unsubscribe at any time with the link in every email.';

function readState(): string | null {
  try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
}

function writeState(value: string) {
  try { localStorage.setItem(STORAGE_KEY, value); } catch { /* storage blocked */ }
}

// Hidden while recently closed or after signing up
function isSuppressed(): boolean {
  const state = readState();
  if (!state) return false;
  if (state === 'subscribed') return true;
  const closedAt = Number(state.replace('closed:', ''));
  return Number.isFinite(closedAt) && Date.now() - closedAt < HIDE_DAYS_AFTER_CLOSE * 86_400_000;
}

export function NewsletterPopup() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [percent, setPercent] = useState(20);
  const [image, setImage] = useState<string | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const hiddenHere = HIDDEN_ON.some(path => pathname.startsWith(path));

  // Show after a short delay (or when the mouse leaves towards the tabs), only if email is set up
  useEffect(() => {
    if (hiddenHere || isSuppressed()) return;
    let cancelled = false;
    let timer: number | undefined;

    const show = () => {
      if (!cancelled && !isSuppressed()) setOpen(true);
    };
    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget && e.clientY <= 0) show();
    };

    fetch('/api/newsletter/status')
      .then(res => res.json())
      .then((status: { enabled: boolean; percent: number }) => {
        if (cancelled || !status.enabled) return;
        setPercent(status.percent);
        getMediaCarouselImages().then(images => !cancelled && setImage(images[0]?.url ?? null)).catch(() => {});
        timer = window.setTimeout(show, SHOW_AFTER_MS);
        document.addEventListener('mouseout', onMouseOut);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      document.removeEventListener('mouseout', onMouseOut);
    };
  }, [hiddenHere]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setOpen(false);
      if (readState() !== 'subscribed') writeState(`closed:${Date.now()}`);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  function close() {
    setOpen(false);
    if (readState() !== 'subscribed') writeState(`closed:${Date.now()}`);
  }

  function chooseGender(next: Gender) {
    setGender(next);
    setError(null);
    window.setTimeout(() => emailRef.current?.focus(), 250);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!gender) return;
    setState('sending');
    setError(null);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, gender, consent, company }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setState('sent');
      writeState('subscribed');
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  return (
    <AnimatePresence>
      {open && !hiddenHere && (
        <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-3 sm:p-6" data-lenis-prevent>
          <motion.div
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="newsletter-title"
            initial={{ opacity: 0, y: 30, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 260 }}
            className="relative w-full max-w-[780px] overflow-hidden rounded-[28px] border border-white/60 bg-gradient-to-br from-white/80 via-white/70 to-brand-teal/30 shadow-[0_30px_80px_rgba(12,17,20,0.25)] backdrop-blur-2xl sm:grid sm:grid-cols-[1.25fr_1fr]"
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="absolute right-4 top-4 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 bg-white/60 text-ink/70 backdrop-blur hover:text-ink"
            >
              <X size={16} />
            </button>

            <div className="relative z-10 p-6 sm:p-9">
              {state === 'sent' ? (
                <div className="py-6">
                  <EnvelopeSimple size={36} className="mb-4 text-brand-teal" weight="duotone" />
                  <h2 id="newsletter-title" className="text-2xl font-medium tracking-tight text-ink">Check your inbox</h2>
                  <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
                    We sent you a confirmation link. Confirm your email and your personal {percent}% code arrives right away.
                  </p>
                  <button type="button" onClick={close} className="mt-6 text-sm text-ink underline underline-offset-4">Continue shopping</button>
                </div>
              ) : (
                <>
                  <h2 id="newsletter-title" className="flex items-center gap-2.5 text-2xl sm:text-[28px] font-medium tracking-tight text-ink">
                    <span className="h-2.5 w-2.5 rounded-full bg-brand-teal shadow-[0_0_10px_rgba(76,194,186,0.9)]" />
                    {percent}% off your first order
                  </h2>

                  <ul className="mt-5 flex flex-wrap gap-2">
                    {['New drops first', 'Early access', 'Events & stories'].map(tag => (
                      <li key={tag} className="flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1.5 text-xs text-ink/80">
                        <span className="h-1 w-1 rounded-full bg-ink/50" />
                        {tag}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-7 text-[17px] text-ink">Which collection interests you most?</p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {GENDERS.map(g => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => chooseGender(g.id)}
                        aria-pressed={gender === g.id}
                        className={cn(
                          'rounded-full border py-3 text-sm transition-colors',
                          gender === g.id
                            ? 'border-accent-end bg-accent-end text-white'
                            : 'border-ink/15 bg-white/50 text-ink hover:bg-white/80'
                        )}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence initial={false}>
                    {gender && (
                      <motion.form
                        onSubmit={submit}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 space-y-3">
                          <div className="flex gap-2">
                            <input
                              ref={emailRef}
                              type="email"
                              required
                              autoComplete="email"
                              placeholder="Your email"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              className="min-w-0 flex-1 rounded-full border border-ink/15 bg-white/80 px-4 py-3 text-sm text-ink placeholder:text-muted/70 focus:border-accent-start focus:outline-none"
                            />
                            <button
                              type="submit"
                              disabled={state === 'sending' || !consent}
                              className="flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-medium text-white transition-opacity disabled:opacity-40"
                            >
                              {state === 'sending' && <CircleNotch size={14} className="animate-spin" />}
                              Get {percent}%
                            </button>
                          </div>
                          {/* Bots fill this in, people never see it */}
                          <input
                            type="text"
                            tabIndex={-1}
                            autoComplete="off"
                            value={company}
                            onChange={e => setCompany(e.target.value)}
                            className="hidden"
                            aria-hidden="true"
                          />
                          <label className="flex items-start gap-2.5 text-[11px] leading-relaxed text-muted">
                            <input
                              type="checkbox"
                              checked={consent}
                              onChange={e => setConsent(e.target.checked)}
                              className="mt-0.5 h-4 w-4 shrink-0 accent-[#1B7177]"
                            />
                            <span>
                              {CONSENT_LABEL} See our{' '}
                              <Link href="/terms" className="underline underline-offset-2" onClick={close}>terms &amp; privacy</Link>.
                            </span>
                          </label>
                          {error && <p className="text-xs text-red-600">{error}</p>}
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  <p className="mt-6 text-[10px] uppercase tracking-[0.18em] text-muted">© Vintage Closet Vienna</p>
                </>
              )}
            </div>

            {/* Photo side with the sticker logo */}
            <div className="relative hidden min-h-[360px] sm:block">
              {image ? (
                <Image src={image} alt="" fill sizes="320px" className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-brand-plum" />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-transparent to-transparent" />
              <Image
                src="/brand/vintage-closet-logo.png"
                alt=""
                width={96}
                height={87}
                className="absolute bottom-5 right-5 h-auto w-20 drop-shadow-lg"
              />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
