-- The wishlist-match trigger only ran on INSERT, but cards are always
-- created with status 'draft' and published later via an UPDATE — so it
-- never actually fired in practice. Rebind it to fire on the transition
-- into 'available' too (on INSERT already-available, and on UPDATE when
-- status changes), and skip re-notifying on unrelated updates.

create or replace function public.notify_wishlist_on_card_publish()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  if NEW.status = 'available'
     and (TG_OP = 'INSERT' or OLD.status is distinct from NEW.status) then
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
  after insert or update on public.cards
  for each row execute function public.notify_wishlist_on_card_publish();
