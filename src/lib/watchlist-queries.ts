import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { WatchlistEvent, WatchlistItem } from "@/lib/watchlist";

export type WatchlistHistoryResult =
  | { status: "ready"; items: WatchlistItem[]; events: WatchlistEvent[] }
  | { status: "error"; items: []; events: []; message: string };

export async function getWatchlistHistory(): Promise<WatchlistHistoryResult> {
  await connection();
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) redirect("/login");

  const [items, events] = await Promise.all([
    client.from("watchlist_item")
      .select("id,listing_id,status,first_followed_at,status_changed_at")
      .order("status_changed_at", { ascending: false }).limit(100),
    client.from("watchlist_event")
      .select("id,listing_id,action,occurred_at")
      .order("occurred_at", { ascending: false }).limit(40),
  ]);

  if (items.error || events.error) {
    return {
      status: "error", items: [], events: [],
      message: "No se pudo consultar el seguimiento privado. La migración BF-041a puede estar pendiente o el acceso requiere revisión.",
    };
  }
  return {
    status: "ready",
    items: (items.data ?? []) as WatchlistItem[],
    events: (events.data ?? []) as WatchlistEvent[],
  };
}
