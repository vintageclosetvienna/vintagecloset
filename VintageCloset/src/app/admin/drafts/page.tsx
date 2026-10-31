'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { CheckCircle, Sparkle, Trash, Tray } from '@phosphor-icons/react';
import { FormInput, FormSelect, FormTextarea } from '@/components/admin';
import { Button } from '@/components/ui/Button';
import { supabase, isSupabaseConfigured, DbProductDraft } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import { CATEGORIES_BY_GENDER, ProductGender, AiProductDetails } from '@/lib/product-categories';

/*
 * Drafts: pieces sent from the Rennstern app (Vintage clothes pipeline → Publish). Photos are already graded and framed
 * for the shop; the website's AI wrote title, description and era. You set the price, check the text, then Publish:
 * the draft becomes a product (same id, so the photos stay where they are). Nothing is in the shop before that.
 */

const GENDER_OPTIONS = [
  { value: 'women', label: 'Women' },
  { value: 'men', label: 'Men' },
  { value: 'unisex', label: 'Unisex' },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

// the photos carry ?v= while they are drafts (sending again replaces them); a product keeps the plain address
const plain = (url: string) => url.split('?')[0];

interface Edit {
  title: string;
  description: string;
  price: string;
  size: string;
  gender: string;
  category: string;
  era: string;
}

const toEdit = (d: DbProductDraft): Edit => ({
  title: d.title || '',
  description: d.description || '',
  price: d.price != null ? String(d.price) : '',
  size: d.size || '',
  gender: d.gender || '',
  category: d.category || '',
  era: d.era || '',
});

// accept all / discard all (his ask 31 Oct): the page sends one signal, every card in scope acts on its own edits
interface Bulk { kind: 'publish' | 'discard'; group: string | null; n: number }

const groupOf = (d: DbProductDraft) => d.category || 'Not sorted yet';

function DraftCard({ draft, onDone, bulk, onBulk }: { draft: DbProductDraft; onDone: () => void; bulk: Bulk | null; onBulk: (r: 'done' | 'skipped') => void }) {
  const [edit, setEdit] = useState<Edit>(() => toEdit(draft));
  const [busy, setBusy] = useState<'' | 'publish' | 'ai' | 'discard'>('');
  const [error, setError] = useState<string | null>(null);
  const [cover, setCover] = useState(0);

  // the AI may still be writing when the page opens: take its text when it lands, as long as you have not typed
  useEffect(() => { setEdit((e) => (e.title ? e : { ...toEdit(draft), price: e.price })); }, [draft]);

  const categories = useMemo(
    () => (edit.gender ? CATEGORIES_BY_GENDER[edit.gender as ProductGender] : []).map((c) => ({ value: c, label: c })),
    [edit.gender]
  );
  const price = parseFloat(edit.price.replace(',', '.'));
  const valid = edit.title && price > 0 && edit.size && edit.gender && edit.category;
  const set = (k: keyof Edit, v: string) => setEdit((e) => ({ ...e, [k]: v, ...(k === 'gender' ? { category: '' } : {}) }));

  const rewrite = async () => {
    setBusy('ai'); setError(null);
    try {
      const r = await authFetch('/api/generate-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: edit.title, imageUrls: draft.images.slice(0, 6) }),
      });
      const ai = (await r.json()) as AiProductDetails & { error?: string };
      if (ai.error) throw new Error(ai.error);
      setEdit((e) => ({
        ...e,
        title: ai.title || e.title,
        description: ai.description || e.description,
        era: ai.era || e.era,
        size: e.size || ai.size,
        gender: ai.gender || e.gender,
        category: ai.gender ? ai.category : e.category,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The AI did not answer.');
    } finally {
      setBusy('');
    }
  };

  const missing = [!edit.title && 'title', !(price > 0) && 'price', !edit.size && 'size', !edit.gender && 'gender', !edit.category && 'category'].filter(Boolean) as string[];
  const publish = async () => {
    if (!valid) { setError(`Still needed to publish: ${missing.join(', ')}.`); return false; }
    setBusy('publish'); setError(null);
    const base = generateSlug(edit.title) || 'vintage-piece';
    const product = {
      id: draft.id,
      title: edit.title.trim(),
      description: edit.description.trim() || null,
      price,
      discount: 0,
      size: edit.size.trim(),
      category: edit.category,
      gender: edit.gender as ProductGender,
      era: edit.era.trim() || null,
      images: draft.images.map(plain),
      is_sold: false,
    };
    // a free web address: the title's slug, else -2, -3 …
    for (let n = 1; n < 20; n++) {
      const slug = n === 1 ? base : `${base}-${n}`;
      const { error: e } = await supabase.from('products').insert({ ...product, slug } as never);
      if (!e) {
        await supabase.from('product_drafts').delete().eq('id', draft.id);
        onDone();
        return;
      }
      if (e.code !== '23505' || !/slug/.test(e.message)) {
        setError(`Could not publish: ${e.message}`);
        setBusy('');
        return;
      }
    }
    setError('Could not find a free web address for this title; change the title a little.');
    setBusy('');
  };

  const discard = async (asked = false) => {
    if (!asked && !confirm('Discard this draft and its photos? The piece on your Mac stays as it is; you can send it again.')) return;
    setBusy('discard'); setError(null);
    const { data: files } = await supabase.storage.from('product-images').list(draft.id);
    if (files?.length) await supabase.storage.from('product-images').remove(files.map((f) => `${draft.id}/${f.name}`));
    const { error: e } = await supabase.from('product_drafts').delete().eq('id', draft.id);
    if (e) { setError(`Could not discard: ${e.message}`); setBusy(''); return; }
    onDone();
  };

  // one picture out of the draft (31 Oct, his ask): gone from the draft and its storage; sending the piece again from the app
  // replaces the whole set with the corrected one
  const dropImage = async (i: number) => {
    if (!confirm('Leave this picture out of the draft?')) return;
    setBusy('discard'); setError(null);
    const src = draft.images[i];
    const images = draft.images.filter((_, k) => k !== i);
    const { error: e } = await supabase.from('product_drafts').update({ images } as never).eq('id', draft.id);
    if (e) { setError(`Could not remove the picture: ${e.message}`); setBusy(''); return; }
    const path = decodeURIComponent(plain(src).split('/product-images/')[1] || '');
    if (path) await supabase.storage.from('product-images').remove([path]);
    setCover((c) => Math.max(0, Math.min(c, images.length - 1)));
    setBusy('');
    onDone();
  };

  // the page's accept-all / discard-all: once per signal; a draft without price, size, gender or category is left for you
  const seen = useRef(0);
  useEffect(() => {
    if (!bulk || bulk.n === seen.current || (bulk.group && bulk.group !== groupOf(draft))) return;
    seen.current = bulk.n;
    if (bulk.kind === 'discard') { discard(true).then(() => onBulk('done')); return; }
    if (!valid) { onBulk('skipped'); return; }
    publish().then(() => onBulk('done'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bulk]);

  return (
    <div className="bg-white rounded-xl border border-hairline p-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
      <div>
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-surface">
          {draft.images[cover] && (
            <Image src={draft.images[cover]} alt={edit.title || 'Draft'} fill sizes="280px" className="object-cover" unoptimized />
          )}
        </div>
        <div className="flex gap-1.5 mt-2 overflow-x-auto">
          {draft.images.map((src, i) => (
            <div key={src} className="relative group/th flex-shrink-0">
              <button type="button" onClick={() => setCover(i)}
                className={`relative block w-12 h-16 rounded overflow-hidden border-2 ${i === cover ? 'border-accent-start' : 'border-transparent'}`}>
                <Image src={src} alt="" fill sizes="48px" className="object-cover" unoptimized />
              </button>
              {draft.images.length > 1 && (
                <button type="button" onClick={() => dropImage(i)} disabled={!!busy} title="Leave this picture out"
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-600 text-white text-[11px] leading-none opacity-0 group-hover/th:opacity-100 focus:opacity-100 transition-opacity">×</button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 min-w-0">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {draft.ai_status === 'pending' && <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">AI is writing the text…</span>}
          {draft.ai_status === 'failed' && <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600" title={draft.ai_error || ''}>AI text failed: write it or press Rewrite</span>}
          {draft.brand && <span className="px-2 py-0.5 rounded-full bg-surface text-muted">Label: {draft.brand}{draft.size ? ` · ${draft.size}` : ''}</span>}
          <span className="text-muted">sent {new Date(draft.created_at).toLocaleString('de-AT')}</span>
        </div>

        <FormInput label="Title" value={edit.title} onChange={(e) => set('title', e.target.value)} placeholder="Vintage 90s Levi's Jeans Blue" />
        <FormTextarea label="Description" value={edit.description} onChange={(e) => set('description', e.target.value)} rows={4} />

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          <FormInput label="Price" prefix="€" inputMode="decimal" value={edit.price} onChange={(e) => set('price', e.target.value)} placeholder="0.00" />
          <FormInput label="Size" value={edit.size} onChange={(e) => set('size', e.target.value)} placeholder="M" />
          <FormSelect label="Gender" options={GENDER_OPTIONS} value={edit.gender} onChange={(e) => set('gender', e.target.value)} placeholder="Choose" />
          <FormSelect label="Category" options={categories} value={edit.category} onChange={(e) => set('category', e.target.value)} placeholder={edit.gender ? 'Choose' : 'Gender first'} />
          <FormInput label="Era" value={edit.era} onChange={(e) => set('era', e.target.value)} placeholder="90s" />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button onClick={publish} disabled={!!busy} isLoading={busy === 'publish'} className={`gap-2 ${valid ? '' : 'opacity-70'}`} title={valid ? 'Publish to the shop' : `Still needed: ${missing.join(', ')}`}>
            <CheckCircle size={16} weight="bold" /> Publish to the shop
          </Button>
          <Button variant="secondary" onClick={rewrite} disabled={!!busy} isLoading={busy === 'ai'} className="gap-2">
            <Sparkle size={16} weight="bold" /> Rewrite with AI
          </Button>
          <Button variant="ghost" onClick={() => discard()} disabled={!!busy} isLoading={busy === 'discard'} className="gap-2 text-red-600">
            <Trash size={16} weight="bold" /> Discard
          </Button>
          {!valid && <span className="text-xs text-muted">Price, size, gender and category are needed to publish.</span>}
        </div>
      </div>
    </div>
  );
}

export default function DraftsPage() {
  const [drafts, setDrafts] = useState<DbProductDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // every load() asks the database again; the answer is applied when it arrives (and ignored if the page has gone)
  const [round, setRound] = useState(0);
  const load = useCallback(() => setRound((n) => n + 1), []);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error: e } = isSupabaseConfigured()
        ? await supabase.from('product_drafts').select('*').order('created_at', { ascending: false })
        : { data: [], error: null };
      if (!alive) return;
      if (e) setError(e.message.includes('product_drafts') ? 'The drafts table is not set up yet (run supabase/schemaProductDrafts.sql once).' : e.message);
      else setDrafts((data || []) as DbProductDraft[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [round]);

  // grouped like the app's collections: one section per category, the biggest first, unsorted last
  const groups = useMemo(() => {
    const m = new Map<string, DbProductDraft[]>();
    drafts.forEach((d) => m.set(groupOf(d), [...(m.get(groupOf(d)) || []), d]));
    return [...m.entries()].sort((a, b) => (a[0] === 'Not sorted yet' ? 1 : 0) - (b[0] === 'Not sorted yet' ? 1 : 0) || b[1].length - a[1].length);
  }, [drafts]);

  const [bulk, setBulk] = useState<Bulk | null>(null);
  const [note, setNote] = useState('');
  const counts = useRef({ done: 0, skipped: 0 });
  const runBulk = (kind: Bulk['kind'], group: string | null) => {
    const n = group ? drafts.filter((d) => groupOf(d) === group).length : drafts.length;
    const what = group ? `${n} ${group} draft${n === 1 ? '' : 's'}` : `all ${n} drafts`;
    const ok = kind === 'publish'
      ? confirm(`Publish ${what} to the shop? Drafts still missing a price, size, gender or category stay here.`)
      : confirm(`Discard ${what} and their photos? The pieces on your Mac stay as they are; you can send them again.`);
    if (!ok) return;
    counts.current = { done: 0, skipped: 0 };
    setNote('');
    setBulk((b) => ({ kind, group, n: (b?.n || 0) + 1 }));
  };
  const tally = useCallback((r: 'done' | 'skipped') => {
    counts.current[r] += 1;
    const { done, skipped } = counts.current;
    setNote(`${done} done${skipped ? ` · ${skipped} still need a price, size, gender or category` : ''}`);
  }, []);

  // while the AI is still writing a draft's text, look again every 10 seconds
  const writing = drafts.some((d) => d.ai_status === 'pending');
  useEffect(() => {
    if (!writing) return;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [writing, load]);

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-ink">Drafts</h1>
        <p className="text-muted mt-1">
          Pieces sent from the Rennstern app, photos already graded and framed. Set the price, check the text, publish.
          Nothing here is in the shop yet.
        </p>
      </div>

      {loading && <p className="text-muted">Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && drafts.length === 0 && (
        <div className="bg-white rounded-xl border border-hairline p-10 text-center text-muted">
          <Tray size={32} className="mx-auto mb-3" />
          No drafts. In the Rennstern app: video workspace › 👗 Client pipelines › Vintage clothes › step 5 › Publish.
        </div>
      )}

      {drafts.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button onClick={() => runBulk('publish', null)} className="gap-2"><CheckCircle size={18} /> Accept all ({drafts.length})</Button>
          <Button variant="ghost" onClick={() => runBulk('discard', null)} className="gap-2 text-red-600"><Trash size={18} /> Discard all</Button>
          {note && <span className="text-sm text-muted">{note}</span>}
        </div>
      )}

      <div className="space-y-10">
        {groups.map(([g, list]) => (
          <section key={g}>
            <div className="mb-3 flex flex-wrap items-baseline gap-3 border-b border-hairline pb-2">
              <h2 className="text-lg font-display font-bold text-ink">{g}</h2>
              <span className="text-sm text-muted">{list.length} piece{list.length === 1 ? '' : 's'}</span>
              <span className="ml-auto flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => runBulk('publish', g)}>Accept {g}</Button>
                <Button size="sm" variant="ghost" onClick={() => runBulk('discard', g)} className="text-red-600">Discard {g}</Button>
              </span>
            </div>
            <div className="space-y-4">
              {list.map((d) => (
                <DraftCard key={d.id} draft={d} onDone={load} bulk={bulk} onBulk={tally} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
