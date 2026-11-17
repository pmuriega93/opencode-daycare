# SPEC 10 — Tablas `rooms` y `children` + alta real de niños en `/kids`

> **Estado:** Implementado
> **Depende de:** SPEC 02, SPEC 04, SPEC 08, SPEC 09
> **Fecha:** 2026-11-17
> **Objetivo:** Crear `public.rooms` y `public.children` con su enum, RLS para staff/admin y datos demo, y conectar `/kids`, el modal "Agregar niño" y `/kids/[id]` a Supabase para que el alta deje de ser en memoria.

## Por qué existe esta spec

SPEC 04 implementó el alta de niños **en memoria** (`useState` en `KidsPageContent`) a propósito, para poder enchufar la API después. Hoy nadie más lo impide: la base tiene `daycares` y `users` (SPEC 07 y 08), pero no existe ninguna tabla donde guardar salas ni niños, y recargar `/kids` descarta todo lo agregado.

Esta spec es la primera que conecta datos de dominio de la app a Postgres (SPEC 09 conectó solo auth y el perfil). Cierra las dos tablas que el diccionario de `07-DB-Schema` pone justo después de `users` y deja `parent_children` para su propia spec: **los niños nacen sin padres vinculados** (chip VINCULAR), por decisión del usuario.

También resuelve dos desvíos del diccionario:

- `allergy_tags` pide etiquetas en inglés, pero el modal pide texto libre en español ("Maní, Lactosa"). Se traduce con un diccionario fijo y se invierte para mostrar.
- `room_id` pasa a ser **obligatorio** (el diccionario lo deja sin `NOT NULL`): regla del usuario, todo niño tiene sala.

## Scope

**In:**

- `supabase/migrations/<version>_create_child_status_enum.sql` (nuevo) — `public.child_status` (`active`, `archived`).
- `supabase/migrations/<version>_create_rooms.sql` (nuevo) — tabla `public.rooms`, índice, unique por guardería, trigger `updated_at` y RLS habilitado.
- `supabase/migrations/<version>_create_children.sql` (nuevo) — tabla `public.children`, índice por `room_id`, trigger `updated_at` y RLS habilitado.
- `supabase/migrations/<version>_add_rooms_children_rls.sql` (nuevo) — políticas `rooms_select_own_daycare`, `rooms_insert_own_daycare`, `rooms_update_own_daycare`, `children_select_own_daycare`, `children_insert_own_daycare`, `children_update_own_daycare`.
- `supabase/migrations/<version>_seed_rooms_and_children.sql` (nuevo) — 3 salas y 8 niños con UUID fijo, idempotente.
- `lib/types/kids.ts` — tipos de fila (`RoomRow`, `ChildRow`), `Room`, `ChildStatus`, `NewChildInput`; `AddKidFormValues.room` pasa a `roomId`; `Kid` mantiene su forma actual para no tocar las tarjetas ni el perfil.
- `lib/kids.ts` — se mantienen `maskBirthdate`, `parseBirthdate`, `validateAddKid`; se agregan `parseAllergyTags`, `allergyTagLabel`, `formatMonthYear`, `toKidView`; se elimina `buildKid` (y sus helpers `slugify`, `uniqueId`, `MONTHS_ES`), que ya no tienen uso.
- `lib/kids-server.ts` (nuevo) — `getRooms()`, `getKids()` y `getKid(id)` con `createClient()` del server y `cache()`.
- `lib/kids-actions.ts` (nuevo) — Server Action `addChild(values)` que revalida en el server, inserta en `public.children` y hace `revalidatePath("/kids")`.
- `components/kids/AddKidDialog.tsx` — recibe `rooms` de la DB, llama la Server Action, muestra estado "Guardando…", error de formulario y errores de campo; deja de construir el niño en cliente.
- `components/kids/KidsPageContent.tsx` — recibe `kids` y `rooms` como props (server data); solo maneja el modal y el `router.refresh()`.
- `components/kids/KidsList.tsx` — las secciones se arman con las salas de la DB (no con `salas` de mocks); el orden lo da la query.
- `app/kids/page.tsx` — server component con `StaffLayout` + `<Suspense>` que lee salas y niños.
- `app/kids/[id]/page.tsx` — server component que lee el niño por UUID; se elimina `generateStaticParams`; conserva la pantalla "Niño no encontrado".
- `components/kids/KidProfile.tsx` — sigue recibiendo `Kid`; los padres llegan vacíos desde la DB y el modal de vincular sigue siendo el mock en memoria de SPEC 05 (no se persiste).
- `lib/mocks/kids.ts` — se conserva `kids` porque `CreatePostDialog` (feed mock) lo usa; se eliminan `salas` y `getKidById()`, que quedan sin consumidores.
- `supabase/README.md` — estado, RLS, seeds y lista de archivos.
- `AGENTS.md` — "Estado actual" (`/kids` real), sección Supabase (tablas nuevas) y la nota de numeración de specs (hoy 01–06 + 09 en `specs/`, 07–08 + 10 en `specs/database/`).
- Estado remoto: 1 enum, 2 tablas, 2 índices, 2 triggers de `updated_at`, 6 políticas RLS, 3 salas y 8 niños.

**Out of scope (para specs futuras):**

- `parent_children`, invitaciones y el flujo real de "Vincular padre" (el modal sigue siendo SPEC 05 en memoria).
- Edición y archivado de niños desde la UI, y `/kids/[id]/editar` (sigue 404).
- ABM de salas desde la UI: las salas se crean por migración; la app solo las lee.
- Feed, publicaciones, reacciones y el resto del diccionario.
- Permisos de lectura para padres sobre sus hijos (dependen de `parent_children`).
- Role-based UI, `notFound()` global, paginación y búsqueda en servidor.
- Tipos generados con `supabase gen types`.
- Edición de `07-DB-Schema/opendaycare-database-schema.md` (referencia externa).

## Data model

### Enum

```sql
create type public.child_status as enum ('active', 'archived');

comment on type public.child_status is
  'Child lifecycle. `active` is enrolled and visible; `archived` is a soft delete.';
```

### Tabla `public.rooms`

| Columna      | Tipo          | Restricciones                                             |
| ------------ | ------------- | --------------------------------------------------------- |
| `id`         | `uuid`        | PK, default `gen_random_uuid()`                           |
| `daycare_id` | `uuid`        | `NOT NULL`, FK → `public.daycares(id)` `ON DELETE CASCADE` |
| `name`       | `text`        | `NOT NULL`, no vacío, unique por `daycare_id`             |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()`                               |
| `updated_at` | `timestamptz` | `NOT NULL`, default `now()`, trigger `set_updated_at`     |

```sql
create table public.rooms (
  id         uuid        primary key default gen_random_uuid(),
  daycare_id uuid        not null references public.daycares (id) on delete cascade,
  name       text        not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rooms_name_not_blank check (length(btrim(name)) > 0),
  constraint rooms_daycare_id_name_key unique (daycare_id, name)
);

comment on table public.rooms is
  'Daycare rooms (salas). Every child belongs to exactly one room.';
comment on column public.rooms.name is
  'Display name, e.g. "Soles". Unique per daycare.';

create index rooms_daycare_id_idx on public.rooms (daycare_id);

create trigger rooms_set_updated_at
before update on public.rooms
for each row
execute function public.set_updated_at();

alter table public.rooms enable row level security;
```

### Tabla `public.children`

| Columna         | Tipo                  | Restricciones                                                       |
| --------------- | --------------------- | ------------------------------------------------------------------- |
| `id`            | `uuid`                | PK, default `gen_random_uuid()`                                     |
| `room_id`       | `uuid`                | **`NOT NULL`**, FK → `public.rooms(id)` (sin cascada)               |
| `full_name`     | `text`                | `NOT NULL`, no vacío                                                |
| `birth_date`    | `date`                | `NOT NULL`                                                          |
| `enrolled_at`   | `date`                | `NOT NULL`, default `current_date`                                  |
| `medical_notes` | `text`                | Nullable                                                            |
| `allergy_tags`  | `text[]`              | `NOT NULL`, default `'{}'`                                          |
| `photo_consent` | `boolean`             | `NOT NULL`, default `true`                                          |
| `status`        | `public.child_status` | `NOT NULL`, default `active`                                        |
| `created_at`    | `timestamptz`         | `NOT NULL`, default `now()`                                         |
| `updated_at`    | `timestamptz`         | `NOT NULL`, default `now()`, trigger `set_updated_at`               |

```sql
create table public.children (
  id            uuid                primary key default gen_random_uuid(),
  room_id       uuid                not null references public.rooms (id),
  full_name     text                not null,
  birth_date    date                not null,
  enrolled_at   date                not null default current_date,
  medical_notes text,
  allergy_tags  text[]              not null default '{}',
  photo_consent boolean             not null default true,
  status        public.child_status not null default 'active',
  created_at    timestamptz         not null default now(),
  updated_at    timestamptz         not null default now(),
  constraint children_full_name_not_blank check (length(btrim(full_name)) > 0)
);

comment on table public.children is
  'Enrolled children. A child always belongs to a room; the daycare comes from the room.';
comment on column public.children.enrolled_at is
  'Enrollment date. Defaults to the insert day.';
comment on column public.children.allergy_tags is
  'Allergy tags in English (peanut, lactose, …). The UI translates them to Spanish.';
comment on column public.children.medical_notes is
  'Free-text medical notes and instructions.';
comment on column public.children.status is
  'active = visible in the app; archived = soft-deleted, hidden from the list.';

create index children_room_id_idx on public.children (room_id);

create trigger children_set_updated_at
before update on public.children
for each row
execute function public.set_updated_at();

alter table public.children enable row level security;
```

Notas:

- No hay `daycare_id` en `children`: la guardería se deduce de `room_id`. La política de `INSERT`/`UPDATE` verifica que la sala pertenezca a la guardería del usuario, así no se puede colgar un niño de una sala ajena.
- `birth_date` no lleva check contra `current_date` (no es inmutable y complica restores); la regla "no futura" queda en `validateAddKid`.
- Sin `DELETE`: los niños se archivan con `status = 'archived'`.

### RLS

Patrón de SPEC 08: subselect a `public.users` con `(select auth.uid())`; `users_select_own` deja ver la fila propia, así que no hay recursión. No hace falta función `SECURITY DEFINER` porque no se leen filas de **otros** usuarios.

```sql
create policy rooms_select_own_daycare on public.rooms
for select to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid())
      and u.daycare_id = rooms.daycare_id
      and u.role in ('staff', 'admin')
  )
);

create policy rooms_insert_own_daycare on public.rooms
for insert to authenticated
with check (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid())
      and u.daycare_id = rooms.daycare_id
      and u.role in ('staff', 'admin')
  )
);

create policy rooms_update_own_daycare on public.rooms
for update to authenticated
using (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid())
      and u.daycare_id = rooms.daycare_id
      and u.role in ('staff', 'admin')
  )
)
with check (
  exists (
    select 1 from public.users u
    where u.id = (select auth.uid())
      and u.daycare_id = rooms.daycare_id
      and u.role in ('staff', 'admin')
  )
);

create policy children_select_own_daycare on public.children
for select to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.users u on u.id = (select auth.uid())
    where r.id = children.room_id
      and r.daycare_id = u.daycare_id
      and u.role in ('staff', 'admin')
  )
);

create policy children_insert_own_daycare on public.children
for insert to authenticated
with check (
  exists (
    select 1
    from public.rooms r
    join public.users u on u.id = (select auth.uid())
    where r.id = children.room_id
      and r.daycare_id = u.daycare_id
      and u.role in ('staff', 'admin')
  )
);

create policy children_update_own_daycare on public.children
for update to authenticated
using (
  exists (
    select 1
    from public.rooms r
    join public.users u on u.id = (select auth.uid())
    where r.id = children.room_id
      and r.daycare_id = u.daycare_id
      and u.role in ('staff', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.rooms r
    join public.users u on u.id = (select auth.uid())
    where r.id = children.room_id
      and r.daycare_id = u.daycare_id
      and u.role in ('staff', 'admin')
  )
);
```

- `authenticated` sin fila en `users` (o `pending`) no cumple el `exists` → 0 filas.
- Padres `parent` de la misma guardería tampoco ven niños: falta `parent_children`. Se resuelve en su spec.
- `anon` y `service_role`: el primero no ve nada; el segundo sigue operando (bypass de RLS).
- Sin políticas de `DELETE`.

### Seed de salas y niños

UUID fijos, mismo patrón que la guardería `1111…` y el staff `2222…`, para que las specs siguientes los referencien. Guardería demo: `11111111-1111-4111-8111-111111111111`.

| Sala      | ID                                     |
| --------- | -------------------------------------- |
| Soles     | `33333333-3333-4333-8333-333333333301` |
| Lunas     | `33333333-3333-4333-8333-333333333302` |
| Estrellas | `33333333-3333-4333-8333-333333333303` |

Los 8 niños de los mocks, **repartidos** entre las tres salas:

| #  | Nombre          | Sala      | Nacimiento | Ingreso    | `allergy_tags` | `medical_notes`                                                     |
| -- | --------------- | --------- | ---------- | ---------- | -------------- | ------------------------------------------------------------------- |
| 01 | Mateo Fernández | Soles     | 2022-03-12 | 2025-02-01 | `{peanut}`     | Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila. |
| 02 | Sofía Méndez    | Soles     | 2024-05-20 | 2025-03-01 | `{}`           | NULL                                                                |
| 03 | Benjamín Ruiz   | Soles     | 2023-07-08 | 2025-02-01 | `{}`           | NULL                                                                |
| 04 | Valentina Soto  | Soles     | 2024-01-15 | 2025-04-01 | `{}`           | NULL                                                                |
| 05 | Tomás Díaz      | Lunas     | 2023-06-15 | 2025-03-01 | `{lactose}`    | Intolerancia a la lactosa. Usar leche sin lactosa en meriendas.     |
| 06 | Emma Castro     | Lunas     | 2024-08-22 | 2025-02-01 | `{}`           | NULL                                                                |
| 07 | Lucas Romero    | Estrellas | 2023-04-10 | 2025-01-01 | `{}`           | NULL                                                                |
| 08 | Olivia Vega     | Estrellas | 2024-02-28 | 2025-05-01 | `{}`           | NULL                                                                |

IDs de los niños: `44444444-4444-4444-8444-444444444401` … `44444444-4444-4444-8444-444444444408`, en el orden de la tabla. `photo_consent = true` y `status = 'active'` para todos.

```sql
insert into public.rooms (id, daycare_id, name) values
  ('33333333-3333-4333-8333-333333333301', '11111111-1111-4111-8111-111111111111', 'Soles'),
  ('33333333-3333-4333-8333-333333333302', '11111111-1111-4111-8111-111111111111', 'Lunas'),
  ('33333333-3333-4333-8333-333333333303', '11111111-1111-4111-8111-111111111111', 'Estrellas')
on conflict (id) do nothing;

insert into public.children (
  id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags
) values
  ('44444444-4444-4444-8444-444444444401', '33333333-3333-4333-8333-333333333301',
   'Mateo Fernández', '2022-03-12', '2025-02-01',
   'Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.', '{peanut}'),
  -- … los otros 7, misma forma
on conflict (id) do nothing;
```

Reejecutar la migración no duplica filas. Si la guardería `1111…` no existe, el `insert` falla por FK: el seed asume las migraciones de SPEC 07 aplicadas.

### Tipos TypeScript

```ts
// lib/types/kids.ts (nuevo)
export type ChildStatus = "active" | "archived";

export type RoomRow = { id: string; name: string };

export type ChildRow = {
  id: string;
  full_name: string;
  birth_date: string;        // "2022-03-12"
  enrolled_at: string;       // "2025-02-01"
  medical_notes: string | null;
  allergy_tags: string[];    // ["peanut"]
  status: ChildStatus;
  rooms: { id: string; name: string } | { id: string; name: string }[] | null;
};

export type Room = { id: string; name: string }; // forma que consume la UI

export type NewChildInput = {
  fullName: string;
  birthDate: string;         // "YYYY-MM-DD"
  roomId: string;
  allergyTags: string[];     // ["peanut"]
  medicalNotes: string | null;
};

export type AddKidFormValues = {
  name: string;
  birthdate: string;         // dd/mm/aaaa
  roomId: string;            // uuid de la sala (antes: nombre)
  allergies: string;
  notes: string;
};
```

`Kid` y `Parent` quedan como están: `toKidView()` adapta la fila al shape que ya consumen `KidCard`, `KidsList` y `KidProfile`.

### Helpers (`lib/kids.ts`)

```ts
// Traduce el texto libre de la UI a tags en inglés, sin duplicados.
// separa por coma, trim, minúsculas y sin acentos; "maní" → "peanut".
// Desconocidos: slug ASCII ("Frutilla" → "frutilla"); vacíos se descartan.
parseAllergyTags(raw: string): string[];

// Tag → etiqueta visible: peanut → "Maní", lactose → "Lactosa",
// nuts → "Frutos secos", gluten → "Gluten", egg → "Huevo", soy → "Soja",
// fish → "Pescado", shellfish → "Mariscos", strawberry → "Frutilla".
// Desconocido: slug en mayúsculas ("kiwi" → "KIWI").
allergyTagLabel(tag: string): string;

// "2025-02-01" → "feb 2025" (mismo formato que los mocks).
formatMonthYear(isoDate: string): string;

// ChildRow → Kid: initial de la primera letra, avatar determinístico por hash
// del id sobre AVATAR_ROTATION, room desde rooms.name, birthdate = birth_date,
// entryDate = formatMonthYear(enrolled_at), allergies traducidas,
// notes = medical_notes (trim o undefined), parents = [].
toKidView(row: ChildRow): Kid;
```

`validateAddKid` mantiene los mismos mensajes y pasa a validar `values.roomId`.

### Server data y Server Action

```ts
// lib/kids-server.ts
export const getRooms = cache(async (): Promise<Room[]> =>
  // select id, name from rooms order by name
);

export const getKids = cache(async (): Promise<Kid[]> =>
  // select de ChildRow + rooms(id, name), status = 'active', order by full_name
);

export const getKid = cache(async (id: string): Promise<Kid | null> =>
  // .eq("id", id).eq("status", "active").maybeSingle()
  // id inválido (slug viejo) → error 22P02 → return null
);
```

```ts
// lib/kids-actions.ts
"use server";

export type AddChildResult =
  | { status: "success" }
  | { status: "error"; errors: AddKidFieldErrors; formError?: string };

export async function addChild(values: AddKidFormValues): Promise<AddChildResult>;
// 1. validateAddKid(values, new Date()) → errores de campo (no confía en el cliente).
// 2. parseBirthdate + validación de roomId contra getRooms(); sala desconocida →
//    errors.room = "Seleccioná una sala".
// 3. insert en children: room_id, full_name (trim), birth_date ISO,
//    allergy_tags = parseAllergyTags(values.allergies),
//    medical_notes = notes.trim() || null. enrolled_at/photo_consent/status por default.
// 4. error de insert (RLS, red, FK) → { status: "error", formError:
//    "No pudimos guardar el niño. Intentá de nuevo." }.
// 5. éxito → revalidatePath("/kids") y { status: "success" }.
```

## Implementation plan

Cada migración se aplica con `apply_migration` (MCP), se lee la versión con `list_migrations` y recién entonces se crea el archivo local, igual que SPEC 07 y 08. Para iterar se usa `execute_sql` dentro de `begin/rollback`; nunca `apply_migration` para probar.

1. **Migración `create_child_status_enum`**: `create type public.child_status`. Test: `select enumlabel, enumsortorder from pg_enum where enumtypid = 'public.child_status'::regtype order by 2` → `active`, `archived`.
2. **Migración `create_rooms`**: tabla, unique, chequeo de nombre, índice, trigger y RLS. Test: `list_tables` (verbose) muestra `rooms` con las 5 columnas, PK, FK y los 2 constraints; `pg_indexes` tiene `rooms_daycare_id_idx`; repetir el mismo nombre en la misma guardería falla; `''` y `'   '` fallan.
3. **Migración `create_children`**: tabla, índice, trigger y RLS. Test: `children` con las 11 columnas, PK, FK y el check de nombre; `room_id` sin valor → `not-null violation`; `allergy_tags` default `{}`; `enrolled_at` default `current_date`.
4. **Migración `add_rooms_children_rls`**: 6 políticas. Tests dentro de `begin/rollback` con `set local role authenticated` y `set local request.jwt.claims = '{"sub":"2222…","role":"authenticated"}'` (Caro):
   - `select count(*) from rooms` → 3 (después del seed) y `children` → 8.
   - `insert into children (room_id, full_name, birth_date) values ('…Soles', 'Test', '2024-01-01')` → 1 fila nueva.
   - `insert into children (room_id, full_name, birth_date) values ('…sala de otra guardería', …)` → rechazado (0 filas insertadas). La sala ajena se crea en el rollback con un `daycare_id` inventado.
   - Con un `parent` de la misma guardería (creado en el rollback vía `auth.users`): `select count(*) from children` → 0 y el insert falla.
   - `set local role anon`: `rooms` y `children` → 0 filas.
   - `pg_policies` lista las 6 políticas.
5. **Migración `seed_rooms_and_children`**: el SQL de la sección anterior. Test: 3 salas y 8 niños con los UUID de la tabla; Soles 4, Lunas 2, Estrellas 2; reejecutar el bloque no cambia los conteos.
6. **Tipos y helpers**: `lib/types/kids.ts` + `lib/kids.ts` (`parseAllergyTags`, `allergyTagLabel`, `formatMonthYear`, `toKidView`; `roomId` en el form; se quitan `buildKid`, `slugify`, `uniqueId`, `MONTHS_ES`).
7. **`lib/kids-server.ts`**: queries con RLS, orden `rooms.name` / `children.full_name`, `status = 'active'`. `getKid` tolera UUID inválido.
8. **`lib/kids-actions.ts`**: `addChild` como se describió, con `revalidatePath("/kids")`.
9. **`AddKidDialog`**: recibe `rooms` y deja de recibir `kids`; el `SelectField` usa `{ value: room.id, label: room.name }`; submit → validación cliente → `startTransition(addChild(values))`; "Guardando…" deshabilita Guardar/Cancelar; éxito → `onAdded()`; error → errores por campo + banner `formError`. `maskBirthdate` sigue filtrando la fecha.
10. **`KidsPageContent`** (client): props `{ kids, rooms }`; modal abre/cierra; en éxito `router.refresh()` y cierre. Sin `useState(kids)`.
11. **`KidsList`**: props `{ kids, rooms }`; una sección por sala de la DB en el orden recibido, ocultando vacías; el contador y la búsqueda siguen igual. `KidCard` no cambia.
12. **`app/kids/page.tsx`**: `StaffLayout` + `<Suspense fallback>` con un contenido async que llama `getRooms()` y `getKids()` y pasa props a `KidsPageContent`.
13. **`app/kids/[id]/page.tsx`**: `getKid(id)` dentro del `Suspense` existente, sin `generateStaticParams`; mismo bloque "Niño no encontrado". `KidProfile` queda igual (padres `[]` → modal de vincular mock, en memoria).
14. **`lib/mocks/kids.ts`**: queda solo `kids` (lo consume `CreatePostDialog`); se eliminan `getKidById` y `salas`.
15. **`supabase/README.md`**: estado (`rooms`, `children`, enum, RLS, seeds), nota de que los padres todavía no ven niños y los archivos nuevos.
16. **`AGENTS.md`**: "Estado actual" (`/kids` y `/kids/[id]` reales; feed, publicaciones y vincular padres siguen mock), sección Supabase (`rooms`/`children`, RLS staff/admin, seeds `3333…`/`4444…`) y la nota de numeración de specs al día.
17. **Verificación en la app** (Playwright MCP, capturas en `.playwright-mcp/`): login `caro@opendaycare.com` / `opendaycare123`; `/kids` muestra SALA ESTRELLAS (2), LUNAS (2), SOLES (4) según el orden alfabético de salas; buscar "Mateo" filtra; agregar "Martina López" en Lunas → aparece en Lunas, persiste al recargar y en `public.children`; `/kids/<uuid de Martina>` muestra nombre, edad, sala y notas; `npm run build`; `npx eslint app components lib`.
18. **Verificación final**: `list_migrations` suma las 5 migraciones nuevas; `get_advisors` (security) no agrega hallazgos (`rls_enabled_no_policy` no aparece para `rooms` ni `children`); `git status` solo muestra `specs/database/10-*`, `supabase/`, `app/kids/`, `components/kids/`, `lib/` y `AGENTS.md`.

## Acceptance criteria

- [x] `list_migrations` muestra las 5 migraciones nuevas (`create_child_status_enum`, `create_rooms`, `create_children`, `add_rooms_children_rls`, `seed_rooms_and_children`) y sus archivos locales usan la versión devuelta por el servidor.
- [x] `public.child_status` tiene exactamente `active` y `archived` en ese orden.
- [x] `public.rooms` existe con `id`, `daycare_id`, `name`, `created_at`, `updated_at`; `daycare_id` es FK a `public.daycares` con `ON DELETE CASCADE` y `name` es unique por guardería.
- [x] `public.children` existe con `id`, `room_id`, `full_name`, `birth_date`, `enrolled_at`, `medical_notes`, `allergy_tags`, `photo_consent`, `status`, `created_at`, `updated_at`.
- [x] `room_id` es `NOT NULL` y FK a `public.rooms`; un `INSERT` sin `room_id` falla.
- [x] `full_name` rechaza `''` y `'   '`; `allergy_tags` default `'{}'`; `enrolled_at` default `current_date`; `status` default `active`; `photo_consent` default `true`.
- [x] `rooms` y `children` tienen RLS activo, `rooms_daycare_id_idx` / `children_room_id_idx` y trigger `set_updated_at`.
- [x] `pg_policies` lista las 6 políticas nuevas.
- [x] Como `authenticated` con el JWT de Caro: `public.rooms` devuelve 3 filas y `public.children` 8, y un `INSERT` de niño en Soles funciona.
- [x] Un `INSERT` con `room_id` de una sala de otra guardería es rechazado por la política.
- [x] Un usuario `parent` de la misma guardería ve 0 niños y no puede insertar; `anon` ve 0 filas en ambas tablas.
- [x] El seed deja Soles con 4 niños, Lunas con 2 y Estrellas con 2, con IDs `3333…`/`4444…`; reejecutarlo no duplica.
- [x] `/kids` lee de Supabase: tras el login muestra las tres secciones, el contador correcto, la edad calculada y los chips de alergia (MANÍ en Mateo, LACTOSA en Tomás).
- [x] Todas las tarjetas muestran "sin padres vinculados" + chip VINCULAR (los niños nacen huérfanos en esta spec).
- [x] El modal "Agregar niño" toma las salas de `public.rooms` y no de `lib/mocks/kids.ts`.
- [x] Guardar con los tres obligatorios vacíos sigue mostrando los tres mensajes y no inserta nada.
- [x] Guardar un niño válido inserta una fila en `public.children` con `room_id`, `birth_date`, `allergy_tags` traducidos y `medical_notes`; el modal se cierra, la tarjeta aparece en su sala y persiste al recargar.
- [x] "Maní, Lactosa" en el campo de alergias genera `{peanut, lactose}`; la tarjeta del niño nuevo muestra `MANÍ` como primer chip.
- [x] Un fallo del insert (por ejemplo, sesión sin permisos) muestra un banner de error en el modal y no cierra.
- [x] Mientras inserta, el botón muestra "Guardando…" y no se puede duplicar el envío.
- [x] `/kids/<uuid>` lee el niño de la DB (nombre, edad, sala, ingreso, alergias y notas); un UUID inexistente o un slug viejo muestra "Niño no encontrado" sin romper la página.
- [x] `generateStaticParams` ya no existe en `/kids/[id]` y el build no falla por `params` dinámicos.
- [x] El modal "Vincular padre" del perfil sigue funcionando en memoria (SPEC 05) y no escribe en la DB.
- [x] `lib/mocks/kids.ts` conserva solo `kids` (consumido por el feed) y ningún módulo de `/kids` lo importa.
- [x] `npm run build` y `npx eslint app components lib` pasan.
- [x] `get_advisors` (security) no agrega WARN/ERROR; `rls_enabled_no_policy` no figura para `rooms` ni `children`.
- [x] `supabase/README.md` y `AGENTS.md` documentan las tablas, el enum, las políticas y los seeds.

## Decisions

- **Sí:** `rooms` y `children` en una sola spec con la app — decisión del usuario. El objetivo "desde `/kids` agregar un niño" exige tabla + UI; separarlas deja una mitad sin verificar.
- **Sí:** conectar también `/kids/[id]` en solo lectura — decisión del usuario. Sin eso, cada tarjeta recién creada llevaría a "Niño no encontrado".
- **Sí:** subset del diccionario en `children` (incluye `child_status`, `photo_consent` y `allergy_tags`) — deja listo el terreno para feed y resúmenes sin agregar columnas después.
- **Sí:** `room_id NOT NULL` — decisión del usuario: todo niño tiene sala. Se desvía del diccionario, que lo deja nullable.
- **Sí:** `allergy_tags` en inglés con diccionario español→inglés e inverso para mostrar — mantiene la convención de persistir tags en inglés sin pedirle códigos al usuario. Los desconocidos se guardan como slug ASCII (documentado y reversible).
- **Sí:** RLS solo para `staff`/`admin` de la misma guardería — decisión del usuario. Padres quedan para la spec de `parent_children`.
- **Sí:** chequeo inline contra `public.users` en las políticas, sin helper `SECURITY DEFINER` — `users_select_own` alcanza para leer la fila propia y no hay recursión (a diferencia de un "staff ve todos los usuarios", que sí la tendría).
- **Sí:** sin `DELETE` en `children`; archivado por `status` — coherente con el enum del diccionario.
- **Sí:** salas y niños con UUID fijo y `on conflict do nothing` — mismo patrón de seeds que SPEC 07 y 08; reproducible y referenciable.
- **Sí:** 8 niños repartidos 4/2/2 — decisión del usuario. El mockup mostraba los 8 en Soles; el reparto ejercita las tres secciones.
- **Sí:** salas ordenadas por `name` y niños por `full_name` — determinístico; `created_at` es igual dentro del seed y no sirve para ordenar.
- **Sí:** `enrolled_at` default `current_date` — el modal no pide fecha de ingreso; una fecha de alta equivocada es peor que la del día.
- **Sí:** avatar determinístico por hash del `id`, sin columna — no hay que persistir cosmética y el color no cambia entre renders.
- **Sí:** Server Action con validación duplicada en el server — el cliente puede saltearla; RLS es la última frontera.
- **Sí:** `router.refresh()` tras el alta — la lista es server data; evita duplicar la lógica de orden/agrupado en el cliente.
- **Sí:** conservar el modal de vincular padres de SPEC 05 en memoria — no se pidió la vinculación y quitarlo sería un retroceso visual; se documenta que no persiste.
- **No:** `parent_children`, invitaciones o usuario parent demo.
- **No:** ABM de salas en la UI; se crean por migración.
- **No:** edición/archivado de niños y `/kids/[id]/editar`.
- **No:** tipos generados de Supabase — el repo usa tipos manuales para las filas que consume.
- **No:** editar el diccionario `07-DB-Schema`; las diferencias quedan en esta spec y en el README.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Las políticas inline sobre `children` hacen subselect a `rooms` y `users` por fila | `rooms` y `children` son tablas chicas y `(select auth.uid())` es estable; si aparece lentitud, se reemplaza por una función `SECURITY DEFINER` `current_daycare_id()` cacheada. |
| Cambiar `AddKidFormValues.room` a `roomId` rompe el modal existente | El cambio es local a `/kids`: `AddKidDialog` y `validateAddKid` son los únicos consumidores (verificado por grep). |
| `getKid` recibe slugs viejos (`mateo-fernandez`) y Postgres falla con `22P02` | `getKid` captura el error y devuelve `null`; la página muestra "Niño no encontrado". Se evalúa en el plan de verificación. |
| La lista deja de verse igual al mockup (8 en Soles con padres) | Decisión del usuario: reparto 4/2/2 y todos sin padres. Se documenta acá y en `AGENTS.md`. |
| `parseAllergyTags` pierde matices ("alergia al maní" → `peanut`) | El texto original de notas va a `medical_notes`; el tag es para el chip. El diccionario cubre las alergias de los seeds. |
| El seed falla si la guardería demo no existe | El seed depende de SPEC 07; el FK lo hace explícito. Orden de migraciones documentado en el plan. |
| El insert desde la app falla por RLS y el usuario no entiende | Banner `formError` con mensaje claro + verificación con sesión real de Caro. |
| El `unique (daycare_id, name)` impide futuras salas con el mismo nombre | Es intencional: dos "Soles" en la misma guardería serían ambiguas en la UI. |
| `photo_consent`/`status` no se pueden cambiar desde la app | Fuera de scope; se agregan cuando exista la pantalla de edición. |

## What is **not** in this spec

- `parent_children`, invitaciones, vinculación real de padres y usuario parent demo.
- Edición, archivado y borrado de niños; `/kids/[id]/editar`.
- ABM de salas desde la UI.
- Feed, publicaciones, etiquetado de niños en posts, resúmenes diarios y dispositivos.
- Lectura de niños por parte de padres.
- Role-based UI, paginación y búsqueda server-side.
- Tipos generados de Supabase y edición del diccionario `07-DB-Schema`.

Cada uno de esos puntos, si llega, va en su propia spec.
