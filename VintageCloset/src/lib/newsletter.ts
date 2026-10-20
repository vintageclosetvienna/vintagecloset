// Newsletter settings and helpers (server only). How to change them: SETTINGS-GUIDE.md → Newsletter

import { createHash, randomBytes, randomInt } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// Welcome offer
export const WELCOME_DISCOUNT_PERCENT = 20;
export const WELCOME_CODE_VALID_DAYS = 90; // 3 months
export const WELCOME_CODE_PREFIX = 'WELCOME';

// Double opt-in: how long the confirmation link works
export const CONFIRM_LINK_VALID_HOURS = 48;

// Rate limits for sign-ups
export const MAX_SIGNUPS_PER_IP_PER_HOUR = 5;
export const MAX_EMAILS_PER_ADDRESS_PER_DAY = 3;

export const NEWSLETTER_GENDERS = ['women', 'men', 'unisex'] as const;
export type NewsletterGender = (typeof NEWSLETTER_GENDERS)[number];

// Exact consent wording shown next to the checkbox; stored with every sign-up as proof
export const CONSENT_TEXT =
  'I agree to receive the Vintage Closet newsletter (new drops, early access, events) by email. ' +
  'I can unsubscribe at any time with the link in every email.';

export function isNewsletterConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

// Token for email links: random, URL-safe; only its hash goes into the database
export function createToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: sha256(token) };
}

// Personal code like WELCOME-7K3P9Q (no 0/O/1/I to avoid typos)
export function createWelcomeCode(): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 6; i++) suffix += alphabet[randomInt(alphabet.length)];
  return `${WELCOME_CODE_PREFIX}-${suffix}`;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

// Untyped service-role client for the newsletter tables (bypasses RLS; server routes only)
export function newsletterDb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
