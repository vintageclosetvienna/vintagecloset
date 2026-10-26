'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  motion,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from 'framer-motion';
import { cn } from '@/lib/utils';
import { SafeImage } from '@/components/ui/SafeImage';
import { getLandingHeroImages, type SiteImage } from '@/lib/site-images';
import { useOpeningDone } from '@/lib/opening-store';

// Glass pills like the reference: teal tint, light text, thin light border
const SIDE_BUTTON_CLASS =
  'absolute bottom-5 md:bottom-8 z-30 min-w-[108px] md:min-w-[140px] px-7 py-3 rounded-full text-center text-sm font-medium text-white bg-accent-end/75 backdrop-blur-md border border-white/40 shadow-[0_8px_24px_rgba(27,113,119,0.25)] hover:bg-accent-end/90 transition-colors';

// How long each photo stays in front while the deck plays on its own
const AUTOPLAY_MS = 5000;

// Smooth, slightly heavy cards: no bounce-back jitter, settles in about 0.7 s
const CARD_SPRING = { type: 'spring' as const, stiffness: 170, damping: 24, mass: 0.9 };

// Card positions in the deck: left, front, right (depth = how strongly the card follows the mouse)
const SLOTS = [
  { x: '-56%', y: 14, rotate: -9, scale: 0.84, zIndex: 2, brightness: 0.82, depth: 10 },
  { x: '0%', y: 0, rotate: 0, scale: 1, zIndex: 3, brightness: 1, depth: 22 },
  { x: '56%', y: 14, rotate: 9, scale: 0.84, zIndex: 1, brightness: 0.82, depth: 10 },
];

interface DeckImage {
  src: string;
  alt: string;
}

// One card: deals in, takes its slot, follows the mouse by its depth, the front one zooms slowly and catches the light
function DeckCard({
  image,
  index,
  slot,
  dealt,
  front,
  playing,
  reduceMotion,
  pointerX,
  pointerY,
  onSelect,
  onThrow,
  onHold,
}: {
  image: DeckImage;
  index: number;
  slot: number;
  dealt: boolean;
  front: number;
  playing: boolean;
  reduceMotion: boolean;
  pointerX: MotionValue<number>;
  pointerY: MotionValue<number>;
  onSelect: () => void;
  onThrow: (dir: 1 | -1) => void;
  onHold: (held: boolean) => void;
}) {
  const position = SLOTS[slot + 1] ?? SLOTS[1];
  const isFront = slot === 0;

  // Parallax: deeper cards move more with the pointer
  const px = useTransform(pointerX, v => v * position.depth);
  const py = useTransform(pointerY, v => v * position.depth * 0.6);

  // Drag the front card: it leans in the direction you pull and flies off when thrown
  const dragX = useMotionValue(0);
  const dragRotate = useTransform(dragX, [-240, 240], [-14, 14]);

  // Light glare follows the pointer on the front card
  const glareX = useTransform(pointerX, [-0.5, 0.5], [15, 85]);
  const glareY = useTransform(pointerY, [-0.5, 0.5], [10, 70]);
  const glare = useMotionTemplate`radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.32), rgba(255,255,255,0) 55%)`;

  // Before the deal every card waits stacked in the middle
  const target = dealt
    ? { x: position.x, y: position.y, rotate: position.rotate, scale: position.scale, opacity: 1 }
    : { x: '0%', y: 60, rotate: (index - 1) * 4, scale: 0.6, opacity: 0 };

  return (
    <motion.div
      className={cn('absolute inset-0', !isFront && 'cursor-pointer')}
      initial={false}
      animate={target}
      style={{ zIndex: position.zIndex }}
      transition={reduceMotion ? { duration: 0 } : { ...CARD_SPRING, delay: dealt ? 0.08 * Math.abs(slot - 1) : 0 }}
      onClick={() => !isFront && onSelect()}
      aria-hidden={!isFront}
    >
      <motion.div className="h-full w-full" style={reduceMotion ? undefined : { x: px, y: py }}>
        <motion.div
          className={cn('h-full w-full', isFront && 'cursor-grab active:cursor-grabbing')}
          drag={isFront && !reduceMotion ? 'x' : false}
          dragSnapToOrigin
          dragElastic={0.55}
          style={{ x: dragX, rotate: dragRotate }}
          onDragStart={() => onHold(true)}
          onDragEnd={(_, info) => {
            onHold(false);
            const flung = Math.abs(info.velocity.x) > 450 || Math.abs(info.offset.x) > 80;
            if (flung) onThrow(info.offset.x < 0 ? 1 : -1);
          }}
        >
          <div
            className={cn(
              'relative h-full w-full overflow-hidden rounded-2xl bg-gray-100 transition-[box-shadow,filter] duration-700',
              isFront ? 'border-4 border-white shadow-[0_30px_60px_-15px_rgba(16,24,40,0.45)]' : 'shadow-lg'
            )}
            style={{ filter: `brightness(${position.brightness}) saturate(${isFront ? 1.05 : 0.85})` }}
          >
            {/* Slow zoom on the photo in front, restarts with every new card */}
            <motion.div
              key={isFront ? `front-${front}` : 'rest'}
              className="absolute inset-0"
              initial={{ scale: isFront && !reduceMotion ? 1.0 : 1.04 }}
              animate={{ scale: isFront && playing && !reduceMotion ? 1.1 : 1.04 }}
              transition={{ duration: isFront && playing ? AUTOPLAY_MS / 1000 + 0.6 : 0.8, ease: 'linear' }}
            >
              <SafeImage
                src={image.src}
                alt={image.alt}
                fill
                sizes="(min-width: 768px) 360px, 60vw"
                className="object-cover pointer-events-none select-none"
                draggable={false}
                priority={index === 1}
              />
            </motion.div>

            {isFront && !reduceMotion && <motion.div className="pointer-events-none absolute inset-0 mix-blend-soft-light" style={{ background: glare }} />}

            {/* Sticker label pops onto the front card */}
            <motion.div
              className="absolute bottom-5 left-1/2 whitespace-nowrap rounded-full bg-white/90 px-4 py-2 text-xs font-bold tracking-wide shadow-sm backdrop-blur-md"
              initial={false}
              animate={isFront ? { opacity: 1, x: '-50%', y: 0, rotate: -3, scale: 1 } : { opacity: 0, x: '-50%', y: 12, rotate: 0, scale: 0.8 }}
              transition={{ ...CARD_SPRING, delay: isFront ? 0.25 : 0 }}
            >
              SHOT IN VIENNA
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

// Interactive photo deck: deals in after the intro, parallax with the mouse, throw or click to flip, plays on its own
function HeroDeck({ images, dealt }: { images: DeckImage[]; dealt: boolean }) {
  const reduceMotion = !!useReducedMotion();
  const deckRef = useRef<HTMLDivElement>(null);
  const inView = useInView(deckRef, { amount: 0.3 });
  const [front, setFront] = useState(1);
  const [paused, setPaused] = useState(false);
  const [held, setHeld] = useState(false);
  const count = images.length;
  const playing = dealt && !reduceMotion && !paused && !held && inView;

  const show = useCallback((i: number) => setFront(((i % count) + count) % count), [count]);
  const next = useCallback(() => setFront(f => (f + 1) % count), [count]);
  const prev = useCallback(() => setFront(f => (f - 1 + count) % count), [count]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [playing, next, front]);

  // Pointer position over the deck (-0.5 … 0.5), smoothed with springs: drives tilt, parallax and glare
  const pointerX = useSpring(0, { stiffness: 120, damping: 20, mass: 0.6 });
  const pointerY = useSpring(0, { stiffness: 120, damping: 20, mass: 0.6 });
  const rotateY = useTransform(pointerX, v => v * 12);
  const rotateX = useTransform(pointerY, v => v * -9);

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || reduceMotion || !deckRef.current) return;
    const rect = deckRef.current.getBoundingClientRect();
    pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const onPointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
    setPaused(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
  };

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        ref={deckRef}
        role="region"
        aria-roledescription="carousel"
        aria-label="Photos from the store"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        onPointerEnter={(e) => e.pointerType === 'mouse' && setPaused(true)}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        style={{ rotateX, rotateY, transformPerspective: 1200 }}
        className="relative w-full flex justify-center outline-none focus-visible:ring-2 focus-visible:ring-accent-start/40 rounded-3xl"
      >
        <div className="relative h-[clamp(220px,38svh,420px)] md:h-[clamp(240px,48svh,600px)] aspect-[3/4]">
          {images.map((image, i) => (
            <DeckCard
              key={i}
              image={image}
              index={i}
              slot={((i - front + count + 1) % count) - 1}
              dealt={dealt}
              front={front}
              playing={playing}
              reduceMotion={reduceMotion}
              pointerX={pointerX}
              pointerY={pointerY}
              onSelect={() => show(i)}
              onThrow={dir => (dir === 1 ? next() : prev())}
              onHold={setHeld}
            />
          ))}
        </div>
      </motion.div>

      {/* Progress dots: the active one fills while the deck plays */}
      <motion.div
        className="mt-5 flex items-center gap-2"
        role="group"
        aria-label="Choose a photo"
        initial={false}
        animate={{ opacity: dealt ? 1 : 0, y: dealt ? 0 : 8 }}
        transition={{ delay: dealt ? 0.5 : 0, duration: 0.4 }}
      >
        {images.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => show(i)}
            aria-label={`Show photo ${i + 1}`}
            aria-current={i === front}
            className={cn(
              'relative h-1.5 rounded-full overflow-hidden transition-all duration-300',
              i === front ? 'w-8 bg-ink/15' : 'w-1.5 bg-ink/25 hover:bg-ink/50'
            )}
          >
            {i === front && (
              <motion.span
                key={`${front}-${playing}`}
                className="absolute inset-y-0 left-0 bg-ink rounded-full"
                initial={{ width: playing ? '0%' : '100%' }}
                animate={{ width: '100%' }}
                transition={{ duration: playing ? AUTOPLAY_MS / 1000 : 0, ease: 'linear' }}
              />
            )}
          </button>
        ))}
      </motion.div>
    </div>
  );
}

// Headline letters rise in one after another once the deck has been dealt
function RisingWords({ text, show, delay, className }: { text: string; show: boolean; delay: number; className?: string }) {
  return (
    <span className={cn('inline-block', className)} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom" aria-hidden>
          <motion.span
            className="inline-block"
            initial={false}
            animate={show ? { y: '0%', opacity: 1, rotate: 0 } : { y: '110%', opacity: 0, rotate: 6 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26, delay: show ? delay + i * 0.028 : 0 }}
          >
            {ch === ' ' ? ' ' : ch}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export function Hero() {
  const openingDone = useOpeningDone();
  const reduceMotion = useReducedMotion();
  const dealt = openingDone || !!reduceMotion;
  const sectionRef = useRef<HTMLElement>(null);

  const [heroImages, setHeroImages] = useState<{
    left: SiteImage | null;
    center: SiteImage | null;
    right: SiteImage | null;
  }>({ left: null, center: null, right: null });

  useEffect(() => {
    getLandingHeroImages()
      .then(setHeroImages)
      .catch(error => console.error('Error fetching hero images:', error));
  }, []);

  // Scrolling away: the deck leans back and sinks a little (depth instead of a flat scroll)
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  const deckScale = useTransform(scrollYProgress, [0, 1], [1, 0.9]);
  const deckTilt = useTransform(scrollYProgress, [0, 1], [0, 14]);
  const deckY = useTransform(scrollYProgress, [0, 1], [0, -40]);

  // Own photos only (Admin › Site Images); a soft placeholder shows while they load
  const deckImages: DeckImage[] = [
    { src: heroImages.left?.url || '', alt: 'Vintage Closet store, rack detail' },
    { src: heroImages.center?.url || '', alt: 'Vintage clothing rack in Vienna' },
    { src: heroImages.right?.url || '', alt: 'Vintage Closet store, mood' },
  ];

  return (
    <section
      ref={sectionRef}
      className="relative flex flex-col justify-center min-h-[calc(100svh-var(--header-height)-3rem)] md:min-h-[calc(100svh-var(--header-height)-5rem)] lg:min-h-[calc(100svh-var(--header-height)-6rem)] pt-6 md:pt-10 lg:pt-8 pb-24 lg:pb-6 overflow-hidden"
    >
      {/* Soft teal stage light behind the photos, breathes slowly */}
      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-[radial-gradient(ellipse_at_50%_60%,rgba(76,194,186,0.18),transparent_65%)]"
        animate={reduceMotion ? undefined : { opacity: [0.7, 1, 0.7], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Photo deck */}
      <motion.div className="relative z-10 w-full" style={reduceMotion ? undefined : { scale: deckScale, rotateX: deckTilt, y: deckY, transformPerspective: 1400 }}>
        <HeroDeck images={deckImages} dealt={dealt} />
      </motion.div>

      {/* Centered headline under the photos */}
      <div className="relative z-20 container mx-auto px-4 md:px-6 mt-5 md:mt-6 text-center space-y-2 md:space-y-3">
        <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl leading-[0.95] tracking-tight text-ink">
          <RisingWords text="Vintage Closet" show={dealt} delay={0.35} />
          <br className="md:hidden" />{' '}
          <motion.span
            className="text-gradient inline-block bg-[length:200%_100%]"
            initial={false}
            animate={dealt ? { opacity: 1, y: 0, backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] } : { opacity: 0, y: 24 }}
            transition={{
              opacity: { delay: dealt ? 0.75 : 0, duration: 0.5 },
              y: { type: 'spring', stiffness: 220, damping: 22, delay: dealt ? 0.75 : 0 },
              backgroundPosition: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            Vienna.
          </motion.span>
        </h1>

        <motion.div initial={false} animate={dealt ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }} transition={{ duration: 0.6, delay: dealt ? 0.9 : 0 }} className="mx-auto w-fit">
          <p className="text-muted text-sm md:text-[15px] leading-relaxed max-w-[30ch] md:max-w-[44ch] mx-auto">
            Curated archive of 90s streetwear and luxury essentials.
            Authentic pieces sourced globally, housed in Vienna.
          </p>
        </motion.div>
      </div>

      {/* Collection shortcuts pinned to the bottom corners, slide in from the sides */}
      <motion.div className="contents" initial={false} animate={{ opacity: dealt ? 1 : 0 }} transition={{ delay: dealt ? 1 : 0 }}>
        <Link href="/men" className={SIDE_BUTTON_CLASS + ' left-4 md:left-8'}>
          Men
        </Link>
        <Link href="/women" className={SIDE_BUTTON_CLASS + ' right-4 md:right-8'}>
          Women
        </Link>
      </motion.div>
    </section>
  );
}
