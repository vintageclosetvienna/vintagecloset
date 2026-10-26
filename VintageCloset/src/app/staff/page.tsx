'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useStaff } from '@/lib/staff/session';
import { useT, StaffKey } from '@/lib/staff/i18n';
import { useLoad, must } from '@/lib/staff/useLoad';
import { db, viennaToday, DailyCheck, EventRow, Note } from '@/lib/staff/db';
import { Btn, Card, CardTitle, Pill, Ring, Spinner, Tip, useToast } from '@/components/staff/ui';
import { cn } from '@/lib/utils';

const DAILY_GOAL = 3;

interface TodayData {
  toShip: number;
  pendingRecent: number;
  paidNew: number;
  pickups: number;
  studioNew: number;
  studioDone: number;
  drafts: number;
  createdToday: number;
  notesToday: number;
  shiftToday: boolean;
  checks: DailyCheck[];
  events: EventRow[];
  pinned: Note[];
}

async function loadToday(): Promise<TodayData> {
  const today = viennaToday();
  const startOfDay = new Date(`${today}T00:00:00`).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 86400_000).toISOString();
  const count = async (q: PromiseLike<{ count: number | null; error: { message: string } | null }>) => {
    const r = await q;
    if (r.error) throw new Error(r.error.message);
    return r.count ?? 0;
  };
  const head = { count: 'exact' as const, head: true };
  const [toShip, pendingRecent, paidNew, pickups, studioNew, studioDone, drafts, createdToday, notesToday, shiftsToday, checks, events, pinned] = await Promise.all([
    count(db.from('orders').select('id', head).eq('status', 'paid').not('shipping_address', 'ilike', 'ABHOLUNG%')),
    count(db.from('orders').select('id', head).eq('status', 'pending').gte('created_at', twoDaysAgo)),
    count(db.from('orders').select('id', head).eq('status', 'paid').gte('created_at', startOfDay)),
    count(db.from('pickup_codes').select('id', head).eq('active', true)),
    count(db.from('studio_photos').select('id', head).eq('status', 'new')),
    count(db.from('studio_photos').select('id', head).eq('status', 'done')),
    count(db.from('products').select('id', head).eq('is_draft', true)),
    count(db.from('products').select('id', head).gte('created_at', startOfDay)),
    count(db.from('staff_notes').select('id', head).gte('created_at', startOfDay)),
    count(db.from('staff_shifts').select('id', head).gte('started_at', startOfDay)),
    db.from('daily_checks').select('*').eq('day', today).then(must<DailyCheck[]>),
    db.from('events').select('id,slug,title,date,time,location,is_published').gte('date', today).order('date').limit(3).then(must<EventRow[]>),
    db.from('staff_notes').select('*').eq('pinned', true).eq('done', false).order('created_at', { ascending: false }).limit(3).then(must<Note[]>),
  ]);
  return { toShip, pendingRecent, paidNew, pickups, studioNew, studioDone, drafts, createdToday, notesToday, shiftToday: shiftsToday > 0, checks, events, pinned };
}

interface Step {
  key: string;
  emoji: string;
  title: StaffKey;
  tip: StaffKey;
  done: boolean;
  badge?: string;
  href?: string;
  manual?: boolean;
  action?: () => void;
}

export default function TodayPage() {
  const { t, lang } = useT();
  const { worker, shift, startShift } = useStaff();
  const toast = useToast();
  const { data, loading, reload } = useLoad(loadToday);
  const [busyKey, setBusyKey] = useState('');
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Europe/Vienna' }).format(new Date()));
  const greeting = hour < 11 ? t('goodMorning') : hour < 18 ? t('goodDay') : t('goodEvening');
  const motivation = useMemo(() => {
    const keys: StaffKey[] = ['motivation1', 'motivation2', 'motivation3', 'motivation4'];
    const day = Number(viennaToday().slice(-2));
    return t(keys[day % keys.length]);
  }, [t]);

  const checked = (key: string) => !!data?.checks.some((c) => c.key === key);

  const toggleCheck = async (key: string) => {
    setBusyKey(key);
    if (checked(key)) {
      await db.from('daily_checks').delete().eq('day', viennaToday()).eq('key', key);
    } else {
      const { error } = await db.from('daily_checks').insert({ day: viennaToday(), key, done_by: worker });
      if (!error) toast('✅ ' + t('markDone'));
    }
    setBusyKey('');
    reload();
  };

  const steps: Step[] = data
    ? [
        { key: 'shift', emoji: '⏱️', title: 'stepShift', tip: 'stepShiftTip', done: !!shift || data.shiftToday, action: shift ? undefined : async () => { await startShift(); reload(); } },
        { key: 'shop-check', emoji: '🔍', title: 'stepShopCheck', tip: 'stepShopCheckTip', done: checked('shop-check'), manual: true, href: '/' },
        { key: 'orders-checked', emoji: '💳', title: 'stepOrders', tip: 'stepOrdersTip', done: checked('orders-checked'), manual: true, href: '/staff/orders', badge: data.paidNew + data.pendingRecent > 0 ? `${data.paidNew + data.pendingRecent}` : undefined },
        { key: 'ship', emoji: '📦', title: 'stepShip', tip: 'stepShipTip', done: data.toShip === 0, href: '/staff/orders?status=paid', badge: data.toShip ? `${data.toShip}` : undefined },
        { key: 'pickups-ready', emoji: '🛍️', title: 'stepPickups', tip: 'stepPickupsTip', done: data.pickups === 0 || checked('pickups-ready'), manual: data.pickups > 0, href: '/staff/orders#pickup', badge: data.pickups ? `${data.pickups}` : undefined },
        { key: 'studio', emoji: '📸', title: 'stepStudio', tip: 'stepStudioTip', done: data.studioNew === 0, href: '/staff/studio', badge: data.studioNew ? `${data.studioNew}` : data.studioDone ? `✨ ${data.studioDone}` : undefined },
        { key: 'drafts', emoji: '🧥', title: 'stepDrafts', tip: 'stepDraftsTip', done: data.drafts === 0, href: '/staff/products?tab=drafts', badge: data.drafts ? `${data.drafts}` : undefined },
        { key: 'new', emoji: '🎯', title: 'stepNew', tip: 'stepNewTip', done: data.createdToday >= DAILY_GOAL, href: '/staff/products/new', badge: `${Math.min(data.createdToday, DAILY_GOAL)}/${DAILY_GOAL}` },
        { key: 'note', emoji: '📝', title: 'stepNote', tip: 'stepNoteTip', done: data.notesToday > 0, href: '/staff/team#notes' },
      ]
    : [];

  const doneCount = steps.filter((s) => s.done).length;
  const progress = steps.length ? doneCount / steps.length : 0;
  const nextStep = steps.find((s) => !s.done);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-ink p-6 text-white sm:p-8">
        <div className="pointer-events-none absolute -end-16 -top-20 h-64 w-64 rounded-full bg-brand-teal/40 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-24 end-40 h-56 w-56 rounded-full bg-brand-plum/60 blur-3xl" aria-hidden />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm text-white/70">
              {new Date().toLocaleDateString(lang === 'ar' ? 'ar' : 'de-AT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Vienna' })}
            </p>
            <h1 className="font-display text-3xl font-bold sm:text-4xl">
              {greeting}, {worker} 👋
            </h1>
            <p className="max-w-md text-white/80">{motivation}</p>
            {nextStep && (
              <p className="pt-2 text-sm">
                <span className="text-white/60">→ </span>
                <span className="font-semibold">
                  {nextStep.emoji} {t(nextStep.title)}
                </span>
              </p>
            )}
          </div>
          <div className="rounded-2xl bg-white p-3 text-ink">
            <Ring value={progress} label={t('progress')} size={110} />
          </div>
        </div>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { href: '/staff/products/new', emoji: '✨', key: 'qaNewItem' as StaffKey },
          { href: '/staff/orders#pickup', emoji: '🛍️', key: 'qaPickup' as StaffKey },
          { href: '/staff/studio', emoji: '📸', key: 'qaUpload' as StaffKey },
          { href: '/staff/team#notes', emoji: '📝', key: 'qaNote' as StaffKey },
        ].map((q) => (
          <Link
            key={q.href}
            href={q.href}
            className="group flex items-center gap-3 rounded-2xl border border-hairline bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-teal hover:shadow-md"
          >
            <span className="text-2xl transition-transform group-hover:scale-110" aria-hidden>
              {q.emoji}
            </span>
            <span className="text-sm font-semibold">{t(q.key)}</span>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        {/* Pipeline */}
        <Card>
          <CardTitle tip={t('pipelineTip')} right={<Pill tone="teal">{doneCount}/{steps.length || 9}</Pill>}>
            {t('pipeline')}
          </CardTitle>
          {loading && !data ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <ol className="relative space-y-2">
              {steps.map((s, i) => (
                <li
                  key={s.key}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-3 py-3 transition',
                    s.done ? 'border-emerald-100 bg-emerald-50/60' : s === nextStep ? 'border-brand-teal bg-brand-teal/5 shadow-sm' : 'border-hairline bg-white'
                  )}
                >
                  <span
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg',
                      s.done ? 'bg-emerald-500 text-white' : 'bg-black/5'
                    )}
                    aria-hidden
                  >
                    {s.done ? '✓' : s.emoji}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Tip text={t(s.tip)}>
                      <span tabIndex={0} className={cn('cursor-help text-sm font-semibold outline-none', s.done && 'text-emerald-800')}>
                        {i + 1}. {t(s.title)}
                      </span>
                    </Tip>
                  </div>
                  {s.badge && <Pill tone={s.done ? 'good' : 'warn'}>{s.badge}</Pill>}
                  <div className="flex shrink-0 items-center gap-1">
                    {s.action && (
                      <Btn variant="primary" className="min-h-8 px-3 text-xs" onClick={s.action}>
                        {t('open')}
                      </Btn>
                    )}
                    {s.href && !s.action && (
                      <Link href={s.href} target={s.href === '/' ? '_blank' : undefined} className="rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-black/5 hover:text-ink">
                        {t('open')} ↗
                      </Link>
                    )}
                    {s.manual && (
                      <Btn variant={s.done ? 'ghost' : 'soft'} className="min-h-8 px-3 text-xs" disabled={busyKey === s.key} onClick={() => toggleCheck(s.key)}>
                        {s.done ? t('undo') : t('markDone')}
                      </Btn>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <div className="space-y-6">
          {/* Pinned notes */}
          <Card>
            <CardTitle tip={t('notesTip')} right={<Link href="/staff/team#notes" className="text-xs font-semibold text-muted hover:text-ink">{t('open')} ↗</Link>}>
              📌 {t('notes')}
            </CardTitle>
            {data?.pinned.length ? (
              <ul className="space-y-2">
                {data.pinned.map((n) => (
                  <li key={n.id} className="rounded-xl bg-amber-50 px-3 py-2 text-sm">
                    <p className="whitespace-pre-wrap">{n.body}</p>
                    {n.author_name && <p className="mt-1 text-xs text-muted">— {n.author_name}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t('writeNote')}</p>
            )}
          </Card>

          {/* Events */}
          <Card>
            <CardTitle>🎉 {t('nextEvents')}</CardTitle>
            {data?.events.length ? (
              <ul className="space-y-3">
                {data.events.map((e) => {
                  const d = new Date(`${e.date}T12:00:00`);
                  return (
                    <li key={e.id} className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-plum text-white">
                        <span className="text-[10px] uppercase">{d.toLocaleDateString(lang === 'ar' ? 'ar' : 'de-AT', { month: 'short' })}</span>
                        <span className="font-display text-lg font-bold leading-none">{d.getDate()}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{e.title}</p>
                        <p className="truncate text-xs text-muted">
                          {e.time ? `${e.time} · ` : ''}
                          {e.location}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-sm text-muted">{t('noEvents')}</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
