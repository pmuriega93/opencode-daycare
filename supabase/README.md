# Supabase — migraciones

Este proyecto usa **migraciones SQL imperativas** versionadas en `supabase/migrations/`. El SQL se escribe en el repo y se aplica al proyecto remoto (`bsrjfdacxfiypvqfhhda`) por MCP. No hay stack local: no se usa Docker ni `supabase start`.

## Estado

- `public.daycares` es la primera tabla del schema (SPEC 07). Tiene RLS activo **sin políticas**: `anon` y `authenticated` no ven filas; `service_role` sigue operando.
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
- **RLS sin políticas es intencional** en `daycares`. El advisor `rls_enabled_no_policy` (INFO) es el estado buscado hasta que la spec de `users` defina el `daycare_id` del usuario.
- **Sin `GRANT` explícitos**: los privilegios por defecto del schema `public` ya alcanzan; RLS decide las filas.
- Los dos warnings de `rls_auto_enable` son preexistentes del proyecto y no vienen de estas migraciones.

## Archivos

```
supabase/
├── config.toml
├── .gitignore
├── README.md
└── migrations/
    ├── 20261111144556_add_set_updated_at_function.sql
    ├── 20261111144610_create_daycares.sql
    └── 20261111144628_seed_initial_daycare.sql
```

`config.toml` y `.gitignore` los generó `npx supabase init`. El `project_id` local es solo para el CLI; el proyecto remoto se identifica por el ref.
