# SPEC 07 — Tabla `daycares` y patrón de migraciones

> **Estado:** Aprobado
> **Depende de:** — (primera spec de base de datos)
> **Fecha:** 2026-11-11
> **Objetivo:** Crear `public.daycares` como primera tabla del proyecto con migraciones SQL versionadas en `supabase/migrations/`, aplicadas al proyecto remoto por MCP, y dejar documentado el flujo para todas las tablas siguientes.

## Por qué existe esta spec

`07-DB-Schema/opendaycare-database-schema.md` define `daycares` como la entidad raíz del modelo, pero el proyecto remoto (`bsrjfdacxfiypvqfhhda`) solo tiene dos migraciones de prueba (`create_test_connection_table` / `drop_test_connection_table`) y ninguna tabla. El repo tampoco tiene carpeta `supabase/`, así que todavía no existe un patrón para llevar el diccionario a la base real.

Esta spec hace dos cosas a la vez: crea la primera tabla del diccionario y establece el patrón de migraciones que van a reutilizar las specs de `users`, `rooms`, `children` y el resto. El patrón no es `supabase db push`: el proyecto no tiene Docker local ni un `SUPABASE_DB_PASSWORD` válido en `.env` (hoy es `XXXXXX`), así que las migraciones se aplican por MCP y el SQL se versiona en el repo.

## Scope

**In:**

- `supabase/config.toml` y `supabase/.gitignore` — generados con `npx supabase init`.
- `supabase/migrations/<version>_add_set_updated_at_function.sql` (nuevo) — función reutilizable `public.set_updated_at()`.
- `supabase/migrations/<version>_create_daycares.sql` (nuevo) — tabla `public.daycares`, trigger de `updated_at` y RLS habilitado sin políticas.
- `supabase/migrations/<version>_seed_initial_daycare.sql` (nuevo) — `INSERT` idempotente de "Guardería Sala Soles" con UUID fijo.
- `supabase/README.md` (nuevo) — el flujo de migraciones paso a paso, para humanos.
- `AGENTS.md` — sección Supabase actualizada con el estado real (carpeta `supabase/`, tabla `daycares`) y el flujo de migraciones.
- Estado remoto: función `public.set_updated_at()`, tabla `public.daycares` con `updated_at` automático, RLS activo sin políticas y la fila inicial.

**Out of scope (para specs futuras):**

- Tabla `users` y el trigger `AFTER INSERT` sobre `auth.users`.
- Políticas RLS de `daycares`: llegan con la spec de `users`, que es la que conoce el `daycare_id` de cada usuario.
- `supabase-js`, `@supabase/ssr`, variables de entorno del cliente, generación de tipos TypeScript y cualquier conexión de la app a datos reales.
- Docker y stack local (`supabase start`); el flujo `db push` end-to-end queda para cuando haya un `SUPABASE_DB_PASSWORD` real.
- Backfill local de las dos migraciones de prueba ya aplicadas en remoto.
- Seed de salas, niños o usuarios; solo se siembra la guardería.
- CI que aplique migraciones automáticamente.
- `rooms`, `children`, `posts` y el resto del diccionario.

## Data model

Tabla resultante:

| Columna      | Tipo          | Restricciones                                                    |
| ------------ | ------------- | ---------------------------------------------------------------- |
| `id`         | `uuid`        | PK, default `gen_random_uuid()`                                  |
| `name`       | `text`        | `NOT NULL`, check `length(btrim(name)) > 0`                      |
| `timezone`   | `text`        | `NOT NULL`, default `'America/Argentina/Buenos_Aires'`           |
| `created_at` | `timestamptz` | `NOT NULL`, default `now()`                                      |
| `updated_at` | `timestamptz` | `NOT NULL`, default `now()`, actualizado por trigger en `UPDATE` |

### Migración 1 — función `set_updated_at`

```sql
-- Función reutilizable: cada tabla con updated_at la engancha con un trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Sets NEW.updated_at to now() on UPDATE. Attach with BEFORE UPDATE ... FOR EACH ROW.';
```

### Migración 2 — tabla `daycares`

```sql
create table public.daycares (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  timezone   text        not null default 'America/Argentina/Buenos_Aires',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daycares_name_not_blank check (length(btrim(name)) > 0)
);

comment on table public.daycares is
  'Daycare center. Tenant root for users, rooms and children.';
comment on column public.daycares.timezone is
  'IANA timezone used for daily summaries and scheduled notifications.';

create trigger daycares_set_updated_at
before update on public.daycares
for each row
execute function public.set_updated_at();

alter table public.daycares enable row level security;
```

### Migración 3 — seed de la guardería inicial

```sql
insert into public.daycares (id, name, timezone)
values (
  '11111111-1111-4111-8111-111111111111',
  'Guardería Sala Soles',
  'America/Argentina/Buenos_Aires'
)
on conflict (id) do nothing;
```

El UUID `11111111-1111-4111-8111-111111111111` es un identificador fijo y documentado de la guardería demo. Las specs siguientes lo usan como `daycare_id` en seeds y tests.

Convenciones:

- Todo lo persistido va en inglés (`daycares`, `name`, `timezone`, nombres de constraints y trigger).
- Los comentarios de tabla y columna van en inglés; las etiquetas visibles se traducen en la UI.
- El `timezone` es una zona IANA, no una abreviatura.
- Sin `GRANT` explícitos: los privilegios por defecto del schema `public` ya dan acceso a `anon`, `authenticated` y `service_role`; RLS es la que decide las filas.

## Implementation plan

Cada migración se aplica con `apply_migration` (MCP) y después se crea el archivo local con la **versión que devuelve el servidor**, para que local y remoto coincidan exactamente.

1. **Inicializar la estructura**: `npx supabase init` (sin `-i`) en la raíz. Verificar que existen `supabase/config.toml` y `supabase/.gitignore`. Si el `project_id` derivado del nombre de la carpeta no es válido para el CLI, dejarlo en `open-daycare`. Manual test: `npx supabase config --help` reconoce la carpeta; no se levanta ningún contenedor.
2. **Migración `add_set_updated_at_function`**: aplicar con `apply_migration` el SQL de la migración 1. Manual test: `select to_regprocedure('public.set_updated_at()')` devuelve la función. Leer la versión nueva con `list_migrations` y crear `supabase/migrations/<version>_add_set_updated_at_function.sql` con el mismo SQL aplicado.
3. **Migración `create_daycares`**: aplicar con `apply_migration` el SQL de la migración 2. Manual test: `list_tables` (verbose) muestra `daycares` con sus 5 columnas y la PK. Leer la versión con `list_migrations` y crear `supabase/migrations/<version>_create_daycares.sql`.
4. **Verificar el trigger**: actualizar una fila y comparar `updated_at > created_at`. Se hace después del paso 5, cuando ya existe la fila.
5. **Migración `seed_initial_daycare`**: aplicar con `apply_migration` el SQL de la migración 3. Manual test: la tabla tiene exactamente una fila con nombre "Guardería Sala Soles" y el UUID fijo. Repetir el `INSERT` a mano con `execute_sql` no duplica la fila. Crear `supabase/migrations/<version>_seed_initial_daycare.sql` con la versión devuelta.
6. **Verificar RLS**: `begin; set local role authenticated; select count(*) from public.daycares; rollback;` devuelve `0` (tabla con RLS y sin políticas). `pg_class.relrowsecurity` es `true` y `pg_policies` no tiene filas para `daycares`.
7. **`supabase/README.md`**: documentar el flujo en cinco pasos (escribir SQL → aplicar por MCP con un nombre en snake_case → leer la versión en `list_migrations` → crear el archivo local con esa versión → verificar con `list_migrations` y advisors). Incluir las reglas: una migración ya aplicada no se edita, se corrige con otra; `apply_migration` nunca se usa para iterar; el historial local debe reflejar el remoto; y `db push` queda bloqueado hasta tener un `SUPABASE_DB_PASSWORD` real.
8. **`AGENTS.md`**: en "Estado actual" reemplazar "No hay backend, API, base de datos" por el estado real (la base tiene `public.daycares`; la app sigue sin conexión). En la sección Supabase, reemplazar "no hay carpeta `supabase/` ni migraciones" por el flujo vigente y apuntar a `supabase/README.md`. Mantener la advertencia de no inventar tablas ni endpoints.
9. **Verificación final**: `list_migrations` muestra las 5 migraciones (2 de prueba + 3 nuevas) con los nombres esperados; `get_advisors` (security) no agrega hallazgos nuevos sobre `daycares`; `git status` solo muestra los archivos de esta spec.

## Acceptance criteria

- [x] `supabase/config.toml` y `supabase/.gitignore` existen y `npx supabase` reconoce la carpeta.
- [x] `supabase/migrations/` contiene exactamente 3 archivos nuevos, cada uno con el prefijo de versión que figura en `supabase_migrations.schema_migrations`.
- [x] `list_migrations` devuelve las 5 migraciones: las 2 de prueba y `add_set_updated_at_function`, `create_daycares`, `seed_initial_daycare`.
- [x] `public.daycares` existe con las columnas `id`, `name`, `timezone`, `created_at` y `updated_at`, en ese orden.
- [x] `id` es PK `uuid` con default `gen_random_uuid()`.
- [x] `name` es `text NOT NULL` y rechaza cadenas vacías o solo con espacios (`CHECK (length(btrim(name)) > 0)`).
- [x] `timezone` es `text NOT NULL` con default `America/Argentina/Buenos_Aires`.
- [x] `created_at` y `updated_at` son `timestamptz NOT NULL` con default `now()`.
- [x] `public.set_updated_at()` existe, es `SECURITY INVOKER` y tiene `search_path` vacío.
- [x] El trigger `daycares_set_updated_at` corre en `BEFORE UPDATE FOR EACH ROW` y, al actualizar una fila, cambia `updated_at` sin tocar `created_at`.
- [x] `public.daycares` tiene `relrowsecurity = true` y cero políticas en `pg_policies`.
- [x] Una consulta `SELECT` ejecutada como rol `authenticated` devuelve 0 filas.
- [x] Existe exactamente una fila en `public.daycares`: UUID `11111111-1111-4111-8111-111111111111`, nombre "Guardería Sala Soles" y timezone `America/Argentina/Buenos_Aires`.
- [x] Repetir el `INSERT` del seed no duplica la fila.
- [x] El SQL de cada archivo local coincide con el `statements` guardado en `supabase_migrations.schema_migrations`.
- [x] `supabase/README.md` documenta el flujo de cinco pasos y las reglas de no editar migraciones aplicadas.
- [x] `AGENTS.md` ya no dice que no existe carpeta `supabase/` ni migraciones, y apunta a `supabase/README.md`.
- [x] `get_advisors` (security) no reporta hallazgos nuevos sobre `daycares`; solo quedan los dos warnings preexistentes de `rls_auto_enable`.
  - **Nota**: el único hallazgo nuevo es el INFO esperado `rls_enabled_no_policy` sobre `daycares` (documentado en `supabase/README.md` y en la tabla de riesgos). No hay WARN/ERROR nuevos.
- [x] `git status` no muestra archivos fuera de `supabase/`, `specs/07-*` y `AGENTS.md`.

## Decisions

- **Sí:** migraciones SQL versionadas en `supabase/migrations/` y aplicadas por MCP `apply_migration` — decisión del usuario. No hay Docker local ni `SUPABASE_DB_PASSWORD` válido, y así el schema queda en git.
- **Sí:** el archivo local se nombra con la versión que asigna el MCP, no con un timestamp propio — decisión del usuario. Evita el drift entre historial local y remoto y deja `db push` utilizable en el futuro.
- **Sí:** `npx supabase init` en vez de crear la carpeta a mano — decisión del usuario. Deja `config.toml` y `.gitignore` listos para el CLI.
- **Sí:** documentar el patrón en `AGENTS.md` y en `supabase/README.md` — decisión del usuario. AGENTS.md es la guía de los agentes; el README es para humanos.
- **Sí:** PK `uuid` con `gen_random_uuid()` — viene del diccionario de referencia y se mantiene como decisión cerrada, aunque UUIDv4 fragmente índices en tablas grandes. `daycares` tiene pocas filas y los IDs se exponen en la API.
- **Sí:** `updated_at` desde la primera tabla, con función y trigger reutilizables — decisión del usuario. Todas las tablas siguientes enganchan el mismo trigger.
- **Sí:** columna `timezone` con default `America/Argentina/Buenos_Aires` — decisión del usuario. La necesitan el resumen diario de las 19:00 y las notificaciones.
- **Sí:** RLS habilitado y sin políticas — decisión del usuario. Deny-all para `anon` y `authenticated` hasta que la spec de `users` defina el `daycare_id` del usuario; `service_role` sigue operando.
- **Sí:** seed en una migración aparte, con UUID fijo y `on conflict do nothing` — decisión del usuario. Las specs futuras tienen un `daycare_id` estable sin depender de un `select` previo.
- **Sí:** comentarios de tabla y columna en inglés — consistente con la convención de que lo persistido va en inglés.
- **Sí:** sin `GRANT` explícitos — los privilegios por defecto de `public` ya cubren a los roles; RLS es la capa que decide.
- **No:** `supabase db push` y stack local con Docker — no hay Docker ni password válido; se documenta como camino futuro.
- **No:** políticas RLS en esta spec — dependen de `users`, que todavía no existe.
- **No:** backfill de las dos migraciones de prueba — ya están aplicadas en remoto y no aportan al schema; el README aclara que el historial local arranca en esta spec.
- **No:** `supabase-js`, `@supabase/ssr`, tipos generados y conexión de la app — otra spec.
- **No:** seeds de salas, niños o usuarios — otra spec.

## Risks

| Riesgo                                                                   | Mitigación                                                                                                                                |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| El archivo local queda con una versión distinta a la remota              | La versión se lee de `list_migrations` después de aplicar y se usa tal cual en el nombre del archivo; se compara con `statements`.        |
| `npx supabase init` deriva un `project_id` inválido de `06-open-daycare` | Si el CLI se queja, se fija `project_id = "open-daycare"` en `config.toml` antes de continuar.                                            |
| RLS sin políticas deja la tabla ilegible para el cliente                 | Es intencional: la app no está conectada y las políticas llegan con la spec de `users`. La verificación como `authenticated` lo confirma. |
| El advisor marca `rls_enabled_no_policy` como INFO                       | Es el estado buscado; se documenta en el README y se resuelve cuando existan las políticas.                                               |
| El remoto tiene 2 migraciones de prueba sin archivo local                | No bloquean migraciones nuevas; si alguna vez se necesita un baseline estricto, se corre `supabase db pull` y se revisa el diff.          |
| El UUID fijo del seed choca con una fila existente                       | `on conflict (id) do nothing` mantiene la migración idempotente.                                                                          |
| Alguien edita una migración ya aplicada                                  | El README y `AGENTS.md` lo prohíben explícitamente; todo cambio va en una migración nueva.                                                |

## What is **not** in this spec

- Tabla `users` y el trigger sobre `auth.users`.
- Políticas RLS de `daycares`.
- `supabase-js`, `@supabase/ssr`, variables de entorno del cliente y tipos generados.
- Conexión de la app a Supabase: los mocks siguen mandando.
- Docker, stack local y `db push` end-to-end.
- Backfill de las migraciones de prueba.
- Seeds de salas, niños o usuarios.
- CI de migraciones.

Cada uno de esos puntos, si llega, va en su propia spec.
