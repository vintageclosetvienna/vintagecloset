'use client';

import { useMemo, useState } from 'react';
import type { DbProductDraft } from '@/lib/supabase';
import { CATEGORIES_BY_GENDER, ProductGender } from '@/lib/product-categories';
import { db, euro, slugify } from '@/lib/staff/db';
import { useT } from '@/lib/staff/i18n';
import { Btn, Field, Modal, Pill, Spinner, inputCls, useToast } from './ui';
import { cn } from '@/lib/utils';

// Drafts sent from the Vintage studio pipeline (Rennstern app on Sobhi's Mac) live in product_drafts, apart from the shop.
// The team checks photos, title and price here and puts them live: the draft becomes a product with the same id,
// so its photos stay where they are, and the draft row is removed.

// the photos carry ?v= while they are drafts; a product keeps the plain address
const plain = (url: string) => url.split('?')[0];

interface Edit {
  title: string;
  description: string;
  price: string;
  size: string;
  gender: ProductGender | '';
  category: string;
  era: string;
}

const toEdit = (d: DbProductDraft): Edit => ({
  title: d.title || '',
  description: d.description || '',
  price: d.price != null ? String(d.price) : '',
  size: d.size || '',
  gender: (d.gender as ProductGender) || '',
  category: d.category || '',
  era: d.era || '',
});

const parsePrice = (v: string) => parseFloat(v.replace(',', '.'));

/** Puts a pipeline draft live. 'ok', 'missing' (a field is empty) or 'error' */
export async function publishPipelineDraft(draft: DbProductDraft, edit: Edit = toEdit(draft)): Promise<'ok' | 'missing' | 'duplicate' | 'error'> {
  const price = parsePrice(edit.price);
  if (!edit.title.trim() || !(price > 0) || !edit.size.trim() || !edit.gender || !edit.category) return 'missing';
  const base = slugify(edit.title);
  const product = {
    id: draft.id,
    title: edit.title.trim(),
    description: edit.description.trim() || null,
    price,
    discount: 0,
    size: edit.size.trim(),
    category: edit.category,
    gender: edit.gender,
    era: edit.era.trim() || null,
    images: draft.images.map(plain),
    is_sold: false,
    is_draft: false,
  };
  for (let n = 1; n < 20; n++) {
    const { error } = await db.from('products').insert({ ...product, slug: n === 1 ? base : `${base}-${n}` });
    if (!error) {
      // Removing the draft needs the staff_drafts_and_team_media policy; until then the list hides drafts that are live
      await db.from('product_drafts').delete().eq('id', draft.id);
      return 'ok';
    }
    if (error.code !== '23505') return 'error';
    if (!/slug/.test(error.message)) return 'duplicate';
  }
  return 'duplicate';
}

export function PipelineDraftCard({ draft, onDone }: { draft: DbProductDraft; onDone: () => void }) {
  const { t } = useT();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const price = draft.price != null ? Number(draft.price) : 0;

  const quickPublish = async () => {
    if (!(price > 0)) {
      toast(t('priceMissing'));
      setOpen(true);
      return;
    }
    setBusy(true);
    const res = await publishPipelineDraft(draft);
    setBusy(false);
    if (res === 'ok') {
      toast(t('savedPublished'));
      onDone();
    } else if (res === 'missing') {
      toast('⚠️ ' + t('missingFields'));
      setOpen(true);
    } else toast('⚠️ ' + t('error'));
  };

  return (
    <li className="group flex flex-col overflow-hidden rounded-2xl border border-brand-plum/30 bg-white">
      <button onClick={() => setOpen(true)} className="relative block aspect-[4/5] bg-black/5">
        {draft.images?.[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={draft.images[0]} alt={draft.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl" aria-hidden>
            📷
          </div>
        )}
        <span className="absolute start-2 top-2 flex flex-wrap gap-1">
          <Pill tone="warn">{t('draftBadge')}</Pill>
          <Pill tone="plum">🎨 {t('fromStudioDraft')}</Pill>
        </span>
        {draft.ai_status === 'pending' && <span className="absolute bottom-2 start-2"><Pill tone="teal">🤖 …</Pill></span>}
      </button>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{draft.title || '—'}</p>
        <p className={cn('text-xs', price > 0 ? 'text-muted' : 'font-semibold text-amber-700')}>
          {price > 0 ? euro(price) : `💶 ${t('priceMissing').split('.')[0]}`} {draft.size ? `· ${draft.size}` : ''} {draft.category ? `· ${draft.category}` : ''}
        </p>
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          <button onClick={() => setOpen(true)} className="rounded-lg bg-black/5 px-2.5 py-1.5 text-xs font-semibold hover:bg-black/10">
            ✏️ {t('checkAndPublish')}
          </button>
          <button disabled={busy} onClick={quickPublish} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
            {busy ? <Spinner className="h-3 w-3 border-white/40 border-t-white" /> : '🚀'} {t('goLive')}
          </button>
        </div>
      </div>
      {open && <PublishDraftModal draft={draft} onClose={() => setOpen(false)} onDone={onDone} />}
    </li>
  );
}

function PublishDraftModal({ draft, onClose, onDone }: { draft: DbProductDraft; onClose: () => void; onDone: () => void }) {
  const { t } = useT();
  const toast = useToast();
  const [edit, setEdit] = useState<Edit>(() => toEdit(draft));
  const [cover, setCover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const categories = useMemo(() => (edit.gender ? CATEGORIES_BY_GENDER[edit.gender] : []), [edit.gender]);
  const set = <K extends keyof Edit>(k: K, v: Edit[K]) => setEdit((e) => ({ ...e, [k]: v, ...(k === 'gender' ? { category: '' } : {}) }));

  const save = async (live: boolean) => {
    setBusy(true);
    setError('');
    if (live) {
      const res = await publishPipelineDraft(draft, edit);
      setBusy(false);
      if (res === 'ok') {
        toast(t('savedPublished'));
        onClose();
        onDone();
      } else setError(res === 'missing' ? t('missingFields') : res === 'duplicate' ? t('duplicateTitle') : t('error'));
      return;
    }
    const price = parsePrice(edit.price);
    const { error: e } = await db
      .from('product_drafts')
      .update({
        title: edit.title.trim(),
        description: edit.description.trim() || null,
        price: price > 0 ? price : null,
        size: edit.size.trim(),
        gender: edit.gender || null,
        category: edit.category,
        era: edit.era.trim() || null,
      })
      .eq('id', draft.id);
    setBusy(false);
    if (e) setError(t('error'));
    else {
      toast(t('saved'));
      onClose();
      onDone();
    }
  };

  return (
    <Modal open onClose={onClose} title={`🎨 ${t('checkAndPublish')}`}>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="relative mx-auto aspect-[4/5] max-h-80 overflow-hidden rounded-2xl bg-black/5">
            {draft.images[cover] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.images[cover]} alt={edit.title} className="h-full w-full object-contain" />
            )}
          </div>
          {draft.images.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto">
              {draft.images.map((src, i) => (
                <button key={src} onClick={() => setCover(i)} className={cn('relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border-2', i === cover ? 'border-brand-teal' : 'border-transparent')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <Field label={t('title')}>
          <input className={inputCls} value={edit.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label={t('price')} tip={t('priceTip')}>
          <input className={cn(inputCls, 'text-lg font-semibold')} inputMode="decimal" placeholder="0" value={edit.price} onChange={(e) => set('price', e.target.value)} autoFocus={!(parsePrice(edit.price) > 0)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('size')}>
            <input className={inputCls} value={edit.size} onChange={(e) => set('size', e.target.value)} />
          </Field>
          <Field label={t('era')}>
            <input className={inputCls} value={edit.era} onChange={(e) => set('era', e.target.value)} />
          </Field>
          <Field label={t('gender')}>
            <select className={inputCls} value={edit.gender} onChange={(e) => set('gender', e.target.value as ProductGender | '')}>
              <option value="">{t('choose')}</option>
              <option value="women">{t('women')}</option>
              <option value="men">{t('men')}</option>
              <option value="unisex">{t('unisex')}</option>
            </select>
          </Field>
          <Field label={t('category')}>
            <select className={inputCls} value={edit.category} onChange={(e) => set('category', e.target.value)} disabled={!edit.gender}>
              <option value="">{t('choose')}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label={t('description')}>
          <textarea className={cn(inputCls, 'min-h-24')} value={edit.description} onChange={(e) => set('description', e.target.value)} />
        </Field>

        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Btn variant="primary" className="flex-1 bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={() => save(true)}>
            {busy ? <Spinner className="border-white/40 border-t-white" /> : '🚀'} {t('goLive')}
          </Btn>
          <Btn variant="soft" disabled={busy} onClick={() => save(false)}>
            💾 {t('saveDraft')}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}
