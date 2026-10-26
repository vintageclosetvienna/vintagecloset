import { createClient } from '@supabase/supabase-js';

// Team roles live in the Supabase table public.admin_users (see supabase/migrations)
export type TeamRole = 'owner' | 'manager' | 'staff' | 'studio';

export interface TeamMember {
  email: string;
  role: TeamRole;
  displayName: string | null;
}

/**
 * Reads the signed-in user's token from the Authorization header and returns
 * their team role, or null when the caller is not on the team list.
 * Supabase checks the token signature, so a forged token gets nothing back.
 */
export async function getTeamMember(request: Request): Promise<TeamMember | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const header = request.headers.get('authorization') || '';
  const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!url || !anonKey || !token) return null;

  const client = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.rpc('my_staff_profile');
  if (error || !Array.isArray(data) || data.length === 0) return null;
  const row = data[0] as { email: string; role: TeamRole; display_name: string | null };
  return { email: row.email, role: row.role, displayName: row.display_name };
}

export function hasRole(member: TeamMember | null, roles: TeamRole[]): member is TeamMember {
  return !!member && roles.includes(member.role);
}
