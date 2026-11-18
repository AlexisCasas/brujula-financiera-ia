import { normalizedSearch } from "@/lib/etfs/catalog";
import type { WatchlistItem } from "@/lib/watchlist";

export type EquityListing = {
  listing_id: string;
  instrument_id: string;
  name: string;
  issuer: string | null;
  isin: string;
  ticker: string;
  exchange: string;
  currency: string;
  listing_status: string;
  asset_type: "equity";
  source_url: string;
  source_date: string;
  identity_documented: boolean;
};

export type EquityWatchRow = EquityListing & {
  saved: WatchlistItem | null;
  following: boolean;
};

export function buildEquityWatchRows(
  equities: readonly EquityListing[],
  watchlist: readonly WatchlistItem[],
  query: string,
): EquityWatchRow[] {
  const byId = new Map(watchlist.map((item) => [item.listing_id, item]));
  const term = normalizedSearch(query).slice(0, 120);
  return equities.filter((e) => !term || (
    [e.name, e.issuer ?? "", e.ticker, e.isin, e.exchange, "BVL", "Lima"]
      .some((value) => normalizedSearch(value).includes(term))
  )).map((equity) => {
    const saved = byId.get(equity.listing_id) ?? null;
    return { ...equity, saved, following: saved?.status === "active" };
  });
}
