-- BF-042..BF-049: private beginner-investor journey.
-- This migration is intentionally additive and contains no seed financial prices.
create table public.investor_goal (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  objective text not null check (objective in ('wealth','retirement','home','education','income','learning','other')),
  objective_detail text null check (char_length(objective_detail) <= 500),
  horizon_years numeric(5,1) not null check (horizon_years > 0 and horizon_years <= 100),
  initial_amount numeric(18,2) null check (initial_amount is null or initial_amount >= 0),
  periodic_amount numeric(18,2) null check (periodic_amount is null or periodic_amount >= 0),
  periodicity text not null default 'monthly' check (periodicity in ('monthly','quarterly','annual','none')),
  currency text not null check (currency in ('PEN','USD')),
  priority smallint not null default 1 check (priority between 1 and 3),
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index investor_goal_owner_status_idx on public.investor_goal(owner_user_id,status,updated_at desc);

create table public.investor_decision (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  listing_id uuid null references public.listing(id) on delete restrict,
  goal_id uuid null references public.investor_goal(id) on delete set null,
  title text not null check (char_length(title) between 1 and 120),
  thesis text null check (char_length(thesis) <= 2000),
  risks text null check (char_length(risks) <= 2000),
  alternatives text null check (char_length(alternatives) <= 2000),
  doubts text null check (char_length(doubts) <= 2000),
  amount numeric(18,2) null check (amount is null or amount >= 0),
  currency text null check (currency in ('PEN','USD')),
  horizon_years numeric(5,1) null check (horizon_years is null or horizon_years > 0),
  decision_status text not null default 'considering' check (decision_status in ('considering','approved','discarded','review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index investor_decision_owner_recent_idx on public.investor_decision(owner_user_id,created_at desc);

create table public.learning_progress (
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  lesson_key text not null,
  completed_at timestamptz not null default now(),
  primary key (owner_user_id, lesson_key)
);

create table public.instrument_price_observation (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listing(id) on delete restrict,
  observed_on date not null,
  currency text not null check (currency in ('PEN','USD')),
  close numeric(18,6) not null check (close > 0),
  source_id uuid null,
  source_date date null,
  created_at timestamptz not null default now(),
  unique (listing_id, observed_on, currency)
);
create index instrument_price_observation_listing_date_idx
  on public.instrument_price_observation(listing_id,observed_on desc);

alter table public.investor_goal enable row level security;
alter table public.investor_decision enable row level security;
alter table public.learning_progress enable row level security;
alter table public.instrument_price_observation enable row level security;

create policy investor_goal_owner_read on public.investor_goal
  for select to authenticated using (owner_user_id = (select auth.uid()) and (select private.is_owner()));
create policy investor_decision_owner_read on public.investor_decision
  for select to authenticated using (owner_user_id = (select auth.uid()) and (select private.is_owner()));
create policy learning_progress_owner_read on public.learning_progress
  for select to authenticated using (owner_user_id = (select auth.uid()) and (select private.is_owner()));
create policy price_observation_authenticated_read on public.instrument_price_observation
  for select to authenticated using ((select private.is_owner()));

revoke all on public.investor_goal, public.investor_decision, public.learning_progress, public.instrument_price_observation
  from public, anon, authenticated;
grant select on public.investor_goal, public.investor_decision, public.learning_progress to authenticated;
grant select on public.instrument_price_observation to authenticated;

create function private.save_investor_goal(
  p_objective text,p_objective_detail text,p_horizon_years numeric,
  p_initial_amount numeric,p_periodic_amount numeric,p_periodicity text,
  p_currency text,p_priority smallint
) returns uuid language plpgsql security definer set search_path='' as $bf$
declare v_user uuid := auth.uid(); v_id uuid;
begin
  if v_user is null or not (select private.is_owner()) then raise exception 'No autorizado' using errcode='42501'; end if;
  if p_horizon_years is null or p_horizon_years <= 0 or p_horizon_years > 100 then raise exception 'Horizonte inválido' using errcode='22023'; end if;
  if p_objective not in ('wealth','retirement','home','education','income','learning','other')
    or p_currency not in ('PEN','USD')
    or p_periodicity not in ('monthly','quarterly','annual','none') then
    raise exception 'Objetivo o moneda inválidos' using errcode='22023';
  end if;
  insert into public.investor_goal(owner_user_id,objective,objective_detail,horizon_years,initial_amount,periodic_amount,periodicity,currency,priority)
  values(v_user,p_objective,nullif(trim(p_objective_detail),''),p_horizon_years,p_initial_amount,p_periodic_amount,p_periodicity,p_currency,coalesce(p_priority,1))
  returning id into v_id;
  return v_id;
end $bf$;

create function public.save_investor_goal(
  p_objective text,p_objective_detail text,p_horizon_years numeric,
  p_initial_amount numeric,p_periodic_amount numeric,p_periodicity text,
  p_currency text,p_priority smallint
) returns uuid language sql security invoker set search_path='' as $bf$
  select private.save_investor_goal(p_objective,p_objective_detail,p_horizon_years,p_initial_amount,p_periodic_amount,p_periodicity,p_currency,p_priority);
$bf$;

create function private.save_investor_decision(
  p_listing_id uuid,p_goal_id uuid,p_title text,p_thesis text,p_risks text,
  p_alternatives text,p_doubts text,p_amount numeric,p_currency text,
  p_horizon_years numeric,p_decision_status text
) returns uuid language plpgsql security definer set search_path='' as $bf$
declare v_user uuid := auth.uid(); v_id uuid;
begin
  if v_user is null or not (select private.is_owner()) then raise exception 'No autorizado' using errcode='42501'; end if;
  if char_length(trim(coalesce(p_title,''))) not between 1 and 120 then raise exception 'Título inválido' using errcode='22023'; end if;
  if p_currency is not null and p_currency not in ('PEN','USD') then raise exception 'Moneda inválida' using errcode='22023'; end if;
  if p_decision_status not in ('considering','approved','discarded','review') then raise exception 'Estado inválido' using errcode='22023'; end if;
  insert into public.investor_decision(owner_user_id,listing_id,goal_id,title,thesis,risks,alternatives,doubts,amount,currency,horizon_years,decision_status)
  values(v_user,p_listing_id,p_goal_id,trim(p_title),nullif(trim(p_thesis),''),nullif(trim(p_risks),''),nullif(trim(p_alternatives),''),nullif(trim(p_doubts),''),p_amount,p_currency,p_horizon_years,p_decision_status)
  returning id into v_id;
  return v_id;
end $bf$;

create function public.save_investor_decision(
  p_listing_id uuid,p_goal_id uuid,p_title text,p_thesis text,p_risks text,
  p_alternatives text,p_doubts text,p_amount numeric,p_currency text,
  p_horizon_years numeric,p_decision_status text
) returns uuid language sql security invoker set search_path='' as $bf$
  select private.save_investor_decision(p_listing_id,p_goal_id,p_title,p_thesis,p_risks,p_alternatives,p_doubts,p_amount,p_currency,p_horizon_years,p_decision_status);
$bf$;

create function private.complete_learning(p_lesson_key text)
returns boolean language plpgsql security definer set search_path='' as $bf$
begin
  if auth.uid() is null or not (select private.is_owner()) then raise exception 'No autorizado' using errcode='42501'; end if;
  if p_lesson_key is null or p_lesson_key !~ '^[a-z0-9_-]{2,80}$' then raise exception 'Lección inválida' using errcode='22023'; end if;
  insert into public.learning_progress(owner_user_id,lesson_key) values(auth.uid(),p_lesson_key) on conflict do nothing;
  return true;
end $bf$;

create function public.complete_learning(p_lesson_key text)
returns boolean language sql security invoker set search_path='' as $bf$
  select private.complete_learning(p_lesson_key);
$bf$;

revoke all on function private.save_investor_goal(text,text,numeric,numeric,numeric,text,text,smallint) from public,anon,authenticated;
revoke all on function private.save_investor_decision(uuid,uuid,text,text,text,text,text,numeric,text,numeric,text) from public,anon,authenticated;
revoke all on function private.complete_learning(text) from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.save_investor_goal(text,text,numeric,numeric,numeric,text,text,smallint) to authenticated;
grant execute on function private.save_investor_decision(uuid,uuid,text,text,text,text,text,numeric,text,numeric,text) to authenticated;
grant execute on function private.complete_learning(text) to authenticated;
grant execute on function public.save_investor_goal(text,text,numeric,numeric,numeric,text,text,smallint) to authenticated;
grant execute on function public.save_investor_decision(uuid,uuid,text,text,text,text,text,numeric,text,numeric,text) to authenticated;
grant execute on function public.complete_learning(text) to authenticated;

-- Historical observations are reference data. No inserts are made here.
