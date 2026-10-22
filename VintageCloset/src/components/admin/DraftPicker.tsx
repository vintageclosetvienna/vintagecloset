'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Tray } from '@phosphor-icons/react';
import { supabase, isSupabaseConfigured, DbProductDraft } from '@/lib/supabase';

/*
 * The drafts sent from the Mac (Rennstern app → Vintage clothes → Publish), shown as photos: tap a piece to fill the form
 * with its graded photos and AI text. Hidden when there are no drafts (or the drafts table is not set up yet).
 */
export function DraftPicker({ onPick, pickedId }: { onPick: (d: DbProductDraft) => void; pickedId?: string }) {
  const [drafts, setDrafts] = useState<DbProductDraft[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = isSupabaseConfigured()
        ? await supabase.from('product_drafts').select('*').order('created_at', { ascending: false })
        : { data: [] };
      if (alive) setDrafts(((data || []) as DbProductDraft[]).filter((d) => d.images.length));
    })();
    return () => { alive = false; };
  }, []);

  if (!drafts.length) return null;

  return (
    <div className="bg-white rounded-xl border border-hairline p-4">
      <div className="flex items-center gap-2 mb-3 text-sm font-bold uppercase tracking-wider text-muted">
        <Tray size={16} weight="bold" /> From the Mac · {drafts.length}
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
        {drafts.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onPick(d)}
            title={[d.title, d.size, d.category].filter(Boolean).join(' · ')}
            className={`relative aspect-[3/4] rounded-lg overflow-hidden bg-surface border-2 transition-all hover:scale-[1.03] ${d.id === pickedId ? 'border-accent-start' : 'border-transparent'}`}
          >
            <Image src={d.images[0]} alt={d.title || 'Draft'} fill sizes="120px" className="object-cover" unoptimized />
            <span className="absolute right-1 bottom-1 text-[10px] px-1.5 rounded-full bg-black/60 text-white">{d.images.length}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
