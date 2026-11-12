import type { AuthError } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types/auth";

const USER_ROLES: readonly UserRole[] = ["staff", "parent", "admin"];

/**
 * Home de cada rol. `staff`/`admin` van a la home del staff y `parent` al feed
 * de familia (hoy 404 por diseño, SPEC 09).
 */
export function roleHomePath(role: UserRole): "/" | "/familia/feed" {
  return role === "parent" ? "/familia/feed" : "/";
}

/**
 * Solo acepta rutas internas. Descarta vacíos, URLs absolutas, protocol-relative
 * (`//evil.com`), backslashes y las pantallas de autenticación.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/") || value.startsWith("//")) return null;
  if (value.includes("\\")) return null;

  const [path] = value.split(/[?#]/);
  if (path === "/login" || path === "/activate-account") return null;

  return value;
}

/**
 * Traduce los errores de Supabase Auth a los mensajes visibles de la app.
 */
export function mapAuthError(error: AuthError | null): string {
  if (!error) return "No pudimos iniciar sesión. Intentá de nuevo.";

  if (error.code === "email_not_confirmed") {
    return "Confirmá tu email antes de ingresar.";
  }

  if (error.code === "over_request_rate_limit" || error.status === 429) {
    return "Demasiados intentos. Esperá un momento.";
  }

  if (error.code === "invalid_credentials" || error.status === 400) {
    return "Email o contraseña incorrectos.";
  }

  return "No pudimos iniciar sesión. Intentá de nuevo.";
}

export function roleLabel(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Dirección";
    case "parent":
      return "Familia";
    default:
      return "Maestra";
  }
}

/**
 * Normaliza el rol que viene de la base o de `app_metadata`. No se usa
 * `user_metadata` para autorizar: solo `public.users` y `app_metadata`.
 */
export function parseUserRole(value: unknown): UserRole | null {
  if (typeof value !== "string") return null;

  return (USER_ROLES as readonly string[]).includes(value)
    ? (value as UserRole)
    : null;
}
