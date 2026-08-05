-- Prevent two users from having the same display name or phone number.
-- display_name uniqueness is case-insensitive ("Juan" and "juan" collide);
-- phone allows multiple NULLs (Postgres default), so users without a phone
-- set yet don't collide with each other.
--
-- IMPORTANT: if any existing rows already have duplicate display_name or
-- phone values (likely, since that's the bug this migration fixes), the
-- CREATE UNIQUE INDEX statements below will fail. Run this first to find
-- them, then rename/clear one side of each collision before retrying:
--
--   select lower(display_name), array_agg(id) from public.users
--   group by lower(display_name) having count(*) > 1;
--
--   select phone, array_agg(id) from public.users
--   where phone is not null group by phone having count(*) > 1;

create unique index if not exists users_display_name_unique_idx
  on public.users (lower(display_name));

create unique index if not exists users_phone_unique_idx
  on public.users (phone)
  where phone is not null;
