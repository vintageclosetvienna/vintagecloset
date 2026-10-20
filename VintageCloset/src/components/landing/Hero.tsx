'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useInView, useReducedMotion, useSpring } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Reveal } from '@/components/shared/Reveal';
import { SafeImage } from '@/components/ui/SafeImage';
import { getLandingHeroImages, type SiteImage } from '@/lib/site-images';

// Fallback images
const FALLBACK_IMAGES = {
  left: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
  center: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop',
  right: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?q=80&w=1887&auto=format&fit=crop',
};

// Glass pills like the reference: teal tint, light text, thin light border
const SIDE_BUTTON_CLASS =
  'absolute bottom-5 md:bottom-8 z-30 min-w-[108px] md:min-w-[140px] px-7 py-3 rounded-full text-center text-sm font-medium text-white bg-accent-end/75 backdrop-blur-md border border-white/40 shadow-[0_8px_24px_rgba(27,113,119,0.25)] hover:bg-accent-end/90 transition-colors';

// How long each photo stays in front while the deck plays on its own
const AUTOPLAY_MS = 4500;

// Card positions in the deck: left, front, right
const SLOTS = [
  { x: '-58%', rotate: -8, scale: 0.84, zIndex: 2, opacity: 0.92 },
  { x: '0%', rotate: 0, scale: 1, zIndex: 3, opacity: 1 },
  { x: '58%', rotate: 8, scale: 0.84, zIndex: 1, opacity: 0.92 },
];

interface DeckImage {
  src: string;
  alt: string;
}

// Interactive photo deck: tilts with the mouse, swipe or click to flip, plays on its own
function HeroDeck({ images }: { images: DeckImage[] }) {
  const reduceMotion = useReducedMotion();
  const deckRef = useRef<HTMLDivElement>(null);
  const inView = useInView(deckRef, { amount: 0.3 });
  const [front, setFront] = useState(1);
  const [paused, setPaused] = useState(false);
  const count = images.length;
  const playing = !reduceMotion && !paused && inView;

  const show = useCallback((i: number) => setFront(((i % count) + count) % count), [count]);
  const next = useCallback(() => setFront(f => (f + 1) % count), [count]);
  const prev = useCallback(() => setFront(f => (f - 1 + count) % count), [count]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(next, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [playing, next]);

  // Mouse tilt, eased with a spring
  const rotateX = useSpring(0, { stiffness: 150, damping: 20 });
  const rotateY = useSpring(0, { stiffness: 150, damping: 20 });

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || reduceMotion || !deckRef.current) return;
    const rect = deckRef.current.getBoundingClientRect();
    rotateY.set(((e.clientX - rect.left) / rect.width - 0.5) * 14);
    rotateX.set(-((e.clientY - rect.top) / rect.height - 0.5) * 10);
  };

  const onPointerLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
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
          {images.map((image, i) => {
            const slot = ((i - front + count + 1) % count) - 1;
            const position = SLOTS[slot + 1] ?? SLOTS[1];
            const isFront = slot === 0;

            return (
              <motion.div
                key={i}
                className={cn('absolute inset-0', !isFront && 'cursor-pointer')}
                initial={false}
                animate={{ x: position.x, rotate: position.rotate, scale: position.scale, opacity: position.opacity }}
                style={{ zIndex: position.zIndex }}
                transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 260, damping: 30 }}
                onClick={() => !isFront && show(i)}
                aria-hidden={!isFront}
              >
                {/* Swipe the front card left or right */}
                <motion.div
                  className={cn('w-full h-full', isFront && 'cursor-grab active:cursor-grabbing')}
                  drag={isFront ? 'x' : false}
                  dragSnapToOrigin
                  dragElastic={0.5}
                  onDragStart={() => setPaused(true)}
                  onDragEnd={(_, info) => {
                    setPaused(false);
                    if (info.offset.x < -60) next();
                    else if (info.offset.x > 60) prev();
                  }}
                >
                  {/* Slow float, offset per card */}
                  <motion.div
                    className="w-full h-full"
                    animate={reduceMotion ? undefined : { y: [0, -8, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.9 }}
                  >
                    <div
                      className={cn(
                        'relative w-full h-full overflow-hidden rounded-2xl bg-gray-100 transition-[filter,box-shadow] duration-500',
                        isFront ? 'border-4 border-white shadow-2xl' : 'shadow-lg brightness-90 hover:brightness-100'
                      )}
                    >
                      <SafeImage
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 768px) 360px, 60vw"
                        className="object-cover pointer-events-none select-none"
                        draggable={false}
                        priority={i === 1}
                      />
                      {isFront && (
                        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full text-xs font-bold tracking-wide shadow-sm whitespace-nowrap">
                          SHOT IN VIENNA
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Progress dots: the active one fills while the deck plays */}
      <div className="mt-5 flex items-center gap-2" role="group" aria-label="Choose a photo">
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
      </div>
    </div>
  );
}

export function Hero() {
  const [heroImages, setHeroImages] = useState<{
    left: SiteImage | null;
    center: SiteImage | null;
    right: SiteImage | null;
  }>({ left: null, center: null, right: null });

  useEffect(() => {
    async function fetchImages() {
      try {
        const images = await getLandingHeroImages();
        setHeroImages(images);
      } catch (error) {
        console.error('Error fetching hero images:', error);
      }
    }
    fetchImages();
  }, []);

  const deckImages: DeckImage[] = [
    { src: heroImages.left?.url || FALLBACK_IMAGES.left, alt: 'Vintage Mood 1' },
    { src: heroImages.center?.url || FALLBACK_IMAGES.center, alt: 'Vintage Clothing Rack' },
    { src: heroImages.right?.url || FALLBACK_IMAGES.right, alt: 'Vintage Mood 2' },
  ];

  return (
    <section className="relative flex flex-col justify-center min-h-[calc(100svh-var(--header-height)-3rem)] md:min-h-[calc(100svh-var(--header-height)-5rem)] lg:min-h-[calc(100svh-var(--header-height)-6rem)] pt-6 md:pt-10 lg:pt-8 pb-24 lg:pb-6 overflow-hidden">
      {/* Soft teal stage light behind the photos */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-[radial-gradient(ellipse_at_50%_60%,rgba(76,194,186,0.16),transparent_65%)]" />

      {/* Photo deck */}
      <Reveal direction="scale" delay={0.3} width="100%" className="relative z-10">
        <HeroDeck images={deckImages} />
      </Reveal>

      {/* Centered headline under the photos */}
      <div className="relative z-20 container mx-auto px-4 md:px-6 mt-5 md:mt-6 text-center space-y-2 md:space-y-3">
        {/* Animate on load (not on scroll): the headline sits low in the first screen */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.3 }} className="mx-auto w-fit">
          <h1 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl leading-[0.95] tracking-tight text-ink">
            Vintage Closet<br className="md:hidden" /> <span className="text-gradient">Vienna.</span>
          </h1>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.4 }} className="mx-auto w-fit">
          <p className="text-muted text-sm md:text-[15px] leading-relaxed max-w-[30ch] md:max-w-[44ch] mx-auto">
            Curated archive of 90s streetwear and luxury essentials.
            Authentic pieces sourced globally, housed in Vienna.
          </p>
        </motion.div>
      </div>

      {/* Collection shortcuts pinned to the bottom corners */}
      <Link href="/men" className={SIDE_BUTTON_CLASS + ' left-4 md:left-8'}>
        Men
      </Link>
      <Link href="/women" className={SIDE_BUTTON_CLASS + ' right-4 md:right-8'}>
        Women
      </Link>
    </section>
  );
}
