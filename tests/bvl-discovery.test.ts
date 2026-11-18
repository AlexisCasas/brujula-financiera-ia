import { describe, expect, it } from "vitest";
import {
  BVL_CODES_AS_OF, BVL_CODES_SOURCE, BVL_DISCOVERY_CANDIDATES,
  BVL_ISSUERS_AS_OF, BVL_ISSUERS_SOURCE,
  BVL_STOCK_REPORT_AS_OF, BVL_STOCK_REPORT_SOURCE,
  filterBvlCandidates,
} from "../src/lib/bvl-discovery";

describe("BF-040 discovery within BF-041a — reference-only BVL equities", () => {
  it("keeps at least eight distinct companies with unique mnemonics and ISIN", () => {
    expect(BVL_DISCOVERY_CANDIDATES).toHaveLength(8);
    const mnemonics = BVL_DISCOVERY_CANDIDATES.map(x => x.mnemonic);
    const isins = BVL_DISCOVERY_CANDIDATES.map(x => x.isin);
    expect(new Set(mnemonics).size).toBe(8);
    expect(new Set(isins).size).toBe(8);
    expect(isins.every(x => /^[A-Z]{2}[A-Z0-9]{9}\d$/.test(x))).toBe(true);
  });

  it("references official BVL source URLs and documents as-of dates", () => {
    for (const source of [BVL_CODES_SOURCE, BVL_ISSUERS_SOURCE, BVL_STOCK_REPORT_SOURCE]) {
      expect(new URL(source).hostname).toBe("documents.bvl.com.pe");
      expect(source.startsWith("https://")).toBe(true);
    }
    expect(BVL_CODES_AS_OF).toBe("2026-10-01");
    expect(BVL_STOCK_REPORT_AS_OF).toBe("2026-11-16");
    expect(BVL_ISSUERS_AS_OF).toBe("2025-07-25");
  });

  it("identifies the USD listing separately from PEN listings", () => {
    expect(BVL_DISCOVERY_CANDIDATES.find(x => x.mnemonic === "INRETC1")?.currency).toBe("USD");
    expect(BVL_DISCOVERY_CANDIDATES.find(x => x.mnemonic === "FERREYC1")?.currency).toBe("PEN");
  });

  it("uses capital-share class, never investment shares or ETF", () => {
    expect(BVL_DISCOVERY_CANDIDATES.every(x => x.classLabel === "Acción de capital")).toBe(true);
    expect(BVL_DISCOVERY_CANDIDATES.some(x => x.mnemonic === "MINSURI1")).toBe(false);
  });

  it("filters company name, code and market without assuming a matched listing is registered", () => {
    expect(filterBvlCandidates(BVL_DISCOVERY_CANDIDATES, "ferrey")).toHaveLength(1);
    expect(filterBvlCandidates(BVL_DISCOVERY_CANDIDATES, "BBVAC1")[0].issuerName).toContain("BBVA");
    expect(filterBvlCandidates(BVL_DISCOVERY_CANDIDATES, "Perú").length).toBeGreaterThan(1);
    expect(filterBvlCandidates(BVL_DISCOVERY_CANDIDATES, "VWRA")).toEqual([]);
    expect(filterBvlCandidates(BVL_DISCOVERY_CANDIDATES, "")).toHaveLength(8);
  });

  it("does not store live price, purchase quantity or brokerage details in discovery manifest", () => {
    for (const x of BVL_DISCOVERY_CANDIDATES) {
      expect(Object.keys(x).sort()).toEqual(
        ["classLabel", "currency", "isin", "issuerName", "marketLabel", "mnemonic"].sort(),
      );
    }
  });
});
