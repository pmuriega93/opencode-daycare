# SPEC 01 — Feed como home `/` (responsive + primitivas + estructura de carpetas)

> **Estado:** Implementado
> **Depende de:** ninguna
> **Fecha:** 2026-10-27
> **Objetivo:** Implementar el mockup `references/pantallas/feed.dc.html` como la ruta `/` con datos mock, visualmente idéntico al plantilla en escritorio, responsive con patrón de drawer, con primitivas UI reutilizables y una estructura de carpetas explícita que cierre por dominio para las siguientes pantallas.

## Estructura de carpetas

Esta es la convención que fija la spec y se extiende a las pantallas siguientes (respetando la regla del repo: mock data separado para poder enchufar la API después):

```
app/
  layout.tsx                  # fuentes Fredoka + Nunito, metadata (html/body base)
  globals.css                 # tokens @theme de la paleta + base de scroll
  page.tsx                    # el feed (home) — server component

components/
  ui/                         # PRIMITIVAS reutilizables y agnósticas de dominio
    Button.tsx                #   variantes: primary (gradiente) | ghost
    Chip.tsx                  #   pill de estado; map de variantes logro|actividad|anuncio
    Card.tsx                  #   superficie + borde + rounded + sombra
    Avatar.tsx                #   inicial o icono sobre color pastel
    NavLink.tsx               #   ítem de nav con estado activo
    IconBox.tsx               #   cuadrado redondeado con icono
    PhotoPlaceholder.tsx      #   box dashed para foto
    SectionLabel.tsx          #   label uppercase + línea divisoria
    PageHeader.tsx            #   eyebrow + título Fredoka + subtítulo
    Icons.tsx                 #   SVGs inline del mockup (sin librería)
  layout/                     # COMPONENTES DE LAYOUT (chrome compartido entre pantallas)
    AppLayout.tsx             #   sidebar desktop + top bar mobile + drawer; client component
    Sidebar.tsx               #   prop active: nombre de la sección actual
    MobileTopBar.tsx          #   logo + hamburger (visible < lg)
    Drawer.tsx                #   overlay + panel deslizable; cierra al tocar overlay/link
  feed/                       # COMPONENTES DE DOMINIO: composición de primitivas del feed
    PostCard.tsx
    FeedComposer.tsx

lib/
  types/
    feed.ts                   # tipos de dominio (Post, ChipTipo, …) compartibles
  mocks/                      # DATOS MOCK (typed). Un módulo por pantalla/dominio futuro:
    feed.ts                   #   usuario, encabezado, posts: lib/mocks/feed.ts
                              #   (después: ninos.ts, avisos.ts, cuenta.ts …)
```

**Reglas de la convención:**

- `components/ui/` no importa de `components/**` ni `lib/mocks/**` — solo recibe datos por props. Zero lógica de feed adentro.
- `components/layout/` es todo lo que se comparte entre pantallas (chrome): el feed hoy, y ninos/avisos/cuenta mañana reutilizando el mismo `AppLayout`.
- `components/feed/` (y su par por dominio futuro: `components/ninos/`, `components/avisos/` …) solo compone primitivas + datos.
- Los datos nunca viven dentro de componentes: `page.tsx` importa de `lib/mocks/` y pasa todo por props. Cuando llegue el backend, se reemplaza la fuente en `page.tsx` sin tocar componentes.
- Tipos de dominio en `lib/types/`, no duplicados en mocks ni componentes.

## Scope

**In:**

- `app/page.tsx` — el feed (home), reemplazando el template de create-next-app.
- Fuentes **Fredoka** + **Nunito** vía `next/font/google` en `app/layout.tsx` (reemplaza Geist) y tokens `@theme` en `app/globals.css`.
- Primitivas UI en `components/ui/` (ver estructura): `Button`, `Chip`, `Card`, `Avatar`, `NavLink`, `IconBox`, `PhotoPlaceholder`, `SectionLabel`, `PageHeader`, `Icons`.
- Componentes de layout en `components/layout/`: `AppLayout` (client component por el estado del drawer), `Sidebar` (prop `active`), `MobileTopBar`, `Drawer` (overlay, `aria-expanded` en el trigger, cierre al click en overlay o link).
- Componentes de dominio en `components/feed/`: `PostCard`, `FeedComposer`.
- Datos mock en `lib/mocks/feed.ts` + tipos en `lib/types/feed.ts`.
- **Responsive con 3 cortes** (breakpoints default de Tailwind): `≥ lg (1024px)` = exacto al mockup; `sm – lg (640–1024px)` = drawer + padding medio; `< sm (640px)` = drawer + padding compacto.
- Enlaces a rutas futuras reales: `/crear-publicacion`, `/ninos`, `/avisos`, `/mi-cuenta`, `/login`, `/publicaciones/[id]`, `/fotos/[id]`, `/feed` (logo).
- Convención de nombres: identificadores de código (variables, funciones, tipos, props, archivos) en **inglés**; textos visibles en la UI en **español rioplatense** (según la regla agregada en `AGENTS.md`).
- Actualización del mapeo canónico en `AGENTS.md` (feed → `app/page.tsx`).

**Out of scope (para specs futuras):**

- Autenticación, backend, base de datos. Todo es mock estático.
- Interactividad: likes, comentarios, crear/editar publicación, logout.
- Las pantallas destino de los enlaces (404 por diseño).
- Índice de pantallas `index.dc.html` (queda sin hogar; spec futura).
- Ruta duplicada `/feed`.
- Rediseño mobile inventado más allá de drawer + colapsar flow + paddings.

## Data model

```ts
// lib/types/feed.ts
export type ChipType = "achievement" | "activity" | "announcement";

export type Post = {
  id: string;
  author:
    | { name: string; initial: string; avatarBg: string; avatarText: string }
    | { announcement: true };
  time: string; // "14:20"
  meta: string; // "publicado por vos"
  recipient: string; // "familia de Mateo" | "toda la sala"
  chip: ChipType;
  text: string;
  photo?: { alt: string }; // placeholder dashed del mockup
  likes: number;
  comments: number;
};
```

```ts
// lib/mocks/feed.ts — usuario, encabezado y los 3 posts exactos del mockup
import type { Post } from "../types/feed";

export const user = {
  name: "Caro Giménez",
  initial: "C",
  role: "Maestra · Soles",
  room: "Sala Soles",
};
export const headerSummary = { children: 12, date: "martes 17 jun" };
export const posts: Post[] = [
  /* achievement, activity (with photo), announcement */
];
```

Map de variantes de `Chip` y colores del avatar de anuncio, en el componente (fidelidad al mockup por sobre la paleta canónica):

```ts
// components/ui/Chip.tsx
const CHIPS = {
  achievement: {
    bg: "#CFEBD8",
    dot: "#3E9B6C",
    text: "#3E9B6C",
    label: "LOGRO",
  },
  activity: {
    bg: "#C7E7F1",
    dot: "#2E89A6",
    text: "#2E89A6",
    label: "ACTIVIDAD",
  }, // exacto al mockup
  announcement: {
    bg: "#CCD8F4",
    dot: "#4E72C8",
    text: "#4E72C8",
    label: "ANUNCIO",
  },
};
// avatar del anuncio: fondo #CCD8F4, icono #4E72C8 (exacto al mockup)
```

## Implementation plan

1. `app/layout.tsx`: `next/font/google` (Fredoka 500–700, Nunito) + `app/globals.css`: tokens `@theme` de la paleta (fondo `#F6ECDF`, superficie `#FFFDF9`, borde `#ECE0D0`, texto `#3F362E/#4A4038/#6E6359`, muted `#94887B/#A89A8B`, accent `#D9583C/#C5503A/#E0654A/#F2937A`, gradiente botón, peach `#FBE3D8`). Verificable: dev server compila y el body se ve con el fondo correcto.
2. `lib/types/feed.ts` y `lib/mocks/feed.ts` con los datos del modelo (los 3 posts exactos: textos, horas, likes 3/5/8, comentarios 1/2/0).
3. `components/ui/Icons.tsx` con los SVG del mockup (sol, más, home, niños, campana, usuario, logout, cámara, corazón, comment, megáfono, foto-placeholder, hamburger, close).
4. `components/ui/`: las 9 primitivas (`Button`, `Chip`, `Card`, `Avatar`, `NavLink`, `IconBox`, `PhotoPlaceholder`, `SectionLabel`, `PageHeader`), agnósticas de dominio, datos por props.
5. `components/layout/`: `Sidebar`, `MobileTopBar`, `Drawer` y `AppLayout` (client component por estado del drawer; sidebar sticky 248px en ≥ lg; en < lg top bar + drawer; prop `active="feed"`).
6. `components/feed/`: `PostCard` (usa `Card`, `Avatar`, `Chip`, `PhotoPlaceholder`) y `FeedComposer` (usa `Avatar`, `IconBox`).
7. `app/page.tsx` (server component; sin `params`/`searchParams`, no necesita boundary): importa de `lib/mocks/feed.ts`, `PageHeader`, `FeedComposer`, `SectionLabel`, lista de `PostCard`s.
8. Actualizar tabla de mapeo de `AGENTS.md`: feed → `app/page.tsx`; nota de que `index.dc.html` queda sin ruta por ahora; registrar la convención de carpetas (ui/layout/dominio + lib/mocks) para las siguientes specs.
9. Verificación visual: capturas con Playwright MCP (en `.playwright-mcp/`) en ≥1024px side-by-side contra el mockup, y en 768px y 375px chequeando drawer y flow colapsado. Último paso del plan.

## Acceptance criteria

- [ ] `npm run build` pasa sin errores (typecheck incluido).
- [ ] `npx eslint app components lib` pasa sin errores.
- [ ] Los archivos existen exactamente donde dice la sección Estructura de carpetas: primitivas en `components/ui/`, layout en `components/layout/`, dominio en `components/feed/`, tipos en `lib/types/`, datos en `lib/mocks/feed.ts`.
- [ ] Ninguna primitiva de `components/ui/` importa de `components/layout`, `components/feed`, `lib/mocks` ni hardcodea textos del feed (todo por props).
- [ ] `app/page.tsx` no tiene markup del chrome del sidebar visible (viene de `components/layout/`) ni datos literales (vienen de `lib/mocks/`).
- [ ] En `≥ 1024px` la página es visualmente indistinguible del mockup al ojo (sidebar 248px, encabezado, composer, 3 cards).
- [ ] Sidebar: logo, `Button` gradiente exacto `#F4977E → #EE8164`, nav con Feed activo (`#FBE3D8/#D9583C`) y Niños/Avisos/Mi cuenta muted, bloque de usuario con avatar y logout.
- [ ] Header: eyebrow accent con letter-spacing, "Buenas, Caro" en Fredoka, "12 niños · martes 17 jun".
- [ ] `FeedComposer` visible y linkeando a `/crear-publicacion`.
- [ ] Los 3 posts con textos, horas, destinatarios, likes (3/5/8) y comentarios (1/2/0) idénticos al mockup.
- [ ] `Chip`s con colores exactos (`#CFEBD8/#3E9B6C`, `#C7E7F1/#2E89A6`, `#CCD8F4/#4E72C8`) y avatar de anuncio `#4E72C8` sobre `#CCD8F4`.
- [ ] Post de actividad con `PhotoPlaceholder` dashed de 200px linkeando a `/fotos/[id]`; comentarios → `/publicaciones/[id]`; "Editar" en `#C5503A` → `/crear-publicacion`.
- [ ] Fredoka y Nunito cargadas vía `next/font` y visibles.
- [ ] Todos los enlaces apuntan a rutas futuras reales (404 hoy); ninguno es `#`.
- [ ] En `375px`: sin scroll horizontal, top bar con hamburger visible, drawer abre/cierra (overlay click y click en link cierran), contenido legible con padding compacto.
- [ ] En `768px`: drawer + padding medio, cards y composer con flow colapsado sin solapamientos (flex-wrap en metas/avatar+chip).
- [ ] Tabla de mapeo y convención de carpetas registradas en `AGENTS.md`.

## Decisions

- **Sí:** convención de carpetas por capa: `components/ui` (primitivas agnósticas) / `components/layout` (chrome compartido) / `components/<dominio>` (composición) / `lib/mocks` (datos) + `lib/types` (tipos de dominio). Es la decisión estructural más importante de esta spec: las 14 pantallas siguientes la copian.
- **Sí:** datos mock en `lib/mocks/` (no en raíz ni en `components/`) — los datos son parte de lib, separados de la UI para enchufar la API después.
- **Sí:** fidelidad al mockup sobre la paleta canónica (`#C7E7F1/#2E89A6`, `#4E72C8` documentados como excepciones).
- **Sí:** drawer con hamburger en `< lg` y 3 cortes Tailwind (sm/lg) — no hay mockup mobile; patrón admin clásico.
- **Sí:** solo colapsar flow + paddings en mobile — sin rediseño inventado.
- **Sí:** feed en `/` — actualiza el mapeo canónico de `AGENTS.md`.
- **Sí:** identificadores de código en inglés (`Post`, `ChipType`, `user`, `headerSummary`, `time`, `text`, …) y textos de UI en español rioplatense (mockup). Los labels visibles (`LOGRO`/`ACTIVIDAD`/`ANUNCIO`, "Buenas, Caro", "Compartí un momento…") se guardan como strings en los mocks/componentes, no como keys de tipo.
- **No:** librería de iconos (lucide-react) — los ~14 paths del mockup alcanzan como SVG inline.
- **No:** página `/feed` duplicada ni redirect.
- **No:** interactividad (likes, edición real) — spec de UI estática.

## Risks

| Riesgo                                                                                                       | Mitigación                                                                                                            |
| ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| El responsive < lg es diseño sin mockup de referencia                                                        | Documentado como decisión propia (drawer + paddings); ajustes visuales van en specs siguientes, no cambia estructura. |
| Enlaces a rutas inexistentes (404)                                                                           | Aceptado: flujo esperado hasta las siguientes specs.                                                                  |
| La estructura de carpetas nueva acompasa decisiones futuras (ej. backende) que cambien el layout de dominios | La convención está escrita en `AGENTS.md`; cambiarla cuesta mover archivos, no reescribir código.                     |
| Diferencias invisibles de tipografía si next/font falla                                                      | Captura de comparación en el paso 9; Fredoka/Nunito son públicas de Google.                                           |

## What is **not** in this spec

- Autenticación, backend, base de datos.
- Crear/editar publicaciones, likes, comentarios.
- Las pantallas creadores/ninos/avisos/cuenta/etc.
- Rediseño mobile (bottom nav, cards compactas).
