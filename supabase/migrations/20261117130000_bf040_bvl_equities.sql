-- BF-040: BVL equities with verifiable identity and safely isolated ETF catalog.
-- Depends on BF-041a watchlist migration already present in shared Supabase.
-- Only 9 listed common capital shares on XLIM; no price, transactions or dividends.
-- No changes to existing 5 ETFs or watchlist events.

alter table public.instrument
  add column asset_type text not null default 'etf'
    constraint instrument_asset_type_valid check (asset_type in ('etf','equity'));

-- Provenance: BVL's daily equity report, dated 16 Nov 2026. The document
-- proves the published ticker / currency / ISIN; not the current trade status.
insert into public.source_record(
  url,title,publisher,source_type,document_date,license_note,created_by
) values (
  'https://documents.bvl.com.pe/pubdif/boldia/stockq.htm',
  'BVL: Mercado de Renta Variable - Actualizado al 16 de noviembre de 2026',
  'Bolsa de Valores de Lima','exchange','2026-11-16',
  'Uso de identificadores como referencia documental. No se redistribuyen cotizaciones ni series de precios.',
  'BF-040'
) on conflict (url,document_date) do nothing;

-- One ISIN per issuer/security, one local (XLIM) listing per mnemonic. Credicorp
-- BAP is USD on XLIM and NYSE; THIS increment creates only XLIM, not NYSE.
with seed(mnemonic,isin,name,currency,domicile) as (
  values
  ('ALICORC1','PEP214001005','Alicorp S.A.','PEN',null),
  ('FERREYC1','PEP736001004','Ferreycorp S.A.A.','PEN',null),
  ('INRETC1','PAL1801171A1','InRetail Perú Corp.','USD',null),
  ('BBVAC1','PEP116001004','Banco BBVA Perú','PEN',null),
  ('CPACASC1','PEP239501005','Cementos Pacasmayo S.A.A.','PEN',null),
  ('ENGIEC1','PEP702101002','Engie Energía Perú S.A.','PEN',null),
  ('UNACEMC1','PEP761001002','Unacem Corp S.A.A.','PEN',null),
  ('NEXAPEC1','PEP620001003','Nexa Resources Perú S.A.A.','PEN',null),
  ('BAP','BMG2519Y1084','Credicorp Ltd.','USD','BM')
)
insert into public.instrument(isin,name,issuer,domicile,asset_type)
select isin,name,name,domicile,'equity' from seed
on conflict (isin) do nothing;

-- Refuse accidental reuse of the same ISIN as ETF, or a mismatched ticker.
do $checks$
begin
  if exists (
    with seed(isin,name) as (
      values
      ('PEP214001005','Alicorp S.A.'),('PEP736001004','Ferreycorp S.A.A.'),
      ('PAL1801171A1','InRetail Perú Corp.'),('PEP116001004','Banco BBVA Perú'),
      ('PEP239501005','Cementos Pacasmayo S.A.A.'),('PEP702101002','Engie Energía Perú S.A.'),
      ('PEP761001002','Unacem Corp S.A.A.'),('PEP620001003','Nexa Resources Perú S.A.A.'),
      ('BMG2519Y1084','Credicorp Ltd.')
    )
    select 1 from seed s join public.instrument i on i.isin=s.isin
    where i.asset_type <> 'equity' or i.name <> s.name
  ) then
    raise exception 'BF-040: existing ISIN has incompatible type/name' using errcode='22023';
  end if;
end
$checks$;

with seed(mnemonic,isin,currency) as (
  values
  ('ALICORC1','PEP214001005','PEN'),
  ('FERREYC1','PEP736001004','PEN'),
  ('INRETC1','PAL1801171A1','USD'),
  ('BBVAC1','PEP116001004','PEN'),
  ('CPACASC1','PEP239501005','PEN'),
  ('ENGIEC1','PEP702101002','PEN'),
  ('UNACEMC1','PEP761001002','PEN'),
  ('NEXAPEC1','PEP620001003','PEN'),
  ('BAP','BMG2519Y1084','USD')
)
insert into public.listing(instrument_id,exchange,ticker,currency,status)
select i.id,'XLIM',s.mnemonic,s.currency,'unverified'
from seed s join public.instrument i on i.isin=s.isin
on conflict (instrument_id,exchange,ticker,currency) do nothing;

-- This is not a trade-availability assertion: listing.status stays unverified.
-- A single official source supports ticker, ISIN, currency and market identity.
insert into public.field_evidence(
  entity_type,entity_id,field,value,verification_status,
  source_record_id,effective_date,note,created_by
)
select 'instrument',i.id,'isin',i.isin,'verified',s.id,date '2026-11-16',
  'ISIN of BVL security; identity only, not live-price verification.','BF-040'
from public.instrument i
cross join lateral (select id from public.source_record
 where url='https://documents.bvl.com.pe/pubdif/boldia/stockq.htm' and document_date='2026-11-16') s
where i.asset_type='equity' and i.isin in (
  'PEP214001005','PEP736001004','PAL1801171A1','PEP116001004',
  'PEP239501005','PEP702101002','PEP761001002','PEP620001003','BMG2519Y1084'
)
and not exists (
  select 1 from public.field_evidence e
  where e.entity_type='instrument' and e.entity_id=i.id
    and e.field='isin' and e.verification_status='verified'
)
union all
select 'listing',l.id,'ticker',l.ticker,'verified',s.id,date '2026-11-16',
  'BVL XLIM equity identifier as of source date; listing status not confirmed.','BF-040'
from public.listing l join public.instrument i on i.id=l.instrument_id
cross join lateral (select id from public.source_record
 where url='https://documents.bvl.com.pe/pubdif/boldia/stockq.htm' and document_date='2026-11-16') s
where i.asset_type='equity' and l.exchange='XLIM'
and not exists (
  select 1 from public.field_evidence e where e.entity_type='listing'
    and e.entity_id=l.id and e.field='ticker' and e.verification_status='verified'
);

insert into public.field_evidence(
  entity_type,entity_id,field,value,verification_status,
  source_record_id,effective_date,note,created_by
)
select 'listing',l.id,'currency',l.currency,'verified',s.id,date '2026-11-16',
  'Published BVL quote currency. No exchange-rate conversion implied.','BF-040'
from public.listing l join public.instrument i on i.id=l.instrument_id
cross join lateral (select id from public.source_record
 where url='https://documents.bvl.com.pe/pubdif/boldia/stockq.htm' and document_date='2026-11-16') s
where i.asset_type='equity' and l.exchange='XLIM'
and not exists (
  select 1 from public.field_evidence e where e.entity_type='listing'
    and e.entity_id=l.id and e.field='currency' and e.verification_status='verified'
);

-- Original ETF catalog MUST exclude individual shares. Preserve view columns.
create or replace view public.catalog_overview
with (security_invoker = true) as
select l.id as listing_id,i.id as instrument_id,l.ticker,l.exchange,l.currency,
  i.isin,i.name,i.index_name,i.distribution_policy,
  (select count(*) from public.field_status fs
   where fs.entity_id=any(array[i.id,l.id]) and fs.display_status='sin verificar') as fields_unverified
from public.listing l join public.instrument i on i.id=l.instrument_id
where i.asset_type='etf';

-- Equity identity source is read-only, RLS enforced for both base and source tables.
create view public.equity_listing_overview
with (security_invoker = true) as
select l.id as listing_id,i.id as instrument_id,i.name,i.issuer,i.isin,
  l.ticker,l.exchange,l.currency,l.status as listing_status,
  i.asset_type,
  s.url as source_url,s.document_date as source_date,
  (s.id is not null) as identity_documented
from public.listing l join public.instrument i on i.id=l.instrument_id
left join lateral (
  select sr.id,sr.url,sr.document_date
  from public.field_evidence e join public.source_record sr on sr.id=e.source_record_id
  where e.entity_type='listing' and e.entity_id=l.id and e.field='ticker'
    and e.value=l.ticker and e.verification_status='verified'
  order by e.effective_date desc nulls last,e.captured_at desc limit 1
) s on true
where i.asset_type='equity' and l.exchange='XLIM';

revoke all on public.equity_listing_overview from public,anon,authenticated;
grant select on public.equity_listing_overview to authenticated;

-- The existing ETF snapshot RPC predates asset_type and reads listing directly.
-- Reject every equity listing even if a caller bypasses the frontend.
create function private.reject_equities_in_saved_etf_comparison()
returns trigger language plpgsql security invoker set search_path=''
as $guard$
begin
  if exists (
    select 1 from unnest(new.listing_ids) as listing_id
    left join public.listing l on l.id=listing_id
    left join public.instrument i on i.id=l.instrument_id
    where i.id is null or i.asset_type <> 'etf'
  ) then
    raise exception 'Solo se permiten ETF en comparaciones ETF'
      using errcode='22023';
  end if;
  return new;
end
$guard$;
revoke all on function private.reject_equities_in_saved_etf_comparison()
  from public,anon,authenticated;
create trigger bf040_etf_comparison_only
before insert or update of listing_ids on public.saved_etf_comparison
for each row execute function private.reject_equities_in_saved_etf_comparison();

-- ETF source/status view was designed for funds. Leave its columns stable,
-- while constraining the expected-field analysis to ETF entities.
create or replace view public.field_status with (security_invoker = true) as
with expected(entity_type,field) as (
  values
  ('instrument'::text,'isin'::text),('instrument','name'),('instrument','issuer'),
  ('instrument','index_name'),('instrument','domicile'),('instrument','distribution_policy'),
  ('instrument','inception_date'),('listing','exchange'),('listing','ticker'),
  ('listing','currency'),('listing','status')
), entities as (
  select 'instrument'::text as entity_type,i.id as entity_id,
    to_jsonb(i.*) as row_json
  from public.instrument i where i.asset_type='etf'
  union all
  select 'listing'::text,l.id,to_jsonb(l.*)
  from public.listing l join public.instrument i on i.id=l.instrument_id
  where i.asset_type='etf'
)
select en.entity_type,en.entity_id,ex.field,en.row_json->>ex.field as current_value,
case
  when ev.id is null or ev.verification_status='unverified' then 'sin verificar'::text
  when ev.verification_status='verified' then 'verificado'::text
  else 'derivado'::text
end as display_status,ev.verification_status as evidence_status,
ev.effective_date,s.url as source_url,s.publisher as source_publisher,
s.document_date as source_date,ev.note
from entities en join expected ex on ex.entity_type=en.entity_type
left join public.field_evidence ev on
  ev.entity_type=en.entity_type and ev.entity_id=en.entity_id and ev.field=ex.field
  and ev.verification_status in ('verified','derived','unverified')
left join public.source_record s on s.id=ev.source_record_id;

-- Fail closed if expected identity count or ETF count is not exactly right.
do $assert$
begin
  if (select count(*) from public.equity_listing_overview) <> 9
     or (select count(*) from public.catalog_overview) <> 5
     or exists (select 1 from public.equity_listing_overview
       where source_url is null or not identity_documented) then
    raise exception 'BF-040: required nine equities or five ETFs missing';
  end if;
end
$assert$;
