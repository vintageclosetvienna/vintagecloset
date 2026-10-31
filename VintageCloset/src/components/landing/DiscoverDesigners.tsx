'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { SafeImage } from '@/components/ui/SafeImage';
import { getDesignersWithPieces, type Designer } from '@/lib/designers';
import type { Product } from '@/lib/data';

/* Discover designers: one card per artist collective, brand or designer. Grey until their first piece is in the shop;
   then in colour, with the count, and a tap opens their pieces right there. */

function Mark({ d }: { d: Designer }) {
  if (d.logo) {
    return (
      <div className="absolute inset-0" style={{ background: d.wordmark.bg }}>
        <SafeImage src={d.logo} alt={`${d.name} logo`} fill sizes="320px" className="object-contain p-8 md:p-10" />
      </div>
    );
  }
  const font = d.wordmark.font === 'serif' ? 'font-serif tracking-[0.12em]' : d.wordmark.font === 'script' ? 'italic font-semibold' : 'font-display font-black uppercase tracking-tight';
  return (
    <div className="absolute inset-0 flex items-center justify-center px-4 text-center" style={{ background: d.wordmark.bg, color: d.wordmark.fg }}>
      <span className={`text-2xl md:text-3xl leading-none ${font}`} style={d.wordmark.font === 'script' ? { fontFamily: 'Georgia, serif' } : undefined}>{d.name}</span>
    </div>
  );
}

export function DiscoverDesigners() {
  const [rows, setRows] = useState<{ designer: Designer; pieces: Product[] }[]>([]);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    getDesignersWithPieces().then(setRows).catch(() => setRows([]));
  }, []);

  if (rows.length === 0) return null;
  const shown = rows.find((r) => r.designer.slug === open);

  return (
    <section className="px-4 md:px-6 py-12 md:py-16" aria-label="Discover designers">
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h2 className="font-display text-2xl md:text-3xl text-ink">Discover designers</h2>
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Collectives · brands · designers</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        {rows.map(({ designer: d, pieces }) => {
          const live = pieces.length > 0;
          return (
            <button
              key={d.slug}
              type="button"
              disabled={!live}
              onClick={() => setOpen(open === d.slug ? null : d.slug)}
              aria-expanded={open === d.slug}
              className={`text-left group ${live ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className={`relative aspect-[4/3] rounded-2xl overflow-hidden border border-hairline transition-all duration-500 ${live ? 'shadow-md group-hover:shadow-xl group-hover:-translate-y-0.5' : 'grayscale opacity-45'} ${open === d.slug ? 'ring-2 ring-brand-teal' : ''}`}>
                <Mark d={d} />
              </div>
              <p className="mt-3 text-sm font-medium text-ink">{d.name}</p>
              <p className="text-xs text-muted">{d.kind} · {live ? `${pieces.length} piece${pieces.length === 1 ? '' : 's'}` : 'coming soon'}</p>
            </button>
          );
        })}
      </div>
      <AnimatePresence initial={false}>
        {shown && (
          <motion.div
            key={shown.designer.slug}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 rounded-2xl bg-surface p-4 md:p-6">
              <p className="text-sm text-muted mb-4">
                {shown.designer.line}
                {shown.designer.site && (
                  <a href={shown.designer.site} target="_blank" rel="noopener noreferrer" className="ml-2 underline underline-offset-2 hover:text-ink">
                    {shown.designer.site.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                )}
              </p>
              <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
                {shown.pieces.map((p) => (
                  <Link key={p.id} href={`/product/${p.slug}`} className="flex-shrink-0 snap-start w-36 md:w-44">
                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-200">
                      <SafeImage src={p.image} alt={p.title} fill sizes="176px" className="object-cover" />
                    </div>
                    <p className="mt-2 text-xs text-ink line-clamp-2">{p.title}</p>
                    <p className="text-xs text-muted">{p.price}</p>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
