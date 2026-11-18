import { describe, expect, it } from "vitest";
import {
  FINANCIAL_MCP_CONTRACT_VERSION, FINANCIAL_MCP_TOOLS,
  parseFinancialMcpCall, toMcpInvestorProfileSummary,
} from "../src/lib/mcp/contract";

const LISTING_ID = "123e4567-e89b-12d3-a456-426614174111";
const IDEMPOTENCY_KEY = "123e4567-e89b-12d3-a456-426614174112";
const proposal = {
  listing_id: LISTING_ID,
  title: "Comunicacion oficial del emisor",
  summary: "El emisor publico un comunicado documentado para revision.",
  source_url: "https://example.com/filings/notice",
  published_on: "2026-11-16",
  idempotency_key: IDEMPOTENCY_KEY,
  confirmed: true,
};

describe("BF-017a financial MCP contract", () => {
  it("defines only contract-only tools with a single version", () => {
    expect(FINANCIAL_MCP_CONTRACT_VERSION).toBe("0.1.0");
    expect(new Set(FINANCIAL_MCP_TOOLS.map((tool) => tool.name)).size).toBe(FINANCIAL_MCP_TOOLS.length);
    expect(FINANCIAL_MCP_TOOLS.every((tool) =>
      tool.availability === "contract_only" && tool.inputSchema.additionalProperties === false,
    )).toBe(true);
    expect(FINANCIAL_MCP_TOOLS.map((tool) => tool.name)).not.toContain("execute_sql");
  });

  it("allows no-argument profile reads but refuses answers or owner supplied by clients", () => {
    expect(parseFinancialMcpCall("get_investor_profile", {}).ok).toBe(true);
    expect(parseFinancialMcpCall("get_investor_profile", { answers: {} }).ok).toBe(false);
    expect(parseFinancialMcpCall("get_investor_profile", { user_id: LISTING_ID }).ok).toBe(false);
  });

  it("rejects unknown tools, arrays, null and prototype-poisoning fields", () => {
    expect(parseFinancialMcpCall("run_sql", {}).ok).toBe(false);
    expect(parseFinancialMcpCall("list_watchlist", null).ok).toBe(false);
    expect(parseFinancialMcpCall("list_watchlist", []).ok).toBe(false);
    expect(parseFinancialMcpCall("list_watchlist", JSON.parse('{"__proto__":true}')).ok).toBe(false);
  });

  it("enforces watchlist status, integer limits and no extra fields", () => {
    expect(parseFinancialMcpCall("list_watchlist", { status: "inactive", limit: 50 }).ok).toBe(true);
    for (const args of [{ limit: 0 }, { limit: 51 }, { limit: 1.5 }, { status: "all" }, { raw: true }]) {
      expect(parseFinancialMcpCall("list_watchlist", args).ok).toBe(false);
    }
  });

  it("searches ETFs and equities but limits free-text and disallows SQL field", () => {
    expect(parseFinancialMcpCall("search_instruments", { query: "BAP", asset_type: "equity" }).ok).toBe(true);
    expect(parseFinancialMcpCall("search_instruments", { query: "VWRA", asset_type: "etf" }).ok).toBe(true);
    for (const args of [
      { query: "B" }, { query: "B".repeat(81) }, { query: "BAP", sql: "select *" },
      { query: "BAP", limit: "10" }, { query: " BAP " },
    ]) {
      expect(parseFinancialMcpCall("search_instruments", args).ok).toBe(false);
    }
  });

  it("requires exact listing UUID, not ticker, for listing details and changes", () => {
    expect(parseFinancialMcpCall("get_instrument_profile", { listing_id: LISTING_ID }).ok).toBe(true);
    expect(parseFinancialMcpCall("get_instrument_profile", { listing_id: "BAP" }).ok).toBe(false);
    expect(parseFinancialMcpCall("set_watchlist_follow", { listing_id: "BAP", action: "follow", confirmed: true }).ok).toBe(false);
  });

  it("requires an explicit positive confirmation for interest-state changes", () => {
    expect(parseFinancialMcpCall("set_watchlist_follow", {
      listing_id: LISTING_ID, action: "follow", confirmed: true,
    }).ok).toBe(true);
    expect(parseFinancialMcpCall("set_watchlist_follow", {
      listing_id: LISTING_ID, action: "unfollow", confirmed: false,
    })).toMatchObject({ ok: false, error: "CONFIRMATION_REQUIRED" });
    expect(parseFinancialMcpCall("set_watchlist_follow", {
      listing_id: LISTING_ID, action: "buy", confirmed: true,
    }).ok).toBe(false);
  });

  it("validates a proposed research record and rejects unsafe URLs and invalid dates", () => {
    expect(parseFinancialMcpCall("submit_research_proposal", proposal).ok).toBe(true);
    for (const bad of [
      { source_url: "http://example.com/notice" },
      { source_url: "https://localhost/admin" },
      { source_url: "https://127.0.0.1/admin" },
      { source_url: "https://[::1]/admin" },
      { source_url: "https://example.local/admin" },
      { source_url: "https://user:pass@example.com/admin" },
      { published_on: "2026-02-30" },
      { idempotency_key: "duplicate" },
    ]) {
      expect(parseFinancialMcpCall("submit_research_proposal", { ...proposal, ...bad }).ok).toBe(false);
    }
    expect(parseFinancialMcpCall("submit_research_proposal", {
      ...proposal, confirmed: false,
    })).toMatchObject({ ok: false, error: "CONFIRMATION_REQUIRED" });
    expect(parseFinancialMcpCall("get_asset_research", {
      listing_id: LISTING_ID, since: "2026-02-29",
    }).ok).toBe(false);
  });

  it("does not expose personal questionnaire answers in an MCP profile summary", () => {
    const snapshot = {
      status: "complete" as const, capacity_band: "low" as const,
      tolerance_band: "high" as const, overall_band: "low" as const,
      questionnaire_version: "1.0", scoring_version: "1.0",
      created_at: "2026-11-17T00:00:00Z",
      answers: { high_cost_debt: "yes", emergency_fund: "under_1m" },
      user_id: "private",
    };
    const summary = toMcpInvestorProfileSummary(snapshot);
    expect(summary).toMatchObject({
      overall_band: "low", capacity_band: "low", educational_only: true,
    });
    expect(JSON.stringify(summary)).not.toMatch(/answers|high_cost_debt|emergency_fund|user_id|private/);
    expect(Object.keys(summary)).toHaveLength(8);
  });

  it("requires human confirmation for both potential write effects", () => {
    for (const tool of FINANCIAL_MCP_TOOLS) {
      if (tool.effect !== "read") {
        expect(tool.humanConfirmation).toBe(true);
        expect(tool.inputSchema.required).toContain("confirmed");
      }
    }
  });
});
