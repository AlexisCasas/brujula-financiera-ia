import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EquityListing } from "./types";

export type EquityCatalogResult =
  | { status: "ready"; rows: EquityListing[] }
  | { status: "error"; rows: []; message: string };

/** Uses user Auth, a SECURITY INVOKER view, and underlying RLS. */
export async function getEquityCatalog(): Promise<EquityCatalogResult> {
  await connection();
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data, error } = await supabase.from("equity_listing_overview")
    .select("listing_id,instrument_id,name,issuer,isin,ticker,exchange,currency,listing_status,asset_type,source_url,source_date,identity_documented")
    .eq("exchange", "XLIM")
    .order("ticker");

  if (error) return {
    status: "error", rows: [],
    message: "Todavía no está disponible el catálogo de acciones BVL verificado. La migración BF-040 puede estar pendiente.",
  };
  return {
    status: "ready",
    rows: (data ?? []).filter((x) =>
      x.asset_type === "equity" && x.identity_documented &&
      typeof x.source_url === "string" && x.source_url.startsWith("https://")
    ) as EquityListing[],
  };
}
