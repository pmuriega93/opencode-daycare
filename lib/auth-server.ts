import { cache } from "react";
import { redirect } from "next/navigation";
import { parseUserRole } from "@/lib/auth";
import { createClient } from "@/utils/supabase/server";
import type { AuthProfile } from "@/lib/types/auth";

type ProfileRow = {
  full_name: string | null;
  role: string | null;
  daycares: { name: string | null } | { name: string | null }[] | null;
};

function daycareNameFrom(daycares: ProfileRow["daycares"]): string | null {
  const row = Array.isArray(daycares) ? daycares[0] : daycares;

  return row?.name?.trim() || null;
}

/**
 * Perfil del usuario autenticado para el sidebar. Valida la sesión con
 * `getClaims()` (nunca con `getSession()`) y lee `public.users` +
 * `public.daycares` con RLS. Si la lectura falla, cae a los claims para no
 * dejar el layout vacío ni entrar en un loop de redirects.
 *
 * `cache()` deduplica la lectura entre Server Components del mismo request.
 */
export const getCurrentProfile = cache(async (): Promise<AuthProfile> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data) {
    redirect("/login");
  }

  const claims = data.claims;
  const userMetadata = claims.user_metadata as Record<string, unknown> | undefined;
  const appMetadata = claims.app_metadata as Record<string, unknown> | undefined;

  const claimFullName =
    typeof userMetadata?.full_name === "string"
      ? userMetadata.full_name.trim()
      : "";

  const fallback: AuthProfile = {
    fullName: claimFullName || claims.email || "Usuario",
    role: parseUserRole(appMetadata?.role) ?? "staff",
    daycareName: null,
  };

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("full_name, role, daycares(name)")
    .eq("id", claims.sub)
    .single<ProfileRow>();

  if (profileError || !profile) return fallback;

  return {
    fullName: profile.full_name?.trim() || fallback.fullName,
    role: parseUserRole(profile.role) ?? fallback.role,
    daycareName: daycareNameFrom(profile.daycares),
  };
});
