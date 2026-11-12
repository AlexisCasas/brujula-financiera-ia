import type { EtfProfile } from "./catalog";

export const MAX_COMPARISON_ETFS = 5;
export const MIN_COMPARISON_ETFS = 2;

export type ComparisonSelection =
  | { kind: "empty"; items: EtfProfile[] }
  | { kind: "too_few"; items: EtfProfile[] }
  | { kind: "too_many"; items: EtfProfile[] }
  | { kind: "not_found"; items: EtfProfile[]; missingCount: number }
  | { kind: "ready"; items: EtfProfile[] };

export function parseListingSelection(
  raw: string | string[] | undefined,
): string[] {
  const values = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  // URLs are untrusted input. Never let arbitrary parameters become SQL filters.
  return Array.from(new Set(values.filter((value) =>
    typeof value === "string" &&
    value.length <= 80 &&
    /^[a-zA-Z0-9_-]+$/.test(value),
  )));
}

export function selectEtfsForComparison(
  profiles: readonly EtfProfile[],
  ids: readonly string[],
): ComparisonSelection {
  if (ids.length === 0) return { kind: "empty", items: [] };
  if (ids.length > MAX_COMPARISON_ETFS) return { kind: "too_many", items: [] };
  const catalog = new Map(profiles.map((p) => [p.listingId, p]));
  const items = ids.map((id) => catalog.get(id));
  const missingCount = items.filter((p) => !p).length;
  if (missingCount > 0) {
    return { kind: "not_found", items: items.filter((p): p is EtfProfile => Boolean(p)), missingCount };
  }
  const found = items.filter((p): p is EtfProfile => Boolean(p));
  if (found.length < MIN_COMPARISON_ETFS) return { kind: "too_few", items: found };
  return { kind: "ready", items: found };
}

export function hasUnavailableMeasurements(profiles: readonly EtfProfile[]): boolean {
  return profiles.some((p) =>
    p.metrics.ter_percent?.availability !== "disponible" ||
    p.metrics.net_assets?.availability !== "disponible" ||
    p.metrics.fund_net_assets?.availability !== "disponible",
  );
}
