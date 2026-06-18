-- API usage tracking for rate limiting
create table public.usage_logs (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  action     text not null,
  created_at timestamptz default now()
);

create index usage_logs_user_action_idx on public.usage_logs(user_id, action, created_at);

alter table public.usage_logs enable row level security;

-- Users can only insert their own logs
create policy "Users can log own actions"
  on public.usage_logs for insert to authenticated
  with check (auth.uid() = user_id);

-- Service role reads all (for admin), users read own
create policy "Users can read own logs"
  on public.usage_logs for select to authenticated
  using (auth.uid() = user_id);
