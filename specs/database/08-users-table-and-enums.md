# SPEC 08 — Tabla `users`, enums `user_role`/`user_status` y usuario staff de prueba

> **Estado:** Aprobado
> **Depende de:** SPEC 07
> **Fecha:** 2026-11-12
> **Objetivo:** Crear `public.users` con los enums `user_role` y `user_status`, el trigger que crea el perfil desde `auth.users`, las políticas RLS mínimas de `users` y `daycares`, y un usuario staff demo para probar el login.

## Por qué existe esta spec

SPEC 07 dejó `public.daycares` con RLS activo y **sin políticas**, y documentó que las políticas llegarían con la spec de `users`, que es la única que conoce el `daycare_id` de cada usuario. Ese pendiente se cierra acá.

El diccionario de referencia define `users` como el perfil de dominio enlazado 1:1 a Supabase Auth. Hoy `auth.users` está vacío, no existe ningún trigger que cree el perfil y no hay forma de probar el login con datos reales. Esta spec crea la tabla, los enums, el trigger y un usuario staff reproducible.

También corrige un punto del diccionario: propone pasar `role` y `daycare_id` por `raw_user_meta_data`, pero ese campo lo escribe el cliente en el signup. Cualquiera podría mandar `{"role":"admin"}`. Acá se leen de `raw_app_meta_data`, que solo puede escribir `service_role`, como exige `AGENTS.md`.

## Scope

**In:**

- `supabase/migrations/<version>_create_user_enums.sql` (nuevo) — tipos `public.user_role` (`staff`, `parent`, `admin`) y `public.user_status` (`pending`, `active`), con comentarios.
- `supabase/migrations/<version>_create_users.sql` (nuevo) — tabla `public.users`, índice por `daycare_id`, trigger `updated_at` y RLS habilitado.
- `supabase/migrations/<version>_create_handle_new_user_trigger.sql` (nuevo) — función `public.handle_new_user()` `SECURITY DEFINER` y trigger `AFTER INSERT` sobre `auth.users`.
- `supabase/migrations/<version>_add_users_rls_and_guards.sql` (nuevo) — políticas `users_select_own`, `users_update_own`, `daycares_select_own`, y el trigger de guarda de columnas privilegiadas.
- `supabase/migrations/<version>_seed_staff_user.sql` (nuevo) — usuario staff demo `caro@opendaycare.com` en `auth.users` + `auth.identities`, perfil creado por el trigger.
- `supabase/README.md` — estado de `users`, credenciales demo, enums, trigger y RLS; se elimina la nota de "daycares sin políticas".
- `AGENTS.md` — "Estado actual" y sección Supabase actualizadas con `users`, el trigger y el seed staff.
- Estado remoto: 2 enums, tabla `users` con RLS y políticas, trigger sobre `auth.users`, función de guarda y 1 usuario staff (`auth.users` + `public.users`).
- Verificación funcional: login real contra `POST /auth/v1/token?grant_type=password` y lectura del perfil vía PostgREST con el access token.

**Out of scope (para specs futuras):**

- Usuario `parent` demo, invitaciones y `parent_children` (van con la spec de invitaciones).
- `rooms`, `children`, `posts`, `daily_summaries`, `devices` y el resto del diccionario.
- Política para que staff/admin lean a todos los usuarios de su guardería.
- UI de alta, login real en la app, redirección por rol, recuperación de contraseña y plantillas de email.
- `supabase-js`, `@supabase/ssr`, variables de entorno del cliente y tipos generados.
- Conexión de la app a datos reales: los mocks siguen mandando.
- Administración de usuarios (cambiar rol, desactivar) desde una pantalla.
- Edición de `07-DB-Schema/opendaycare-database-schema.md`: es referencia externa, no se toca.

## Data model

### Enums

```sql
create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

comment on type public.user_role is
  'Application role. `staff` and `admin` are daycare team members; `parent` is a family member.';
comment on type public.user_status is
  'Profile lifecycle. `pending` until the user is linked to a daycare; `active` once linked.';
```

### Tabla `public.users`

| Columna                 | Tipo                 | Restricciones                                         |
| ----------------------- | -------------------- | ----------------------------------------------------- |
| `id`                    | `uuid`               | PK, FK → `auth.users(id)` `ON DELETE CASCADE`         |
| `daycare_id`            | `uuid`               | FK → `public.daycares(id)`, **nullable**              |
| `role`                  | `public.user_role`   | `NOT NULL`, default `parent`                          |
| `status`                | `public.user_status` | `NOT NULL`, default `pending`                         |
| `full_name`             | `text`               | `NOT NULL`, check no vacío                            |
| `avatar_url`            | `text`               | Nullable                                              |
| `notify_on_post`        | `boolean`            | `NOT NULL`, default `true`                            |
| `daily_summary_enabled` | `boolean`            | `NOT NULL`, default `true`                            |
| `created_at`            | `timestamptz`        | `NOT NULL`, default `now()`                           |
| `updated_at`            | `timestamptz`        | `NOT NULL`, default `now()`, trigger `set_updated_at` |

```sql
create table public.users (
  id                    uuid               primary key
                          references auth.users (id) on delete cascade,
  daycare_id            uuid               references public.daycares (id),
  role                  public.user_role   not null default 'parent',
  status                public.user_status not null default 'pending',
  full_name             text               not null,
  avatar_url            text,
  notify_on_post        boolean            not null default true,
  daily_summary_enabled boolean            not null default true,
  created_at            timestamptz        not null default now(),
  updated_at            timestamptz        not null default now(),
  constraint users_full_name_not_blank check (length(btrim(full_name)) > 0),
  constraint users_active_requires_daycare check (status <> 'active' or daycare_id is not null)
);

comment on table public.users is
  'Application profile linked 1:1 to auth.users. Credentials and email live in auth.users.';
comment on column public.users.daycare_id is
  'Daycare the user belongs to. NULL until an invitation links the user (status = pending).';
comment on column public.users.role is
  'Application role. Written from app_metadata at signup; only service_role can change it.';
comment on column public.users.status is
  'pending = signed up but not linked to a daycare; active = linked and operational.';

create index users_daycare_id_idx on public.users (daycare_id);

create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

alter table public.users enable row level security;
```

### Trigger de alta

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  app_meta     jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
  user_meta    jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_daycare_id uuid  := nullif(app_meta ->> 'daycare_id', '')::uuid;
  v_role       public.user_role := coalesce(nullif(app_meta ->> 'role', ''), 'parent')::public.user_role;
  v_full_name  text  := coalesce(
    nullif(btrim(app_meta ->> 'full_name'), ''),
    nullif(btrim(user_meta ->> 'full_name'), ''),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'Usuario'
  );
begin
  if v_role in ('staff', 'admin') and v_daycare_id is null then
    raise exception 'app_metadata.daycare_id is required for role %', v_role;
  end if;

  insert into public.users (id, daycare_id, role, status, full_name)
  values (
    new.id,
    v_daycare_id,
    v_role,
    (case when v_daycare_id is null then 'pending' else 'active' end)::public.user_status,
    v_full_name
  );

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Creates public.users after an auth.users insert. role and daycare_id come from app_metadata; full_name from app_metadata or user metadata.';

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();
```

Reglas del trigger:

- `role` y `daycare_id` salen **solo** de `raw_app_meta_data`. Si falta `role`, es `parent`.
- `full_name` cae en cascada: `app_metadata` → `user_metadata` (dato de display, no de autorización) → parte local del email → `'Usuario'`.
- Si el rol es `staff`/`admin` sin `daycare_id`, el insert falla con un mensaje claro.
- Sin `daycare_id` el perfil queda `pending`; con `daycare_id`, `active`.
- El alta de `auth.users` dispara el trigger; no hay endpoint de alta en esta spec.

### RLS y guarda de columnas

```sql
create policy users_select_own on public.users
for select to authenticated
using ((select auth.uid()) = id);

create policy users_update_own on public.users
for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy daycares_select_own on public.daycares
for select to authenticated
using (
  id = (select u.daycare_id from public.users u where u.id = (select auth.uid()))
);

create or replace function public.guard_user_privileged_columns()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (select auth.uid()) = old.id then
    new.role       := old.role;
    new.status     := old.status;
    new.daycare_id := old.daycare_id;
  end if;
  return new;
end;
$$;

comment on function public.guard_user_privileged_columns() is
  'Reverts role, status and daycare_id when a signed-in user updates their own profile. service_role (auth.uid() is NULL) is unaffected.';

revoke all on function public.guard_user_privileged_columns() from public, anon, authenticated;

create trigger users_guard_privileged_columns
before update on public.users
for each row
execute function public.guard_user_privileged_columns();
```

- `users`: sin política de `INSERT` ni `DELETE`. Las filas las crea el trigger y las borra el `ON DELETE CASCADE` de `auth.users`.
- `daycares`: se cierra el pendiente de SPEC 07. `anon` sigue viendo 0 filas.
- El guard corre antes que `set_updated_at` (orden alfabético de triggers) y no interfiere con él.

### Seed del staff

UUID fijo `22222222-2222-4222-8222-222222222222`, igual que la guardería demo tiene el suyo.

```sql
do $$
declare
  v_user_id uuid := '22222222-2222-4222-8222-222222222222';
  v_email   text := 'caro@opendaycare.com';
begin
  if exists (select 1 from auth.users where email = v_email) then
    return;
  end if;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    v_email,
    extensions.crypt('opendaycare123', extensions.gen_salt('bf')),
    now(),
    jsonb_build_object(
      'provider', 'email',
      'providers', jsonb_build_array('email'),
      'role', 'staff',
      'daycare_id', '11111111-1111-4111-8111-111111111111',
      'full_name', 'Caro Giménez'
    ),
    jsonb_build_object('full_name', 'Caro Giménez'),
    now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (
    id, user_id, provider_id, provider, identity_data,
    last_sign_in_at, created_at, updated_at
  ) values (
    gen_random_uuid(),
    v_user_id,
    v_user_id::text,
    'email',
    jsonb_build_object(
      'sub', v_user_id::text,
      'email', v_email,
      'email_verified', true,
      'phone_verified', false
    ),
    now(), now(), now()
  );
end
$$;
```

Credenciales demo (documentadas en `supabase/README.md`): `caro@opendaycare.com` / `opendaycare123`, rol `staff`, guardería "Guardería Sala Soles".

## Implementation plan

Cada migración se aplica con `apply_migration` (MCP) y después se crea el archivo local con la **versión que devuelve el servidor**, igual que SPEC 07. `crypt` y `gen_salt` viven en el schema `extensions`, por eso van calificados.

1. **Migración `create_user_enums`**: aplicar el SQL de enums. Test: `select enumlabel from pg_enum` devuelve `staff, parent, admin` y `pending, active` en ese orden. Leer la versión y crear el archivo local.
2. **Migración `create_users`**: tabla, índice, trigger de `updated_at` y RLS. Test: `list_tables` (verbose) muestra `users` con las 10 columnas, la PK, las 2 FKs y los 2 checks; `pg_indexes` tiene `users_daycare_id_idx`; `pg_class.relrowsecurity = true`. Archivo local con la versión.
3. **Migración `create_handle_new_user_trigger`**: función y trigger. Tests dentro de `begin/rollback`:
   - Insert en `auth.users` sin metadata → `public.users` con `parent`, `pending`, `daycare_id` null.
   - Insert con `app_metadata = {"role":"staff","daycare_id":"1111...","full_name":"Test Staff"}` → `staff`, `active`, `full_name` correcto.
   - Insert con `role: "staff"` y sin `daycare_id` → error `app_metadata.daycare_id is required`.
   - `select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal` devuelve `on_auth_user_created`.
4. **Migración `add_users_rls_and_guards`**: 3 políticas y la guarda. Tests dentro de `begin/rollback` con `set local role authenticated` + `set local request.jwt.claims = '{"sub":"2222...","role":"authenticated"}'`:
   - `select count(*) from public.users` → 1 (solo Caro).
   - `select count(*) from public.daycares` → 1.
   - `update public.users set role = 'admin', full_name = 'Caro G.'` → el rol sigue `staff` y el nombre cambia.
   - Con `set local role anon`, `select count(*) from public.users` y `public.daycares` → 0.
5. **Migración `seed_staff_user`**: el `DO` block. Test: `auth.users` y `public.users` tienen 1 fila cada una; el perfil es `staff`, `active`, `Caro Giménez`, `daycare_id = 1111...`. Repetir el bloque no duplica.
6. **Verificar login real**: `POST https://bsrjfdacxfiypvqfhhda.supabase.co/auth/v1/token?grant_type=password` con header `apikey` (la publishable key se lee con `get_publishable_keys`, no se hardcodea) y body `{"email":"caro@opendaycare.com","password":"opendaycare123"}` devuelve `access_token`. Con ese token, `GET /rest/v1/users?select=id,role,status,full_name,daycare_id` devuelve la fila de Caro. Crear el archivo local con la versión del seed.
7. **`supabase/README.md`**: agregar `users` al estado, las credenciales demo, los enums, el trigger (`app_metadata`, `pending`/`active`), las políticas y el guard. Eliminar la frase de que `daycares` queda sin políticas "hasta que la spec de `users` defina el `daycare_id`".
8. **`AGENTS.md`**: en "Estado actual", reemplazar "la base remota ya tiene `public.daycares`…" por `daycares` + `users` (+ enums, trigger, política y staff demo), manteniendo que la app sigue sin conexión. En la sección Supabase, agregar que `role`/`daycare_id` solo se escriben desde `app_metadata`.
9. **Verificación final**: `list_migrations` muestra 10 migraciones (2 de prueba + 3 de SPEC 07 + 5 nuevas); `get_advisors` (security) no agrega WARN/ERROR y `rls_enabled_no_policy` ya no aparece para `daycares` ni `users`; `git status` solo muestra esta spec, `supabase/` y `AGENTS.md`.

## Acceptance criteria

- [x] `list_migrations` muestra las 5 migraciones nuevas con los nombres `create_user_enums`, `create_users`, `create_handle_new_user_trigger`, `add_users_rls_and_guards` y `seed_staff_user`.
- [x] Los 5 archivos locales usan exactamente la versión devuelta por `list_migrations` y su SQL coincide con `supabase_migrations.schema_migrations.statements`.
- [x] `public.user_role` tiene exactamente `staff`, `parent`, `admin` en ese orden; `public.user_status` tiene `pending`, `active`.
- [x] `public.users` existe con las columnas `id`, `daycare_id`, `role`, `status`, `full_name`, `avatar_url`, `notify_on_post`, `daily_summary_enabled`, `created_at`, `updated_at`.
- [x] `id` es PK y FK a `auth.users(id)` con `ON DELETE CASCADE`; borrar el `auth.users` de prueba borra su fila en `public.users`.
- [x] `daycare_id` es nullable, FK a `public.daycares(id)` sin cascada, y tiene índice `users_daycare_id_idx`.
- [x] `full_name` rechaza `''` y `'   '`.
- [x] `status = 'active'` con `daycare_id` null es rechazado por `users_active_requires_daycare`.
- [x] `public.handle_new_user()` es `SECURITY DEFINER`, tiene `search_path = ''` y no es ejecutable por `public`, `anon` ni `authenticated`.
- [x] Un alta en `auth.users` sin metadata crea `role = parent`, `status = pending`, `daycare_id` null.
- [x] Un alta con `app_metadata` `{"role":"staff","daycare_id":"1111...","full_name":"X"}` crea `staff`, `active` y el `full_name` indicado.
- [x] Un alta con `role: "staff"` y sin `daycare_id` falla con un error explícito y no deja filas huérfanas.
- [x] El trigger `on_auth_user_created` corre `AFTER INSERT ... FOR EACH ROW` sobre `auth.users`.
- [x] Como `authenticated` con el JWT de Caro, `public.users` devuelve solo su fila y `public.daycares` devuelve solo "Guardería Sala Soles".
- [x] Como `authenticated`, un `UPDATE` de `role` a `admin` sobre la fila propia deja `role = staff`, pero sí cambia `full_name`.
- [x] Como `anon`, `select` sobre `users` y `daycares` devuelve 0 filas.
- [x] `public.users` y `public.daycares` tienen RLS activo y políticas; `pg_policies` lista `users_select_own`, `users_update_own` y `daycares_select_own`.
- [x] Después del seed, `auth.users` tiene 1 fila y `public.users` tiene 1 fila con `caro@opendaycare.com`, `staff`, `active`, `Caro Giménez`, `daycare_id = 11111111-1111-4111-8111-111111111111`.
- [x] El seed es idempotente: reejecutarlo no agrega filas.
- [x] `POST /auth/v1/token?grant_type=password` con `caro@opendaycare.com` / `opendaycare123` devuelve `access_token`.
- [x] Con ese `access_token`, `GET /rest/v1/users` devuelve exactamente la fila de Caro.
- [x] `get_advisors` (security) no agrega WARN/ERROR nuevos; `rls_enabled_no_policy` ya no figura para `daycares` ni `users`.
- [x] `supabase/README.md` documenta credenciales demo, enums, trigger, políticas y el guard.
- [x] `AGENTS.md` refleja `users` y el trigger en "Estado actual" y en la sección Supabase.
- [ ] `git status` no muestra archivos fuera de `supabase/`, `specs/08-*` y `AGENTS.md`.
  - **FALLO (menor, de organización):** además aparecen `opencode.json` (renombre de la reference `docs` → `db-schema`) y el rename `specs/07-daycares-table-and-migrations.md` → `specs/database/07-daycares-table-and-migrations.md`. Ambos son coherentes con la regla de `AGENTS.md` (specs de BD en `specs/database/`), pero están fuera del scope literal de este criterio. No hay cambios en `package.json`, `app/`, `components/` ni `lib/`.
- [x] No se agregaron dependencias ni se tocó código de la app.

## Decisions

- **Sí:** `role` y `daycare_id` desde `raw_app_meta_data` — decisión del usuario. `raw_user_meta_data` lo escribe el cliente y permitiría autoasignarse `admin`.
- **Sí:** `daycare_id` nullable y `status = pending` cuando falta — decisión del usuario. Permite el signup de un padre que todavía no fue vinculado y le da sentido a `user_status.pending`. Se desvía del diccionario, que lo da `NOT NULL`.
- **Sí:** `status` default `pending` y check `active` requiere `daycare_id` — coherencia con la decisión anterior. El default `active` del diccionario queda solo como valor que asigna el trigger.
- **Sí:** seed del staff en una migración con `auth.users` + `auth.identities` y bcrypt de `pgcrypto` — decisión del usuario. Es reproducible y se verifica con un login real. Toca tablas internas de Auth; aceptado y documentado.
- **Sí:** `caro@opendaycare.com` / `opendaycare123` / "Caro Giménez" / `staff` — decisión del usuario y datos de los mockups. La password es de demo y queda en git.
- **Sí:** UUID fijo `22222222-2222-4222-8222-222222222222` — mismo patrón que la guardería `1111...`, para que las specs siguientes referencien al staff demo.
- **Sí:** RLS mínimo: cada uno ve y edita su perfil; cada uno ve su guardería — decisión del usuario. Cierra el pendiente de SPEC 07 sin inventar permisos de staff.
- **Sí:** trigger de guarda en vez de `GRANT` por columna — decisión del usuario. Mantiene la regla de no usar `GRANT` explícitos y no depende de recordar revocar columnas nuevas.
- **Sí:** `(select auth.uid())` en las políticas — evita que el planner evalúe `auth.uid()` por fila.
- **Sí:** `revoke all on function ... from public, anon, authenticated` en las funciones de trigger — son `SECURITY DEFINER` y no deben ser invocables desde el cliente.
- **Sí:** sin políticas de `INSERT`/`DELETE` en `users` — las filas nacen del trigger y mueren con el `ON DELETE CASCADE`.
- **Sí:** `on delete cascade` desde `auth.users` y sin cascada desde `daycares` — el perfil sigue al usuario de Auth; una guardería no debe borrar usuarios en bloque.
- **No:** `raw_user_meta_data` para `role`/`daycare_id` (diccionario) — riesgo de escalada de privilegios.
- **No:** usuario parent demo, invitaciones o `parent_children` — otra spec.
- **No:** política de lectura para staff del mismo daycare — otra spec; cuando llegue, conviene una función `SECURITY DEFINER` para evitar recursión de RLS.
- **No:** `supabase-js`, tipos generados, conexión de la app, login real en `/login`.
- **No:** editar el documento de referencia `07-DB-Schema` — se documentan las diferencias acá y en el README.

## Risks

| Riesgo                                                                  | Mitigación                                                                                                                                         |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Insertar en `auth.users`/`auth.identities` depende de un schema interno | Es un seed demo idempotente y documentado; si una actualización de Auth lo rompe, se crea la cuenta en el dashboard y se promueve con un `UPDATE`. |
| GoTrue rechaza el hash bcrypt o la identidad y el login falla           | La aceptación exige un login real contra `/auth/v1/token`; si falla, se corrige el seed antes de cerrar la spec.                                   |
| El proveedor email/contraseña está deshabilitado en el proyecto         | El test de login lo detecta; se habilita en el dashboard y se documenta en el README.                                                              |
| El advisor de contraseñas filtradas marca la password demo              | Es un proyecto de demo; la password es pública por diseño y se documenta.                                                                          |
| El check `users_active_requires_daycare` bloquea un `UPDATE` legítimo   | Es intencional: para desactivar usuarios hace falta un valor nuevo en `user_status`, que va en otra spec.                                          |
| Al agregar una política "staff ve todo su daycare" se produce recursión | Se resolverá con una función `SECURITY DEFINER` que devuelva el `daycare_id` del usuario, no con un subselect directo a `users`.                   |
| La app asume `active` por default y encuentra `pending`                 | La app todavía no está conectada; cuando se conecte, la UI debe tratar `pending` como "cuenta sin guardería".                                      |
| El diccionario de referencia queda desactualizado                       | La spec y el README registran las diferencias (nullable, default, `app_metadata`); si se quiere, se actualiza el documento en otra tarea.          |

## What is **not** in this spec

- Usuario parent demo y flujo de invitaciones.
- `parent_children`, `children`, `rooms` y el resto de las tablas.
- Política de lectura para staff sobre otros usuarios de su guardería.
- UI de login real, redirección por rol y conexión de la app a Supabase.
- Administración de usuarios desde una pantalla.
- `supabase-js`, `@supabase/ssr` y tipos TypeScript generados.
- Edición del documento de referencia `07-DB-Schema/opendaycare-database-schema.md`.

Cada uno de esos puntos, si llega, va en su propia spec.
