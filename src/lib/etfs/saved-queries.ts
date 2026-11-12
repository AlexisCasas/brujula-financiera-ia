import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  type SavedComparison, type SavedComparisonSummary, validSavedItems,
} from "./saved";

export type SavedListResult =
  | { status: "ready"; rows: SavedComparisonSummary[] }
  | { status: "error"; rows: []; message: string };

async function ownerClient() {
  await connection();
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) redirect("/login");
  return client;
}

export async function listSavedComparisons(): Promise<SavedListResult> {
  const client = await ownerClient();
  const { data, error } = await client
    .from("saved_etf_comparison")
    .select("id,title,as_of_date,saved_at,listing_ids")
    .order("saved_at", { ascending: false })
    .limit(30);
  if (error) {
    return { status: "error", rows: [],
      message: "No fue posible recuperar el historial de comparaciones." };
  }
  return { status: "ready", rows: (data ?? []) as SavedComparisonSummary[] };
}

export async function getSavedComparison(id: string): Promise<SavedComparison | null> {
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)) {
    return null;
  }
  const client = await ownerClient();
  const { data, error } = await client
    .from("saved_etf_comparison")
    .select("id,title,as_of_date,saved_at,listing_ids,items_snapshot,schema_version")
    .eq("id", id)
    .maybeSingle();
  if (error || !data || !validSavedItems(data.items_snapshot)) return null;
  if (data.listing_ids.length !== data.items_snapshot.length) return null;
  return data as SavedComparison;
}
