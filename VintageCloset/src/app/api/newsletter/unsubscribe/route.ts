import { NextRequest, NextResponse } from 'next/server';
import { isNewsletterConfigured, newsletterDb, sha256 } from '@/lib/newsletter';

// Used by the unsubscribe page and by mail apps' one-click unsubscribe (token in the query)
export async function POST(request: NextRequest) {
  if (!isNewsletterConfigured()) {
    return NextResponse.json({ error: 'The newsletter is not available yet.' }, { status: 503 });
  }

  let token = request.nextUrl.searchParams.get('token') || '';
  if (!token && request.headers.get('content-type')?.includes('application/json')) {
    token = (await request.json().catch(() => ({}))).token || '';
  }
  if (!token) return NextResponse.json({ error: 'This link is not valid.' }, { status: 400 });

  const db = newsletterDb();
  const { data } = await db
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('unsubscribe_token_hash', sha256(token))
    .select('id');

  if (!data?.length) return NextResponse.json({ error: 'This link is not valid.' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
