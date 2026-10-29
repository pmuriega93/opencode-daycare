# SPEC 02 — Lista y perfil de niños `/kids` + `/kids/[id]`

> **Estado:** Verified ✅
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-28
> **Objetivo:** Implementar las pantallas `references/pantallas/ninos.dc.html` (lista de niños con búsqueda interactiva) y `references/pantallas/perfil-nino.dc.html` (perfil detallado) en las rutas `/kids` y `/kids/[id]`, con datos mock completos para los 8 niños y actualización del sidebar para linkear a `/kids`.

## Scope

**In:**

- `app/kids/page.tsx` — lista de niños con grid de cards y búsqueda interactiva client-side.
- `app/kids/[id]/page.tsx` — perfil detallado de un niño específico, con datos completos del mockup.
- `components/kids/` — componentes de dominio: `KidCard`, `KidsList` (client component con búsqueda), `KidProfile`, `ParentRow`.
- `lib/types/kids.ts` — tipos `Kid` y `Parent` con campos separados y tipados.
- `lib/mocks/kids.ts` — datos mock completos de los 8 niños (Mateo, Sofía, Benjamín, Valentina, Tomás, Emma, Lucas, Olivia) con alergias, notas, padres vinculados, fechas, etc.
- Actualización de `components/layout/Sidebar.tsx` para cambiar el href de `/ninos` a `/kids`.
- Navegación funcional: click en card → `/kids/[id]`, "Volver a Niños" → `/kids`, "Vincular otro padre" → `/vincular-padre` (404), "Resumen del día" → `/resumen-dia` (404).
- Búsqueda interactiva: input filtra la lista por nombre en tiempo real (client-side).
- Responsive: mismo patrón que SPEC 01 (drawer en < lg, paddings adaptativos).

**Out of scope (para specs futuras):**

- Pantalla de agregar/editar niño (`agregar-nino.dc.html`).
- Pantalla de vincular padre (`vincular-padre.dc.html`).
- Pantalla de resumen del día (`resumen-dia.dc.html`).
- Autenticación, backend, base de datos.
- Interactividad más allá de búsqueda.
- Las pantallas destino de enlaces inexistentes son 404 por diseño.
- Cambios en otros enlaces del sidebar.

## Data model

```ts
// lib/types/kids.ts
export type ParentStatus = "active" | "pending";

export type Parent = {
  id: string;
  name: string;
  initial: string;
  avatarBg: string;
  role: string; // "Mamá" | "Papá"
  status: ParentStatus;
};

export type Kid = {
  id: string; // slug: "mateo-fernandez"
  name: string;
  initial: string;
  avatarBg: string;
  avatarText: string;
  birthdate: string; // "2022-03-12"
  room: string; // "Soles"
  entryDate: string; // "feb 2025"
  allergies: string[]; // ["maní"]
  notes?: string; // texto libre sobre salud
  parents: Parent[];
};

// Helper para calcular edad desde birthdate
export function calculateAge(birthdate: string): number;
```

Lógica de flags en la card:

- `allergies.length > 0` → chip con la primera alergia en uppercase (MANÍ, LACTOSA).
- `parents.length === 0` o todos `status === "pending"` → chip "VINCULAR".
- Si no → chevron `›`.

## Implementation plan

1. **Tipos y mocks**: `lib/types/kids.ts` + `lib/mocks/kids.ts` con los 8 niños completos.
2. **KidCard + ParentRow**: componentes de presentación, datos por props.
3. **KidsList**: client component (`'use client'`) con `useState` para búsqueda y filtrado.
4. **`app/kids/page.tsx`**: server component, `AppLayout active="kids"`, `PageHeader`, botón "Agregar niño" → `/kids/nuevo` (404), `KidsList`.
5. **KidProfile**: presentation component con header, alerta, tabla info, sidebar padres.
6. **`app/kids/[id]/page.tsx`**: `KidProfileContent` (server component con `await params`) envuelto en `<Suspense>`. Busca niño por ID en mocks, muestra perfil o "no encontrado".
7. **Actualizar Sidebar**: href de `/ninos` → `/kids`.
8. **Verificación visual** con Playwright MCP.

## Acceptance criteria

- [x] `npm run build` pasa sin errores.
- [x] `npx eslint app components lib` pasa sin errores.
- [x] Archivos en las ubicaciones correctas (`app/kids/`, `components/kids/`, `lib/types/kids.ts`, `lib/mocks/kids.ts`).
- [x] Tipos `Kid`, `Parent`, `ParentStatus` con campos separados y tipados.
- [x] 8 niños completos en mocks con todos los datos del mockup.
- [x] `app/kids/[id]/page.tsx` usa `<Suspense>` boundary para `params` (Next.js 16).
- [x] `/kids` en ≥1024px visualmente idéntico al mockup `ninos.dc.html`.
- [x] Cards con flags correctos (MANÍ para Mateo, LACTOSA para Tomás, VINCULAR para Valentina, chevron para el resto).
- [x] Búsqueda funcional: "Ma" → solo Mateo; "a" → 7 niños; vacío → 8.
- [x] Click en card navega a `/kids/[id]`.
- [x] `/kids/mateo-fernandez` en ≥1024px visualmente idéntico al mockup `perfil-nino.dc.html`.
- [x] Perfil de Mateo: alerta maní, "12 mar 2022", "Soles", "feb 2025", 2 padres (Lucía activa, Diego pendiente).
- [x] Botón "Editar" → `/kids/[id]/editar` (404).
- [x] Botón "Resumen del día" → `/resumen-dia` (404).
- [x] "Vincular otro padre" → `/vincular-padre` (404).
- [x] Sidebar "Niños" linkea a `/kids` y muestra estado activo en `/kids` y `/kids/[id]`.
- [x] Mobile: sin scroll horizontal, drawer funcional, grid colapsa a 1 columna.

## Decisions

- **Sí:** búsqueda interactiva client-side con `useState`.
- **Sí:** datos mock completos para los 8 niños.
- **Sí:** campos separados y tipados (`allergies: string[]`, `parents: Parent[]`).
- **Sí:** actualizar solo el href del sidebar.
- **Sí:** IDs como slugs (`mateo-fernandez`).
- **Sí:** edad calculada desde `birthdate`.
- **Sí:** `KidProfileContent` como server component con `await params` dentro de `<Suspense>`.
- **No:** librería de iconos, rediseño mobile, cambios en otros enlaces.

## What is **not** in this spec

- Pantalla de agregar/editar niño (`agregar-nino.dc.html`).
- Pantalla de vincular padre (`vincular-padre.dc.html`).
- Pantalla de resumen del día (`resumen-dia.dc.html`).
- Autenticación, backend, base de datos.
- Interactividad más allá de búsqueda (no hay edición real, no hay vinculación real de padres).
- Las pantallas destino de enlaces inexistentes son 404 por diseño.
- Cambios en otros enlaces del sidebar (Feed, Avisos, Mi cuenta, logout).
- Rediseño mobile (bottom nav, cards compactas).
