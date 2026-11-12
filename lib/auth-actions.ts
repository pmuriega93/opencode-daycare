"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mapAuthError, parseUserRole, roleHomePath, safeNextPath } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import type { LoginState } from "@/lib/types/auth";

const PENDING_MESSAGE =
  "Tu cuenta todavía no está vinculada a una guardería.";

export async function signIn(
  prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(String(formData.get("next") ?? ""));

  if (!email || !password) {
    return { error: "Ingresá tu email y contraseña." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: mapAuthError(error) };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, status")
    .eq("id", data.user.id)
    .maybeSingle<{ role: string | null; status: string | null }>();

  // Sin perfil o con status `pending` la cuenta no está vinculada a una
  // guardería: no puede operar, así que se descarta la sesión recién creada.
  if (!profile || profile.status !== "active") {
    await supabase.auth.signOut();
    return { error: PENDING_MESSAGE };
  }

  const role =
    parseUserRole(profile.role) ??
    parseUserRole(data.user.app_metadata?.role) ??
    "staff";

  revalidatePath("/", "layout");
  redirect(next ?? roleHomePath(role));
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
