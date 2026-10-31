'use client';

import Image from 'next/image';
import { Suspense, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useT, StaffKey } from '@/lib/staff/i18n';
import { useLoad, must } from '@/lib/staff/useLoad';
import { db, uploadImage, viennaToday, StudioPhoto, StudioStatus } from '@/lib/staff/db';
import { supabase } from '@/lib/supabase';
import { Btn, Empty, Help, Pill, Spinner, Tip, useToast } from '@/components/staff/ui';
import { cn } from '@/lib/utils';
import { SobhiMedia } from '@/components/staff/SobhiMedia';
import { loadTeamMedia, mediaSeenAt } from '@/lib/staff/media';

type Album = 'inbox' | 'queued' | 'done' | 'used';
const ALBUMS: { id: Album; key: StaffKey; emoji: string; statuses: StudioStatus[] }[] = [
  { id: 'inbox', key: 'albumInbox', emoji: '📥', statuses: ['new', 'failed'] },
  { id: 'queued', key: 'albumQueued', emoji: '🎨', statuses: ['queued', 'processing'] },
  { id: 'done', key: 'albumDone', emoji: '✨', statuses: ['done'] },
  { id: 'used', key: 'albumUsed', emoji: '🧥', statuses: ['used'] },
];

function PipelineView() {
  const { t } = useT();
  const toast = useToast();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [album, setAlbum] = useState<Album>('inbox');
  const [sel, setSel] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showOriginal, setShowOriginal] = useState<string | null>(null);
  const { data, loading, reload } = useLoad(() => db.from('studio_photos').select('*').order('created_at', { ascending: false }).limit(400).then(must<StudioPhoto[]>));

  const current = ALBUMS.find((a) => a.id === album)!;
  const list = useMemo(() => (data ?? []).filter((p) => current.statuses.includes(p.status)), [data, current]);
  const count = (a: (typeof ALBUMS)[number]) => (data ?? []).filter((p) => a.statuses.includes(p.status)).length;

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    let ok = 0;
    for (const f of Array.from(files).filter((x) => x.type.startsWith('image/'))) {
      try {
        const { path, url } = await uploadImage('studio', f, viennaToday());
        const { error } = await db.from('studio_photos').insert({ path, url, album: 'Inbox', status: 'new' });
        if (!error) ok++;
      } catch {
        /* counted below */
      }
    }
    setUploading(false);
    toast(ok ? `📸 +${ok}` : '⚠️ ' + t('error'));
    setAlbum('inbox');
    reload();
  };

  const setStatus = async (status: StudioStatus) => {
    setBusy(true);
    const { error } = await db.from('studio_photos').update({ status, updated_at: new Date().toISOString() }).in('id', sel);
    setBusy(false);
    if (error) toast('⚠️ ' + t('error'));
    else {
      toast(status === 'queued' ? `🎨 ${t('sendToStudio')} (${sel.length})` : '✅');
      setSel([]);
      reload();
    }
  };

  const remove = async () => {
    setBusy(true);
    const rows = (data ?? []).filter((p) => sel.includes(p.id));
    const paths = rows.flatMap((p) => [p.path, p.result_path].filter(Boolean) as string[]);
    if (paths.length) await supabase.storage.from('studio').remove(paths);
    await db.from('studio_photos').delete().in('id', sel);
    setBusy(false);
    setSel([]);
    reload();
  };

  const statusPill = (p: StudioPhoto) => {
    if (p.status === 'queued') return <Pill tone="warn">⏳ {t('studioWaiting')}</Pill>;
    if (p.status === 'processing') return <Pill tone="teal">🎨 {t('studioProcessing')}</Pill>;
    if (p.status === 'failed') return <Pill tone="bad">⚠️ {t('studioFailed')}</Pill>;
    if (p.status === 'done') return <Pill tone="good">✨</Pill>;
    return null;
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="flex max-w-xl items-center gap-2 text-sm text-muted">
          {t('studioSub')} <Help text={t('sendToStudioTip')} />
        </p>
        <Btn variant="primary" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? <Spinner className="border-white/40 border-t-white" /> : '⬆️'} {uploading ? t('uploading') : t('uploadPhotos')}
        </Btn>
        <input ref={fileRef} id="studio-files" type="file" accept="image/*" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
      </div>

      {/* Pipeline view of the albums */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ALBUMS.map((a, i) => (
          <button
            key={a.id}
            onClick={() => {
              setAlbum(a.id);
              setSel([]);
            }}
            className={cn(
              'relative flex items-center gap-3 rounded-2xl border p-3 text-start transition',
              album === a.id ? 'border-ink bg-ink text-white' : 'border-hairline bg-white hover:border-brand-teal'
            )}
          >
            <span className="text-2xl" aria-hidden>
              {a.emoji}
            </span>
            <span>
              <span className="block text-sm font-semibold">{t(a.key)}</span>
              <span className={cn('text-xs', album === a.id ? 'text-white/70' : 'text-muted')}>{count(a)}</span>
            </span>
            {i < ALBUMS.length - 1 && (
              <span className="absolute -end-2 top-1/2 z-10 hidden -translate-y-1/2 text-muted sm:block rtl:rotate-180" aria-hidden>
                ›
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Actions for the selection */}
      {sel.length > 0 && (
        <div className="sticky top-16 z-20 flex flex-wrap items-center gap-2 rounded-2xl bg-ink p-3 text-white shadow-lg">
          <span className="px-2 text-sm font-semibold">
            {sel.length} {t('selected')}
          </span>
          {album === 'inbox' && (
            <Tip text={t('sendToStudioTip')} side="bottom">
              <Btn variant="plum" className="min-h-9 text-xs" disabled={busy} onClick={() => setStatus('queued')}>
                🎨 {t('sendToStudio')}
              </Btn>
            </Tip>
          )}
          {(album === 'inbox' || album === 'done') && (
            <Tip text={t('createFromSelectedTip')} side="bottom">
              <Btn className="min-h-9 bg-white text-xs text-ink hover:bg-white/90" onClick={() => router.push(`/staff/products/new?studio=${sel.join(',')}`)}>
                ✨ {t('createFromSelected')}
              </Btn>
            </Tip>
          )}
          <Btn variant="ghost" className="ms-auto min-h-9 text-xs text-white/80 hover:bg-white/10 hover:text-white" disabled={busy} onClick={remove}>
            🗑️ {t('remove')}
          </Btn>
          <Btn variant="ghost" className="min-h-9 text-xs text-white/80 hover:bg-white/10 hover:text-white" onClick={() => setSel([])}>
            ✕
          </Btn>
        </div>
      )}

      {loading && !data ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : list.length === 0 ? (
        <Empty emoji={current.emoji} text={t('studioEmpty')} />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {list.map((p) => {
            const on = sel.includes(p.id);
            const src = p.result_url && showOriginal !== p.id ? p.result_url : p.url;
            return (
              <li key={p.id} className="space-y-1.5">
                <button
                  onClick={() => setSel((s) => (on ? s.filter((x) => x !== p.id) : [...s, p.id]))}
                  className={cn('relative block aspect-square w-full overflow-hidden rounded-2xl bg-black/5 ring-offset-2 transition', on && 'ring-2 ring-brand-teal')}
                >
                  <Image src={src} alt="" fill sizes="(max-width: 640px) 50vw, 20vw" className="object-cover" />
                  {on && <span className="absolute inset-0 flex items-center justify-center bg-brand-teal/40 text-3xl text-white">✓</span>}
                  <span className="absolute start-2 top-2">{statusPill(p)}</span>
                </button>
                <div className="flex items-center justify-between px-1 text-[11px] text-muted">
                  <span>{new Date(p.created_at).toLocaleDateString('de-AT')}</span>
                  {p.result_url && (
                    <button className="font-semibold hover:text-ink" onMouseDown={() => setShowOriginal(p.id)} onMouseUp={() => setShowOriginal(null)} onMouseLeave={() => setShowOriginal(null)} onTouchStart={() => setShowOriginal(p.id)} onTouchEnd={() => setShowOriginal(null)}>
                      👁️ Original
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type StudioTab = 'pipeline' | 'sobhi';

function StudioTabs() {
  const { t } = useT();
  const params = useSearchParams();
  const router = useRouter();
  const tab: StudioTab = params.get('tab') === 'sobhi' ? 'sobhi' : 'pipeline';
  // How many things from Sobhi arrived since this device last looked
  const { data: media } = useLoad(() => loadTeamMedia(60));
  const newCount = useMemo(() => {
    const seen = mediaSeenAt();
    return (media?.items ?? []).filter((m) => new Date(m.created_at).getTime() > seen).length;
  }, [media]);
  const tabs: { id: StudioTab; label: string; emoji: string; badge?: number }[] = [
    { id: 'pipeline', label: t('studioPipelineTab'), emoji: '🎨' },
    { id: 'sobhi', label: t('fromSobhi'), emoji: '🎁', badge: tab === 'sobhi' ? 0 : newCount },
  ];
  return (
    <div className="space-y-5">
      <h1 className="font-display text-2xl font-bold">📸 {t('studioTitle')}</h1>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tb) => (
          <button
            key={tb.id}
            onClick={() => router.replace(tb.id === 'sobhi' ? '/staff/studio?tab=sobhi' : '/staff/studio')}
            className={cn('inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition', tab === tb.id ? 'bg-ink text-white' : 'bg-white text-muted hover:text-ink')}
          >
            {tb.emoji} {tb.label}
            {!!tb.badge && <span className="rounded-full bg-brand-plum px-2 text-xs text-white">{tb.badge} {t('mediaNew')}</span>}
          </button>
        ))}
      </div>
      {tab === 'sobhi' ? <SobhiMedia /> : <PipelineView />}
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense fallback={null}>
      <StudioTabs />
    </Suspense>
  );
}
