-- ============================================
-- Team app settings (26 Oct 2026): one shared row per setting, e.g. the Today day plan ('day_plan').
-- The whole team reads it; owners and managers change it. Run once in the SQL editor; safe to run again.
-- ============================================
create table if not exists public.staff_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.staff_settings enable row level security;
revoke all on table public.staff_settings from anon;

drop policy if exists "Team reads settings" on public.staff_settings;
create policy "Team reads settings" on public.staff_settings
  for select to authenticated using ((select public.is_staff()));

drop policy if exists "Managers write settings" on public.staff_settings;
create policy "Managers write settings" on public.staff_settings
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
