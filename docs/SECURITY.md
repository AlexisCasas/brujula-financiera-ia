# Seguridad de datos — RLS, secretos y aislamiento (BF-008)

**Proyecto Supabase:** `Brujula AI Finance` (`ncalhbwyuwxopokgfcty`). Hoy es el único proyecto: sirve a desarrollo y, cuando exista, a producción (ver DEC-015). Por eso la base se mantiene cerrada por defecto.

## Reglas vigentes en la base

| Regla | Cómo se aplica | Dónde se prueba |
|---|---|---|
| Toda tabla de `public` tiene RLS | Event trigger `ensure_rls` activa RLS en cada `CREATE TABLE` | `supabase/tests/rls_baseline.sql` (T1, T5) |
| Tablas nuevas cerradas por defecto | Privilegios por defecto de `anon` y `authenticated` revocados; cada migración concede lo mínimo | T5b, T5c |
| Un solo propietario | Tabla `public.app_owner` (una fila máxima) y `private.is_owner()` | T3, T4 |
| `anon` no lee ni ejecuta nada privado | Sin privilegios sobre tablas ni sobre el esquema `private` | T2 |
| Identidad ajena no ve ni escribe | Política `user_id = auth.uid()` y solo `SELECT` concedido | T3, T4 |
| Rol reservado para el MCP financiero | `mcp_writer`, `NOLOGIN`, sin privilegios; BF-017/019 le darán acceso solo a staging | T6 |

## Patrón para tablas privadas futuras

```sql
create table public.example (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade
);
-- RLS ya queda activado por ensure_rls. Conceder y limitar de forma explícita:
grant select, insert, update, delete on public.example to authenticated;
create policy example_owner_all on public.example
  for all to authenticated
  using (user_id = (select auth.uid()) and (select private.is_owner()))
  with check (user_id = (select auth.uid()) and (select private.is_owner()));
```

## Credenciales y separación

- **Navegador:** solo `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (valores públicos, protegidos por RLS). Los secretos del servidor viven únicamente en las variables de entorno del proveedor de hosting y se leen solo desde `src/server/`. Pendiente: añadir un `.env.example` (la escritura fue bloqueada por permisos del entorno). El guardrail `npm run check:guardrails` falla si una variable `NEXT_PUBLIC_` lleva nombre de secreto o si `service_role` aparece en `src/` fuera de `src/server/`.
- **Migraciones:** rol administrativo de Supabase (CLI o MCP de desarrollo). No se usa desde la aplicación.
- **Escritura del MCP financiero:** rol propio `mcp_writer`, distinto del de migraciones. Su credencial se crea fuera del repositorio cuando BF-017 defina el contrato.
- **Logs:** no se registran claves, tokens ni cabeceras de autorización.

## Estado y límites conocidos

- La identidad del propietario aún no existe: depende de BF-007 (autenticación), diferida por decisión del PO. Mientras tanto `app_owner` está vacía y ninguna tabla privada es accesible.
- Las pruebas SQL se ejecutan a mano o por MCP; todavía no corren en CI.
- El registro público de cuentas (BF-007 AC3) es un ajuste del panel de Auth de Supabase y **no está verificado** desde el repositorio.
- Backups: el plan del proyecto no se ha revisado. Revisar antes de cualquier migración destructiva.
