# SPEC 04 — Agregar niño (modal en `/kids`)

> **Estado:** Implementado
> **Depende de:** SPEC 02
> **Fecha:** 2026-11-02
> **Objetivo:** Implementar `references/pantallas/agregar-nino.dc.html` como modal sobre `/kids` con nombre, fecha de nacimiento y sala obligatorios, máscara dd/mm/aaaa para la fecha, salas mock y alta del niño en memoria en la lista.

## Por qué existe esta spec

El mapeo canónico de `AGENTS.md` asignaba `agregar-nino.dc.html` a la ruta `/kids/nuevo` (+ edición). El usuario decidió que el alta sea un **modal sobre `/kids`** en vez de una ruta propia. Esta spec registra ese cambio, actualiza el mapeo y reemplaza el botón "Agregar niño" que SPEC 02 dejaba navegando a un 404.

## Scope

**In:**

- `components/ui/Modal.tsx` — primitiva de modal basada en `<dialog>` nativo (backdrop, Esc, click afuera, a11y).
- `components/kids/AddKidDialog.tsx` — client component con el form del mockup: header Cancelar/título/Guardar + los 5 campos, validación y máscara.
- `components/kids/KidsPageContent.tsx` — client component con `useState(kids)` que retiene el botón trigger, el modal y la lista.
- `app/kids/page.tsx` — pasa a server component delgado: `AppLayout` + `KidsPageContent` con los mocks.
- `components/kids/KidsList.tsx` — agrupa por sala ("SALA SOLES · 8 niños", "SALA LUNAS · 1 niño"…); la búsqueda filtra dentro de cada sección.
- `components/ui/FormField.tsx` — extendido con `value`/`onChange`/`error` y variante textarea (retrocompatible con SPEC 03).
- `components/ui/SelectField.tsx` — label + select nativo estilizado (`appearance-none` + chevron) con soporte de error.
- `components/ui/Icons.tsx` — `IconChevronDown` nuevo (paths del mockup).
- `lib/kids.ts` — helpers puros: máscara, parseo/validación de fecha, validación del form, construcción del `Kid`.
- `lib/mocks/kids.ts` — export nuevo `salas = ["Soles", "Lunas", "Estrellas"]`.
- `lib/types/kids.ts` — tipos `AddKidFormValues` y `AddKidFieldErrors`.
- `AGENTS.md` — fila de mapeo de `agregar-nino.dc.html` actualizada.
- Comportamiento: "Guardar" agrega el niño en memoria (se pierde al recargar, por diseño).

**Out of scope (para specs futuras):**

- Modo edición: el mismo form prefijado desde el perfil (`/kids/[id]/editar` sigue 404).
- Ruta `/kids/nuevo`: el modal la reemplaza; nunca se crea.
- Persistencia (localStorage) y backend.
- Vincular padres durante el alta: el niño nuevo queda sin padres → chip "VINCULAR" existente.
- Animaciones del modal (el mockup es estático).
- Las demás pantallas del mapeo (404 por diseño).

## Data model

```ts
// lib/types/kids.ts (nuevos)
export type AddKidFormValues = {
  name: string;      // "Martina López"
  birthdate: string; // valor con máscara: "12/03/2022"
  room: string;      // "" | "Soles" | "Lunas" | "Estrellas"
  allergies: string; // texto libre: "Maní, Lactosa"
  notes: string;     // texto libre
};

export type AddKidFieldErrors = Partial<
  Record<"name" | "birthdate" | "room", string>
>;
```

```ts
// lib/mocks/kids.ts (nuevo)
export const salas = ["Soles", "Lunas", "Estrellas"] as const;
```

```ts
// lib/kids.ts (nuevo — funciones puras, sin DOM)

// Solo dígitos; inserta "/" tras dd y mm; máx. 10 caracteres.
// "1203" → "12/03", "12032022" → "12/03/2022"
maskBirthdate(raw: string): string;

// dd/mm/aaaa → { day, month, year } | null.
// null si el formato está incompleto o la fecha no existe (31/02/2024, mes 13…).
// Incluye bisiestos.
parseBirthdate(masked: string): { day: number; month: number; year: number } | null;

// Reglas (se evalúan en este orden, por campo):
// name vacío (trim)        → "Ingresá el nombre"
// birthdate vacía          → "Ingresá la fecha de nacimiento"
// birthdate no parseable   → "La fecha no es válida"
// birthdate > today        → "La fecha no puede ser futura" (hoy se acepta)
// room vacía               → "Seleccioná una sala"
validateAddKid(values: AddKidFormValues, today: Date): AddKidFieldErrors;

// Solo se llama si validateAddKid devolvió {}.
// - id: slug del nombre normalizado ("Martina López" → "martina-lopez",
//   á→a, espacios → guiones); si colisiona con un id existente → sufijo -2, -3…
// - initial: primera letra del nombre
// - avatarBg/avatarText: rotación de las 5 combinaciones pastel de los mocks
//   (#A9D9E8/#1F7A93, #F4B8CC/#C44A7A, #B9DEC4/#3E8B62, #F4DC8E/#9A7B1E,
//   #C9B6E8/#7B5FC0) según la posición en la lista
// - birthdate: dd/mm/aaaa → "YYYY-MM-DD"
// - entryDate: mes actual en español, formato de los mocks ("nov 2026")
// - allergies: split por coma + trim + filtrar vacíos + lowercase (["maní"])
// - notes: undefined si quedó vacío
// - parents: []
buildKid(values: AddKidFormValues, existing: Kid[], today: Date): Kid;
```

## Implementation plan

1. **Mocks y tipos**: `salas` en `lib/mocks/kids.ts`; `AddKidFormValues` + `AddKidFieldErrors` en `lib/types/kids.ts`.
2. **`lib/kids.ts`**: `maskBirthdate`, `parseBirthdate`, `validateAddKid`, `buildKid`.
3. **`IconChevronDown`** en `components/ui/Icons.tsx`.
4. **Extender `FormField`** con `value`/`onChange`/`error`/variante textarea. Verificar que `/login` y `/activate-account` siguen idénticos (build + visual).
5. **`components/ui/SelectField.tsx`**: label + select nativo `appearance-none` + chevron + placeholder deshabilitado + error.
6. **`components/ui/Modal.tsx`**: `<dialog>` con `showModal()`/`close()` vía effect; `::backdrop` scrim `rgba(63,54,46,.45)`; Esc nativo y click en backdrop (target === dialog) → `onClose`; `aria-labelledby`; panel `max-w-[520px]` `bg-canvas-soft` borde `line` rounded-24 con la sombra del mockup, `max-h-[85vh]` con scroll interno, márgenes laterales en mobile.
7. **`components/kids/AddKidDialog.tsx`**: `<form noValidate>` con header (Cancelar `type="button"` / título Fredoka 18px / Guardar `type="submit"` accent) + campos en el orden y layout del mockup (fecha + sala en fila, colapsa en mobile). Controlled; `maskBirthdate` en el onChange de la fecha; submit → `validateAddKid` → errores o `onAdd(buildKid(...))` + close; el error de un campo se limpia al editarlo; values y errors se resetean al cerrar.
8. **`KidsList`**: agrupar los filtrados por sala en orden de `salas`; una sección por sala con niños ("SALA " + sala uppercase + contador); secciones sin resultados ocultas; total 0 → mensaje "No se encontraron niños…" existente.
9. **`KidsPageContent` + `app/kids/page.tsx`**: el botón "Agregar niño" pasa de `href` a `onClick` (abre el modal); `KidsList` recibe el estado en memoria.
10. **`AGENTS.md`**: fila de `agregar-nino.dc.html` → modal en `/kids`, edición como spec futura.
11. **Verificación**: Playwright MCP (`.playwright-mcp/`) en ≥1024px y 375px; `npm run build`; `npx eslint app components lib`.

## Acceptance criteria

- [x] `npm run build` pasa sin errores.
- [x] `npx eslint app components lib` pasa sin errores.
- [x] El botón "Agregar niño" de `/kids` abre el modal; ya no navega a `/kids/nuevo`.
- [x] Modal en ≥1024px visualmente idéntico a `agregar-nino.dc.html`: card 520px `#FBF4EC` borde `#ECE0D0` rounded-24, header Cancelar/título/Guardar, labels uppercase y placeholders exactos ("Ej. Martina López", "dd/mm/aaaa", "Ej. Maní, Lactosa", "Indicaciones, medicación, contactos…").
- [x] Esc, click en backdrop y "Cancelar" cierran el modal sin cambios en la lista.
- [x] Guardar con los tres obligatorios vacíos no cierra el modal y muestra "Ingresá el nombre", "Ingresá la fecha de nacimiento" y "Seleccioná una sala", con borde accent.
- [x] Editar un campo con error limpia el error de ese campo.
- [x] Máscara: tipear "12032022" produce "12/03/2022"; letras y símbolos se ignoran; nunca supera 10 caracteres.
- [x] "31/02/2024" → "La fecha no es válida"; una fecha de mañana → "La fecha no puede ser futura"; hoy se acepta.
- [x] El select de sala es nativo estilizado con chevron, placeholder "Seleccioná una sala" sin preselección, y opciones Soles/Lunas/Estrellas.
- [x] Guardar con form válido cierra el modal y agrega el niño bajo la sección de su sala, con chip VINCULAR, avatar de la rotación y edad correcta.
- [x] Agregar un niño en "Lunas" crea la sección "SALA LUNAS · 1 niño"; con solo los mocks se renderiza únicamente "SALA SOLES · 8 niños" (idéntico al mockup).
- [x] La búsqueda encuentra al niño agregado por su nombre; las secciones sin resultados se ocultan.
- [x] Recargar `/kids` restaura los 8 niños mock (sin persistencia).
- [x] En 375px el modal ocupa el ancho con márgenes, sin scroll horizontal y con scroll interno si hace falta.
- [x] Al abrir, el foco cae en "Nombre completo"; al cerrar, vuelve al botón trigger.
- [x] `AGENTS.md` con la fila de `agregar-nino.dc.html` actualizada.

## Decisions

- **Sí:** `<dialog>` nativo — focus trap, Esc y retorno de foco gratis, sin librería.
- **Sí:** click en backdrop cierra — junto con Esc y Cancelar, los tres caminos.
- **Sí:** select nativo estilizado — accesible; el popup de opciones lo renderiza el SO; el campo cerrado es fiel al mockup.
- **Sí:** alta en memoria (`useState` en `KidsPageContent`) — decisión del usuario; se pierde al recargar.
- **Sí:** validación custom en submit con `noValidate` — mensajes propios en español y look controlado; la validación nativa del browser queda desactivada.
- **Sí:** fecha real y no futura — decisión del usuario.
- **Sí:** secciones por sala en `KidsList` — decisión del usuario; con los mocks actuales la salida es idéntica al mockup.
- **Sí:** `salas = ["Soles", "Lunas", "Estrellas"]` sin preselección — decisión del usuario; hace real el obligatorio.
- **Sí:** extender `FormField` en vez de duplicar — mismo patrón label+campo que SPEC 03.
- **Sí:** helpers puros en `lib/kids.ts` — aislados de React, testeables cuando haya tests.
- **Sí:** avatar por rotación de las 5 combinaciones pastel de los mocks.
- **Sí:** actualizar la tabla de `AGENTS.md` — precedente SPEC 03.
- **No:** modo edición — spec futura.
- **No:** ruta `/kids/nuevo` — el modal la reemplaza.
- **No:** persistencia ni backend.
- **No:** vincular padres en el alta — el niño nace sin padres (chip VINCULAR).
- **No:** animación de entrada del modal — el mockup es estático.
- **No:** asteriscos en labels de obligatorios — fiel al mockup; el error aparece al intentar guardar.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Backspace sobre los "/" de la máscara puede comportarse raro | La máscara se recalcula desde los dígitos en cada change, sin estado intermedio |
| El popup del select nativo varía por SO/navegador | Aceptado: accesibilidad sobre pixel-perfect del popup; el campo cerrado es fiel |
| El alta en memoria se pierde al recargar y puede confundir | Por diseño (decisión del usuario); documentado en esta spec |
| Colisión de slug entre niños con el mismo nombre | `buildKid` sufija -2, -3… según los ids existentes |
| `FormField` extendido podría romper SPEC 03 | Props aditivas; el paso 4 incluye verificación visual de `/login` y `/activate-account` |

## What is **not** in this spec

- Edición de niño (`/kids/[id]/editar` o modal prefijado).
- Ruta `/kids/nuevo`.
- Persistencia (localStorage) y backend.
- Vincular padres durante el alta.
- Animaciones del modal.
- Rediseño mobile (el modal solo adapta ancho y scroll).
- Las demás pantallas del mapeo (404 por diseño).
