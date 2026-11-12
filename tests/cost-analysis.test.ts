import { describe, expect, it } from "vitest";
import type { EtfProfile, Measurement } from "../src/lib/etfs/catalog";
import {
  calculateIllustrativeAnnualCost, classifyExpenseNote,
  expenseFundFromProfile, formatScenarioMoney, parseCapitalInput,
  summarizeExpenseCoverage, type ExpenseFund,
} from "../src/lib/etfs/cost-analysis";

const measurement: Measurement = {
  metric: "ter_percent", value: "0.14", currency: null,
  asOfDate: "2026-11-11", sourceDate: null,
  sourceUrl: "https://example.org/official.pdf", version: 1,
  availability: "disponible",
  note: "Ongoing charge shown on the page with no as-of date; read date used.",
};
const profile: EtfProfile = {
  listingId: "listing-1", instrumentId: "fund-1",
  ticker: "VWRA", isin: "IE00BK5BQT80", exchange: "LSE", currency: "USD",
  name: "Fund", issuer: "Issuer", indexName: "Index",
  domicile: "IE", inceptionDate: null, distributionPolicy: "accumulating",
  unverifiedCount: 0, evidence: [],
  metrics: { ter_percent: measurement, net_assets: null, fund_net_assets: null },
};

describe("BF-024a: explanatory expense scenario", () => {
  it("treats TER as percentage points, not a decimal rate", () => {
    expect(calculateIllustrativeAnnualCost(500, 0.14)).toBe(0.7);
    expect(calculateIllustrativeAnnualCost(1000, 0.03)).toBe(0.3);
  });

  it("rounds to cents and does not invent a return", () => {
    expect(calculateIllustrativeAnnualCost(13799, 0.15)).toBe(20.70);
    expect(calculateIllustrativeAnnualCost(500, 0.04)).toBe(0.2);
  });

  it("distinguishes a real zero from missing financial data", () => {
    expect(calculateIllustrativeAnnualCost(500, 0)).toBe(0);
    expect(calculateIllustrativeAnnualCost(500, null)).toBeNull();
    expect(calculateIllustrativeAnnualCost(500, Number.NaN)).toBeNull();
    expect(calculateIllustrativeAnnualCost(Infinity, 0.14)).toBeNull();
    expect(calculateIllustrativeAnnualCost(500, -1)).toBeNull();
  });

  it("validates the capital input without rounding away bad input", () => {
    expect(parseCapitalInput("500")).toBe(500);
    expect(parseCapitalInput(" 13799.99 ")).toBe(13799.99);
    for (const bad of ["", "-3", "0", "99", "1e6", "150.123", "Infinity", "100,50", "10000000.01"]) {
      expect(parseCapitalInput(bad)).toBeNull();
    }
  });

  it("classifies gross expense ratios before generic ratios", () => {
    expect(classifyExpenseNote("Gross expense ratio on site")).toBe("gross");
    expect(classifyExpenseNote("Ongoing charge 0.15% p.a.")).toBe("ongoing");
    expect(classifyExpenseNote("Expense ratio as reported in prospectus")).toBe("expense_ratio");
    expect(classifyExpenseNote(null)).toBe("unclassified");
  });

  it("requires reliable source and effective date for calculations", () => {
    expect(expenseFundFromProfile(profile).ratePercent).toBe(0.14);
    expect(expenseFundFromProfile({
      ...profile, metrics: { ...profile.metrics,
        ter_percent: { ...measurement, sourceUrl: "javascript:alert(1)" },
      },
    }).ratePercent).toBeNull();
    expect(expenseFundFromProfile({
      ...profile, metrics: { ...profile.metrics,
        ter_percent: { ...measurement, asOfDate: null },
      },
    }).ratePercent).toBeNull();
    expect(expenseFundFromProfile({
      ...profile, metrics: { ...profile.metrics,
        ter_percent: { ...measurement, availability: "no disponible", value: "0.14" },
      },
    }).ratePercent).toBeNull();
  });

  it("does not compare heterogeneous effective dates as homogeneous", () => {
    const first = expenseFundFromProfile(profile);
    const second = { ...first, listingId: "listing-2", ticker: "FWRA", asOfDate: "2026-09-30" };
    const result = summarizeExpenseCoverage([first, second]);
    expect(result.available).toBe(2);
    expect(result.datesAligned).toBe(false);
    expect(result.canClaimHistoricalReturn).toBe(false);
  });

  it("marks methodology mismatch and missing data without ranking funds", () => {
    const first = expenseFundFromProfile(profile);
    const gross: ExpenseFund = {
      ...first, ticker: "SPYG", listingId: "listing-3", kind: "gross",
    };
    expect(summarizeExpenseCoverage([first, gross]).methodologyAligned).toBe(false);
    expect(summarizeExpenseCoverage([first, { ...gross, ratePercent: null }]).available).toBe(1);
    expect(summarizeExpenseCoverage([first, { ...first, listingId: "listing-4" }]).methodologyAligned).toBe(true);
  });

  it("formats direct USD or PEN assumptions without applying any FX rate", () => {
    expect(formatScenarioMoney(0.7, "USD")).toContain("0.70");
    expect(formatScenarioMoney(0.7, "PEN")).toContain("0.70");
  });
});
