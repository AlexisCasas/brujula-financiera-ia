-- BF-008 RLS tests. Run as the migration role (postgres) in the SQL editor or via MCP.
-- The block creates fixtures, asserts, and ALWAYS ends with an exception so nothing persists.
-- Success message: BF008_RLS_TESTS_PASSED. Any other error message is a failed assertion.
do $$
declare
  a uuid := gen_random_uuid();
  b uuid := gen_random_uuid();
  n int;
  probe_rls boolean;
begin
  insert into auth.users (id, aud, role, email) values
    (a, 'authenticated', 'authenticated', 'owner@test.invalid'),
    (b, 'authenticated', 'authenticated', 'other@test.invalid');
  insert into public.app_owner (user_id) values (a);

  -- T1: every table in public has RLS enabled.
  if exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity) then
    raise exception 'T1 failed: a public table has RLS disabled';
  end if;

  -- T2: anonymous cannot read private data.
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    perform 1 from public.app_owner;
    raise exception 'T2 failed: anon could read app_owner';
  exception when insufficient_privilege then null;
  end;
  begin
    perform private.is_owner();
    raise exception 'T2b failed: anon could call private.is_owner';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- T3: a foreign identity sees nothing and cannot write.
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.app_owner;
  if n <> 0 then raise exception 'T3 failed: foreign identity read % rows', n; end if;
  if private.is_owner() then raise exception 'T3b failed: foreign identity is_owner() = true'; end if;
  begin
    insert into public.app_owner (user_id) values (b);
    raise exception 'T3c failed: foreign identity inserted into app_owner';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- T4: the owner reads only their own row and cannot modify it from the client.
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.app_owner;
  if n <> 1 then raise exception 'T4 failed: owner read % rows, expected 1', n; end if;
  if not private.is_owner() then raise exception 'T4b failed: owner is_owner() = false'; end if;
  begin
    update public.app_owner set created_at = now();
    raise exception 'T4c failed: owner updated app_owner from client';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.app_owner;
    raise exception 'T4d failed: owner deleted from app_owner from client';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- T5: a new table gets RLS automatically and is closed to API roles by default.
  create table public.rls_probe (id int);
  select relrowsecurity into probe_rls from pg_class where oid = 'public.rls_probe'::regclass;
  if not probe_rls then raise exception 'T5 failed: event trigger did not enable RLS'; end if;
  set local role authenticated;
  begin
    perform 1 from public.rls_probe;
    raise exception 'T5b failed: authenticated could read a brand-new table';
  exception when insufficient_privilege then null;
  end;
  reset role;
  set local role anon;
  begin
    perform 1 from public.rls_probe;
    raise exception 'T5c failed: anon could read a brand-new table';
  exception when insufficient_privilege then null;
  end;
  reset role;

  -- T6: the reserved MCP writer role has no table privileges at all.
  if exists (
    select 1 from information_schema.role_table_grants
    where grantee = 'mcp_writer' and table_schema = 'public'
  ) then
    raise exception 'T6 failed: mcp_writer has table privileges';
  end if;

  raise exception 'BF008_RLS_TESTS_PASSED (changes rolled back on purpose)';
end;
$$;
