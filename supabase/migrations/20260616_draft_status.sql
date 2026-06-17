-- Add 'draft' status for cards in portfolio but not yet listed in marketplace

alter table public.cards drop constraint if exists cards_status_check;

alter table public.cards
  add constraint cards_status_check
  check (status in ('draft', 'available', 'hold', 'sold'));

alter table public.cards
  alter column status set default 'draft';
