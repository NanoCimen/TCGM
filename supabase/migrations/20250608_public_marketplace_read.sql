-- Allow public marketplace browsing without auth

create policy "Anyone can read all cards"
  on public.cards for select
  to anon, authenticated
  using (true);

create policy "Anyone can read public profiles"
  on public.users for select
  to anon, authenticated
  using (display_name is not null);
