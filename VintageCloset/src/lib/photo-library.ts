'use client';

// Photo Drop: many photos in at once → shrunk in the browser → uploaded to site-images/library/ →
// recognised by the AI (/api/site-images/analyze) → placed automatically on every site image slot.
// The AI results are kept in site-images/library/index.json, so the site can be reshuffled later
// from the whole library without paying for recognition again. No database change needed.

import { supabase } from './supabase';
import { authFetch } from './auth-fetch';
import type { SiteImage } from './site-images';

const BUCKET = 'site-images';
const FOLDER = 'library';
const INDEX_PATH = `${FOLDER}/index.json`;
const MAX_EDGE = 2200; // long edge in px: sharp on a big screen, small enough to load fast
const JPEG_QUALITY = 0.86;

export type PhotoKind = 'model' | 'flatlay' | 'detail' | 'store' | 'event' | 'other';
export type PhotoGender = 'women' | 'men' | 'unisex' | 'none';

export interface LibraryPhoto {
  url: string;
  path: string;
  w: number;
  h: number;
  kind: PhotoKind;
  gender: PhotoGender;
  quality: number; // 1–10
  fx: number; // focal point, % from left
  fy: number; // focal point, % from top
  caption: string; // 1–3 word label, used on carousel slides
  usable: boolean;
  added: string;
}

export interface UploadedPhoto {
  url: string;
  path: string;
  w: number;
  h: number;
}

// ============================================
// SHRINK + UPLOAD
// ============================================

/** Phone photos are 4–12 MB; redraw them as a ~2200px JPEG (rotation from EXIF kept). */
export async function shrinkPhoto(file: File): Promise<{ blob: Blob; w: number; h: number }> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error(`${file.name}: this browser cannot open the file. Save it as JPEG and try again.`);
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not available');
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
  if (!blob) throw new Error(`${file.name}: could not convert the photo.`);
  return { blob, w, h };
}

export async function uploadLibraryPhoto(file: File): Promise<UploadedPhoto> {
  const { blob, w, h } = await shrinkPhoto(file);
  const path = `${FOLDER}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    cacheControl: '31536000',
    contentType: 'image/jpeg',
  });
  if (error) throw new Error(`${file.name}: upload failed (${error.message})`);
  const url = supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  return { url, path, w, h };
}

/** Run an async job over a list with a few at a time. */
export async function pool<T, R>(
  items: T[],
  limit: number,
  job: (item: T, index: number) => Promise<R>,
  onDone?: (doneCount: number) => void
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: 'fulfilled', value: await job(items[i], i) };
      } catch (reason) {
        results[i] = { status: 'rejected', reason };
      }
      onDone?.(++done);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ============================================
// AI RECOGNITION
// ============================================

const BATCH = 8;

/** Ask the AI what each photo shows. Returns library entries in the same order (failed batches are skipped). */
export async function analysePhotos(
  photos: UploadedPhoto[],
  onProgress?: (done: number, total: number) => void
): Promise<{ photos: LibraryPhoto[]; errors: string[] }> {
  const batches: UploadedPhoto[][] = [];
  for (let i = 0; i < photos.length; i += BATCH) batches.push(photos.slice(i, i + BATCH));
  let analysed = 0;
  const errors: string[] = [];
  const results = await pool(batches, 2, async (batch) => {
    const res = await authFetch('/api/site-images/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ urls: batch.map((p) => p.url) }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || `Recognition failed (${res.status})`);
    analysed += batch.length;
    onProgress?.(analysed, photos.length);
    const now = new Date().toISOString();
    return (json.photos as Omit<LibraryPhoto, 'url' | 'path' | 'w' | 'h' | 'added'>[]).map((a, i) => ({
      ...batch[i],
      ...a,
      added: now,
    }));
  });
  const out: LibraryPhoto[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') out.push(...r.value);
    else errors.push(r.reason instanceof Error ? r.reason.message : String(r.reason));
  }
  return { photos: out, errors };
}

// ============================================
// LIBRARY INDEX (site-images/library/index.json)
// ============================================

export async function loadLibrary(): Promise<LibraryPhoto[]> {
  const { data, error } = await supabase.storage.from(BUCKET).download(INDEX_PATH); // saved with cacheControl 0, so this is always fresh
  if (error || !data) return [];
  try {
    const parsed = JSON.parse(await data.text());
    return Array.isArray(parsed?.photos) ? parsed.photos : [];
  } catch {
    return [];
  }
}

export async function saveLibrary(photos: LibraryPhoto[]): Promise<void> {
  const body = new Blob([JSON.stringify({ version: 1, photos }, null, 1)], { type: 'application/json' });
  const { error } = await supabase.storage.from(BUCKET).upload(INDEX_PATH, body, {
    upsert: true,
    cacheControl: '0',
    contentType: 'application/json',
  });
  if (error) throw new Error(`Could not save the photo library: ${error.message}`);
}

/** Add new photos to the stored library (deduped by URL) and return the full list. */
export async function addToLibrary(newPhotos: LibraryPhoto[]): Promise<LibraryPhoto[]> {
  const existing = await loadLibrary();
  const seen = new Set(existing.map((p) => p.url));
  const merged = [...existing, ...newPhotos.filter((p) => !seen.has(p.url))];
  await saveLibrary(merged);
  return merged;
}

// ============================================
// AUTO-PLACEMENT
// ============================================

type Shape = 'portrait' | 'landscape' | 'any';

interface SlotRule {
  kinds: PhotoKind[]; // allowed, best first
  gender?: 'women' | 'men' | 'unisex';
  shape: Shape;
  priority: number; // lower = filled first, so the most visible slots get the best photos
}

/** What each site slot wants. Keys come from the site_images table. */
function ruleFor(img: SiteImage): SlotRule | null {
  const k = img.key;
  const g = (['women', 'men', 'unisex'] as const).find((x) => k.includes(x));
  if (k === 'hero-center') return { kinds: ['model', 'flatlay'], shape: 'portrait', priority: 0 };
  if (k.startsWith('highlight-') && g) return { kinds: ['model', 'flatlay'], gender: g, shape: 'portrait', priority: 1 };
  if (k.endsWith('-hero') && g) return { kinds: ['model', 'store', 'flatlay'], gender: g, shape: 'landscape', priority: 2 };
  if (k === 'hero-left' || k === 'hero-right') return { kinds: ['model', 'flatlay'], shape: 'portrait', priority: 3 };
  if (k === 'journal-hero') return { kinds: ['store', 'model', 'event'], shape: 'landscape', priority: 4 };
  if (k === 'events-hero') return { kinds: ['event', 'store', 'model'], shape: 'landscape', priority: 4 };
  if (img.section === 'story-slides') return { kinds: ['detail', 'flatlay', 'model'], shape: 'portrait', priority: 5 };
  if (img.section === 'media-carousel') return { kinds: ['model', 'store', 'flatlay', 'event', 'detail'], shape: 'any', priority: 6 };
  return null; // lookbook and anything unknown stays as it is
}

function shapeOf(p: LibraryPhoto): 'portrait' | 'landscape' | 'square' {
  const r = p.w / p.h;
  if (r > 1.15) return 'landscape';
  if (r < 0.87) return 'portrait';
  return 'square';
}

function score(p: LibraryPhoto, rule: SlotRule, jitter: number): number | null {
  if (!p.usable) return null;
  const kindIdx = rule.kinds.indexOf(p.kind);
  if (kindIdx < 0) return null;
  let s = p.quality * 10 + [20, 12, 6, 3, 1][kindIdx];
  if (rule.gender) {
    if (p.gender === rule.gender) s += 25;
    else if (rule.gender !== 'unisex' && p.gender === 'unisex') s += 5;
    else if (rule.gender === 'unisex' && p.gender !== 'none') s += 0;
    else if (p.kind === 'store' && p.gender === 'none') s -= 5; // a shop shot works on any page, just not first choice
    else return null; // a men's photo never lands on the women page and vice versa
  }
  const shape = shapeOf(p);
  if (rule.shape !== 'any') s += shape === rule.shape ? 10 : shape === 'square' ? 4 : -6;
  return s + Math.random() * jitter;
}

export interface Placement {
  slot: SiteImage;
  candidates: LibraryPhoto[]; // ranked, best first
  pick: LibraryPhoto | null;
}

/**
 * Give every slot the best fitting photo, each photo used once.
 * jitter > 0 mixes the order up (used by "Shuffle" so a refresh looks different).
 */
export function distribute(slots: SiteImage[], library: LibraryPhoto[], jitter = 0): Placement[] {
  const ruled = slots
    .map((slot) => ({ slot, rule: ruleFor(slot) }))
    .filter((x): x is { slot: SiteImage; rule: SlotRule } => !!x.rule)
    .sort((a, b) => a.rule.priority - b.rule.priority || a.slot.sortOrder - b.slot.sortOrder);

  const used = new Set<string>();
  return ruled.map(({ slot, rule }) => {
    const candidates = library
      .map((p) => ({ p, s: score(p, rule, jitter) }))
      .filter((x): x is { p: LibraryPhoto; s: number } => x.s !== null)
      .map((x) => ({ ...x, s: x.p.url === slot.url ? x.s - 8 : x.s })) // prefer something new on refresh
      .sort((a, b) => b.s - a.s)
      .map((x) => x.p);
    const pick = candidates.find((p) => !used.has(p.url)) || null;
    if (pick) used.add(pick.url);
    return { slot, candidates, pick };
  });
}

export function focalPoint(p: LibraryPhoto): string {
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  return `${clamp(p.fx)}% ${clamp(p.fy)}%`;
}
