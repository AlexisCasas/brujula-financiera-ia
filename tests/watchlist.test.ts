import { describe, expect, it } from "vitest";
import type { EtfProfile } from "../src/lib/etfs/catalog";
import {
  UUID_PATTERN, buildWatchlistView, parseFollowCommand,
  searchWatchlistView, watchlistEventText, watchlistNotice,
  watchlistAsOfText, type WatchlistItem,
} from "../src/lib/watchlist";

const ID_A = "123e4567-e89b-12d3-a456-426614174001";
const ID_B = "123e4567-e89b-12d3-a456-426614174002";

function profile(listingId: string, ticker: string, isin: string): EtfProfile {
  return {
    listingId, instrumentId: "123e4567-e89b-12d3-a456-426614174000",
    ticker, isin, name: ticker === "VWRA" ? "Vanguard FTSE All-World ETF" : "Invesco FTSE All-World ETF",
    exchange: "XLON", currency: "USD",
    issuer: ticker === "VWRA" ? "Vanguard" : "Invesco", indexName: "FTSE All-World",
    domicile: null, distributionPolicy: "accumulating", inceptionDate: null,
    unverifiedCount: 1, evidence: [],
    metrics: { ter_percent: null, net_assets: null, fund_net_assets: null },
  };
}
const profiles = [profile(ID_A, "VWRA", "IE00BK5BQT80"), profile(ID_B, "FWRA", "IE000716YHJ7")];
function item(listing_id: string, status: "active" | "inactive"): WatchlistItem {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", listing_id, status,
    first_followed_at: "2026-11-16T01:00:00Z",
    status_changed_at: "2026-11-16T02:00:00Z",
  };
}

describe("BF-041a watchlist commands and read models", () => {
  it("allows only a real listing UUID and an explicit follow/unfollow command", () => {
    expect(UUID_PATTERN.test(ID_A)).toBe(true);
    expect(parseFollowCommand(ID_A, "follow")).toEqual({ listingId: ID_A, follow: true });
    expect(parseFollowCommand(ID_A, "unfollow")).toEqual({ listingId: ID_A, follow: false });
  });

  it("rejects arbitrary ticker or ambiguous assets", () => {
    expect(parseFollowCommand("VWRA", "follow")).toBeNull();
    expect(parseFollowCommand("MSFT", "follow")).toBeNull();
    expect(parseFollowCommand("", "follow")).toBeNull();
    expect(parseFollowCommand(ID_A, "buy")).toBeNull();
    expect(parseFollowCommand(ID_A, "delete")).toBeNull();
    expect(parseFollowCommand(ID_A, null)).toBeNull();
    expect(parseFollowCommand(null, "follow")).toBeNull();
  });

  it("marks followed assets by exact listing ID, not ticker or fund name", () => {
    const view = buildWatchlistView(profiles, [item(ID_A, "active")]);
    expect(view.map((x) => x.isFollowing)).toEqual([true, false]);
    expect(view[1].saved).toBeNull();
  });

  it("keeps an inactive listing in history but not in the active watchlist", () => {
    const view = buildWatchlistView(profiles, [item(ID_A, "inactive")]);
    expect(view[0].saved?.status).toBe("inactive");
    expect(view[0].isFollowing).toBe(false);
  });

  it("does not conflate different listings of the same fund", () => {
    const secondListing = { ...profiles[0], listingId: ID_B, exchange: "XETR", currency: "EUR" };
    const view = buildWatchlistView([profiles[0], secondListing], [item(ID_A, "active")]);
    expect(view.map((x) => x.isFollowing)).toEqual([true, false]);
  });

  it("searches case-insensitively by ticker, ISIN, name and issuer", () => {
    const view = buildWatchlistView(profiles, []);
    expect(searchWatchlistView(view, "vwra")).toHaveLength(1);
    expect(searchWatchlistView(view, "ie000716yhj7")[0].profile.ticker).toBe("FWRA");
    expect(searchWatchlistView(view, "VANGUARD")).toHaveLength(1);
    expect(searchWatchlistView(view, "FTSE")).toHaveLength(2);
    expect(searchWatchlistView(view, "")).toHaveLength(2);
    expect(searchWatchlistView(view, "fake-stock")).toEqual([]);
  });

  it("displays meaningful audit labels for add, stop and resume", () => {
    expect(watchlistEventText("follow")).toMatch(/Agregado/);
    expect(watchlistEventText("unfollow")).toMatch(/dejó de seguir/);
    expect(watchlistEventText("resume")).toMatch(/reanudado/);
  });

  it("distinguishes idempotent responses from real changes", () => {
    expect(watchlistNotice("already_following")).toMatch(/ya estaba/);
    expect(watchlistNotice("already_inactive")).toMatch(/ya estaba/);
    expect(watchlistNotice("resumed")).toMatch(/historial/);
    expect(watchlistNotice("save")).toMatch(/No pudimos/);
    expect(watchlistNotice("arbitrary-unknown")).toBeNull();
  });

  it("does not invent a TER or current price if source is missing", () => {
    expect(watchlistAsOfText(profiles[0])).toContain("no disponible");
  });
});
