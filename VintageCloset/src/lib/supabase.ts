import { createClient } from '@supabase/supabase-js';

// Types for our database tables
export interface DbProduct {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price: number;
  discount: number;
  size: string;
  category: string;
  gender: 'men' | 'women' | 'unisex';
  era: string | null;
  images: string[];
  is_sold: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbOrder {
  id: string;
  product_id: string | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  original_price: number;
  discount_applied: number;
  final_price: number;
  product_title: string;
  product_size: string;
  product_image: string | null;
  created_at: string;
  updated_at: string;
}

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

// Database schema type
export interface Database {
  public: {
    Tables: {
      products: {
        Row: DbProduct;
        Insert: Omit<DbProduct, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<DbProduct, 'id' | 'created_at' | 'updated_at'>>;
      };
      orders: {
        Row: DbOrder;
        Insert: Omit<DbOrder, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<DbOrder, 'id' | 'created_at' | 'updated_at'>>;
      };
      journal_articles: {
        Row: DbJournalArticle;
        Insert: Omit<DbJournalArticle, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<DbJournalArticle, 'id' | 'created_at' | 'updated_at'>>;
      };
      events: {
        Row: DbEvent;
        Insert: Omit<DbEvent, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<DbEvent, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}

// Environment variables check
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables not set. Using mock data. ' +
    'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local'
  );
}

// Create Supabase client (for client-side usage)
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Create a server-side client with service role (for API routes/webhooks)
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Server-side Supabase client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
    );
  }
  
  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

// Helper to get public URL for storage
export function getStorageUrl(bucket: string, path: string): string {
  if (!supabaseUrl) return '';
  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
}

// Helper to upload image to storage
export async function uploadProductImage(
  productId: string,
  file: File,
  index: number
): Promise<string | null> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const filePath = `${productId}/${index}.${fileExt}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

// Helper to delete product images
export async function deleteProductImages(productId: string): Promise<void> {
  const { data: files } = await supabase.storage
    .from('product-images')
    .list(productId);

  if (files && files.length > 0) {
    const filePaths = files.map(file => `${productId}/${file.name}`);
    await supabase.storage
      .from('product-images')
      .remove(filePaths);
  }
}

// Helper to upload journal image to storage
export async function uploadJournalImage(
  articleId: string,
  file: File,
  isCover: boolean = false,
  index: number = 0
): Promise<string | null> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = isCover ? `cover.${fileExt}` : `${index}.${fileExt}`;
  const filePath = `${articleId}/${fileName}`;

  const { error } = await supabase.storage
    .from('journal-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('journal-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

// Helper to delete journal images
export async function deleteJournalImages(articleId: string): Promise<void> {
  const { data: files } = await supabase.storage
    .from('journal-images')
    .list(articleId);

  if (files && files.length > 0) {
    const filePaths = files.map(file => `${articleId}/${file.name}`);
    await supabase.storage
      .from('journal-images')
      .remove(filePaths);
  }
}

// Helper to upload event image to storage
export async function uploadEventImage(
  eventId: string,
  file: File
): Promise<string | null> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const filePath = `${eventId}/cover.${fileExt}`;

  const { error } = await supabase.storage
    .from('event-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('event-images')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

// Helper to delete event images
export async function deleteEventImages(eventId: string): Promise<void> {
  const { data: files } = await supabase.storage
    .from('event-images')
    .list(eventId);

  if (files && files.length > 0) {
    const filePaths = files.map(file => `${eventId}/${file.name}`);
    await supabase.storage
      .from('event-images')
      .remove(filePaths);
  }
}

