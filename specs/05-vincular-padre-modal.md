# SPEC 05 — Vincular padre (modal en `/kids/[id]`)

> **Estado:** Implementado
> **Depende de:** SPEC 02, SPEC 04
> **Fecha:** 2026-11-03
> **Objetivo:** Implementar `references/pantallas/vincular-padre.dc.html` como modal sobre `/kids/[id]` que vincula un padre/madre por nombre, email y parentesco, genera un código de invitación aleatorio y agrega al padre a la lista de vinculados en estado pendiente, solo en memoria.

## Por qué existe esta spec

El mapeo canónico de `AGENTS.md` asignaba `vincular-padre.dc.html` a la ruta `/vincular-padre` (404 por diseño) y en `KidProfile` el link "Vincular otro padre" navega a esa ruta inexistente. El usuario decidió que la pantalla sea un **modal sobre `/kids/[id]`**, igual que `agregar-nino` en SPEC 04. No hay backend: el padre vinculado vive en el state del cliente y se pierde al recargar.

## Scope

**In:**

- `components/kids/LinkParentDialog.tsx` (nuevo) — client component con el form del mockup: header (título "Vincular padre", subtítulo "a {nombre del niño}", botón X), banner informativo, campos NOMBRE DEL PADRE/MADRE y EMAIL, chips de PARENTESCO, caja con el CÓDIGO DE INVITACIÓN y botón "Enviar invitación".
- `components/kids/KidProfile.tsx` — estado `parents` en memoria (`useState`), el link "Vincular otro padre" pasa a `<button>` que abre el modal y el `LinkParentDialog` montado al final del componente.
- `components/ui/Modal.tsx` — prop opcional `size`: `"sm"` = 480px (esta pantalla) y `"md"` = 520px (default actual).
- `lib/parents.ts` (nuevo) — helpers puros: `generateInvitationCode()`, `validateLinkParent()`, `buildParent()`.
- `lib/types/kids.ts` — `ParentRole`, `LinkParentFormValues`, `LinkParentFieldErrors` y `Parent.email?` (opcional).
- `AGENTS.md` — fila de mapeo de `vincular-padre.dc.html` actualizada a "modal en `/kids/[id]`".

**Out of scope (para specs futuras):**

- Envío real de correo: no hay backend ni email. El código se muestra en pantalla para que el staff lo comparta.
- Que `/activate-account` (SPEC 03) consuma los códigos de esta pantalla: sigue usando su mock.
- Persistencia (localStorage) y backend.
- Editar o desvincular padres ya vinculados.
- Sincronización entre `/kids` y `/kids/[id]`: lista y perfil tienen estados separados, navegar o recargar pierde el alta.
- La ruta `/vincular-padre`: deja de ser alcanzable, no se crea.
- Edición de niño (`/kids/[id]/editar` sigue 404) y las demás pantallas del mapeo.

## Data model

```ts
// lib/types/kids.ts (nuevos)
export type ParentRole = "Mamá" | "Papá" | "Tutor/a";

export type LinkParentFormValues = {
  name: string;     // "Diego Fernández"
  email: string;    // "diego.fernandez@example.com"
  role: ParentRole; // "Mamá" | "Papá" | "Tutor/a"
};

export type LinkParentFieldErrors = Partial<
  Record<"name" | "email" | "role", string>
>;
```

```ts
// lib/types/kids.ts (modificado)
export type Parent = {
  // ...campos actuales
  email?: string; // opcional: los mocks de padres no lo tienen
};
```

```ts
// lib/parents.ts (nuevo — funciones puras, sin DOM)

export const PARENT_ROLES: readonly ParentRole[] = ["Mamá", "Papá", "Tutor/a"];

// 5 caracteres alfanuméricos sin ambigüedades (0/O, 1/I/L).
// Se genera al abrir el modal, no se persiste: "7K4P9".
generateInvitationCode(): string;

// Reglas (en este orden, por campo):
// name vacío (trim)          → "Ingresá el nombre"
// email vacío (trim)         → "Ingresá el email"
// email con formato inválido → "El email no es válido"
// email ya vinculado al niño → "Este email ya está vinculado"
// role vacío                 → "Seleccioná el parentesco" (defensivo: la UI
//                              preselecciona "Mamá" y no permite deseleccionar)
validateLinkParent(
  values: LinkParentFormValues,
  existingParents: Parent[],
): LinkParentFieldErrors;

// Solo se llama si validateLinkParent devolvió {}.
// - id: "parent-" + slug del nombre ("Diego Fernández" → "parent-diego-fernandez"),
//   con sufijo -2, -3… si colisiona con un id existente
// - initial: primera letra del nombre en mayúscula
// - avatarBg: rotación de la paleta de padres de los mocks
//   (#C9B6E8, #A9C7E8, #B9DEC4, #F4DC8E, #F4B8CC) según la cantidad de padres
// - role: values.role
// - status: "pending"
// - email: values.email con trim + lowercase
buildParent(
  values: LinkParentFormValues,
  existingParents: Parent[],
): Parent;
```

## Implementation plan

1. **Tipos**: `ParentRole`, `LinkParentFormValues`, `LinkParentFieldErrors` y `Parent.email?` en `lib/types/kids.ts`.
2. **`lib/parents.ts`**: `generateInvitationCode`, `validateLinkParent`, `buildParent` (helpers puros, sin React).
3. **`components/ui/Modal.tsx`**: prop `size?: "sm" | "md"` (default `"md"` = 520px). Verificar que el modal de SPEC 04 no cambia.
4. **`components/kids/LinkParentDialog.tsx`**: `<form noValidate>` con el layout del mockup — header con título Fredoka 18px + subtítulo muted 13px + botón X (34px, `bg-[#F0E6D8]`, `text-[#94887B]`); banner informativo `bg-[#E3ECFB]` con icono `stroke-[#4E72C8]` y texto `text-[#3F5694]`; `FormField` para nombre (`autoFocus`) y email (`type="email"`); chips de parentesco (seleccionado: `border-[#9FB8EC] bg-[#CCD8F4] text-[#4E72C8]`; neutro: `border-line bg-surface text-text-3`); caja del código `bg-[#FBF1D6]` con borde punteado `border-[1.5px] border-dashed border-[#E6D08A]`; botón "Enviar invitación" con gradiente e icono de papelito. El código se genera en el `useState` inicial del form, que se monta solo con `open` → código nuevo en cada apertura.
5. **`components/kids/KidProfile.tsx`**: `useState<Parent[]>(kid.parents)` para los padres; el link "Vincular otro padre" pasa a `<button type="button">` con el mismo estilo visual que abre el modal; al enviar, `setParents` agrega el padre nuevo (sin recargar la lista).
6. **`AGENTS.md`**: fila de `vincular-padre.dc.html` → "modal en `app/kids/[id]/page.tsx`".
7. **Verificación**: Playwright MCP (`.playwright-mcp/`) en ≥1024px y 375px contra el mockup; `npm run build`; `npx eslint app components lib`.

## Acceptance criteria

- [x] `npm run build` pasa sin errores.
- [x] `npx eslint app components lib` pasa sin errores.
- [x] El link "Vincular otro padre" de `/kids/[id]` abre el modal y ya no navega a `/vincular-padre` (404).
- [x] El modal se ve igual que `vincular-padre.dc.html`: card de 480px `#FBF4EC` con borde `#ECE0D0` y rounded-24, header "Vincular padre" + subtítulo + X, banner `#E3ECFB`, labels en mayúsculas con letter-spacing, placeholders "Ej. Diego Fernández" y "correo@ejemplo.com", 3 chips de parentesco, caja del código con borde punteado y botón "Enviar invitación" con gradiente.
- [x] El subtítulo del header y el banner usan el nombre del niño de la URL ("a Mateo Fernández" / "Solo verá el feed de Mateo").
- [x] El código de invitación tiene 5 caracteres alfanuméricos y es distinto en cada apertura del modal.
- [x] El chip "Mamá" arranca seleccionado (`#CCD8F4` / borde `#9FB8EC`); al clickear "Papá" queda "Papá" seleccionado y "Mamá" vuelve al estado neutro.
- [x] Enviar con nombre y email vacíos no cierra el modal y muestra "Ingresá el nombre" e "Ingresá el email" con borde accent.
- [x] Un email inválido (ej. "diego@") muestra "El email no es válido".
- [x] Un email ya vinculado a ese niño muestra "Este email ya está vinculado" y no agrega nada.
- [x] Editar un campo con error limpia el error de ese campo.
- [x] Con el form válido, el modal se cierra y el padre aparece en "PADRES VINCULADOS" con chip PENDIENTE y subtítulo "invitación enviada".
- [x] Esc, el botón X y el click en el backdrop cierran el modal sin agregar padres.
- [x] Recargar la página restaura los padres mock (sin persistencia).
- [x] Al abrir, el foco cae en el campo de nombre; al cerrar, vuelve al botón trigger.
- [x] En 375px el modal ocupa el ancho con márgenes y sin scroll horizontal.
- [x] `AGENTS.md` con la fila de `vincular-padre.dc.html` actualizada.

## Decisions

- **Sí:** modal sobre `/kids/[id]` en vez de la ruta `/vincular-padre` — decisión del usuario; precedente SPEC 04.
- **Sí:** sin backend, alta en memoria — decisión del usuario; se pierde al recargar.
- **Sí:** al enviar, el padre se agrega a la lista con `status: "pending"` — decisión del usuario; `ParentRow` ya renderiza ese estado.
- **Sí:** código de invitación aleatorio en cada apertura — decisión del usuario; representa un código real.
- **Sí:** "Mamá" preseleccionado y no deseleccionable — decisión del usuario; el error de parentesco queda como rama defensiva.
- **Sí:** bloquear email duplicado con "Este email ya está vinculado" — decisión del usuario.
- **Sí:** prop `size` en el `Modal` compartido en vez de duplicar la primitiva — default sin cambios para SPEC 04.
- **Sí:** reutilizar `FormField` — mismo patrón label + campo + error que SPEC 03 y 04.
- **Sí:** helpers puros en `lib/parents.ts` — separados de `lib/kids.ts` (que es de niños) y testeables cuando haya tests.
- **Sí:** `Parent.email` opcional y mocks de padres sin tocar — los mocks no tienen email; la detección de duplicados igual funciona contra los padres agregados en la sesión.
- **No:** envío de correo real — no hay backend.
- **No:** que `/activate-account` consuma estos códigos — SPEC 03 sigue con su mock.
- **No:** persistencia ni backend.
- **No:** editar o desvincular padres.
- **No:** sincronizar `/kids` con `/kids/[id]` — cada vista tiene su propio estado.
- **No:** ruta `/vincular-padre` — el link deja de navegar.
- **No:** tokens de color nuevos en `@theme` — los colores fuera de la paleta base se escriben como valores arbitrarios inline, igual que en `KidProfile` y `ActivationForm`.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| El estado en memoria se pierde al recargar o al navegar | Por diseño (decisión del usuario); documentado en esta spec |
| Agregar `size` al `Modal` compartido podría romper el modal de SPEC 04 | Prop opcional con default 520px; el paso 3 y la verificación incluyen revisar `/kids` |
| El link actual es un `<Link>` de navegación y pasa a `<button>` | Se conserva el estilo visual; un control de acción no debería navegar |
| La detección de duplicados solo ve padres con `email` (los mocks no lo tienen) | Se mantiene el mock intacto; los padres agregados en la sesión sí traen email |

## What is **not** in this spec

- Envío de correo y backend.
- Que `/activate-account` use los códigos generados acá.
- Persistencia (localStorage).
- Editar o desvincular padres ya vinculados.
- Sincronización entre la lista de niños y el perfil.
- La ruta `/vincular-padre`.
- Edición de niño.
- Las demás pantallas del mapeo (404 por diseño).
