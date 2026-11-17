import { describe, expect, it } from "vitest";
import {
  assessInvestorProfile, parseInvestorAnswers,
  type InvestorAnswers,
} from "../src/lib/investor-profile";

const base: InvestorAnswers = {
  horizon: "over_10y",
  withdrawal: "over_3y",
  emergency_fund: "over_3m",
  income_stability: "stable",
  capital_dependency: "not_needed",
  high_cost_debt: "no",
  drop_10: "buy_more",
  drop_20: "buy_more",
  drop_30: "buy_more",
  emotional_reaction: "comfortable",
  goal: "growth",
  experience: "basic",
};

describe("BF-039 investor profile scoring v1.0", () => {
  it("parses only the 12 supported answer options", () => {
    expect(parseInvestorAnswers(base).ok).toBe(true);
    expect(parseInvestorAnswers({ ...base, horizon: "forever" }).ok).toBe(false);
    expect(parseInvestorAnswers({ ...base, extra: "private data" }).ok).toBe(false);
    const missing = Object.fromEntries(Object.entries(base).filter(([key]) => key !== "horizon"));
    expect(parseInvestorAnswers(missing).ok).toBe(false);
  });

  it("returns high capacity and high tolerance when both dimensions score high", () => {
    const result = assessInvestorProfile(base);
    expect(result).toMatchObject({
      status: "complete", capacityScore: 12, capacityBand: "high",
      toleranceScore: 8, toleranceBand: "high",
      overallBand: "high", reason: "aligned",
    });
  });

  it("caps the global profile at low when capacity is low and tolerance is high", () => {
    const result = assessInvestorProfile({
      ...base,
      horizon: "under_1y",
      withdrawal: "under_1y",
      emergency_fund: "under_1m",
      income_stability: "variable",
      capital_dependency: "essential",
      high_cost_debt: "yes",
    });
    expect(result.capacityScore).toBe(0);
    expect(result.capacityBand).toBe("low");
    expect(result.toleranceBand).toBe("high");
    expect(result.overallBand).toBe("low");
    expect(result.reason).toBe("capacity_limited");
  });

  it("caps the global profile when emotional tolerance is lower than capacity", () => {
    const result = assessInvestorProfile({
      ...base,
      drop_10: "sell_all",
      drop_20: "sell_all",
      drop_30: "sell_all",
      emotional_reaction: "very_anxious",
    });
    expect(result.capacityBand).toBe("high");
    expect(result.toleranceScore).toBe(0);
    expect(result.toleranceBand).toBe("low");
    expect(result.overallBand).toBe("low");
    expect(result.reason).toBe("tolerance_limited");
  });

  it("classifies capacity boundaries deterministically", () => {
    const low = assessInvestorProfile({
      ...base, horizon: "under_1y", withdrawal: "under_1y",
      emergency_fund: "under_1m", income_stability: "variable",
      capital_dependency: "essential", high_cost_debt: "yes",
    });
    const medium = assessInvestorProfile({
      ...base, horizon: "3_5y", withdrawal: "1_3y",
      emergency_fund: "1_3m", income_stability: "mixed",
      capital_dependency: "partial", high_cost_debt: "no",
    });
    expect(low.capacityBand).toBe("low");
    expect(medium.capacityBand).toBe("medium");
  });

  it("does not force a global profile when the user prefers not to disclose emergency fund", () => {
    const result = assessInvestorProfile({ ...base, emergency_fund: "prefer_not" });
    expect(result.status).toBe("incomplete");
    expect(result.capacityScore).toBeNull();
    expect(result.capacityBand).toBeNull();
    expect(result.toleranceBand).toBe("high");
    expect(result.overallBand).toBeNull();
  });

  it("does not force a global profile when high-cost debt is uncertain", () => {
    const result = assessInvestorProfile({ ...base, high_cost_debt: "unsure" });
    expect(result.status).toBe("incomplete");
    expect(result.overallBand).toBeNull();
  });

  it("flags drawdown answers that become more risk tolerant as losses deepen", () => {
    const result = assessInvestorProfile({
      ...base, drop_10: "sell_all", drop_20: "buy_more", drop_30: "hold",
    });
    expect(result.status).toBe("review_needed");
    expect(result.reason).toBe("review_needed");
    expect(result.overallBand).toBeNull();
  });

  it("accepts a consistent progression from hold to sell as losses deepen", () => {
    const result = assessInvestorProfile({
      ...base, drop_10: "buy_more", drop_20: "hold", drop_30: "reduce",
    });
    expect(result.status).toBe("complete");
    expect(result.overallBand).not.toBeNull();
  });

  it("keeps objective and experience as context, not risk score multipliers", () => {
    const first = assessInvestorProfile(base);
    const second = assessInvestorProfile({
      ...base, goal: "preserve", experience: "advanced",
    });
    expect(second.capacityScore).toBe(first.capacityScore);
    expect(second.toleranceScore).toBe(first.toleranceScore);
    expect(second.overallBand).toBe(first.overallBand);
  });

  it("uses a fixed and explicit questionnaire/scoring version", () => {
    const result = assessInvestorProfile(base);
    expect(result.questionnaireVersion).toBe("1.0");
    expect(result.scoringVersion).toBe("1.0");
  });
});
