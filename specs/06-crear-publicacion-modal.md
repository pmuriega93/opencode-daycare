# SPEC 06 — Crear publicación (modal sobre `/`)

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 04
> **Fecha:** 2026-11-03
> **Actualizado:** 2026-11-03 — destinatarios múltiples: una publicación puede ir a varios niños.
> **Objetivo:** Implementar `references/pantallas/crear-publicacion.dc.html` como modal sobre `/` que publica en memoria (Context de React) y muestra la publicación nueva arriba del feed de `/`.

## Por qué existe esta spec

El botón "Nueva publicación" del sidebar y el composer "Compartí un momento…" del feed ya linkean a `/crear-publicacion`, que hoy es un 404. El usuario decidió que la pantalla sea un **modal sobre `/`** (precedente SPEC 04 y SPEC 05), con la card del mockup. No hay backend: las publicaciones viven en el **state del cliente** y se pierden al recargar, igual que el alta de niños y de padres.

## Scope

**In:**

- `components/feed/CreatePostDialog.tsx` (nuevo) — client component con el form del mockup: header sticky "Cancelar" / "Nueva publicación" / "Publicar", sección PARA con chips de niños multi-selección + "Toda la sala", sección TIPO con las 7 pills, sección DESCRIPCIÓN con textarea, sección FOTOS con tiles de 96px y previews locales.
- `components/feed/FeedProvider.tsx` (nuevo) — Context de React con `posts`, `addPost`, `isComposerOpen`, `openComposer`, `closeComposer` y el toast de confirmación. Se monta en `app/layout.tsx`.
- `components/feed/FeedContent.tsx` (nuevo) — client component que lista las publicaciones del contexto (sección "PUBLICADO HOY" + `PostCard`).
- `components/feed/FeedComposer.tsx` — deja de ser un `<Link>` y pasa a `<button>` que abre el modal (mismo look).
- `components/layout/AppLayout.tsx` — monta `<CreatePostDialog />` y pasa `onNewPost` al `Sidebar` y al `Drawer`.
- `components/layout/Sidebar.tsx` — el botón "Nueva publicación" deja de navegar y abre el modal.
- `components/layout/Drawer.tsx` — pasa `onNewPost` al `Sidebar` del drawer mobile.
- `components/ui/Chip.tsx` — 7 variantes de tipo (las 3 actuales no cambian de color).
- `components/ui/Modal.tsx` — `size` acepta `"lg"` = 580px (la card del mockup).
- `components/ui/Toast.tsx` (nuevo) — toast de confirmación con auto-dismiss.
- `components/ui/FormField.tsx` — prop opcional `labelClassName` (para igualar el peso del label) y textarea con alto del mockup.
- `lib/posts.ts` (nuevo) — `POST_TYPES` (única fuente de la paleta de tipos), `roomKids`, `recipientLabel`, `validateNewPost`, `buildPost`, `formatTime`.
- `lib/types/feed.ts` — `ChipType` pasa a 7 valores, `PostPhoto`, `Post.photos`, `NewPostRecipient`, `NewPostFormValues`, `NewPostFieldErrors`.
- `lib/mocks/feed.ts` — `post-2` pasa de `photo` a `photos: [{ alt: "Foto · pintando con témperas" }]`.
- `components/feed/PostCard.tsx` — renderiza `<img>` cuando la foto tiene `src` (sigue con `PhotoPlaceholder` cuando no lo tiene).
- `AGENTS.md` — fila de `crear-publicacion.dc.html` del mapeo canónico y la línea que dice que no hay estado global.
- Comportamiento: publicar agrega la publicación al feed en memoria y muestra el toast "Publicación creada" (se pierde al recargar, por diseño).

**Out of scope (para specs futuras):**

- La ruta `/crear-publicacion`: no se crea, el modal reemplaza la navegación.
- Edición de publicaciones (el link "Editar" de `PostCard` sigue apuntando a `/crear-publicacion`, que continúa siendo 404).
- Upload real de fotos y storage: no hay backend; los previews son locales (`object URL`).
- Persistencia (localStorage) y backend.
- Galería de fotos en la card del feed (se muestra solo la primera).
- `/publicaciones/[id]`, `/fotos/[id]`, `/avisos`, `/mi-cuenta` y las pantallas de familia (`/familia/*`).
- Notificación a la familia y vista del padre.

## Data model

```ts
// lib/types/feed.ts (modificado)
export type ChipType =
  | "meal" // Comida
  | "nap" // Siesta
  | "activity" // Actividad
  | "achievement" // Logro
  | "mood" // Ánimo
  | "photo" // Foto
  | "announcement"; // Anuncio

export type PostPhoto = {
  alt: string;
  src?: string; // object URL local (solo en publicaciones creadas en la sesión)
};

export type Post = {
  id: string;
  author: PostAuthor;
  time: string;
  meta: string;
  recipient: string;
  chip: ChipType;
  text: string;
  photos?: PostPhoto[]; // reemplaza al `photo?: { alt: string }` de SPEC 01
  likes: number;
  comments: number;
};

export type NewPostRecipient = `kid:${string}` | "room";

export type NewPostFormValues = {
  recipients: NewPostRecipient[]; // al menos uno; "room" es exclusivo
  type: ChipType;
  text: string;
  photos: PostPhoto[];
};

export type NewPostFieldErrors = Partial<Record<"text", string>>;
```

```ts
// lib/posts.ts (nuevo — funciones y datos puros, sin React)

// Única fuente de la paleta de tipos: la consumen `components/ui/Chip.tsx`
// (variante "soft" de la card) y el form (variante "solid" de la sección TIPO).
export type PostTypeMeta = {
  value: ChipType;
  label: string; // "Comida"
  chipLabel: string; // "COMIDA"
  softBg: string; // fondo del chip en la card del feed
  dot: string; // punto del chip en la card del feed
  text: string; // color del texto del chip en la card del feed
  solidBg: string; // fondo de la pill del form (TIPO)
  solidText: string; // texto de la pill del form (TIPO)
};

export const POST_TYPES: readonly PostTypeMeta[] = [
  { value: "meal",        label: "Comida",    chipLabel: "COMIDA",    softBg: "#F3E4BC", dot: "#9A7B1E", text: "#9A7B1E", solidBg: "#9A7B1E", solidText: "#FFFFFF" },
  { value: "nap",         label: "Siesta",    chipLabel: "SIESTA",    softBg: "#E7DCF6", dot: "#7B5FC0", text: "#7B5FC0", solidBg: "#E7DCF6", solidText: "#7B5FC0" },
  { value: "activity",    label: "Actividad", chipLabel: "ACTIVIDAD", softBg: "#C7E7F1", dot: "#2E89A6", text: "#2E89A6", solidBg: "#2E89A6", solidText: "#FFFFFF" },
  { value: "achievement", label: "Logro",     chipLabel: "LOGRO",     softBg: "#CFEBD8", dot: "#3E9B6C", text: "#3E9B6C", solidBg: "#CFEBD8", solidText: "#3E9B6C" },
  { value: "mood",        label: "Ánimo",     chipLabel: "ÁNIMO",     softBg: "#F9D2DE", dot: "#C56486", text: "#C56486", solidBg: "#F9D2DE", solidText: "#C56486" },
  { value: "photo",       label: "Foto",      chipLabel: "FOTO",      softBg: "#FBD8CC", dot: "#D9684A", text: "#D9684A", solidBg: "#FBD8CC", solidText: "#D9684A" },
  { value: "announcement", label: "Anuncio",  chipLabel: "ANUNCIO",   softBg: "#CCD8F4", dot: "#4E72C8", text: "#4E72C8", solidBg: "#CCD8F4", solidText: "#4E72C8" },
];

// Niños de la sala Soles, en el orden de los mocks (para los chips de PARA).
roomKids(kids: Kid[]): Kid[];

// "kid:mateo-fernandez" → "familia de Mateo"
// ["kid:mateo-fernandez", "kid:sofia-mendez"] → "familias de Mateo y Sofía"
// ["room"]                → "toda la sala"
recipientLabel(recipients: NewPostRecipient[], kids: Kid[]): string;

// text vacío (trim) → { text: "Escribí una descripción" }
// destinatarios y tipo siempre vienen preseleccionados (no se pueden
// deseleccionar el último destinatario ni cambiar el tipo a vacío)
validateNewPost(values: NewPostFormValues): NewPostFieldErrors;

// Solo se llama si validateNewPost devolvió {}.
// - id: "post-" + now.getTime()
// - author: uno o más niños → { name: primeros nombres unidos ("Mateo y Sofía"),
//           initial/avatarBg/avatarText del primer niño elegido }
//           room → { announcement: true }  (megáfono + "Anuncio general" en la card)
// - time: "HH:MM" de la hora local (ej. "15:42")
// - meta: "publicado por vos"
// - recipient: recipientLabel(...)
// - chip: values.type
// - text: values.text.trim()
// - photos: values.photos.length ? values.photos : undefined
// - likes: 0, comments: 0
buildPost(values: NewPostFormValues, kids: Kid[], now: Date): Post;

// "15:42" (hora local, 2 dígitos)
formatTime(date: Date): string;
```

```ts
// components/feed/FeedProvider.tsx (nuevo)
type FeedContextValue = {
  posts: Post[]; // estado inicial: los mocks de lib/mocks/feed.ts
  addPost: (post: Post) => void; // prepend
  isComposerOpen: boolean;
  openComposer: () => void;
  closeComposer: () => void;
  toast: string | null;
  notify: (message: string) => void; // auto-dismiss a los 2.5s
};
```

## Implementation plan

1. **Tipos**: `lib/types/feed.ts` → `ChipType` con 7 valores, `PostPhoto`, `Post.photos`, `NewPostRecipient`, `NewPostFormValues`, `NewPostFieldErrors`.
2. **`lib/posts.ts`**: `POST_TYPES`, `roomKids`, `recipientLabel`, `validateNewPost`, `buildPost`, `formatTime` (helpers puros, sin React).
3. **`lib/mocks/feed.ts`**: `post-2` pasa a `photos: [{ alt: "Foto · pintando con témperas" }]`.
4. **`components/ui/Chip.tsx`**: las 7 variantes salen de `POST_TYPES`; los 3 tipos actuales conservan bg/dot/text/label exactos de SPEC 01.
5. **`components/ui/Modal.tsx`**: `size?: "sm" | "md" | "lg"` (`"lg"` = `max-w-[580px]`). Verificar que los modales de SPEC 04/05 no cambian.
6. **`components/ui/Toast.tsx`**: toast "Publicación creada", auto-dismiss 2.5s, `fixed` abajo al centro, por encima del scrim.
7. **`components/ui/FormField.tsx`**: prop opcional `labelClassName` (default sin cambio) para que el label de DESCRIPCIÓN use el mismo peso que PARA/TIPO/FOTOS.
8. **`components/feed/FeedProvider.tsx`**: el Context + `<Toast>`; `addPost` hace prepend; estado inicial = los mocks del feed.
9. **`app/layout.tsx`**: envuelve `{children}` con `<FeedProvider>`.
10. **`components/feed/CreatePostDialog.tsx`**: el form del mockup. Header sticky (`bg-canvas-soft`, borde inferior `line`) con "Cancelar" (`text-muted`, 15px bold, botón `type="button"`), título "Nueva publicación" (Fredoka 600, 18px) y "Publicar" (`text-accent`, 15px extrabold, `type="submit"`). Secciones PARA / TIPO / DESCRIPCIÓN / FOTOS con label `text-[12px] font-extrabold tracking-[0.7px] text-muted`. Chips PARA: niño = avatar pastel de 26px + primer nombre; seleccionado = `bg-text` + texto blanco + borde `#3F362E`; neutro = `bg-surface` + borde `line` + `text-text-3`; "Toda la sala" sin avatar. Los chips son multi-selección: clickear un niño lo agrega o lo quita (no se puede quitar el último), y "Toda la sala" es exclusivo (al elegirla se limpian los niños y viceversa). Pills TIPO: `solidBg`/`solidText` del mockup, la seleccionada con `ring-2` de su propio color. DESCRIPCIÓN: `FormField` textarea con placeholder "Contá cómo le fue hoy…", `min-h-[120px]` y `autoFocus`. FOTOS: input de archivo oculto (`accept="image/*"`), tile "Agregar" punteado 96px, previews 96px con botón X para quitar. Submit → `validateNewPost` → error bajo el textarea o `addPost(buildPost(...))` + `closeComposer()` + `notify("Publicación creada")`. Al cerrar, el form vuelve a su estado inicial.
11. **`components/layout/AppLayout.tsx` + `Sidebar.tsx` + `Drawer.tsx`**: el botón "Nueva publicación" del sidebar abre el modal (`onNewPost`); `AppLayout` monta `<CreatePostDialog />`.
12. **`components/feed/FeedComposer.tsx`**: `<button>` con el mismo look que hoy, que llama `openComposer()`.
13. **`components/feed/FeedContent.tsx` + `app/page.tsx`**: `app/page.tsx` deja de mapear los mocks y renderiza `<FeedContent />`, que lee `posts` del contexto.
14. **`components/feed/PostCard.tsx`**: si la foto tiene `src`, renderiza `<img className="h-[200px] w-full rounded-[16px] object-cover">` dentro del link a `/fotos/[id]`; si no, mantiene el `PhotoPlaceholder`.
15. **`AGENTS.md`**: fila de `crear-publicacion.dc.html` → "modal en `app/page.tsx` (feed)"; la ruta `/crear-publicacion` no existe. Actualizar la línea de "no hay ... ni estado global" con el Context del feed.
16. **Verificación**: Playwright MCP (`.playwright-mcp/`) en ≥1024px y 375px contra el mockup; `npm run build`; `npx eslint app components lib`.

## Acceptance criteria

- [x] `npm run build` pasa sin errores.
- [x] `npx eslint app components lib` pasa sin errores.
- [x] El botón "Nueva publicación" del sidebar abre el modal y no navega a `/crear-publicacion`.
- [x] El composer "Compartí un momento…" del feed abre el mismo modal.
- [x] El modal se ve como `crear-publicacion.dc.html`: card de 580px, fondo `#FBF4EC`, borde `#ECE0D0`, rounded-24, sombra `0 20px 50px -24px rgba(63,54,46,.35)`, con header sticky "Cancelar" / "Nueva publicación" (Fredoka 18px) / "Publicar" (`#D9583C`).
- [x] La sección PARA muestra los 8 niños de Soles (Mateo, Sofía, Benjamín, Valentina, Tomás, Emma, Lucas, Olivia) en ese orden y "Toda la sala" al final, cada niño con su avatar pastel.
- [x] Al abrir, "Mateo" está seleccionado (fondo `#3F362E`, texto blanco) y "Toda la sala" neutro (fondo `#FFFDF9`, borde `#ECE0D0`).
- [x] Se pueden seleccionar varios niños a la vez; cada chip seleccionado se ve con fondo `#3F362E` y texto blanco.
- [x] "Toda la sala" es exclusivo: elegirla limpia los niños; elegir un niño limpia "Toda la sala".
- [x] No se puede quedar sin destinatario: clickear el único chip seleccionado no lo deselecciona.
- [x] La sección TIPO muestra las 7 pills con los colores del mockup (`#9A7B1E`, `#E7DCF6`, `#2E89A6`, `#CFEBD8`, `#F9D2DE`, `#FBD8CC`, `#CCD8F4`) y "Comida" arranca seleccionada.
- [x] El textarea de DESCRIPCIÓN arranca vacío con el placeholder "Contá cómo le fue hoy…" y el foco cae en él al abrir.
- [x] Publicar sin descripción no cierra el modal y muestra "Escribí una descripción" bajo el textarea.
- [x] Publicar con descripción válida cierra el modal, muestra el toast "Publicación creada" y la publicación aparece primera en "PUBLICADO HOY".
- [x] La publicación nueva muestra la hora actual en formato "HH:MM", "publicado por vos", "Para: familia de <niño>" (o "Para: toda la sala"), el chip del tipo elegido, 0 likes y 0 comentarios.
- [x] Con dos o más niños la card muestra "Para: familias de Mateo y Sofía" (coma + "y" para el último), el título con los nombres unidos ("Mateo y Sofía") y el avatar del primer niño elegido.
- [x] Con destinatario "Toda la sala" la card muestra el megáfono y el título "Anuncio general"; con un niño, el avatar y el nombre del niño.
- [x] El chip del tipo elegido sale con el color de la card: "Comida" `#F3E4BC`/`#9A7B1E`, "Siesta" `#E7DCF6`/`#7B5FC0`, "Ánimo" `#F9D2DE`/`#C56486`, "Foto" `#FBD8CC`/`#D9684A`; y los 3 tipos previos mantienen sus colores exactos de SPEC 01.
- [x] "Agregar" abre el selector de archivos; la imagen elegida se ve como preview de 96px en el form y como imagen (200px) en la card del feed.
- [x] Se puede quitar una foto del form con el X del preview, antes de publicar.
- [x] Al reabrir el modal, el form vuelve al estado inicial (descripción vacía, sin fotos, Mateo + Comida).
- [x] Esc, "Cancelar" y el click en el backdrop cierran el modal sin crear publicaciones.
- [x] Recargar la página restaura los 3 posts mock (sin persistencia).
- [x] En 375px el modal ocupa el ancho con márgenes, sin scroll horizontal, con scroll interno si el contenido no entra.
- [x] `AGENTS.md` con la fila de `crear-publicacion.dc.html` actualizada y la nota del Context del feed.

## Decisions

- **Sí:** modal sobre `/` en vez de la ruta `/crear-publicacion` — decisión del usuario; precedente SPEC 04 y SPEC 05.
- **Sí:** Context de React montado en el layout raíz (`app/layout.tsx`) — decisión del usuario; sobrevive la navegación cliente y se pierde al recargar.
- **Sí:** publicaciones en memoria, sin `localStorage` ni backend — decisión del usuario; consistente con SPEC 04 y SPEC 05.
- **Sí:** los 8 niños de Soles + "Toda la sala" en la sección PARA — decisión del usuario.
- **Sí:** extender `ChipType` a los 7 tipos del mockup en vez de mapear a 3 — decisión del usuario.
- **Sí:** solo la descripción es obligatoria; un destinatario (Mateo al abrir) y el tipo (Comida) arrancan preseleccionados — decisión del usuario.
- **Sí:** destinatarios múltiples: se pueden elegir varios niños para una misma publicación — decisión del usuario. "Toda la sala" es exclusivo y siempre queda al menos un destinatario.
- **Sí:** previews de fotos con `object URL` (sin upload ni storage) — decisión del usuario.
- **Sí:** toast de confirmación tras publicar — decisión del usuario.
- **Sí:** con destinatario "Toda la sala" la publicación se muestra como "Anuncio general" (megáfono) — decisión del usuario.
- **Sí:** el modal se monta en `AppLayout` y no en la page, para que el botón del sidebar funcione en todas las pantallas de staff (`/`, `/kids`, `/kids/[id]`).
- **Sí:** `POST_TYPES` en `lib/posts.ts` como única fuente de la paleta de tipos (la consumen `Chip` y el form).
- **Sí:** `Post.photos` como array (se migra el mock `post-2`) y la card muestra solo la primera foto.
- **Sí:** `FormField` gana `labelClassName` en vez de duplicar el markup label+campo del textarea.
- **No:** la ruta `/crear-publicacion` — el link del sidebar y el composer dejan de navegar.
- **No:** upload real de fotos ni storage.
- **No:** persistencia.
- **No:** edición de publicaciones.
- **No:** galería de fotos en la card del feed.
- **No:** las demás pantallas del mapeo (404 por diseño).

## Risks

| Riesgo                                                                            | Mitigación                                                                                                         |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| El estado en memoria se pierde al recargar o al refrescar                         | Por diseño (decisión del usuario); documentado en esta spec                                                        |
| Los `object URL` de las fotos no se revocan y quedan retenidos                    | Solo se revocan las fotos que el usuario quita del form antes de publicar; las publicadas viven hasta el reload    |
| Extender `Chip` puede alterar los 3 tipos existentes                              | Los valores salen de `POST_TYPES` con los mismos bg/dot/text/label de SPEC 01; el paso 4 incluye verificar el feed |
| `FormField` y `Modal` compartidos se modifican                                    | Props aditivas (`labelClassName`, `size` opcional); los pasos 5 y 7 incluyen verificar SPEC 03, SPEC 04 y SPEC 05  |
| Tailwind puede no respetar `min-h-[120px]` sobre el `min-h-[90px]` de `FormField` | Usar `!min-h-[120px]` en `inputClassName` si la utilidad no gana                                                   |
| El `<dialog>` nativo deja la página inerte mientras está abierto                  | No hace falta navegar: al publicar el modal se cierra solo y el feed ya está actualizado                           |
| Con varios niños el título de la card puede quedar largo y empujar el chip        | El nombre usa `flex-1` y puede wrap; la línea "Para:" conserva el detalle completo de los destinatarios            |

## What is **not** in this spec

- La ruta `/crear-publicacion`.
- Edición de publicaciones (el link "Editar" de `PostCard` sigue apuntando a `/crear-publicacion`).
- Upload real de fotos y storage.
- Persistencia (localStorage) y backend.
- Galería de fotos en la card del feed.
- `/publicaciones/[id]`, `/fotos/[id]`, `/avisos`, `/mi-cuenta` y las pantallas de familia (`/familia/*`).
- Notificación a la familia y vista del padre.
