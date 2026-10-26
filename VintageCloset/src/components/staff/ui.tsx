'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/* ---------- Tooltip: friendly hint on hover / focus / long-press ---------- */
export function Tip({ text, children, side = 'top', className }: { text: string; children: ReactNode; side?: 'top' | 'bottom'; className?: string }) {
  return (
    <span className={cn('group/tip relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute start-1/2 z-50 w-max max-w-[16rem] -translate-x-1/2 rtl:translate-x-1/2 rounded-xl bg-ink px-3 py-2 text-xs leading-snug text-white opacity-0 shadow-lg transition-all duration-150',
          'group-hover/tip:opacity-100 group-focus-within/tip:opacity-100 group-hover/tip:translate-y-0',
          side === 'top' ? 'bottom-full mb-2 translate-y-1' : 'top-full mt-2 -translate-y-1'
        )}
      >
        {text}
      </span>
    </span>
  );
}

/* ---------- Help dot: small "?" with a tip ---------- */
export function Help({ text }: { text: string }) {
  return (
    <Tip text={text}>
      <span
        tabIndex={0}
        aria-label={text}
        className="inline-flex h-5 w-5 cursor-help items-center justify-center rounded-full bg-brand-teal/15 text-[11px] font-bold text-brand-plum outline-none focus-visible:ring-2 focus-visible:ring-brand-teal"
      >
        ?
      </span>
    </Tip>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-2xl border border-hairline bg-white p-5', className)}>{children}</section>;
}

export function CardTitle({ children, tip, right }: { children: ReactNode; tip?: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 font-display text-base font-bold text-ink">
        {children}
        {tip && <Help text={tip} />}
      </h2>
      {right}
    </div>
  );
}

type BtnVariant = 'primary' | 'ghost' | 'soft' | 'danger' | 'plum';

export function Btn({
  children,
  onClick,
  variant = 'soft',
  disabled,
  type = 'button',
  className,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  disabled?: boolean;
  type?: 'button' | 'submit';
  className?: string;
  title?: string;
}) {
  const styles: Record<BtnVariant, string> = {
    primary: 'bg-ink text-white hover:bg-ink/85',
    plum: 'bg-brand-plum text-white hover:bg-brand-plum/85',
    soft: 'bg-brand-teal/12 text-ink hover:bg-brand-teal/25',
    ghost: 'bg-transparent text-muted hover:bg-black/5 hover:text-ink',
    danger: 'bg-red-50 text-red-700 hover:bg-red-100',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-brand-teal disabled:cursor-not-allowed disabled:opacity-45',
        styles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

export function Pill({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warn' | 'bad' | 'teal' | 'plum' }) {
  const tones = {
    neutral: 'bg-black/5 text-muted',
    good: 'bg-emerald-50 text-emerald-700',
    warn: 'bg-amber-50 text-amber-800',
    bad: 'bg-red-50 text-red-700',
    teal: 'bg-brand-teal/15 text-[#16736d]',
    plum: 'bg-brand-plum/10 text-brand-plum',
  };
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold', tones[tone])}>{children}</span>;
}

/* ---------- Progress ring ---------- */
export function Ring({ value, size = 96, label }: { value: number; size?: number; label?: string }) {
  const pct = Math.max(0, Math.min(1, value));
  const r = (size - 12) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(12,17,20,0.08)" strokeWidth={10} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: 'stroke-dashoffset .6s ease' }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4CC2BA" />
            <stop offset="100%" stopColor="#602140" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute text-center">
        <div className="font-display text-xl font-bold tabular-nums">{Math.round(pct * 100)}%</div>
        {label && <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>}
      </div>
    </div>
  );
}

export function Empty({ emoji, text, action }: { emoji: string; text: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-hairline bg-white/60 px-6 py-10 text-center">
      <div className="text-4xl" aria-hidden>
        {emoji}
      </div>
      <p className="max-w-xs text-sm text-muted">{text}</p>
      {action}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <span className={cn('inline-block h-5 w-5 animate-spin rounded-full border-2 border-brand-teal/30 border-t-brand-teal', className)} aria-hidden />;
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-lg sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="rounded-full px-3 py-1 text-xl text-muted hover:bg-black/5" aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------- Toasts ---------- */
const ToastCtx = createContext<(msg: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<{ id: number; msg: string }[]>([]);
  const push = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, msg }]);
    window.setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[120] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
        {items.map((i) => (
          <div key={i.id} className="rounded-2xl bg-ink px-4 py-3 text-sm text-white shadow-xl">
            {i.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}

export const inputCls =
  'w-full rounded-xl border border-hairline bg-white px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/25';

export function Field({ label, tip, children }: { label: string; tip?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-2 text-sm font-medium text-ink">
        {label}
        {tip && <Help text={tip} />}
      </span>
      {children}
    </label>
  );
}
