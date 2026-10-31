'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/ui/SafeImage';
import { ArrowRight } from '@phosphor-icons/react';
import { getProductsBySlugs, getDiscountedPrice, type Product } from '@/lib/data';

/* Journal blocks (31 Oct): a paragraph that is a token becomes a block between the reading.
     [[video:/a.mp4|Caption]]                 a vertical short (autoplays muted, loops)
     [[photos:url1,url2,url3|Caption]]        party & vibe pictures
     [[fashion:url1,url2|Caption]]            fashion pictures, editorial
     [[shop:slug1,slug2,slug3|Shop the look]] a minimal strip of pieces from the shop (sold ones drop out) */

export type JournalBlockData = { kind: 'video' | 'photos' | 'fashion' | 'shop'; items: string[]; caption: string };

const TOKEN = /^\[\[(video|photos|fashion|shop):([^|\]]+)(?:\|([^\]]*))?\]\]$/;

export function parseJournalBlock(paragraph: string): JournalBlockData | null {
  const m = paragraph.trim().match(TOKEN);
  if (!m) return null;
  return {
    kind: m[1] as JournalBlockData['kind'],
    items: m[2].split(',').map((s) => s.trim()).filter(Boolean),
    caption: (m[3] || '').trim(),
  };
}

function Caption({ text }: { text: string }) {
  return text ? <p className="mt-3 text-xs uppercase tracking-[0.18em] text-muted text-center">{text}</p> : null;
}

function ShopStrip({ slugs, caption }: { slugs: string[]; caption: string }) {
  const [items, setItems] = useState<Product[] | null>(null);
  useEffect(() => {
    let on = true;
    getProductsBySlugs(slugs).then((p) => on && setItems(p)).catch(() => on && setItems([]));
    return () => { on = false; };
  }, [slugs]);
  if (items && items.length === 0) return null;
  return (
    <aside className="my-12 border-y border-hairline py-6">
      <div className="flex items-baseline justify-between mb-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-ink">{caption || 'Shop the look'}</p>
        <Link href="/new-arrivals" className="text-[11px] uppercase tracking-[0.18em] text-muted hover:text-ink transition-colors">All pieces</Link>
      </div>
      <div className="grid grid-cols-3 gap-3 md:gap-5">
        {(items || slugs.map(() => null)).slice(0, 3).map((p, i) =>
          p ? (
            <Link key={p.id} href={`/product/${p.slug}`} className="group block">
              <div className="relative aspect-[3/4] overflow-hidden bg-white">
                <SafeImage src={p.image} alt={p.title} fill sizes="(max-width: 768px) 30vw, 200px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>
              <p className="mt-2 text-[13px] leading-snug text-ink line-clamp-1">{p.title.trim()}</p>
              <p className="text-[12px] text-muted flex items-center gap-1">
                {getDiscountedPrice(p.price, p.discount)}{p.size ? ` · ${p.size}` : ''}
                <ArrowRight size={10} weight="bold" className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </p>
            </Link>
          ) : (
            <div key={i} className="aspect-[3/4] bg-white/60 animate-pulse" />
          ),
        )}
      </div>
    </aside>
  );
}

export function JournalBlock({ block }: { block: JournalBlockData }) {
  const { kind, items, caption } = block;

  if (kind === 'shop') return <ShopStrip slugs={items} caption={caption} />;

  if (kind === 'video') {
    return (
      <figure className="my-12">
        <div className={`grid gap-4 ${items.length > 1 ? 'grid-cols-2' : 'grid-cols-1 max-w-[340px] mx-auto'}`}>
          {items.map((src) => (
            <video key={src} src={src} className="w-full aspect-[9/16] rounded-2xl bg-ink object-cover shadow-lg"
              autoPlay muted loop playsInline controls preload="metadata" />
          ))}
        </div>
        <Caption text={caption} />
      </figure>
    );
  }

  if (kind === 'fashion') {
    // editorial: one tall picture, the rest stacked beside it
    const [first, ...rest] = items;
    return (
      <figure className="my-12">
        <div className={`grid gap-3 ${rest.length ? 'grid-cols-[1.4fr_1fr]' : 'grid-cols-1'}`}>
          <div className="relative aspect-[3/4] overflow-hidden rounded-sm bg-white">
            <SafeImage src={first} alt="" fill sizes="(max-width: 768px) 60vw, 420px" className="object-cover" />
          </div>
          {rest.length ? (
            <div className="grid gap-3" style={{ gridTemplateRows: `repeat(${Math.min(rest.length, 2)}, 1fr)` }}>
              {rest.slice(0, 2).map((src) => (
                <div key={src} className="relative overflow-hidden rounded-sm bg-white">
                  <SafeImage src={src} alt="" fill sizes="(max-width: 768px) 40vw, 300px" className="object-cover" />
                </div>
              ))}
            </div>
          ) : null}
        </div>
        <Caption text={caption} />
      </figure>
    );
  }

  // party & vibe pictures
  return (
    <figure className="my-12">
      <div className={`grid gap-3 ${items.length >= 3 ? 'grid-cols-3' : items.length === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {items.map((src) => (
          <div key={src} className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface">
            <SafeImage src={src} alt="" fill sizes="(max-width: 768px) 33vw, 260px" className="object-cover" />
          </div>
        ))}
      </div>
      <Caption text={caption} />
    </figure>
  );
}
