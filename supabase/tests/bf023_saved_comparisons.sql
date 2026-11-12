-- BF-023b verification: run against DB as an admin; this test never commits fixture rows.
-- Precondition: one owner and five seeded ETF/listings. All test writes rollback.
begin;
select set_config('request.jwt.claim.sub',(select user_id::text from public.app_owner limit 1),true);
set local role authenticated;
do $qa$
declare
  ids uuid[]; saved uuid; data jsonb; m jsonb; caught boolean;
begin
  select array_agg(id order by ticker) into ids
  from (select id,ticker from public.listing order by ticker limit 2) s;

  saved := public.save_etf_comparison(ids,'QA temporal BF023',date '2026-11-11');
  select items_snapshot into data from public.saved_etf_comparison where id=saved;
  if saved is null or data is null or jsonb_array_length(data)<>2
     or data->0->>'listing_id'<>ids[1]::text then
    raise exception 'QA01 error snapshot o lectura RLS';
  end if;
  m:=data->0->'metrics'->'ter_percent';
  if m is null or not (m ? 'source_record_id') or not (m ? 'version')
    or not (m ? 'source_url') then
    raise exception 'QA02 faltan fuentes y versiones en snapshot';
  end if;

  caught:=false;
  begin perform public.save_etf_comparison(array[ids[1],ids[1]],'duplicados',null);
  exception when sqlstate '22023' then caught:=true; end;
  if not caught then raise exception 'QA03 duplicados admitidos'; end if;

  caught:=false;
  begin perform public.save_etf_comparison(array[ids[1]],'uno',null);
  exception when sqlstate '22023' then caught:=true; end;
  if not caught then raise exception 'QA04 un solo listing admitido'; end if;

  caught:=false;
  begin perform public.save_etf_comparison(ids,'fecha futura',date '2099-01-01');
  exception when sqlstate '22023' then caught:=true; end;
  if not caught then raise exception 'QA05 futuro admitido'; end if;

  caught:=false;
  begin update public.saved_etf_comparison set title='hack' where id=saved;
  exception when insufficient_privilege then caught:=true; end;
  if not caught then raise exception 'QA06 UPDATE directo admitido'; end if;

  caught:=false;
  begin
    insert into public.saved_etf_comparison(owner_user_id,title,as_of_date,listing_ids,items_snapshot)
    values(auth.uid(),'inseguro',current_date,ids,data);
  exception when insufficient_privilege then caught:=true; end;
  if not caught then raise exception 'QA07 INSERT directo admitido'; end if;

  perform set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000099',true);
  caught:=false;
  begin perform public.save_etf_comparison(ids,'otro usuario',null);
  exception when insufficient_privilege then caught:=true; end;
  if not caught then raise exception 'QA08 usuario ajeno admitido'; end if;

  if exists (select 1 from public.saved_etf_comparison) then
    raise exception 'QA09 RLS mostró datos privados a usuario ajeno';
  end if;
  raise notice 'BF023_QA PASS 9 pruebas; transacción revertida';
end $qa$;
rollback;
select 'QA_WITH_ROLLBACK_PASS' as result,
  (select count(*) from public.saved_etf_comparison) as rows_after_rollback;