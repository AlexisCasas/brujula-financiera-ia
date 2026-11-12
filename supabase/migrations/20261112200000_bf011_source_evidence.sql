-- BF-011: sources and field-level evidence for the pilot catalog.
-- Every identity field of an instrument/listing carries its source and date. Corrections never
-- erase history: the previous claim stays as 'superseded' with its original source.

alter table public.instrument
  add column domicile text check (domicile is null or domicile ~ '^[A-Z]{2}$'),
  add column distribution_policy text check (distribution_policy in ('accumulating', 'distributing')),
  add column inception_date date;
comment on column public.instrument.domicile is 'ISO 3166 alpha-2 country of fund domicile. NULL = unknown.';
comment on column public.instrument.distribution_policy is 'accumulating or distributing. NULL = unknown.';

create table public.source_record (
  id uuid primary key default gen_random_uuid(),
  url text not null check (url ~ '^https://'),
  title text not null check (length(btrim(title)) > 0),
  publisher text not null check (length(btrim(publisher)) > 0),
  source_type text not null
    check (source_type in ('issuer_official', 'regulator', 'exchange', 'data_vendor', 'other')),
  document_date date not null,
  captured_at timestamptz not null default now(),
  content_sha256 text check (content_sha256 is null or content_sha256 ~ '^[a-f0-9]{64}$'),
  license_note text not null check (length(btrim(license_note)) > 0),
  created_by text not null check (length(btrim(created_by)) > 0),
  constraint source_record_url_date_unique unique (url, document_date)
);
comment on table public.source_record is
  'A document or page consulted. document_date is the as-of date the source states; captured_at is when we read it.';
comment on column public.source_record.license_note is
  'What may be stored. Only identifier facts are kept; no page or document content is stored.';

create table public.field_evidence (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('instrument', 'listing')),
  entity_id uuid not null,
  field text not null,
  value text not null check (length(btrim(value)) > 0),
  verification_status text not null
    check (verification_status in ('verified', 'derived', 'unverified', 'superseded', 'rejected')),
  source_record_id uuid references public.source_record (id) on delete restrict,
  effective_date date,
  captured_at timestamptz not null default now(),
  note text,
  supersedes_id uuid references public.field_evidence (id) on delete restrict,
  created_by text not null check (length(btrim(created_by)) > 0),
  constraint evidence_field_valid check (
    (entity_type = 'instrument'
      and field in ('isin', 'name', 'issuer', 'index_name', 'domicile', 'distribution_policy', 'inception_date'))
    or (entity_type = 'listing' and field in ('exchange', 'ticker', 'currency', 'status'))
  ),
  constraint evidence_needs_source check (
    verification_status not in ('verified', 'derived') or source_record_id is not null
  ),
  constraint evidence_not_self check (supersedes_id is distinct from id)
);
comment on table public.field_evidence is
  'Append-only history of claims per field. verified = stated by an official source; derived = computed from a verified identifier by a deterministic rule; unverified = no official source yet. entity_id is polymorphic and checked by set_field().';
create unique index field_evidence_current_unique
  on public.field_evidence (entity_type, entity_id, field)
  where verification_status in ('verified', 'derived', 'unverified');
create index field_evidence_entity_idx on public.field_evidence (entity_type, entity_id);

-- Evidence is append-only: the only allowed change is retiring a current claim.
create or replace function private.field_evidence_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (new.id, new.entity_type, new.entity_id, new.field, new.value, new.source_record_id,
      new.effective_date, new.captured_at, new.note, new.supersedes_id, new.created_by)
     is distinct from
     (old.id, old.entity_type, old.entity_id, old.field, old.value, old.source_record_id,
      old.effective_date, old.captured_at, old.note, old.supersedes_id, old.created_by) then
    raise exception 'field_evidence is append-only: only verification_status may change'
      using errcode = '42501';
  end if;
  if old.verification_status not in ('verified', 'derived', 'unverified')
     or new.verification_status not in ('superseded', 'rejected') then
    raise exception 'invalid evidence status transition % -> %', old.verification_status, new.verification_status
      using errcode = '42501';
  end if;
  return new;
end;
$$;
create trigger field_evidence_guard before update on public.field_evidence
  for each row execute function private.field_evidence_guard();

alter table public.source_record enable row level security;
alter table public.field_evidence enable row level security;
grant select, insert on public.source_record to authenticated;
grant select, insert on public.field_evidence to authenticated;
grant update (verification_status) on public.field_evidence to authenticated;

create policy source_record_owner_select on public.source_record
  for select to authenticated using ((select private.is_owner()));
create policy source_record_owner_insert on public.source_record
  for insert to authenticated with check ((select private.is_owner()));
create policy field_evidence_owner_select on public.field_evidence
  for select to authenticated using ((select private.is_owner()));
create policy field_evidence_owner_insert on public.field_evidence
  for insert to authenticated with check ((select private.is_owner()));
create policy field_evidence_owner_update on public.field_evidence
  for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

-- Idempotent registration of a source.
create or replace function public.record_source(
  p_url text, p_title text, p_publisher text, p_source_type text,
  p_document_date date, p_license_note text, p_created_by text,
  p_content_sha256 text default null
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.source_record
    (url, title, publisher, source_type, document_date, license_note, created_by, content_sha256)
  values (p_url, p_title, p_publisher, p_source_type, p_document_date, p_license_note, p_created_by, p_content_sha256)
  on conflict on constraint source_record_url_date_unique do nothing
  returning id into v_id;
  if v_id is null then
    select s.id into v_id from public.source_record s
    where s.url = p_url and s.document_date = p_document_date;
  end if;
  return v_id;
end;
$$;
revoke all on function public.record_source(text, text, text, text, date, text, text, text) from public, anon;
grant execute on function public.record_source(text, text, text, text, date, text, text, text) to authenticated;

-- Record or correct a field. A correction retires the current claim (status superseded, value and
-- source kept) and links the new claim to it. The base table always shows the current value.
create or replace function public.set_field(
  p_entity_type text,
  p_entity_id uuid,
  p_field text,
  p_value text,
  p_status text,
  p_source_record_id uuid,
  p_effective_date date,
  p_note text,
  p_created_by text
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_value text := btrim(p_value);
  v_current public.field_evidence%rowtype;
  v_new uuid;
  v_exists boolean;
  v_type text;
  v_had_current boolean;
begin
  if p_entity_type = 'instrument' then
    select exists (select 1 from public.instrument where id = p_entity_id) into v_exists;
    v_type := case p_field when 'inception_date' then 'date' else 'text' end;
  elsif p_entity_type = 'listing' then
    select exists (select 1 from public.listing where id = p_entity_id) into v_exists;
    v_type := 'text';
  else
    raise exception 'invalid entity_type %', p_entity_type using errcode = '22023';
  end if;
  if not v_exists then
    raise exception 'entity not found: % %', p_entity_type, p_entity_id using errcode = 'P0002';
  end if;
  if p_status not in ('verified', 'derived', 'unverified') then
    raise exception 'set_field accepts verified, derived or unverified, got %', p_status using errcode = '22023';
  end if;

  select * into v_current from public.field_evidence e
  where e.entity_type = p_entity_type and e.entity_id = p_entity_id and e.field = p_field
    and e.verification_status in ('verified', 'derived', 'unverified');
  v_had_current := found;

  if v_had_current then
    if v_current.value = v_value and v_current.verification_status = p_status
       and v_current.source_record_id is not distinct from p_source_record_id then
      return v_current.id;  -- idempotent repeat
    end if;
    update public.field_evidence set verification_status = 'superseded' where id = v_current.id;
  end if;

  insert into public.field_evidence
    (entity_type, entity_id, field, value, verification_status, source_record_id,
     effective_date, note, supersedes_id, created_by)
  values
    (p_entity_type, p_entity_id, p_field, v_value, p_status, p_source_record_id,
     p_effective_date, p_note, case when v_had_current then v_current.id end, p_created_by)
  returning id into v_new;

  execute format('update public.%I set %I = %L::%s where id = %L',
                 p_entity_type, p_field, v_value, v_type, p_entity_id);
  return v_new;
end;
$$;
revoke all on function public.set_field(text, uuid, text, text, text, uuid, date, text, text) from public, anon;
grant execute on function public.set_field(text, uuid, text, text, text, uuid, date, text, text) to authenticated;

-- Per-field status. A field with no official evidence reads "sin verificar".
create or replace view public.field_status with (security_invoker = true) as
with expected (entity_type, field) as (
  values
    ('instrument', 'isin'), ('instrument', 'name'), ('instrument', 'issuer'),
    ('instrument', 'index_name'), ('instrument', 'domicile'),
    ('instrument', 'distribution_policy'), ('instrument', 'inception_date'),
    ('listing', 'exchange'), ('listing', 'ticker'), ('listing', 'currency'), ('listing', 'status')
),
entities as (
  select 'instrument'::text as entity_type, i.id as entity_id, to_jsonb(i) as row_json from public.instrument i
  union all
  select 'listing'::text, l.id, to_jsonb(l) from public.listing l
)
select
  en.entity_type,
  en.entity_id,
  ex.field,
  en.row_json ->> ex.field as current_value,
  case
    when ev.id is null or ev.verification_status = 'unverified' then 'sin verificar'
    when ev.verification_status = 'verified' then 'verificado'
    else 'derivado'
  end as display_status,
  ev.verification_status as evidence_status,
  ev.effective_date,
  s.url as source_url,
  s.publisher as source_publisher,
  s.document_date as source_date,
  ev.note
from entities en
join expected ex on ex.entity_type = en.entity_type
left join public.field_evidence ev
  on ev.entity_type = en.entity_type and ev.entity_id = en.entity_id and ev.field = ex.field
  and ev.verification_status in ('verified', 'derived', 'unverified')
left join public.source_record s on s.id = ev.source_record_id;
grant select on public.field_status to authenticated;

-- One row per listing with a count of fields that still lack official evidence.
create or replace view public.catalog_overview with (security_invoker = true) as
select
  l.id as listing_id,
  i.id as instrument_id,
  l.ticker,
  l.exchange,
  l.currency,
  i.isin,
  i.name,
  i.index_name,
  i.distribution_policy,
  (select count(*) from public.field_status fs
    where fs.entity_id in (i.id, l.id) and fs.display_status = 'sin verificar') as fields_unverified
from public.listing l
join public.instrument i on i.id = l.instrument_id;
grant select on public.catalog_overview to authenticated;
