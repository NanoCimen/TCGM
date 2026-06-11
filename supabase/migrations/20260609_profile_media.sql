-- Profile media: banner column + storage bucket for avatars/banners
-- Run this in the Supabase SQL Editor

alter table public.users add column if not exists banner_url text;

-- Public bucket for profile images (avatar + banner)
insert into storage.buckets (id, name, public)
values ('profiles', 'profiles', true)
on conflict (id) do nothing;

-- Anyone can view profile images
create policy "Public read profile images"
  on storage.objects for select
  using (bucket_id = 'profiles');

-- Users can upload files only inside their own folder: {user_id}/...
create policy "Users upload own profile images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'profiles'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own profile images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'profiles'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profiles'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own profile images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'profiles'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
