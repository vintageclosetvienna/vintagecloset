'use client';

import { useEffect, useMemo, useState } from 'react';
import { EnvelopeSimple, DownloadSimple } from '@phosphor-icons/react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface Subscriber {
  id: string;
  email: string;
  gender: string | null;
  status: 'pending' | 'confirmed' | 'unsubscribed';
  consent_at: string;
  confirmed_at: string | null;
  created_at: string;
  discount_codes: { code: string; usage_count: number; expires_at: string | null } | null;
}

const STATUS_STYLES: Record<Subscriber['status'], string> = {
  confirmed: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  unsubscribed: 'bg-gray-100 text-gray-500',
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString('de-AT') : '–';
}

export default function NewsletterAdminPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Subscriber['status']>('all');

  useEffect(() => {
    supabase
      .from('newsletter_subscribers' as never)
      .select('id, email, gender, status, consent_at, confirmed_at, created_at, discount_codes(code, usage_count, expires_at)')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) console.error('Error loading subscribers:', error);
        setSubscribers((data as unknown as Subscriber[]) || []);
        setIsLoading(false);
      });
  }, []);

  const stats = useMemo(() => ({
    confirmed: subscribers.filter(s => s.status === 'confirmed').length,
    pending: subscribers.filter(s => s.status === 'pending').length,
    used: subscribers.filter(s => (s.discount_codes?.usage_count ?? 0) > 0).length,
  }), [subscribers]);

  const visible = filter === 'all' ? subscribers : subscribers.filter(s => s.status === filter);

  // CSV of confirmed subscribers for any mailing tool
  function exportCsv() {
    const rows = subscribers
      .filter(s => s.status === 'confirmed')
      .map(s => [s.email, s.gender ?? '', s.confirmed_at ?? '', s.discount_codes?.code ?? ''].join(','));
    const blob = new Blob([['email,collection,confirmed_at,welcome_code', ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-ink flex items-center gap-2">
            <EnvelopeSimple size={28} weight="duotone" className="text-accent-start" />
            Newsletter
          </h1>
          <p className="text-muted mt-1">Sign-ups from the pop-up. Only confirmed emails may receive newsletters.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-hairline bg-white px-4 py-2 text-sm font-medium text-ink hover:border-muted"
        >
          <DownloadSimple size={16} /> Export confirmed (CSV)
        </button>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-4 max-w-xl">
        {[
          { label: 'Confirmed', value: stats.confirmed },
          { label: 'Waiting for confirmation', value: stats.pending },
          { label: 'Welcome codes used', value: stats.used },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-hairline bg-white p-4">
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4 flex gap-2">
        {(['all', 'confirmed', 'pending', 'unsubscribed'] as const).map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn('rounded-full px-3 py-1.5 text-sm capitalize', filter === f ? 'bg-ink text-white' : 'bg-white border border-hairline text-ink')}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-hairline bg-white">
        <table className="w-full text-sm">
          <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Collection</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Signed up</th>
              <th className="px-4 py-3">Welcome code</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">Loading…</td></tr>
            ) : visible.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No subscribers yet.</td></tr>
            ) : visible.map(s => (
              <tr key={s.id} className="border-t border-hairline">
                <td className="px-4 py-3 text-ink">{s.email}</td>
                <td className="px-4 py-3 capitalize">{s.gender ?? '–'}</td>
                <td className="px-4 py-3">
                  <span className={cn('rounded-full px-2 py-1 text-xs font-medium', STATUS_STYLES[s.status])}>{s.status}</span>
                </td>
                <td className="px-4 py-3 text-muted">{formatDate(s.created_at)}</td>
                <td className="px-4 py-3">
                  {s.discount_codes ? (
                    <span className="font-mono text-xs">
                      {s.discount_codes.code} · {s.discount_codes.usage_count > 0 ? 'used' : `until ${formatDate(s.discount_codes.expires_at)}`}
                    </span>
                  ) : '–'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
