'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

// Untyped view of the shared client for the team tables (they are not in the generated types)
export const db = supabase as unknown as SupabaseClient;

export type TeamRole = 'owner' | 'manager' | 'staff' | 'studio';

export interface StaffProfile {
  email: string;
  role: TeamRole;
  display_name: string | null;
}

export interface Product {
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
  is_draft: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  product_id: string | null;
  status: OrderStatus;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  shipping_city: string;
  shipping_postal_code: string;
  shipping_country: string;
  original_price: number;
  discount_applied: number;
  final_price: number;
  discount_code: string | null;
  product_title: string;
  product_size: string;
  product_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface PickupCode {
  id: string;
  code: string;
  order_id: string | null;
  product_id: string | null;
  customer_email: string;
  customer_name: string;
  product_title: string;
  product_size: string;
  active: boolean;
  created_at: string;
  redeemed_at: string | null;
}

export type StudioStatus = 'new' | 'queued' | 'processing' | 'done' | 'failed' | 'used';

export interface StudioPhoto {
  id: string;
  album: string;
  path: string;
  url: string;
  status: StudioStatus;
  result_path: string | null;
  result_url: string | null;
  product_id: string | null;
  note: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shift {
  id: string;
  user_email: string;
  worker_name: string | null;
  started_at: string;
  ended_at: string | null;
  note: string | null;
}

export interface Note {
  id: string;
  body: string;
  color: string;
  pinned: boolean;
  done: boolean;
  author: string | null;
  author_name: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  emoji: string | null;
  due_date: string | null;
  done: boolean;
  done_by: string | null;
  done_at: string | null;
  created_at: string;
}

export interface DailyCheck {
  day: string;
  key: string;
  done_by: string | null;
  done_at: string;
}

export interface EventRow {
  id: string;
  slug: string;
  title: string;
  date: string;
  time: string | null;
  location: string;
  is_published: boolean;
}

export interface ActivityRow {
  id: number;
  at: string;
  actor: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  summary: string | null;
  changes: Record<string, { from: unknown; to: unknown }> | null;
}

/** Today's date in Vienna as YYYY-MM-DD */
export function viennaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Vienna' }).format(new Date());
}

export function euro(value: number): string {
  return new Intl.NumberFormat('de-AT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value || 0);
}

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return base || 'teil';
}

/** Uploads one image file to a public bucket and returns its path and public URL */
export async function uploadImage(bucket: string, file: File, folder = ''): Promise<{ path: string; url: string }> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = folder ? `${folder}/${name}` : name;
  const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { path, url: data.publicUrl };
}
