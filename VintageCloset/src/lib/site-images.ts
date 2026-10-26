// Site Images Configuration
// These images are used throughout the site and can be managed from the admin panel

import { supabase, isSupabaseConfigured } from './supabase';

// Database type for site images
export interface DbSiteImage {
  id: string;
  key: string;
  section: string;
  label: string;
  description: string | null;
  url: string;
  object_position?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Frontend-friendly type
export interface SiteImage {
  id: string;
  key: string;
  label: string;
  description: string;
  url: string;
  section: string;
  sortOrder: number;
  object_position?: string;
}

export interface SiteImagesConfig {
  landingHero: {
    left: SiteImage;
    center: SiteImage;
    right: SiteImage;
  };
  mediaCarousel: SiteImage[];
  collectionHighlights: {
    women: SiteImage;
    men: SiteImage;
    unisex: SiteImage;
  };
  storySlides: SiteImage[];
  collectionHeroes: {
    women: SiteImage;
    men: SiteImage;
    unisex: SiteImage;
  };
}

// Convert DB type to frontend type
function dbToSiteImage(db: DbSiteImage): SiteImage {
  return {
    id: db.id,
    key: db.key,
    label: db.label,
    description: db.description || '',
    url: db.url,
    section: db.section,
    sortOrder: db.sort_order,
    object_position: db.object_position || 'center center',
  };
}

// ============================================
// FETCH FUNCTIONS
// ============================================

// Get all active site images
export async function getAllSiteImages(): Promise<SiteImage[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('site_images')
    .select('*')
    .eq('is_active', true)
    .order('section')
    .order('sort_order');

  if (error) {
    console.error('Error fetching site images:', error);
    return [];
  }

  return (data as DbSiteImage[]).map(dbToSiteImage);
}

// Get images by section
export async function getSiteImagesBySection(section: string): Promise<SiteImage[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('site_images')
    .select('*')
    .eq('section', section)
    .eq('is_active', true)
    .order('sort_order');

  if (error) {
    console.error('Error fetching site images by section:', error);
    return [];
  }

  return (data as DbSiteImage[]).map(dbToSiteImage);
}

// Get single image by key
export async function getSiteImage(key: string): Promise<SiteImage | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('site_images')
    .select('*')
    .eq('key', key)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error fetching site image:', error);
    return null;
  }

  return dbToSiteImage(data as DbSiteImage);
}

// Get all images (including inactive) for admin
export async function getAllSiteImagesAdmin(): Promise<SiteImage[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('site_images')
    .select('*')
    .order('section')
    .order('sort_order');

  if (error) {
    console.error('Error fetching all site images:', error);
    return [];
  }

  return (data as DbSiteImage[]).map(dbToSiteImage);
}

// ============================================
// UPDATE FUNCTIONS
// ============================================

// Update site image URL and description
export async function updateSiteImage(
  key: string,
  data: { url?: string; description?: string; objectPosition?: string }
): Promise<SiteImage | null> {
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured, cannot update site image.');
    return null;
  }

  const updateData: Partial<DbSiteImage> = {};
  if (data.url) updateData.url = data.url;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.objectPosition !== undefined) updateData.object_position = data.objectPosition;

  const { data: updated, error } = await supabase
    .from('site_images')
    .update(updateData as never)
    .eq('key', key)
    .select()
    .single();

  if (error) {
    console.error('Error updating site image:', error);
    throw new Error(`Could not save: ${error.message}`);
  }

  return dbToSiteImage(updated as DbSiteImage);
}

// Upload a site image to storage and return its public URL (the caller saves it with updateSiteImage).
// Every upload gets a new file name: reusing `key.jpg` kept the old picture in browser and CDN caches.
export async function uploadSiteImage(
  key: string,
  section: string,
  file: File
): Promise<string> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured, cannot upload the image.');
  }

  const fileExt = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const filePath = `${section}/${key}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('site-images')
    .upload(filePath, file, {
      cacheControl: '31536000',
      contentType: file.type || undefined,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from('site-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

// ============================================
// GALLERY (pictures already uploaded, to reuse)
// ============================================

export interface GalleryImage {
  url: string;
  name: string;
  source: 'site' | 'product';
}

const IMAGE_FILE = /\.(jpe?g|png|webp|gif|avif)$/i;

// Site photos from the site-images bucket (one folder level, newest first) plus product photos
export async function getGalleryImages(): Promise<GalleryImage[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const bucket = supabase.storage.from('site-images');
  const site: GalleryImage[] = [];
  const { data: top } = await bucket.list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
  const folders = (top || []).filter(item => !item.id).map(item => item.name);
  const lists = await Promise.all(
    ['', ...folders].map(async folder => {
      const { data } = await bucket.list(folder, { limit: 1000, sortBy: { column: 'created_at', order: 'desc' } });
      return (data || [])
        .filter(item => item.id && IMAGE_FILE.test(item.name))
        .map(item => {
          const path = folder ? `${folder}/${item.name}` : item.name;
          return { url: bucket.getPublicUrl(path).data.publicUrl, name: path, created: item.created_at || '' };
        });
    })
  );
  lists.flat()
    .sort((a, b) => b.created.localeCompare(a.created))
    .forEach(({ url, name }) => site.push({ url, name, source: 'site' }));

  const { data: products } = await supabase
    .from('products')
    .select('title, images')
    .order('created_at', { ascending: false })
    .limit(200);
  const product: GalleryImage[] = ((products || []) as { title: string; images: string[] | null }[])
    .flatMap(p => (p.images || []).map(url => ({ url, name: p.title, source: 'product' as const })));

  const seen = new Set<string>();
  return [...site, ...product].filter(img => !seen.has(img.url) && seen.add(img.url));
}

// ============================================
// STRUCTURED DATA GETTERS (for components)
// ============================================

// Get landing hero images
export async function getLandingHeroImages(): Promise<{
  left: SiteImage | null;
  center: SiteImage | null;
  right: SiteImage | null;
}> {
  const images = await getSiteImagesBySection('landing-hero');
  return {
    left: images.find(img => img.key === 'hero-left') || null,
    center: images.find(img => img.key === 'hero-center') || null,
    right: images.find(img => img.key === 'hero-right') || null,
  };
}

// Get media carousel images
export async function getMediaCarouselImages(): Promise<SiteImage[]> {
  return getSiteImagesBySection('media-carousel');
}

// Get collection highlights images
export async function getCollectionHighlightsImages(): Promise<{
  women: SiteImage | null;
  men: SiteImage | null;
  unisex: SiteImage | null;
}> {
  const images = await getSiteImagesBySection('collection-highlights');
  return {
    women: images.find(img => img.key === 'highlight-women') || null,
    men: images.find(img => img.key === 'highlight-men') || null,
    unisex: images.find(img => img.key === 'highlight-unisex') || null,
  };
}

// Get story slides images
export async function getStorySlidesImages(): Promise<SiteImage[]> {
  return getSiteImagesBySection('story-slides');
}

// Get collection hero images
export async function getCollectionHeroImages(): Promise<{
  women: SiteImage | null;
  men: SiteImage | null;
  unisex: SiteImage | null;
}> {
  const images = await getSiteImagesBySection('collection-heroes');
  return {
    women: images.find(img => img.key === 'women-hero') || null,
    men: images.find(img => img.key === 'men-hero') || null,
    unisex: images.find(img => img.key === 'unisex-hero') || null,
  };
}

// Fallback hero images
const FALLBACK_HEROES: Record<string, string> = {
  women: 'https://images.unsplash.com/photo-1550614000-4b9519e40569?q=80&w=2070&auto=format&fit=crop',
  men: 'https://images.unsplash.com/photo-1617114919297-3c8dd6caea94?q=80&w=1964&auto=format&fit=crop',
  unisex: 'https://images.unsplash.com/photo-1523381294911-8d3cead13475?q=80&w=2070&auto=format&fit=crop',
};

// Get specific collection hero - returns fallback if not configured
export async function getCollectionHero(gender: 'women' | 'men' | 'unisex'): Promise<string> {
  const image = await getSiteImage(`${gender}-hero`);
  if (image) return image.url;
  
  // Fallback to Unsplash image
  return FALLBACK_HEROES[gender];
}
