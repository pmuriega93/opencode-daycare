# SPEC 03 — Login y activación de cuenta `/login` + `/activate-account`

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-30
> **Objetivo:** Implementar las pantallas `references/pantallas/login.dc.html` y `references/pantallas/activar-cuenta.dc.html` en `/login` y `/activate-account` con datos mock, sin selector de rol ni autenticación real, navegando a `/` (feed del staff) y `/familia/feed` respectivamente.

## Scope

**In:**

- `app/login/page.tsx` — login a dos columnas (panel degradado + form), server component estático, sin `AppLayout`.
- `app/activate-account/page.tsx` — activación de cuenta en columna única centrada (max-w 440px), server component estático, sin `AppLayout`.
- `components/auth/` — componentes de dominio: `BrandPanel` (panel degradado con logo, headline y footer), `LoginForm` (campos + botón + link a activar), `ActivationForm` (icono, card de invitación, campos, consentimiento, botón + link a login).
- `components/ui/FormField.tsx` — primitiva label + input con el estilo compartido de las dos pantallas.
- `lib/types/auth.ts` + `lib/mocks/auth.ts` — datos mock (`loginDefaults`, `invitation`).
- `app/globals.css` — token nuevo `--color-canvas-soft: #FBF4EC` (fondo de ambos mockups, más claro que el canvas `#F6ECDF`).
- Sin selector "INGRESO COMO" ni botones "Personal/Familia": eliminado a pedido del usuario.
- Navegación: "Iniciar sesión" → `/`; "Activá tu cuenta" → `/activate-account`; "Activar mi cuenta" → `/familia/feed` (404 hoy); "Iniciar sesión" (footer de activar) → `/login`.
- "¿Olvidaste tu contraseña?" como texto sin link (no hay mockup de recuperación).
- Responsive: `< lg` oculta el panel degradado y centra el form con un logo compacto arriba; `/activate-account` solo adapta paddings.
- Actualización de la tabla de mapeo de `AGENTS.md` (login y activar-cuenta → rutas en inglés).

**Out of scope (para specs futuras):**

- Autenticación, backend, base de datos, sesiones.
- Validación de credenciales y estados de error (el mockup no los define).
- Recuperación de contraseña.
- Feed de familia `/familia/feed` y el resto de las pantallas del mapeo (404 por diseño).
- Activación real de la cuenta: el botón navega y nada más.

## Data model

```ts
// lib/types/auth.ts
export type Invitation = {
  code: string;        // "7K4P9"
  email: string;       // "lucia.fernandez@gmail.com"
  password: string;    // "contraseña"
  kidName: string;     // "Mateo"
  roomLabel: string;   // "Sala Soles"
  initial: string;     // "M"
  avatarBg: string;    // "#A9D9E8"
  avatarText: string;  // "#1F7A93"
  consentText: string; // "Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app."
};
```

```ts
// lib/mocks/auth.ts
import type { Invitation } from "../types/auth";

export const loginDefaults = { email: "caro@opendaycare.com" };
export const invitation: Invitation = { /* valores del mockup */ };
```

- La invitación es self-contained: no importa de `lib/mocks/kids.ts`. Los valores coinciden con Mateo (initial "M", `#A9D9E8`/`#1F7A93`, Soles), pero queda desacoplada hasta que haya backend.
- El copy del panel de marca ("El día de cada niño…", "🌿 Guardería Sala Soles") vive como strings en `BrandPanel`: es copy de marketing, no dato de dominio (misma decisión que SPEC 01 con labels visibles).

## Implementation plan

1. Token `--color-canvas-soft: #FBF4EC` en `app/globals.css`.
2. `lib/types/auth.ts` + `lib/mocks/auth.ts` con los valores exactos del mockup.
3. `components/ui/FormField.tsx`: label uppercase 12px/tracking .7px/muted + input rounded-14, borde 1.5px `line-input`, fondo blanco, padding 14/16, 15px. Props: `label`, `type`, `defaultValue`, `placeholder`, `inputClassName`.
4. `components/auth/BrandPanel.tsx`: gradiente `155deg #F6A98E→#F2937A→#EC7E62`, dos círculos decorativos, logo (IconBox + `IconSun` ya existente + wordmark Fredoka), h1 42px, subtítulo, footer. `hidden lg:flex`.
5. `components/auth/LoginForm.tsx`: logo compacto `< lg` centrado, h2 "Iniciar sesión" + subtítulo, FormField email (default `loginDefaults.email`), FormField password (placeholder `••••••••`), "¿Olvidaste tu contraseña?" (span, `accent-2`, sin link), Button primary → `/`, link "Activá tu cuenta" → `/activate-account`.
6. `app/login/page.tsx`: grid `lg:grid-cols-[1.05fr_1fr]` sobre `bg-canvas-soft`, `BrandPanel` + `LoginForm` (max-w 392px); metadata con title.
7. `components/auth/ActivationForm.tsx`: IconBox 58px gradiente `#F8C3A8→#F2937A` con `IconSun`, h1 "Bienvenida a OpenDayCare", card de invitación (Avatar + "Te invitaron a seguir a" / "Mateo · Sala Soles"), FormFields código (Fredoka 18px, tracking 3px, bold) / email / password (borde `#F2A78E` fiel al mockup), consentimiento: `<input type="checkbox" defaultChecked>` estilizado con peer-checked sobre card `#FBF1D8`, texto `#8A7234`, box `#5FB97E`; Button primary → `/familia/feed`; link "Iniciar sesión" → `/login`.
8. `app/activate-account/page.tsx`: columna única centrada sobre `bg-canvas-soft`; metadata con title.
9. Actualizar tabla de mapeo de `AGENTS.md`.
10. Verificación visual con Playwright MCP (`.playwright-mcp/`): ≥1024px side-by-side contra los dos mockups; chequeo en 768px y 375px.

## Acceptance criteria

- [x] `npm run build` pasa sin errores.
- [x] `npx eslint app components lib` pasa sin errores.
- [x] Archivos exactamente donde dice el scope; ningún dato literal en componentes (todo por props desde `lib/mocks/auth.ts`).
- [x] `/login` en ≥1024px visualmente indistinguible de `login.dc.html`, excepto el selector Personal/Familia y su label, eliminados a pedido.
- [x] No aparece "INGRESO COMO" ni los botones "Personal"/"Familia".
- [x] Email editable prefijado con `caro@opendaycare.com`; contraseña vacía con placeholder `••••••••`.
- [x] "¿Olvidaste tu contraseña?" con el look del mockup pero no navega.
- [x] Botón "Iniciar sesión" navega a `/`.
- [x] "Activá tu cuenta" navega a `/activate-account`.
- [x] `/activate-account` en ≥1024px visualmente indistinguible de `activar-cuenta.dc.html` (icono 58px, card de invitación con avatar M, código `7K4P9` en Fredoka tracking 3px, consentimiento tildado).
- [x] "Activar mi cuenta" navega a `/familia/feed` (404 hoy, por diseño).
- [x] "Iniciar sesión" (footer de activar) navega a `/login`.
- [x] El consentimiento es un checkbox real, tildado por defecto, destildable, y no gatea el botón.
- [x] Ninguna de las dos páginas renderiza sidebar/drawer (no usan `AppLayout`).
- [x] En <1024px `/login` oculta el panel, muestra el logo compacto y centra el form; en 375px no hay scroll horizontal; `/activate-account` legible en 375px.
- [x] Ambas páginas prerenderizan como server components estáticos, sin boundary (no usan `params`/`searchParams`/`cookies`).
- [x] Tabla de mapeo de `AGENTS.md` actualizada con `/login` y `/activate-account`.

## Decisions

- **Sí:** login navega a `/` — la home (feed staff) ya existe; con auth real el backend decidirá el destino.
- **Sí:** rutas en inglés `/login` + `/activate-account` — consistente con `/kids` (SPEC 02); el mapeo de `AGENTS.md` se actualiza.
- **Sí:** form estático navegable, sin validación — el mockup no define estados de error; no se inventa UI.
- **Sí:** "¿Olvidaste tu contraseña?" como texto sin link — no hay pantalla de recuperación entre los 15 mockups.
- **Sí:** `< lg` oculta el panel y centra el form con logo compacto — colapsar, no rediseñar (patrón SPEC 01/02).
- **Sí:** token `--color-canvas-soft: #FBF4EC` — fidelidad al mockup sobre el canvas canónico.
- **Sí:** `FormField` como primitiva de `components/ui/` — el patrón label+input se repite en ambas pantallas.
- **Sí:** invitación self-contained en `lib/mocks/auth.ts` (no importa de kids).
- **Sí:** checkbox real con `defaultChecked`, sin gating del botón.
- **Sí:** borde `#F2A78E` del campo contraseña de activar, tal cual el mockup (representa el foco).
- **No:** validación de credenciales mock ni mensajes de error.
- **No:** ruta `/forgot-password`.
- **No:** `AppLayout` en estas pantallas (los mockups no tienen sidebar).
- **No:** librería de iconos — `IconSun` ya existe con los mismos paths del mockup.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El borde `#F2A78E` del password de activar puede leerse como bug ("siempre enfocado") | Fiel al mockup y documentado; si molesta en la revisión visual se normaliza a `line-input` en esa misma pasada |
| Responsive sin mockup de referencia | Riesgo ya aceptado en SPEC 01/02: colapsar + paddings, sin rediseño |
| La invitación duplica datos de Mateo que ya viven en `lib/mocks/kids.ts` | Aceptado hasta el backend (fuente única real); los valores coinciden hoy |

## What is **not** in this spec

- Autenticación, backend, base de datos, sesiones.
- Validación de credenciales, errores, recuperación de contraseña.
- `/familia/feed` y las demás pantallas del mapeo (404 por diseño).
- Activación real de la cuenta.
- Rediseño mobile.
