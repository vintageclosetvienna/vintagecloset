import { supabase, isSupabaseConfigured } from './supabase';

// Frontend JournalArticle interface
export interface JournalArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Culture' | 'Style' | 'Care' | 'City Guide' | 'Behind the Scenes' | 'News';
  coverImage: string;
  images: string[];
  author: string;
  publishedAt: string;
  readTime: number;
  featured: boolean;
  tags: string[];
  isDraft?: boolean;
}

// Database JournalArticle type
export interface DbJournalArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: 'Culture' | 'Style' | 'Care' | 'City Guide' | 'Behind the Scenes' | 'News';
  cover_image: string;
  images: string[];
  author: string;
  published_at: string;
  read_time: number;
  featured: boolean;
  tags: string[];
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

// Convert database article to frontend article
function dbToArticle(db: DbJournalArticle): JournalArticle {
  return {
    id: db.id,
    slug: db.slug,
    title: db.title,
    excerpt: db.excerpt,
    content: db.content,
    category: db.category,
    coverImage: db.cover_image,
    images: db.images || [],
    author: db.author,
    publishedAt: db.published_at,
    readTime: db.read_time,
    featured: db.featured,
    tags: db.tags || [],
    isDraft: db.is_draft,
  };
}

export const JOURNAL_CATEGORIES = [
  'All',
  'Culture',
  'Style',
  'Care',
  'City Guide',
  'Behind the Scenes',
  'News',
] as const;

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

/**
 * Get all published journal articles
 */
export async function getJournalArticles(): Promise<JournalArticle[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('journal_articles')
    .select('*')
    .eq('is_draft', false)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching journal articles:', error);
    return [];
  }

  return (data as DbJournalArticle[]).map(dbToArticle);
}

/**
 * Get all journal articles including drafts (for admin)
 */
export async function getAllJournalArticles(): Promise<JournalArticle[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('journal_articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all journal articles:', error);
    return [];
  }

  return (data as DbJournalArticle[]).map(dbToArticle);
}

/**
 * Get a single article by slug
 */
export async function getJournalArticle(slug: string): Promise<JournalArticle | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('journal_articles')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching journal article:', error);
    return null;
  }

  return dbToArticle(data as DbJournalArticle);
}

/**
 * Get articles by category
 */
export async function getArticlesByCategory(category: string): Promise<JournalArticle[]> {
  if (category === 'All') {
    return getJournalArticles();
  }

  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('journal_articles')
    .select('*')
    .eq('category', category)
    .eq('is_draft', false)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Error fetching articles by category:', error);
    return [];
  }

  return (data as DbJournalArticle[]).map(dbToArticle);
}

/**
 * Get the featured article
 */
export async function getFeaturedArticle(): Promise<JournalArticle | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('journal_articles')
    .select('*')
    .eq('featured', true)
    .eq('is_draft', false)
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching featured article:', error);
    return null;
  }

  return dbToArticle(data as DbJournalArticle);
}

/**
 * Get related articles (same category, excluding current)
 */
export async function getRelatedArticles(category: string, excludeSlug: string, limit: number = 2): Promise<JournalArticle[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('journal_articles')
    .select('*')
    .eq('category', category)
    .neq('slug', excludeSlug)
    .eq('is_draft', false)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching related articles:', error);
    return [];
  }

  return (data as DbJournalArticle[]).map(dbToArticle);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Calculate read time from content (approx 200 words per minute)
 */
export function calculateReadTime(content: string): number {
  const wordCount = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

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
