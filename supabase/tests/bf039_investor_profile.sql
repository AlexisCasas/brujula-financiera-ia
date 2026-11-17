-- BF-039 SQL integration tests. Run only with explicit Product Owner authorization.
-- The entire transaction rolls back; verify zero residual rows after execution.
begin;
select set_config('request.jwt.claim.sub',
  (select user_id::text from public.app_owner limit 1), true);
set local role authenticated;

do $qa$
declare
  a jsonb;
  b jsonb;
  c jsonb;
  d jsonb;
  saved uuid;
  row_data public.investor_profile_snapshot%rowtype;
  caught boolean;
begin
  a := jsonb_build_object(
    'horizon','over_10y','withdrawal','over_3y',
    'emergency_fund','over_3m','income_stability','stable',
    'capital_dependency','not_needed','high_cost_debt','no',
    'drop_10','buy_more','drop_20','buy_more','drop_30','buy_more',
    'emotional_reaction','comfortable','goal','growth','experience','basic'
  );
  saved := public.save_investor_profile(a);
  select * into row_data from public.investor_profile_snapshot where id=saved;
  if row_data.profile_status <> 'complete' or row_data.capacity_score <> 12
    or row_data.capacity_band <> 'high' or row_data.tolerance_score <> 8
    or row_data.tolerance_band <> 'high' or row_data.overall_band <> 'high'
    or row_data.result_reason <> 'aligned' then
    raise exception 'QA01 high/high profile failed';
  end if;

  b := jsonb_build_object(
    'horizon','under_1y','withdrawal','under_1y',
    'emergency_fund','under_1m','income_stability','variable',
    'capital_dependency','essential','high_cost_debt','yes',
    'drop_10','buy_more','drop_20','buy_more','drop_30','buy_more',
    'emotional_reaction','comfortable','goal','growth','experience','basic'
  );
  saved := public.save_investor_profile(b);
  select * into row_data from public.investor_profile_snapshot where id=saved;
  if row_data.capacity_score <> 0 or row_data.capacity_band <> 'low'
    or row_data.tolerance_band <> 'high' or row_data.overall_band <> 'low'
    or row_data.result_reason <> 'capacity_limited' then
    raise exception 'QA02 restrictive capacity did not cap overall profile';
  end if;

  c := jsonb_set(a,'{emergency_fund}','"prefer_not"');
  saved := public.save_investor_profile(c);
  select * into row_data from public.investor_profile_snapshot where id=saved;
  if row_data.profile_status <> 'incomplete' or row_data.capacity_score is not null
    or row_data.overall_band is not null or row_data.result_reason <> 'incomplete' then
    raise exception 'QA03 undisclosed capacity data was incorrectly scored';
  end if;

  d := jsonb_set(jsonb_set(a,'{drop_10}','"sell_all"'),'{drop_20}','"buy_more"');
  saved := public.save_investor_profile(d);
  select * into row_data from public.investor_profile_snapshot where id=saved;
  if row_data.profile_status <> 'review_needed' or row_data.overall_band is not null then
    raise exception 'QA04 inconsistent drawdown answers were classified';
  end if;

  caught := false;
  begin
    perform public.save_investor_profile(jsonb_set(a,'{horizon}','"forever"'));
  exception when sqlstate '22023' then caught := true;
  end;
  if not caught then raise exception 'QA05 invalid answer accepted'; end if;

  caught := false;
  begin
    update public.investor_profile_snapshot set overall_band='high' where id=saved;
  exception when insufficient_privilege then caught := true;
  end;
  if not caught then raise exception 'QA06 direct UPDATE allowed'; end if;

  caught := false;
  begin
    insert into public.investor_profile_snapshot(
      owner_user_id,questionnaire_version,scoring_version,answers,
      profile_status,tolerance_score,tolerance_band,result_reason
    ) values(auth.uid(),'1.0','1.0',a,'complete',8,'high','aligned');
  exception when insufficient_privilege then caught := true;
  end;
  if not caught then raise exception 'QA07 direct INSERT allowed'; end if;

  perform set_config('request.jwt.claim.sub',
    '00000000-0000-0000-0000-000000000099', true);
  caught := false;
  begin
    perform public.save_investor_profile(a);
  exception when insufficient_privilege then caught := true;
  end;
  if not caught then raise exception 'QA08 non-owner RPC allowed'; end if;

  if exists(select 1 from public.investor_profile_snapshot) then
    raise exception 'QA09 non-owner RLS read exposed rows';
  end if;

  raise notice 'BF039_SQL_QA_PASS: 9 checks';
end
$qa$;
rollback;
select 'BF039_ROLLBACK_PASS' as result,
  (select count(*) from public.investor_profile_snapshot) as rows_after_rollback;
