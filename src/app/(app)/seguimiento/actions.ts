"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseFollowCommand } from "@/lib/watchlist";

const RESULTS = new Set([
  "followed", "resumed", "unfollowed", "already_following",
  "already_inactive", "not_following",
]);

export async function changeWatchlistAction(form: FormData): Promise<void> {
  const command = parseFollowCommand(form.get("listing_id"), form.get("mode"));
  if (!command) redirect("/seguimiento?notice=invalid");

  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) redirect("/login");

  // No owner_id, ticker, price, event timestamp or title is accepted from browser.
  // The RPC handles owner-only verification, listing resolution and idempotent
  // audit logging in a single PostgreSQL transaction.
  const { data, error } = await client.rpc("set_watchlist_follow", {
    p_listing_id: command.listingId,
    p_follow: command.follow,
  });

  if (error || typeof data !== "string" || !RESULTS.has(data)) {
    redirect("/seguimiento?notice=save");
  }
  redirect("/seguimiento?notice=" + data);
}
