import { NextRequest, NextResponse } from 'next/server';
import {
  CONFIRM_LINK_VALID_HOURS,
  CONSENT_TEXT,
  MAX_EMAILS_PER_ADDRESS_PER_DAY,
  MAX_SIGNUPS_PER_IP_PER_HOUR,
  NEWSLETTER_GENDERS,
  WELCOME_DISCOUNT_PERCENT,
  createToken,
  isNewsletterConfigured,
  isValidEmail,
  newsletterDb,
  normalizeEmail,
  sha256,
} from '@/lib/newsletter';
import { brandEmail, sendEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/site';

// Same answer whether the address is new, pending or already subscribed (no account probing)
const CHECK_INBOX = { ok: true, message: 'Almost there! Check your inbox and confirm your email to get your code.' };

export async function POST(request: NextRequest) {
  if (!isNewsletterConfigured()) {
    return NextResponse.json({ error: 'The newsletter is not available yet.' }, { status: 503 });
  }

  let body: { email?: string; gender?: string; consent?: boolean; company?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  // Hidden field only bots fill in
  if (body.company) return NextResponse.json(CHECK_INBOX);

  const email = normalizeEmail(String(body.email || ''));
  const gender = String(body.gender || '');
  if (!isValidEmail(email)) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 });
  if (!NEWSLETTER_GENDERS.includes(gender as never)) return NextResponse.json({ error: 'Please choose a collection.' }, { status: 400 });
  if (body.consent !== true) return NextResponse.json({ error: 'Please agree to receive the newsletter.' }, { status: 400 });

  const db = newsletterDb();
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const ipKey = sha256(`ip:${ip}`);
  const emailKey = sha256(`email:${email}`);
  const hourAgo = new Date(Date.now() - 3600_000).toISOString();
  const dayAgo = new Date(Date.now() - 86_400_000).toISOString();

  const [{ count: ipCount }, { count: emailCount }] = await Promise.all([
    db.from('newsletter_rate_limits').select('id', { count: 'exact', head: true }).eq('key_hash', ipKey).gte('created_at', hourAgo),
    db.from('newsletter_rate_limits').select('id', { count: 'exact', head: true }).eq('key_hash', emailKey).gte('created_at', dayAgo),
  ]);
  if ((ipCount ?? 0) >= MAX_SIGNUPS_PER_IP_PER_HOUR) {
    return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
  }
  await db.from('newsletter_rate_limits').insert([{ key_hash: ipKey }, { key_hash: emailKey }]);
  if ((emailCount ?? 0) >= MAX_EMAILS_PER_ADDRESS_PER_DAY) return NextResponse.json(CHECK_INBOX);

  const { data: existing } = await db
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('email', email)
    .maybeSingle();

  // Already confirmed: nothing to send again
  if (existing?.status === 'confirmed') return NextResponse.json(CHECK_INBOX);

  const { token, hash } = createToken();
  const fields = {
    email,
    gender,
    status: 'pending',
    confirm_token_hash: hash,
    confirm_expires_at: new Date(Date.now() + CONFIRM_LINK_VALID_HOURS * 3600_000).toISOString(),
    consent_text: CONSENT_TEXT,
    consent_at: new Date().toISOString(),
    unsubscribed_at: null,
    updated_at: new Date().toISOString(),
  };
  const { error: saveError } = existing
    ? await db.from('newsletter_subscribers').update(fields).eq('id', existing.id)
    : await db.from('newsletter_subscribers').insert(fields);
  if (saveError) {
    console.error('Newsletter save error:', saveError);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  const confirmUrl = `${SITE_URL}/newsletter/confirm?token=${token}`;
  try {
    await sendEmail({
      to: email,
      subject: `Confirm your email for ${WELCOME_DISCOUNT_PERCENT}% off`,
      html: brandEmail({
        title: 'One click to your welcome code',
        body: `<p>Thanks for joining the Vintage Closet newsletter. Confirm your email and we'll send your personal ${WELCOME_DISCOUNT_PERCENT}% code for your first order.</p>`,
        buttonLabel: 'Confirm my email',
        buttonUrl: confirmUrl,
        footer: `The link works for ${CONFIRM_LINK_VALID_HOURS} hours. If you didn't sign up, just ignore this email.<br>`,
      }),
      text: `Confirm your email for your ${WELCOME_DISCOUNT_PERCENT}% Vintage Closet code: ${confirmUrl}\nIf you didn't sign up, ignore this email.`,
    });
  } catch (error) {
    console.error('Newsletter confirm email failed:', error);
    return NextResponse.json({ error: 'We could not send the email. Please try again later.' }, { status: 502 });
  }

  return NextResponse.json(CHECK_INBOX);
}
