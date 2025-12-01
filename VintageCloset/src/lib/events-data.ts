import { supabase, isSupabaseConfigured } from './supabase';

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
  status: 'Upcoming' | 'Coming Soon' | 'Past';
  spotsLeft: number | null;
  isPublished?: boolean;
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
  status: 'Upcoming' | 'Coming Soon' | 'Past';
  spots_left: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

// Convert database event to frontend event
function dbToEvent(db: DbEvent): Event {
  return {
    id: db.id,
    slug: db.slug,
    title: db.title,
    description: db.description || '',
    date: db.date,
    time: db.time || '',
    location: db.location,
    image: db.image || '',
    status: db.status,
    spotsLeft: db.spots_left,
    isPublished: db.is_published,
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

  return (data as DbEvent[]).map(dbToEvent);
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

  return (data as DbEvent[]).map(dbToEvent);
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

  return (data as DbEvent[]).map(dbToEvent);
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

  return (data as DbEvent[]).map(dbToEvent);
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
  'Past': 'bg-gray-50 text-gray-600',
};
