-- Sell flow: official TCG image column + card-images storage bucket
-- Run this in the Supabase SQL Editor

alter table public.cards add column if not exists official_image_url text;

-- Public bucket for user card photos
insert into storage.buckets (id, name, public)
values ('card-images', 'card-images', true)
on conflict (id) do nothing;

-- Anyone can view card images
create policy "Public read card images"
  on storage.objects for select
  using (bucket_id = 'card-images');

-- Users can upload only inside their own folder: {user_id}/...
create policy "Users upload own card images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own card images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'card-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
