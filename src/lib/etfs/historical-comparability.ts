import { validSourceUrl, type EtfProfile } from "./catalog";

/**
 * BF-024b: pure gate for mutually comparable daily ETF observations.
 * This module does not fetch or invent prices. BF-013 will supply licensed
 * observations after validating identities, corporate actions and gaps.
 */
export const RETURN_WINDOWS = [
  { key: "1M", label: "1 mes", months: 1, minCommonDays: 12 },
  { key: "3M", label: "3 meses", months: 3, minCommonDays: 40 },
  { key: "6M", label: "6 meses", months: 6, minCommonDays: 80 },
  { key: "12M", label: "12 meses", months: 12, minCommonDays: 160 },
  { key: "24M", label: "24 meses", months: 24, minCommonDays: 320 },
] as const;

export type ReturnWindow = (typeof RETURN_WINDOWS)[number]["key"];
export type PriceBasis = "close" | "adjusted_close" | "nav" | "total_return_index";

export type PriceObservation = {
  date: string; // YYYY-MM-DD calendar date, not a JS timestamp
  value: number; // strictly positive
};

export type VerifiedDailySeries = {
  listingId: string;
  ticker: string;
  currency: string;
  basis: PriceBasis;
  sourceUrl: string;
  sourceName: string;
  capturedAt: string; // ISO provenance, retained with an eventual calculation
  methodologyVerified: boolean;
  licenseApproved: boolean;
  observations: readonly PriceObservation[];
};

export type ReturnRow = {
  listingId: string;
  ticker: string;
  currency: string;
  sourceUrl: string;
  sourceName: string;
  basis: PriceBasis;
  startValue: number;
  endValue: number;
  returnPercent: number;
};

export type ReturnGateReason =
  | "ready"
  | "missing_series"
  | "invalid_observations"
  | "unverified_source"
  | "incompatible_currency"
  | "incompatible_price_basis"
  | "nonoverlapping_dates"
  | "insufficient_coverage"
  | "suspicious_change";

export type ReturnAssessment = {
  reason: ReturnGateReason;
  window: ReturnWindow;
  requestedStart: string | null;
  requestedEnd: string;
  observedStart: string | null;
  observedEnd: string | null;
  sharedSessions: number;
  requiredSessions: number;
  method: string | null;
  results: ReturnRow[]; // deliberately empty on every failed gate
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_ANCHOR_LAG_DAYS = 5;

function parseDate(date: string): Date | null {
  if (!ISO_DATE.test(date)) return null;
  const parsed = new Date(date + "T00:00:00.000Z");
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date
    ? parsed : null;
}
function isoDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}
function daysApart(previous: string, current: string): number {
  const a = parseDate(previous);
  const b = parseDate(current);
  if (!a || !b) return Number.POSITIVE_INFINITY;
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

export function windowStartDate(endDate: string, key: ReturnWindow): string | null {
  const end = parseDate(endDate);
  const term = RETURN_WINDOWS.find((w) => w.key === key);
  if (!end || !term) return null;
  const year = end.getUTCFullYear();
  const month = end.getUTCMonth();
  const day = end.getUTCDate();
  const first = new Date(Date.UTC(year, month - term.months, 1));
  const last = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0));
  first.setUTCDate(Math.min(day, last.getUTCDate()));
  return isoDate(first);
}

function failure(
  window: ReturnWindow, end: string, start: string | null,
  reason: ReturnGateReason, sessions = 0,
  observedStart: string | null = null, observedEnd: string | null = null,
): ReturnAssessment {
  return {
    reason, window, requestedStart: start, requestedEnd: end,
    observedStart, observedEnd, sharedSessions: sessions,
    requiredSessions: RETURN_WINDOWS.find((w) => w.key === window)?.minCommonDays ?? 0,
    method: null, results: [],
  };
}

export function assessComparableReturns(
  ids: readonly string[],
  supplied: readonly VerifiedDailySeries[],
  requestedEnd: string,
  window: ReturnWindow,
): ReturnAssessment {
  const requestedStart = windowStartDate(requestedEnd, window);
  if (!requestedStart || ids.length < 2 || ids.length > 5 ||
      new Set(ids).size !== ids.length) {
    return failure(window, requestedEnd, requestedStart, "invalid_observations");
  }

  const byId = new Map(supplied.map((s) => [s.listingId, s]));
  const series = ids.map((id) => byId.get(id));
  if (series.some((s) => !s)) {
    return failure(window, requestedEnd, requestedStart, "missing_series");
  }
  const loaded = series.filter((s): s is VerifiedDailySeries => Boolean(s));
  if (loaded.some((s) =>
    !s.licenseApproved || !s.methodologyVerified ||
    !validSourceUrl(s.sourceUrl) || !s.sourceName.trim() ||
    Number.isNaN(Date.parse(s.capturedAt)) ||
    !s.currency.match(/^[A-Z]{3}$/))) {
    return failure(window, requestedEnd, requestedStart, "unverified_source");
  }
  if (new Set(loaded.map((s) => s.currency)).size !== 1) {
    return failure(window, requestedEnd, requestedStart, "incompatible_currency");
  }
  if (new Set(loaded.map((s) => s.basis)).size !== 1) {
    return failure(window, requestedEnd, requestedStart, "incompatible_price_basis");
  }

  const observations = loaded.map((s) => {
    const map = new Map<string, number>();
    for (const point of s.observations) {
      if (!parseDate(point.date) || !Number.isFinite(point.value) ||
          point.value <= 0 || map.has(point.date)) {
        return null;
      }
      map.set(point.date, point.value);
    }
    return map;
  });
  if (observations.some((m) => !m)) {
    return failure(window, requestedEnd, requestedStart, "invalid_observations");
  }
  const maps = observations.filter((m): m is Map<string, number> => m !== null);
  const common = [...maps[0].keys()]
    .filter((date) => maps.every((m) => m.has(date)))
    .sort();

  // No interpolation: use a shared actual trading date at most 5 calendar
  // days on or before each requested anchor, or block the comparison.
  const starts = common.filter((d) =>
    d <= requestedStart && daysApart(d, requestedStart) <= MAX_ANCHOR_LAG_DAYS);
  const ends = common.filter((d) =>
    d <= requestedEnd && daysApart(d, requestedEnd) <= MAX_ANCHOR_LAG_DAYS);
  const observedStart = starts.at(-1) ?? null;
  const observedEnd = ends.at(-1) ?? null;
  if (!observedStart || !observedEnd || observedStart >= observedEnd) {
    return failure(window, requestedEnd, requestedStart, "nonoverlapping_dates");
  }
  const shared = common.filter((d) => d >= observedStart && d <= observedEnd);
  const required = RETURN_WINDOWS.find((w) => w.key === window)!.minCommonDays;
  if (shared.length < required) {
    return failure(window, requestedEnd, requestedStart,
      "insufficient_coverage", shared.length, observedStart, observedEnd);
  }

  // An unexplained >60% close-to-close shift over adjacent sessions may be
  // a split/corporate-action anomaly. BF-013 must review such observations.
  for (const map of maps) {
    const dates = [...map.keys()].sort().filter((d) => d >= observedStart && d <= observedEnd);
    for (let i = 1; i < dates.length; i++) {
      const gapDays = daysApart(dates[i - 1], dates[i]);
      if (gapDays <= 7 && Math.abs(map.get(dates[i])! / map.get(dates[i - 1])! - 1) > 0.6) {
        return failure(window, requestedEnd, requestedStart,
          "suspicious_change", shared.length, observedStart, observedEnd);
      }
    }
  }
  const method = loaded[0].basis === "total_return_index"
    ? "Variación del índice de retorno total, según metodología verificada"
    : loaded[0].basis === "adjusted_close"
      ? "Variación del precio ajustado; no equivale necesariamente a retorno total"
      : loaded[0].basis === "nav"
        ? "Variación de NAV; distribuciones no necesariamente incluidas"
        : "Variación de precio sin ajustar; dividendos excluidos";

  return {
    reason: "ready", window, requestedStart, requestedEnd,
    observedStart, observedEnd, sharedSessions: shared.length,
    requiredSessions: required, method,
    results: loaded.map((s, index) => ({
      listingId: s.listingId, ticker: s.ticker, currency: s.currency,
      sourceUrl: s.sourceUrl, sourceName: s.sourceName, basis: s.basis,
      startValue: maps[index].get(observedStart)!,
      endValue: maps[index].get(observedEnd)!,
      returnPercent: ((maps[index].get(observedEnd)! / maps[index].get(observedStart)!) - 1) * 100,
    })),
  };
}

export type BenchmarkMatch = {
  indexName: string;
  tickers: string[];
  isExact: true;
};

/** Equality of the declared index name only; never assert holding overlap. */
export function exactBenchmarkMatches(
  profiles: readonly Pick<EtfProfile, "ticker" | "indexName">[],
): BenchmarkMatch[] {
  const map = new Map<string, { name: string; tickers: string[] }>();
  for (const profile of profiles) {
    const name = profile.indexName?.trim();
    if (!name) continue;
    const normalized = name.replace(/\s+/g, " ").toLocaleLowerCase("en-US");
    const value = map.get(normalized) ?? { name, tickers: [] };
    value.tickers.push(profile.ticker);
    map.set(normalized, value);
  }
  return [...map.values()]
    .filter((x) => x.tickers.length >= 2)
    .map((x) => ({ indexName: x.name, tickers: x.tickers, isExact: true }));
}
