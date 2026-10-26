'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Suspense, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useT, StaffKey } from '@/lib/staff/i18n';
import { useStaff } from '@/lib/staff/session';
import { useLoad, must } from '@/lib/staff/useLoad';
import { db, euro, Product } from '@/lib/staff/db';
import { Btn, Empty, inputCls, Pill, Spinner, Tip, useToast } from '@/components/staff/ui';
import { cn } from '@/lib/utils';

type Tab = 'drafts' | 'live' | 'sold';
const TABS: { id: Tab; key: StaffKey; emoji: string }[] = [
  { id: 'drafts', key: 'tabDrafts', emoji: '📝' },
  { id: 'live', key: 'tabLive', emoji: '🟢' },
  { id: 'sold', key: 'tabSold', emoji: '💸' },
];

function ProductsList() {
  const { t } = useT();
  const { isManager } = useStaff();
  const toast = useToast();
  const params = useSearchParams();
  const router = useRouter();
  const tab = (params.get('tab') as Tab) || 'live';
  const [q, setQ] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, loading, reload } = useLoad(() => db.from('products').select('*').order('created_at', { ascending: false }).then(must<Product[]>));

  const counts = useMemo(() => {
    const all = data ?? [];
    return {
      drafts: all.filter((p) => p.is_draft).length,
      live: all.filter((p) => !p.is_draft && !p.is_sold).length,
      sold: all.filter((p) => !p.is_draft && p.is_sold).length,
    };
  }, [data]);

  const list = useMemo(() => {
    const all = data ?? [];
    const filtered = all.filter((p) => (tab === 'drafts' ? p.is_draft : tab === 'live' ? !p.is_draft && !p.is_sold : !p.is_draft && p.is_sold));
    const needle = q.trim().toLowerCase();
    return needle ? filtered.filter((p) => `${p.title} ${p.category} ${p.size} ${p.era ?? ''}`.toLowerCase().includes(needle)) : filtered;
  }, [data, tab, q]);

  const update = async (p: Product, patch: Partial<Product>, msg: string) => {
    setBusyId(p.id);
    const { error } = await db.from('products').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', p.id);
    setBusyId(null);
    if (error) toast('⚠️ ' + t('error'));
    else {
      toast(msg);
      reload();
    }
  };

  const remove = async (p: Product) => {
    setBusyId(p.id);
    const { error } = await db.from('products').delete().eq('id', p.id);
    setBusyId(null);
    setConfirmId(null);
    if (error) toast('⚠️ ' + t('error'));
    else {
      toast('🗑️ ' + p.title);
      reload();
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">🧥 {t('productsTitle')}</h1>
        <Link href="/staff/products/new" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-white hover:bg-ink/85">
          ✨ {t('newItem')}
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tb) => (
          <button
            key={tb.id}
            onClick={() => router.replace(`/staff/products?tab=${tb.id}`)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
              tab === tb.id ? 'bg-ink text-white' : 'bg-white text-muted hover:text-ink'
            )}
          >
            {tb.emoji} {t(tb.key)}
            <span className={cn('rounded-full px-2 text-xs', tab === tb.id ? 'bg-white/20' : 'bg-black/5')}>{counts[tb.id]}</span>
          </button>
        ))}
        <input id="product-search" className={cn(inputCls, 'ms-auto w-full sm:w-64')} placeholder={`🔎 ${t('search')}`} value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <Empty
          emoji={tab === 'drafts' ? '📝' : tab === 'sold' ? '💸' : '🧥'}
          text={t('noItems')}
          action={
            <Link href="/staff/products/new" className="text-sm font-semibold text-brand-plum underline-offset-2 hover:underline">
              ✨ {t('newItem')}
            </Link>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {list.map((p) => (
            <li key={p.id} className="group flex flex-col overflow-hidden rounded-2xl border border-hairline bg-white">
              <div className="relative aspect-[4/5] bg-black/5">
                {p.images?.[0] ? (
                  <Image src={p.images[0]} alt={p.title} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl" aria-hidden>
                    📷
                  </div>
                )}
                <div className="absolute start-2 top-2">
                  {p.is_draft ? <Pill tone="warn">{t('draftBadge')}</Pill> : p.is_sold ? <Pill tone="plum">{t('soldBadge')}</Pill> : <Pill tone="good">{t('liveBadge')}</Pill>}
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{p.title}</p>
                <p className="text-xs text-muted">
                  {euro(p.price)}
                  {p.discount ? ` · −${p.discount}%` : ''} · {p.size} · {p.category}
                </p>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                  <Link href={`/staff/products/new?id=${p.id}`} className="rounded-lg bg-black/5 px-2.5 py-1.5 text-xs font-semibold hover:bg-black/10">
                    ✏️ {t('edit')}
                  </Link>
                  {p.is_draft ? (
                    <Tip text={t('publishTip')}>
                      <button disabled={busyId === p.id} onClick={() => update(p, { is_draft: false }, t('savedPublished'))} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                        🚀 {t('publish')}
                      </button>
                    </Tip>
                  ) : p.is_sold ? (
                    <button disabled={busyId === p.id} onClick={() => update(p, { is_sold: false }, '🔁 ' + t('markAvailable'))} className="rounded-lg bg-black/5 px-2.5 py-1.5 text-xs font-semibold hover:bg-black/10">
                      🔁 {t('markAvailable')}
                    </button>
                  ) : (
                    <>
                      <Tip text={t('markSoldTip')}>
                        <button disabled={busyId === p.id} onClick={() => update(p, { is_sold: true }, '💸 ' + t('soldBadge'))} className="rounded-lg bg-brand-plum/10 px-2.5 py-1.5 text-xs font-semibold text-brand-plum hover:bg-brand-plum/20">
                          💸 {t('soldBadge')}
                        </button>
                      </Tip>
                      <Tip text={t('unpublishTip')}>
                        <button disabled={busyId === p.id} onClick={() => update(p, { is_draft: true }, '📝 ' + t('draftBadge'))} className="rounded-lg bg-black/5 px-2.5 py-1.5 text-xs font-semibold hover:bg-black/10">
                          📝
                        </button>
                      </Tip>
                    </>
                  )}
                  {isManager ? (
                    confirmId === p.id ? (
                      <div className="w-full space-y-1.5 rounded-lg bg-red-50 p-2">
                        <p className="text-xs text-red-700">{t('confirmDelete')}</p>
                        <div className="flex gap-1.5">
                          <Btn variant="danger" className="min-h-8 flex-1 px-2 text-xs" disabled={busyId === p.id} onClick={() => remove(p)}>
                            🗑️ {t('delete')}
                          </Btn>
                          <Btn variant="ghost" className="min-h-8 px-2 text-xs" onClick={() => setConfirmId(null)}>
                            {t('cancel')}
                          </Btn>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => setConfirmId(p.id)} className="rounded-lg px-2 py-1.5 text-xs text-red-600 hover:bg-red-50" aria-label={t('delete')}>
                        🗑️
                      </button>
                    )
                  ) : (
                    <Tip text={t('deleteTip')}>
                      <span className="cursor-not-allowed rounded-lg px-2 py-1.5 text-xs opacity-40" aria-label={t('deleteTip')}>
                        🔐
                      </span>
                    </Tip>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={null}>
      <ProductsList />
    </Suspense>
  );
}
