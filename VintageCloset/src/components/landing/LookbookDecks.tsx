'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { SafeImage } from '@/components/ui/SafeImage';
import { getLookbook, type Look } from '@/lib/site-images';

/* The model looks on the homepage photo wall: one card deck per look, swipe (or tap the sides) through its photos,
   a short caption beneath. Looks come from the Rennstern app's publish (api/import/look). */

const SWIPE = 70;

function Deck({ look }: { look: Look }) {
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const n = look.images.length;
  const go = (d: number) => {
    setDir(d);
    setI((v) => (v + d + n) % n);
  };
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE || info.velocity.x < -400) go(1);
    else if (info.offset.x > SWIPE || info.velocity.x > 400) go(-1);
  };
  const img = look.images[i];

  return (
    <figure className="flex-shrink-0 snap-start w-[72vw] sm:w-[46vw] md:w-[28vw] lg:w-[22vw]">
      <div className="relative aspect-[3/4]">
        {/* the cards behind: the deck shows there is more to swipe */}
        {n > 1 && (
          <>
            <div className="absolute inset-0 rounded-2xl bg-brand-plum/15 rotate-[4deg] translate-x-2" />
            <div className="absolute inset-0 rounded-2xl bg-brand-teal/20 -rotate-[3deg] -translate-x-1" />
          </>
        )}
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={i}
            custom={dir}
            className="absolute inset-0 rounded-2xl overflow-hidden bg-gray-200 shadow-lg cursor-grab active:cursor-grabbing"
            drag={n > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.6}
            onDragEnd={onDragEnd}
            initial={{ opacity: 0, x: dir * 60, rotate: dir * 3 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            exit={{ opacity: 0, x: -dir * 160, rotate: -dir * 8 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            style={{ touchAction: 'pan-y' }}
          >
            <SafeImage
              src={img.url}
              alt={`${look.title} – photo ${i + 1} of ${n}`}
              fill
              draggable={false}
              sizes="(max-width: 640px) 72vw, (max-width: 1024px) 46vw, 22vw"
              className="object-cover pointer-events-none select-none"
              style={{ objectPosition: img.position }}
            />
            {n > 1 && (
              <>
                <button aria-label="Previous photo" onClick={() => go(-1)} className="absolute inset-y-0 left-0 w-1/4" />
                <button aria-label="Next photo" onClick={() => go(1)} className="absolute inset-y-0 right-0 w-1/4" />
                <div className="absolute bottom-3 inset-x-0 flex justify-center gap-1.5 pointer-events-none">
                  {look.images.map((_, k) => (
                    <span key={k} className={`h-1.5 rounded-full transition-all ${k === i ? 'w-5 bg-white' : 'w-1.5 bg-white/55'}`} />
                  ))}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <figcaption className="mt-4 px-1">
        <p className="font-display text-base md:text-lg text-ink leading-snug">{look.title}</p>
        {look.caption && <p className="mt-1 text-sm text-muted leading-relaxed">{look.caption}</p>}
      </figcaption>
    </figure>
  );
}

/* Below the decks: the looks' photos as a free editorial mosaic, mixed sizes like a magazine spread (his ask 31 Oct). */
const TILE = [
  'col-span-2 row-span-3', 'row-span-2', 'row-span-3', 'row-span-2',
  'row-span-2', 'col-span-2 row-span-2', 'row-span-3', 'row-span-2',
  'row-span-3', 'col-span-2 row-span-3',
];

function Mosaic({ looks }: { looks: Look[] }) {
  // one photo from each look in turn, so the spread mixes the looks
  const shots: { url: string; position: string; title: string }[] = [];
  for (let k = 0; shots.length < TILE.length && looks.some((l) => l.images[k]); k++) {
    looks.forEach((l) => l.images[k] && shots.length < TILE.length && shots.push({ ...l.images[k], title: l.title }));
  }
  if (shots.length < 4) return null;
  return (
    <div className="mt-10 md:mt-14 px-4 md:px-6 grid grid-cols-2 md:grid-cols-4 auto-rows-[110px] md:auto-rows-[150px] grid-flow-dense gap-2 md:gap-3">
      {shots.map((s, k) => (
        <div key={k} className={`relative overflow-hidden rounded-xl bg-gray-200 group ${TILE[k]}`}>
          <SafeImage
            src={s.url}
            alt={s.title}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            style={{ objectPosition: s.position }}
          />
          <span className="absolute bottom-2 left-3 text-[11px] uppercase tracking-[0.18em] text-white/90 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow">
            {s.title}
          </span>
        </div>
      ))}
    </div>
  );
}

export function LookbookDecks() {
  const [looks, setLooks] = useState<Look[]>([]);

  useEffect(() => {
    getLookbook().then(setLooks).catch(() => setLooks([]));
  }, []);

  if (looks.length === 0) return null;

  return (
    <section className="bg-surface pb-12 md:pb-20 -mt-6 md:-mt-12" aria-label="Lookbook">
      <div className="px-4 md:px-6 mb-6 flex items-baseline justify-between">
        <h2 className="font-display text-2xl md:text-3xl text-ink">On the model</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Swipe the looks</span>
      </div>
      <div className="flex gap-6 md:gap-10 overflow-x-auto snap-x snap-mandatory px-4 md:px-6 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {looks.map((look) => (
          <Deck key={look.id} look={look} />
        ))}
      </div>
      <Mosaic looks={looks} />
    </section>
  );
}
