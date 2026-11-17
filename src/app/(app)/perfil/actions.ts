"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseInvestorAnswers } from "@/lib/investor-profile";

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

export async function saveInvestorProfileAction(form: FormData): Promise<void> {
  if (form.get("privacy_acknowledged") !== "yes") redirect("/perfil?notice=privacy");
  const raw: Record<string, unknown> = {};
  for (const key of [
    "horizon", "withdrawal", "emergency_fund", "income_stability",
    "capital_dependency", "high_cost_debt", "drop_10", "drop_20",
    "drop_30", "emotional_reaction", "goal", "experience",
  ]) {
    const value = form.get(key);
    raw[key] = typeof value === "string" ? value : null;
  }

  const parsed = parseInvestorAnswers(raw);
  if (!parsed.ok) redirect("/perfil?notice=incomplete");

  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) redirect("/login");

  // PostgreSQL validates every coded answer and calculates the authoritative
  // versioned score. No score, owner ID or personal free text comes from browser.
  const { data, error } = await client.rpc("save_investor_profile", {
    p_answers: parsed.answers,
  });

  if (error || typeof data !== "string" || !UUID.test(data)) {
    redirect("/perfil?notice=save");
  }
  redirect("/perfil?id=" + data);
}
