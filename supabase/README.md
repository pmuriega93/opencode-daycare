# Supabase — migraciones

Este proyecto usa **migraciones SQL imperativas** versionadas en `supabase/migrations/`. El SQL se escribe en el repo y se aplica al proyecto remoto (`bsrjfdacxfiypvqfhhda`) por MCP. No hay stack local: no se usa Docker ni `supabase start`.

## Estado

- `public.daycares` es la primera tabla del schema (SPEC 07). Tiene RLS activo y la política `daycares_select_own`: cada usuario autenticado ve solo su guardería; `anon` no ve filas y `service_role` sigue operando.
- `public.users` es el perfil de dominio 1:1 con `auth.users` (SPEC 08). Tiene RLS activo con `users_select_own` y `users_update_own`; no hay políticas de `INSERT`/`DELETE` (las filas nacen del trigger y mueren con el `ON DELETE CASCADE` de `auth.users`).
- `public.rooms` son las salas (SPEC 10): `id`, `daycare_id` (FK a `daycares`, `ON DELETE CASCADE`), `name` (no vacío y unique por guardería), timestamps con trigger `set_updated_at`. RLS activo.
- `public.children` son los niños (SPEC 10): `room_id` **`NOT NULL`** (FK a `rooms`, sin cascada), `full_name` no vacío, `birth_date`, `enrolled_at` (default `current_date`), `medical_notes`, `allergy_tags text[]` (default `{}`, tags en inglés), `photo_consent` (default `true`) y `status` (enum `public.child_status`, default `active`). No hay `daycare_id`: la guardería se deduce de la sala. No hay `DELETE`: se archiva con `status = 'archived'`.
- **Políticas de `rooms`/`children` (SPEC 10)**: `rooms_select/insert/update_own_daycare` y `children_select/insert/update_own_daycare`, solo para `staff`/`admin` de la misma guardería (subselect a `public.users` con `(select auth.uid())`). Los `parent` de la misma guardería **todavía no ven niños**: faltan las políticas de `parent_children`, que llegan en su propia spec. `anon` no ve filas; `service_role` sigue operando.
- **Seeds de SPEC 10**: 3 salas (`Soles` `3333…01`, `Lunas` `3333…02`, `Estrellas` `3333…03`) y 8 niños (`4444…01`–`4444…08`) repartidos 4/2/2. Mismo patrón idempotente (`on conflict (id) do nothing`) que los seeds de SPEC 07/08.
- Enums: `public.user_role` = `staff`, `parent`, `admin`; `public.user_status` = `pending`, `active`. `daycare_id` es nullable y `active` exige `daycare_id` (check `users_active_requires_daycare`).
- `public.handle_new_user()` (`SECURITY DEFINER`, `search_path = ''`) corre `AFTER INSERT ... FOR EACH ROW` sobre `auth.users` con el trigger `on_auth_user_created`. Lee `role` y `daycare_id` **solo** de `raw_app_meta_data` (lo escribe `service_role`); `full_name` cae en cascada a `raw_user_meta_data`. Sin `daycare_id` el perfil queda `pending`; con `daycare_id`, `active`. Si el rol es `staff`/`admin` y falta `daycare_id`, el insert falla. La función no es ejecutable por `public`, `anon` ni `authenticated`.
- `public.guard_user_privileged_columns()` es un trigger `BEFORE UPDATE` que revierte `role`, `status` y `daycare_id` cuando un usuario edita su propio perfil. `service_role` (sin `auth.uid()`) no se ve afectado.
- **Usuario staff demo**: `caro@opendaycare.com` / `opendaycare123`, perfil `Caro Giménez`, rol `staff`, status `active`, UUID `22222222-2222-4222-8222-222222222222`, ligado a "Guardería Sala Soles". La migración `seed_staff_user` crea `auth.users` + `auth.identities` y es idempotente (si el email ya existe, no hace nada). La password es de demo y queda en git a propósito.
- **La app usa este usuario para el login real (SPEC 09)**: `signIn` (Server Action) llama `supabase.auth.signInWithPassword`, la sesión se guarda en cookies vía `@supabase/ssr`, `proxy.ts` protege las rutas y `getCurrentProfile()` lee `public.users`/`public.daycares` con RLS para el sidebar. SPEC 09 no agrega migraciones ni cambios de schema.
- La migración `seed_initial_daycare` inserta la guardería demo con UUID fijo `11111111-1111-4111-8111-111111111111`. Las specs siguientes lo usan como `daycare_id`.
- `public.set_updated_at()` es la función reutilizable para `updated_at`; cada tabla nueva la engancha con un trigger `BEFORE UPDATE ... FOR EACH ROW`.
- El remoto tiene dos migraciones de prueba (`create_test_connection_table`, `drop_test_connection_table`) que **no** tienen archivo local. No bloquean nada; el historial local arranca en la SPEC 07.

## Flujo de una migración (cinco pasos)

1. **Escribir el SQL** de la migración. Nada de `apply_migration` para iterar: si hay que probar, se usa `execute_sql` y recién cuando el SQL está cerrado se aplica como migración.
2. **Aplicar por MCP** con `apply_migration` y un nombre en `snake_case` (por ejemplo `create_daycares`). El servidor asigna la versión.
3. **Leer la versión** nueva en `list_migrations`.
4. **Crear el archivo local** `supabase/migrations/<version>_<nombre>.sql` con esa versión exacta y el mismo SQL que se aplicó.
5. **Verificar**: `list_migrations` debe mostrar la migración y `get_advisors` (security) no debe agregar hallazgos nuevos. Opcional: comparar el archivo local con `statements` en `supabase_migrations.schema_migrations`.

Ejemplo de verificación:

```sql
select version, name, statements
from supabase_migrations.schema_migrations
order by version;
```

## Reglas

- **Una migración aplicada no se edita.** Se corrige con una migración nueva. Editar el archivo local genera drift entre el repo y el remoto.
- **`apply_migration` no se usa para iterar.** Cada llamada escribe una fila en `supabase_migrations.schema_migrations`; si el SQL sale mal, queda una migración rota en el historial.
- **El historial local debe reflejar el remoto.** Los nombres de archivo usan la versión que devuelve `list_migrations`, no un timestamp propio.
- **`supabase db push` está bloqueado** hasta tener un `SUPABASE_DB_PASSWORD` real en `.env` y Docker disponible. El flujo actual es MCP. Cuando se habilite, el historial local ya coincide con el remoto.
- **RLS con políticas**: todas las tablas de `public` tienen RLS activo y al menos una política. `daycares`, `users`, `rooms` y `children` ya no aparecen en el advisor `rls_enabled_no_policy`. Los privilegios de función de trigger se revocan de `public`, `anon` y `authenticated`.
- **Sin `GRANT` explícitos**: los privilegios por defecto del schema `public` ya alcanzan; RLS decide las filas.
- Los dos warnings de `rls_auto_enable` son preexistentes del proyecto y no vienen de estas migraciones.
- El advisor `auth_leaked_password_protection` (WARN) aparece por la password demo (`opendaycare123`), que es pública a propósito en este proyecto demo; no se habilita la protección de contraseñas filtradas.

## Archivos

```
supabase/
├── config.toml
├── .gitignore
├── README.md
└── migrations/
    ├── 20261111144556_add_set_updated_at_function.sql
    ├── 20261111144610_create_daycares.sql
    ├── 20261111144628_seed_initial_daycare.sql
    ├── 20261112135926_create_user_enums.sql
    ├── 20261112135944_create_users.sql
    ├── 20261112140006_create_handle_new_user_trigger.sql
    ├── 20261112140052_add_users_rls_and_guards.sql
    ├── 20261112140059_seed_staff_user.sql
    ├── 20261117134341_create_child_status_enum.sql
    ├── 20261117134342_create_rooms.sql
    ├── 20261117134358_create_children.sql
    ├── 20261117134407_add_rooms_children_rls.sql
    └── 20261117134426_seed_rooms_and_children.sql
```

`config.toml` y `.gitignore` los generó `npx supabase init`. El `project_id` local es solo para el CLI; el proyecto remoto se identifica por el ref.
