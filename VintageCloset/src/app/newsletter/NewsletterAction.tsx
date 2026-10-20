'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, Copy, CircleNotch } from '@phosphor-icons/react';

// Button pages for the email links (a click is needed, so link scanners can't trigger them)
export function NewsletterAction({ mode }: { mode: 'confirm' | 'unsubscribe' }) {
  const token = useSearchParams().get('token') || '';
  const [state, setState] = useState<'idle' | 'working' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ code: string; expiresAt: string; percent: number } | null>(null);
  const [copied, setCopied] = useState(false);

  async function run() {
    setState('working');
    setError(null);
    try {
      const res = await fetch(`/api/newsletter/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      if (mode === 'confirm') {
        setResult(data);
        try { localStorage.setItem('vc-welcome-code', data.code); } catch { /* storage blocked */ }
      }
      setState('done');
    } catch (err) {
      setState('idle');
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    }
  }

  if (!token) {
    return <p className="text-muted">This link is incomplete. Please open it again from your email.</p>;
  }

  if (state === 'done' && mode === 'unsubscribe') {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-medium tracking-tight text-ink">You are unsubscribed</h1>
        <p className="text-muted">You won&apos;t get newsletter emails from us anymore.</p>
        <Link href="/" className="inline-block text-ink underline underline-offset-4">Back to the shop</Link>
      </div>
    );
  }

  if (state === 'done' && result) {
    const until = new Date(result.expiresAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    return (
      <div className="space-y-5">
        <h1 className="text-3xl font-medium tracking-tight text-ink">Welcome! {result.percent}% off is yours</h1>
        <p className="text-muted">Your personal code (we also emailed it to you):</p>
        <button
          type="button"
          onClick={() => { navigator.clipboard?.writeText(result.code); setCopied(true); }}
          className="inline-flex items-center gap-3 rounded-2xl border border-brand-plum/20 bg-white px-6 py-4 text-2xl font-bold tracking-widest text-brand-plum"
        >
          {result.code}
          {copied ? <Check size={20} /> : <Copy size={20} />}
        </button>
        <p className="text-sm text-muted">Valid once until {until}, with the email you signed up with. It&apos;s already filled in at checkout on this device.</p>
        <Link href="/new-arrivals" className="inline-block rounded-full bg-ink px-6 py-3 text-sm font-medium text-white">Shop new arrivals</Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-3xl font-medium tracking-tight text-ink">
        {mode === 'confirm' ? 'Confirm your email' : 'Unsubscribe from the newsletter'}
      </h1>
      <p className="text-muted">
        {mode === 'confirm'
          ? 'One click and your personal welcome code is ready.'
          : 'Click below and we will stop sending you newsletter emails.'}
      </p>
      <button
        type="button"
        onClick={run}
        disabled={state === 'working'}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white disabled:opacity-50"
      >
        {state === 'working' && <CircleNotch size={14} className="animate-spin" />}
        {mode === 'confirm' ? 'Confirm and get my code' : 'Unsubscribe'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
