-- ============================================
-- Supabase advisor fixes (26 Oct 2026). Run once in the SQL editor; safe to run again.
-- Same access as before for every role; fewer duplicate rules, no API access where nobody needs it.
-- ============================================
begin;

-- 1 · Trigger functions: nobody calls these through the API (triggers keep working without EXECUTE)
revoke execute on function public.block_unlisted_signups() from public, anon, authenticated;
revoke execute on function public.log_change() from public, anon, authenticated;

-- 2 · Only signed-in people need their own team profile; counting a voucher use is server-only now
revoke execute on function public.my_staff_profile() from public, anon;
revoke execute on function public.use_discount_code(text) from public, anon, authenticated;
-- Intentionally still public: is_admin / is_staff / is_studio / current_staff_role (used inside the shop's
-- row rules, they answer "no" for visitors), validate_discount_code (checkout preview),
-- get_active_archive_stories (public stories).

-- 3 · Team-only tables: visitors (anon) do not even see them in the API
revoke select on table
  public.activity_log, public.daily_checks, public.staff_notes, public.staff_shifts, public.staff_tasks,
  public.studio_photos, public.product_drafts, public.orders, public.discount_codes
from anon;

-- 4 · One rule per action instead of overlapping ones (staff rules already include owners and managers)
drop policy if exists "Authenticated users can view discount codes" on public.discount_codes;

drop policy if exists "Authenticated users can insert events" on public.events;
drop policy if exists "Authenticated users can update events" on public.events;
drop policy if exists "Authenticated users can view all events" on public.events;
drop policy if exists "Staff can view all events" on public.events;
drop policy if exists "Published events are viewable by everyone" on public.events;
create policy "Published events are viewable by everyone, all by the team" on public.events
  for select using (is_published = true or (select public.is_staff()));

drop policy if exists "Authenticated users can insert articles" on public.journal_articles;
drop policy if exists "Authenticated users can update articles" on public.journal_articles;
drop policy if exists "Authenticated users can view all articles" on public.journal_articles;
drop policy if exists "Staff can view all articles" on public.journal_articles;
drop policy if exists "Published articles are viewable by everyone" on public.journal_articles;
create policy "Published articles are viewable by everyone, all by the team" on public.journal_articles
  for select using (is_draft = false or (select public.is_staff()));

drop policy if exists "Orders are viewable by authenticated users" on public.orders;
drop policy if exists "Orders are editable by authenticated users" on public.orders;

drop policy if exists "Admins can view pickup codes" on public.pickup_codes;
drop policy if exists "Admins can redeem pickup codes" on public.pickup_codes;

drop policy if exists "Products are editable by authenticated users" on public.products;
drop policy if exists "Owners and managers can delete products" on public.products;
create policy "Owners and managers can delete products" on public.products
  for delete using ((select public.is_admin()));
drop policy if exists "Products are viewable by everyone" on public.products;
create policy "Products are viewable by everyone" on public.products
  for select using (is_draft = false or (select public.is_staff()));

drop policy if exists "Authenticated users can view all archive stories" on public.archive_stories;
drop policy if exists "Active archive stories are viewable by everyone" on public.archive_stories;
create policy "Active archive stories are viewable by everyone, all by managers" on public.archive_stories
  for select using (is_active = true or (select public.is_admin()));

drop policy if exists "Authenticated users can view all site images" on public.site_images;
drop policy if exists "Active site images are viewable by everyone" on public.site_images;
create policy "Active site images are viewable by everyone, all by managers" on public.site_images
  for select using (is_active = true or (select public.is_admin()));

-- 5 · Activity log: one read rule, evaluated once per query instead of once per row
drop policy if exists "Managers read the log" on public.activity_log;
drop policy if exists "Team reads own log" on public.activity_log;
create policy "Managers read the log, the team its own entries" on public.activity_log
  for select to authenticated
  using ((select public.is_admin()) or ((select public.is_staff()) and actor = (select auth.jwt() ->> 'email')));

-- 6 · Indexes for the links between tables (faster order, pickup and studio lookups)
create index if not exists idx_newsletter_subscribers_discount_code_id on public.newsletter_subscribers(discount_code_id);
create index if not exists idx_orders_product_id on public.orders(product_id);
create index if not exists idx_pickup_codes_order_id on public.pickup_codes(order_id);
create index if not exists idx_pickup_codes_product_id on public.pickup_codes(product_id);
create index if not exists idx_studio_photos_product_id on public.studio_photos(product_id);

commit;
