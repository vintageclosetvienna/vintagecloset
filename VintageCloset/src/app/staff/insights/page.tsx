'use client';

import { useMemo, useState } from 'react';
import { useT, StaffKey } from '@/lib/staff/i18n';
import { useLoad, must } from '@/lib/staff/useLoad';
import { db, euro, Order, Product } from '@/lib/staff/db';
import { Card, CardTitle, Help, Spinner } from '@/components/staff/ui';
import { cn } from '@/lib/utils';

const SOLD_STATUSES = ['paid', 'shipped', 'delivered'];
const TEAL = '#4CC2BA';
const PLUM = '#602140';

interface Data {
  now: number;
  orders: Order[];
  products: Product[];
  codes: { code: string; usage_count: number; is_active: boolean }[];
}

async function load(): Promise<Data> {
  const [orders, products, codes] = await Promise.all([
    db.from('orders').select('*').order('created_at').limit(2000).then(must<Order[]>),
    db.from('products').select('id,title,category,gender,price,is_sold,is_draft,created_at,updated_at').limit(5000).then(must<Product[]>),
    db.from('discount_codes').select('code,usage_count,is_active').order('usage_count', { ascending: false }).limit(8).then(must<{ code: string; usage_count: number; is_active: boolean }[]>),
  ]);
  return { now: Date.now(), orders, products, codes };
}

function Kpi({ label, value, tip, sub }: { label: string; value: string; tip?: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-hairline bg-white p-4">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
        {tip && <Help text={tip} />}
      </div>
      <div className="mt-2 font-display text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

function RevenueBars({ days, lang }: { days: { date: string; value: number; count: number }[]; lang: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((d) => d.value));
  const W = 720;
  const H = 200;
  const pad = 28;
  const bw = (W - pad) / days.length;
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));
  const h = hover !== null ? days[hover] : null;
  return (
    <div className="relative">
      <div className="h-6 text-sm">
        {h ? (
          <span>
            <b>{new Date(`${h.date}T12:00:00`).toLocaleDateString(lang === 'ar' ? 'ar' : 'de-AT', { weekday: 'short', day: 'numeric', month: 'short' })}</b> · {euro(h.value)} · {h.count}×
          </span>
        ) : (
          <span className="text-muted">↔</span>
        )}
      </div>
      <div className="overflow-x-auto" dir="ltr">
        <svg viewBox={`0 0 ${W} ${H + 22}`} className="block w-full min-w-[480px]" role="img" aria-label="Revenue per day">
          {ticks.map((tk) => {
            const y = H - (tk / max) * (H - 10);
            return (
              <g key={tk}>
                <line x1={pad} x2={W} y1={y} y2={y} stroke="rgba(12,17,20,0.08)" />
                <text x={pad - 4} y={y + 4} textAnchor="end" fontSize="10" fill="#4F5A63">
                  {tk}
                </text>
              </g>
            );
          })}
          {days.map((d, i) => {
            const bh = (d.value / max) * (H - 10);
            const x = pad + i * bw + bw * 0.15;
            return (
              <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onTouchStart={() => setHover(i)}>
                <rect x={pad + i * bw} y={0} width={bw} height={H} fill="transparent" />
                <rect x={x} y={H - bh} width={bw * 0.7} height={Math.max(bh, d.value ? 2 : 0)} rx={Math.min(4, bw * 0.3)} fill={hover === i ? PLUM : TEAL} />
              </g>
            );
          })}
          {days.map((d, i) =>
            i % Math.ceil(days.length / 8) === 0 ? (
              <text key={d.date} x={pad + i * bw + bw / 2} y={H + 16} textAnchor="middle" fontSize="10" fill="#4F5A63">
                {d.date.slice(8)}.{d.date.slice(5, 7)}
              </text>
            ) : null
          )}
        </svg>
      </div>
    </div>
  );
}

function HBars({ rows, format = (v: number) => String(v), color = TEAL }: { rows: { label: string; value: number }[]; format?: (v: number) => string; color?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li key={r.label} className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm">
          <span className="truncate text-muted">{r.label}</span>
          <span className="h-3 overflow-hidden rounded-full bg-black/5">
            <span className="block h-full rounded-full transition-all duration-700" style={{ width: `${(r.value / max) * 100}%`, background: color }} />
          </span>
          <span className="tabular-nums font-semibold">{format(r.value)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function InsightsPage() {
  const { t, lang } = useT();
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const { data, loading } = useLoad(load);

  const stats = useMemo(() => {
    if (!data) return null;
    const since = data.now - range * 86400_000;
    const inRange = data.orders.filter((o) => new Date(o.created_at).getTime() >= since);
    const sold = inRange.filter((o) => SOLD_STATUSES.includes(o.status));
    const revenue = sold.reduce((s, o) => s + Number(o.final_price || 0), 0);

    // Revenue per day (Vienna calendar days)
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' });
    const days: { date: string; value: number; count: number }[] = [];
    for (let i = range - 1; i >= 0; i--) days.push({ date: fmt.format(new Date(data.now - i * 86400_000)), value: 0, count: 0 });
    const byDate = new Map(days.map((d) => [d.date, d]));
    sold.forEach((o) => {
      const d = byDate.get(fmt.format(new Date(o.created_at)));
      if (d) {
        d.value += Number(o.final_price || 0);
        d.count++;
      }
    });

    const productById = new Map(data.products.map((p) => [p.id, p]));
    const cat = new Map<string, number>();
    sold.forEach((o) => {
      const c = (o.product_id && productById.get(o.product_id)?.category) || '—';
      cat.set(c, (cat.get(c) ?? 0) + 1);
    });

    const funnel = (['pending', 'paid', 'shipped', 'delivered', 'cancelled'] as const).map((s) => ({ s, n: inRange.filter((o) => o.status === s).length }));

    const live = data.products.filter((p) => !p.is_draft && !p.is_sold);
    const drafts = data.products.filter((p) => p.is_draft).length;
    const soldAll = data.products.filter((p) => p.is_sold).length;
    const published = data.products.filter((p) => !p.is_draft).length;

    const gender = (['women', 'men', 'unisex'] as const).map((g) => ({ label: t(g), value: live.filter((p) => p.gender === g).length }));

    const now = data.now;
    const age = [
      { label: '0–7', value: 0 },
      { label: '8–30', value: 0 },
      { label: '31–90', value: 0 },
      { label: '90+', value: 0 },
    ];
    live.forEach((p) => {
      const d = (now - new Date(p.created_at).getTime()) / 86400_000;
      age[d <= 7 ? 0 : d <= 30 ? 1 : d <= 90 ? 2 : 3].value++;
    });

    const sellDays: number[] = [];
    data.orders
      .filter((o) => SOLD_STATUSES.includes(o.status) && o.product_id)
      .forEach((o) => {
        const p = productById.get(o.product_id!);
        if (p) sellDays.push(Math.max(0, (new Date(o.created_at).getTime() - new Date(p.created_at).getTime()) / 86400_000));
      });

    return {
      revenue,
      orders: sold.length,
      avg: sold.length ? revenue / sold.length : 0,
      days,
      categories: [...cat.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 8),
      funnel,
      live: live.length,
      drafts,
      sellThrough: published ? soldAll / published : 0,
      avgDays: sellDays.length ? sellDays.reduce((a, b) => a + b, 0) / sellDays.length : null,
      gender,
      age,
    };
  }, [data, range, t]);

  const STATUS_LABEL: Record<string, StaffKey> = { pending: 'stPending', paid: 'stPaid', shipped: 'stShipped', delivered: 'stDelivered', cancelled: 'stCancelled' };
  const STATUS_COLOR: Record<string, string> = { pending: '#F2B84B', paid: TEAL, shipped: '#2E9C95', delivered: PLUM, cancelled: '#B9C0C5' };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">📈 {t('insightsTitle')}</h1>
          <p className="mt-1 text-sm text-muted">{t('insightsSub')}</p>
        </div>
        <div className="flex rounded-full bg-white p-1">
          {([7, 30, 90] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn('rounded-full px-4 py-1.5 text-sm font-semibold', range === r ? 'bg-ink text-white' : 'text-muted hover:text-ink')}
            >
              {t(r === 7 ? 'last7' : r === 30 ? 'last30' : 'last90')}
            </button>
          ))}
        </div>
      </div>

      {loading || !stats ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label={`💶 ${t('revenue')}`} value={euro(stats.revenue)} tip={t('revenueTip')} sub={`${stats.orders} ${t('ordersCount')}`} />
            <Kpi label={`🧾 ${t('avgOrder')}`} value={euro(stats.avg)} />
            <Kpi label={`🧥 ${t('itemsLive')}`} value={String(stats.live)} sub={`${stats.drafts} ${t('itemsDraft')}`} />
            <Kpi label={`📈 ${t('sellThrough')}`} value={`${Math.round(stats.sellThrough * 100)}%`} tip={t('sellThroughTip')} sub={stats.avgDays !== null ? `⏳ ${Math.round(stats.avgDays)} ${t('days')}` : undefined} />
          </div>

          <Card>
            <CardTitle>📊 {t('revenueByDay')}</CardTitle>
            {stats.orders ? <RevenueBars days={stats.days} lang={lang} /> : <p className="py-8 text-center text-sm text-muted">{t('noData')}</p>}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle>🏷️ {t('byCategory')}</CardTitle>
              {stats.categories.length ? <HBars rows={stats.categories} /> : <p className="text-sm text-muted">{t('noData')}</p>}
            </Card>
            <Card>
              <CardTitle>🚦 {t('orderFunnel')}</CardTitle>
              {stats.funnel.some((f) => f.n) ? (
                <>
                  <div className="flex h-5 overflow-hidden rounded-full bg-black/5">
                    {stats.funnel.map((f) => (f.n ? <span key={f.s} style={{ flex: f.n, background: STATUS_COLOR[f.s] }} title={`${t(STATUS_LABEL[f.s])}: ${f.n}`} /> : null))}
                  </div>
                  <ul className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    {stats.funnel.map((f) => (
                      <li key={f.s} className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ background: STATUS_COLOR[f.s] }} />
                        <span className="text-muted">{t(STATUS_LABEL[f.s])}</span>
                        <b className="ms-auto tabular-nums">{f.n}</b>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="text-sm text-muted">{t('noData')}</p>
              )}
            </Card>
            <Card>
              <CardTitle>👗 {t('byGender')}</CardTitle>
              <HBars rows={stats.gender} color={PLUM} />
            </Card>
            <Card>
              <CardTitle tip={t('daysToSellTip')}>⏳ {t('stockAge')}</CardTitle>
              <HBars rows={stats.age.map((a) => ({ label: `${a.label} ${t('days')}`, value: a.value }))} color="#2E9C95" />
            </Card>
          </div>

          {data && data.codes.length > 0 && (
            <Card>
              <CardTitle>🎟️ {t('topCodes')}</CardTitle>
              <HBars rows={data.codes.map((c) => ({ label: c.code, value: c.usage_count }))} color="#F2B84B" />
            </Card>
          )}
        </>
      )}
    </div>
  );
}
