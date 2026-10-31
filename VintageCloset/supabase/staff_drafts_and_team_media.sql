-- ============================================
-- Team app update (31 Oct 2026)
-- 1. Staff can publish pipeline drafts: once a draft is in the shop (a product with the same id exists),
--    staff may remove the draft row. Discarding an unpublished draft stays owner/manager only.
-- 2. Media from Sobhi to the team (Studio › Von Sobhi): photos, videos and stories the owner sends;
--    the team sees and downloads them, only owner/manager add or remove them.
-- Applied as migration `staff_drafts_and_team_media`. Safe to run again.
-- ============================================

drop policy if exists "Staff remove published drafts" on public.product_drafts;
create policy "Staff remove published drafts" on public.product_drafts for delete
  using ((select public.is_staff()) and exists (select 1 from public.products p where p.id = product_drafts.id));

create table if not exists public.team_media (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'photo' check (kind in ('photo', 'video', 'story')),
  title text not null default '',
  caption text,
  path text not null,
  url text not null,
  mime text,
  size_bytes bigint,
  created_by text default (auth.jwt() ->> 'email'),
  created_at timestamptz not null default now()
);
create index if not exists idx_team_media_created_at on public.team_media (created_at desc);
alter table public.team_media enable row level security;

drop policy if exists "Team sees media" on public.team_media;
create policy "Team sees media" on public.team_media for select using ((select public.is_staff()));
drop policy if exists "Managers add media" on public.team_media;
create policy "Managers add media" on public.team_media for insert with check ((select public.is_admin()));
drop policy if exists "Managers update media" on public.team_media;
create policy "Managers update media" on public.team_media for update using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists "Managers delete media" on public.team_media;
create policy "Managers delete media" on public.team_media for delete using ((select public.is_admin()));

-- Public bucket (files open by their address, like the studio bucket); 50 MB per file
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('team-media', 'team-media', true, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif', 'video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Team lists team media" on storage.objects;
create policy "Team lists team media" on storage.objects for select using (bucket_id = 'team-media' and (select public.is_staff()));
drop policy if exists "Managers upload team media" on storage.objects;
create policy "Managers upload team media" on storage.objects for insert with check (bucket_id = 'team-media' and (select public.is_admin()));
drop policy if exists "Managers delete team media" on storage.objects;
create policy "Managers delete team media" on storage.objects for delete using (bucket_id = 'team-media' and (select public.is_admin()));
