import { describe, expect, it } from "vitest";
import {
  type EtfProfile, NOT_AVAILABLE, filterProfiles, formatAssets, formatDate,
  formatPercent, metricText, validSourceUrl, distributionLabel,
} from "../src/lib/etfs/catalog";

const etf: EtfProfile = {
  listingId: "listing-1", instrumentId: "fund-1", ticker: "FWRA",
  exchange: "XLON", currency: "USD", isin: "IE000716YHJ7",
  name: "Invesco FTSE All-World UCITS ETF Acc", issuer: "Invesco",
  indexName: "FTSE All-World Index", domicile: "IE",
  distributionPolicy: "accumulating", inceptionDate: "2023-06-26",
  unverifiedCount: 2, evidence: [],
  metrics: { ter_percent: null, net_assets: null, fund_net_assets: null },
};

describe("ETF catalog view logic", () => {
  it("searches by ticker, ISIN, index and accent-insensitive name", () => {
    expect(filterProfiles([etf], "fwra")).toHaveLength(1);
    expect(filterProfiles([etf], "IE000716YHJ7")).toHaveLength(1);
    expect(filterProfiles([etf], "all-world")).toHaveLength(1);
    expect(filterProfiles([etf], "fundación")).toHaveLength(0);
    expect(filterProfiles([etf], "does-not-exist")).toHaveLength(0);
  });

  it("never substitutes missing financial values with zero", () => {
    expect(metricText(null)).toBe(NOT_AVAILABLE);
    expect(formatPercent(null)).toBe(NOT_AVAILABLE);
    expect(formatPercent("")).toBe(NOT_AVAILABLE);
    expect(formatAssets(null, "USD")).toBe(NOT_AVAILABLE);
    expect(formatAssets("100", null)).toBe(NOT_AVAILABLE);
    expect(formatAssets("NaN", "USD")).toBe(NOT_AVAILABLE);
  });

  it("renders percent points as received, without multiplying by 100", () => {
    const value = formatPercent("0.14");
    expect(value).toContain("0,14");
    expect(value).toContain("%");
  });

  it("labels unverified or missing measurement as not available", () => {
    expect(metricText({
      metric: "ter_percent", value: "0", currency: null,
      asOfDate: "2026-11-11", sourceDate: null, sourceUrl: null,
      availability: "no disponible", version: 1, note: null,
    })).toBe(NOT_AVAILABLE);
  });

  it("distinguishes available measured zero from missing", () => {
    expect(metricText({
      metric: "ter_percent", value: "0", currency: null,
      asOfDate: "2026-11-11", sourceDate: "2026-11-11",
      sourceUrl: "https://example.org", availability: "disponible",
      version: 1, note: null,
    })).not.toBe(NOT_AVAILABLE);
  });

  it("formats USD assets in millions while preserving measurement currency", () => {
    expect(formatAssets("5184690000", "USD")).toContain("USD");
    expect(formatAssets("5184690000", "USD")).toContain("5.184");
    expect(formatAssets("10", "PEN")).toContain("PEN");
  });

  it("rejects unsafe or malformed source URLs", () => {
    expect(validSourceUrl("javascript:alert(1)")).toBeNull();
    expect(validSourceUrl("http://example.org")).toBeNull();
    expect(validSourceUrl("not a url")).toBeNull();
    expect(validSourceUrl("https://example.org/factsheet.pdf")).toBe("https://example.org/factsheet.pdf");
  });

  it("does not invent a distribution or date", () => {
    expect(distributionLabel(null)).toBe(NOT_AVAILABLE);
    expect(distributionLabel("accumulating")).toBe("Acumulación");
    expect(formatDate(null)).toBe(NOT_AVAILABLE);
    expect(formatDate("2026-09-30")).toBe("30/09/2026");
  });
});
