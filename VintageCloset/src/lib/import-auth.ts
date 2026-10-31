import { createHash, timingSafeEqual } from 'crypto';
import { NextRequest } from 'next/server';

/* The Rennstern app's import key (Vercel env VINTAGE_IMPORT_KEY; the app keeps it in the Mac's Keychain). */

export function importAuthorized(request: NextRequest): boolean {
  const key = process.env.VINTAGE_IMPORT_KEY;
  const given = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!key || !given) return false;
  const a = createHash('sha256').update(key).digest();
  const b = createHash('sha256').update(given).digest();
  return timingSafeEqual(a, b);
}

export function importReady(): boolean {
  return Boolean(process.env.VINTAGE_IMPORT_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
