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

- La conexión de auditoría de 2026-11-11 confirma **una fila** en `app_owner` y cinco instrumentos visibles a nivel administrativo. La autenticación de propietario está implementada en el código (BF-007), pero la verificación UI de inicio/cierre de sesión en Vercel sigue pendiente.
- Las pruebas SQL se ejecutaron mediante MCP según PRs BF-008/010/011/012 y todavía no corren en CI. Los tests del frontend sí pasan por CI; la auditoría independiente validó únicamente las consultas de lectura, no repitió los tests RLS con usuario ajeno.
- El registro público de cuentas (BF-007 AC3) es un ajuste del panel de Auth de Supabase y **no está verificado** desde el repositorio.
- Backups: el plan del proyecto no se ha revisado. Revisar antes de cualquier migración destructiva.

## Autenticación del propietario (BF-007)

- **Método:** correo y contraseña con Supabase Auth (DEC-018). No existe pantalla de registro.
- **Proxy (`src/proxy.ts`):** chequeo optimista por cookie (`getClaims`) en cada ruta; sin sesión redirige a `/login?next=…`. Sin base de datos en el proxy, según las guías de Next.js. Si faltan las variables públicas de Supabase responde 503 (falla cerrado).
- **Inicio de sesión (`src/lib/auth/actions.ts`):** tras validar la contraseña comprueba que el usuario sea el propietario (`app_owner`, visible solo para su dueño por RLS). Si no lo es, cierra esa sesión y devuelve el mismo mensaje genérico que ante una contraseña incorrecta.
- **Redirección segura:** `next` solo admite rutas relativas del mismo sitio.
- **Cierre de sesión:** botón en el menú; invalida la sesión y vuelve a `/login`.
- **La autorización real sigue siendo RLS.** El proxy es solo una primera barrera: aunque se saltara, un usuario que no sea propietario no ve filas.

### Pasos del propietario (no automatizables)

1. **Deshabilitar el registro público:** Supabase → Authentication → Sign In / Providers → desactivar "Allow new users to sign up". Comprobable con `GET {url}/auth/v1/settings` (`disable_signup: true`).
2. **Crear tu usuario:** Authentication → Users → Add user (correo y contraseña propios; nunca por el chat).
3. **Registrarte como propietario:** insertar tu `user_id` en `public.app_owner` (migración o SQL con el rol administrativo).
4. **Variables locales:** `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; en Vercel, las mismas como variables de entorno.

### Estado y límites

- Al abrir esta historia el registro público estaba **habilitado** (`disable_signup: false`): AC3 depende del paso 1.
- Sin límite propio de intentos: se confía en los límites de Supabase Auth.
- No verificado de extremo a extremo con credenciales reales: lo hace el propietario tras los pasos 1 a 4.
