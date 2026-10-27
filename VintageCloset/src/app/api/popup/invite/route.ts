import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { getTeamMember, hasRole } from '@/lib/server-auth';
import { createServerClient } from '@/lib/supabase';
import { SITE_URL } from '@/lib/site';

/**
 * Creates (or returns the existing) secret link for one line-up slot, so the DJ can
 * fill in their own name, photo and links. Team only; tokens live in event_dj_invites,
 * which the browser can never read.
 */
export async function POST(request: NextRequest) {
  const member = await getTeamMember(request);
  if (!hasRole(member, ['owner', 'manager', 'staff'])) {
    return NextResponse.json({ error: 'Please sign in to the shop team area first.' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { eventId?: unknown; slotId?: unknown } | null;
  const eventId = typeof body?.eventId === 'string' ? body.eventId : '';
  const slotId = typeof body?.slotId === 'string' ? body.slotId.slice(0, 40) : '';
  if (!eventId || !slotId) return NextResponse.json({ error: 'Missing event or slot.' }, { status: 400 });

  const db = createServerClient();
  const { data: existing } = await db
    .from('event_dj_invites' as never)
    .select('token')
    .eq('event_id', eventId)
    .eq('slot_id', slotId)
    .maybeSingle();

  let token = (existing as { token?: string } | null)?.token;
  if (!token) {
    token = randomBytes(18).toString('base64url');
    const { error } = await db
      .from('event_dj_invites' as never)
      .insert({ token, event_id: eventId, slot_id: slotId, created_by: member.email } as never);
    if (error) return NextResponse.json({ error: 'Could not create the link.' }, { status: 500 });
  }

  return NextResponse.json({ url: `${SITE_URL}/dj/${token}` });
}
