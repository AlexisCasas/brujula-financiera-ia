-- BF-LAB-01: codify public.lab_price_index (synthetic educational index) in version control.
-- The table already exists on the shared project (created outside migrations). This file is
-- idempotent: on the existing database every statement is a no-op; on a fresh database it
-- reproduces the same table, constraints, grant and RLS policy. It does not touch any
-- official financial table. NOT applied yet: requires explicit Product Owner authorization.

create table if not exists public.lab_price_index (
  owner_user_id uuid not null
    constraint lab_price_index_owner_user_id_fkey
    references public.app_owner (user_id) on delete cascade,
  series_code text not null
    constraint lab_price_index_series_code_check check (series_code in ('DEMO_A', 'DEMO_B')),
  as_of_date date not null,
  index_value numeric(12, 4) not null
    constraint lab_price_index_index_value_check check (index_value > 0),
  unit text not null default 'PTS'
    constraint lab_price_index_unit_check check (unit = 'PTS'),
  is_synthetic boolean not null default true
    constraint lab_price_index_is_synthetic_check check (is_synthetic = true),
  source_label text not null default 'EDUCATE_LAB_SYNTHETIC_2026',
  constraint lab_price_index_pkey primary key (owner_user_id, series_code, as_of_date)
);

comment on table public.lab_price_index is
  'Datos didacticos sinteticos; indice en puntos, NO precios ni retornos de ETF reales.';

alter table public.lab_price_index enable row level security;

revoke all on public.lab_price_index from public, anon, authenticated;
grant select on public.lab_price_index to authenticated;

do $policy$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'lab_price_index'
      and policyname = 'lab_price_index_owner_read'
  ) then
    create policy lab_price_index_owner_read on public.lab_price_index
      for select to authenticated
      using (owner_user_id = (select auth.uid()) and (select private.is_owner()));
  end if;
end
$policy$;
