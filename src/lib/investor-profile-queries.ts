import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  InvestorAnswers, ProfileStatus, ResultReason, RiskBand,
} from "./investor-profile";

export type InvestorProfileSnapshot = {
  id: string;
  questionnaire_version: string;
  scoring_version: string;
  answers: InvestorAnswers;
  profile_status: ProfileStatus;
  capacity_score: number | null;
  capacity_band: RiskBand | null;
  tolerance_score: number;
  tolerance_band: RiskBand;
  overall_band: RiskBand | null;
  result_reason: ResultReason;
  created_at: string;
};

export type InvestorProfileHistory =
  | { status: "ready"; rows: InvestorProfileSnapshot[] }
  | { status: "error"; rows: []; message: string };

export async function listInvestorProfiles(): Promise<InvestorProfileHistory> {
  await connection();
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) redirect("/login");

  const { data, error } = await client
    .from("investor_profile_snapshot")
    .select("id,questionnaire_version,scoring_version,answers,profile_status,capacity_score,capacity_band,tolerance_score,tolerance_band,overall_band,result_reason,created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    return {
      status: "error",
      rows: [],
      message: "No fue posible consultar el historial del perfil. La migración BF-039 puede estar pendiente.",
    };
  }
  return { status: "ready", rows: (data ?? []) as InvestorProfileSnapshot[] };
}
