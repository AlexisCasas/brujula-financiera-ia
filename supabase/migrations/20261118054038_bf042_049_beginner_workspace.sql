-- BF-042..049: beginner-first private workspace.
-- Applied to Supabase through MCP on 2026-11-18 as migration bf042_049_beginner_workspace.
-- The SQL below is the source-controlled schema contract.

create table public.investment_goal_snapshot (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
 goal_category text not null check(goal_category in('patrimonio','jubilacion','vivienda','educacion','ingresos','aprendizaje','otro')),
 title text not null check(char_length(btrim(title)) between 2 and 120), target_amount numeric(18,2) null check(target_amount is null or target_amount>=0),
 currency text not null check(currency in('PEN','USD')), horizon text not null check(horizon in('under_2y','2_5y','5_10y','over_10y')),
 initial_amount numeric(18,2) not null default 0 check(initial_amount>=0), recurring_amount numeric(18,2) not null default 0 check(recurring_amount>=0),
 recurring_frequency text not null check(recurring_frequency in('monthly','quarterly','annual')),
 financial_readiness text not null check(financial_readiness in('ready','emergency_fund','high_interest_debt','building_plan','prefer_not')),
 notes text null check(notes is null or char_length(notes)<=600), created_at timestamptz not null default now()
);
create index investment_goal_owner_created_idx on public.investment_goal_snapshot(owner_user_id,created_at desc);

create table public.simulation_scenario (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(char_length(btrim(title)) between 2 and 120), currency text not null check(currency in('PEN','USD')),
 initial_amount numeric(18,2) not null check(initial_amount>=0 and initial_amount<=100000000),
 recurring_amount numeric(18,2) not null check(recurring_amount>=0 and recurring_amount<=10000000),
 recurring_frequency text not null check(recurring_frequency in('monthly','quarterly','annual')), years smallint not null check(years between 1 and 50),
 rates jsonb not null check(jsonb_typeof(rates)='object'), result jsonb not null check(jsonb_typeof(result)='object'),
 formula_version text not null check(formula_version='1.0'), created_at timestamptz not null default now()
);
create index simulation_owner_created_idx on public.simulation_scenario(owner_user_id,created_at desc);

create table public.investment_decision (
 id uuid primary key default gen_random_uuid(), owner_user_id uuid not null references auth.users(id) on delete cascade,
 listing_id uuid null references public.listing(id) on delete restrict, goal_snapshot_id uuid null references public.investment_goal_snapshot(id) on delete restrict,
 simulation_id uuid null references public.simulation_scenario(id) on delete restrict,
 status text not null check(status in('observing','considering','discarded')),
 thesis text not null check(char_length(btrim(thesis)) between 10 and 1200),
 positives text null check(positives is null or char_length(positives)<=1200),
 risks text not null check(char_length(btrim(risks)) between 10 and 1600),
 alternative text null check(alternative is null or char_length(alternative)<=600), created_at timestamptz not null default now()
);
create index investment_decision_owner_created_idx on public.investment_decision(owner_user_id,created_at desc);
create index investment_decision_listing_created_idx on public.investment_decision(listing_id,created_at desc);
create index investment_decision_goal_created_idx on public.investment_decision(goal_snapshot_id,created_at desc);
create index investment_decision_simulation_created_idx on public.investment_decision(simulation_id,created_at desc);

create table public.historical_metric_snapshot (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references public.listing(id) on delete restrict,
 metric_key text not null check(metric_key in('annualized_return','volatility','max_drawdown','calendar_return')),
 period_years smallint null check(period_years is null or period_years between 1 and 50), value numeric(18,8) not null,
 unit text not null check(unit in('percent','decimal')), as_of_date date not null, source_date date not null,
 source_url text not null check(source_url ~ '^https?://'), methodology text not null check(char_length(btrim(methodology)) between 10 and 1000),
 coverage_status text not null default 'verified' check(coverage_status in('verified','partial','not_comparable')),
 note text null check(note is null or char_length(note)<=1200), created_at timestamptz not null default now(),
 unique(listing_id,metric_key,period_years,as_of_date,source_url)
);
create index historical_metric_listing_metric_idx on public.historical_metric_snapshot(listing_id,metric_key,as_of_date desc);

alter table public.investment_goal_snapshot enable row level security;
alter table public.simulation_scenario enable row level security;
alter table public.investment_decision enable row level security;
alter table public.historical_metric_snapshot enable row level security;
create policy investment_goal_owner_read on public.investment_goal_snapshot for select to authenticated using(owner_user_id=(select auth.uid()) and (select private.is_owner()));
create policy simulation_owner_read on public.simulation_scenario for select to authenticated using(owner_user_id=(select auth.uid()) and (select private.is_owner()));
create policy decision_owner_read on public.investment_decision for select to authenticated using(owner_user_id=(select auth.uid()) and (select private.is_owner()));
create policy historical_metrics_owner_read on public.historical_metric_snapshot for select to authenticated using((select private.is_owner()));
revoke all on public.investment_goal_snapshot,public.simulation_scenario,public.investment_decision,public.historical_metric_snapshot from public,anon,authenticated;
grant select on public.investment_goal_snapshot,public.simulation_scenario,public.investment_decision,public.historical_metric_snapshot to authenticated;

-- Mutation functions live in private schema; exposed wrappers are SECURITY INVOKER.
-- Detailed validation is enforced by the live functions; these declarations document their public contracts.

create function private.save_investment_goal(p_goal_category text,p_title text,p_target_amount numeric,p_currency text,p_horizon text,p_initial_amount numeric,p_recurring_amount numeric,p_recurring_frequency text,p_financial_readiness text,p_notes text) returns uuid language plpgsql security definer set search_path='' as $bf$
declare v_user uuid:=auth.uid();v_id uuid;
begin
 if v_user is null or not (select private.is_owner()) then raise exception 'No autorizado para guardar el objetivo' using errcode='42501'; end if;
 if p_goal_category not in('patrimonio','jubilacion','vivienda','educacion','ingresos','aprendizaje','otro') or p_currency not in('PEN','USD') or p_horizon not in('under_2y','2_5y','5_10y','over_10y') or p_recurring_frequency not in('monthly','quarterly','annual') or p_financial_readiness not in('ready','emergency_fund','high_interest_debt','building_plan','prefer_not') then raise exception 'Valores de objetivo no válidos' using errcode='22023'; end if;
 if p_title is null or char_length(btrim(p_title)) not between 2 and 120 or coalesce(p_target_amount,0)<0 or coalesce(p_initial_amount,0)<0 or coalesce(p_recurring_amount,0)<0 or coalesce(p_initial_amount,0)>100000000 or coalesce(p_recurring_amount,0)>10000000 or (p_notes is not null and char_length(p_notes)>600) then raise exception 'Montos o texto del objetivo fuera de rango' using errcode='22023'; end if;
 insert into public.investment_goal_snapshot(owner_user_id,goal_category,title,target_amount,currency,horizon,initial_amount,recurring_amount,recurring_frequency,financial_readiness,notes) values(v_user,btrim(p_goal_category),btrim(p_title),p_target_amount,p_currency,p_horizon,p_initial_amount,p_recurring_amount,p_recurring_frequency,p_financial_readiness,nullif(btrim(p_notes),'')) returning id into v_id; return v_id;
end $bf$;
revoke all on function private.save_investment_goal(text,text,numeric,text,text,numeric,numeric,text,text,text) from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.save_investment_goal(text,text,numeric,text,text,numeric,numeric,text,text,text) to authenticated;
create function public.save_investment_goal(p_goal_category text,p_title text,p_target_amount numeric,p_currency text,p_horizon text,p_initial_amount numeric,p_recurring_amount numeric,p_recurring_frequency text,p_financial_readiness text,p_notes text) returns uuid language sql security invoker set search_path='' as $bf$ select private.save_investment_goal(p_goal_category,p_title,p_target_amount,p_currency,p_horizon,p_initial_amount,p_recurring_amount,p_recurring_frequency,p_financial_readiness,p_notes); $bf$;
revoke all on function public.save_investment_goal(text,text,numeric,text,text,numeric,numeric,text,text,text) from public,anon,authenticated;
grant execute on function public.save_investment_goal(text,text,numeric,text,text,numeric,numeric,text,text,text) to authenticated;

create function private.save_simulation_scenario(p_title text,p_currency text,p_initial_amount numeric,p_recurring_amount numeric,p_recurring_frequency text,p_years smallint,p_rates jsonb,p_result jsonb) returns uuid language plpgsql security definer set search_path='' as $bf$
declare v_user uuid:=auth.uid();v_id uuid;
begin
 if v_user is null or not (select private.is_owner()) then raise exception 'No autorizado para guardar el escenario' using errcode='42501'; end if;
 if p_title is null or char_length(btrim(p_title)) not between 2 and 120 or p_currency not in('PEN','USD') or p_initial_amount<0 or p_initial_amount>100000000 or p_recurring_amount<0 or p_recurring_amount>10000000 or p_recurring_frequency not in('monthly','quarterly','annual') or p_years not between 1 and 50 or p_rates is null or jsonb_typeof(p_rates)<>'object' or p_result is null or jsonb_typeof(p_result)<>'object' or not(p_rates ?& array['conservative','base','optimistic']) then raise exception 'Parámetros de simulación fuera de rango' using errcode='22023'; end if;
 insert into public.simulation_scenario(owner_user_id,title,currency,initial_amount,recurring_amount,recurring_frequency,years,rates,result,formula_version) values(v_user,btrim(p_title),p_currency,p_initial_amount,p_recurring_amount,p_recurring_frequency,p_years,p_rates,p_result,'1.0') returning id into v_id; return v_id;
end $bf$;
revoke all on function private.save_simulation_scenario(text,text,numeric,numeric,text,smallint,jsonb,jsonb) from public,anon,authenticated;
grant execute on function private.save_simulation_scenario(text,text,numeric,numeric,text,smallint,jsonb,jsonb) to authenticated;
create function public.save_simulation_scenario(p_title text,p_currency text,p_initial_amount numeric,p_recurring_amount numeric,p_recurring_frequency text,p_years smallint,p_rates jsonb,p_result jsonb) returns uuid language sql security invoker set search_path='' as $bf$ select private.save_simulation_scenario(p_title,p_currency,p_initial_amount,p_recurring_amount,p_recurring_frequency,p_years,p_rates,p_result); $bf$;
revoke all on function public.save_simulation_scenario(text,text,numeric,numeric,text,smallint,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.save_simulation_scenario(text,text,numeric,numeric,text,smallint,jsonb,jsonb) to authenticated;

create function private.save_investment_decision(p_listing_id uuid,p_goal_snapshot_id uuid,p_simulation_id uuid,p_status text,p_thesis text,p_positives text,p_risks text,p_alternative text) returns uuid language plpgsql security definer set search_path='' as $bf$
declare v_user uuid:=auth.uid();v_id uuid;
begin
 if v_user is null or not(select private.is_owner()) then raise exception 'No autorizado para guardar la decisión' using errcode='42501'; end if;
 if p_status not in('observing','considering','discarded') or p_thesis is null or char_length(btrim(p_thesis)) not between 10 and 1200 or p_risks is null or char_length(btrim(p_risks)) not between 10 and 1600 then raise exception 'Decisión incompleta o inválida' using errcode='22023'; end if;
 if p_listing_id is not null and not exists(select 1 from public.listing l where l.id=p_listing_id) then raise exception 'Listing no registrado' using errcode='22023'; end if;
 if p_goal_snapshot_id is not null and not exists(select 1 from public.investment_goal_snapshot g where g.id=p_goal_snapshot_id and g.owner_user_id=v_user) then raise exception 'Objetivo no pertenece al usuario' using errcode='42501'; end if;
 if p_simulation_id is not null and not exists(select 1 from public.simulation_scenario s where s.id=p_simulation_id and s.owner_user_id=v_user) then raise exception 'Simulación no pertenece al usuario' using errcode='42501'; end if;
 insert into public.investment_decision(owner_user_id,listing_id,goal_snapshot_id,simulation_id,status,thesis,positives,risks,alternative) values(v_user,p_listing_id,p_goal_snapshot_id,p_simulation_id,p_status,btrim(p_thesis),nullif(btrim(p_positives),''),btrim(p_risks),nullif(btrim(p_alternative),'')) returning id into v_id; return v_id;
end $bf$;
revoke all on function private.save_investment_decision(uuid,uuid,uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function private.save_investment_decision(uuid,uuid,uuid,text,text,text,text,text) to authenticated;
create function public.save_investment_decision(p_listing_id uuid,p_goal_snapshot_id uuid,p_simulation_id uuid,p_status text,p_thesis text,p_positives text,p_risks text,p_alternative text) returns uuid language sql security invoker set search_path='' as $bf$ select private.save_investment_decision(p_listing_id,p_goal_snapshot_id,p_simulation_id,p_status,p_thesis,p_positives,p_risks,p_alternative); $bf$;
revoke all on function public.save_investment_decision(uuid,uuid,uuid,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.save_investment_decision(uuid,uuid,uuid,text,text,text,text,text) to authenticated;
