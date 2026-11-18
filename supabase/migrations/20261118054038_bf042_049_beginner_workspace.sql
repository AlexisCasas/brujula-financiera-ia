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
