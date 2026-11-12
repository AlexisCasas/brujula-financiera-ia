-- Covering indexes for foreign keys flagged by the Supabase performance advisor
-- (two from BF-011's field_evidence, two from BF-012's instrument_measurement).
create index if not exists field_evidence_source_record_idx on public.field_evidence (source_record_id);
create index if not exists field_evidence_supersedes_idx on public.field_evidence (supersedes_id);
create index if not exists instrument_measurement_source_record_idx on public.instrument_measurement (source_record_id);
create index if not exists instrument_measurement_supersedes_idx on public.instrument_measurement (supersedes_id);
