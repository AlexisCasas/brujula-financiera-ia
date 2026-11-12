-- BF-010 tests. Run as the migration role. Always ends with an exception so nothing persists.
-- Success message: BF010_MODEL_TESTS_PASSED. Fixture ISINs only prove check-digit validity, not fund identity.
do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  r record;
  n int;
  id1 uuid;
  l1 uuid;
begin
  insert into auth.users (id, aud, role, email) values
    (a, 'authenticated', 'authenticated', 'owner@test.invalid'),
    (b, 'authenticated', 'authenticated', 'other@test.invalid');
  insert into public.app_owner (user_id) values (a);

  -- AC1: ISIN format and check digit.
  if not private.is_valid_isin('US0378331005') or not private.is_valid_isin('IE00BK5BQT80') then
    raise exception 'A1 failed: valid ISIN rejected';
  end if;
  if private.is_valid_isin('US0378331006') or private.is_valid_isin('IE00BK5BQT8') or private.is_valid_isin('us0378331005') then
    raise exception 'A1b failed: invalid ISIN accepted';
  end if;
  begin
    insert into public.instrument (isin, name) values ('US0378331006', 'Bad check digit');
    raise exception 'A1c failed: instrument with bad ISIN inserted';
  exception when check_violation then null;
  end;

  -- AC1: ISIN is unique.
  insert into public.instrument (isin, name) values ('US0378331005', 'Fixture fund');
  begin
    insert into public.instrument (isin, name) values ('US0378331005', 'Duplicate');
    raise exception 'A1d failed: duplicate ISIN inserted';
  exception when unique_violation then null;
  end;

  -- AC1: listing requires exchange, ticker, currency and a valid status.
  select id into id1 from public.instrument where isin = 'US0378331005';
  begin
    insert into public.listing (instrument_id, exchange, ticker, currency) values (id1, null, 'AAA', 'USD');
    raise exception 'A1e failed: listing without exchange inserted';
  exception when not_null_violation then null;
  end;
  begin
    insert into public.listing (instrument_id, exchange, ticker, currency) values (id1, 'XNAS', 'AAA', 'US');
    raise exception 'A1f failed: listing with bad currency inserted';
  exception when check_violation then null;
  end;
  begin
    insert into public.listing (instrument_id, exchange, ticker, currency, status) values (id1, 'XNAS', 'AAA', 'USD', 'maybe');
    raise exception 'A1g failed: listing with bad status inserted';
  exception when check_violation then null;
  end;
  insert into public.listing (instrument_id, exchange, ticker, currency) values (id1, 'XNAS', 'AAA', 'USD');
  select status into r from public.listing where ticker = 'AAA';
  if r.status <> 'unverified' then raise exception 'A1h failed: default status is %', r.status; end if;
  delete from public.listing; delete from public.instrument;

  -- AC2: idempotent ingestion as the owner (through RLS).
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select * into r from public.upsert_instrument_listing('us0378331005', ' Fixture fund ', 'xnas', 'aaa', 'usd', 'Issuer', 'Index');
  if not (r.instrument_created and r.listing_created) then raise exception 'B1 failed: first call did not create both'; end if;
  id1 := r.instrument_id; l1 := r.listing_id;
  select * into r from public.upsert_instrument_listing('US0378331005', 'Different name', 'XNAS', 'AAA', 'USD');
  if r.instrument_created or r.listing_created or r.instrument_id <> id1 or r.listing_id <> l1 then
    raise exception 'B2 failed: second identical call was not idempotent';
  end if;
  select count(*) into n from public.instrument;
  if n <> 1 then raise exception 'B3 failed: % instruments', n; end if;
  select count(*) into n from public.listing;
  if n <> 1 then raise exception 'B3b failed: % listings', n; end if;
  if (select name from public.instrument) <> 'Fixture fund' then raise exception 'B4 failed: existing attributes were overwritten'; end if;
  select * into r from public.upsert_instrument_listing('US0378331005', 'Fixture fund', 'XLON', 'AAA', 'GBP');
  if r.instrument_created or not r.listing_created or r.instrument_id <> id1 then raise exception 'B5 failed: second listing not added to same instrument'; end if;
  begin
    perform public.upsert_instrument_listing('IE00BK5BQT80', 'Other fund', 'XNAS', 'AAA', 'USD');
    raise exception 'B6 failed: live ticker reused by another instrument';
  exception when unique_violation then null;
  end;
  begin
    perform public.upsert_instrument_listing('US0378331006', 'Bad', 'XNAS', 'ZZZ', 'USD');
    raise exception 'B7 failed: invalid ISIN accepted by upsert';
  exception when check_violation then null;
  end;
  reset role;

  -- AC3: ambiguous ticker must be resolved by choosing a listing.
  set local role authenticated;
  select count(*) into n from public.search_listings('aaa');
  if n <> 2 then raise exception 'C1 failed: search returned % rows', n; end if;
  if exists (select 1 from public.search_listings('AAA') where not ambiguous) then raise exception 'C1b failed: ambiguity not flagged'; end if;
  begin
    perform public.resolve_listing('AAA');
    raise exception 'C2 failed: ambiguous ticker resolved without selection';
  exception when sqlstate 'P0001' then
    if sqlerrm not like 'ambiguous_ticker:%' then raise exception 'C2b failed: wrong error %', sqlerrm; end if;
  end;
  if public.resolve_listing('AAA', 'XLON') is null then raise exception 'C3 failed: exchange did not disambiguate'; end if;
  if public.resolve_listing('AAA', null, 'USD') <> l1 then raise exception 'C3b failed: currency did not disambiguate'; end if;
  begin
    perform public.resolve_listing('NOPE');
    raise exception 'C4 failed: unknown ticker resolved';
  exception when sqlstate 'P0002' then null;
  end;
  reset role;

  -- Access control: anonymous and non-owner identities.
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    perform 1 from public.instrument;
    raise exception 'D1 failed: anon read instrument';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.search_listings('AAA');
    raise exception 'D1b failed: anon called search_listings';
  exception when insufficient_privilege then null;
  end;
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.instrument;
  if n <> 0 then raise exception 'D2 failed: non-owner read % instruments', n; end if;
  select count(*) into n from public.listing;
  if n <> 0 then raise exception 'D2b failed: non-owner read % listings', n; end if;
  begin
    perform public.upsert_instrument_listing('IE00BK5BQT80', 'Intruder', 'XNAS', 'ZZZ', 'USD');
    raise exception 'D3 failed: non-owner inserted through upsert';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- Owner cannot delete catalog rows from the client (history is preserved).
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    delete from public.listing;
    raise exception 'D4 failed: owner deleted listings from client';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- The reserved MCP writer role still has no table privileges.
  if exists (select 1 from information_schema.role_table_grants where grantee = 'mcp_writer' and table_schema = 'public') then
    raise exception 'D5 failed: mcp_writer has table privileges';
  end if;

  -- All public tables keep RLS enabled.
  if exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity) then
    raise exception 'D6 failed: a public table has RLS disabled';
  end if;

  raise exception 'BF010_MODEL_TESTS_PASSED (changes rolled back on purpose)';
end;
$$;
