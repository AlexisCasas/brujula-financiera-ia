import { describe, expect, it } from "vitest";
import {
  assessComparableReturns, exactBenchmarkMatches, windowStartDate,
  type VerifiedDailySeries,
} from "../src/lib/etfs/historical-comparability";

const END = "2026-11-12";
function makeDays(from: string, until: string) {
  const start = new Date(from + "T00:00:00Z").getTime();
  const stop = new Date(until + "T00:00:00Z").getTime();
  const records = [];
  let counter = 0;
  for (let day = start; day <= stop; day += 86_400_000) {
    records.push({
      date: new Date(day).toISOString().slice(0, 10),
      value: Number((100 + counter * 0.1).toFixed(5)),
    });
    counter++;
  }
  return records;
}
const allObservations = makeDays("2024-09-01", END);
function fund(listingId: string, ticker: string): VerifiedDailySeries {
  return {
    listingId, ticker, currency: "USD", basis: "close",
    sourceUrl: "https://official.example.org/history",
    sourceName: "Fuente de laboratorio",
    capturedAt: "2026-11-12T00:00:00Z",
    methodologyVerified: true, licenseApproved: true,
    observations: allObservations,
  };
}
const first = fund("listing-1", "VWRA");
const second = fund("listing-2", "FWRA");
const ids = [first.listingId, second.listingId];

describe("BF-024b: comparable windows and provenance gate", () => {
  it("calculates exact month anchors with leap-year and month-end clamping", () => {
    expect(windowStartDate("2026-11-12", "1M")).toBe("2026-10-12");
    expect(windowStartDate("2026-03-31", "1M")).toBe("2026-02-28");
    expect(windowStartDate("2024-03-31", "1M")).toBe("2024-02-29");
    expect(windowStartDate("2026-11-12", "24M")).toBe("2024-11-12");
    expect(windowStartDate("2026-02-30", "1M")).toBeNull();
  });

  it.each(["1M", "3M", "6M", "12M", "24M"] as const)(
    "compares %s only on shared original observations", (window) => {
      const value = assessComparableReturns(ids, [first, second], END, window);
      expect(value.reason).toBe("ready");
      expect(value.results).toHaveLength(2);
      expect(value.observedEnd).toBe(END);
      expect(value.sharedSessions).toBeGreaterThanOrEqual(value.requiredSessions);
      expect(value.method).toContain("dividendos");
      expect(value.results[0].returnPercent).toBeGreaterThan(0);
    },
  );

  it("never substitutes a missing series with fabricated results", () => {
    const result = assessComparableReturns(ids, [first], END, "12M");
    expect(result.reason).toBe("missing_series");
    expect(result.results).toEqual([]);
    expect(assessComparableReturns(ids, [], END, "1M").reason).toBe("missing_series");
  });

  it("rejects mixing USD and PEN without valid FX", () => {
    const result = assessComparableReturns(ids, [
      first, { ...second, currency: "PEN" },
    ], END, "1M");
    expect(result.reason).toBe("incompatible_currency");
    expect(result.results).toEqual([]);
  });

  it("rejects mixing raw close with adjusted close or NAV", () => {
    const result = assessComparableReturns(ids, [
      first, { ...second, basis: "adjusted_close" },
    ], END, "1M");
    expect(result.reason).toBe("incompatible_price_basis");
  });

  it("rejects missing license, invalid source URL and missing methodology", () => {
    expect(assessComparableReturns(ids, [
      first, { ...second, licenseApproved: false },
    ], END, "1M").reason).toBe("unverified_source");
    expect(assessComparableReturns(ids, [
      first, { ...second, sourceUrl: "http://insecure.example.org" },
    ], END, "1M").reason).toBe("unverified_source");
    expect(assessComparableReturns(ids, [
      first, { ...second, methodologyVerified: false },
    ], END, "1M").reason).toBe("unverified_source");
  });

  it("rejects invalid prices, dates, duplicate observations and zero prices", () => {
    const cases = [
      [{ date: "2026-11-12", value: 0 }],
      [{ date: "2026-11-12", value: -1 }],
      [{ date: "2026-02-30", value: 100 }],
      [{ date: "2026-11-12", value: 10 }, { date: "2026-11-12", value: 11 }],
    ];
    for (const observations of cases) {
      const result = assessComparableReturns(ids, [
        first, { ...second, observations },
      ], END, "1M");
      expect(result.reason).toBe("invalid_observations");
      expect(result.results).toEqual([]);
    }
  });

  it("requires common anchor dates within five calendar days", () => {
    const result = assessComparableReturns(ids, [
      first, { ...second, observations:
        allObservations.filter((p) => p.date < "2026-11-01") },
    ], END, "1M");
    expect(result.reason).toBe("nonoverlapping_dates");
    expect(result.results).toHaveLength(0);
  });

  it("enforces minimum common daily coverage even when endpoints exist", () => {
    const sampled = allObservations.filter((p) =>
      p.date === "2026-10-12" || p.date === END);
    const result = assessComparableReturns(ids, [
      { ...first, observations: sampled },
      { ...second, observations: sampled },
    ], END, "1M");
    expect(result.reason).toBe("insufficient_coverage");
    expect(result.sharedSessions).toBe(2);
  });

  it("detects a sudden >60% move likely needing corporate-action review", () => {
    const jumped = allObservations.map((x) => ({
      ...x, value: x.date >= "2026-11-01" ? x.value * 4 : x.value,
    }));
    const result = assessComparableReturns(ids, [
      first, { ...second, observations: jumped },
    ], END, "1M");
    expect(result.reason).toBe("suspicious_change");
    expect(result.results).toHaveLength(0);
  });

  it("distinguishes price change from verified total-return-index methodology", () => {
    const a: VerifiedDailySeries = { ...first, basis: "total_return_index" };
    const b: VerifiedDailySeries = { ...second, basis: "total_return_index" };
    const result = assessComparableReturns(ids, [a, b], END, "1M");
    expect(result.reason).toBe("ready");
    expect(result.method).toContain("retorno total");
    expect(result.results.map((x) => x.basis)).toEqual([
      "total_return_index", "total_return_index",
    ]);
  });

  it("never compares duplicate listings or missing dates as if valid", () => {
    expect(assessComparableReturns(["listing-1", "listing-1"], [
      first, second,
    ], END, "1M").reason).toBe("invalid_observations");
    expect(assessComparableReturns(ids, [
      first, second,
    ], "2026-02-30", "1M").reason).toBe("invalid_observations");
  });

  it("finds only identically declared index names, never invents overlap", () => {
    const profiles = [
      { ticker: "VWRA", indexName: "FTSE All-World Index" },
      { ticker: "FWRA", indexName: "  ftse  all-world index " },
      { ticker: "VOO", indexName: "S&P 500 Index" },
      { ticker: "SPYG", indexName: "S&P 500 Growth Index" },
      { ticker: "VUG", indexName: null },
    ];
    expect(exactBenchmarkMatches(profiles)).toEqual([{
      indexName: "FTSE All-World Index",
      tickers: ["VWRA", "FWRA"],
      isExact: true,
    }]);
    expect(exactBenchmarkMatches(profiles.slice(2))).toEqual([]);
  });
});
