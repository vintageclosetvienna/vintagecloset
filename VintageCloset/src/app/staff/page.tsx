'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useStaff } from '@/lib/staff/session';
import { useT, StaffKey } from '@/lib/staff/i18n';
import { useLoad, must } from '@/lib/staff/useLoad';
import { db, viennaToday, DailyCheck, EventRow, Note } from '@/lib/staff/db';
import { Btn, Card, CardTitle, Modal, Pill, Ring, Spinner, Tip, inputCls, useToast } from '@/components/staff/ui';
import { DayPlan, DEFAULT_DAY_PLAN, LOCKED_STEPS, MAX_CUSTOM_TASKS, customKey, loadDayPlan, saveDayPlan } from '@/lib/staff/day-plan';
import { cn } from '@/lib/utils';
import { useWorkday } from '@/lib/staff/workday';
import { TeamMedia, isVideo, loadTeamMedia, mediaSeenAt } from '@/lib/staff/media';

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
  plan: DayPlan;
  planReady: boolean;
  studioDrafts: number;
  media: TeamMedia[];
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
  const [toShip, pendingRecent, paidNew, pickups, studioNew, studioDone, drafts, createdToday, notesToday, shiftsToday, checks, events, pinned, planRow] = await Promise.all([
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
    // The day plan; a missing table (not set up yet) falls back to the default plan
    db.from('staff_settings').select('key').eq('key', 'day_plan').then((r) => !r.error, () => false),
  ]);
  // Drafts from the studio pipeline that are not live yet, and Sobhi's newest media (both optional)
  const [studioDraftRows, liveIds, media] = await Promise.all([
    db.from('product_drafts').select('id').then((r) => (r.error ? [] : ((r.data ?? []) as { id: string }[])), () => []),
    db.from('products').select('id').eq('is_draft', false).gte('created_at', new Date(Date.now() - 30 * 86400_000).toISOString()).then((r) => new Set(((r.data ?? []) as { id: string }[]).map((x) => x.id)), () => new Set<string>()),
    loadTeamMedia(12).then((r) => r.items, () => [] as TeamMedia[]),
  ]);
  const studioDrafts = studioDraftRows.filter((d) => !liveIds.has(d.id)).length;
  const plan = planRow ? await loadDayPlan() : DEFAULT_DAY_PLAN;
  return { toShip, pendingRecent, paidNew, pickups, studioNew, studioDone, drafts, createdToday, notesToday, shiftToday: shiftsToday > 0, checks, events, pinned, plan, planReady: planRow, studioDrafts, media };
}

type Phase = 'start' | 'morning' | 'midday' | 'afternoon' | 'evening' | 'anytime';
const PHASE_LABEL: Record<Phase, StaffKey> = {
  start: 'phaseStart',
  morning: 'phaseMorning',
  midday: 'phaseMidday',
  afternoon: 'phaseAfternoon',
  evening: 'phaseEvening',
  anytime: 'phaseAnytime',
};

/** Where in the day we are now (Vienna time) */
function phaseNow(hour: number): Phase {
  if (hour < 11) return 'morning';
  if (hour < 14) return 'midday';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

interface Step {
  key: string;
  phase: Phase;
  emoji: string;
  title: StaffKey | string;
  tip: StaffKey | string;
  custom?: boolean;
  done: boolean;
  badge?: string;
  href?: string;
  manual?: boolean;
  action?: () => void;
}

export default function TodayPage() {
  const { t, lang } = useT();
  const { worker, shift, startShift, isManager } = useStaff();
  const { freshDay, dismissFresh } = useWorkday();
  const toast = useToast();
  const { data, loading, reload } = useLoad(loadToday);
  const [busyKey, setBusyKey] = useState('');
  const [editing, setEditing] = useState(false);
  // Reset keeps the removed ticks for a few seconds, so one tap brings them back
  const [undoChecks, setUndoChecks] = useState<{ key: string; done_by: string | null }[] | null>(null);
  const label = (s: Step) => (s.custom ? s.title : t(s.title as StaffKey));
  const plan = data?.plan ?? DEFAULT_DAY_PLAN;
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

  const resetDay = async () => {
    if (!data?.checks.length || !window.confirm(t('resetDayConfirm'))) return;
    setBusyKey('reset');
    const before = data.checks.map((c) => ({ key: c.key, done_by: c.done_by ?? null }));
    const { error } = await db.from('daily_checks').delete().eq('day', viennaToday());
    setBusyKey('');
    if (error) return toast('⚠️ ' + t('error'));
    setUndoChecks(before);
    reload();
  };

  const undoReset = async () => {
    if (!undoChecks) return;
    const rows = undoChecks.map((c) => ({ day: viennaToday(), key: c.key, done_by: c.done_by }));
    setUndoChecks(null);
    await db.from('daily_checks').insert(rows);
    reload();
  };

  // The undo offer disappears after 8 seconds
  useEffect(() => {
    if (!undoChecks) return;
    const timer = window.setTimeout(() => setUndoChecks(null), 8000);
    return () => window.clearTimeout(timer);
  }, [undoChecks]);

  // Today's timeline: from opening the shop to the hand-over note. Ticks live per day (daily_checks.day), so every
  // working day starts empty.
  const draftsOpen = data ? data.drafts + data.studioDrafts : 0;
  const newMedia = data ? data.media.filter((m) => new Date(m.created_at).getTime() > mediaSeenAt()).length : 0;
  const steps: Step[] = data
    ? [
        { key: 'shift', phase: 'start' as Phase, emoji: '⏱️', title: 'stepShift', tip: 'stepShiftTip', done: !!shift || data.shiftToday, action: shift ? undefined : async () => { await startShift(); reload(); } },
        { key: 'prep', phase: 'morning' as Phase, emoji: '☕', title: 'taskPrep', tip: 'taskPrepTip', done: checked('prep'), manual: true },
        { key: 'sort-new', phase: 'morning' as Phase, emoji: '👕', title: 'taskSortNew', tip: 'taskSortNewTip', done: checked('sort-new'), manual: true, href: '/staff/studio', badge: data.studioNew ? `📸 ${data.studioNew}` : undefined },
        { key: 'drafts', phase: 'midday' as Phase, emoji: '🧥', title: 'taskDrafts', tip: 'taskDraftsTip', done: checked('drafts') || (draftsOpen === 0 && data.createdToday > 0), manual: true, href: '/staff/products?tab=drafts', badge: draftsOpen ? `${draftsOpen}` : undefined },
        { key: 'orders', phase: 'midday' as Phase, emoji: '📦', title: 'taskOrders', tip: 'taskOrdersTip', done: checked('orders') && data.toShip === 0, manual: true, href: '/staff/orders', badge: data.toShip + data.pickups + data.paidNew > 0 ? `${data.toShip + data.pickups}` : undefined },
        { key: 'story', phase: 'afternoon' as Phase, emoji: '📱', title: 'taskStory', tip: 'taskStoryTip', done: checked('story'), manual: true, href: '/staff/studio?tab=sobhi', badge: newMedia ? `🎁 ${newMedia}` : undefined },
        ...plan.custom.map((c): Step => ({ key: customKey(c), phase: 'anytime', emoji: c.emoji, title: c.title, tip: c.title, custom: true, manual: true, done: checked(customKey(c)) })),
        { key: 'note', phase: 'evening' as Phase, emoji: '📝', title: 'stepNote', tip: 'stepNoteTip', done: data.notesToday > 0, href: '/staff/team#notes' },
      ].filter((s) => !plan.hidden.includes(s.key))
    : [];
  const currentPhase = phaseNow(hour);

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
                  {nextStep.emoji} {label(nextStep)}
                </span>
              </p>
            )}
          </div>
          <div className="rounded-2xl bg-white p-3 text-ink">
            <Ring value={progress} label={t('progress')} size={110} />
          </div>
        </div>
      </section>

      {freshDay && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3" role="status">
          <span className="text-2xl" aria-hidden>🌅</span>
          <div className="flex-1">
            <p className="font-semibold">{t('newDayTitle')}</p>
            <p className="text-sm text-amber-900/80">{t('newDayText')}</p>
          </div>
          <Btn variant="ghost" className="min-h-8 px-2 text-xs" onClick={dismissFresh} aria-label={t('cancel')}>✕</Btn>
        </div>
      )}

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
          <CardTitle
            tip={t('timelineTip')}
            right={
              <div className="flex items-center gap-1">
                <Pill tone="teal">{doneCount}/{steps.length || 7}</Pill>
                {isManager && data && (
                  <>
                    <Tip text={t('editDayTip')}>
                      <Btn variant="ghost" className="min-h-8 px-2 text-xs" onClick={() => setEditing(true)}>✏️ {t('editDay')}</Btn>
                    </Tip>
                    <Tip text={t('resetDayTip')}>
                      <Btn variant="ghost" className="min-h-8 px-2 text-xs" disabled={!data.checks.length || busyKey === 'reset'} onClick={resetDay}>↺ {t('resetDay')}</Btn>
                    </Tip>
                  </>
                )}
              </div>
            }
          >
            🕘 {t('timeline')}
          </CardTitle>
          {loading && !data ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <ol className="relative space-y-1">
              {/* the line of the day */}
              <span className="absolute bottom-6 start-[22px] top-6 w-0.5 bg-gradient-to-b from-brand-teal/50 via-brand-plum/30 to-black/10" aria-hidden />
              {steps.map((s, i) => {
                const showPhase = i === 0 || steps[i - 1].phase !== s.phase;
                const isNow = s.phase === currentPhase;
                return (
                  <li key={s.key} className="relative">
                    {showPhase && (
                      <p className="relative ms-12 mb-1 mt-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted first:mt-0">
                        {t(PHASE_LABEL[s.phase])}
                        {isNow && <span className="rounded-full bg-brand-plum px-2 py-0.5 text-[10px] normal-case tracking-normal text-white">● {t('nowLabel')}</span>}
                      </p>
                    )}
                    <div
                      className={cn(
                        'relative flex items-start gap-3 rounded-2xl border px-2 py-2.5 transition',
                        s.done ? 'border-emerald-100 bg-emerald-50/60' : s === nextStep ? 'border-brand-teal bg-brand-teal/5 shadow-sm' : 'border-transparent bg-white'
                      )}
                    >
                      <span
                        className={cn(
                          'relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ring-4 ring-white',
                          s.done ? 'bg-emerald-500 text-white' : s === nextStep ? 'bg-brand-teal/20' : 'bg-black/5'
                        )}
                        aria-hidden
                      >
                        {s.done ? '✓' : s.emoji}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
                        <div className="min-w-0 flex-1 basis-[13rem]">
                          <Tip text={s.custom ? s.tip : t(s.tip as StaffKey)}>
                            <span tabIndex={0} className={cn('cursor-help text-sm font-semibold outline-none', s.done && 'text-emerald-800 line-through decoration-emerald-300')}>
                              {label(s)}
                            </span>
                          </Tip>
                          {!s.done && s === nextStep && !s.custom && <p className="mt-0.5 line-clamp-2 text-xs text-muted">{t(s.tip as StaffKey)}</p>}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          {s.badge && <Pill tone={s.done ? 'good' : 'warn'}>{s.badge}</Pill>}
                          {s.action && (
                            <Btn variant="primary" className="min-h-8 px-3 text-xs" onClick={s.action}>
                              {t('open')}
                            </Btn>
                          )}
                          {s.href && !s.action && (
                            <Link href={s.href} className="rounded-lg px-2 py-1 text-xs font-semibold text-muted hover:bg-black/5 hover:text-ink">
                              {t('open')} ↗
                            </Link>
                          )}
                          {s.manual && (
                            <Btn variant={s.done ? 'ghost' : 'soft'} className="min-h-8 px-3 text-xs" disabled={busyKey === s.key} onClick={() => toggleCheck(s.key)}>
                              {s.done ? t('undo') : t('markDone')}
                            </Btn>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        <div className="space-y-6">
          {undoChecks && (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-lg" role="status">
              <span>↺ {t('resetDone')}</span>
              <Btn variant="soft" className="min-h-8 bg-white/15 px-3 text-xs text-white hover:bg-white/25" onClick={undoReset}>{t('undo')}</Btn>
            </div>
          )}
          {/* New from Sobhi */}
          {data && newMedia > 0 && (
            <Card>
              <CardTitle right={<Link href="/staff/studio?tab=sobhi" className="text-xs font-semibold text-muted hover:text-ink">{t('open')} ↗</Link>}>
                🎁 {t('newFromSobhi')} <Pill tone="plum">{newMedia}</Pill>
              </CardTitle>
              <Link href="/staff/studio?tab=sobhi" className="grid grid-cols-3 gap-2">
                {data.media.slice(0, 3).map((m) => (
                  <span key={m.id} className="relative block aspect-square overflow-hidden rounded-xl bg-black/5">
                    {isVideo(m) ? (
                      <video src={`${m.url}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.url} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                    {isVideo(m) && <span className="absolute inset-0 flex items-center justify-center text-xl text-white drop-shadow" aria-hidden>▶</span>}
                  </span>
                ))}
              </Link>
            </Card>
          )}

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

      {editing && data && (
        <DayPlanEditor
          plan={plan}
          ready={data.planReady}
          builtIn={BUILT_IN_STEPS}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            toast('✅ ' + t('planSaved'));
            reload();
          }}
        />
      )}
    </div>
  );
}

// Built-in timeline tasks that the day plan can show or hide (order as on Today)
const BUILT_IN_STEPS: { key: string; emoji: string; title: StaffKey }[] = [
  { key: 'shift', emoji: '⏱️', title: 'stepShift' },
  { key: 'prep', emoji: '☕', title: 'taskPrep' },
  { key: 'sort-new', emoji: '👕', title: 'taskSortNew' },
  { key: 'drafts', emoji: '🧥', title: 'taskDrafts' },
  { key: 'orders', emoji: '📦', title: 'taskOrders' },
  { key: 'story', emoji: '📱', title: 'taskStory' },
  { key: 'note', emoji: '📝', title: 'stepNote' },
];

// Edit the shop's day: show/hide steps, the daily goal, own daily tasks. Saved for the whole team.
function DayPlanEditor({
  plan,
  ready,
  builtIn,
  onClose,
  onSaved,
}: {
  plan: DayPlan;
  ready: boolean;
  builtIn: typeof BUILT_IN_STEPS;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useT();
  const toast = useToast();
  const [draft, setDraft] = useState<DayPlan>(plan);
  const [newTitle, setNewTitle] = useState('');
  const [newEmoji, setNewEmoji] = useState('✅');
  const [saving, setSaving] = useState(false);

  const toggle = (key: string) =>
    setDraft((d) => ({ ...d, hidden: d.hidden.includes(key) ? d.hidden.filter((k) => k !== key) : [...d.hidden, key] }));

  const addTask = () => {
    const title = newTitle.trim();
    if (!title || draft.custom.length >= MAX_CUSTOM_TASKS) return;
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    setDraft((d) => ({ ...d, custom: [...d.custom, { id, emoji: newEmoji || '✅', title }] }));
    setNewTitle('');
  };

  const save = async () => {
    setSaving(true);
    const ok = await saveDayPlan(draft);
    setSaving(false);
    if (ok) onSaved();
    else toast('⚠️ ' + t('error'));
  };

  return (
    <Modal open onClose={onClose} title={t('dayPlan')}>
      <div className="space-y-5">
        <h2 className="font-display text-xl font-bold">✏️ {t('dayPlan')}</h2>
        {!ready && <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">{t('planNotSetUp')}</p>}

        <div className="space-y-2">
          <p className="text-sm font-semibold">{t('stepsShown')}</p>
          <ul className="space-y-1.5">
            {builtIn.map((s) => {
              const locked = LOCKED_STEPS.includes(s.key);
              const shown = locked || !draft.hidden.includes(s.key);
              return (
                <li key={s.key}>
                  <label className={cn('flex items-center gap-3 rounded-xl border px-3 py-2 text-sm transition', shown ? 'border-brand-teal/40 bg-brand-teal/5' : 'border-hairline bg-white opacity-60')}>
                    <input type="checkbox" className="h-4 w-4 accent-[#4CC2BA]" checked={shown} disabled={locked} onChange={() => toggle(s.key)} />
                    <span aria-hidden>{s.emoji}</span>
                    <span className="flex-1">{t(s.title)}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">{t('ownTasks')}</p>
          {draft.custom.length > 0 && (
            <ul className="space-y-1.5">
              {draft.custom.map((c) => (
                <li key={c.id} className="flex items-center gap-3 rounded-xl border border-hairline px-3 py-2 text-sm">
                  <span aria-hidden>{c.emoji}</span>
                  <span className="flex-1">{c.title}</span>
                  <Btn variant="ghost" className="min-h-8 px-2 text-xs" onClick={() => setDraft((d) => ({ ...d, custom: d.custom.filter((x) => x.id !== c.id) }))}>{t('delete')}</Btn>
                </li>
              ))}
            </ul>
          )}
          {draft.custom.length < MAX_CUSTOM_TASKS && (
            <div className="flex gap-2">
              <input className={cn(inputCls, 'w-14 text-center')} value={newEmoji} maxLength={4} onChange={(e) => setNewEmoji(e.target.value)} aria-label="Emoji" />
              <input
                className={inputCls}
                value={newTitle}
                maxLength={60}
                placeholder={t('taskPlaceholder')}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
              />
              <Btn variant="soft" onClick={addTask} disabled={!newTitle.trim()}>{t('add')}</Btn>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Btn variant="ghost" onClick={onClose}>{t('cancel')}</Btn>
          <Btn variant="primary" onClick={save} disabled={saving || !ready}>{saving ? <Spinner /> : t('savePlan')}</Btn>
        </div>
      </div>
    </Modal>
  );
}
