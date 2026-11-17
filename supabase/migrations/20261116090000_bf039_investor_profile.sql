-- BF-039: private, append-only investor profile assessment snapshots.
-- Apply only after explicit Product Owner authorization: Supabase is shared dev/prod.
create table public.investor_profile_snapshot (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  questionnaire_version text not null check (questionnaire_version = '1.0'),
  scoring_version text not null check (scoring_version = '1.0'),
  answers jsonb not null check (
    jsonb_typeof(answers) = 'object'
  ),
  profile_status text not null check (
    profile_status in ('complete', 'incomplete', 'review_needed')
  ),
  capacity_score smallint null check (capacity_score between 0 and 12),
  capacity_band text null check (capacity_band in ('low', 'medium', 'high')),
  tolerance_score smallint not null check (tolerance_score between 0 and 8),
  tolerance_band text not null check (tolerance_band in ('low', 'medium', 'high')),
  overall_band text null check (overall_band in ('low', 'medium', 'high')),
  result_reason text not null check (
    result_reason in ('aligned', 'capacity_limited', 'tolerance_limited', 'incomplete', 'review_needed')
  ),
  created_at timestamptz not null default now(),
  constraint investor_profile_result_consistency check (
    (profile_status = 'complete'
      and capacity_score is not null and capacity_band is not null
      and overall_band is not null
      and result_reason in ('aligned', 'capacity_limited', 'tolerance_limited'))
    or
    (profile_status = 'incomplete'
      and capacity_score is null and capacity_band is null
      and overall_band is null and result_reason = 'incomplete')
    or
    (profile_status = 'review_needed'
      and capacity_score is not null and capacity_band is not null
      and overall_band is null and result_reason = 'review_needed')
  )
);

comment on table public.investor_profile_snapshot is
  'BF-039: private educational risk self-assessment. Stores coded answer options and immutable versioned scores; no exact financial amounts.';
create index investor_profile_owner_created_idx
  on public.investor_profile_snapshot (owner_user_id, created_at desc);

alter table public.investor_profile_snapshot enable row level security;
create policy investor_profile_owner_read on public.investor_profile_snapshot
  for select to authenticated using (
    owner_user_id = (select auth.uid())
    and (select private.is_owner())
  );

revoke all on public.investor_profile_snapshot from public, anon, authenticated;
grant select on public.investor_profile_snapshot to authenticated;

create function private.save_investor_profile(p_answers jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $bf$
declare
  v_user uuid := auth.uid();
  v_id uuid;
  v_capacity_complete boolean;
  v_capacity_score smallint;
  v_capacity_band text;
  v_tolerance_score smallint;
  v_tolerance_band text;
  v_overall_band text;
  v_profile_status text;
  v_result_reason text;
  v_drop_10 smallint;
  v_drop_20 smallint;
  v_drop_30 smallint;
  v_inconsistent boolean;
begin
  if v_user is null or not exists (
    select 1 from public.app_owner ao where ao.user_id = v_user
  ) then
    raise exception 'No autorizado para guardar el perfil'
      using errcode = '42501';
  end if;

  if p_answers is null or jsonb_typeof(p_answers) <> 'object' then
    raise exception 'Respuestas incompletas o con campos no permitidos'
      using errcode = '22023';
  end if;

  if (select count(*) from jsonb_object_keys(p_answers)) <> 12
     or not (p_answers ?& array[
       'horizon','withdrawal','emergency_fund','income_stability',
       'capital_dependency','high_cost_debt','drop_10','drop_20',
       'drop_30','emotional_reaction','goal','experience'
     ]) then
    raise exception 'Respuestas incompletas o con campos no permitidos'
      using errcode = '22023';
  end if;

  if exists (
    select 1 from jsonb_each(p_answers) e where jsonb_typeof(e.value) <> 'string'
  ) then
    raise exception 'Todas las respuestas deben ser opciones codificadas'
      using errcode = '22023';
  end if;

  if coalesce(p_answers->>'horizon','') not in ('under_1y','1_3y','3_5y','5_10y','over_10y')
    or coalesce(p_answers->>'withdrawal','') not in ('under_1y','1_3y','over_3y')
    or coalesce(p_answers->>'emergency_fund','') not in ('under_1m','1_3m','over_3m','prefer_not')
    or coalesce(p_answers->>'income_stability','') not in ('variable','mixed','stable')
    or coalesce(p_answers->>'capital_dependency','') not in ('essential','partial','not_needed')
    or coalesce(p_answers->>'high_cost_debt','') not in ('yes','no','unsure')
    or coalesce(p_answers->>'drop_10','') not in ('sell_all','reduce','hold','buy_more')
    or coalesce(p_answers->>'drop_20','') not in ('sell_all','reduce','hold','buy_more')
    or coalesce(p_answers->>'drop_30','') not in ('sell_all','reduce','hold','buy_more')
    or coalesce(p_answers->>'emotional_reaction','') not in ('very_anxious','concerned_wait','comfortable')
    or coalesce(p_answers->>'goal','') not in ('preserve','income','growth','mixed')
    or coalesce(p_answers->>'experience','') not in ('none','basic','intermediate','advanced') then
    raise exception 'Una o más opciones de respuesta no son válidas'
      using errcode = '22023';
  end if;

  v_capacity_complete :=
    p_answers->>'emergency_fund' <> 'prefer_not'
    and p_answers->>'high_cost_debt' <> 'unsure';

  if v_capacity_complete then
    v_capacity_score :=
      (case p_answers->>'horizon'
        when 'under_1y' then 0 when '1_3y' then 0 when '3_5y' then 1
        when '5_10y' then 2 else 2 end)
      + (case p_answers->>'withdrawal'
        when 'under_1y' then 0 when '1_3y' then 1 else 2 end)
      + (case p_answers->>'emergency_fund'
        when 'under_1m' then 0 when '1_3m' then 1 else 2 end)
      + (case p_answers->>'income_stability'
        when 'variable' then 0 when 'mixed' then 1 else 2 end)
      + (case p_answers->>'capital_dependency'
        when 'essential' then 0 when 'partial' then 1 else 2 end)
      + (case p_answers->>'high_cost_debt'
        when 'yes' then 0 else 2 end);
    v_capacity_band := case
      when v_capacity_score <= 4 then 'low'
      when v_capacity_score <= 8 then 'medium'
      else 'high' end;
  else
    v_capacity_score := null;
    v_capacity_band := null;
  end if;

  v_drop_10 := case p_answers->>'drop_10'
    when 'sell_all' then 0 when 'reduce' then 1 else 2 end;
  v_drop_20 := case p_answers->>'drop_20'
    when 'sell_all' then 0 when 'reduce' then 1 else 2 end;
  v_drop_30 := case p_answers->>'drop_30'
    when 'sell_all' then 0 when 'reduce' then 1 else 2 end;
  v_tolerance_score :=
    v_drop_10 + v_drop_20 + v_drop_30
    + (case p_answers->>'emotional_reaction'
        when 'very_anxious' then 0 when 'concerned_wait' then 1 else 2 end);
  v_tolerance_band := case
    when v_tolerance_score <= 2 then 'low'
    when v_tolerance_score <= 5 then 'medium'
    else 'high' end;

  v_inconsistent := v_drop_10 < v_drop_20 or v_drop_20 < v_drop_30;

  if not v_capacity_complete then
    v_profile_status := 'incomplete';
    v_result_reason := 'incomplete';
    v_overall_band := null;
  elsif v_inconsistent then
    v_profile_status := 'review_needed';
    v_result_reason := 'review_needed';
    v_overall_band := null;
  else
    v_profile_status := 'complete';
    if v_capacity_band = v_tolerance_band then
      v_result_reason := 'aligned';
      v_overall_band := v_capacity_band;
    elsif (case v_capacity_band when 'low' then 0 when 'medium' then 1 else 2 end)
        < (case v_tolerance_band when 'low' then 0 when 'medium' then 1 else 2 end) then
      v_result_reason := 'capacity_limited';
      v_overall_band := v_capacity_band;
    else
      v_result_reason := 'tolerance_limited';
      v_overall_band := v_tolerance_band;
    end if;
  end if;

  insert into public.investor_profile_snapshot (
    owner_user_id, questionnaire_version, scoring_version, answers,
    profile_status, capacity_score, capacity_band,
    tolerance_score, tolerance_band, overall_band, result_reason
  ) values (
    v_user, '1.0', '1.0', p_answers,
    v_profile_status, v_capacity_score, v_capacity_band,
    v_tolerance_score, v_tolerance_band, v_overall_band, v_result_reason
  ) returning id into v_id;

  return v_id;
end
$bf$;

-- Keep the SECURITY DEFINER implementation in the non-exposed private schema.
-- The public RPC below is SECURITY INVOKER and delegates to this owner-checked function.
revoke all on function private.save_investor_profile(jsonb)
  from public, anon, authenticated;
grant usage on schema private to authenticated;
grant execute on function private.save_investor_profile(jsonb)
  to authenticated;

create function public.save_investor_profile(p_answers jsonb)
returns uuid
language sql
security invoker
set search_path = ''
as $bf$
  select private.save_investor_profile(p_answers);
$bf$;

revoke all on function public.save_investor_profile(jsonb)
  from public, anon, authenticated;
grant execute on function public.save_investor_profile(jsonb)
  to authenticated;
