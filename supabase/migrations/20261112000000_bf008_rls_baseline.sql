-- BF-008: RLS baseline, single-owner model and privilege hardening.
-- Project: Brujula AI Finance. Safe to run once on an empty `public` schema.

-- 1. Private schema for helpers. It is not exposed by the Data API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

-- 2. Defense in depth: objects created in `public` by the migration role are NOT
--    reachable by API roles until a migration grants access explicitly.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public;

-- 3. Every new table in `public` gets RLS enabled automatically (AC1 guard).
create or replace function private.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  cmd record;
begin
  for cmd in
    select * from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name = 'public' then
      execute format('alter table if exists %s enable row level security', cmd.object_identity);
    end if;
  end loop;
end;
$$;
revoke all on function private.rls_auto_enable() from public, anon, authenticated;

drop event trigger if exists ensure_rls;
create event trigger ensure_rls
  on ddl_command_end
  when tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  execute function private.rls_auto_enable();

-- 4. Single authorized owner (DEC-002). Even if sign-ups were enabled by mistake,
--    private policies also require membership here.
create table public.app_owner (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
create unique index app_owner_single_row on public.app_owner ((true));
alter table public.app_owner enable row level security;
revoke all on public.app_owner from anon, authenticated;
grant select on public.app_owner to authenticated;
create policy app_owner_select_self on public.app_owner
  for select to authenticated
  using (user_id = (select auth.uid()));
comment on table public.app_owner is
  'Single authorized owner. Rows are written only with the migration role; clients can read their own row.';

create or replace function private.is_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.app_owner where user_id = (select auth.uid()));
$$;
revoke all on function private.is_owner() from public, anon;
grant execute on function private.is_owner() to authenticated;

-- 5. Separate, unprivileged role reserved for the financial MCP writer (BF-017/019).
--    NOLOGIN on purpose: its credential is created outside version control when needed.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'mcp_writer') then
    create role mcp_writer nologin noinherit;
  end if;
end;
$$;
comment on role mcp_writer is
  'Reserved for the MCP proposal writer. No privileges until BF-017/BF-019 grant staging-only access.';
