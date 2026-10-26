import { NextRequest, NextResponse } from 'next/server';
import { getTeamMember, hasRole } from '@/lib/server-auth';

export const dynamic = 'force-dynamic';

// Shows only whether each server setting is present, never its value
export async function GET(request: NextRequest) {
  // Preview deployments sit behind Vercel login, so the check is open there; production needs a manager
  if (process.env.VERCEL_ENV !== 'preview') {
    const member = await getTeamMember(request);
    if (!hasRole(member, ['owner', 'manager'])) {
      return NextResponse.json({ error: 'Managers only' }, { status: 401 });
    }
  }
  const present = (v: string | undefined) => typeof v === 'string' && v.trim().length > 10;
  const checks = [
    { name: 'Supabase', ok: present(process.env.NEXT_PUBLIC_SUPABASE_URL) && present(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) },
    { name: 'Supabase Server', ok: present(process.env.SUPABASE_SERVICE_ROLE_KEY) },
    { name: 'Stripe', ok: present(process.env.STRIPE_SECRET_KEY) && present(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) },
    { name: 'Stripe Webhook', ok: present(process.env.STRIPE_WEBHOOK_SECRET) },
    { name: 'OpenAI (KI)', ok: present(process.env.OPENAI_API_KEY) },
  ];
  return NextResponse.json({ checks, environment: process.env.VERCEL_ENV ?? 'local' }, { headers: { 'Cache-Control': 'no-store' } });
}
