-- BF-023b: append-only snapshots of comparison evidence.
-- Migrated after transactional dry-run; no changes to the existing ETF catalog.
create table public.saved_etf_comparison (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  as_of_date date not null,
  saved_at timestamptz not null default now(),
  listing_ids uuid[] not null check (cardinality(listing_ids) between 2 and 5),
  items_snapshot jsonb not null,
  schema_version integer not null default 1 check (schema_version = 1),
  constraint items_snapshot_shape check (
    jsonb_typeof(items_snapshot) = 'array'
    and jsonb_array_length(items_snapshot) = cardinality(listing_ids)
  )
);
comment on table public.saved_etf_comparison is
  'BF-023: owner-only immutable comparison, includes listing IDs and versioned evidence as of the chosen date.';
create index saved_etf_comparison_owner_date_idx
  on public.saved_etf_comparison (owner_user_id, saved_at desc);
alter table public.saved_etf_comparison enable row level security;
create policy saved_comparison_owner_read on public.saved_etf_comparison
  for select to authenticated using (
    owner_user_id = (select auth.uid())
    and (select private.is_owner())
  );
revoke all on public.saved_etf_comparison from public, anon, authenticated;
grant select on public.saved_etf_comparison to authenticated;

create function public.save_etf_comparison(
  p_listing_ids uuid[],
  p_title text default null,
  p_as_of_date date default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $bf$
declare
  v_user uuid := auth.uid();
  v_count integer;
  v_distinct integer;
  v_as_of date := coalesce(p_as_of_date, (now() at time zone 'UTC')::date);
  v_listing uuid;
  v_identity record;
  v_metrics jsonb;
  v_fields jsonb;
  v_items jsonb := '[]'::jsonb;
  v_id uuid;
  v_title text := coalesce(nullif(btrim(p_title), ''), 'Comparación de ETF');
begin
  -- Definer function is intentionally privileged. Authenticate against
  -- the single app_owner row before accessing the financial catalog.
  if v_user is null or not exists (
    select 1 from public.app_owner ao where ao.user_id = v_user
  ) then
    raise exception 'No autorizado para guardar comparaciones'
      using errcode = '42501';
  end if;

  v_count := cardinality(p_listing_ids);
  if p_listing_ids is null or v_count not between 2 and 5
     or array_position(p_listing_ids, null) is not null then
    raise exception 'Selecciona entre 2 y 5 listings válidos'
      using errcode = '22023';
  end if;
  select count(distinct x)::integer into v_distinct from unnest(p_listing_ids) as x;
  if v_distinct <> v_count then
    raise exception 'No se permiten listings duplicados'
      using errcode = '22023';
  end if;
  if v_as_of > (now() at time zone 'UTC')::date then
    raise exception 'La fecha de corte no puede ser futura'
      using errcode = '22023';
  end if;
  if char_length(v_title) > 120 then
    raise exception 'Título demasiado largo'
      using errcode = '22023';
  end if;

  foreach v_listing in array p_listing_ids loop
    select l.id as listing_id, l.instrument_id, l.ticker, l.exchange,
      l.currency, l.status, i.isin, i.name, i.issuer,
      i.index_name, i.domicile, i.distribution_policy, i.inception_date
      into v_identity
    from public.listing l
    join public.instrument i on i.id = l.instrument_id
    where l.id = v_listing;

    if not found then
      raise exception 'Uno o más listings no existen en el catálogo'
        using errcode = '22023';
    end if;

    select jsonb_object_agg(mt.metric, jsonb_build_object(
        'availability', case when m.id is null then 'no disponible' else 'disponible' end,
        'measurement_id', m.id,
        'value', m.value::text,
        'currency', m.currency,
        'as_of_date', m.as_of_date,
        'version', m.version,
        'source_record_id', m.source_record_id,
        'source_url', s.url,
        'source_date', s.document_date,
        'captured_at', m.captured_at,
        'note', m.note
      )) into v_metrics
    from (values ('ter_percent'),('net_assets'),('fund_net_assets')) as mt(metric)
    left join lateral (
      select im.*
      from public.instrument_measurement im
      where im.instrument_id = v_identity.instrument_id
        and im.metric = mt.metric and im.as_of_date <= v_as_of
      order by im.as_of_date desc, im.version desc
      limit 1
    ) m on true
    left join public.source_record s on s.id = m.source_record_id;

    select coalesce(jsonb_agg(jsonb_build_object(
        'entity_type', fs.entity_type,
        'field', fs.field,
        'display_status', fs.display_status,
        'source_url', fs.source_url,
        'source_date', fs.source_date,
        'effective_date', fs.effective_date,
        'note', fs.note
      ) order by fs.entity_type, fs.field), '[]'::jsonb)
      into v_fields
    from public.field_status fs
    where fs.entity_id in (v_identity.instrument_id, v_listing);

    v_items := v_items || jsonb_build_array(jsonb_build_object(
      'listing_id', v_identity.listing_id,
      'instrument_id', v_identity.instrument_id,
      'isin', v_identity.isin,
      'ticker', v_identity.ticker,
      'exchange', v_identity.exchange,
      'currency', v_identity.currency,
      'listing_status', v_identity.status,
      'name', v_identity.name,
      'issuer', v_identity.issuer,
      'index_name', v_identity.index_name,
      'domicile', v_identity.domicile,
      'distribution_policy', v_identity.distribution_policy,
      'inception_date', v_identity.inception_date,
      'attributes_captured_at', now(),
      'metrics', coalesce(v_metrics,'{}'::jsonb),
      'field_sources', v_fields
    ));
  end loop;

  insert into public.saved_etf_comparison(
    owner_user_id, title, as_of_date, listing_ids, items_snapshot
  ) values (v_user, v_title, v_as_of, p_listing_ids, v_items)
  returning id into v_id;
  return v_id;
end
$bf$;

-- No direct writes to the table; only the protected transactional RPC.
revoke all on function public.save_etf_comparison(uuid[],text,date)
  from public, anon, authenticated;
grant execute on function public.save_etf_comparison(uuid[],text,date)
  to authenticated;
