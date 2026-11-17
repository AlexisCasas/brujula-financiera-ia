-- BF-040: nine BVL equity listings and ETF-isolation integration test.
-- Run after migration with explicit PO authorization.
-- Every watchlist mutation is wrapped in the single transaction and rolled back.
begin;
select set_config('request.jwt.claim.sub',
  (select user_id::text from public.app_owner limit 1), true);
set local role authenticated;

do $qa$
declare
  v_bap uuid;
  v_etf uuid;
  v_result text;
  v_first uuid;
  v_count integer;
  v_denied boolean;
begin
  -- 01: identities and types
  if (select count(*) from public.instrument where asset_type='equity') <> 9
     or (select count(*) from public.instrument where asset_type='etf') <> 5 then
    raise exception 'QA01: wrong equity/ETF classification';
  end if;
  -- 02: dedicated source-checked listing view
  if (select count(*) from public.equity_listing_overview) <> 9
     or exists (select 1 from public.equity_listing_overview
       where source_url is null or not identity_documented or source_date is null) then
    raise exception 'QA02: missing equity or provenance';
  end if;
  -- 03: Credicorp local listing is USD, not BCP bank or NYSE
  select listing_id into v_bap from public.equity_listing_overview
  where ticker='BAP' and exchange='XLIM' and currency='USD'
    and isin='BMG2519Y1084' and name='Credicorp Ltd.';
  if v_bap is null then raise exception 'QA03: Credicorp BVL identity mismatch'; end if;
  -- 04: InRetail is also USD; other seven BVL capital shares are PEN
  if (select count(*) from public.equity_listing_overview where currency='USD')<>2
     or (select count(*) from public.equity_listing_overview where currency='PEN')<>7 then
    raise exception 'QA04: BVL quote currencies wrong';
  end if;
  -- 05: ETFs remain independent
  if (select count(*) from public.catalog_overview) <> 5
     or exists(select 1 from public.catalog_overview where isin='BMG2519Y1084') then
    raise exception 'QA05: equity leaked into ETF catalog';
  end if;
  -- 06: prevent saving BAP as ETF even if caller bypasses UI
  select listing_id into v_etf from public.catalog_overview limit 1;
  v_denied := false;
  begin
    perform public.save_etf_comparison(array[v_etf,v_bap], 'negative test BF-040');
  exception when sqlstate '22023' then v_denied:=true;
  end;
  if not v_denied then raise exception 'QA06: equity accepted as ETF'; end if;
  -- 07: follow BAP by exact listing
  v_result:=public.set_watchlist_follow(v_bap,true);
  if v_result <> 'followed' then raise exception 'QA07: BAP follow failed: %',v_result; end if;
  select id into v_first from public.watchlist_item where listing_id=v_bap;
  if v_first is null then raise exception 'QA07: BAP watchlist not written'; end if;
  -- 08: idempotent repeated follow
  v_result:=public.set_watchlist_follow(v_bap,true);
  select count(*) into v_count from public.watchlist_event where listing_id=v_bap;
  if v_result <> 'already_following' or v_count <> 1 then
    raise exception 'QA08: repeated follow duplicated events';
  end if;
  -- 09: soft removal and reactivation preserve first id
  if public.set_watchlist_follow(v_bap,false) <> 'unfollowed'
     or public.set_watchlist_follow(v_bap,true) <> 'resumed' then
     raise exception 'QA09: removal/reactivation failed';
  end if;
  select count(*) into v_count from public.watchlist_event where listing_id=v_bap;
  if v_count<>3 or not exists(
    select 1 from public.watchlist_item where id=v_first and status='active'
  ) then raise exception 'QA09: BAP history or identity changed'; end if;
  -- 10: no direct DML for authenticated
  v_denied := false;
  begin
    update public.watchlist_item set status='inactive' where id=v_first;
  exception when insufficient_privilege then v_denied:=true;
  end;
  if not v_denied then raise exception 'QA10: authenticated direct update allowed'; end if;
  -- 11: other user denied RPC
  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000099',true);
  v_denied:=false;
  begin
    perform public.set_watchlist_follow(v_bap,false);
  exception when insufficient_privilege then v_denied:=true;
  end;
  if not v_denied then raise exception 'QA11: non-owner write allowed'; end if;
  -- 12: RLS must hide all private events and watchlist rows
  if exists(select 1 from public.watchlist_event)
     or exists(select 1 from public.watchlist_item) then
    raise exception 'QA12: non-owner can read private history';
  end if;

  raise notice 'BF040_SQL_QA_PASS: 12 checks';
end
$qa$;
rollback;
select 'BF040_ROLLBACK_PASS' result,
  (select count(*) from public.watchlist_item w
    join public.listing l on l.id=w.listing_id
    where l.ticker='BAP' and l.exchange='XLIM') as bap_item_count,
  (select count(*) from public.watchlist_event e
    join public.listing l on l.id=e.listing_id
    where l.ticker='BAP' and l.exchange='XLIM') as bap_event_count;
