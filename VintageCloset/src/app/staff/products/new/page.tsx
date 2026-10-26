'use client';

import Image from 'next/image';
import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT, StaffKey } from '@/lib/staff/i18n';
import { useStaff } from '@/lib/staff/session';
import { useLoad, must } from '@/lib/staff/useLoad';
import { db, euro, slugify, uploadImage, Product, StudioPhoto } from '@/lib/staff/db';
import { authFetch } from '@/lib/auth-fetch';
import { CATEGORIES_BY_GENDER, AiProductDetails, ProductGender } from '@/lib/product-categories';
import { Btn, Card, Field, Help, inputCls, Modal, Pill, Spinner, Tip, useToast } from '@/components/staff/ui';
import { cn } from '@/lib/utils';

interface Form {
  title: string;
  description: string;
  size: string;
  era: string;
  gender: ProductGender | '';
  category: string;
  price: string;
  discount: string;
  images: string[];
}

const EMPTY: Form = { title: '', description: '', size: '', era: '', gender: '', category: '', price: '', discount: '0', images: [] };
const STEPS: { key: StaffKey; emoji: string }[] = [
  { key: 'wPhotos', emoji: '📸' },
  { key: 'wDetails', emoji: '🏷️' },
  { key: 'wPrice', emoji: '💶' },
  { key: 'wCheck', emoji: '✅' },
];

function StudioPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (photos: StudioPhoto[]) => void }) {
  const { t } = useT();
  const [sel, setSel] = useState<string[]>([]);
  const { data, loading } = useLoad(
    () => (open ? db.from('studio_photos').select('*').neq('status', 'used').order('created_at', { ascending: false }).limit(60).then(must<StudioPhoto[]>) : Promise.resolve([] as StudioPhoto[])),
    [open]
  );
  return (
    <Modal open={open} onClose={onClose} title={`✨ ${t('fromStudio')}`}>
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : !data?.length ? (
        <p className="py-6 text-center text-sm text-muted">{t('studioEmpty')}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {data.map((p) => {
            const on = sel.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => setSel((s) => (on ? s.filter((x) => x !== p.id) : [...s, p.id]))}
                className={cn('relative aspect-square overflow-hidden rounded-xl ring-offset-2', on && 'ring-2 ring-brand-teal')}
              >
                <Image src={p.result_url || p.url} alt="" fill sizes="150px" className="object-cover" />
                {p.result_url && <span className="absolute end-1 top-1 rounded-full bg-white/90 px-1.5 text-[10px]">✨</span>}
                {on && <span className="absolute inset-0 flex items-center justify-center bg-brand-teal/40 text-2xl text-white">✓</span>}
              </button>
            );
          })}
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <Btn
          variant="primary"
          className="flex-1"
          disabled={!sel.length}
          onClick={() => {
            onPick((data ?? []).filter((p) => sel.includes(p.id)));
            setSel([]);
            onClose();
          }}
        >
          {t('add')} ({sel.length})
        </Btn>
        <Btn variant="ghost" onClick={onClose}>
          {t('cancel')}
        </Btn>
      </div>
    </Modal>
  );
}

function Wizard() {
  const { t } = useT();
  const { worker } = useStaff();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const editId = params.get('id');
  const studioIds = params.get('studio');

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [usedStudio, setUsedStudio] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(!editId && !studioIds);
  const [uploading, setUploading] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const autoAi = useRef(false);

  // Load an existing product or studio photos passed in the link
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (editId) {
        const { data } = await db.from('products').select('*').eq('id', editId).single();
        const p = data as Product | null;
        if (!cancelled && p) {
          autoAi.current = true;
          setForm({
            title: p.title,
            description: p.description ?? '',
            size: p.size,
            era: p.era ?? '',
            gender: p.gender,
            category: p.category,
            price: String(p.price),
            discount: String(p.discount ?? 0),
            images: p.images ?? [],
          });
        }
      } else if (studioIds) {
        const ids = studioIds.split(',').filter(Boolean);
        const { data } = await db.from('studio_photos').select('*').in('id', ids);
        const photos = (data as StudioPhoto[] | null) ?? [];
        if (!cancelled) {
          setForm((f) => ({ ...f, images: photos.map((p) => p.result_url || p.url) }));
          setUsedStudio(photos.map((p) => p.id));
        }
      }
      if (!cancelled) setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [editId, studioIds]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const runAi = async () => {
    if (!form.images.length && !form.title) return;
    setAiBusy(true);
    setAiError('');
    try {
      const res = await authFetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: form.title, imageUrls: form.images }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || t('error'));
      const ai = data as AiProductDetails;
      setForm((f) => ({
        ...f,
        title: ai.title || f.title,
        description: ai.description || f.description,
        size: ai.size || f.size,
        era: ai.era || f.era,
        gender: ai.gender || f.gender,
        category: ai.category || (ai.gender ? '' : f.category),
      }));
      toast('🤖 ' + t('saved'));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : t('error'));
    } finally {
      setAiBusy(false);
    }
  };

  // Fill in once by itself when the first photos arrive on a new item
  useEffect(() => {
    if (!loaded || autoAi.current || form.images.length === 0 || form.title) return;
    autoAi.current = true;
    const id = window.setTimeout(() => runAi(), 0);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, form.images.length]);

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files).filter((x) => x.type.startsWith('image/'))) {
        const { url } = await uploadImage('product-images', f);
        urls.push(url);
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch {
      toast('⚠️ ' + t('error'));
    } finally {
      setUploading(false);
    }
  };

  const move = (i: number, dir: -1 | 1) =>
    setForm((f) => {
      const imgs = [...f.images];
      const j = i + dir;
      if (j < 0 || j >= imgs.length) return f;
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
      return { ...f, images: imgs };
    });

  const valid = form.title.trim() && form.price && Number(form.price) > 0 && form.size.trim() && form.gender && form.category;
  const finalPrice = Number(form.price || 0) * (1 - Number(form.discount || 0) / 100);

  const save = async (publish: boolean) => {
    if (!valid) {
      setSaveError(t('missingFields'));
      return;
    }
    setSaving(true);
    setSaveError('');
    const base = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      size: form.size.trim(),
      era: form.era.trim() || null,
      gender: form.gender,
      category: form.category,
      price: Number(form.price),
      discount: Math.max(0, Math.min(90, Math.round(Number(form.discount || 0)))),
      images: form.images,
      is_draft: !publish,
      updated_at: new Date().toISOString(),
    };
    let productId = editId;
    if (editId) {
      const { error } = await db.from('products').update(base).eq('id', editId);
      if (error) {
        setSaving(false);
        setSaveError(t('error'));
        return;
      }
    } else {
      let slug = slugify(base.title);
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await db
          .from('products')
          .insert({ ...base, slug, is_sold: false, created_by: worker || null })
          .select('id')
          .single();
        if (!error) {
          productId = (data as { id: string }).id;
          break;
        }
        if (error.code === '23505') {
          slug = `${slugify(base.title)}-${Math.random().toString(36).slice(2, 6)}`;
          continue;
        }
        setSaving(false);
        setSaveError(t('error'));
        return;
      }
      if (!productId) {
        setSaving(false);
        setSaveError(t('duplicateTitle'));
        return;
      }
    }
    if (usedStudio.length && productId) {
      await db.from('studio_photos').update({ status: 'used', product_id: productId, updated_at: new Date().toISOString() }).in('id', usedStudio);
    }
    setSaving(false);
    toast(publish ? t('savedPublished') : t('saved'));
    router.push(`/staff/products?tab=${publish ? 'live' : 'drafts'}`);
  };

  if (!loaded) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  const categories = form.gender ? CATEGORIES_BY_GENDER[form.gender] : [];

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="font-display text-2xl font-bold">{editId ? `✏️ ${t('wizardEditTitle')}` : `✨ ${t('wizardTitle')}`}</h1>

      {/* Stepper */}
      <ol className="grid grid-cols-4 gap-2">
        {STEPS.map((s, i) => (
          <li key={s.key}>
            <button
              onClick={() => setStep(i)}
              className={cn(
                'flex w-full flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-xs font-semibold transition',
                i === step ? 'border-ink bg-ink text-white' : i < step ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-hairline bg-white text-muted'
              )}
            >
              <span className="text-lg" aria-hidden>
                {i < step ? '✓' : s.emoji}
              </span>
              {t(s.key)}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="font-display font-bold">📸 {t('wPhotos')}</h2>
            <Help text={t('wPhotosTip')} />
          </div>
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFiles(e.dataTransfer.files);
            }}
            onClick={() => fileRef.current?.click()}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-brand-teal/50 bg-brand-teal/5 px-4 py-10 text-center transition hover:bg-brand-teal/10"
          >
            <span className="text-4xl" aria-hidden>
              {uploading ? '⏳' : '📷'}
            </span>
            <span className="text-sm font-semibold">{uploading ? t('uploading') : t('dropHere')}</span>
            <input ref={fileRef} id="product-files" type="file" accept="image/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tip text={t('fromStudioTip')}>
              <Btn onClick={() => setPickerOpen(true)}>✨ {t('fromStudio')}</Btn>
            </Tip>
          </div>
          {form.images.length > 0 && (
            <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {form.images.map((src, i) => (
                <li key={src + i} className="group relative aspect-square overflow-hidden rounded-xl bg-black/5">
                  <Image src={src} alt="" fill sizes="160px" className="object-cover" />
                  {i === 0 && <span className="absolute start-1 top-1 rounded-full bg-ink px-2 text-[10px] font-bold text-white">1</span>}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 to-transparent p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                    <button className="rounded px-1.5 text-white" onClick={() => move(i, -1)} aria-label="←">
                      ◀
                    </button>
                    <button className="rounded px-1.5 text-white" onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))} aria-label={t('remove')}>
                      ✕
                    </button>
                    <button className="rounded px-1.5 text-white" onClick={() => move(i, 1)} aria-label="→">
                      ▶
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {step === 1 && (
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display font-bold">🏷️ {t('wDetails')}</h2>
            <Tip text={t('aiFillTip')}>
              <Btn variant="plum" onClick={runAi} disabled={aiBusy || (!form.images.length && !form.title)}>
                {aiBusy ? <Spinner className="border-white/40 border-t-white" /> : '🤖'} {aiBusy ? t('aiWorking') : t('aiFill')}
              </Btn>
            </Tip>
          </div>
          {aiError && <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{aiError}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label={t('title')} tip={t('titleTip')}>
                <input id="p-title" className={inputCls} value={form.title} onChange={(e) => set('title', e.target.value)} maxLength={80} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field label={t('description')}>
                <textarea id="p-desc" className={cn(inputCls, 'min-h-28')} value={form.description} onChange={(e) => set('description', e.target.value)} />
              </Field>
            </div>
            <Field label={t('size')}>
              <input id="p-size" className={inputCls} value={form.size} onChange={(e) => set('size', e.target.value)} placeholder="M, W32 L34, EU 40" dir="ltr" />
            </Field>
            <Field label={t('era')}>
              <input id="p-era" className={inputCls} value={form.era} onChange={(e) => set('era', e.target.value)} placeholder="90s, Y2K" dir="ltr" />
            </Field>
            <Field label={t('gender')}>
              <div className="flex gap-2">
                {(['women', 'men', 'unisex'] as ProductGender[]).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, gender: g, category: CATEGORIES_BY_GENDER[g].includes(f.category) ? f.category : '' }))}
                    className={cn('flex-1 rounded-xl border px-2 py-2 text-sm font-semibold', form.gender === g ? 'border-ink bg-ink text-white' : 'border-hairline bg-white')}
                  >
                    {t(g)}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={t('category')}>
              <select id="p-cat" className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)} disabled={!form.gender}>
                <option value="">{t('choose')}</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <h2 className="mb-4 font-display font-bold">💶 {t('wPrice')}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('price')} tip={t('priceTip')}>
              <input id="p-price" className={inputCls} type="number" min="0" step="1" inputMode="decimal" value={form.price} onChange={(e) => set('price', e.target.value)} dir="ltr" />
            </Field>
            <Field label={t('discount')} tip={t('discountTip')}>
              <input id="p-discount" className={inputCls} type="number" min="0" max="90" step="5" value={form.discount} onChange={(e) => set('discount', e.target.value)} dir="ltr" />
            </Field>
          </div>
          {Number(form.price) > 0 && (
            <p className="mt-4 text-sm text-muted">
              → <span className="font-display text-2xl font-bold text-ink">{euro(finalPrice)}</span>
              {Number(form.discount) > 0 && <span className="ms-2 line-through">{euro(Number(form.price))}</span>}
            </p>
          )}
        </Card>
      )}

      {step === 3 && (
        <Card>
          <h2 className="mb-4 font-display font-bold">✅ {t('checkTitle')}</h2>
          <div className="grid gap-5 sm:grid-cols-[220px_1fr]">
            <div className="overflow-hidden rounded-2xl border border-hairline">
              <div className="relative aspect-[4/5] bg-black/5">
                {form.images[0] ? <Image src={form.images[0]} alt="" fill sizes="220px" className="object-cover" /> : <div className="flex h-full items-center justify-center text-4xl">📷</div>}
              </div>
              <div className="space-y-1 p-3">
                <p className="text-sm font-semibold">{form.title || '—'}</p>
                <p className="text-xs text-muted">
                  {euro(finalPrice)} · {form.size || '—'}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              {[t('checkList1'), t('checkList2'), t('checkList3')].map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-[#4CC2BA]" /> {c}
                </label>
              ))}
              <div className="flex flex-wrap gap-2 pt-2">
                {!valid && <Pill tone="warn">⚠️ {t('missingFields')}</Pill>}
              </div>
              {saveError && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{saveError}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                <Tip text={t('saveDraftTip')}>
                  <Btn onClick={() => save(false)} disabled={saving}>
                    💾 {t('saveDraft')}
                  </Btn>
                </Tip>
                <Tip text={t('publishTip')}>
                  <Btn variant="primary" onClick={() => save(true)} disabled={saving || !valid}>
                    {saving ? <Spinner className="border-white/40 border-t-white" /> : '🚀'} {t('saveAndPublish')}
                  </Btn>
                </Tip>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Btn variant="ghost" onClick={() => (step === 0 ? router.back() : setStep(step - 1))}>
          ← {t('back')}
        </Btn>
        {step < 3 && (
          <Btn variant="primary" onClick={() => setStep(step + 1)}>
            {t('next')} →
          </Btn>
        )}
      </div>

      <StudioPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(photos) => {
          setForm((f) => ({ ...f, images: [...f.images, ...photos.map((p) => p.result_url || p.url)] }));
          setUsedStudio((u) => [...u, ...photos.map((p) => p.id)]);
        }}
      />
    </div>
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={null}>
      <Wizard />
    </Suspense>
  );
}
