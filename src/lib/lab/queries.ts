import "server-only";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LAB_ROW_LIMIT, buildLabView, type LabPriceRow, type LabView } from "./view";

export type LabResult =
  | { status: "ready"; view: LabView }
  | { status: "error"; message: string };

const LAB_ERROR =
  "No se pudo consultar el laboratorio. La tabla puede no estar disponible o el acceso requiere revisión.";

// Read-only: one SELECT on lab_price_index. RLS is the access boundary; the owner filter
// is defence in depth. No official financial table is read or written here.
export async function getLabPriceIndex(): Promise<LabResult> {
  await connection();
  const client = await createClient();
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) redirect("/login");

  try {
    const { data, error } = await client.from("lab_price_index")
      .select("series_code,as_of_date,index_value,unit,is_synthetic,source_label")
      .eq("owner_user_id", user.id)
      .order("series_code", { ascending: true })
      .order("as_of_date", { ascending: false })
      .limit(LAB_ROW_LIMIT + 1);
    if (error) return { status: "error", message: LAB_ERROR };
    return { status: "ready", view: buildLabView((data ?? []) as LabPriceRow[]) };
  } catch {
    return { status: "error", message: LAB_ERROR };
  }
}
