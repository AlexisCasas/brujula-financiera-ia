-- BF-042..049 schema contract tests. Execute inside an owner-authenticated QA transaction.
begin;
set local statement_timeout='5s';
select to_regclass('public.investment_goal_snapshot') is not null as goal_table,
       to_regclass('public.simulation_scenario') is not null as simulation_table,
       to_regclass('public.investment_decision') is not null as decision_table,
       to_regclass('public.historical_metric_snapshot') is not null as historical_table;
select relrowsecurity from pg_class where oid='public.investment_goal_snapshot'::regclass;
select relrowsecurity from pg_class where oid='public.simulation_scenario'::regclass;
select relrowsecurity from pg_class where oid='public.investment_decision'::regclass;
select relrowsecurity from pg_class where oid='public.historical_metric_snapshot'::regclass;
select has_table_privilege('authenticated','public.investment_goal_snapshot','INSERT') as direct_goal_insert,
       has_table_privilege('authenticated','public.simulation_scenario','INSERT') as direct_simulation_insert,
       has_table_privilege('authenticated','public.investment_decision','INSERT') as direct_decision_insert,
       has_table_privilege('authenticated','public.historical_metric_snapshot','INSERT') as direct_historical_insert;
rollback;