# BF-041a — Mi seguimiento privado: ETF y bitácora de interés

**Historia en GitHub:** #56
**Rama:** feat/BF-041a-watchlist
**Estado:** migración BF-041a aplicada con autorización y QA SQL PASS; QA real en Preview y merge pendientes.
**Migración:** supabase/migrations/20261117044420_bf041a_watchlist.sql — **APLICADA, versión 20261117044420**

## Propósito

Mi seguimiento permite a un inversor principiante registrar interés, no tenencia ni compra, sobre un listing de ETF del catálogo existente. Puede seguir, dejar de seguir y reanudar sin perder historial.

Primera iteración de seguimiento persistente: cinco ETF (VWRA, FWRA, VOO, VUG y SPYG). **Se añadió una segunda lista informativa separada** con ocho acciones de referencia de la Bolsa de Valores de Lima (BVL), con ISIN, moneda y referencias BVL. No se permite agregarlas a la lista persistente hasta ampliar el catálogo genérico en BF-040; no se aceptan tickers arbitrarios.

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

1. Abrir /seguimiento autenticado. Con la migración aplicada debe mostrar el catálogo y controles de seguimiento de ETF.
2. Tras autorización separada de la migración, corroborar cinco ETF disponibles y lista vacía.
3. Agregar VWRA y luego FWRA; verificar identidad (ISIN, mercado, divisa) y eventos.
4. Dejar de seguir VWRA. Debe quedar inactivo y conservar su evento anterior.
5. Reactivar VWRA; mismo registro original, nuevo evento resume.
6. Probar búsqueda por nombre, ticker e ISIN.
7. Confirmar que doble clic o repetir operación no duplica filas ni eventos.
8. Verificar diseño móvil, teclado y bloqueo sin autenticación.
9. Comprobar que la sección **Bolsa local · BVL** presenta ocho acciones de referencia, con fuente, fecha, ISIN y moneda, sin botón de alta ni cotizaciones inventadas.
10. Verificar que comparador, perfil y comparaciones guardadas no cambian.

## Pruebas y dependencias

- Frontend: tests/watchlist.test.ts, navegación y CI de lint/typecheck/Vitest/guardrails/build.
- SQL: supabase/tests/bf041a_watchlist.sql (10 verificaciones con rollback). Ejecutadas con autorización del PO el 2026-11-17; 10 controles PASS y rollback verificado (0 ítems, 0 eventos residuales).
- **BF-040:** ampliar modelo de activos para acciones con fuente/identidad corroborada.
- **BF-015 / BF-042:** noticias, reportes, dividendos y distribuciones.
- **BF-017–020:** integración MCP con ChatGPT/Claude y acciones confirmadas.
- **BF-039 / PR #55:** perfil ya probado visualmente pero no fusionado; PR independiente de este incremento. Al fusionar ambos, reconciliar el menú y tests sin perder pantallas.

## Gate de release

**BF-041a aplicada con autorización explícita del PO:** la versión de migración quedó registrada como 20261117044420 y se verificó RLS, ACL y 10 pruebas SQL con rollback. Permanece el QA funcional real del propietario. **BF-040 no migrada:** BVL está disponible solo como investigación inicial. Merge y despliegue productivo requieren aprobación explícita adicional.

## Primer lote de descubrimiento BVL — BF-040

La tabla de **valores referenciales para operaciones de reporte** de la BVL, vigente desde el 1 de octubre de 2026, identifica los nemónicos; el reporte de **Mercado de Renta Variable** actualizado al 16 de noviembre de 2026 documenta ISIN y moneda; la página de componentes S&P/BVL ESG (actualizada al 25 de julio de 2025) ayuda a vincular nombres y nemónicos históricos. Estas fuentes son de alcance distinto y **no constituyen un registro de altas verificado de valores vigentes** ni un feed de precios licenciados.

Referencias:
- https://documents.bvl.com.pe/empresas/alertas/TVR%202026-4T.pdf
- https://documents.bvl.com.pe/pubdif/boldia/stockq.htm
- https://documents.bvl.com.pe/pubdif/boldia/emp_ibgc.htm

| Nemónico BVL | Emisor | ISIN | Moneda del reporte BVL |
|---|---|---|---|
| ALICORC1 | Alicorp S.A. | PEP214001005 | PEN |
| FERREYC1 | Ferreycorp S.A.A. | PEP736001004 | PEN |
| INRETC1 | InRetail Perú Corp. | PAL1801171A1 | USD |
| BBVAC1 | Banco BBVA Perú | PEP116001004 | PEN |
| CPACASC1 | Cementos Pacasmayo S.A.A. | PEP239501005 | PEN |
| ENGIEC1 | Engie Energía Perú S.A. | PEP702101002 | PEN |
| UNACEMC1 | Unacem Corp S.A.A. | PEP761001002 | PEN |
| NEXAPEC1 | Nexa Resources Perú S.A.A. | PEP620001003 | PEN |

No se registran estos valores como ETFs y no se insertan en `instrument`/`listing`: faltaría tipo de activo y separación de metadatos antes de conectar a BF-041a. No se realiza una nueva migración sin autorización.
