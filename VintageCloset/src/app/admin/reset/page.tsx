'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeSlash, Spinner, Key, CheckCircle } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { saveHint } from '@/lib/password-hint';
import { Button } from '@/components/ui/Button';

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-hairline bg-surface text-ink placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-accent-start/30 focus:border-accent-start transition-all';

// Opened from the "reset password" email: the link signs you in for this one step, then you choose a new password
export default function AdminResetPage() {
  const router = useRouter();
  const [ready, setReady] = useState<'checking' | 'ok' | 'expired'>('checking');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [hint, setHint] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let settled = false;
    const accept = (mail?: string | null) => {
      settled = true;
      setEmail(mail || '');
      setReady('ok');
    };
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') && session) accept(session.user.email);
    });
    supabase.auth.getSession().then(({ data }) => data.session && accept(data.session.user.email));
    // The link is single-use and expires; without a session after a few seconds it was used or too old
    const timer = window.setTimeout(() => !settled && setReady('expired'), 4000);
    return () => {
      sub.subscription.unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  const tooShort = password.length > 0 && password.length < 10;
  const mismatch = repeat.length > 0 && repeat !== password;
  const hintLeaks = hint.trim() !== '' && password.length > 0 && hint.toLowerCase().includes(password.toLowerCase());
  const canSave = password.length >= 10 && password === repeat && !hintLeaks && !saving;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (err) {
      setError(err.message.includes('different') ? 'Please choose a password you have not used before.' : err.message);
      return;
    }
    if (email) saveHint(email, hint);
    setDone(true);
    window.setTimeout(() => router.push('/admin'), 1600);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-start to-accent-end flex items-center justify-center">
            <Key size={32} weight="fill" className="text-white" />
          </div>
          <h1 className="text-2xl font-display font-bold text-ink">New password</h1>
          <p className="text-muted mt-1">{email ? `for ${email}` : 'Choose a new password for the admin'}</p>
        </div>

        <div className="bg-white rounded-2xl border border-hairline p-8 shadow-sm">
          {ready === 'checking' && (
            <div className="flex justify-center py-6"><Spinner size={28} className="animate-spin text-accent-start" /></div>
          )}

          {ready === 'expired' && (
            <div className="space-y-4 text-center">
              <p className="text-ink">This reset link was already used or has expired.</p>
              <Button className="w-full" onClick={() => router.push('/admin/login?forgot=1')}>Send a new link</Button>
            </div>
          )}

          {ready === 'ok' && done && (
            <div className="space-y-3 text-center py-4">
              <CheckCircle size={44} weight="fill" className="mx-auto text-emerald-500" />
              <p className="font-medium text-ink">Password saved. Opening the admin…</p>
            </div>
          )}

          {ready === 'ok' && !done && (
            <form onSubmit={save} className="space-y-5">
              {error && <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>}
              <div>
                <label htmlFor="pw" className="block text-sm font-medium text-ink mb-2">New password</label>
                <div className="relative">
                  <input id="pw" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required className={inputCls + ' pr-12'} />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'}>
                    {show ? <EyeSlash size={20} weight="bold" /> : <Eye size={20} weight="bold" />}
                  </button>
                </div>
                <p className={`text-xs mt-1.5 ${tooShort ? 'text-red-600' : 'text-muted'}`}>At least 10 characters.</p>
              </div>
              <div>
                <label htmlFor="pw2" className="block text-sm font-medium text-ink mb-2">Repeat it</label>
                <input id="pw2" type={show ? 'text' : 'password'} value={repeat} onChange={(e) => setRepeat(e.target.value)} autoComplete="new-password" required className={inputCls} />
                {mismatch && <p className="text-xs mt-1.5 text-red-600">The two passwords are not the same.</p>}
              </div>
              <div>
                <label htmlFor="hint" className="block text-sm font-medium text-ink mb-2">Hint <span className="text-muted font-normal">(optional)</span></label>
                <input id="hint" value={hint} maxLength={80} onChange={(e) => setHint(e.target.value)} placeholder="Something only you understand" className={inputCls} />
                <p className={`text-xs mt-1.5 ${hintLeaks ? 'text-red-600' : 'text-muted'}`}>
                  {hintLeaks ? 'The hint may not contain the password.' : 'Saved only in this browser; shown on the login when you ask for it.'}
                </p>
              </div>
              <Button type="submit" disabled={!canSave} className="w-full">
                {saving ? <><Spinner size={16} className="animate-spin mr-2" />Saving…</> : 'Save new password'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
