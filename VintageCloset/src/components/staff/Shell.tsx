'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStaff } from '@/lib/staff/session';
import { useT, StaffKey } from '@/lib/staff/i18n';
import { useWorkday } from '@/lib/staff/workday';
import { Btn, Field, inputCls, Modal, Pill, Spinner, Tip, useToast } from './ui';
import { cn } from '@/lib/utils';

const NAV: { href: string; key: StaffKey; emoji: string }[] = [
  { href: '/staff', key: 'navToday', emoji: '☀️' },
  { href: '/staff/products', key: 'navProducts', emoji: '🧥' },
  { href: '/staff/orders', key: 'navOrders', emoji: '📦' },
  { href: '/staff/studio', key: 'navStudio', emoji: '📸' },
  { href: '/staff/insights', key: 'navInsights', emoji: '📈' },
  { href: '/staff/team', key: 'navTeam', emoji: '🗓️' },
];

function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function formatDuration(ms: number, hoursLabel: string) {
  const mins = Math.max(0, Math.floor(ms / 60000));
  return `${Math.floor(mins / 60)}${hoursLabel} ${String(mins % 60).padStart(2, '0')}m`;
}

function ManagerUnlock({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useT();
  const { unlockManager } = useStaff();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  return (
    <Modal open={open} onClose={onClose} title={`🔐 ${t('managerUnlock')}`}>
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          const res = await unlockManager(email, password);
          setBusy(false);
          if (res === 'ok') {
            setPassword('');
            onClose();
            toast(`👑 ${t('managerMode')}`);
          } else setError(res === 'bad-login' ? t('loginError') : t('managerOnly'));
        }}
      >
        <p className="text-sm text-muted">{t('managerUnlockSub')}</p>
        <Field label={t('email')}>
          <input id="mgr-email" className={inputCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
        </Field>
        <Field label={t('password')}>
          <input id="mgr-pass" className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" />
        </Field>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Btn type="submit" variant="plum" disabled={busy} className="flex-1">
            {busy ? <Spinner className="border-white/40 border-t-white" /> : t('managerUnlock')}
          </Btn>
          <Btn variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Btn>
        </div>
      </form>
    </Modal>
  );
}

// Asked on every new working day; who worked last time continues with one tap
function WhoWorks() {
  const { t, lang } = useT();
  const { setWorker, lastWorker } = useStaff();
  const { freshDay } = useWorkday();
  const [name, setName] = useState('');
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface px-4">
      <form
        className="w-full max-w-sm space-y-5 rounded-3xl border border-hairline bg-white p-7 text-center shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) setWorker(name);
        }}
      >
        <div className="text-5xl" aria-hidden>
          🙋
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-plum">
          {freshDay ? t('newDayTitle') : new Date().toLocaleDateString(lang === 'ar' ? 'ar' : 'de-AT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Vienna' })}
        </p>
        <h1 className="font-display text-2xl font-bold">{t('whoWorks')}</h1>
        <p className="text-sm text-muted">{t('whoWorksTip')}</p>
        {lastWorker && (
          <Btn type="button" variant="soft" className="w-full" onClick={() => setWorker(lastWorker)}>
            🙋 {t('continueAs')} {lastWorker}
          </Btn>
        )}
        <input id="worker-name" className={cn(inputCls, 'text-center text-base')} placeholder={t('yourName')} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        <Btn type="submit" variant="primary" className="w-full" disabled={!name.trim()}>
          {t('letsGo')} →
        </Btn>
      </form>
    </div>
  );
}

export function StaffShell({ children }: { children: ReactNode }) {
  const { t, dir, toggle } = useT();
  const { ready, session, profile, isManager, worker, setWorker, shift, startShift, endShift, lockManager, signOut } = useStaff();
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const now = useNow(30_000);
  const [mgrOpen, setMgrOpen] = useState(false);
  const isLogin = pathname === '/staff/login';
  const { day } = useWorkday();
  // A new working day while the app is open: say so once; every page reloads by itself (useLoad follows the day)
  const shownDay = useRef(day);
  useEffect(() => {
    if (day === shownDay.current) return;
    shownDay.current = day;
    toast(`🌅 ${t('newDayTitle')}`);
  }, [day, toast, t]);

  useEffect(() => {
    if (ready && !isLogin && (!session || !profile)) router.replace('/staff/login');
  }, [ready, session, profile, isLogin, router]);

  if (isLogin) return <div dir={dir}>{children}</div>;

  if (!ready || !session || !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (!worker) return <div dir={dir}><WhoWorks /></div>;

  const shiftMs = shift ? now.getTime() - new Date(shift.started_at).getTime() : 0;
  const clock = now.toLocaleTimeString(dir === 'rtl' ? 'ar' : 'de-AT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Vienna' });

  return (
    <div dir={dir} className="min-h-dvh overflow-x-clip bg-surface pb-24 lg:pb-0 lg:ps-60">
      {/* Side nav (desktop) */}
      <aside className="fixed inset-y-0 start-0 z-40 hidden w-60 flex-col border-e border-hairline bg-white px-4 py-6 lg:flex">
        <Link href="/staff" className="mb-8 block px-2">
          <span className="sticker-text font-display text-2xl">Vintage</span>
          <span className="mt-1 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">{t('appName')}</span>
        </Link>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((n) => {
            const active = n.href === '/staff' ? pathname === '/staff' : pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  active ? 'bg-brand-teal/15 text-ink' : 'text-muted hover:bg-black/5 hover:text-ink'
                )}
              >
                <span aria-hidden>{n.emoji}</span>
                {t(n.key)}
              </Link>
            );
          })}
        </nav>
        <div className="space-y-2 border-t border-hairline pt-4 text-sm">
          <div className="flex items-center justify-between px-2">
            <span className="truncate font-medium">🙋 {worker}</span>
            <button className="text-xs text-muted underline-offset-2 hover:underline" onClick={() => setWorker('')}>
              {t('changeName')}
            </button>
          </div>
          <button className="w-full rounded-xl px-3 py-2 text-start text-muted hover:bg-black/5 hover:text-ink" onClick={toggle}>
            🌐 {t('language')}
          </button>
          <button
            className="w-full rounded-xl px-3 py-2 text-start text-muted hover:bg-black/5 hover:text-ink"
            onClick={async () => {
              await signOut();
              router.replace('/staff/login');
            }}
          >
            ↩︎ {t('signOut')}
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-hairline bg-surface/85 backdrop-blur" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3 sm:px-6">
          <span className="font-display text-lg font-bold tabular-nums">{clock}</span>
          <Tip text={t('shiftTip')} side="bottom">
            {shift ? (
              <button onClick={endShift} className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                {formatDuration(shiftMs, t('hours'))} · {t('shiftEnd')}
              </button>
            ) : (
              <button onClick={startShift} className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-brand-teal/20">
                ⏱️ {t('shiftStart')}
              </button>
            )}
          </Tip>
          {shift && shiftMs > 2 * 3600_000 && (
            <span className="hidden md:inline">
              <Pill tone="warn">{t('breakHint')}</Pill>
            </span>
          )}
          <div className="ms-auto flex items-center gap-2">
            <button onClick={toggle} className="rounded-full px-3 py-1.5 text-xs font-semibold text-muted hover:bg-black/5 lg:hidden">
              🌐 {t('language')}
            </button>
            {isManager ? (
              <div className="flex items-center gap-2">
                <Link href="/admin" className="hidden rounded-full bg-brand-plum/10 px-3 py-1.5 text-xs font-semibold text-brand-plum hover:bg-brand-plum/20 sm:inline-block">
                  {t('openAdmin')} ↗
                </Link>
                <Btn
                  variant="plum"
                  className="min-h-8 rounded-full px-3 text-xs"
                  onClick={async () => {
                    await lockManager();
                    toast(`🔒 ${t('managerLocked')}`);
                  }}
                >
                  👑 {t('managerLock')}
                </Btn>
              </div>
            ) : (
              <Tip text={t('managerTip')} side="bottom">
                <button onClick={() => setMgrOpen(true)} className="rounded-full border border-hairline bg-white px-3 py-1.5 text-xs font-semibold text-ink hover:border-brand-plum/40">
                  🔐 {t('manager')}
                </button>
              </Tip>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>

      {/* Bottom nav (phone / tablet) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-hairline bg-white/95 backdrop-blur lg:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {NAV.map((n) => {
          const active = n.href === '/staff' ? pathname === '/staff' : pathname.startsWith(n.href);
          return (
            <Link key={n.href} href={n.href} className={cn('flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium', active ? 'text-ink' : 'text-muted')}>
              <span className={cn('text-lg transition-transform', active && 'scale-110')} aria-hidden>
                {n.emoji}
              </span>
              {t(n.key)}
            </Link>
          );
        })}
      </nav>

      <ManagerUnlock open={mgrOpen} onClose={() => setMgrOpen(false)} />
    </div>
  );
}
