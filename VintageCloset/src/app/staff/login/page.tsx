'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStaff } from '@/lib/staff/session';
import { useT } from '@/lib/staff/i18n';
import { Btn, Field, inputCls, Spinner } from '@/components/staff/ui';

export default function StaffLogin() {
  const { t, toggle } = useT();
  const { ready, session, profile, signIn } = useStaff();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ready && session && profile) router.replace('/staff');
  }, [ready, session, profile, router]);

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-surface px-4">
      <div className="pointer-events-none absolute -top-32 -end-32 h-96 w-96 rounded-full bg-brand-teal/25 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-40 -start-24 h-96 w-96 rounded-full bg-brand-plum/15 blur-3xl" aria-hidden />
      <form
        className="relative w-full max-w-sm space-y-5 rounded-3xl border border-hairline bg-white/90 p-7 shadow-xl backdrop-blur"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError('');
          const res = await signIn(email, password);
          setBusy(false);
          if (res === 'ok') router.replace('/staff');
          else setError(res === 'bad-login' ? t('loginError') : t('notTeam'));
        }}
      >
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/vintage-closet-logo.png" alt="Vintage Closet" width={480} height={436} className="mx-auto h-auto w-32 -rotate-6" />
          <h1 className="mt-3 font-display text-xl font-bold">{t('loginTitle')} 👋</h1>
          <p className="mt-1 text-sm text-muted">{t('loginSub')}</p>
        </div>
        <Field label={t('email')}>
          <input id="staff-email" className={inputCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required dir="ltr" />
        </Field>
        <Field label={t('password')}>
          <input id="staff-pass" className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required dir="ltr" />
        </Field>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <Btn type="submit" variant="primary" className="w-full" disabled={busy}>
          {busy ? <Spinner className="border-white/40 border-t-white" /> : `${t('signIn')} →`}
        </Btn>
        <button type="button" onClick={toggle} className="block w-full text-center text-xs text-muted hover:text-ink">
          🌐 {t('language')}
        </button>
      </form>
    </div>
  );
}
