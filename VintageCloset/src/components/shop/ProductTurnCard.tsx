'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { TurnView } from '@/lib/turn-views';

/*
 * Turn card (31 Oct, his ask: instead of a turnaround clip): the piece's own photos on a card you swipe. The card turns in 3D
 * under the finger and shows the next side of the piece (front → side → back), then settles; a tap turns it once, the arrow
 * keys and the buttons below do the same. The side turning away gets darker and a soft light runs across, so it reads as a
 * turn, not a slide. On first sight it turns a little and back, to show it can be turned.
 */

const LABEL: Record<TurnView['view'], string> = { front: 'Front', side: 'Side', back: 'Back' };
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export function ProductTurnCard({ views, title }: { views: TurnView[]; title: string }) {
  const n = views.length;
  const stage = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const sheen = useRef<HTMLDivElement>(null);
  const floor = useRef<HTMLDivElement>(null);
  const theta = useRef(0);          // the card's whole turn in degrees; every 180° is the next side
  const shown = useRef(0);
  const frame = useRef(0);
  const touched = useRef(false);
  const drag = useRef<{ x: number; from: number; k0: number; moved: boolean; trail: { x: number; t: number }[] } | null>(null);
  const [idx, setIdx] = useState(0);

  // which side shows at a turn: turning left (negative) goes front → side → back
  const sideAt = useCallback((t: number) => (((-Math.round(t / 180)) % n) + n) % n, [n]);

  // the card at a turn: only the DOM, every frame (no React render)
  const drawCard = useCallback((t: number) => {
    theta.current = t;
    const phi = t - 180 * Math.round(t / 180);                 // the visible side's own turn, −90 … 90
    const r = (phi * Math.PI) / 180, a = Math.abs(Math.sin(r));
    if (card.current) card.current.style.transform = `rotateY(${phi.toFixed(2)}deg) scale(${(1 - 0.05 * a).toFixed(4)})`;
    if (shade.current) shade.current.style.background = `linear-gradient(${phi < 0 ? 'to right' : 'to left'}, rgba(0,0,0,${(0.5 * a).toFixed(3)}), transparent 75%)`;
    if (sheen.current) {
      const p = 50 - phi * 0.6;
      sheen.current.style.background = `linear-gradient(100deg, transparent ${p - 18}%, rgba(255,255,255,${(0.3 * a).toFixed(3)}) ${p}%, transparent ${p + 18}%)`;
    }
    if (floor.current) floor.current.style.transform = `translateX(-50%) scaleX(${Math.max(Math.abs(Math.cos(r)), 0.3).toFixed(3)})`;
  }, []);
  // … and the side it shows, when that changes
  const paint = useCallback((t: number) => {
    drawCard(t);
    const i = sideAt(t);
    if (i !== shown.current) { shown.current = i; setIdx(i); }
  }, [drawCard, sideAt]);

  const turnTo = useCallback((target: number, ms?: number) => {
    cancelAnimationFrame(frame.current);
    const from = theta.current, d = target - from, dur = ms ?? Math.min(720, 260 + Math.abs(d) * 2.4), t0 = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / dur);
      paint(from + d * ease(k));
      if (k < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }, [paint]);

  const goTo = (i: number) => {
    touched.current = true;
    let f = (i - sideAt(theta.current) + n) % n;
    if (f > n / 2) f -= n;                                       // the shorter way round
    turnTo(180 * (Math.round(theta.current / 180) - f));
  };

  useEffect(() => {
    drawCard(0);
    return () => cancelAnimationFrame(frame.current);
  }, [drawCard]);

  // first sight: a small turn and back
  useEffect(() => {
    const el = stage.current;
    if (!el || n < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let back = 0;
    const io = new IntersectionObserver(([en]) => {
      if (!en.isIntersecting || touched.current) return;
      io.disconnect();
      turnTo(-40, 650);
      back = window.setTimeout(() => { if (!touched.current) turnTo(0, 700); }, 760);
    }, { threshold: 0.6 });
    io.observe(el);
    return () => { io.disconnect(); clearTimeout(back); };
  }, [n, turnTo]);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    touched.current = true;
    cancelAnimationFrame(frame.current);
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, from: theta.current, k0: Math.round(theta.current / 180), moved: false, trail: [{ x: e.clientX, t: e.timeStamp }] };
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 6) d.moved = true;
    paint(d.from + (dx / ((card.current?.offsetWidth || 300) * 0.9)) * 180);   // a swipe across the card = one side
    d.trail.push({ x: e.clientX, t: e.timeStamp });
    if (d.trail.length > 6) d.trail.shift();
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) { turnTo(180 * (d.k0 - 1)); return; }        // a tap turns to the next side
    const a = d.trail[0], b = d.trail[d.trail.length - 1];
    const v = b.t > a.t ? ((b.x - a.x) / (b.t - a.t)) * (180 / ((card.current?.offsetWidth || 300) * 0.9)) : 0;   // degrees per ms
    const k = Math.max(d.k0 - 1, Math.min(d.k0 + 1, Math.round((theta.current + v * 180) / 180)));   // a flick goes one side on
    turnTo(180 * k);
  };
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    touched.current = true;
    turnTo(180 * (Math.round(theta.current / 180) + (e.key === 'ArrowRight' ? -1 : 1)));
  };

  if (n < 2) return null;

  return (
    <section className="rounded-2xl border border-hairline bg-white p-5 md:p-6">
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <h2 className="font-display font-bold text-lg text-ink">Turn it around</h2>
        <span className="text-xs text-muted">Swipe or tap the card</span>
      </div>

      <div
        ref={stage}
        role="group"
        aria-roledescription="turn card"
        aria-label={`${title}, ${LABEL[views[idx].view].toLowerCase()}. Swipe, tap or use the arrow keys to turn it.`}
        tabIndex={0}
        onKeyDown={onKey}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="relative mx-auto w-full max-w-[420px] aspect-[3/4] cursor-grab active:cursor-grabbing select-none rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-accent-start focus-visible:ring-offset-4"
        style={{ perspective: '1400px', touchAction: 'pan-y' }}
      >
        <div ref={floor} aria-hidden className="absolute left-1/2 -bottom-2 h-5 w-[78%] rounded-[50%] bg-ink/25 blur-lg" style={{ transform: 'translateX(-50%)' }} />
        <div ref={card} className="absolute inset-0 rounded-2xl overflow-hidden bg-surface shadow-[0_24px_50px_-18px_rgba(0,0,0,0.45)] will-change-transform">
          {views.map((v, i) => (
            <Image
              key={v.src}
              src={v.src}
              alt=""
              fill
              draggable={false}
              sizes="(max-width: 1024px) 90vw, 420px"
              className={cn('object-cover pointer-events-none', i === idx ? 'opacity-100' : 'opacity-0')}
            />
          ))}
          <div ref={shade} aria-hidden className="absolute inset-0 pointer-events-none" />
          <div ref={sheen} aria-hidden className="absolute inset-0 pointer-events-none" />
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {views.map((v, i) => (
          <button
            key={v.view}
            type="button"
            onClick={() => goTo(i)}
            aria-pressed={i === idx}
            className={cn(
              'px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors',
              i === idx ? 'bg-ink text-white border-ink' : 'border-hairline text-muted hover:text-ink hover:border-ink/30'
            )}
          >
            {LABEL[v.view]}
          </button>
        ))}
      </div>
    </section>
  );
}
