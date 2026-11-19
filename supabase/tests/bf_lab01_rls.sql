-- BF-LAB-01: RLS QA for public.lab_price_index (synthetic data).
-- Authorized SQL QA only. The whole script runs in one transaction that rolls back, so no
-- fixture persists. Do not execute on the shared Supabase until the Product Owner approves.
-- The FK to app_owner means a non-owner can never hold rows; "other user" cases therefore
-- check that nothing of the owner's data is visible to them.
begin;

do $setup$
declare
  v_owner uuid := (select user_id from public.app_owner limit 1);
  v_other uuid := gen_random_uuid();
begin
  if v_owner is null then raise exception 'QA precondition: no app_owner'; end if;
  insert into auth.users (id, aud, role, email)
    values (v_other, 'authenticated', 'authenticated', 'lab-qa-other@example.invalid');
  insert into public.lab_price_index (owner_user_id, series_code, as_of_date, index_value)
    values (v_owner, 'DEMO_A', date '1900-01-01', 100)
    on conflict do nothing;
  -- Snapshot of official tables, compared at the end (QA06).
  perform set_config('lab.owner', v_owner::text, true);
  perform set_config('lab.other', v_other::text, true);
  perform set_config('lab.official_before', (
    (select count(*) from public.instrument) || ':' || (select count(*) from public.listing)
    || ':' || (select count(*) from public.source_record)
    || ':' || (select count(*) from public.field_evidence)
  ), true);
end
$setup$;

-- QA01: the owner sees their own rows, all marked synthetic.
select set_config('request.jwt.claim.sub', current_setting('lab.owner'), true);
set local role authenticated;
do $qa01$
declare v_total int; v_own int; v_nonsyn int;
begin
  select count(*), count(*) filter (where owner_user_id = current_setting('lab.owner')::uuid),
         count(*) filter (where not is_synthetic)
    into v_total, v_own, v_nonsyn from public.lab_price_index;
  if v_total = 0 or v_total <> v_own then raise exception 'QA01 owner must see only own rows'; end if;
  if v_nonsyn <> 0 then raise exception 'QA01 non-synthetic row visible'; end if;
end
$qa01$;
reset role;

-- QA02: an authenticated non-owner user sees zero rows (is_owner() is false).
select set_config('request.jwt.claim.sub', current_setting('lab.other'), true);
set local role authenticated;
do $qa02$
begin
  if (select count(*) from public.lab_price_index) <> 0 then
    raise exception 'QA02 non-owner can read lab rows';
  end if;
end
$qa02$;
reset role;

-- QA03: anon has no privilege on the table.
set local role anon;
do $qa03$
declare caught boolean := false;
begin
  begin
    perform count(*) from public.lab_price_index;
  exception when insufficient_privilege then caught := true;
  end;
  if not caught then raise exception 'QA03 anon can read lab_price_index'; end if;
end
$qa03$;
reset role;

-- QA04: authenticated cannot write (no INSERT/UPDATE/DELETE grant, no write policy).
select set_config('request.jwt.claim.sub', current_setting('lab.owner'), true);
set local role authenticated;
do $qa04$
declare caught int := 0;
begin
  begin
    insert into public.lab_price_index (owner_user_id, series_code, as_of_date, index_value)
      values (current_setting('lab.owner')::uuid, 'DEMO_B', date '1900-01-02', 1);
  exception when insufficient_privilege then caught := caught + 1;
  end;
  begin
    update public.lab_price_index set index_value = 1;
  exception when insufficient_privilege then caught := caught + 1;
  end;
  begin
    delete from public.lab_price_index;
  exception when insufficient_privilege then caught := caught + 1;
  end;
  if caught <> 3 then raise exception 'QA04 write was not denied (% of 3)', caught; end if;
end
$qa04$;
reset role;

-- QA05: table-level guarantees stay in place (synthetic-only, positive values, demo series, PTS unit).
do $qa05$
declare caught int := 0;
begin
  begin
    insert into public.lab_price_index (owner_user_id, series_code, as_of_date, index_value, is_synthetic)
      values (current_setting('lab.owner')::uuid, 'DEMO_A', date '1900-01-03', 1, false);
  exception when check_violation then caught := caught + 1;
  end;
  begin
    insert into public.lab_price_index (owner_user_id, series_code, as_of_date, index_value)
      values (current_setting('lab.owner')::uuid, 'DEMO_A', date '1900-01-04', 0);
  exception when check_violation then caught := caught + 1;
  end;
  begin
    insert into public.lab_price_index (owner_user_id, series_code, as_of_date, index_value)
      values (current_setting('lab.owner')::uuid, 'VOO', date '1900-01-05', 1);
  exception when check_violation then caught := caught + 1;
  end;
  begin
    insert into public.lab_price_index (owner_user_id, series_code, as_of_date, index_value, unit)
      values (current_setting('lab.owner')::uuid, 'DEMO_A', date '1900-01-06', 1, 'USD');
  exception when check_violation then caught := caught + 1;
  end;
  if caught <> 4 then raise exception 'QA05 constraints not enforced (% of 4)', caught; end if;
end
$qa05$;

-- QA06: official financial tables are untouched by this story.
do $qa06$
begin
  if current_setting('lab.official_before') <> (
    (select count(*) from public.instrument) || ':' || (select count(*) from public.listing)
    || ':' || (select count(*) from public.source_record)
    || ':' || (select count(*) from public.field_evidence)
  ) then raise exception 'QA06 official tables changed'; end if;
end
$qa06$;

rollback;
select 'bf_lab01_rls: all checks passed (rolled back)' as result;
