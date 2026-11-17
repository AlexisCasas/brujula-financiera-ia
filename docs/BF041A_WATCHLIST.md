# BF-041a — Mi seguimiento privado: ETF y bitácora de interés

**Historia en GitHub:** #56
**Rama:** feat/BF-041a-watchlist
**Estado:** preparación de PR / revisión del PO
**Migración:** supabase/migrations/20261117120000_bf041a_watchlist.sql — **NO APLICADA**

## Propósito

Mi seguimiento permite a un inversor principiante registrar interés, no tenencia ni compra, sobre un listing de ETF del catálogo existente. Puede seguir, dejar de seguir y reanudar sin perder historial.

Primera iteración: los 5 ETF VWRA, FWRA, VOO, VUG y SPYG. Las acciones individuales requieren BF-040 para incorporar identidades y listings verificados; no se admiten tickers arbitrarios.

## Modelo de datos

- **watchlist_item:** UUID, owner_user_id, listing_id, status (active/inactive), first_followed_at y status_changed_at; unicidad por usuario/listing.
- **watchlist_event:** evento append-only de follow/unfollow/resume con propietario, listing y fecha.
- **private.set_watchlist_follow(UUID, boolean):** transacción privilegiada en esquema no expuesto que valida auth.uid(), propiedad y listing existente; usa ON CONFLICT DO NOTHING y SELECT FOR UPDATE para idempotencia y concurrencia.
- **public.set_watchlist_follow(UUID, boolean):** RPC SECURITY INVOKER que delega sin otorgar SQL arbitrario.
- Ambas tablas: RLS SELECT solo propietario. Ningún INSERT/UPDATE/DELETE directo para authenticated.

Los campos TER y distribución provienen de BF-011/012 y no representan cotizaciones en tiempo real.

## Contrato de estados

| Antes | Acción | Después | Resultado | Evento |
|---|---|---|---|---|
| Sin fila | Seguir | Activo | followed | follow |
| Activo | Seguir otra vez | Activo | already_following | Ninguno |
| Activo | Dejar de seguir | Inactivo | unfollowed | unfollow |
| Inactivo | Dejar de seguir otra vez | Inactivo | already_inactive | Ninguno |
| Inactivo | Volver a seguir | Activo | resumed | resume |
| Sin fila | Dejar de seguir | Sin fila | not_following | Ninguno |
| Listing inexistente | Cualquiera | Error 22023 | Validación | Ninguno |
| Otro usuario/anon | Cualquiera | Error 42501/ACL | Acceso negado | Ninguno |

## Seguridad

Server Components y Server Actions Next.js usan auth.getUser() y cliente SSR con sesión. Base verifica auth.uid() y private.is_owner(). No se acepta owner_user_id, precios, evento, transacción bursátil ni fechas desde navegador.

Dejar de seguir implica estado inactive, nunca DELETE. Los eventos históricos se preservan.

## QA manual en Preview

1. Abrir /seguimiento autenticado. Antes de aplicar migración debe verse el catálogo con mensaje de persistencia pendiente y sin botones activos.
2. Tras autorización separada de la migración, corroborar cinco ETF disponibles y lista vacía.
3. Agregar VWRA y luego FWRA; verificar identidad (ISIN, mercado, divisa) y eventos.
4. Dejar de seguir VWRA. Debe quedar inactivo y conservar su evento anterior.
5. Reactivar VWRA; mismo registro original, nuevo evento resume.
6. Probar búsqueda por nombre, ticker e ISIN.
7. Confirmar que doble clic o repetir operación no duplica filas ni eventos.
8. Verificar diseño móvil, teclado y bloqueo sin autenticación.
9. Verificar que comparador, perfil y comparaciones guardadas no cambian.

## Pruebas y dependencias

- Frontend: tests/watchlist.test.ts, navegación y CI de lint/typecheck/Vitest/guardrails/build.
- SQL: supabase/tests/bf041a_watchlist.sql (10 verificaciones con rollback). No se ejecuta automáticamente ni antes de autorización.
- **BF-040:** ampliar modelo de activos para acciones con fuente/identidad corroborada.
- **BF-015 / BF-042:** noticias, reportes, dividendos y distribuciones.
- **BF-017–020:** integración MCP con ChatGPT/Claude y acciones confirmadas.
- **BF-039 / PR #55:** perfil ya probado visualmente pero no fusionado; PR independiente de este incremento. Al fusionar ambos, reconciliar el menú y tests sin perder pantallas.

## Gate de release

Requiere autorización explícita para aplicar la migración al proyecto Supabase único dev/prod; después pruebas SQL y QA funcional del propietario. Merge y despliegue productivo requieren aprobación explícita adicional.