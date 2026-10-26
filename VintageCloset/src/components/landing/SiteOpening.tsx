'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { fadeOutVintageJingle, playVintageJingle } from '@/lib/vintage-sfx';
import { markOpeningDone, OPENING_SESSION_KEY, OPENING_SKIP_SCRIPT, shouldSkipOpening } from '@/lib/opening-store';

const TEAL = '#4CC2BA';
const TEAL_BRIGHT = '#01DBCA';
const PLUM = '#602140';

const SHOW_MS = 2550;
const OUTRO_MS = 800;
const EASE_IRIS = [0.7, 0, 0.2, 1] as const;

const noop = () => () => {};

function headerLogoOffset(): number {
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 64;
  return header / 2 - window.innerHeight * 0.45;
}

/**
 * Launch intro of the shop (home page, once per browser session): a record spins up, the Vintage Closet sticker
 * slaps onto it with a scratch, horn stabs pulse the sunburst, then an iris closes on the logo while it flies
 * into the header, and the photo deck deals in. Sound is synthesised (lib/vintage-sfx); browsers only allow it
 * after a tap, so a "sound on" button appears when it is blocked. Tap, scroll or Esc skips.
 */
export function SiteOpening() {
  // Decided on the client (inline script + same rule), so the server always renders the stage and nothing flashes
  const skip = useSyncExternalStore(noop, shouldSkipOpening, () => false);
  const [stage, setStage] = useState<'show' | 'outro' | 'gone'>('show');
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const started = useRef(0);
  const visible = !skip && stage !== 'gone';

  useEffect(() => {
    if (skip) markOpeningDone();
  }, [skip]);

  const finish = useCallback(() => {
    setStage(s => (s === 'show' ? 'outro' : s));
  }, []);

  // Timeline + try to start the sound (works when the browser already allows audio for this site)
  useEffect(() => {
    if (skip) return;
    started.current = performance.now();
    try {
      window.sessionStorage.setItem(OPENING_SESSION_KEY, '1');
    } catch {
      /* storage blocked: it may play again */
    }
    let cancelled = false;
    playVintageJingle().then(ok => {
      if (cancelled) return;
      if (ok) setSoundOn(true);
      else setSoundBlocked(true);
    });
    const t = window.setTimeout(finish, SHOW_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [skip, finish]);

  // Outro: logo flies to the header logo, iris closes, then the site is free
  useEffect(() => {
    if (stage !== 'outro') return;
    fadeOutVintageJingle(OUTRO_MS / 1000);
    const t = window.setTimeout(() => {
      setStage('gone');
      markOpeningDone();
    }, OUTRO_MS);
    return () => window.clearTimeout(t);
  }, [stage]);

  // Skip on scroll / Esc / Enter
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') finish();
    };
    window.addEventListener('wheel', finish, { passive: true, once: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', finish);
      window.removeEventListener('keydown', onKey);
    };
  }, [visible, finish]);

  const turnSoundOn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await playVintageJingle((performance.now() - started.current) / 1000);
    setSoundBlocked(!ok);
    setSoundOn(ok);
  };

  const outro = stage === 'outro';
  // Where the header logo sits, relative to the intro logo (only needed once the outro starts, in the browser)
  const flyY = outro ? headerLogoOffset() : 0;

  return (
    <>
      {/* Runs before first paint on a fresh page load: hides the stage when it should not play */}
      <script dangerouslySetInnerHTML={{ __html: OPENING_SKIP_SCRIPT }} />
      <AnimatePresence>
        {visible && (
          <motion.div
            key="site-opening"
            role="presentation"
            aria-hidden
            onClick={finish}
            exit={{ opacity: 0, transition: { duration: 0.2 } }}
            className="vc-opening fixed inset-0 z-[300] cursor-pointer"
          >
            {/* Stage: closes like an iris onto the logo */}
            <motion.div
              className="absolute inset-0 overflow-hidden"
              initial={{ clipPath: 'circle(150% at 50% 45%)' }}
              animate={{ clipPath: outro ? 'circle(0% at 50% 45%)' : 'circle(150% at 50% 45%)' }}
              transition={{ duration: OUTRO_MS / 1000, ease: EASE_IRIS }}
              style={{ background: `radial-gradient(circle at 50% 45%, #7a2b52 0%, ${PLUM} 55%, #3a1027 100%)` }}
            >
              {/* Halftone dots like an old print */}
              <div className="absolute inset-0 opacity-[0.12]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1.2px)', backgroundSize: '14px 14px' }} />
              {/* Film grain flicker */}
              <motion.div
                className="absolute inset-0 mix-blend-overlay"
                style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.05) 0 1px, transparent 1px 3px)' }}
                animate={{ opacity: [0.35, 0.6, 0.4, 0.55] }}
                transition={{ duration: 0.4, repeat: Infinity, repeatType: 'mirror' }}
              />

              {/* Sunburst: spins slowly, pulses on each horn stab */}
              <div className="absolute left-1/2 top-[45%] h-[160vmax] w-[160vmax] -translate-x-1/2 -translate-y-1/2">
                <motion.div
                  className="h-full w-full"
                  initial={{ rotate: 0, scale: 0.4, opacity: 0 }}
                  animate={{ rotate: 50, scale: [0.4, 1, 1, 1.08, 1, 1.1, 1.02], opacity: [0, 0.55, 0.55, 0.8, 0.55, 0.85, 0.6] }}
                  transition={{ duration: 2.6, times: [0, 0.3, 0.48, 0.52, 0.62, 0.72, 1], ease: 'easeOut' }}
                  style={{
                    background: `repeating-conic-gradient(from 0deg, ${TEAL}55 0deg 6deg, transparent 6deg 18deg)`,
                    maskImage: 'radial-gradient(circle, black 0%, black 22%, transparent 60%)',
                    WebkitMaskImage: 'radial-gradient(circle, black 0%, black 22%, transparent 60%)',
                  }}
                />
              </div>

              {/* Tagline */}
              <motion.p
                className="absolute inset-x-0 bottom-[16%] text-center font-display text-base font-bold uppercase text-white/90 md:text-lg"
                initial={{ opacity: 0, y: 20, letterSpacing: '0.9em' }}
                animate={{ opacity: outro ? 0 : 1, y: 0, letterSpacing: '0.35em' }}
                transition={{ delay: outro ? 0 : 1.15, duration: 0.7, ease: 'easeOut' }}
              >
                Vintage Closet · Wien
              </motion.p>
              <motion.p
                className="absolute inset-x-0 bottom-[11%] text-center font-mono text-[11px] uppercase tracking-[0.3em] text-white/55"
                initial={{ opacity: 0 }}
                animate={{ opacity: outro ? 0 : 1 }}
                transition={{ delay: outro ? 0 : 1.5 }}
              >
                1090 · 1020 · online
              </motion.p>
            </motion.div>

            {/* Record + logo: outside the iris so it can fly into the header */}
            <div className="pointer-events-none absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2">
              <motion.div
                className="relative flex items-center justify-center"
                animate={outro ? { y: flyY, scale: 0.17, rotate: 0, opacity: [1, 1, 0] } : { y: 0, scale: 1 }}
                transition={{ duration: OUTRO_MS / 1000, ease: EASE_IRIS, opacity: { duration: OUTRO_MS / 1000, times: [0, 0.85, 1] } }}
              >
                {/* Spinning record */}
                <motion.div
                  className="absolute h-[min(78vw,380px)] w-[min(78vw,380px)]"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: outro ? 0.6 : [0, 1.04, 1, 0.95, 1], opacity: outro ? 0 : 1 }}
                  transition={{ duration: outro ? 0.3 : 1.2, times: [0, 0.4, 0.55, 0.62, 0.75], ease: 'easeOut' }}
                >
                  <motion.div
                    className="h-full w-full rounded-full shadow-[0_20px_60px_rgba(0,0,0,.45)]"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                    style={{
                      background: `radial-gradient(circle, ${TEAL} 0 17%, #1b1b1d 17.5% 19%, transparent 19.5%), repeating-radial-gradient(circle, #1a1a1c 0 2px, #262629 2px 3px), #1a1a1c`,
                    }}
                  >
                    {/* Light sheen across the grooves */}
                    <div className="absolute inset-0 rounded-full" style={{ background: 'conic-gradient(from 20deg, transparent 0 40deg, rgba(255,255,255,.14) 55deg, transparent 75deg 220deg, rgba(255,255,255,.1) 235deg, transparent 255deg)' }} />
                    <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#fdf6e7]" />
                  </motion.div>
                </motion.div>

                {/* The sticker logo slaps onto the record */}
                <motion.div
                  initial={{ scale: 2.8, rotate: -20, opacity: 0, y: -50 }}
                  animate={{ scale: [2.8, 0.9, 1.05, 1], rotate: [-20, -3, -7, -6], opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.55, times: [0, 0.55, 0.8, 1], ease: 'easeOut' }}
                  className="relative"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/brand/vintage-closet-logo.png"
                    alt=""
                    width={480}
                    height={436}
                    className="h-auto w-[min(62vw,300px)] select-none"
                    style={{ filter: `drop-shadow(10px 12px 0 #2a0a1b) drop-shadow(0 0 40px ${TEAL}66)` }}
                    draggable={false}
                  />
                  {/* Impact rings on the slap */}
                  {[0, 0.12].map(d => (
                    <span key={d} className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2">
                      <motion.span
                        className="block h-full w-full rounded-full border-4"
                        style={{ borderColor: TEAL_BRIGHT }}
                        initial={{ scale: 0.3, opacity: 0 }}
                        animate={{ scale: [0.3, 2.8], opacity: [0.9, 0] }}
                        transition={{ delay: 0.86 + d, duration: 0.7, ease: 'easeOut' }}
                      />
                    </span>
                  ))}
                </motion.div>
              </motion.div>
            </div>

            {/* Sound: blocked until the visitor taps; this button starts it in sync with the intro */}
            {!outro && soundBlocked && !soundOn && (
              <motion.button
                type="button"
                onClick={turnSoundOn}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white backdrop-blur-md hover:bg-white/20"
              >
                🔊 Sound on
              </motion.button>
            )}
            {!outro && (
              <span className="absolute right-5 top-5 text-[11px] uppercase tracking-[0.25em] text-white/45">tap to skip</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
