import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sesión requerida." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.objective !== "string" || typeof body.horizon_years !== "string") {
    return NextResponse.json({ error: "Datos de objetivo incompletos." }, { status: 400 });
  }
  const horizon = Number(body.horizon_years);
  const initial = body.initial_amount === "" || body.initial_amount == null ? null : Number(body.initial_amount);
  const periodic = body.periodic_amount === "" || body.periodic_amount == null ? null : Number(body.periodic_amount);
  const { data, error } = await client.rpc("save_investor_goal", {
    p_objective: body.objective,
    p_objective_detail: typeof body.objective_detail === "string" ? body.objective_detail.slice(0,500) : "",
    p_horizon_years: horizon,
    p_initial_amount: initial,
    p_periodic_amount: periodic,
    p_periodicity: typeof body.periodicity === "string" ? body.periodicity : "monthly",
    p_currency: body.currency === "USD" ? "USD" : "PEN",
    p_priority: Number(body.priority) || 1,
  });
  if (error) return NextResponse.json({ error: "No se pudo guardar el objetivo." }, { status: 400 });
  return NextResponse.json({ id: data });
}
