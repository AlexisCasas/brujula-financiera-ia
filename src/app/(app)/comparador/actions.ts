"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

function comparisonUrl(ids: readonly string[], message: string): string {
  const query = new URLSearchParams();
  for (const id of ids.slice(0, 5)) query.append("listing", id);
  query.set("notice", message);
  return "/comparador?" + query.toString();
}

export async function saveComparisonAction(form: FormData): Promise<void> {
  const rawIds = form.getAll("listing");
  const ids = rawIds.filter((id): id is string => typeof id === "string");
  if (ids.length < 2 || ids.length > 5 || new Set(ids).size !== ids.length
      || ids.some((id) => !UUID.test(id))) {
    redirect(comparisonUrl(ids, "selection"));
  }

  const rawTitle = form.get("title");
  const title = typeof rawTitle === "string" ? rawTitle.trim() : "";
  if (title.length > 120) redirect(comparisonUrl(ids, "title"));

  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) redirect("/login");

  // All snapshot generation, owner checks and atomic insert happen inside
  // the PostgreSQL SECURITY DEFINER function. We never send metric values
  // from the browser, so a client cannot falsify stored prices or sources.
  const { data, error } = await client.rpc("save_etf_comparison", {
    p_listing_ids: ids,
    p_title: title || null,
  });

  if (error || typeof data !== "string" || !UUID.test(data)) {
    redirect(comparisonUrl(ids, "save"));
  }
  redirect("/comparador/guardadas/" + data);
}
