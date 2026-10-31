'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tray, X } from '@phosphor-icons/react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { draftsSeenAt, sentAt } from '@/lib/drafts-seen';

/*
 * New drafts note (31 Oct, his ask): after signing in, and whenever more arrive while the admin is open, a card pops up with the
 * pieces the Mac sent since you last opened Drafts. "Later" hides it until the next new ones; opening Drafts marks them seen.
 */

interface Row { id: string; title: string; images: string[]; updated_at: string; created_at: string }

const HIDDEN = 'vc.draftsNoteHidden';

export function DraftsNotice() {
  const pathname = usePathname();
  const [fresh, setFresh] = useState<Row[]>([]);

  const check = useCallback(async () => {
    if (!isSupabaseConfigured()) return;
    const { data } = await supabase.from('product_drafts').select('id, title, images, updated_at, created_at').order('updated_at', { ascending: false }).limit(60);
    const seen = draftsSeenAt();
    let hidden = 0;
    try { hidden = Number(sessionStorage.getItem(HIDDEN) || 0); } catch { /* fine */ }
    const rows = ((data || []) as Row[]).filter((d) => sentAt(d) > Math.max(seen, hidden));
    setFresh(rows);
  }, []);

  useEffect(() => {
    const first = setTimeout(check, 400);
    const t = setInterval(check, 60000);
    const onFocus = () => check();
    window.addEventListener('focus', onFocus);
    return () => { clearTimeout(first); clearInterval(t); window.removeEventListener('focus', onFocus); };
  }, [check]);

  if (!fresh.length || pathname?.startsWith('/admin/drafts')) return null;

  const later = () => {
    try { sessionStorage.setItem(HIDDEN, String(sentAt(fresh[0]))); } catch { /* fine */ }
    setFresh([]);
  };

  return (
    <div role="status" className="fixed bottom-5 right-5 z-[90] w-[340px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-hairline bg-white shadow-2xl p-4 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-full bg-accent-start/15 text-accent-start"><Tray size={18} weight="bold" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-ink">{fresh.length} new draft{fresh.length === 1 ? '' : 's'} from the Mac</p>
          <p className="text-xs text-muted mt-0.5 truncate">{fresh.slice(0, 3).map((d) => d.title || 'New piece').join(' · ')}</p>
        </div>
        <button type="button" onClick={later} aria-label="Later" className="text-muted hover:text-ink"><X size={16} /></button>
      </div>
      <div className="mt-3 flex gap-1.5">
        {fresh.slice(0, 5).map((d) => d.images?.[0] && (
          <div key={d.id} className="relative h-16 w-12 overflow-hidden rounded-md bg-surface">
            <Image src={d.images[0]} alt="" fill sizes="48px" className="object-cover" unoptimized />
          </div>
        ))}
        {fresh.length > 5 && <span className="self-center text-xs text-muted">+{fresh.length - 5}</span>}
      </div>
      <div className="mt-3 flex gap-2">
        <Link href="/admin/drafts" onClick={() => setFresh([])} className="flex-1 rounded-lg bg-ink px-3 py-2 text-center text-sm font-medium text-white hover:bg-ink/90">Open drafts</Link>
        <button type="button" onClick={later} className="rounded-lg border border-hairline px-3 py-2 text-sm text-muted hover:text-ink">Later</button>
      </div>
    </div>
  );
}
