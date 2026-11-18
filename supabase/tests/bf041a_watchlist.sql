-- BF-041a: authorized SQL QA only, transaction rolls back all fixtures.
-- Do not execute on shared Supabase until Product Owner separately approves.
begin;
select set_config(
  'request.jwt.claim.sub',
  (select user_id::text from public.app_owner limit 1),
  true
);
set local role authenticated;

do $qa$
declare
  v_listing uuid;
  v_row uuid;
  v_result text;
  v_count integer;
  v_unauthorized boolean;
begin
  select id into v_listing from public.listing order by id limit 1;
  if v_listing is null then raise exception 'QA precondition: no listing'; end if;

  -- QA01: add real listing
  v_result := public.set_watchlist_follow(v_listing, true);
  if v_result <> 'followed' then raise exception 'QA01 follow failed: %', v_result; end if;
  select id into v_row from public.watchlist_item
    where listing_id = v_listing and status = 'active';
  if v_row is null then raise exception 'QA01 no active item'; end if;

  -- QA02: repeated add does not create events or duplicate rows
  v_result := public.set_watchlist_follow(v_listing, true);
  select count(*) into v_count from public.watchlist_event where watchlist_item_id = v_row;
  if v_result <> 'already_following' or v_count <> 1 then
    raise exception 'QA02 add not idempotent';
  end if;

  -- QA03: stop following (soft removal, not deletion)
  v_result := public.set_watchlist_follow(v_listing, false);
  if v_result <> 'unfollowed' or not exists(
    select 1 from public.watchlist_item where id = v_row and status = 'inactive'
  ) then raise exception 'QA03 stop failed'; end if;

  -- QA04: repeat stop does not duplicate event
  v_result := public.set_watchlist_follow(v_listing, false);
  select count(*) into v_count from public.watchlist_event where watchlist_item_id = v_row;
  if v_result <> 'already_inactive' or v_count <> 2 then
    raise exception 'QA04 stop not idempotent';
  end if;

  -- QA05: resume reuses the same watchlist row; events remain append-only
  v_result := public.set_watchlist_follow(v_listing, true);
  select count(*) into v_count from public.watchlist_event where watchlist_item_id = v_row;
  if v_result <> 'resumed' or v_count <> 3 or not exists(
    select 1 from public.watchlist_item where id = v_row and status = 'active'
  ) then raise exception 'QA05 resume or event history failed'; end if;

  -- QA06: no direct UPDATE on watchlist item
  v_unauthorized := false;
  begin
    update public.watchlist_item set status = 'inactive' where id = v_row;
  exception when insufficient_privilege then v_unauthorized := true;
  end;
  if not v_unauthorized then raise exception 'QA06 direct UPDATE permitted'; end if;

  -- QA07: no direct INSERT on history
  v_unauthorized := false;
  begin
    insert into public.watchlist_event(
      watchlist_item_id,owner_user_id,listing_id,action
    ) values(v_row, auth.uid(), v_listing, 'follow');
  exception when insufficient_privilege then v_unauthorized := true;
  end;
  if not v_unauthorized then raise exception 'QA07 direct event INSERT permitted'; end if;

  -- QA08: unknown listing is rejected, not silently created
  v_unauthorized := false;
  begin
    perform public.set_watchlist_follow('00000000-0000-0000-0000-000000000099'::uuid,true);
  exception when sqlstate '22023' then v_unauthorized := true;
  end;
  if not v_unauthorized then raise exception 'QA08 unknown listing accepted'; end if;

  -- QA09: another auth.uid() cannot call the write RPC
  perform set_config('request.jwt.claim.sub',
    '00000000-0000-0000-0000-000000000099', true);
  v_unauthorized := false;
  begin
    perform public.set_watchlist_follow(v_listing, false);
  exception when insufficient_privilege then v_unauthorized := true;
  end;
  if not v_unauthorized then raise exception 'QA09 other user wrote'; end if;

  -- QA10: RLS denies reading previous owner's items and events
  if exists(select 1 from public.watchlist_item)
    or exists(select 1 from public.watchlist_event) then
    raise exception 'QA10 other user can read private watchlist';
  end if;

  raise notice 'BF041A_SQL_QA_PASS: 10 checks';
end
$qa$;
rollback;

select
  'BF041A_ROLLBACK_PASS' as result,
  (select count(*) from public.watchlist_item) as item_count,
  (select count(*) from public.watchlist_event) as event_count;
