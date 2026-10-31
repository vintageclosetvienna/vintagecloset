'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowsClockwise, CheckCircle, CloudArrowUp, MagicWand, Shuffle, SpinnerGap, Warning } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { updateSiteImage, type SiteImage } from '@/lib/site-images';
import {
  addToLibrary,
  analysePhotos,
  distribute,
  focalPoint,
  loadLibrary,
  pool,
  uploadLibraryPhoto,
  type LibraryPhoto,
  type Placement,
  type UploadedPhoto,
} from '@/lib/photo-library';

const MAX_FILES = 300;

const SECTION_NAMES: Record<string, string> = {
  'landing-hero': 'Homepage hero',
  'collection-highlights': 'Collection cards',
  'collection-heroes': 'Page heroes',
  'story-slides': 'Story slides',
  'media-carousel': 'Carousel',
};

const KIND_NAMES: Record<string, string> = {
  model: 'Outfit on person',
  flatlay: 'Clothing',
  detail: 'Detail',
  store: 'Shop',
  event: 'Event',
  other: 'Other',
};

type Phase =
  | { step: 'idle' }
  | { step: 'uploading'; done: number; total: number }
  | { step: 'analysing'; done: number; total: number }
  | { step: 'review' }
  | { step: 'applying'; done: number; total: number }
  | { step: 'applied'; count: number };

interface Props {
  slots: SiteImage[];
  onApplied: () => void;
}

export function PhotoDrop({ slots, onApplied }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<Phase>({ step: 'idle' });
  const [library, setLibrary] = useState<LibraryPhoto[] | null>(null);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [skip, setSkip] = useState<Set<string>>(new Set());
  const [notes, setNotes] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    loadLibrary().then(setLibrary);
  }, []);

  const busy = phase.step === 'uploading' || phase.step === 'analysing' || phase.step === 'applying';

  const propose = useCallback(
    (lib: LibraryPhoto[], jitter: number) => {
      const next = distribute(slots, lib, jitter);
      setPlacements(next);
      setSkip(new Set(next.filter((p) => !p.pick).map((p) => p.slot.key)));
      setPhase({ step: 'review' });
    },
    [slots]
  );

  const handleFiles = useCallback(
    async (fileList: FileList | File[] | null) => {
      const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name));
      if (files.length === 0 || busy) return;
      const take = files.slice(0, MAX_FILES);
      const problems: string[] = [];
      if (files.length > MAX_FILES) problems.push(`Only the first ${MAX_FILES} photos were taken. Drop the rest in a second round.`);

      // 1. shrink + upload, 4 at a time
      setPhase({ step: 'uploading', done: 0, total: take.length });
      const uploads = await pool(take, 4, (f) => uploadLibraryPhoto(f), (done) =>
        setPhase({ step: 'uploading', done, total: take.length })
      );
      const uploaded: UploadedPhoto[] = [];
      uploads.forEach((r) => {
        if (r.status === 'fulfilled') uploaded.push(r.value);
        else problems.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
      });
      if (uploaded.length === 0) {
        setNotes(problems);
        setPhase({ step: 'idle' });
        return;
      }

      // 2. AI recognition
      setPhase({ step: 'analysing', done: 0, total: uploaded.length });
      const { photos, errors } = await analysePhotos(uploaded, (done, total) => setPhase({ step: 'analysing', done, total }));
      problems.push(...errors);

      // 3. remember them, then place them
      let lib = [...(library || []), ...photos];
      try {
        lib = await addToLibrary(photos);
      } catch (e) {
        problems.push(e instanceof Error ? e.message : String(e));
      }
      setLibrary(lib);
      const unusable = photos.filter((p) => !p.usable).length;
      if (unusable) problems.push(`${unusable} photo${unusable > 1 ? 's were' : ' was'} not suitable for the website (blurry, screenshots or off-topic) and was left out.`);
      setNotes(problems);
      // fresh photos first: place from this upload, fall back to the older library for empty slots
      const fresh = distribute(slots, photos, 0);
      const older = distribute(slots, lib, 0);
      const merged = fresh.map((p, i) => (p.pick ? p : older[i]));
      setPlacements(merged);
      setSkip(new Set(merged.filter((p) => !p.pick).map((p) => p.slot.key)));
      setPhase({ step: 'review' });
    },
    [busy, library, slots]
  );

  // Tap the new photo to try the next best one for that spot
  const cycle = (key: string) => {
    setPlacements((prev) => {
      const taken = new Set(prev.filter((p) => p.slot.key !== key && p.pick).map((p) => p.pick!.url));
      return prev.map((p) => {
        if (p.slot.key !== key || p.candidates.length === 0) return p;
        const free = p.candidates.filter((c) => !taken.has(c.url));
        if (free.length === 0) return p;
        const at = free.findIndex((c) => c.url === p.pick?.url);
        return { ...p, pick: free[(at + 1) % free.length] };
      });
    });
  };

  const toggle = (key: string) =>
    setSkip((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const chosen = useMemo(() => placements.filter((p) => p.pick && !skip.has(p.slot.key)), [placements, skip]);

  const apply = async () => {
    setPhase({ step: 'applying', done: 0, total: chosen.length });
    const problems: string[] = [];
    let done = 0;
    for (const { slot, pick } of chosen) {
      try {
        await updateSiteImage(slot.key, {
          url: pick!.url,
          objectPosition: focalPoint(pick!),
          description: slot.section === 'media-carousel' && pick!.caption ? pick!.caption : undefined,
        });
      } catch (e) {
        problems.push(`${slot.label}: ${e instanceof Error ? e.message : String(e)}`);
      }
      setPhase({ step: 'applying', done: ++done, total: chosen.length });
    }
    setNotes(problems);
    setPhase({ step: 'applied', count: chosen.length - problems.length });
    onApplied();
  };

  const usableCount = (library || []).filter((p) => p.usable).length;

  return (
    <section className="mb-10 rounded-2xl border border-hairline bg-white overflow-hidden">
      {/* Drop zone */}
      <div
        className={`p-5 sm:p-6 transition-colors ${dragging ? 'bg-accent-start/10' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h2 className="font-display font-bold text-lg text-ink flex items-center gap-2">
              <MagicWand size={20} weight="fill" className="text-accent-start" />
              Photo Drop
            </h2>
            <p className="text-sm text-muted mt-1">
              Upload lots of photos at once. The AI recognises each one (outfit, clothing, detail, shop, event, women/men)
              and puts the best ones on the right spots of the website. Nothing changes until you press Apply.
            </p>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <Button size="lg" className="gap-2 w-full sm:w-auto" disabled={busy} onClick={() => fileRef.current?.click()}>
              <CloudArrowUp size={20} weight="bold" />
              Upload photos
            </Button>
            {usableCount > 0 && (
              <Button variant="ghost" size="sm" className="gap-2 w-full sm:w-auto" disabled={busy} onClick={() => propose(library!, 18)}>
                <Shuffle size={16} weight="bold" />
                Refresh site from library ({usableCount} photos)
              </Button>
            )}
          </div>
        </div>

        {(phase.step === 'uploading' || phase.step === 'analysing' || phase.step === 'applying') && (
          <div className="mt-5">
            <div className="flex items-center gap-2 text-sm text-ink mb-2">
              <SpinnerGap size={16} className="animate-spin text-accent-start" />
              {phase.step === 'uploading' && `Shrinking and uploading ${phase.done} / ${phase.total}…`}
              {phase.step === 'analysing' && `AI is looking at the photos ${phase.done} / ${phase.total}…`}
              {phase.step === 'applying' && `Putting photos on the website ${phase.done} / ${phase.total}…`}
            </div>
            <div className="h-2 rounded-full bg-surface overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent-start to-accent-end transition-all"
                style={{ width: `${phase.total ? (phase.done / phase.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        )}

        {phase.step === 'applied' && (
          <p className="mt-4 text-sm text-ink flex items-center gap-2">
            <CheckCircle size={18} weight="fill" className="text-green-600" />
            {phase.count} spot{phase.count === 1 ? '' : 's'} updated. The website shows them on the next page load.
          </p>
        )}

        {notes.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-amber-700">
            {notes.slice(0, 6).map((n, i) => (
              <li key={i} className="flex gap-1.5">
                <Warning size={14} className="flex-shrink-0 mt-0.5" />
                {n}
              </li>
            ))}
            {notes.length > 6 && <li>…and {notes.length - 6} more</li>}
          </ul>
        )}
      </div>

      {/* Review */}
      {phase.step === 'review' && (
        <div className="border-t border-hairline p-5 sm:p-6 bg-surface/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <p className="text-sm text-muted">
              <strong className="text-ink">Check the proposal.</strong> Tap a new photo to try the next one, tap the
              checkmark to keep the current picture.
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => propose(library || [], 18)}>
                <ArrowsClockwise size={14} weight="bold" />
                Shuffle
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPhase({ step: 'idle' })}>
                Cancel
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {placements.map(({ slot, pick, candidates }) => {
              const on = !!pick && !skip.has(slot.key);
              return (
                <div
                  key={slot.key}
                  className={`rounded-xl border bg-white p-3 transition-opacity ${on ? 'border-accent-start/50' : 'border-hairline opacity-60'}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-muted">{SECTION_NAMES[slot.section] || slot.section}</p>
                      <p className="text-sm font-medium text-ink truncate">{slot.label}</p>
                    </div>
                    <button
                      type="button"
                      disabled={!pick}
                      onClick={() => toggle(slot.key)}
                      aria-label={on ? 'Keep current picture' : 'Use new picture'}
                      className={`w-8 h-8 rounded-full flex items-center justify-center border flex-shrink-0 ${
                        on ? 'bg-accent-start border-accent-start text-white' : 'border-hairline text-muted'
                      }`}
                    >
                      <CheckCircle size={18} weight={on ? 'fill' : 'regular'} />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <figure>
                      <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-surface">
                        {slot.url && (
                          <Image src={slot.url} alt="" fill sizes="160px" className="object-cover" style={{ objectPosition: slot.object_position }} unoptimized />
                        )}
                      </div>
                      <figcaption className="text-[11px] text-muted mt-1">Now</figcaption>
                    </figure>
                    <figure>
                      <button
                        type="button"
                        onClick={() => cycle(slot.key)}
                        disabled={candidates.length < 2}
                        className="relative block w-full aspect-[4/3] rounded-lg overflow-hidden bg-surface"
                      >
                        {pick ? (
                          <Image src={pick.url} alt="" fill sizes="160px" className="object-cover" style={{ objectPosition: focalPoint(pick) }} unoptimized />
                        ) : (
                          <span className="absolute inset-0 flex items-center justify-center text-xs text-muted p-2 text-center">No fitting photo yet</span>
                        )}
                        {candidates.length > 1 && (
                          <span className="absolute bottom-1 right-1 bg-ink/70 text-white rounded-full p-1">
                            <ArrowsClockwise size={12} weight="bold" />
                          </span>
                        )}
                      </button>
                      <figcaption className="text-[11px] text-muted mt-1 truncate">
                        {pick ? `New · ${KIND_NAMES[pick.kind]}${pick.caption ? ` · ${pick.caption}` : ''}` : '—'}
                      </figcaption>
                    </figure>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sticky bottom-0 mt-5 -mx-5 sm:mx-0 px-5 sm:px-0 py-3 bg-surface/95 backdrop-blur flex justify-end">
            <Button size="lg" className="gap-2 w-full sm:w-auto" disabled={chosen.length === 0} onClick={apply}>
              <CheckCircle size={20} weight="bold" />
              Apply {chosen.length} photo{chosen.length === 1 ? '' : 's'} to the website
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
