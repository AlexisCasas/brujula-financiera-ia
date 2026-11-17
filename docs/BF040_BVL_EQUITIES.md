# BF-040 — Acciones de la BVL habilitadas para Mi seguimiento

**Alcance:** ampliar el catálogo de 5 ETF con 9 acciones de capital cotizadas en la Bolsa de Valores de Lima (XLIM). Incluye Credicorp Ltd. BAP.
**Rama:** feat/BF-040-bvl-equities, dependiente de feat/BF-041a-watchlist / PR #57, todavía sin merge.
**Migración aplicada con autorización PO:** supabase/migrations/20261117045805_bf040_bvl_equities.sql (Supabase remote version 20261117045805).

## Contrato financiero y seguridad

- `instrument.asset_type` = `etf` (por defecto para las cinco filas actuales) o `equity` para las nueve acciones.
- Un instrumento se identifica por **ISIN**; un listing por **instrument_id + MIC + nemónico + moneda**.
- Las nueve acciones usan el MIC oficial de la Bolsa de Lima **XLIM**. Credicorp BAP cotiza también en NYSE, pero el incremento guarda **solo XLIM/BAP/USD**; no confundir con acciones de BCP (`CREDITC1`) ni con otro listing.
- `listing.status = unverified` porque una referencia oficial de cotización histórica no prueba que siempre pueda negociarse ni que sea líquido hoy.
- `source_record` y `field_evidence` trazan ISIN, nemónico y moneda al reporte BVL 16-nov-2026. Los nombres de las compañías se usan como referencias de investigación; no se guardan previsiones, precios, rendimientos ni dividendos.
- `equity_listing_overview`: vista invoker que solo expone acciones BVL y URL/fecha de la evidencia; lectura sujeta a RLS existente.
- `catalog_overview` y `field_status`: se mantienen con su contrato de columnas y restringidas a ETF; el histórico de mediciones no se altera.
- Trigger de validación para `saved_etf_comparison` rechaza guardar cualquier listing que no sea ETF, incluso pasando un ID directo al RPC existente.
- `watchlist_item` y `watchlist_event` existentes funcionan con cualquier listing registrado; son privadas owner-only; seguimiento `follow/unfollow/resume` conserva fechas y eventos.
- No se otorgan permisos nuevos de escritura sobre las tablas financieras a `anon` ni sobre las tablas privadas de watchlist.

## Lote documental BVL

| Nemónico | Empresa | ISIN | Moneda |
|---|---|---|---|
| ALICORC1 | Alicorp S.A. | PEP214001005 | PEN |
| FERREYC1 | Ferreycorp S.A.A. | PEP736001004 | PEN |
| INRETC1 | InRetail Perú Corp. | PAL1801171A1 | USD |
| BBVAC1 | Banco BBVA Perú | PEP116001004 | PEN |
| CPACASC1 | Cementos Pacasmayo S.A.A. | PEP239501005 | PEN |
| ENGIEC1 | Engie Energía Perú S.A. | PEP702101002 | PEN |
| UNACEMC1 | Unacem Corp S.A.A. | PEP761001002 | PEN |
| NEXAPEC1 | Nexa Resources Perú S.A.A. | PEP620001003 | PEN |
| BAP | Credicorp Ltd. | BMG2519Y1084 | USD |

Los nueve ISIN fueron validados con `private.is_valid_isin` en el proyecto Supabase (9/9 válidos). Ningún instrumento local existía previamente bajo XLIM.

### Fuentes verificadas

- Boletín Bolsa de Valores de Lima, «Mercado de Renta Variable Actualizado al 16 de noviembre de 2026»: https://documents.bvl.com.pe/pubdif/boldia/stockq.htm
- Credicorp IR, preguntas frecuentes sobre acciones comunes BAP, cotización en BVL/NYSE y divisa USD: https://credicorp.gcs-web.com/resources/faqs
- Referencia BVL de nemónicos de capital (4T 2026): https://documents.bvl.com.pe/empresas/alertas/TVR%202026-4T.pdf
- Fuente MIC XLIM: Nasdaq index methodology https://indexes.nasdaq.com/docs/NQGIFamilyMethodology.pdf

**No confundir datos de cierre de la BVL con precios en tiempo real**. No se utiliza ni persiste precio en este incremento. No se infiere liquidez, distribución de dividendos, idoneidad personal ni promesa de crecimiento.

## QA y aceptación

1. La migración conserva los 5 ETF y crea exactamente 9 instrumentos de tipo `equity` + 9 listings XLIM con fuente URL/fecha.
2. La vista `catalog_overview` sigue entregando solo ETF; `equity_listing_overview` solo acciones.
3. BAP muestra mercado XLIM, USD, ISIN BMG2519Y1084. InRetail también USD.
4. La API de comparación ETF rechaza acciones BVL incluso con IDs válidos.
5. Desde `/seguimiento` autenticado agregar BAP, dejar de seguirlo, reanudar y consultar eventos. Repetir operaciones no duplica ni pierde registros.
6. Usuario ajeno o anónimo no lee ni modifica seguimiento; RLS y función de escritura heredadas continúan intactas.
7. No aparecen acciones en `/explorar` ni `/comparador`; su importe de compra, TER o dividendo no se inventa.
8. Pruebas automatizadas (Vitest + lint/TS/build) y 12 controles SQL transaccionales con rollback. **Las 12 pruebas SQL se ejecutaron en el Supabase compartido y pasaron; BAP quedó con 0 ítems y 0 eventos residuales tras rollback.**
9. Migración Supabase ya aplicada; sin merge ni despliegue productivo hasta validación y autorización separada del PO.

**Rollback:** DDL adicional es compatible con lectura anterior. Ante un fallo en frontend revertir PR sin borrar watchlist ni registros históricos. Para reversión estructural, no hacer `DROP` sin inventario y respaldo de los nuevos datos; preferir deshabilitar lectura y preservar historial.

## Evidencia de ejecución Supabase (2026-11-17 UTC)

- Migración `20261117045805_bf040_bvl_equities`: PASS, aplicada y registrada en `supabase_migrations.schema_migrations`.
- Pruebas SQL `supabase/tests/bf040_bvl_equities.sql`: 12/12 PASS dentro de transacción, `BF040_ROLLBACK_PASS` con 0 eventos y 0 ítems BAP de prueba.
- Conteos posteriores: 5 ETF, 9 acciones, 5 filas en `catalog_overview`, 9 filas en `equity_listing_overview`, 0 fuentes faltantes, 1 Credicorp BAP/XLIM/USD con ISIN correcto.
- El guardado BF-041a RLS sigue activo; fila(s) previamente seguidas y perfil BF-039 preservados.
- Security advisor: **sin nuevas advertencias**. Se mantienen advertencias heredadas sobre `public.save_etf_comparison` (SECURITY DEFINER) y Leaked Password Protection deshabilitada; no forman parte de BF-040.
- La URL BVL `stockq.htm` es una página actualizable: la fecha explícita 16/11/2026 se guarda en la evidencia; para reproducibilidad histórica futura convendrá archivar la fuente o vincular una publicación de corte inmutable, respetando la licencia.
- **Frontend:** disponible en PR #59 de forma dependiente de PR #57. QA visual y merge pendientes.
