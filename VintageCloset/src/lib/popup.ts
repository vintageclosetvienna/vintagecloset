// Pop up weekends at Bandgasse 43: line-up slots, gallery and sharing helpers.
// Safe to import from client and server code.

export interface LineupSlot {
  id: string;
  day: 'Sat' | 'Sun';
  time: string;
  /** Empty name = the slot is still open. */
  name?: string;
  genre?: string;
  instagram?: string;
  soundcloud?: string;
  bio?: string;
  photo?: string;
}

export const POPUP_SERIES = 'popup-bandgasse-43';

export const DAY_LABEL: Record<LineupSlot['day'], string> = { Sat: 'Saturday', Sun: 'Sunday' };

export function isOpenSlot(slot: LineupSlot): boolean {
  return !slot.name || slot.name.trim() === '';
}

/** Reads the jsonb line-up defensively; unknown fields are dropped. */
export function parseLineup(value: unknown): LineupSlot[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === 'object')
    .map((item, index) => {
      const text = (key: string, max = 200) =>
        typeof item[key] === 'string' ? (item[key] as string).trim().slice(0, max) : undefined;
      return {
        id: text('id', 40) || `s${index + 1}`,
        day: item.day === 'Sun' ? 'Sun' : 'Sat',
        time: text('time', 40) || '',
        name: text('name', 60) || undefined,
        genre: text('genre', 60) || undefined,
        instagram: cleanHandle(text('instagram', 80)),
        soundcloud: text('soundcloud', 200) || undefined,
        bio: text('bio', 280) || undefined,
        photo: text('photo', 500) || undefined,
      } satisfies LineupSlot;
    });
}

/** "@dj_x", "dj_x" or an instagram.com link all become "dj_x". */
export function cleanHandle(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const handle = value
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/[/?#].*$/, '')
    .trim();
  return /^[a-zA-Z0-9._]{1,30}$/.test(handle) ? handle : undefined;
}

/** "Sat 31 Oct – Sun 1 Nov" */
export function weekendLabel(date: string, endDate?: string | null): string {
  const fmt = (value: string) =>
    new Date(`${value}T12:00:00`).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  return endDate ? `${fmt(date)} – ${fmt(endDate)}` : fmt(date);
}

/** Today in Vienna as YYYY-MM-DD. */
export function viennaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' }).format(new Date());
}

/** Live = today is the Saturday or Sunday of this weekend. */
export function isLiveWeekend(date: string, endDate?: string | null): boolean {
  const today = viennaToday();
  return today >= date && today <= (endDate || date);
}

export function storyCardPath(slug: string, slotId?: string): string {
  return `/events/${slug}/story${slotId ? `?dj=${encodeURIComponent(slotId)}` : ''}`;
}
