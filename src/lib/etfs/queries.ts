import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  type EtfProfile, type Evidence, type Measurement, type MetricKey,
  METRIC_KEYS, isMetricKey,
} from "./catalog";

type CatalogRow = {
  listing_id: string; instrument_id: string; ticker: string; exchange: string;
  currency: string; isin: string; name: string; index_name: string | null;
  distribution_policy: string | null; fields_unverified: number | null;
};
type InstrumentRow = {
  id: string; issuer: string | null; domicile: string | null;
  inception_date: string | null;
};
type EvidenceRow = {
  entity_type: "instrument" | "listing"; entity_id: string;
  field: string; display_status: string; source_url: string | null;
  source_date: string | null; note: string | null;
};
type SnapshotRow = {
  instrument_id: string; metric: string; value: number | string | null;
  currency: string | null; as_of_date: string | null;
  source_date: string | null; source_url: string | null;
  version: number | null; availability: string; note: string | null;
};

export type CatalogResult =
  | { status: "ready"; asOf: string; profiles: EtfProfile[] }
  | { status: "empty"; asOf: string; profiles: [] }
  | { status: "error"; asOf: string; profiles: []; message: string };

export function currentUtcDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Request-scoped, authenticated and RLS-enforced. No service keys or caching. */
export async function getEtfCatalog(): Promise<CatalogResult> {
  const asOf = currentUtcDate();
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) redirect("/login");

  const [catalogResult, instrumentsResult, evidenceResult, snapshotsResult] = await Promise.all([
    client.from("catalog_overview")
      .select("listing_id,instrument_id,ticker,exchange,currency,isin,name,index_name,distribution_policy,fields_unverified")
      .order("ticker"),
    client.from("instrument").select("id,issuer,domicile,inception_date"),
    client.from("field_status")
      .select("entity_type,entity_id,field,display_status,source_url,source_date,note"),
    client.rpc("snapshot_as_of", { p_date: asOf }),
  ]);

  if (catalogResult.error || instrumentsResult.error || evidenceResult.error || snapshotsResult.error) {
    return {
      status: "error", asOf, profiles: [],
      message: "No se pudo obtener el catálogo con sus fuentes. Comprueba la conexión y vuelve a intentar.",
    };
  }

  const rows = (catalogResult.data ?? []) as CatalogRow[];
  if (rows.length === 0) return { status: "empty", asOf, profiles: [] };
  const instruments = (instrumentsResult.data ?? []) as InstrumentRow[];
  const evidenceRows = (evidenceResult.data ?? []) as EvidenceRow[];
  const snapshots = (snapshotsResult.data ?? []) as SnapshotRow[];
  const byInstrument = new Map(instruments.map((row) => [row.id, row]));
  const evidenceMap = new Map<string, Evidence[]>();
  const measurements = new Map<string, Partial<Record<MetricKey, Measurement>>>();

  for (const row of evidenceRows) {
    if (row.entity_type !== "instrument" && row.entity_type !== "listing") continue;
    const key = row.entity_type + ":" + row.entity_id;
    const item: Evidence = {
      field: row.field, entityType: row.entity_type, status: row.display_status,
      sourceUrl: row.source_url, sourceDate: row.source_date, note: row.note,
    };
    evidenceMap.set(key, [...(evidenceMap.get(key) ?? []), item]);
  }
  for (const row of snapshots) {
    if (!isMetricKey(row.metric)) continue;
    const metric: Measurement = {
      metric: row.metric,
      value: row.value === null ? null : String(row.value),
      currency: row.currency, asOfDate: row.as_of_date,
      sourceDate: row.source_date, sourceUrl: row.source_url,
      version: row.version, availability: row.availability, note: row.note,
    };
    const map = measurements.get(row.instrument_id) ?? {};
    map[row.metric] = metric;
    measurements.set(row.instrument_id, map);
  }

  const profiles: EtfProfile[] = rows.map((row) => {
    const instrument = byInstrument.get(row.instrument_id);
    const metricValues = measurements.get(row.instrument_id) ?? {};
    return {
      listingId: row.listing_id, instrumentId: row.instrument_id, ticker: row.ticker,
      exchange: row.exchange, currency: row.currency, isin: row.isin, name: row.name,
      issuer: instrument?.issuer ?? null, indexName: row.index_name,
      domicile: instrument?.domicile ?? null, distributionPolicy: row.distribution_policy,
      inceptionDate: instrument?.inception_date ?? null,
      unverifiedCount: row.fields_unverified ?? null,
      evidence: [
        ...(evidenceMap.get("instrument:" + row.instrument_id) ?? []),
        ...(evidenceMap.get("listing:" + row.listing_id) ?? []),
      ],
      metrics: Object.fromEntries(
        METRIC_KEYS.map((key) => [key, metricValues[key] ?? null]),
      ) as Record<MetricKey, Measurement | null>,
    };
  });
  return { status: "ready", asOf, profiles };
}
