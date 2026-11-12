-- BF-011 pilot load: VWRA, FWRA, VOO, VUG, SPYG. Built from idempotent functions (record_source, upsert_instrument_listing, set_field; see tests/source_evidence.sql E3). A full rerun was not executed.
-- Run as the migration role. Identifier facts only; no document content is stored.
-- Sources were read on 2026-11-11. verified = stated by the official source; derived = computed
-- from a verified identifier (ISIN from CUSIP, ISO 6166 / MIC mapping); unverified = not stated.
do $$
declare
  v_by constant text := 'claude-code (dev MCP) - BF-011 pilot load 2026-11-11';
  v_lic constant text := 'Identifier facts only (ISIN, ticker, exchange, index, domicile, income treatment). No page or document content is stored.';
  src jsonb := '{}'::jsonb;
  v_id uuid;
  c record;
begin
  -- 1. Official sources.
  for c in select * from (values
    ('vwra', 'https://www.ch.vanguard/en/professional/product/etf/equity/9679/ftse-all-world-ucits-etf-usd-accumulating',
      'FTSE All-World UCITS ETF - (USD) Accumulating (VWRA): product page', 'Vanguard Investments Switzerland GmbH', date '2026-11-11', null),
    ('fwra', 'https://www.invesco.com/content/dam/invesco/emea/en/product-documents/etf/share-class/factsheet/IE000716YHJ7_factsheet_en.pdf',
      'Invesco FTSE All-World UCITS ETF Acc: factsheet', 'Invesco', date '2026-09-30',
      '53091e40b58473235f3ffcf1c2ef986fb587ac70921f592c09c1c771f277d79a'),
    ('voo', 'https://fund-docs.vanguard.com/F0968.pdf',
      'Vanguard S&P 500 ETF (VOO): fact sheet', 'The Vanguard Group, Inc.', date '2026-09-30',
      'e96f5ad4c4aee46c64a609ff3fcab58e246e9e6b94f49b4986cb808b5ee82286'),
    ('vug', 'https://fund-docs.vanguard.com/F0967.pdf',
      'Vanguard Morningstar Growth ETF (VUG): fact sheet', 'The Vanguard Group, Inc.', date '2026-09-30',
      '98c95fe71d4c3fdab0f20c76213c7de73c7947619c3944f6eb100d57c041c941'),
    ('spyg', 'https://www.ssga.com/us/en/individual/etfs/funds/spdr-portfolio-s-and-p-500-growth-etf-SPYG',
      'State Street SPDR Portfolio S&P 500 Growth ETF (SPYG): fund page', 'State Street Global Advisors', date '2026-11-11', null)
  ) as t(k, url, title, publisher, doc_date, sha)
  loop
    v_id := public.record_source(c.url, c.title, c.publisher, 'issuer_official', c.doc_date, v_lic, v_by, c.sha);
    src := src || jsonb_build_object(c.k, v_id);
  end loop;

  -- 2. Instruments and their pilot listing (identity first; evidence below).
  perform public.upsert_instrument_listing('IE00BK5BQT80', 'FTSE All-World UCITS ETF - (USD) Accumulating', 'XLON', 'VWRA', 'USD');
  perform public.upsert_instrument_listing('IE000716YHJ7', 'Invesco FTSE All-World UCITS ETF Acc', 'XLON', 'FWRA', 'USD');
  perform public.upsert_instrument_listing('US9229083632', 'Vanguard S&P 500 ETF', 'ARCX', 'VOO', 'USD');
  perform public.upsert_instrument_listing('US9229087369', 'Vanguard Morningstar Growth ETF', 'ARCX', 'VUG', 'USD');
  perform public.upsert_instrument_listing('US78464A4094', 'State Street SPDR Portfolio S&P 500 Growth ETF', 'ARCX', 'SPYG', 'USD');

  -- 3. One claim per field: (instrument ISIN, entity, field, value, status, source, as-of date, note).
  for c in select * from (values
    -- VWRA (Vanguard, product page as of 2026-11-11)
    ('IE00BK5BQT80','i','isin','IE00BK5BQT80','verified','vwra',date '2026-11-11','ISIN stated on the page.'),
    ('IE00BK5BQT80','i','name','FTSE All-World UCITS ETF - (USD) Accumulating','verified','vwra',date '2026-11-11','Display name on the page; no separate legal name is shown.'),
    ('IE00BK5BQT80','i','issuer','Vanguard Funds PLC','verified','vwra',date '2026-11-11','Shown as "Legal entity".'),
    ('IE00BK5BQT80','i','index_name','FTSE All-World Index','verified','vwra',date '2026-11-11',null),
    ('IE00BK5BQT80','i','domicile','IE','verified','vwra',date '2026-11-11','Page states Ireland.'),
    ('IE00BK5BQT80','i','distribution_policy','accumulating','verified','vwra',date '2026-11-11','From the share class name "(USD) Accumulating".'),
    ('IE00BK5BQT80','i','inception_date','2019-07-23','verified','vwra',date '2026-11-11','Share class inception; the page also lists other listing dates.'),
    ('IE00BK5BQT80','l:VWRA','ticker','VWRA','verified','vwra',date '2026-11-11','London Stock Exchange, USD line.'),
    ('IE00BK5BQT80','l:VWRA','exchange','XLON','verified','vwra',date '2026-11-11','Page names London Stock Exchange; MIC XLON per ISO 10383.'),
    ('IE00BK5BQT80','l:VWRA','currency','USD','verified','vwra',date '2026-11-11','Trading currency of the London line.'),
    -- FWRA (Invesco, factsheet as of 2026-09-30)
    ('IE000716YHJ7','i','isin','IE000716YHJ7','verified','fwra',date '2026-09-30','ISIN code stated on the factsheet.'),
    ('IE000716YHJ7','i','name','Invesco FTSE All-World UCITS ETF Acc','verified','fwra',date '2026-09-30',null),
    ('IE000716YHJ7','i','issuer','Invesco Markets II plc','verified','fwra',date '2026-09-30','Umbrella fund named on the factsheet.'),
    ('IE000716YHJ7','i','index_name','FTSE All-World Index','verified','fwra',date '2026-09-30',null),
    ('IE000716YHJ7','i','domicile','IE','verified','fwra',date '2026-09-30','Factsheet states Ireland.'),
    ('IE000716YHJ7','i','distribution_policy','accumulating','verified','fwra',date '2026-09-30','Dividend treatment: Accumulating.'),
    ('IE000716YHJ7','i','inception_date','2023-06-26','verified','fwra',date '2026-09-30','Share class launch date.'),
    ('IE000716YHJ7','l:FWRA','ticker','FWRA','verified','fwra',date '2026-09-30','Ticker shown in the factsheet header.'),
    ('IE000716YHJ7','l:FWRA','exchange','XLON','derived','fwra',date '2026-09-30','Factsheet shows Bloomberg code "FWRA LN"; LN denotes London. It has no listings table, so the exchange is derived, not stated.'),
    ('IE000716YHJ7','l:FWRA','currency','USD','unverified','fwra',date '2026-09-30','Share class currency is USD; the trading currency of the London line is not stated.'),
    -- VOO (Vanguard, fact sheet as of 2026-09-30)
    ('US9229083632','i','isin','US9229083632','derived','voo',date '2026-09-30','Not printed on the fact sheet. Derived from the stated CUSIP 922908363 (US + CUSIP + ISO 6166 check digit); the database check-digit validation passes.'),
    ('US9229083632','i','name','Vanguard S&P 500 ETF','verified','voo',date '2026-09-30','Fact sheet title.'),
    ('US9229083632','i','issuer','Vanguard','verified','voo',date '2026-09-30','Brand on the fact sheet; the legal entity is not stated in the extracted text.'),
    ('US9229083632','i','index_name','S&P 500 Index','verified','voo',date '2026-09-30',null),
    ('US9229083632','i','distribution_policy','distributing','unverified','voo',date '2026-09-30','The fact sheet shows "Quarterly" near the distribution frequency, but the column layout could not be parsed unambiguously. Confirm.'),
    ('US9229083632','i','inception_date','2010-09-07','verified','voo',date '2026-09-30',null),
    ('US9229083632','l:VOO','ticker','VOO','verified','voo',date '2026-09-30',null),
    ('US9229083632','l:VOO','exchange','ARCX','verified','voo',date '2026-09-30','Fact sheet names NYSE Arca; MIC ARCX per ISO 10383.'),
    ('US9229083632','l:VOO','currency','USD','unverified','voo',date '2026-09-30','USD is implied by the NYSE Arca listing but is not stated in the fact sheet.'),
    -- VUG (Vanguard, fact sheet as of 2026-09-30)
    ('US9229087369','i','isin','US9229087369','derived','vug',date '2026-09-30','Not printed on the fact sheet. Derived from the stated CUSIP 922908736; the database check-digit validation passes.'),
    ('US9229087369','i','name','Vanguard Morningstar Growth ETF','verified','vug',date '2026-09-30','Renamed: previously Vanguard Growth ETF.'),
    ('US9229087369','i','issuer','Vanguard','verified','vug',date '2026-09-30','Brand on the fact sheet; the legal entity is not stated in the extracted text.'),
    ('US9229087369','i','index_name','Morningstar US Large Cap Growth Index','verified','vug',date '2026-09-30','Previously CRSP US Large Cap Growth Index; rebranded after Morningstar acquired CRSP (index ticker still CRSPLCGT).'),
    ('US9229087369','i','distribution_policy','distributing','unverified','vug',date '2026-09-30','The fact sheet shows "Quarterly" near the distribution frequency, but the column layout could not be parsed unambiguously. Confirm.'),
    ('US9229087369','i','inception_date','2004-01-26','verified','vug',date '2026-09-30',null),
    ('US9229087369','l:VUG','ticker','VUG','verified','vug',date '2026-09-30',null),
    ('US9229087369','l:VUG','exchange','ARCX','verified','vug',date '2026-09-30','Fact sheet names NYSE Arca; MIC ARCX per ISO 10383.'),
    ('US9229087369','l:VUG','currency','USD','unverified','vug',date '2026-09-30','USD is implied by the NYSE Arca listing but is not stated in the fact sheet.'),
    -- SPYG (State Street, fund page as of 2026-11-11)
    ('US78464A4094','i','isin','US78464A4094','verified','spyg',date '2026-11-11','ISIN stated on the page (CUSIP 78464A409).'),
    ('US78464A4094','i','name','State Street SPDR Portfolio S&P 500 Growth ETF','verified','spyg',date '2026-11-11','Registered-trademark symbols omitted.'),
    ('US78464A4094','i','issuer','SSGA Funds Management, Inc.','verified','spyg',date '2026-11-11','Listed as Investment Manager; the page names no issuer entity.'),
    ('US78464A4094','i','index_name','S&P 500 Growth Index','verified','spyg',date '2026-11-11',null),
    ('US78464A4094','i','distribution_policy','distributing','verified','spyg',date '2026-11-11','Distribution frequency: Quarterly.'),
    ('US78464A4094','i','inception_date','2000-09-25','verified','spyg',date '2026-11-11',null),
    ('US78464A4094','l:SPYG','ticker','SPYG','verified','spyg',date '2026-11-11',null),
    ('US78464A4094','l:SPYG','exchange','ARCX','verified','spyg',date '2026-11-11','Page names NYSE ARCA; MIC ARCX per ISO 10383.'),
    ('US78464A4094','l:SPYG','currency','USD','unverified','spyg',date '2026-11-11','USD is implied by the NYSE Arca listing but was not read from the page.')
  ) as t(isin, ent, fld, val, st, srck, eff, note)
  loop
    if c.ent = 'i' then
      select i.id into v_id from public.instrument i where i.isin = c.isin;
      perform public.set_field('instrument', v_id, c.fld, c.val, c.st, (src ->> c.srck)::uuid, c.eff, c.note, v_by);
    else
      select l.id into v_id from public.listing l join public.instrument i on i.id = l.instrument_id
      where i.isin = c.isin and l.ticker = substr(c.ent, 3);
      perform public.set_field('listing', v_id, c.fld, c.val, c.st, (src ->> c.srck)::uuid, c.eff, c.note, v_by);
    end if;
  end loop;
end;
$$;
