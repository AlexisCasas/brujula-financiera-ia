export type MetricKey = "ter_percent" | "net_assets" | "fund_net_assets";

export type Measurement = {
  metric: MetricKey;
  value: string | null;
  currency: string | null;
  asOfDate: string | null;
  sourceDate: string | null;
  sourceUrl: string | null;
  version: number | null;
  availability: string;
  note: string | null;
};

export type Evidence = {
  field: string;
  entityType: "instrument" | "listing";
  status: string;
  sourceUrl: string | null;
  sourceDate: string | null;
  note: string | null;
};

export type EtfProfile = {
  listingId: string;
  instrumentId: string;
  ticker: string;
  exchange: string;
  currency: string;
  isin: string;
  name: string;
  issuer: string | null;
  indexName: string | null;
  domicile: string | null;
  distributionPolicy: string | null;
  inceptionDate: string | null;
  unverifiedCount: number | null;
  evidence: Evidence[];
  metrics: Record<MetricKey, Measurement | null>;
};

export const METRIC_KEYS: readonly MetricKey[] = [
  "ter_percent", "net_assets", "fund_net_assets",
];

export const NOT_AVAILABLE = "No disponible";

export function isMetricKey(value: string): value is MetricKey {
  return METRIC_KEYS.some((metric) => metric === value);
}

export function validSourceUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export function normalizedSearch(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function filterProfiles(profiles: readonly EtfProfile[], query: string): EtfProfile[] {
  const text = normalizedSearch(query);
  if (!text) return [...profiles];
  return profiles.filter((profile) =>
    [profile.ticker, profile.name, profile.issuer, profile.isin, profile.indexName]
      .some((value) => normalizedSearch(value ?? "").includes(text)),
  );
}

// de-DE uses Spanish-style comma decimals and groups even four-digit thousands.
export function formatPercent(raw: string | null | undefined): string {
  if (raw === null || raw === undefined || raw.trim() === "") return NOT_AVAILABLE;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return NOT_AVAILABLE;
  return new Intl.NumberFormat("de-DE", {
    minimumFractionDigits: 2, maximumFractionDigits: 3,
  }).format(value) + " %";
}

export function formatAssets(raw: string | null | undefined, currency: string | null): string {
  if (raw === null || raw === undefined || raw.trim() === "" || !currency) return NOT_AVAILABLE;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0 || !/^[A-Z]{3}$/.test(currency)) return NOT_AVAILABLE;
  const number = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 2 });
  if (value < 1_000_000) return currency + " " + number.format(value);
  return currency + " " + number.format(value / 1_000_000) + " millones";
}

export function formatDate(raw: string | null | undefined): string {
  if (!raw || !/^\d{4}-\d{2}-\d{2}$/.test(raw)) return NOT_AVAILABLE;
  const [year, month, day] = raw.split("-");
  return `${day}/${month}/${year}`;
}

export function distributionLabel(policy: string | null): string {
  switch (policy) {
    case "accumulating": return "Acumulación";
    case "distributing": return "Distribución";
    default: return NOT_AVAILABLE;
  }
}

export function metricText(value: Measurement | null): string {
  if (!value || value.availability !== "disponible") return NOT_AVAILABLE;
  if (value.metric === "ter_percent") return formatPercent(value.value);
  return formatAssets(value.value, value.currency);
}
