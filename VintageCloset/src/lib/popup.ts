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
  /** Seed of the artist's one-of-one card; set once on first save, never changed. */
  cardSeed?: string;
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
        cardSeed: text('cardSeed', 60) || undefined,
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

export function postcardPath(slug: string, slotId: string): string {
  return `/events/${slug}/postcard?dj=${encodeURIComponent(slotId)}`;
}

// Artist cards: six layouts x twelve palettes x patterns x photo looks x wording
const LAYOUTS = ['cassette', 'sleeve', 'poster', 'polaroid', 'ticket', 'travel'] as const;
const PALETTES = [
  { bg: '#F6EFE4', paper: '#F6EFE4', ink: '#602140', title: '#4CC2BA', accent: '#602140' },
  { bg: '#01DBCA', paper: '#F6EFE4', ink: '#602140', title: '#ffffff', accent: '#602140' },
  { bg: '#602140', paper: '#F6EFE4', ink: '#F6EFE4', title: '#01DBCA', accent: '#4CC2BA' },
  { bg: '#111111', paper: '#F6EFE4', ink: '#F6EFE4', title: '#4CC2BA', accent: '#E8B04B' },
  { bg: '#E8B04B', paper: '#FFF6E0', ink: '#2B1B12', title: '#602140', accent: '#B5462E' },
  { bg: '#B5462E', paper: '#FFF1DE', ink: '#FFF1DE', title: '#F6C453', accent: '#1F3A5F' },
  { bg: '#1F3A5F', paper: '#F3EBDD', ink: '#F3EBDD', title: '#F28C6B', accent: '#4CC2BA' },
  { bg: '#F4C7D0', paper: '#FFF8F3', ink: '#602140', title: '#602140', accent: '#E04E78' },
  { bg: '#2F4A3A', paper: '#F1E7D0', ink: '#F1E7D0', title: '#E8B04B', accent: '#C9603F' },
  { bg: '#EDE6F7', paper: '#ffffff', ink: '#3B2A63', title: '#7B4FD6', accent: '#3B2A63' },
  { bg: '#FF6B35', paper: '#FFF4E8', ink: '#1C1C1C', title: '#ffffff', accent: '#1C1C1C' },
  { bg: '#C9D6A3', paper: '#FBF8EE', ink: '#2E3A1F', title: '#602140', accent: '#2E3A1F' },
];
const PATTERNS = [
  'none',
  'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25) 0, rgba(255,255,255,0) 45%)',
  'repeating-linear-gradient(45deg, rgba(0,0,0,0.06) 0, rgba(0,0,0,0.06) 18px, rgba(0,0,0,0) 18px, rgba(0,0,0,0) 36px)',
  'repeating-linear-gradient(0deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 3px, rgba(0,0,0,0) 3px, rgba(0,0,0,0) 14px)',
  'radial-gradient(circle at 50% 120%, rgba(255,255,255,0.35) 0, rgba(255,255,255,0) 60%)',
  'linear-gradient(135deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.18) 60%, rgba(0,0,0,0.18) 100%)',
];
const FILTERS = ['none', 'sepia(0.35) contrast(1.1)', 'grayscale(1) contrast(1.2)', 'saturate(1.4) contrast(1.05)', 'sepia(0.15) saturate(1.2) hue-rotate(-10deg)'];
const RANKS = [
  'Certified Selector', 'Keeper of the Crates', 'Archive-Grade Groove', 'First Edition Sound', 'One of One',
  'Mint Condition Mixer', 'Deadstock Dancefloor', 'Rare Pressing', 'Second-Hand, First Class', 'Hand-Stitched Beats',
  'Thrifted Frequencies', 'Limited Run', 'Golden Era Graduate', 'Pre-Loved Bass', 'Vintage Approved',
];
const WORDS = ['LIVE AT THE CLOSET', 'POP UP SESSIONS', 'NEUBAU NIGHTS', 'BANDGASSE SOUND', 'RACKS & RECORDS', 'WEEKEND SPECIAL', 'AFTER HOURS EDITION', 'SECRET LINE UP'];
const POSTMARKS = ['BANDGASSE 43', 'NEUBAU POST', 'VINTAGE MAIL', 'POP UP POST', 'WIEN 7', 'CLOSET POST'];

export type PostcardDesign = ReturnType<typeof postcardDesign>;

/** Same seed, same card: layout, palette, pattern, photo look, tilt and wording. */
export function postcardDesign(seed: string) {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let state = hash >>> 0 || 1;
  const next = () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    state >>>= 0;
    return state / 4294967296;
  };
  const pick = <T,>(list: readonly T[]): T => list[Math.floor(next() * list.length)];
  const layout = pick(LAYOUTS);
  const palette = Math.floor(next() * PALETTES.length);
  return {
    /** Layout + colourway: what makes two cards look the same at a glance. */
    key: `${layout}:${palette}`,
    layout,
    ...PALETTES[palette],
    pattern: pick(PATTERNS),
    filter: pick(FILTERS),
    rank: pick(RANKS),
    word: pick(WORDS),
    postmark: pick(POSTMARKS),
    side: pick(['A', 'B']),
    tilt: Math.round((next() * 10 - 5) * 10) / 10,
    serial: String(Math.floor(next() * 9000) + 1000),
  };
}

/** The seed a slot's card is drawn from (stored seed, or the old event + slot + name fallback). */
export function slotCardSeed(eventId: string, slot: LineupSlot): string {
  return slot.cardSeed || `${eventId}:${slot.id}:${slot.name ?? ''}`;
}

// The eight example cards (made 27 Oct 2026): the default show-off in the events slider.
// Real artists never get one of these looks.
const SAMPLE_EVENT = 'b22b9132-5126-4f11-b7d5-8e4075ec7de9';
export const SAMPLE_CARDS = [
  { n: 1, name: 'DJ Mira Velvet', genre: 'disco edits', day: 'Sat' },
  { n: 2, name: 'Kassette Karl', genre: '90s house', day: 'Sun' },
  { n: 3, name: 'Lou Neubau', genre: 'soul & funk', day: 'Sat' },
  { n: 4, name: 'Noor Vinyl', genre: 'arabic grooves', day: 'Sun' },
  { n: 5, name: 'Selecta Rosa', genre: 'dancehall', day: 'Sat' },
  { n: 6, name: 'Moritz Mono', genre: 'minimal', day: 'Sun' },
  { n: 7, name: 'Tape Deck Tina', genre: 'italo disco', day: 'Sat' },
  { n: 8, name: 'Habibi Hertz', genre: 'oriental house', day: 'Sun' },
].map((card) => ({ ...card, seed: `${SAMPLE_EVENT}:demo${card.n}:${card.name}` }));

export function sampleCardPath(n: number): string {
  return `/events/cards/sample/${n}`;
}

/** Looks already taken: the sample cards plus every named slot in these events. */
export function takenCardKeys(events: { id: string; lineup: LineupSlot[] }[], skip?: { eventId: string; slotId: string }): Set<string> {
  const keys = new Set(SAMPLE_CARDS.map((card) => postcardDesign(card.seed).key));
  for (const event of events) {
    for (const slot of event.lineup) {
      if (isOpenSlot(slot)) continue;
      if (skip && skip.eventId === event.id && skip.slotId === slot.id) continue;
      keys.add(postcardDesign(slotCardSeed(event.id, slot)).key);
    }
  }
  return keys;
}

/** A fresh random seed whose look (layout + colourway) nobody has yet. */
export function freshCardSeed(taken: Set<string>): string {
  let seed = '';
  for (let tries = 0; tries < 400; tries += 1) {
    seed = `card-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    if (!taken.has(postcardDesign(seed).key)) return seed;
  }
  return seed; // all 72 looks used: still unique in pattern, photo look, wording and serial
}
