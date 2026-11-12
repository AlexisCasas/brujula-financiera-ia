-- BF-012 pilot measurements (TER and fund size) for VWRA, FWRA, VOO, VUG and SPYG, plus the
-- corrections that closed BF-011 gaps. Run as the migration role after bf011_pilot_etf.sql.
-- Uses idempotent functions (record_measurement, set_field). Sources were read on 2026-11-11.
-- ter_percent is a percentage: 0.14 means 0.14%. Sizes are in units of the stated currency.
do $$
declare
  v_by constant text := 'claude-code (dev MCP) - BF-012 pilot load 2026-11-11';
  v_vwra uuid; v_fwra uuid; v_voo uuid; v_vug uuid; v_spyg uuid;
  s_vwra uuid; s_fwra uuid; s_voo uuid; s_vug uuid; s_spyg uuid;
  c record;
  v_inst uuid;
begin
  select id into s_vwra from public.source_record where url like 'https://www.ch.vanguard/%9679%' and document_date = date '2026-11-11';
  select id into s_fwra from public.source_record where url like '%IE000716YHJ7_factsheet_en.pdf' and document_date = date '2026-09-30';
  select id into s_voo  from public.source_record where url = 'https://fund-docs.vanguard.com/F0968.pdf' and document_date = date '2026-09-30';
  select id into s_vug  from public.source_record where url = 'https://fund-docs.vanguard.com/F0967.pdf' and document_date = date '2026-09-30';
  select id into s_spyg from public.source_record where url like 'https://www.ssga.com/%SPYG' and document_date = date '2026-11-11';
  if s_vwra is null or s_fwra is null or s_voo is null or s_vug is null or s_spyg is null then
    raise exception 'a pilot source is missing; run bf011_pilot_etf.sql first';
  end if;

  for c in select * from (values
    -- VWRA: the page states no as-of date; the read date is used and said in the note.
    ('IE00BK5BQT80','ter_percent', 0.14::numeric, null::text, date '2026-11-11', s_vwra, 'Ongoing charge shown on the page with no as-of date; the date is when it was read. Third-party sites show 0.19-0.22%; the official figure is used.'),
    ('IE00BK5BQT80','net_assets', 62190000000, 'USD', date '2026-11-11', s_vwra, 'Share class assets shown with no as-of date; the date is when it was read.'),
    ('IE00BK5BQT80','fund_net_assets', 88840000000, 'USD', date '2026-11-11', s_vwra, 'Fund-level total assets shown with no as-of date; the date is when it was read.'),
    -- FWRA (factsheet as of 2026-09-30)
    ('IE000716YHJ7','ter_percent', 0.15, null, date '2026-09-30', s_fwra, 'Ongoing charge 0.15% p.a.'),
    ('IE000716YHJ7','net_assets', 5184690000, 'USD', date '2026-09-30', s_fwra, 'Labelled "Fund size" on the factsheet (USD 5,184.69m); whether it is the share class or the whole fund is not stated.'),
    -- VOO (fact sheet as of 2026-09-30)
    ('US9229083632','ter_percent', 0.03, null, date '2026-09-30', s_voo, 'Expense ratio as reported in the most recent prospectus.'),
    ('US9229083632','net_assets', 1032260000000, 'USD', date '2026-09-30', s_voo, '"ETF total net assets" $1,032,260 million.'),
    ('US9229083632','fund_net_assets', 1732017000000, 'USD', date '2026-09-30', s_voo, '"Fund total net assets" $1,732,017 million (all share classes).'),
    -- VUG (fact sheet as of 2026-09-30)
    ('US9229087369','ter_percent', 0.03, null, date '2026-09-30', s_vug, 'Expense ratio as reported in the most recent prospectus.'),
    ('US9229087369','net_assets', 232870000000, 'USD', date '2026-09-30', s_vug, '"ETF total net assets" $232,870 million.'),
    ('US9229087369','fund_net_assets', 392179000000, 'USD', date '2026-09-30', s_vug, '"Fund total net assets" $392,179 million (all share classes).'),
    -- SPYG (fund page: size as of 2026-11-10; expense ratio read 2026-11-11)
    ('US78464A4094','ter_percent', 0.04, null, date '2026-11-11', s_spyg, 'Gross expense ratio; the page states no net expense ratio and no as-of date for it (read date used).'),
    ('US78464A4094','net_assets', 52602730000, 'USD', date '2026-11-10', s_spyg, 'Total net assets $52,602.73 M as of Nov 10 2026, as stated on the page.')
  ) as t(isin, metric, val, ccy, as_of, src, note)
  loop
    select id into v_inst from public.instrument where isin = c.isin;
    perform public.record_measurement(v_inst, c.metric, c.val, c.ccy, c.as_of, c.src, c.note, v_by);
  end loop;

  -- Corrections to BF-011 gaps. Each retires the earlier claim without deleting it.
  select id into v_voo from public.instrument where isin = 'US9229083632';
  select id into v_vug from public.instrument where isin = 'US9229087369';
  perform public.set_field('instrument', v_voo, 'distribution_policy', 'distributing', 'verified', s_voo, date '2026-09-30',
    'Fact sheet quick facts lists "Dividend schedule: Quarterly" (read in raw text order); supersedes the earlier unverified claim.', v_by);
  perform public.set_field('instrument', v_vug, 'distribution_policy', 'distributing', 'verified', s_vug, date '2026-09-30',
    'Fact sheet quick facts lists "Dividend schedule: Quarterly" (read in raw text order); supersedes the earlier unverified claim.', v_by);

  select l.id into v_inst from public.listing l join public.instrument i on i.id = l.instrument_id
  where i.isin = 'US78464A4094' and l.ticker = 'SPYG';
  perform public.set_field('listing', v_inst, 'currency', 'USD', 'verified', s_spyg, date '2026-11-11',
    'Page states "Trading currency: USD"; supersedes the earlier unverified claim.', v_by);
end;
$$;
