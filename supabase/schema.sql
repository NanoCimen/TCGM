-- TCGM Database Schema
-- Run this in the Supabase SQL Editor

-- Custom users profile table (extends auth.users)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text,
  display_name text,
  avatar_url text,
  invite_code_used text,
  created_at timestamptz not null default now()
);

create table public.cards (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users (id) on delete cascade,
  card_name text not null,
  set_name text,
  card_number text,
  image_url text,
  price_usd numeric(10, 2),
  tcg_market_price numeric(10, 2),
  status text not null default 'available' check (status in ('available', 'sold', 'hold')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.invites (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid references public.users (id) on delete set null,
  used_by uuid references public.users (id) on delete set null,
  used_at timestamptz
);

create index cards_seller_id_idx on public.cards (seller_id);
create index cards_status_idx on public.cards (status);
create index invites_code_idx on public.invites (code);

-- Auto-create profile row on every new signup (email OTP, OAuth, phone, etc.)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Generate 3 invite codes when a user completes onboarding
create or replace function public.generate_invite_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

create or replace function public.generate_user_invites()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
declare
  i int;
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

create trigger on_user_onboarding_complete
  after update on public.users
  for each row execute function public.generate_user_invites();

-- RLS
alter table public.users enable row level security;
alter table public.cards enable row level security;
alter table public.invites enable row level security;

-- Users: read, insert, and update own profile
create policy "Users can read own profile"
  on public.users for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.users for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.users for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Cards: all authenticated users can read; only seller can insert/update/delete
create policy "Authenticated users can read all cards"
  on public.cards for select
  to authenticated
  using (true);

create policy "Sellers can insert own cards"
  on public.cards for insert
  to authenticated
  with check (auth.uid() = seller_id);

create policy "Sellers can update own cards"
  on public.cards for update
  to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy "Sellers can delete own cards"
  on public.cards for delete
  to authenticated
  using (auth.uid() = seller_id);

-- Invites: authenticated users can read (to validate codes); system updates on use
create policy "Authenticated users can read invites"
  on public.invites for select
  to authenticated
  using (true);

create policy "Users can create own invites"
  on public.invites for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Users can mark invite as used"
  on public.invites for update
  to authenticated
  using (used_by is null)
  with check (used_by = auth.uid());
