-- BF-012: versioned measurements (TER, fund size) and point-in-time snapshots.
-- A measurement exists only when a source states it. A missing figure is NULL and reads
-- "no disponible", never zero. New measurements are new rows; nothing is overwritten.

create table public.instrument_measurement (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references public.instrument (id) on delete restrict,
  metric text not null check (metric in ('ter_percent', 'net_assets', 'fund_net_assets')),
  value numeric not null check (value >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  as_of_date date not null,
  version integer not null check (version >= 1),
  source_record_id uuid not null references public.source_record (id) on delete restrict,
  supersedes_id uuid references public.instrument_measurement (id) on delete restrict,
  note text,
  captured_at timestamptz not null default now(),
  created_by text not null check (length(btrim(created_by)) > 0),
  constraint measurement_unit_valid check (
    (metric = 'ter_percent' and currency is null and value <= 100)
    or (metric in ('net_assets', 'fund_net_assets') and currency is not null)
  ),
  constraint measurement_version_unique unique (instrument_id, metric, as_of_date, version),
  constraint measurement_not_self check (supersedes_id is distinct from id)
);
comment on table public.instrument_measurement is
  'Append-only measurements. ter_percent is a percentage (0.14 = 0.14%). net_assets is the ETF/share-class size; fund_net_assets is the fund total across share classes. as_of_date is the date the source states (or the date it was read, said in note). A new figure for the same date is a new version.';

create index instrument_measurement_lookup_idx
  on public.instrument_measurement (instrument_id, metric, as_of_date desc, version desc);

-- Nobody edits or deletes history, including the migration role (drop the trigger to change that deliberately).
create or replace function private.measurement_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'instrument_measurement is append-only: insert a new version instead'
    using errcode = '42501';
end;
$$;
create trigger measurement_append_only before update or delete on public.instrument_measurement
  for each row execute function private.measurement_append_only();

alter table public.instrument_measurement enable row level security;
grant select, insert on public.instrument_measurement to authenticated;
create policy measurement_owner_select on public.instrument_measurement
  for select to authenticated using ((select private.is_owner()));
create policy measurement_owner_insert on public.instrument_measurement
  for insert to authenticated with check ((select private.is_owner()));

-- Idempotent insert; a different figure for the same date becomes the next version.
create or replace function public.record_measurement(
  p_instrument_id uuid,
  p_metric text,
  p_value numeric,
  p_currency text,
  p_as_of_date date,
  p_source_record_id uuid,
  p_note text,
  p_created_by text
)
returns table (measurement_id uuid, version integer, created boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_currency text := nullif(upper(btrim(p_currency)), '');
  v_latest public.instrument_measurement%rowtype;
  v_id uuid;
  v_version integer;
begin
  if not exists (select 1 from public.instrument where id = p_instrument_id) then
    raise exception 'instrument not found: %', p_instrument_id using errcode = 'P0002';
  end if;

  select * into v_latest from public.instrument_measurement m
  where m.instrument_id = p_instrument_id and m.metric = p_metric and m.as_of_date = p_as_of_date
  order by m.version desc limit 1;

  if found then
    if v_latest.value = p_value and v_latest.currency is not distinct from v_currency
       and v_latest.source_record_id = p_source_record_id then
      return query select v_latest.id, v_latest.version, false;
      return;
    end if;
    v_version := v_latest.version + 1;
  else
    v_version := 1;
  end if;

  insert into public.instrument_measurement
    (instrument_id, metric, value, currency, as_of_date, version, source_record_id, supersedes_id, note, created_by)
  values
    (p_instrument_id, p_metric, p_value, v_currency, p_as_of_date, v_version, p_source_record_id,
     case when found then v_latest.id end, p_note, p_created_by)
  returning id into v_id;
  return query select v_id, v_version, true;
end;
$$;
revoke all on function public.record_measurement(uuid, text, numeric, text, date, uuid, text, text) from public, anon;
grant execute on function public.record_measurement(uuid, text, numeric, text, date, uuid, text, text) to authenticated;

-- Point-in-time snapshot: for each instrument and metric, the newest version of the latest
-- as-of date on or before p_date. No measurement means NULL value and "no disponible".
create or replace function public.snapshot_as_of(p_date date default current_date)
returns table (
  instrument_id uuid,
  isin text,
  name text,
  metric text,
  value numeric,
  currency text,
  as_of_date date,
  version integer,
  availability text,
  source_url text,
  source_date date,
  note text
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    i.id,
    i.isin,
    i.name,
    mt.metric,
    m.value,
    m.currency,
    m.as_of_date,
    m.version,
    case when m.id is null then 'no disponible' else 'disponible' end,
    s.url,
    s.document_date,
    m.note
  from public.instrument i
  cross join (values ('ter_percent'), ('net_assets'), ('fund_net_assets')) as mt (metric)
  left join lateral (
    select x.*
    from public.instrument_measurement x
    where x.instrument_id = i.id and x.metric = mt.metric and x.as_of_date <= p_date
    order by x.as_of_date desc, x.version desc
    limit 1
  ) m on true
  left join public.source_record s on s.id = m.source_record_id
  order by i.isin, mt.metric;
$$;
revoke all on function public.snapshot_as_of(date) from public, anon;
grant execute on function public.snapshot_as_of(date) to authenticated;

-- Full history, newest first, with the superseded versions kept.
create or replace view public.measurement_history with (security_invoker = true) as
select
  m.instrument_id, i.isin, m.metric, m.as_of_date, m.version, m.value, m.currency,
  s.url as source_url, s.document_date as source_date, m.note, m.captured_at, m.created_by,
  not exists (
    select 1 from public.instrument_measurement n
    where n.instrument_id = m.instrument_id and n.metric = m.metric
      and n.as_of_date = m.as_of_date and n.version > m.version
  ) as is_latest_version
from public.instrument_measurement m
join public.instrument i on i.id = m.instrument_id
join public.source_record s on s.id = m.source_record_id;
grant select on public.measurement_history to authenticated;
