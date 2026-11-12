-- BF-012 tests for versioned measurements and snapshots. Run as the migration role.
-- Always ends with an exception so nothing persists. Success: BF012_SNAPSHOT_TESTS_PASSED.
-- Fixtures use ISINs that are not in the real catalog, so the pilot data is never touched.
do $$
declare
  v_owner uuid;
  v_intruder uuid := gen_random_uuid();
  v_a uuid;
  v_b uuid;
  v_s1 uuid;
  v_s2 uuid;
  m1 record;
  m2 record;
  m3 record;
  r record;
  n int;
begin
  select user_id into v_owner from public.app_owner limit 1;
  if v_owner is null then raise exception 'precondition failed: app_owner is empty'; end if;
  insert into auth.users (id, aud, role, email) values (v_intruder, 'authenticated', 'authenticated', 'intruder@test.invalid');
  insert into public.instrument (isin, name) values ('US0378331005', 'Fixture A') returning id into v_a;
  insert into public.instrument (isin, name) values ('US5949181045', 'Fixture B (no measurements)') returning id into v_b;
  v_s1 := public.record_source('https://example.com/a.pdf', 'A', 'Fixture issuer', 'issuer_official', date '2026-06-30', 'identifier facts only', 'test');
  v_s2 := public.record_source('https://example.com/b.pdf', 'B', 'Fixture issuer', 'issuer_official', date '2026-09-30', 'identifier facts only', 'test');

  -- Constraints on raw inserts.
  begin
    insert into public.instrument_measurement (instrument_id, metric, value, as_of_date, version, source_record_id, created_by)
    values (v_a, 'ter_percent', -0.1, date '2026-06-30', 1, v_s1, 't');
    raise exception 'M1 failed: negative TER accepted';
  exception when check_violation then null; end;
  begin
    insert into public.instrument_measurement (instrument_id, metric, value, as_of_date, version, source_record_id, created_by)
    values (v_a, 'ter_percent', 150, date '2026-06-30', 1, v_s1, 't');
    raise exception 'M1b failed: TER above 100 accepted';
  exception when check_violation then null; end;
  begin
    insert into public.instrument_measurement (instrument_id, metric, value, currency, as_of_date, version, source_record_id, created_by)
    values (v_a, 'ter_percent', 0.1, 'USD', date '2026-06-30', 1, v_s1, 't');
    raise exception 'M1c failed: TER with a currency accepted';
  exception when check_violation then null; end;
  begin
    insert into public.instrument_measurement (instrument_id, metric, value, as_of_date, version, source_record_id, created_by)
    values (v_a, 'net_assets', 1000, date '2026-06-30', 1, v_s1, 't');
    raise exception 'M1d failed: net assets without a currency accepted';
  exception when check_violation then null; end;
  begin
    insert into public.instrument_measurement (instrument_id, metric, value, currency, as_of_date, version, source_record_id, created_by)
    values (v_a, 'net_assets', 1000, 'usd', date '2026-06-30', 1, v_s1, 't');
    raise exception 'M1e failed: lowercase currency accepted';
  exception when check_violation then null; end;
  begin
    insert into public.instrument_measurement (instrument_id, metric, value, as_of_date, version, created_by)
    values (v_a, 'ter_percent', 0.1, date '2026-06-30', 1, 't');
    raise exception 'M1f failed: measurement without a source accepted';
  exception when not_null_violation then null; end;
  begin
    insert into public.instrument_measurement (instrument_id, metric, value, as_of_date, version, source_record_id, created_by)
    values (v_a, 'volatility', 0.1, date '2026-06-30', 1, v_s1, 't');
    raise exception 'M1g failed: unknown metric accepted';
  exception when check_violation then null; end;

  -- Versioning, as the owner through RLS and the real grants.
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  set local role authenticated;

  select * into m1 from public.record_measurement(v_a, 'ter_percent', 0.10, null, date '2026-06-30', v_s1, 'first', 'test');
  if not m1.created or m1.version <> 1 then raise exception 'M2 failed: first measurement is not version 1'; end if;
  select * into r from public.record_measurement(v_a, 'ter_percent', 0.10, null, date '2026-06-30', v_s1, 'first', 'test');
  if r.created or r.measurement_id <> m1.measurement_id then raise exception 'M2b failed: identical repeat was not idempotent'; end if;

  select * into m2 from public.record_measurement(v_a, 'ter_percent', 0.12, null, date '2026-06-30', v_s2, 'corrected figure', 'test');
  if not m2.created or m2.version <> 2 then raise exception 'M3 failed: a different figure for the same date is not version 2'; end if;
  select * into r from public.instrument_measurement where id = m1.measurement_id;
  if r.value <> 0.10 or r.source_record_id <> v_s1 then raise exception 'M3b failed: version 1 lost its value or source'; end if;
  select * into r from public.instrument_measurement where id = m2.measurement_id;
  if r.supersedes_id <> m1.measurement_id then raise exception 'M3c failed: version 2 does not point to version 1'; end if;
  select count(*) into n from public.instrument_measurement where instrument_id = v_a and metric = 'ter_percent';
  if n <> 2 then raise exception 'M3d failed: history has % rows, expected 2', n; end if;

  select * into m3 from public.record_measurement(v_a, 'ter_percent', 0.09, null, date '2026-09-30', v_s2, 'new date', 'test');
  if not m3.created or m3.version <> 1 then raise exception 'M4 failed: a new as-of date must start at version 1'; end if;

  perform public.record_measurement(v_a, 'net_assets', 5000000000, 'USD', date '2026-09-30', v_s2, 'size', 'test');

  -- Snapshots by date.
  select value, version into r from public.snapshot_as_of(date '2026-07-15') where instrument_id = v_a and metric = 'ter_percent';
  if r.value <> 0.12 or r.version <> 2 then raise exception 'M5 failed: snapshot on 2026-07-15 returned % v%', r.value, r.version; end if;
  select value, version into r from public.snapshot_as_of(date '2026-12-31') where instrument_id = v_a and metric = 'ter_percent';
  if r.value <> 0.09 then raise exception 'M5b failed: latest snapshot returned %', r.value; end if;
  select value into r from public.snapshot_as_of(date '2026-12-31') where instrument_id = v_a and metric = 'net_assets';
  if r.value <> 5000000000 then raise exception 'M5c failed: net assets % ', r.value; end if;

  -- AC3: missing data is NULL and "no disponible", never zero.
  select count(*) into n from public.snapshot_as_of(date '2026-12-31')
    where instrument_id = v_b and availability = 'no disponible' and value is null and currency is null;
  if n <> 3 then raise exception 'M6 failed: instrument without data shows % unavailable metrics, expected 3', n; end if;
  select count(*) into n from public.snapshot_as_of(date '2026-12-31') where instrument_id = v_b and value = 0;
  if n <> 0 then raise exception 'M6b failed: a missing value was shown as zero'; end if;
  select availability, value into r from public.snapshot_as_of(date '2026-01-01') where instrument_id = v_a and metric = 'ter_percent';
  if r.availability <> 'no disponible' or r.value is not null then raise exception 'M6c failed: a date before any measurement did not read as unavailable'; end if;
  select availability into r from public.snapshot_as_of(date '2026-12-31') where instrument_id = v_a and metric = 'fund_net_assets';
  if r.availability <> 'no disponible' then raise exception 'M6d failed: a metric never measured did not read as unavailable'; end if;

  -- History view flags the newest version per date.
  select count(*) into n from public.measurement_history where instrument_id = v_a and metric = 'ter_percent' and is_latest_version;
  if n <> 2 then raise exception 'M7 failed: % latest versions, expected 2 (one per date)', n; end if;
  select count(*) into n from public.measurement_history where instrument_id = v_a and metric = 'ter_percent' and not is_latest_version;
  if n <> 1 then raise exception 'M7b failed: % superseded versions, expected 1', n; end if;

  -- Append-only for the owner and for the migration role.
  begin
    update public.instrument_measurement set value = 9 where id = m1.measurement_id;
    raise exception 'M8 failed: owner edited a measurement';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.instrument_measurement where id = m1.measurement_id;
    raise exception 'M8b failed: owner deleted a measurement';
  exception when insufficient_privilege then null; end;
  reset role;
  begin
    update public.instrument_measurement set value = 9 where id = m1.measurement_id;
    raise exception 'M8c failed: the migration role edited a measurement';
  exception when insufficient_privilege then null; end;
  begin
    delete from public.instrument_measurement where id = m1.measurement_id;
    raise exception 'M8d failed: the migration role deleted a measurement';
  exception when insufficient_privilege then null; end;

  -- Non-owner sees nothing and cannot write.
  perform set_config('request.jwt.claims', json_build_object('sub', v_intruder, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.instrument_measurement;
  if n <> 0 then raise exception 'M9 failed: intruder read % measurements', n; end if;
  select count(*) into n from public.measurement_history;
  if n <> 0 then raise exception 'M9b failed: intruder read % history rows', n; end if;
  select count(*) into n from public.snapshot_as_of(date '2026-12-31');
  if n <> 0 then raise exception 'M9c failed: intruder read % snapshot rows', n; end if;
  begin
    perform public.record_measurement(v_a, 'ter_percent', 0.5, null, date '2026-12-01', v_s1, 'hijack', 'intruder');
    raise exception 'M9d failed: intruder recorded a measurement';
  exception when insufficient_privilege or sqlstate 'P0002' then null; end;
  reset role;

  -- Anonymous has no access.
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin perform 1 from public.instrument_measurement; raise exception 'M10 failed: anon read measurements';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.snapshot_as_of(date '2026-12-31'); raise exception 'M10b failed: anon called snapshot_as_of';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.measurement_history; raise exception 'M10c failed: anon read measurement_history';
  exception when insufficient_privilege then null; end;
  reset role;

  if exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity) then
    raise exception 'M11 failed: a public table has RLS disabled';
  end if;
  if exists (select 1 from information_schema.role_table_grants where grantee = 'mcp_writer' and table_schema = 'public') then
    raise exception 'M11b failed: mcp_writer has table privileges';
  end if;

  raise exception 'BF012_SNAPSHOT_TESTS_PASSED (changes rolled back on purpose)';
end;
$$;
