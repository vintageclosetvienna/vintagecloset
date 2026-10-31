import { supabase, isSupabaseConfigured } from './supabase';
import { parseLineup, viennaToday, type LineupSlot } from './popup';

// Frontend Event interface
export interface Event {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  image: string;
  status: 'Upcoming' | 'Coming Soon' | 'Now Open' | 'Past';
  spotsLeft: number | null;
  isPublished?: boolean;
  endDate: string | null;
  series: string | null;
  lineup: LineupSlot[];
  gallery: string[];
  todayNote: string;
  journalSlug: string | null;
}

// Database Event type
export interface DbEvent {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string;
  image: string | null;
  status: 'Upcoming' | 'Coming Soon' | 'Now Open' | 'Past';
  spots_left: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  end_date?: string | null;
  series?: string | null;
  lineup?: unknown;
  gallery?: string[] | null;
  today_note?: string | null;
  journal_slug?: string | null;
}

/* "Now Open" (31 Oct): an event that has started and isn't marked Past or over yet (a pop up season, a hub that stays open)
   shows as running instead of "Upcoming" or "Past". Stored statuses stay Upcoming / Coming Soon / Past. */
function displayStatus(db: DbEvent): Event['status'] {
  if (db.status === 'Past') return 'Past';
  const today = viennaToday();
  if (db.date <= today && (!db.end_date || db.end_date >= today)) return 'Now Open';
  if (db.end_date && db.end_date < today) return 'Past';
  return db.status;
}

// Convert database event to frontend event
function dbToEvent(db: DbEvent, raw = false): Event {
  return {
    id: db.id,
    slug: db.slug,
    title: db.title,
    description: db.description || '',
    date: db.date,
    time: db.time || '',
    location: db.location,
    image: db.image || '',
    status: raw ? db.status : displayStatus(db),
    spotsLeft: db.spots_left,
    isPublished: db.is_published,
    endDate: db.end_date ?? null,
    series: db.series ?? null,
    lineup: parseLineup(db.lineup),
    gallery: db.gallery ?? [],
    todayNote: db.today_note ?? '',
    journalSlug: db.journal_slug ?? null,
  };
}

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

/**
 * Get all published events, sorted by date (newest first)
 */
export async function getEvents(): Promise<Event[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }

  return (data as DbEvent[]).map((d) => dbToEvent(d));
}

/**
 * Get all events including unpublished (for admin)
 */
export async function getAllEvents(): Promise<Event[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching all events:', error);
    return [];
  }

  return (data as DbEvent[]).map((d) => dbToEvent(d, true)); // admin edits the stored status
}

/**
 * Get a single event by slug
 */
export async function getEvent(slug: string): Promise<Event | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }

  return dbToEvent(data as DbEvent);
}

/**
 * Get a single event by ID
 */
export async function getEventById(id: string): Promise<Event | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching event by ID:', error);
    return null;
  }

  return dbToEvent(data as DbEvent);
}

/**
 * Get upcoming events (date >= today)
 */
export async function getUpcomingEvents(): Promise<Event[]> {
  const today = new Date().toISOString().split('T')[0];

  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .gte('date', today)
    .neq('status', 'Past')
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching upcoming events:', error);
    return [];
  }

  return (data as DbEvent[]).map((d) => dbToEvent(d));
}

/**
 * Get the next upcoming event (for landing page teaser)
 */
export async function getNextEvent(): Promise<Event | null> {
  const today = new Date().toISOString().split('T')[0];

  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .gte('date', today)
    .neq('status', 'Past')
    .order('date', { ascending: true })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching next event:', error);
    return null;
  }

  return dbToEvent(data as DbEvent);
}

/**
 * Get past events
 */
export async function getPastEvents(): Promise<Event[]> {
  const today = new Date().toISOString().split('T')[0];

  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .or(`date.lt.${today},status.eq.Past`)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching past events:', error);
    return [];
  }

  return (data as DbEvent[]).map((d) => dbToEvent(d));
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate slug from title
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Format date for display
 */
export function formatEventDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get short date format (e.g., "FEB 24")
 */
export function getShortDate(dateString: string): { day: string; month: string } {
  const date = new Date(dateString);
  return {
    day: date.getDate().toString(),
    month: date.toLocaleString('en', { month: 'short' }).toUpperCase(),
  };
}

/**
 * Status color mapping
 */
export const statusColors: Record<string, string> = {
  'Upcoming': 'bg-green-50 text-green-700',
  'Coming Soon': 'bg-amber-50 text-amber-700',
  'Now Open': 'bg-teal-50 text-teal-700',
  'Past': 'bg-gray-50 text-gray-600',
};

// ============================================
// The two event places (his ask 31 Oct): the shop at Spitalgasse 13, 1090 (shop events, with the new Infinito hub) and the
// pop up store at Bandgasse 43, 1070 (pop up weekends). Pop up events carry a series or a 1070 address.
// ============================================

export type EventPlace = 'shop1090' | 'popup1070';

export function placeOf(e: Event): EventPlace {
  return e.series || /1070|bandgasse/i.test(e.location) ? 'popup1070' : 'shop1090';
}

export const EVENT_PLACES: Record<EventPlace, { title: string; sub: string; address: string; venue: string }> = {
  shop1090: { title: 'Shop events · 1090', sub: 'Drops, markets and nights at the shop, with the new Infinito hub', address: 'Spitalgasse 13, 1090 Wien', venue: 'Vintage Closet · Infinito hub' },
  popup1070: { title: 'Pop up store · 1070', sub: 'Pop up weekends: vintage, live music and open decks', address: 'Bandgasse 43, 1070 Wien', venue: 'Vintage Closet pop up' },
};

/** the next poster per place (upcoming first, then the latest past one), for the poster frames */
export function postersOf(events: Event[]): { place: EventPlace; event: Event }[] {
  const out: { place: EventPlace; event: Event }[] = [];
  (Object.keys(EVENT_PLACES) as EventPlace[]).forEach((place) => {
    const L = events.filter((e) => placeOf(e) === place && e.image);
    const next = L.filter((e) => e.status !== 'Past').sort((a, b) => a.date.localeCompare(b.date))[0] || L.sort((a, b) => b.date.localeCompare(a.date))[0];
    if (next) out.push({ place, event: next });
  });
  return out;
}
