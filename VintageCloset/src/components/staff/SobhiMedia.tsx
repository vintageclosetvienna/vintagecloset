'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useT } from '@/lib/staff/i18n';
import { useStaff } from '@/lib/staff/session';
import { useLoad } from '@/lib/staff/useLoad';
import {
  MediaKind,
  MEDIA_MAX_BYTES,
  TeamMedia,
  canShareFiles,
  downloadUrl,
  isVideo,
  loadTeamMedia,
  markMediaSeen,
  mediaSeenAt,
  removeTeamMedia,
  shareMedia,
  uploadTeamMedia,
} from '@/lib/staff/media';
import { Btn, Empty, Modal, Spinner, inputCls, useToast } from './ui';
import { cn } from '@/lib/utils';

const KIND_EMOJI: Record<MediaKind, string> = { photo: '🖼️', video: '🎬', story: '📱' };

/** Studio › Von Sobhi: what Sobhi made for the team, to download or share straight from the phone */
export function SobhiMedia() {
  const { t } = useT();
  const { isManager } = useStaff();
  const { data, loading, reload } = useLoad(() => loadTeamMedia());
  const [open, setOpen] = useState<TeamMedia | null>(null);
  const [filter, setFilter] = useState<MediaKind | 'all'>('all');
  // What was new when the page opened stays marked for this visit; the visit itself counts as seen
  const [seenBefore] = useState(mediaSeenAt);
  const items = useMemo(() => data?.items ?? [], [data]);
  useEffect(() => {
    if (items.length) markMediaSeen(Math.max(...items.map((m) => new Date(m.created_at).getTime())));
  }, [items]);
  const isNew = (m: TeamMedia) => new Date(m.created_at).getTime() > seenBefore;
  const shown = filter === 'all' ? items : items.filter((m) => m.kind === filter);
  const kindLabel = (k: MediaKind) => t(k === 'photo' ? 'kindPhoto' : k === 'video' ? 'kindVideo' : 'kindStory');

  if (loading && !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }
  if (data && !data.ready) return <Empty emoji="🛠️" text={t('mediaNotReady')} />;

  return (
    <div className="space-y-4">
      <p className="max-w-xl text-sm text-muted">{t('fromSobhiSub')}</p>

      {isManager && <MediaUpload onDone={reload} />}

      <div className="flex flex-wrap gap-2">
        {(['all', 'photo', 'video', 'story'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={cn('rounded-full px-3 py-1.5 text-xs font-semibold transition', filter === k ? 'bg-ink text-white' : 'bg-white text-muted hover:text-ink')}
          >
            {k === 'all' ? `✨ ${t('all')}` : `${KIND_EMOJI[k]} ${kindLabel(k)}`}
            <span className="ms-1.5 opacity-70">{k === 'all' ? items.length : items.filter((m) => m.kind === k).length}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Empty emoji="🎁" text={t('mediaEmpty')} />
      ) : (
        <ul className="grid grid-cols-2 items-start gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {shown.map((m) => (
            <li key={m.id} className="overflow-hidden rounded-2xl border border-hairline bg-white">
              <button onClick={() => setOpen(m)} className={cn('relative block w-full bg-black/5', m.kind === 'story' ? 'aspect-[9/16] max-h-80' : 'aspect-square')}>
                {isVideo(m) ? (
                  <video src={`${m.url}#t=0.1`} preload="metadata" muted playsInline className="h-full w-full object-cover" />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.title} loading="lazy" className="h-full w-full object-cover" />
                )}
                <span className="absolute start-2 top-2 flex gap-1 text-[11px] font-semibold">
                  <span className="rounded-full bg-white/90 px-2 py-0.5 text-ink shadow-sm">
                    {KIND_EMOJI[m.kind]} {kindLabel(m.kind)}
                  </span>
                  {isNew(m) && <span className="rounded-full bg-brand-plum px-2 py-0.5 text-white shadow-sm">✨ {t('mediaNew')}</span>}
                </span>
                {isVideo(m) && <span className="absolute inset-0 flex items-center justify-center text-4xl text-white drop-shadow" aria-hidden>▶</span>}
              </button>
              <MediaActions m={m} compact onRemoved={reload} />
            </li>
          ))}
        </ul>
      )}

      {open && (
        <Modal open onClose={() => setOpen(null)} title={`${KIND_EMOJI[open.kind]} ${kindLabel(open.kind)}`}>
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl bg-black">
              {isVideo(open) ? (
                <video src={open.url} controls playsInline autoPlay className="max-h-[65vh] w-full" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={open.url} alt={open.title} className="max-h-[65vh] w-full object-contain" />
              )}
            </div>
            {open.caption && <p className="whitespace-pre-wrap rounded-xl bg-amber-50 px-3 py-2 text-sm">{open.caption}</p>}
            <MediaActions m={open} onRemoved={() => { setOpen(null); reload(); }} />
          </div>
        </Modal>
      )}
    </div>
  );
}

function MediaActions({ m, compact, onRemoved }: { m: TeamMedia; compact?: boolean; onRemoved: () => void }) {
  const { t } = useT();
  const { isManager } = useStaff();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [shareOk] = useState(canShareFiles);
  const btn = 'inline-flex min-h-9 items-center justify-center gap-1 rounded-lg px-2.5 text-xs font-semibold';
  return (
    <div className={cn('flex flex-wrap gap-1.5', compact ? 'p-2' : '')}>
      <a href={downloadUrl(m)} className={cn(btn, 'flex-1 bg-ink text-white hover:bg-ink/85')} download>
        ⬇️ {t('download')}
      </a>
      {shareOk && (
        <button
          className={cn(btn, 'flex-1 bg-brand-teal/15 text-ink hover:bg-brand-teal/25')}
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            const ok = await shareMedia(m);
            setBusy(false);
            if (!ok) window.location.href = downloadUrl(m);
          }}
        >
          {busy ? <Spinner /> : '📲'} {compact ? '' : t('shareSave')}
        </button>
      )}
      {m.caption && (
        <button
          className={cn(btn, 'bg-amber-50 text-amber-900 hover:bg-amber-100')}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(m.caption || '');
              toast(t('copied'));
            } catch {
              toast('⚠️ ' + t('error'));
            }
          }}
          aria-label={t('copyCaption')}
        >
          📋 {compact ? '' : t('copyCaption')}
        </button>
      )}
      {isManager && !compact && (
        <button
          className={cn(btn, 'text-red-600 hover:bg-red-50')}
          disabled={busy}
          onClick={async () => {
            if (!window.confirm(t('confirmDelete'))) return;
            setBusy(true);
            const ok = await removeTeamMedia(m);
            setBusy(false);
            if (ok) onRemoved();
            else toast('⚠️ ' + t('error'));
          }}
        >
          🗑️ {t('delete')}
        </button>
      )}
    </div>
  );
}

// Owner/manager: send photos, videos or stories to the team, with an optional text for the post
function MediaUpload({ onDone }: { onDone: () => void }) {
  const { t } = useT();
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState('');
  const [asStory, setAsStory] = useState(false);
  const [busy, setBusy] = useState(false);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    let ok = 0;
    let tooBig = 0;
    for (const f of Array.from(files)) {
      if (f.size > MEDIA_MAX_BYTES) {
        tooBig++;
        continue;
      }
      const kind: MediaKind = asStory ? 'story' : f.type.startsWith('video/') ? 'video' : 'photo';
      if (await uploadTeamMedia(f, kind, caption)) ok++;
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
    if (tooBig) toast('⚠️ ' + t('tooBig'));
    if (ok) {
      toast(`🎁 +${ok}`);
      setCaption('');
      onDone();
    } else if (!tooBig) toast('⚠️ ' + t('error'));
  };

  return (
    <div className="space-y-3 rounded-2xl border border-dashed border-brand-plum/40 bg-brand-plum/5 p-4">
      <textarea className={cn(inputCls, 'min-h-16')} placeholder={t('captionPlaceholder')} value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={2000} />
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="h-4 w-4 accent-[#7A2C4F]" checked={asStory} onChange={(e) => setAsStory(e.target.checked)} />
          📱 {t('asStory')}
        </label>
        <Btn variant="plum" className="ms-auto" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? <Spinner className="border-white/40 border-t-white" /> : '⬆️'} {busy ? t('uploading') : t('sendMedia')}
        </Btn>
        <input ref={fileRef} type="file" accept="image/*,video/mp4,video/quicktime,video/webm" multiple className="hidden" onChange={(e) => upload(e.target.files)} />
      </div>
    </div>
  );
}
