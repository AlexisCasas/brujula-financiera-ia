import { describe, expect, it } from "vitest";
import type { EtfProfile } from "../src/lib/etfs/catalog";
import {
  hasUnavailableMeasurements, parseListingSelection,
  selectEtfsForComparison,
} from "../src/lib/etfs/comparison";

const fixtures: EtfProfile[] = Array.from({ length: 6 }, (_, index) => ({
  listingId: `listing_${index}`,
  instrumentId: `fund_${index}`,
  ticker: `ETF${index}`,
  exchange: "XLON",
  currency: "USD",
  isin: `IE00000000${index.toString().padStart(2, "0")}`,
  name: `Fund ${index}`,
  issuer: "Issuer",
  indexName: "Index",
  domicile: "IE",
  distributionPolicy: "accumulating",
  inceptionDate: null,
  unverifiedCount: 0,
  evidence: [],
  metrics: {
    ter_percent: {
      metric: "ter_percent", value: "0.14", currency: null, asOfDate: "2026-11-11",
      sourceDate: "2026-11-11", sourceUrl: "https://example.org",
      version: 1, availability: "disponible", note: null,
    },
    net_assets: null,
    fund_net_assets: null,
  },
}));

describe("comparison selection", () => {
  it("parses repeated listing params and removes duplicate IDs", () => {
    expect(parseListingSelection(["listing_0", "listing_0", "listing_1"]))
      .toEqual(["listing_0", "listing_1"]);
    expect(parseListingSelection(undefined)).toEqual([]);
    expect(parseListingSelection("listing_2")).toEqual(["listing_2"]);
  });

  it("ignores invalid URL identifiers", () => {
    expect(parseListingSelection(["listing_0", "<script>", " ", "a".repeat(100)]))
      .toEqual(["listing_0"]);
  });

  it("requires at least two unique and at most five listings", () => {
    expect(selectEtfsForComparison(fixtures, []).kind).toBe("empty");
    expect(selectEtfsForComparison(fixtures, ["listing_0"]).kind).toBe("too_few");
    expect(selectEtfsForComparison(fixtures, fixtures.map((f) => f.listingId)).kind)
      .toBe("too_many");
    const selection = selectEtfsForComparison(fixtures, ["listing_1", "listing_0"]);
    expect(selection.kind).toBe("ready");
    expect(selection.items.map((f) => f.ticker)).toEqual(["ETF1", "ETF0"]);
  });

  it("does not silently compare an unknown listing", () => {
    const selection = selectEtfsForComparison(fixtures, ["listing_0", "missing"]);
    expect(selection.kind).toBe("not_found");
    if (selection.kind === "not_found") expect(selection.missingCount).toBe(1);
  });

  it("does not claim financial completeness when metrics are missing", () => {
    expect(hasUnavailableMeasurements(fixtures.slice(0, 2))).toBe(true);
    const completed = fixtures.map((f) => ({
      ...f,
      metrics: {
        ...f.metrics,
        net_assets: {
          metric: "net_assets" as const, value: "1000000", currency: "USD",
          asOfDate: "2026-11-11", sourceDate: "2026-11-11",
          sourceUrl: "https://example.org", version: 1,
          availability: "disponible", note: null,
        },
        fund_net_assets: {
          metric: "fund_net_assets" as const, value: "2000000", currency: "USD",
          asOfDate: "2026-11-11", sourceDate: "2026-11-11",
          sourceUrl: "https://example.org", version: 1,
          availability: "disponible", note: null,
        },
      },
    }));
    expect(hasUnavailableMeasurements(completed)).toBe(false);
  });
});
