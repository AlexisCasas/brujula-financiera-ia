import {
  type Measurement, type MetricKey, isMetricKey,
} from "./catalog";

export type SavedMetric = {
  availability: string;
  measurement_id: string | null;
  source_record_id: string | null;
  value: string | null;
  currency: string | null;
  as_of_date: string | null;
  version: number | null;
  source_url: string | null;
  source_date: string | null;
  captured_at: string | null;
  note: string | null;
};

export type SavedFieldSource = {
  entity_type: string;
  field: string;
  display_status: string;
  source_url: string | null;
  source_date: string | null;
  effective_date: string | null;
  note: string | null;
};

export type SavedItem = {
  listing_id: string;
  instrument_id: string;
  isin: string;
  ticker: string;
  exchange: string;
  currency: string;
  listing_status: string;
  name: string;
  issuer: string | null;
  index_name: string | null;
  domicile: string | null;
  distribution_policy: string | null;
  inception_date: string | null;
  attributes_captured_at: string;
  metrics: Partial<Record<MetricKey, SavedMetric>>;
  field_sources: SavedFieldSource[];
};

export type SavedComparison = {
  id: string;
  title: string;
  as_of_date: string;
  saved_at: string;
  listing_ids: string[];
  items_snapshot: SavedItem[];
  schema_version: number;
};

export type SavedComparisonSummary = Pick<
  SavedComparison, "id" | "title" | "as_of_date" | "saved_at" | "listing_ids"
>;

export function savedMetricAsDisplay(
  key: MetricKey, raw: SavedMetric | null | undefined,
): Measurement | null {
  if (!raw) return null;
  return {
    metric: key,
    availability: raw.availability,
    value: raw.value,
    currency: raw.currency,
    asOfDate: raw.as_of_date,
    sourceDate: raw.source_date,
    sourceUrl: raw.source_url,
    version: raw.version,
    note: raw.note,
  };
}

export function validSavedItems(value: unknown): value is SavedItem[] {
  if (!Array.isArray(value) || value.length < 2 || value.length > 5) return false;
  return value.every((item) => (
    typeof item === "object" && item !== null &&
    typeof item.listing_id === "string" &&
    typeof item.ticker === "string" &&
    typeof item.isin === "string" &&
    typeof item.exchange === "string" &&
    typeof item.currency === "string" &&
    typeof item.metrics === "object" && item.metrics !== null &&
    Array.isArray(item.field_sources) &&
    Object.keys(item.metrics).every(isMetricKey)
  ));
}

export function formatSavedTimestamp(value: string): string {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "medium", timeStyle: "short", timeZone: "America/Lima",
  }).format(new Date(time));
}
