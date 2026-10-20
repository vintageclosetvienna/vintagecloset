import { NextRequest, NextResponse } from 'next/server';
import {
  WELCOME_CODE_VALID_DAYS,
  WELCOME_DISCOUNT_PERCENT,
  createToken,
  createWelcomeCode,
  isNewsletterConfigured,
  newsletterDb,
  sha256,
} from '@/lib/newsletter';
import { brandEmail, sendEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/site';

// Called by the confirm page button (POST, so email link scanners can't confirm by just opening the link)
export async function POST(request: NextRequest) {
  if (!isNewsletterConfigured()) {
    return NextResponse.json({ error: 'The newsletter is not available yet.' }, { status: 503 });
  }

  const { token } = await request.json().catch(() => ({ token: '' }));
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'This link is not valid.' }, { status: 400 });
  }

  const db = newsletterDb();
  const { data: subscriber } = await db
    .from('newsletter_subscribers')
    .select('id, email, status, confirm_expires_at')
    .eq('confirm_token_hash', sha256(token))
    .maybeSingle();

  if (!subscriber || subscriber.status !== 'pending') {
    return NextResponse.json({ error: 'This link was already used or is not valid.' }, { status: 400 });
  }
  if (new Date(subscriber.confirm_expires_at) < new Date()) {
    return NextResponse.json({ error: 'This link has expired. Please sign up again.' }, { status: 410 });
  }

  // Personal single-use code, valid 3 months, only for this email
  const expiresAt = new Date(Date.now() + WELCOME_CODE_VALID_DAYS * 86_400_000);
  let code = '';
  let codeId: string | null = null;
  for (let attempt = 0; attempt < 3 && !codeId; attempt++) {
    code = createWelcomeCode();
    const { data, error } = await db
      .from('discount_codes')
      .insert({
        code,
        description: `Newsletter welcome ${WELCOME_DISCOUNT_PERCENT}%`,
        discount_type: 'percentage',
        discount_value: WELCOME_DISCOUNT_PERCENT,
        usage_limit: 1,
        applies_to: 'all',
        product_ids: [],
        is_active: true,
        starts_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        restricted_email: subscriber.email,
      })
      .select('id')
      .single();
    if (!error) codeId = data.id;
  }
  if (!codeId) {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  const unsubscribe = createToken();
  await db
    .from('newsletter_subscribers')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      confirm_token_hash: null,
      confirm_expires_at: null,
      unsubscribe_token_hash: unsubscribe.hash,
      discount_code_id: codeId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', subscriber.id);

  const unsubscribeUrl = `${SITE_URL}/newsletter/unsubscribe?token=${unsubscribe.token}`;
  const until = expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  try {
    await sendEmail({
      to: subscriber.email,
      subject: `Your ${WELCOME_DISCOUNT_PERCENT}% welcome code`,
      html: brandEmail({
        title: `Welcome! Here is ${WELCOME_DISCOUNT_PERCENT}% off`,
        body: `<p>Your personal code for your first order:</p>
<p style="font-size:24px;font-weight:700;letter-spacing:2px;color:#602140;margin:16px 0">${code}</p>
<p>Enter it at checkout with this email address. Valid once, until ${until}.</p>`,
        buttonLabel: 'Shop new arrivals',
        buttonUrl: `${SITE_URL}/new-arrivals`,
        footer: `You get this email because you signed up at vintagecloset.app. <a href="${unsubscribeUrl}" style="color:#8A949C">Unsubscribe</a><br>`,
      }),
      text: `Your ${WELCOME_DISCOUNT_PERCENT}% Vintage Closet code: ${code} (valid once until ${until}, with this email). Unsubscribe: ${unsubscribeUrl}`,
      headers: {
        'List-Unsubscribe': `<${SITE_URL}/api/newsletter/unsubscribe?token=${unsubscribe.token}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });
  } catch (error) {
    // The code is still shown on the page, so the subscriber is not blocked
    console.error('Newsletter welcome email failed:', error);
  }

  return NextResponse.json({ ok: true, code, expiresAt: expiresAt.toISOString(), percent: WELCOME_DISCOUNT_PERCENT });
}
