import { NextResponse } from 'next/server';
import { isNewsletterConfigured, WELCOME_DISCOUNT_PERCENT } from '@/lib/newsletter';

// The pop-up only shows when email sending is set up
export async function GET() {
  return NextResponse.json({ enabled: isNewsletterConfigured(), percent: WELCOME_DISCOUNT_PERCENT });
}
