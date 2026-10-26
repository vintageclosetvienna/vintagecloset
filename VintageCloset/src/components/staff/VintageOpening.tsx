'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

/** When the opening last played (localStorage); it replays after 15 minutes, like the Rennstern opening. */
const OPENING_KEY = 'vc-staff-opening-seen';
const REPLAY_MS = 15 * 60 * 1000;
const SHOW_MS = 3400;
const OUTRO_MS = 900;

const TEAL = '#4CC2BA';
const TEAL_BRIGHT = '#01DBCA';
const PLUM = '#602140';

// Clothing confetti that bursts out when the logo lands
const CONFETTI = ['🧥', '👖', '👗', '🧢', '👟', '🕶️', '✨', '🧣', '👜', '✨', '🎞️', '💫'].map((emoji, i) => ({
  emoji,
  angle: i * 30 + (i % 2) * 12,
  distance: 150 + ((i * 53) % 110),
  rotate: (i % 2 ? 1 : -1) * (40 + ((i * 37) % 120)),
  delay: 1.25 + (i % 4) * 0.04,
  size: 22 + ((i * 7) % 16),
}));

function readShouldPlay(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  try {
    const last = Number(window.localStorage.getItem(OPENING_KEY) || 0);
    return Date.now() - (Number.isFinite(last) ? last : 0) >= REPLAY_MS;
  } catch {
    return true;
  }
}

/**
 * Launch scene for the team app: plum stage, teal sunburst, a hanger swings in,
 * the Vintage Closet sticker slaps down, a price tag with today's date drops,
 * clothes confetti bursts, then everything shrinks towards the app logo.
 * Tap anywhere to skip. Skipped for reduced motion.
 */
export function VintageOpening() {
  const [stage, setStage] = useState<'show' | 'outro' | 'gone'>(() => (readShouldPlay() ? 'show' : 'gone'));
  const [date] = useState(() =>
    new Date().toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Vienna' })
  );

  useEffect(() => {
    if (stage !== 'show') return;
    try {
      window.localStorage.setItem(OPENING_KEY, String(Date.now()));
    } catch {
      /* storage blocked: it simply plays again next time */
    }
    const toOutro = window.setTimeout(() => setStage('outro'), SHOW_MS);
    return () => window.clearTimeout(toOutro);
  }, [stage]);

  useEffect(() => {
    if (stage !== 'outro') return;
    const done = window.setTimeout(() => setStage('gone'), OUTRO_MS);
    return () => window.clearTimeout(done);
  }, [stage]);

  return (
    <AnimatePresence>
      {stage !== 'gone' && (
        <motion.div
          key="vintage-opening"
          role="presentation"
          onClick={() => setStage('outro')}
          initial={{ opacity: 1 }}
          animate={{ opacity: stage === 'outro' ? 0 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: stage === 'outro' ? OUTRO_MS / 1000 : 0.3, ease: 'easeInOut' }}
          className="fixed inset-0 z-[300] cursor-pointer overflow-hidden"
          style={{ background: `radial-gradient(circle at 50% 45%, #7a2b52 0%, ${PLUM} 55%, #3a1027 100%)` }}
        >
          {/* Halftone dots like an old print */}
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1.2px)', backgroundSize: '14px 14px' }}
          />

          {/* Rotating teal sunburst */}
          <div className="absolute left-1/2 top-[45%] h-[160vmax] w-[160vmax] -translate-x-1/2 -translate-y-1/2">
          <motion.div
            className="h-full w-full"
            initial={{ rotate: 0, scale: 0.4, opacity: 0 }}
            animate={{ rotate: 40, scale: 1, opacity: 0.55 }}
            transition={{ duration: 4.2, ease: 'easeOut' }}
            style={{
              background: `repeating-conic-gradient(from 0deg, ${TEAL}55 0deg 6deg, transparent 6deg 18deg)`,
              maskImage: 'radial-gradient(circle, black 0%, black 25%, transparent 60%)',
              WebkitMaskImage: 'radial-gradient(circle, black 0%, black 25%, transparent 60%)',
            }}
          />
          </div>

          <div className="absolute left-1/2 top-[45%] -translate-x-1/2 -translate-y-1/2">
          <motion.div
            className="relative"
            animate={stage === 'outro' ? { scale: 0.18, x: '-42vw', y: '-40vh', rotate: -12 } : { scale: 1, x: 0, y: 0, rotate: 0 }}
            transition={{ duration: OUTRO_MS / 1000, ease: [0.6, 0, 0.3, 1] }}
          >
            {/* Hanger swinging in from the top */}
            <div className="absolute left-1/2 -translate-x-1/2" style={{ top: -150 }}>
            <motion.svg
              width="180"
              height="120"
              viewBox="0 0 180 120"
              style={{ transformOrigin: '90px 8px' }}
              initial={{ y: -400, rotate: -25 }}
              animate={{ y: 0, rotate: [-25, 14, -8, 4, 0] }}
              transition={{ y: { duration: 0.6, ease: 'easeOut' }, rotate: { duration: 1.6, ease: 'easeOut' } }}
              aria-hidden
            >
              <path d="M90 8 a10 10 0 1 1 10 10 c-6 0 -10 4 -10 10 v6 L12 96 h156 L90 34" fill="none" stroke={TEAL_BRIGHT} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
            </div>

            {/* The sticker logo slaps down */}
            <motion.div
              initial={{ scale: 2.6, rotate: -18, opacity: 0, y: -40 }}
              animate={{ scale: [2.6, 0.92, 1.04, 1], rotate: [-18, -4, -7, -6], opacity: 1, y: 0 }}
              transition={{ delay: 0.75, duration: 0.65, times: [0, 0.6, 0.8, 1], ease: 'easeOut' }}
              className="relative"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/vintage-closet-logo.png"
                alt="Vintage Closet"
                width={480}
                height={436}
                className="h-auto w-[min(72vw,340px)] select-none"
                style={{ filter: `drop-shadow(10px 12px 0 #2a0a1b) drop-shadow(0 0 40px ${TEAL}66)` }}
                draggable={false}
              />
              {/* Impact ring */}
              <span className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2">
                <motion.span
                  className="block h-full w-full rounded-full border-4"
                  style={{ borderColor: TEAL_BRIGHT }}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: [0.3, 2.6], opacity: [0.9, 0] }}
                  transition={{ delay: 1.15, duration: 0.7, ease: 'easeOut' }}
                />
              </span>
            </motion.div>

            {/* Price tag with today's date */}
            <motion.div
              className="absolute -bottom-6 -right-10 origin-top sm:-right-16"
              initial={{ y: -60, rotate: 30, opacity: 0 }}
              animate={{ y: 0, rotate: [30, -10, 6, -3, 8], opacity: 1 }}
              transition={{ delay: 1.45, duration: 1.1, ease: 'easeOut' }}
            >
              <div className="relative flex items-center gap-2 rounded-lg rounded-l-[26px] bg-[#fdf6e7] py-2 pl-7 pr-4 shadow-[6px_8px_0_#2a0a1b]" style={{ color: PLUM }}>
                <span className="absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2" style={{ borderColor: PLUM }} />
                <span className="font-display text-sm font-extrabold uppercase tracking-[0.18em]">Team</span>
                <span className="font-mono text-xs font-semibold opacity-80">{date}</span>
              </div>
            </motion.div>

            {/* Clothes confetti */}
            {CONFETTI.map((c) => (
              <motion.span
                key={c.angle}
                className="absolute left-1/2 top-1/2 select-none"
                style={{ fontSize: c.size }}
                initial={{ x: 0, y: 0, opacity: 0, scale: 0.2, rotate: 0 }}
                animate={{
                  x: Math.cos((c.angle * Math.PI) / 180) * c.distance,
                  y: Math.sin((c.angle * Math.PI) / 180) * c.distance + 40,
                  opacity: [0, 1, 1, 0],
                  scale: [0.2, 1.1, 1],
                  rotate: c.rotate,
                }}
                transition={{ delay: c.delay, duration: 1.5, ease: 'easeOut' }}
                aria-hidden
              >
                {c.emoji}
              </motion.span>
            ))}
          </motion.div>
          </div>

          {/* Tagline */}
          <motion.p
            className="absolute inset-x-0 bottom-[14%] text-center font-display text-lg font-bold uppercase tracking-[0.35em] text-white/90"
            initial={{ opacity: 0, y: 20, letterSpacing: '0.8em' }}
            animate={{ opacity: 1, y: 0, letterSpacing: '0.35em' }}
            transition={{ delay: 1.8, duration: 0.8, ease: 'easeOut' }}
          >
            Vintage Closet · Wien
          </motion.p>
          <motion.p
            className="absolute inset-x-0 bottom-[9%] text-center text-xs text-white/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
          >
            tap to skip
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
