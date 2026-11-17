import { describe, expect, it } from "vitest";
import { buildEquityWatchRows, type EquityListing } from "../src/lib/equities/types";
import type { WatchlistItem } from "../src/lib/watchlist";

const BAP: EquityListing = {
  listing_id: "123e4567-e89b-12d3-a456-426614174009",
  instrument_id: "123e4567-e89b-12d3-a456-426614174019",
  name: "Credicorp Ltd.", issuer: "Credicorp Ltd.",
  ticker: "BAP", exchange: "XLIM", currency: "USD", isin: "BMG2519Y1084",
  asset_type: "equity", listing_status: "unverified",
  identity_documented: true,
  source_url: "https://documents.bvl.com.pe/pubdif/boldia/stockq.htm",
  source_date: "2026-11-16",
};

function item(status: "active" | "inactive"): WatchlistItem {
  return { id: "123e4567-e89b-12d3-a456-426614174002",
    listing_id: BAP.listing_id, status,
    first_followed_at: "2026-11-16T00:00:00Z",
    status_changed_at: "2026-11-16T12:00:00Z",
  };
}

describe("BF-040 separate BVL equity catalog", () => {
  it("keeps Credicorp local listing XLIM/USD distinct from a NYSE BAP listing", () => {
    expect(BAP.ticker).toBe("BAP");
    expect(BAP.exchange).toBe("XLIM");
    expect(BAP.currency).toBe("USD");
    expect(BAP.isin).toBe("BMG2519Y1084");
    expect(BAP.asset_type).toBe("equity");
    expect(BAP.listing_status).toBe("unverified");
  });

  it("finds BAP by ticker, issuer, ISIN or market", () => {
    for (const q of ["bap", "CREDICORP", "BMG2519Y1084", "Lima"]) {
      expect(buildEquityWatchRows([BAP], [], q)).toHaveLength(1);
    }
    expect(buildEquityWatchRows([BAP], [], "Vanguard")).toHaveLength(0);
  });

  it("uses listing UUID rather than a ticker for private following", () => {
    const nyse = { ...BAP,
      listing_id: "123e4567-e89b-12d3-a456-426614174010",
      exchange: "XNYS",
    };
    const rows = buildEquityWatchRows([BAP, nyse], [item("active")], "");
    expect(rows.map((x) => x.following)).toEqual([true, false]);
  });

  it("preserves saved inactive listing for reactivation instead of deleting", () => {
    const [row] = buildEquityWatchRows([BAP], [item("inactive")], "");
    expect(row.following).toBe(false);
    expect(row.saved?.first_followed_at).toBe("2026-11-16T00:00:00Z");
  });

  it("does not invent a portfolio quantity, price, dividend or TER", () => {
    expect(Object.keys(BAP)).not.toContain("price");
    expect(Object.keys(BAP)).not.toContain("ter_percent");
    expect(Object.keys(BAP)).not.toContain("dividend");
    expect(Object.keys(BAP)).not.toContain("quantity");
  });
});
