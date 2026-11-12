# SPEC 09 — Autenticación real y protección de rutas

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 03, SPEC 08
> **Fecha:** 2026-11-12
> **Objetivo:** Reemplazar el login mock por autenticación real con email y contraseña contra Supabase, agregar logout y proteger todas las rutas salvo `/login` y `/activate-account`, mostrando el perfil real del usuario en el sidebar.

## Por qué existe esta spec

SPEC 03 dejó `/login` y `/activate-account` como pantallas estáticas: el botón navegaba a `/` sin validar credenciales. SPEC 08 creó `public.users`, los enums, el trigger y el staff demo `caro@opendaycare.com`, y verificó el login contra `/auth/v1/token`, pero dejó explícitamente fuera "la UI de login real, la redirección por rol y la conexión de la app a Supabase".

Hoy cualquier ruta es pública y el sidebar muestra "Caro Giménez" hardcodeado. Esta spec cierra ese hueco: la app autentica contra Supabase Auth, la sesión vive en cookies, `proxy.ts` protege las rutas y el sidebar lee el perfil real.

El patrón se verificó en Context7 con la documentación actual de Supabase para Next.js 16: `proxy.ts` llama `getClaims()` antes de generar la respuesta y redirige; el login y el logout son Server Actions con `signInWithPassword` y `signOut`; las cookies las administra `@supabase/ssr`. No se usa `getSession()` ni el `user` de la cookie para autorizar.

## Scope

**In:**

- `lib/types/auth.ts` — agrega `UserRole`, `AuthProfile` y `LoginState`; `Invitation` queda igual.
- `lib/auth.ts` (nuevo) — helpers puros: `roleHomePath`, `safeNextPath`, `mapAuthError`, `roleLabel`.
- `lib/auth-server.ts` (nuevo) — `getCurrentProfile()` con `cache()`, `getClaims()` y una lectura RLS de `public.users` + `public.daycares`; fallback a los claims si la lectura falla.
- `lib/auth-actions.ts` (nuevo) — Server Actions `signIn` y `signOut`.
- `utils/supabase/middleware.ts` — `updateSession` redirige según sesión, rol y `pending`, y copia las cookies al redirect.
- `proxy.ts` — el matcher excluye `_next/` (incluye `_next/mcp` y HMR) además de los assets.
- `components/ui/FormField.tsx` — props aditivas `name` y `autoComplete`.
- `components/ui/Button.tsx` — prop `disabled` y estilos.
- `components/auth/LoginForm.tsx` — client component con `useActionState`, error inline, botón "Ingresando…" e input oculto `next`.
- `app/login/page.tsx` — lee `searchParams.next` dentro de `<Suspense>` y lo pasa al form.
- `components/layout/StaffLayout.tsx` (nuevo) — wrapper de servidor que resuelve el perfil dentro de `<Suspense>` y renderiza `AppLayout`.
- `components/layout/AppLayout.tsx`, `Sidebar.tsx`, `Drawer.tsx` — reciben `profile: AuthProfile | null`; el sidebar muestra nombre, rol y guardería reales, con skeleton mientras carga.
- `app/page.tsx`, `app/kids/page.tsx`, `app/kids/[id]/page.tsx` — usan `StaffLayout` en vez de `AppLayout`.
- `AGENTS.md` y `supabase/README.md` — documentan el login real, la protección y el perfil.
- `.env` — se verifica que `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` apunten al proyecto; ya están definidas y no se commitean.
- Comportamiento: login real, logout real, sesión persistente, redirects por rol y `?next=`, bloqueo de usuarios `pending`.

**Out of scope (para specs futuras):**

- Activación real de cuenta (`/activate-account` sigue mock; requiere invitaciones).
- Signup, recuperación de contraseña, OAuth, magic link, MFA y confirmación de email.
- `/familia/feed` y las pantallas de familia.
- Conectar feed, niños, publicaciones, reacciones o comentarios a Supabase.
- Edición de perfil, avatar, "Mi cuenta" y administración de usuarios/roles.
- Migraciones, cambios de schema, RLS, triggers o seeds.
- Tipos generados de la base y `supabase gen types`.
- Tests automatizados (no hay infraestructura).
- Cambios visuales al mockup de login más allá de los estados de error y carga.

## Data model

No se crean tablas, columnas, enums, políticas ni migraciones. Se leen `public.users` y `public.daycares` con las políticas existentes (`users_select_own` y `daycares_select_own`).

```ts
// lib/types/auth.ts
export type UserRole = "staff" | "parent" | "admin";

export type AuthProfile = {
  fullName: string;
  role: UserRole;
  daycareName: string | null;
};

export type LoginState = { error: string | null };

// Invitation no cambia.
```

```ts
// lib/auth.ts (puro: lo puede importar el proxy y el cliente)

// staff | admin → "/"
// parent → "/familia/feed"
roleHomePath(role: UserRole): "/" | "/familia/feed";

// "/kids?x=1" → "/kids?x=1"
// null, "", "//evil.com", "https://…", "/login", "/activate-account" → null
safeNextPath(value: string | null | undefined): string | null;

// invalid_credentials / status 400 → "Email o contraseña incorrectos."
// email_not_confirmed → "Confirmá tu email antes de ingresar."
// over_request_rate_limit / status 429 → "Demasiados intentos. Esperá un momento."
// default → "No pudimos iniciar sesión. Intentá de nuevo."
mapAuthError(error: AuthError | null): string;

// staff → "Maestra"; admin → "Dirección"; parent → "Familia"
roleLabel(role: UserRole): string;
```

```ts
// lib/auth-server.ts
export const getCurrentProfile: () => Promise<AuthProfile>;
// 1. createClient() + auth.getClaims(); sin claims → redirect("/login")
// 2. supabase.from("users")
//      .select("full_name, role, daycares(name)")
//      .eq("id", claims.sub)
//      .single()
// 3. si la lectura falla, fallback a claims.user_metadata.full_name / email
//    + claims.app_metadata.role, daycareName: null
// 4. cache() de React para deduplicar por request
```

```ts
// lib/auth-actions.ts
"use server";

export async function signIn(
  prev: LoginState,
  formData: FormData,
): Promise<LoginState>;
// valida email, password y next; signInWithPassword; lee role/status de public.users.
// pending → signOut + { error: "Tu cuenta todavía no está vinculada a una guardería." }
// éxito → revalidatePath("/", "layout") + redirect(next ?? roleHomePath(role))
// error → { error: mapAuthError(error) }

export async function signOut(): Promise<void>;
// signOut() + revalidatePath("/", "layout") + redirect("/login")
```

Reglas del proxy:

```text
sin claims, o claims sin app_metadata.daycare_id (pending):
  /login, /activate-account          → deja pasar
  cualquier otra ruta                → /login?next=<pathname + search>

con claims y daycare_id:
  /login, /activate-account          → home del rol
  cualquier otra ruta                → deja pasar
```

- `updateSession` copia las cookies de `supabaseResponse` al `NextResponse.redirect` y agrega `Cache-Control: private, no-store`.
- `next` no se agrega cuando la ruta original es `/`.

Sidebar:

```ts
// AppLayout / Sidebar / Drawer
type ProfileProps = { profile: AuthProfile | null };
// null = skeleton del primer render dentro del Suspense
// initial = primera letra de fullName en mayúscula
// segunda línea = `${roleLabel(role)} · ${daycareName}` (truncate) o roleLabel si no hay guardería
// subtítulo del header = daycareName
```

## Implementation plan

1. **Tipos y helpers puros.** Agregar `UserRole`, `AuthProfile` y `LoginState` a `lib/types/auth.ts`; crear `lib/auth.ts` con `roleHomePath`, `safeNextPath`, `mapAuthError` y `roleLabel`. Test: `npm run build` sigue pasando.
2. **Server Actions.** Crear `lib/auth-actions.ts` con `signIn` y `signOut`. Test: la acción compila y devuelve `{ error }` con credenciales vacías o inválidas; el flujo completo se prueba en el paso 4.
3. **Primitivas de UI.** Agregar `name` y `autoComplete` a `FormField`; agregar `disabled` y `disabled:opacity-60 disabled:pointer-events-none` a `Button`. Test: los modales de crear publicación, agregar niño y vincular padre siguen funcionando.
4. **Login real.** Reescribir `LoginForm` como client component con `useActionState`, input oculto `next`, error inline (`role="alert"`, fondo `bg-peach`, texto `text-accent-2`) y botón deshabilitado con "Ingresando…". En `app/login/page.tsx`, leer `searchParams.next` dentro de `<Suspense>` y pasarlo como `nextPath`. Test: contraseña incorrecta → error inline; `caro@opendaycare.com` / `opendaycare123` → `/`; recargar mantiene la sesión. Probar `pending` con un usuario temporal creado por SQL y borrado al terminar.
5. **Protección de rutas.** En `updateSession`, aplicar las reglas del proxy y copiar cookies/headers al redirect. En `proxy.ts`, ampliar el matcher para excluir `_next/`. Test: sin sesión, `/`, `/kids` y `/kids/[id]` → `/login?next=...`; `/login` y `/activate-account` pasan; con sesión, `/login` → `/`; el refresh de token conserva la sesión.
6. **Perfil real y `StaffLayout`.** Crear `lib/auth-server.ts` y `components/layout/StaffLayout.tsx`; pasar `profile` por `AppLayout` → `Sidebar`/`Drawer`; reemplazar los datos hardcodeados de Caro y "Sala Soles" por `fullName`, `roleLabel` y `daycareName`; mostrar skeleton cuando `profile` es `null`; cambiar las tres páginas a `StaffLayout`. Test: el sidebar muestra `Caro Giménez`, "Maestra · Guardería Sala Soles" y la inicial "C"; el drawer mobile también.
7. **Logout real.** Reemplazar el `<a href="/login">` del sidebar por un `<form action={signOut}>` con el mismo botón. Test: desktop y drawer cierran sesión, van a `/login` y `/` vuelve a redirigir al login.
8. **Documentación.** Actualizar `AGENTS.md` ("Estado actual" y sección Supabase: auth real, proxy, `getClaims`, perfil) y `supabase/README.md` (la app ya usa el staff demo para el login real).
9. **Verificación visual.** Playwright MCP en `.playwright-mcp/`: `/login` con error y con loading en ≥1024px y 375px; sidebar con el perfil real en desktop y drawer. Comparar contra `login.dc.html` y el layout de SPEC 01.

## Acceptance criteria

- [x] `npm run build` pasa sin errores.
- [x] `npx eslint app components lib utils proxy.ts` pasa sin errores.
- [x] `.env` tiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` reales y no se commitea.
- [x] `/login` sin sesión muestra el form del mockup con `caro@opendaycare.com` precargado y la contraseña vacía.
- [x] Con `caro@opendaycare.com` / `opendaycare123` el login crea sesión y redirige a `/`.
- [x] Con contraseña incorrecta queda en `/login`, muestra "Email o contraseña incorrectos." y no crea sesión.
- [x] Con email o contraseña vacíos muestra "Ingresá tu email y contraseña." y no llama a Supabase.
- [x] Mientras la acción corre, el botón está deshabilitado y dice "Ingresando…".
- [x] Recargar `/` después del login mantiene la sesión.
- [x] Sin sesión, `/`, `/kids` y `/kids/[id]` redirigen a `/login?next=<ruta>`.
- [x] Sin sesión, `/login` y `/activate-account` son accesibles.
- [x] Después de un redirect desde `/kids`, el login vuelve a `/kids`.
- [x] `?next=//evil.com`, `?next=https://…` y `?next=/login` se ignoran y se va al home del rol.
- [x] Con sesión, `/login` y `/activate-account` redirigen a `/`.
- [x] `staff`/`admin` van a `/`; `parent` va a `/familia/feed` (404 por diseño).
- [x] Un usuario `pending` (sin `daycare_id`) no obtiene sesión y ve "Tu cuenta todavía no está vinculada a una guardería."
- [x] El sidebar muestra `Caro Giménez`, "Maestra · Guardería Sala Soles" (truncado si no entra) y la inicial "C", leídos de `public.users`/`public.daycares`.
- [x] El sidebar no contiene los strings hardcodeados "Caro Giménez", "Maestra · Soles" ni "Sala Soles".
- [x] Mientras el perfil carga, el sidebar muestra un skeleton y no datos falsos.
- [x] El botón de cerrar sesión del sidebar (desktop y drawer) ejecuta `signOut`, borra las cookies y va a `/login`.
- [x] Después del logout, `/` redirige a `/login`.
- [x] `updateSession` usa `getClaims()`; no hay `getSession()` ni lectura del `user` de la cookie para autorizar.
- [x] El redirect del proxy conserva las cookies refrescadas y agrega `Cache-Control: private, no-store`.
- [x] El matcher del proxy excluye `_next/` (incluye `_next/mcp` y HMR) y los assets.
- [x] La publishable key es la única clave en el cliente; no aparece `service_role`/`sb_secret_`.
- [x] No se agregaron dependencias, migraciones ni tipos generados.
- [x] El feed, `/kids` y los modales siguen usando mocks y funcionan igual.
- [x] `/activate-account` sigue siendo el mock de SPEC 03 (no crea cuentas).
- [x] `AGENTS.md` y `supabase/README.md` reflejan el login real, la protección y el perfil.
- [x] En 1024px y 375px el login con error/loading se ve como el mockup y no hay scroll horizontal.
- [x] Las capturas de Playwright quedan en `.playwright-mcp/`.

## Decisions

- **Sí:** Server Actions + `@supabase/ssr` server client — las cookies se escriben en el servidor y no hay tokens manejados por JS del cliente.
- **Sí:** `getClaims()` en el proxy y en `getCurrentProfile` — verifica la firma del JWT y evita `getSession()`/`getUser()` para autorizar.
- **Sí:** el proxy protege todo salvo `/login` y `/activate-account` — las rutas futuras quedan protegidas automáticamente.
- **Sí:** `?next=` con validación de ruta interna — el usuario vuelve a donde quería ir sin abrir redirects externos.
- **Sí:** home por rol (`staff`/`admin` → `/`, `parent` → `/familia/feed`) — el rol sale de `public.users`, no de un selector en el login.
- **Sí:** `pending` se bloquea en el login (con `signOut`) y el proxy lo trata como sesión no usable — cierra el caso de una cuenta sin guardería.
- **Sí:** error inline + botón "Ingresando…" — el mockup no define errores; es el estado mínimo verificable.
- **Sí:** perfil real en el sidebar con `cache()` y fallback a los claims — evita un loop de redirects si la lectura de `public.users` falla.
- **Sí:** logout como Server Action en un `<form>` — funciona en el sidebar de escritorio y en el drawer sin estado extra.
- **Sí:** mantener `caro@opendaycare.com` precargado — comodidad de demo y fidelidad a SPEC 03.
- **Sí:** excluir `_next/` del matcher — evita romper `/_next/mcp` y el HMR del dev server.
- **Sí:** `StaffLayout` como wrapper de servidor en vez de un route group — menos churn y `active` sigue siendo una prop explícita.
- **No:** browser client para el login — duplicaría el manejo de sesión y expondría tokens al JS.
- **No:** `getSession()` o el `user` de la cookie como autorización.
- **No:** activación/signup, recuperación de contraseña, OAuth o MFA.
- **No:** migraciones, tipos generados o cambios de RLS.
- **No:** conectar feed, niños o publicaciones a Supabase.
- **No:** selector de rol en el login.
- **No:** nuevas dependencias.
- **No:** tests automatizados.

## Risks

| Riesgo                                                                                  | Mitigación                                                                                                              |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `cookies()` o `searchParams` fuera de `<Suspense>` rompen el build con Cache Components | `StaffLayout` y `LoginFormWithParams` van dentro de `<Suspense>`; el build es la verificación                           |
| El redirect del proxy pierde las cookies refrescadas y produce logouts aleatorios       | Copiar las cookies de `supabaseResponse` al redirect y agregar `Cache-Control: private, no-store`                       |
| `redirect()` dentro de un `try/catch` se traga la excepción                             | Llamar `redirect()` fuera del `catch`                                                                                   |
| `generateStaticParams` de `/kids/[id]` convive con una página dinámica                  | Se mantiene; solo lista los ids mock. Si el build lo rechaza, se quita en ese mismo paso                                |
| La lectura de `public.users`/`public.daycares` falla y el sidebar queda vacío           | Fallback a `claims.user_metadata.full_name`/email y `app_metadata.role`, con `daycareName: null`                        |
| Un `parent` aterriza en `/familia/feed`, que hoy es 404                                 | Aceptado por decisión; no hay usuario parent demo todavía                                                               |
| El fixture de `pending` toca la base remota                                             | Usuario temporal creado y borrado con `execute_sql`; no es una migración y el `ON DELETE CASCADE` limpia `public.users` |
| Los cambios en `FormField`/`Button` afectan los modales existentes                      | Props aditivas; verificar crear publicación, agregar niño y vincular padre                                              |
| El matcher del proxy bloquea `/_next/mcp` o el HMR                                      | Excluir `_next/` completo                                                                                               |
| El proveedor email/password está deshabilitado en el proyecto                           | SPEC 08 ya verificó el login contra `/auth/v1/token`; si se deshabilita, se activa en el dashboard                      |
| La password demo es pública                                                             | Aceptado en SPEC 08; es un proyecto de demo                                                                             |

## What is **not** in this spec

- Activación real de cuenta y signup.
- Recuperación de contraseña, OAuth, magic link, MFA y confirmación de email.
- `/familia/feed` y las pantallas de familia.
- Conectar feed, niños, publicaciones, reacciones o comentarios a Supabase.
- Edición de perfil, avatar, "Mi cuenta" y administración de usuarios/roles.
- Migraciones, cambios de schema, RLS, triggers, seeds y tipos generados.
- Tests automatizados.
- Rediseño visual del login.

Cada uno de esos puntos, si llega, va en su propia spec.
