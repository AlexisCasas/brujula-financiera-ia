-- BF-041a: private watchlist with immutable follow/unfollow event history.
-- IMPORTANT: Supabase is shared development/production. Prepare only in GitHub
-- until the Product Owner explicitly authorizes applying this migration.

create table public.watchlist_item (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listing(id) on delete restrict,
  status text not null default 'active'
    check (status in ('active', 'inactive')),
  first_followed_at timestamptz not null default now(),
  status_changed_at timestamptz not null default now(),
  constraint watchlist_one_listing_per_owner unique (owner_user_id, listing_id)
);

comment on table public.watchlist_item is
  'BF-041a: tracked listings only; being followed never means held or purchased.';
create index watchlist_item_owner_status_idx
  on public.watchlist_item(owner_user_id, status, status_changed_at desc);

create table public.watchlist_event (
  id uuid primary key default gen_random_uuid(),
  watchlist_item_id uuid not null references public.watchlist_item(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid not null references public.listing(id) on delete restrict,
  action text not null check (action in ('follow', 'unfollow', 'resume')),
  occurred_at timestamptz not null default now()
);
comment on table public.watchlist_event is
  'BF-041a: append-only audit of effective watchlist state transitions.';
create index watchlist_event_owner_recent_idx
  on public.watchlist_event(owner_user_id, occurred_at desc);

alter table public.watchlist_item enable row level security;
alter table public.watchlist_event enable row level security;

create policy watchlist_item_owner_read on public.watchlist_item
  for select to authenticated
  using (owner_user_id = (select auth.uid()) and (select private.is_owner()));

create policy watchlist_event_owner_read on public.watchlist_event
  for select to authenticated
  using (owner_user_id = (select auth.uid()) and (select private.is_owner()));

revoke all on public.watchlist_item from public, anon, authenticated;
revoke all on public.watchlist_event from public, anon, authenticated;
grant select on public.watchlist_item to authenticated;
grant select on public.watchlist_event to authenticated;

-- Privileged mutation is kept outside exposed public schema. Public RPC is
-- SECURITY INVOKER and grants no direct DML privileges to authenticated.
create function private.set_watchlist_follow(
  p_listing_id uuid,
  p_follow boolean
)
returns text
language plpgsql
security definer
set search_path = ''
as $bf$
declare
  v_owner uuid := auth.uid();
  v_item_id uuid;
  v_current_status text;
  v_desired_status text := case when p_follow then 'active' else 'inactive' end;
  v_event_action text;
begin
  if v_owner is null or not (select private.is_owner()) then
    raise exception 'No autorizado para modificar el seguimiento'
      using errcode = '42501';
  end if;

  if p_listing_id is null or p_follow is null then
    raise exception 'ID de listing y acción son obligatorios'
      using errcode = '22023';
  end if;

  -- Never accept only a ticker; identify an existing actual listing.
  if not exists (
    select 1 from public.listing l
    join public.instrument i on i.id = l.instrument_id
    where l.id = p_listing_id
  ) then
    raise exception 'Listing no registrado en el catálogo'
      using errcode = '22023';
  end if;

  if p_follow then
    insert into public.watchlist_item(owner_user_id, listing_id)
    values (v_owner, p_listing_id)
    on conflict (owner_user_id, listing_id) do nothing
    returning id into v_item_id;

    if v_item_id is not null then
      insert into public.watchlist_event(
        watchlist_item_id, owner_user_id, listing_id, action
      ) values (v_item_id, v_owner, p_listing_id, 'follow');
      return 'followed';
    end if;
  end if;

  select id, status into v_item_id, v_current_status
  from public.watchlist_item
  where owner_user_id = v_owner and listing_id = p_listing_id
  for update;

  if v_item_id is null then
    return 'not_following';
  end if;
  if v_current_status = v_desired_status then
    return case when p_follow then 'already_following' else 'already_inactive' end;
  end if;

  update public.watchlist_item
  set status = v_desired_status, status_changed_at = now()
  where id = v_item_id;

  v_event_action := case when p_follow then 'resume' else 'unfollow' end;
  insert into public.watchlist_event(
    watchlist_item_id, owner_user_id, listing_id, action
  ) values (v_item_id, v_owner, p_listing_id, v_event_action);

  return case when p_follow then 'resumed' else 'unfollowed' end;
end
$bf$;

revoke all on function private.set_watchlist_follow(uuid,boolean)
  from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.set_watchlist_follow(uuid,boolean)
  to authenticated;

create function public.set_watchlist_follow(
  p_listing_id uuid,
  p_follow boolean
)
returns text
language sql
security invoker
set search_path = ''
as $bf$
  select private.set_watchlist_follow(p_listing_id,p_follow);
$bf$;

revoke all on function public.set_watchlist_follow(uuid,boolean)
  from public, anon, authenticated;
grant execute on function public.set_watchlist_follow(uuid,boolean)
  to authenticated;
