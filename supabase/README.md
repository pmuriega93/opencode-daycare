# Supabase — migraciones

Este proyecto usa **migraciones SQL imperativas** versionadas en `supabase/migrations/`. El SQL se escribe en el repo y se aplica al proyecto remoto (`bsrjfdacxfiypvqfhhda`) por MCP. No hay stack local: no se usa Docker ni `supabase start`.

## Estado

- `public.daycares` es la primera tabla del schema (SPEC 07). Tiene RLS activo y la política `daycares_select_own`: cada usuario autenticado ve solo su guardería; `anon` no ve filas y `service_role` sigue operando.
- `public.users` es el perfil de dominio 1:1 con `auth.users` (SPEC 08). Tiene RLS activo con `users_select_own` y `users_update_own`; no hay políticas de `INSERT`/`DELETE` (las filas nacen del trigger y mueren con el `ON DELETE CASCADE` de `auth.users`).
- Enums: `public.user_role` = `staff`, `parent`, `admin`; `public.user_status` = `pending`, `active`. `daycare_id` es nullable y `active` exige `daycare_id` (check `users_active_requires_daycare`).
- `public.handle_new_user()` (`SECURITY DEFINER`, `search_path = ''`) corre `AFTER INSERT ... FOR EACH ROW` sobre `auth.users` con el trigger `on_auth_user_created`. Lee `role` y `daycare_id` **solo** de `raw_app_meta_data` (lo escribe `service_role`); `full_name` cae en cascada a `raw_user_meta_data`. Sin `daycare_id` el perfil queda `pending`; con `daycare_id`, `active`. Si el rol es `staff`/`admin` y falta `daycare_id`, el insert falla. La función no es ejecutable por `public`, `anon` ni `authenticated`.
- `public.guard_user_privileged_columns()` es un trigger `BEFORE UPDATE` que revierte `role`, `status` y `daycare_id` cuando un usuario edita su propio perfil. `service_role` (sin `auth.uid()`) no se ve afectado.
- **Usuario staff demo**: `caro@opendaycare.com` / `opendaycare123`, perfil `Caro Giménez`, rol `staff`, status `active`, UUID `22222222-2222-4222-8222-222222222222`, ligado a "Guardería Sala Soles". La migración `seed_staff_user` crea `auth.users` + `auth.identities` y es idempotente (si el email ya existe, no hace nada). La password es de demo y queda en git a propósito.
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
- **RLS con políticas**: todas las tablas de `public` tienen RLS activo y al menos una política. `daycares` y `users` ya no aparecen en el advisor `rls_enabled_no_policy`. Los privilegios de función de trigger se revocan de `public`, `anon` y `authenticated`.
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
    └── 20261112140059_seed_staff_user.sql
```

`config.toml` y `.gitignore` los generó `npx supabase init`. El `project_id` local es solo para el CLI; el proyecto remoto se identifica por el ref.
