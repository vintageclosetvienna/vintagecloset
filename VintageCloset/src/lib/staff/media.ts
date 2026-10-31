'use client';

import { supabase } from '@/lib/supabase';
import { db } from './db';

// Media from Sobhi to the team (Studio › Von Sobhi): photos, videos and stories for Instagram & co.
// Owner/manager upload; the team sees them and downloads or shares them, also from the phone.
export type MediaKind = 'photo' | 'video' | 'story';

export interface TeamMedia {
  id: string;
  kind: MediaKind;
  title: string;
  caption: string | null;
  path: string;
  url: string;
  mime: string | null;
  size_bytes: number | null;
  created_by: string | null;
  created_at: string;
}

export const MEDIA_BUCKET = 'team-media';
export const MEDIA_MAX_BYTES = 50 * 1024 * 1024;
const SEEN_KEY = 'vc-staff-media-seen';

export const isVideo = (m: Pick<TeamMedia, 'mime' | 'path'>) => (m.mime || '').startsWith('video/') || /\.(mp4|mov|webm)$/i.test(m.path);

/** All media, newest first; an empty list while the table is not set up yet (ready: false) */
export async function loadTeamMedia(limit = 200): Promise<{ items: TeamMedia[]; ready: boolean }> {
  const { data, error } = await db.from('team_media').select('*').order('created_at', { ascending: false }).limit(limit);
  if (error) return { items: [], ready: false };
  return { items: (data ?? []) as TeamMedia[], ready: true };
}

/** When this device last looked at the media (ms); what came later is marked new */
export function mediaSeenAt(): number {
  try {
    return Number(window.localStorage.getItem(SEEN_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function markMediaSeen(at: number) {
  try {
    if (at > mediaSeenAt()) window.localStorage.setItem(SEEN_KEY, String(at));
  } catch {
    /* storage blocked */
  }
}

export function fileName(m: TeamMedia): string {
  const ext = m.path.split('.').pop() || (isVideo(m) ? 'mp4' : 'jpg');
  const base = (m.title || `vintage-${m.kind}`).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'vintage';
  return `${base}-${m.created_at.slice(0, 10)}.${ext}`;
}

/** The file's address with "download" set, so phones and laptops save it instead of opening it */
export function downloadUrl(m: TeamMedia): string {
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(m.path, { download: fileName(m) }).data.publicUrl;
}

/** Can this browser hand a file to the phone's share sheet (save to Photos, Instagram, WhatsApp…)? */
export function canShareFiles(): boolean {
  try {
    const probe = new File([''], 'x.jpg', { type: 'image/jpeg' });
    return typeof navigator !== 'undefined' && !!navigator.canShare && navigator.canShare({ files: [probe] });
  } catch {
    return false;
  }
}

/** Opens the share sheet with the file; returns false when the browser cannot */
export async function shareMedia(m: TeamMedia): Promise<boolean> {
  try {
    const res = await fetch(m.url);
    const blob = await res.blob();
    const file = new File([blob], fileName(m), { type: m.mime || blob.type });
    if (!navigator.canShare?.({ files: [file] })) return false;
    await navigator.share({ files: [file], text: m.caption || undefined });
    return true;
  } catch (e) {
    // Closing the share sheet is not an error
    return e instanceof DOMException && e.name === 'AbortError';
  }
}

export async function uploadTeamMedia(file: File, kind: MediaKind, caption: string): Promise<boolean> {
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase();
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' }).format(new Date());
  const path = `${day}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { cacheControl: '3600', upsert: false, contentType: file.type || undefined });
  if (error) return false;
  const url = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
  const title = file.name.replace(/\.[^.]+$/, '').slice(0, 80);
  const { error: e } = await db.from('team_media').insert({ kind, title, caption: caption.trim() || null, path, url, mime: file.type || null, size_bytes: file.size });
  if (e) {
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    return false;
  }
  return true;
}

export async function removeTeamMedia(m: TeamMedia): Promise<boolean> {
  const { error } = await db.from('team_media').delete().eq('id', m.id);
  if (error) return false;
  await supabase.storage.from(MEDIA_BUCKET).remove([m.path]);
  return true;
}
