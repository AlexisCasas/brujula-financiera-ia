-- BF-049 follow-up: indexes for decision foreign-key lookups.
create index investment_decision_goal_created_idx
  on public.investment_decision(goal_snapshot_id, created_at desc);
create index investment_decision_simulation_created_idx
  on public.investment_decision(simulation_id, created_at desc);
