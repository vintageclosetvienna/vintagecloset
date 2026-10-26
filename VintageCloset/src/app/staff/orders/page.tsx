'use client';

import Image from 'next/image';
import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT, StaffKey } from '@/lib/staff/i18n';
import { useLoad, must } from '@/lib/staff/useLoad';
import { db, euro, Order, OrderStatus, PickupCode } from '@/lib/staff/db';
import { Btn, Card, CardTitle, Empty, inputCls, Pill, Spinner, Tip, useToast } from '@/components/staff/ui';
import { cn } from '@/lib/utils';

const STATUS: { id: OrderStatus; key: StaffKey; tone: 'warn' | 'good' | 'teal' | 'plum' | 'neutral'; emoji: string }[] = [
  { id: 'pending', key: 'stPending', tone: 'warn', emoji: '⏳' },
  { id: 'paid', key: 'stPaid', tone: 'good', emoji: '💳' },
  { id: 'shipped', key: 'stShipped', tone: 'teal', emoji: '📦' },
  { id: 'delivered', key: 'stDelivered', tone: 'plum', emoji: '🏁' },
  { id: 'cancelled', key: 'stCancelled', tone: 'neutral', emoji: '✖️' },
];

function PickupDesk({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [found, setFound] = useState<(PickupCode & { image?: string | null }) | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const find = async () => {
    setBusy(true);
    setError('');
    setFound(null);
    const { data } = await db.from('pickup_codes').select('*').eq('code', code.trim().toUpperCase()).maybeSingle();
    const pc = data as PickupCode | null;
    if (!pc) setError(t('codeNotFound'));
    else if (!pc.active) setError(t('codeUsed'));
    else {
      let image: string | null = null;
      if (pc.order_id) {
        const { data: o } = await db.from('orders').select('product_image').eq('id', pc.order_id).maybeSingle();
        image = (o as { product_image: string | null } | null)?.product_image ?? null;
      }
      setFound({ ...pc, image });
    }
    setBusy(false);
  };

  const confirm = async () => {
    if (!found) return;
    setBusy(true);
    const now = new Date().toISOString();
    const { error: e1 } = await db.from('pickup_codes').update({ active: false, redeemed_at: now }).eq('id', found.id);
    if (!e1 && found.order_id) {
      await db.from('orders').update({ status: 'delivered', updated_at: now }).eq('id', found.order_id);
    }
    setBusy(false);
    if (e1) setError(t('error'));
    else {
      toast(t('pickupDone'));
      setFound(null);
      setCode('');
      onDone();
    }
  };

  return (
    <Card className="border-brand-teal/40 bg-gradient-to-br from-white to-brand-teal/5">
      <div id="pickup" className="scroll-mt-24" />
      <CardTitle tip={t('pickupTip')}>🛍️ {t('pickupTitle')}</CardTitle>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) find();
        }}
      >
        <input
          id="pickup-code"
          className={cn(inputCls, 'flex-1 text-center font-mono text-lg uppercase tracking-[0.3em]')}
          placeholder={t('pickupCode')}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          dir="ltr"
          autoComplete="off"
        />
        <Btn type="submit" variant="primary" disabled={busy || !code.trim()}>
          {busy && !found ? <Spinner className="border-white/40 border-t-white" /> : '🔎'} {t('find')}
        </Btn>
      </form>
      {error && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {found && (
        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-white p-3 shadow-sm">
          <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-black/5">
            {found.image && <Image src={found.image} alt="" fill sizes="64px" className="object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{found.product_title}</p>
            <p className="text-sm text-muted">
              {found.product_size} · {found.customer_name}
            </p>
            <p className="truncate text-xs text-muted" dir="ltr">
              {found.customer_email}
            </p>
          </div>
          <Btn variant="primary" onClick={confirm} disabled={busy}>
            ✅ {t('confirmPickup')}
          </Btn>
        </div>
      )}
    </Card>
  );
}

function OrdersList() {
  const { t, lang } = useT();
  const toast = useToast();
  const params = useSearchParams();
  const router = useRouter();
  const filter = (params.get('status') as OrderStatus | null) ?? null;
  const [busyId, setBusyId] = useState<string | null>(null);
  const { data, loading, reload } = useLoad(() => db.from('orders').select('*').order('created_at', { ascending: false }).limit(300).then(must<Order[]>));

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    (data ?? []).forEach((o) => (c[o.status] = (c[o.status] ?? 0) + 1));
    return c;
  }, [data]);
  const list = (data ?? []).filter((o) => !filter || o.status === filter);

  const setStatus = async (o: Order, status: OrderStatus) => {
    setBusyId(o.id);
    const { error } = await db.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', o.id);
    setBusyId(null);
    if (error) toast('⚠️ ' + t('error'));
    else {
      toast(`${STATUS.find((s) => s.id === status)?.emoji} ${t(STATUS.find((s) => s.id === status)!.key)}`);
      reload();
    }
  };

  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">📦 {t('ordersTitle')}</h1>
      <PickupDesk onDone={reload} />

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => router.replace('/staff/orders')}
          className={cn('rounded-full px-4 py-2 text-sm font-semibold', !filter ? 'bg-ink text-white' : 'bg-white text-muted hover:text-ink')}
        >
          {t('all')} <span className="opacity-70">{data?.length ?? 0}</span>
        </button>
        {STATUS.map((s) => (
          <button
            key={s.id}
            onClick={() => router.replace(`/staff/orders?status=${s.id}`)}
            className={cn('rounded-full px-4 py-2 text-sm font-semibold', filter === s.id ? 'bg-ink text-white' : 'bg-white text-muted hover:text-ink')}
          >
            {s.emoji} {t(s.key)} <span className="opacity-70">{counts[s.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <Empty emoji="📭" text={t('noOrders')} />
      ) : (
        <ul className="space-y-3">
          {list.map((o) => {
            const st = STATUS.find((s) => s.id === o.status) ?? STATUS[0];
            const isPickup = o.shipping_address?.startsWith('ABHOLUNG');
            return (
              <li key={o.id} className="flex flex-col gap-3 rounded-2xl border border-hairline bg-white p-4 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-black/5">
                    {o.product_image && <Image src={o.product_image} alt="" fill sizes="56px" className="object-cover" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{o.product_title}</p>
                      <Pill tone={st.tone}>
                        {st.emoji} {t(st.key)}
                      </Pill>
                      {isPickup && <Pill tone="teal">🛍️ {t('qaPickup')}</Pill>}
                    </div>
                    <p className="text-sm text-muted">
                      {euro(Number(o.final_price))} · {o.product_size} · {new Date(o.created_at).toLocaleString(lang === 'ar' ? 'ar' : 'de-AT', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {isPickup ? o.shipping_address : `${t('shipTo')}: ${o.customer_name}, ${o.shipping_address}, ${o.shipping_postal_code} ${o.shipping_city}, ${o.shipping_country}`}
                    </p>
                    {o.status === 'pending' && <p className="mt-1 text-xs font-semibold text-amber-700">{t('pendingWarn')}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {o.status === 'paid' && !isPickup && (
                    <Tip text={t('setShippedTip')}>
                      <Btn variant="primary" className="min-h-9 text-xs" disabled={busyId === o.id} onClick={() => setStatus(o, 'shipped')}>
                        📦 {t('setShipped')}
                      </Btn>
                    </Tip>
                  )}
                  {o.status === 'shipped' && (
                    <Btn className="min-h-9 text-xs" disabled={busyId === o.id} onClick={() => setStatus(o, 'delivered')}>
                      🏁 {t('setDelivered')}
                    </Btn>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="text-center text-xs text-muted">💡 {t('refundNote')}</p>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <OrdersList />
    </Suspense>
  );
}
