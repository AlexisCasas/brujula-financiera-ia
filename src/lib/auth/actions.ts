"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LOGIN_PATH, safeNextPath } from "./access";

export type LoginState = { error: string | null };

// One generic message for every failure: wrong password, unknown user or not the owner.
const INVALID_CREDENTIALS = "Credenciales inválidas.";

export async function signIn(_previous: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!email || !password) return { error: "Ingresa tu correo y tu contraseña." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { error: INVALID_CREDENTIALS };

  // Only the registered owner may hold a session in this app (RLS lets a user read only their own row).
  const { data: owner } = await supabase.from("app_owner").select("user_id").maybeSingle();
  if (!owner) {
    await supabase.auth.signOut();
    return { error: INVALID_CREDENTIALS };
  }

  redirect(next);
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(LOGIN_PATH);
}
