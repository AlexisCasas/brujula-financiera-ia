-- BF-010: instrument (fund, identified by ISIN) and listing (ticker + exchange + currency).
-- A fund is NOT its ticker. Market quotes attach to a listing; NAV attaches to the instrument.
-- No price or NAV columns exist here on purpose: they arrive in BF-013 as separate, typed tables.

create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ISO 6166 format + check digit (Luhn over the letter-expanded digits).
create or replace function private.is_valid_isin(p text)
returns boolean
language plpgsql
immutable
strict
set search_path = ''
as $$
declare
  digits text := '';
  ch text;
  i int;
  d int;
  total int := 0;
  doubled boolean := false;
begin
  if p !~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$' then
    return false;
  end if;
  for i in 1..12 loop
    ch := substr(p, i, 1);
    if ch ~ '[A-Z]' then
      digits := digits || (ascii(ch) - 55)::text;
    else
      digits := digits || ch;
    end if;
  end loop;
  for i in reverse length(digits)..1 loop
    d := substr(digits, i, 1)::int;
    if doubled then
      d := d * 2;
      if d > 9 then d := d - 9; end if;
    end if;
    total := total + d;
    doubled := not doubled;
  end loop;
  return total % 10 = 0;
end;
$$;
grant execute on function private.is_valid_isin(text) to authenticated;

create table public.instrument (
  id uuid primary key default gen_random_uuid(),
  isin text not null,
  name text not null check (length(btrim(name)) > 0),
  issuer text,
  index_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint instrument_isin_unique unique (isin),
  constraint instrument_isin_valid check (private.is_valid_isin(isin))
);
comment on table public.instrument is
  'Fund identified by ISIN. Unknown attributes stay NULL (never zero or empty). Versioned attributes arrive in BF-012.';

create table public.listing (
  id uuid primary key default gen_random_uuid(),
  instrument_id uuid not null references public.instrument (id) on delete restrict,
  exchange text not null check (exchange ~ '^[A-Z0-9]{4}$'),
  ticker text not null check (ticker ~ '^[A-Z0-9][A-Z0-9.\-]{0,14}$'),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  status text not null default 'unverified'
    check (status in ('unverified', 'active', 'suspended', 'delisted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_identity_unique unique (instrument_id, exchange, ticker, currency)
);
comment on table public.listing is
  'Quotation of an instrument: exchange (MIC) + ticker + currency. Market prices reference listing_id, never NAV.';
comment on column public.listing.exchange is 'ISO 10383 market identifier code, 4 characters.';

-- A live ticker on an exchange maps to exactly one listing.
create unique index listing_live_ticker_unique
  on public.listing (exchange, ticker)
  where status <> 'delisted';
create index listing_ticker_idx on public.listing (ticker);
create index listing_instrument_idx on public.listing (instrument_id);

create trigger instrument_touch before update on public.instrument
  for each row execute function private.touch_updated_at();
create trigger listing_touch before update on public.listing
  for each row execute function private.touch_updated_at();

-- RLS (already enabled by ensure_rls; stated explicitly). Shared catalog for the single owner.
alter table public.instrument enable row level security;
alter table public.listing enable row level security;
grant select, insert, update on public.instrument to authenticated;
grant select, insert, update on public.listing to authenticated;

create policy instrument_owner_select on public.instrument
  for select to authenticated using ((select private.is_owner()));
create policy instrument_owner_insert on public.instrument
  for insert to authenticated with check ((select private.is_owner()));
create policy instrument_owner_update on public.instrument
  for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

create policy listing_owner_select on public.listing
  for select to authenticated using ((select private.is_owner()));
create policy listing_owner_insert on public.listing
  for insert to authenticated with check ((select private.is_owner()));
create policy listing_owner_update on public.listing
  for update to authenticated
  using ((select private.is_owner())) with check ((select private.is_owner()));

-- Idempotent ingestion: the same ISIN + listing never duplicates, and existing
-- attributes are never overwritten silently (versioning is BF-012's job).
create or replace function public.upsert_instrument_listing(
  p_isin text,
  p_name text,
  p_exchange text,
  p_ticker text,
  p_currency text,
  p_issuer text default null,
  p_index_name text default null
)
returns table (instrument_id uuid, listing_id uuid, instrument_created boolean, listing_created boolean)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_isin text := upper(btrim(p_isin));
  v_exchange text := upper(btrim(p_exchange));
  v_ticker text := upper(btrim(p_ticker));
  v_currency text := upper(btrim(p_currency));
  v_instrument uuid;
  v_listing uuid;
  v_inst_new boolean := false;
  v_list_new boolean := false;
begin
  insert into public.instrument (isin, name, issuer, index_name)
  values (v_isin, btrim(p_name), nullif(btrim(p_issuer), ''), nullif(btrim(p_index_name), ''))
  on conflict on constraint instrument_isin_unique do nothing
  returning id into v_instrument;

  if v_instrument is null then
    select i.id into v_instrument from public.instrument i where i.isin = v_isin;
  else
    v_inst_new := true;
  end if;

  insert into public.listing (instrument_id, exchange, ticker, currency)
  values (v_instrument, v_exchange, v_ticker, v_currency)
  on conflict on constraint listing_identity_unique do nothing
  returning id into v_listing;

  if v_listing is null then
    select l.id into v_listing from public.listing l
    where l.instrument_id = v_instrument and l.exchange = v_exchange
      and l.ticker = v_ticker and l.currency = v_currency;
  else
    v_list_new := true;
  end if;

  return query select v_instrument, v_listing, v_inst_new, v_list_new;
end;
$$;
revoke all on function public.upsert_instrument_listing(text, text, text, text, text, text, text) from public, anon;
grant execute on function public.upsert_instrument_listing(text, text, text, text, text, text, text) to authenticated;

-- Search never collapses an ambiguous ticker: it returns every listing and flags the ambiguity.
create or replace function public.search_listings(p_ticker text)
returns table (
  listing_id uuid, instrument_id uuid, isin text, name text,
  exchange text, ticker text, currency text, status text, ambiguous boolean
)
language sql
stable
security invoker
set search_path = ''
as $$
  select l.id, i.id, i.isin, i.name, l.exchange, l.ticker, l.currency, l.status,
         count(*) over () > 1
  from public.listing l
  join public.instrument i on i.id = l.instrument_id
  where l.ticker = upper(btrim(p_ticker))
  order by l.exchange, l.currency;
$$;
revoke all on function public.search_listings(text) from public, anon;
grant execute on function public.search_listings(text) to authenticated;

-- Resolution to ONE listing. Ambiguous input is an error, never a guess.
create or replace function public.resolve_listing(
  p_ticker text,
  p_exchange text default null,
  p_currency text default null
)
returns uuid
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_ids uuid[];
begin
  select array_agg(l.id) into v_ids
  from public.listing l
  where l.ticker = upper(btrim(p_ticker))
    and (p_exchange is null or l.exchange = upper(btrim(p_exchange)))
    and (p_currency is null or l.currency = upper(btrim(p_currency)));

  if v_ids is null then
    raise exception 'listing_not_found: no listing matches ticker %', p_ticker
      using errcode = 'P0002';
  elsif array_length(v_ids, 1) > 1 then
    raise exception 'ambiguous_ticker: % listings match %; select one by exchange and currency',
      array_length(v_ids, 1), p_ticker
      using errcode = 'P0001';
  end if;
  return v_ids[1];
end;
$$;
revoke all on function public.resolve_listing(text, text, text) from public, anon;
grant execute on function public.resolve_listing(text, text, text) to authenticated;
