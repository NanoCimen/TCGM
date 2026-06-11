-- TCGM Complete Database Schema
-- Last updated: June 2026
-- Run this only on a fresh project. For existing projects all migrations are already applied.

-- ============================================================
-- TABLES
-- ============================================================

create table public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  phone           text,
  display_name    text,
  avatar_url      text,
  banner_url      text,
  invite_code_used text,
  created_at      timestamptz not null default now()
);

create table public.cards (
  id                uuid primary key default gen_random_uuid(),
  seller_id         uuid not null references public.users(id) on delete cascade,
  card_name         text not null,
  set_name          text,
  card_number       text,
  image_url         text,
  official_image_url text,
  price_usd         numeric(10,2),
  tcg_market_price  numeric(10,2),
  status            text not null default 'available'
                    check (status in ('available', 'sold', 'hold')),
  notes             text,
  variant           text default 'Regular',
  language          text default 'EN',
  is_graded         boolean default false,
  grade             text default null,
  grade_company     text default null,
  in_marketplace    boolean default false,
  created_at        timestamptz not null default now()
);

create table public.invites (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  created_by uuid references public.users(id) on delete set null,
  used_by    uuid references public.users(id) on delete set null,
  used_at    timestamptz
);

create table public.wishlist (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  pokemon_tcg_id text,
  card_name      text not null,
  card_number    text,
  set_name       text,
  set_id         text,
  image_url      text,
  variant        text,
  created_at     timestamptz default now()
);

create unique index if not exists wishlist_user_card
  on public.wishlist(user_id, pokemon_tcg_id)
  where pokemon_tcg_id is not null;

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null default 'wishlist_match',
  card_id    uuid references public.cards(id) on delete set null,
  message    text,
  read       boolean not null default false,
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index cards_seller_id_idx  on public.cards(seller_id);
create index cards_status_idx     on public.cards(status);
create index invites_code_idx     on public.invites(code);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create users row on every new signup (email or phone)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Generate invite code helper
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i      int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- Auto-generate 3 invite codes when onboarding completes
create or replace function public.generate_user_invites()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  i        int;
  new_code text;
  attempts int;
begin
  if old.display_name is null and new.display_name is not null then
    for i in 1..3 loop
      attempts := 0;
      loop
        new_code := public.generate_invite_code();
        begin
          insert into public.invites (code, created_by)
          values (new_code, new.id);
          exit;
        exception when unique_violation then
          attempts := attempts + 1;
          if attempts >= 10 then
            raise exception 'Failed to generate unique invite code';
          end if;
        end;
      end loop;
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists on_user_onboarding_complete on public.users;
create trigger on_user_onboarding_complete
  after update on public.users
  for each row execute function public.generate_user_invites();

-- Notify wishlist owners when a matching card is published
create or replace function public.notify_wishlist_on_card_publish()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if NEW.status = 'available' then
    insert into public.notifications (user_id, type, card_id, message)
    select
      w.user_id,
      'wishlist_match',
      NEW.id,
      '¡Una carta de tu wishlist está disponible! ' || NEW.card_name ||
        case when NEW.set_name is not null then ' (' || NEW.set_name || ')' else '' end
    from public.wishlist w
    where lower(w.card_name) = lower(NEW.card_name)
      and w.user_id != coalesce(NEW.seller_id, '00000000-0000-0000-0000-000000000000'::uuid)
    on conflict do nothing;
  end if;
  return NEW;
end;
$$;

drop trigger if exists on_card_published on public.cards;
create trigger on_card_published
  after insert on public.cards
  for each row execute function public.notify_wishlist_on_card_publish();

-- ============================================================
-- RLS
-- ============================================================

alter table public.users         enable row level security;
alter table public.cards         enable row level security;
alter table public.invites       enable row level security;
alter table public.wishlist      enable row level security;
alter table public.notifications enable row level security;

-- Users
create policy "Users can read own profile"
  on public.users for select to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Cards
create policy "Authenticated users can read all cards"
  on public.cards for select to authenticated
  using (true);

create policy "Sellers can insert own cards"
  on public.cards for insert to authenticated
  with check (auth.uid() = seller_id);

create policy "Sellers can update own cards"
  on public.cards for update to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy "Sellers can delete own cards"
  on public.cards for delete to authenticated
  using (auth.uid() = seller_id);

-- Invites
create policy "Authenticated users can read invites"
  on public.invites for select to authenticated
  using (true);

create policy "Users can create own invites"
  on public.invites for insert to authenticated
  with check (created_by = auth.uid());

create policy "Users can mark invite as used"
  on public.invites for update to authenticated
  using (used_by is null)
  with check (used_by = auth.uid());

-- Wishlist
create policy "Users manage own wishlist"
  on public.wishlist for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Notifications
create policy "Users read own notifications"
  on public.notifications for select to authenticated
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on public.notifications for update to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('card-images', 'card-images', true, 5242880, ARRAY['image/jpeg','image/jpg','image/png','image/webp']),
  ('profiles',    'profiles',    true, 5242880, ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
on conflict (id) do nothing;

-- Card images
create policy "Users can upload own card images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'card-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Anyone can view card images"
  on storage.objects for select to authenticated
  using (bucket_id = 'card-images');

-- Profile images
create policy "Users can upload own profile images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'profiles' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update own profile images"
  on storage.objects for update to authenticated
  using (bucket_id = 'profiles' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own profile images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'profiles' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Profile images are publicly readable"
  on storage.objects for select to public
  using (bucket_id = 'profiles');