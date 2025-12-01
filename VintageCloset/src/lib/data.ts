import { supabase, isSupabaseConfigured, DbProduct } from './supabase';

// Frontend Product interface (what components use)
export interface Product {
  id: string;
  title: string;
  price: string;
  image: string;
  size: string;
  category: string;
  era?: string;
  slug: string;
  gender: 'men' | 'women' | 'unisex';
  description?: string;
  images: string[];
  discount?: number;
  isSold?: boolean;
}

// Convert database product to frontend product
function dbToProduct(db: DbProduct): Product {
  return {
    id: db.id,
    title: db.title,
    price: `€${db.price.toFixed(2)}`,
    image: db.images[0] || '',
    size: db.size,
    category: db.category,
    era: db.era || undefined,
    slug: db.slug,
    gender: db.gender,
    description: db.description || undefined,
    images: db.images,
    discount: db.discount || undefined,
    isSold: db.is_sold,
  };
}

// Helper to calculate discounted price
export function getDiscountedPrice(price: string, discount?: number): string {
  if (!discount) return price;
  const numPrice = parseFloat(price.replace('€', ''));
  const discounted = numPrice * (1 - discount / 100);
  return `€${discounted.toFixed(2)}`;
}

// Helper to get original price as number
export function getPriceAsNumber(price: string): number {
  return parseFloat(price.replace('€', ''));
}

// ============================================
// DATA FETCHING FUNCTIONS
// ============================================

/**
 * Get all available (not sold) products
 */
export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_sold', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }

  return data.map(dbToProduct);
}

/**
 * Get products by gender
 */
export async function getProductsByGender(gender: 'men' | 'women' | 'unisex'): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('gender', gender)
    .eq('is_sold', false)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching products by gender:', error);
    return [];
  }

  return data.map(dbToProduct);
}

/**
 * Get a single product by slug
 */
export async function getProduct(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching product:', error);
    return null;
  }

  return dbToProduct(data);
}

/**
 * Get a single product by ID
 */
export async function getProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching product by ID:', error);
    return null;
  }

  return dbToProduct(data);
}

/**
 * Mark a product as sold
 */
export async function markProductAsSold(productId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured, cannot mark product as sold');
    return false;
  }

  const { error } = await supabase
    .from('products')
    .update({ is_sold: true } as never)
    .eq('id', productId);

  if (error) {
    console.error('Error marking product as sold:', error);
    return false;
  }

  return true;
}

/**
 * Get count of products added in the last N days
 */
export async function getRecentProductsCount(days: number = 7): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  // Calculate the date N days ago
  const dateThreshold = new Date();
  dateThreshold.setDate(dateThreshold.getDate() - days);
  const isoDate = dateThreshold.toISOString();

  const { count, error } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_sold', false)
    .gte('created_at', isoDate);

  if (error) {
    console.error('Error counting recent products:', error);
    return 0;
  }

  return count || 0;
}
