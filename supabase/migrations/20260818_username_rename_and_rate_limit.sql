-- Rename display_name -> username, and add rate-limiting for username
-- changes: 2 changes per rolling 6-month window, uniqueness already
-- enforced by the existing case-insensitive unique index (renamed below).
--
-- New accounts get their first real username for free (the trigger seeds
-- a placeholder from the email prefix, so a brand-new user immediately
-- overwriting that during onboarding/registration must not burn one of
-- their 2 changes). username_claimed tracks whether the user has ever
-- deliberately set their username; existing rows are backfilled to true
-- since those users already have an established name.
--
-- Wrapped in an explicit transaction so a failure partway through (e.g.
-- another trigger function we haven't found yet) rolls back cleanly
-- instead of leaving the rename half-applied.

begin;

alter table public.users rename column display_name to username;
alter index users_display_name_unique_idx rename to users_username_unique_idx;

alter table public.users
  add column if not exists username_claimed boolean not null default false;

-- Trigger function bodies are plain text (unlike indexes/views/policies,
-- which store parsed expressions and get their column references rewritten
-- automatically by RENAME COLUMN) — every function that referenced
-- display_name must be replaced BEFORE any statement below fires it.

-- Auto-create users row on every new signup (email or phone) — same as
-- schema.sql's handle_new_user, updated for the renamed column.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.users (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Auto-generate 3 invite codes when onboarding completes (fires on UPDATE
-- of public.users — this is what the earlier failed attempt hit, since the
-- statement below updates every row and the old function body still read
-- OLD.display_name/NEW.display_name).
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
  if old.username is null and new.username is not null then
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

update public.users set username_claimed = true where username_claimed = false;

create table if not exists public.username_changes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  old_username text,
  new_username text not null,
  changed_at   timestamptz not null default now()
);

create index if not exists username_changes_user_id_changed_at_idx
  on public.username_changes (user_id, changed_at);

alter table public.username_changes enable row level security;

drop policy if exists "Users read own username change history" on public.username_changes;
create policy "Users read own username change history"
  on public.username_changes for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users log own username changes" on public.username_changes;
create policy "Users log own username changes"
  on public.username_changes for insert to authenticated
  with check (auth.uid() = user_id);

commit;
