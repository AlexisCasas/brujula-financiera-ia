-- BF-011 tests for sources and field evidence. Run as the migration role.
-- Always ends with an exception so nothing persists. Success: BF011_EVIDENCE_TESTS_PASSED.
-- Uses the real owner id from app_owner for authenticated checks and a throwaway user as the intruder.
do $$
declare
  v_owner uuid;
  v_intruder uuid := gen_random_uuid();
  v_inst uuid;
  v_inst2 uuid;
  v_list uuid;
  v_src1 uuid;
  v_src2 uuid;
  v_ev1 uuid;
  v_ev2 uuid;
  r record;
  n int;
begin
  select user_id into v_owner from public.app_owner limit 1;
  if v_owner is null then raise exception 'precondition failed: app_owner is empty'; end if;
  insert into auth.users (id, aud, role, email) values (v_intruder, 'authenticated', 'authenticated', 'intruder@test.invalid');

  insert into public.instrument (isin, name) values ('US0378331005', 'Fixture fund') returning id into v_inst;
  insert into public.instrument (isin, name) values ('IE00BK5BQT80', 'Fixture fund without evidence') returning id into v_inst2;
  insert into public.listing (instrument_id, exchange, ticker, currency) values (v_inst, 'XNAS', 'TST', 'USD') returning id into v_list;

  -- Constraints on raw inserts.
  begin
    insert into public.field_evidence (entity_type, entity_id, field, value, verification_status, created_by)
    values ('instrument', v_inst, 'name', 'x', 'verified', 't');
    raise exception 'E1 failed: verified evidence without a source was accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.field_evidence (entity_type, entity_id, field, value, verification_status, created_by)
    values ('listing', v_list, 'isin', 'x', 'unverified', 't');
    raise exception 'E2 failed: a field that does not belong to the entity type was accepted';
  exception when check_violation then null;
  end;

  -- AC2/AC3 as the owner, through RLS and the real grants.
  perform set_config('request.jwt.claims', json_build_object('sub', v_owner, 'role', 'authenticated')::text, true);
  set local role authenticated;

  v_src1 := public.record_source('https://example.com/factsheet.pdf', 'Fixture factsheet', 'Fixture issuer',
                                 'issuer_official', date '2026-09-30', 'identifier facts only', 'test');
  if v_src1 <> public.record_source('https://example.com/factsheet.pdf', 'Fixture factsheet', 'Fixture issuer',
                                    'issuer_official', date '2026-09-30', 'identifier facts only', 'test') then
    raise exception 'E3 failed: record_source is not idempotent';
  end if;

  v_ev1 := public.set_field('instrument', v_inst, 'name', 'Fixture fund', 'verified', v_src1, date '2026-09-30', 'first claim', 'test');
  if v_ev1 <> public.set_field('instrument', v_inst, 'name', 'Fixture fund', 'verified', v_src1, date '2026-09-30', 'first claim', 'test') then
    raise exception 'E3b failed: repeating the same claim created a new row';
  end if;
  select count(*) into n from public.field_evidence where entity_id = v_inst and field = 'name';
  if n <> 1 then raise exception 'E3c failed: % rows after an idempotent repeat', n; end if;

  -- AC3: correction keeps the previous value and its source.
  v_src2 := public.record_source('https://example.com/factsheet-v2.pdf', 'Fixture factsheet v2', 'Fixture issuer',
                                 'issuer_official', date '2026-10-31', 'identifier facts only', 'test');
  v_ev2 := public.set_field('instrument', v_inst, 'name', 'Fixture fund renamed', 'verified', v_src2, date '2026-10-31', 'renamed by issuer', 'test');
  if v_ev2 = v_ev1 then raise exception 'E4 failed: correction reused the old evidence row'; end if;
  select * into r from public.field_evidence where id = v_ev1;
  if r.verification_status <> 'superseded' or r.value <> 'Fixture fund' or r.source_record_id <> v_src1 then
    raise exception 'E4b failed: previous claim lost value, source or status (% / % / %)', r.verification_status, r.value, r.source_record_id;
  end if;
  select * into r from public.field_evidence where id = v_ev2;
  if r.supersedes_id <> v_ev1 or r.source_record_id <> v_src2 then raise exception 'E4c failed: new claim not linked to the old one'; end if;
  if (select name from public.instrument where id = v_inst) <> 'Fixture fund renamed' then raise exception 'E4d failed: base table not updated'; end if;
  select count(*) into n from public.field_evidence
    where entity_id = v_inst and field = 'name' and verification_status in ('verified', 'derived', 'unverified');
  if n <> 1 then raise exception 'E4e failed: % current claims for one field', n; end if;
  select count(*) into n from public.field_evidence where entity_id = v_inst and field = 'name';
  if n <> 2 then raise exception 'E4f failed: history has % rows, expected 2', n; end if;

  -- Unverified claim without a source is allowed, and the status is shown in Spanish.
  perform public.set_field('instrument', v_inst, 'domicile', 'IE', 'unverified', null, null, 'no official source yet', 'test');
  select display_status into r from public.field_status where entity_id = v_inst and field = 'domicile';
  if r.display_status <> 'sin verificar' then raise exception 'E5 failed: unverified shown as %', r.display_status; end if;
  select display_status into r from public.field_status where entity_id = v_inst and field = 'name';
  if r.display_status <> 'verificado' then raise exception 'E5b failed: verified shown as %', r.display_status; end if;
  select count(*) into n from public.field_status where entity_id = v_inst2 and display_status = 'sin verificar';
  if n <> 7 then raise exception 'E5c failed: instrument without evidence has % unverified fields, expected 7', n; end if;

  begin
    perform public.set_field('instrument', v_inst, 'name', 'x', 'superseded', v_src1, null, null, 'test');
    raise exception 'E6 failed: set_field accepted the superseded status';
  exception when sqlstate '22023' then null;
  end;

  -- Evidence is append-only for the owner too.
  begin
    update public.field_evidence set value = 'tampered' where id = v_ev2;
    raise exception 'E7 failed: owner edited the value of an evidence row';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.field_evidence set verification_status = 'verified' where id = v_ev1;
    raise exception 'E7b failed: owner revived a superseded claim';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.field_evidence where id = v_ev1;
    raise exception 'E7c failed: owner deleted evidence';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.source_record where id = v_src1;
    raise exception 'E7d failed: owner deleted a source';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- A non-owner sees nothing and cannot write.
  perform set_config('request.jwt.claims', json_build_object('sub', v_intruder, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.source_record;
  if n <> 0 then raise exception 'E8 failed: intruder read % sources', n; end if;
  select count(*) into n from public.field_evidence;
  if n <> 0 then raise exception 'E8b failed: intruder read % evidence rows', n; end if;
  select count(*) into n from public.field_status;
  if n <> 0 then raise exception 'E8c failed: intruder read % field_status rows', n; end if;
  select count(*) into n from public.catalog_overview;
  if n <> 0 then raise exception 'E8d failed: intruder read % catalog rows', n; end if;
  begin
    perform public.set_field('instrument', v_inst, 'name', 'hijack', 'unverified', null, null, null, 'intruder');
    raise exception 'E8e failed: intruder changed a field';
  exception when insufficient_privilege or sqlstate 'P0002' then null;
  end;
  reset role;

  -- Anonymous has no access to the new objects.
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin perform 1 from public.field_evidence; raise exception 'E9 failed: anon read field_evidence';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.source_record; raise exception 'E9b failed: anon read source_record';
  exception when insufficient_privilege then null; end;
  begin perform 1 from public.field_status; raise exception 'E9c failed: anon read field_status';
  exception when insufficient_privilege then null; end;
  begin perform public.set_field('instrument', v_inst, 'name', 'x', 'unverified', null, null, null, 'anon');
    raise exception 'E9d failed: anon called set_field';
  exception when insufficient_privilege then null; end;
  reset role;

  if exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity) then
    raise exception 'E10 failed: a public table has RLS disabled';
  end if;
  if exists (select 1 from information_schema.role_table_grants where grantee = 'mcp_writer' and table_schema = 'public') then
    raise exception 'E10b failed: mcp_writer has table privileges';
  end if;

  raise exception 'BF011_EVIDENCE_TESTS_PASSED (changes rolled back on purpose)';
end;
$$;
