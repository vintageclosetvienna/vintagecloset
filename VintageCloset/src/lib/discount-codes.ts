// Discount Codes (Gutscheine) Data Layer

import { supabase, isSupabaseConfigured } from './supabase';

// Database type
export interface DbDiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  usage_limit: number | null;
  usage_count: number;
  applies_to: 'all' | 'specific';
  product_ids: string[];
  min_order_value: number | null;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Frontend type
export interface DiscountCode {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  usageLimit: number | null;
  usageCount: number;
  appliesTo: 'all' | 'specific';
  productIds: string[];
  minOrderValue: number | null;
  isActive: boolean;
  startsAt: Date;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Validation result type
export interface DiscountValidation {
  isValid: boolean;
  discountType: 'percentage' | 'fixed' | null;
  discountValue: number | null;
  errorMessage: string | null;
}

// Convert DB to frontend type
function dbToDiscountCode(db: DbDiscountCode): DiscountCode {
  return {
    id: db.id,
    code: db.code,
    description: db.description || '',
    discountType: db.discount_type,
    discountValue: db.discount_value,
    usageLimit: db.usage_limit,
    usageCount: db.usage_count,
    appliesTo: db.applies_to,
    productIds: db.product_ids || [],
    minOrderValue: db.min_order_value,
    isActive: db.is_active,
    startsAt: new Date(db.starts_at),
    expiresAt: db.expires_at ? new Date(db.expires_at) : null,
    createdAt: new Date(db.created_at),
    updatedAt: new Date(db.updated_at),
  };
}

// ============================================
// FETCH FUNCTIONS
// ============================================

/**
 * Get all discount codes
 */
export async function getAllDiscountCodes(): Promise<DiscountCode[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching discount codes:', error);
    return [];
  }

  return (data as DbDiscountCode[]).map(dbToDiscountCode);
}

/**
 * Get a single discount code by ID
 */
export async function getDiscountCode(id: string): Promise<DiscountCode | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const { data, error } = await supabase
    .from('discount_codes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching discount code:', error);
    return null;
  }

  return dbToDiscountCode(data as DbDiscountCode);
}

/**
 * Get active discount codes count
 */
export async function getActiveDiscountCodesCount(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return 0;
  }

  const { count, error } = await supabase
    .from('discount_codes')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  if (error) {
    console.error('Error counting discount codes:', error);
    return 0;
  }

  return count || 0;
}

// ============================================
// CREATE / UPDATE / DELETE
// ============================================

export interface CreateDiscountCodeData {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  usageLimit?: number | null;
  appliesTo: 'all' | 'specific';
  productIds?: string[];
  minOrderValue?: number | null;
  isActive?: boolean;
  startsAt?: Date;
  expiresAt?: Date | null;
}

/**
 * Create a new discount code
 */
export async function createDiscountCode(data: CreateDiscountCodeData): Promise<DiscountCode | null> {
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured');
    return null;
  }

  const dbData = {
    code: data.code.toUpperCase(),
    description: data.description || null,
    discount_type: data.discountType,
    discount_value: data.discountValue,
    usage_limit: data.usageLimit ?? null,
    applies_to: data.appliesTo,
    product_ids: data.productIds || [],
    min_order_value: data.minOrderValue ?? null,
    is_active: data.isActive ?? true,
    starts_at: data.startsAt?.toISOString() || new Date().toISOString(),
    expires_at: data.expiresAt?.toISOString() || null,
  };

  const { data: created, error } = await supabase
    .from('discount_codes')
    .insert(dbData as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating discount code:', error);
    throw new Error(error.code === '23505' ? 'Dieser Code existiert bereits' : 'Fehler beim Erstellen');
  }

  return dbToDiscountCode(created as DbDiscountCode);
}

/**
 * Update a discount code
 */
export async function updateDiscountCode(
  id: string, 
  data: Partial<CreateDiscountCodeData>
): Promise<DiscountCode | null> {
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured');
    return null;
  }

  const dbData: Partial<DbDiscountCode> = {};
  
  if (data.code !== undefined) dbData.code = data.code.toUpperCase();
  if (data.description !== undefined) dbData.description = data.description || null;
  if (data.discountType !== undefined) dbData.discount_type = data.discountType;
  if (data.discountValue !== undefined) dbData.discount_value = data.discountValue;
  if (data.usageLimit !== undefined) dbData.usage_limit = data.usageLimit;
  if (data.appliesTo !== undefined) dbData.applies_to = data.appliesTo;
  if (data.productIds !== undefined) dbData.product_ids = data.productIds;
  if (data.minOrderValue !== undefined) dbData.min_order_value = data.minOrderValue;
  if (data.isActive !== undefined) dbData.is_active = data.isActive;
  if (data.startsAt !== undefined) dbData.starts_at = data.startsAt.toISOString();
  if (data.expiresAt !== undefined) dbData.expires_at = data.expiresAt?.toISOString() || null;

  const { data: updated, error } = await supabase
    .from('discount_codes')
    .update(dbData as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating discount code:', error);
    throw new Error(error.code === '23505' ? 'Dieser Code existiert bereits' : 'Fehler beim Aktualisieren');
  }

  return dbToDiscountCode(updated as DbDiscountCode);
}

/**
 * Delete a discount code
 */
export async function deleteDiscountCode(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured');
    return false;
  }

  const { error } = await supabase
    .from('discount_codes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting discount code:', error);
    return false;
  }

  return true;
}

/**
 * Toggle discount code active status
 */
export async function toggleDiscountCodeActive(id: string, isActive: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const { error } = await supabase
    .from('discount_codes')
    .update({ is_active: isActive } as never)
    .eq('id', id);

  if (error) {
    console.error('Error toggling discount code:', error);
    return false;
  }

  return true;
}

// ============================================
// VALIDATION (for checkout)
// ============================================

/**
 * Validate a discount code (client-side validation)
 */
export async function validateDiscountCode(
  code: string,
  productId?: string,
  orderTotal?: number
): Promise<DiscountValidation> {
  if (!isSupabaseConfigured()) {
    return {
      isValid: false,
      discountType: null,
      discountValue: null,
      errorMessage: 'System nicht verfügbar',
    };
  }

  // Call the database function
  const { data, error } = await supabase
    .rpc('validate_discount_code', {
      p_code: code,
      p_product_id: productId || null,
      p_order_total: orderTotal || null,
    } as never);

  if (error) {
    console.error('Error validating discount code:', error);
    return {
      isValid: false,
      discountType: null,
      discountValue: null,
      errorMessage: 'Fehler bei der Validierung',
    };
  }

  // Type assertion for the RPC result
  interface ValidationResult {
    is_valid: boolean;
    discount_type: 'percentage' | 'fixed' | null;
    discount_value: number | null;
    error_message: string | null;
  }
  
  const results = data as ValidationResult[] | null;
  const result = results?.[0];
  
  return {
    isValid: result?.is_valid || false,
    discountType: result?.discount_type || null,
    discountValue: result?.discount_value || null,
    errorMessage: result?.error_message || null,
  };
}

/**
 * Apply/use a discount code (increment usage count)
 */
export async function useDiscountCode(code: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return false;
  }

  const { data, error } = await supabase
    .rpc('use_discount_code', { p_code: code } as never);

  if (error) {
    console.error('Error using discount code:', error);
    return false;
  }

  return data === true;
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  discountType: 'percentage' | 'fixed',
  discountValue: number,
  orderTotal: number
): number {
  if (discountType === 'percentage') {
    return Math.round(orderTotal * (discountValue / 100) * 100) / 100;
  }
  return Math.min(discountValue, orderTotal);
}

