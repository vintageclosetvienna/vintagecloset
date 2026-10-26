-- ============================================
-- Advisor fixes, round 2 (26 Oct 2026). Run in the SQL editor as role postgres; safe to run again.
-- ============================================

-- Team settings: one read rule, and managers' write rules per action (no second read rule)
drop policy if exists "Managers write settings" on public.staff_settings;
drop policy if exists "Managers add settings" on public.staff_settings;
drop policy if exists "Managers change settings" on public.staff_settings;
drop policy if exists "Managers remove settings" on public.staff_settings;
create policy "Managers add settings" on public.staff_settings
  for insert to authenticated with check ((select public.is_admin()));
create policy "Managers change settings" on public.staff_settings
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "Managers remove settings" on public.staff_settings
  for delete to authenticated using ((select public.is_admin()));

-- Activity log: the signed-in email is read once per query, not once per row
drop policy if exists "Managers read the log, the team its own entries" on public.activity_log;
create policy "Managers read the log, the team its own entries" on public.activity_log
  for select to authenticated
  using ((select public.is_admin()) or ((select public.is_staff()) and actor = ((select auth.jwt()) ->> 'email')));
