import { describe, it, expect } from "vitest";
import {
  savedMetricAsDisplay, validSavedItems, formatSavedTimestamp,
} from "../src/lib/etfs/saved";
import { metricText, NOT_AVAILABLE } from "../src/lib/etfs/catalog";

const item = {
  listing_id: "listing-id", instrument_id: "instrument-id",
  isin: "IE00BK5BQT80", ticker: "VWRA", exchange: "XLON",
  currency: "USD", listing_status: "active",
  name: "ETF", issuer: "Issuer", index_name: "Index", domicile: "IE",
  distribution_policy: "accumulating", inception_date: null,
  attributes_captured_at: "2026-11-12T05:00:00Z",
  metrics: {
    ter_percent: {
      availability: "disponible", measurement_id: "measurement1",
      source_record_id: "source1", value: "0.14", currency: null,
      as_of_date: "2026-11-11", version: 2,
      source_url: "https://example.com/etf.pdf",
      source_date: "2026-11-11", captured_at: "2026-11-12T05:00:00Z",
      note: "Fuente oficial",
    },
  },
  field_sources: [],
};

describe("Immutable comparison snapshot rendering", () => {
  it("only accepts complete 2-5 item snapshot arrays", () => {
    expect(validSavedItems([item, { ...item, listing_id: "other" }])).toBe(true);
    expect(validSavedItems([item])).toBe(false);
    expect(validSavedItems([])).toBe(false);
    expect(validSavedItems([item, { ...item, metrics: null }])).toBe(false);
    expect(validSavedItems([item, { ...item, field_sources: "none" }])).toBe(false);
  });

  it("preserves the exact TER percentage and the documented source", () => {
    const metric = savedMetricAsDisplay("ter_percent", item.metrics.ter_percent);
    expect(metric?.value).toBe("0.14");
    expect(metric?.version).toBe(2);
    expect(metric?.sourceUrl).toContain("example.com");
    expect(metricText(metric)).toContain("0,14");
  });

  it("missing measurement is not a zero-valued observation", () => {
    expect(savedMetricAsDisplay("net_assets", null)).toBeNull();
    expect(metricText(savedMetricAsDisplay("net_assets", null))).toBe(NOT_AVAILABLE);
  });

  it("display date is consistent in the configured Lima time zone", () => {
    const text = formatSavedTimestamp("2026-11-12T05:15:00Z");
    expect(text).toContain("12");
    expect(text).toContain("2026");
    expect(formatSavedTimestamp("invalid")).toBe("Fecha no disponible");
  });

  it("does not accept unsupported financial metrics", () => {
    expect(validSavedItems([
      { ...item, metrics: { imaginary_return: { value: "999" } } },
      item,
    ])).toBe(false);
  });
});
