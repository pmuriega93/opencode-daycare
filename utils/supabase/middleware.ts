import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { parseUserRole, roleHomePath } from "@/lib/auth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const PUBLIC_PATHS = new Set(["/login", "/activate-account"]);

function redirectTo(url: URL, supabaseResponse: NextResponse) {
  const response = NextResponse.redirect(url);

  // Un redirect sin las cookies refrescadas pierde la sesión (logouts
  // aleatorios). Se copian también los headers anti-cache de `setAll`.
  supabaseResponse.cookies.getAll().forEach(({ name, value, ...options }) => {
    response.cookies.set(name, value, options);
  });
  response.headers.set("Cache-Control", "private, no-store");

  return response;
}

/**
 * Refresca la sesión de Supabase, propaga las cookies actualizadas y protege
 * las rutas. La llama `proxy.ts` en cada request.
 *
 * - Sin sesión o con perfil `pending` (sin `daycare_id`): solo pasan
 *   `/login` y `/activate-account`; el resto va a `/login?next=<ruta>`.
 * - Con sesión utilizable: `/login` y `/activate-account` van al home del rol.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl!, supabaseKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        // Sin estos headers un CDN podría cachear la respuesta con la sesión.
        Object.entries(headers).forEach(([key, value]) =>
          supabaseResponse.headers.set(key, value),
        );
      },
    },
  });

  // No ejecutes código entre createServerClient y getClaims: si el refresh
  // token se consume dos veces, Supabase revoca la sesión.
  const { data } = await supabase.auth.getClaims();

  const claims = data?.claims ?? null;
  const role = parseUserRole(claims?.app_metadata?.role) ?? "staff";
  const isPending = !claims || !claims.app_metadata?.daycare_id;
  const { pathname, search } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.has(pathname);

  if (isPending) {
    if (isPublicPath) return supabaseResponse;

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", `${pathname}${search}`);
    }

    return redirectTo(loginUrl, supabaseResponse);
  }

  if (isPublicPath) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = roleHomePath(role);
    homeUrl.search = "";

    return redirectTo(homeUrl, supabaseResponse);
  }

  return supabaseResponse;
}
