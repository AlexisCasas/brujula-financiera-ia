# BF-011 / BF-012 — Frontend conectado al catálogo financiero

**Estado:** implementación en PR, no validada visualmente en Vercel.  
**Rama:** `feat/BF-011-012-catalog-dashboard`  
**Alcance:** lectura autenticada. No hay migraciones, escrituras, datos de proveedores API ni despliegue.

## Datos verificados en Supabase (lectura MCP)

Proyecto: `Brujula AI Finance`, `ncalhbwyuwxopokgfcty`.

- 6 tablas en `public` con RLS: `app_owner`, `instrument`, `listing`, `source_record`, `field_evidence`, `instrument_measurement`.
- 5 instrumentos y 5 listings; 5 fuentes oficiales.
- 13 mediciones de TER/patrimonio, cada una vinculada a fuente y fecha efectiva.
- `field_status`: 41 verificadas, 3 derivadas y 11 «sin verificar».
- `snapshot_as_of('2026-01-01')`: 15 «no disponible», 0 valores registrados (los faltantes no son ceros).
- Las vistas `catalog_overview`, `field_status`, `measurement_history` tienen `security_invoker=true`.
- La advertencia de seguridad Supabase restante es `Leaked Password Protection Disabled`. Los 4 índices de FK agregados aparecen como `Unused Index` informativo; no eliminarlos por este aviso.

## Flujo de renderizado

`src/lib/etfs/queries.ts` consulta desde Server Components:

1. Verifica la sesión con `supabase.auth.getUser()`; sin sesión redirige a `/login`.
2. Usa cliente SSR con la **clave publicable**, sesión del usuario y políticas RLS; nunca `service_role`.
3. Lee `catalog_overview`, `instrument`, `field_status` y el RPC `snapshot_as_of` para la fecha UTC actual.
4. Si falla cualquiera de las fuentes, muestra estado **error** con opción de reintentar; si el catálogo está vacío, muestra estado **vacío**. No transforma una consulta fallida en cero.
5. Agrupa mediciones por `instrument_id` y tipo (`ter_percent`, `net_assets`, `fund_net_assets`).
6. Muestra por ETF precio **no disponible**, TER, patrimonio, divisa, fecha de medición, fecha de documento, nota y enlace HTTPS a su fuente.
7. Busca por ticker, ISIN, nombre, gestora e índice, sin colapsar identificaciones por ticker entre bolsas.
8. El Panel deriva indicadores únicamente de la respuesta de consulta: instrumentos, listings, mediciones presentes, mediciones faltantes y campos sin verificar.

## Cautelas financieras

- `0.14` en `ter_percent` se visualiza como **0,14 %**; no se multiplica por 100.
- Los activos se expresan en **millones de unidades monetarias de la fuente**; no se realiza conversión USD/PEN.
- La ficha conserva la nota de **FWRA** sobre «Fund size» sin clasificación inequívoca entre clase y fondo.
- **SPYG** reporta tasa de gasto bruto, no neto; visible en la nota.
- Una medición sin fuente o valor `NULL` se muestra como **No disponible**.
- El indicador de campos sin verificar se calcula desde `catalog_overview`; no se asume que ficha completa signifique cotización válida o precio disponible.
- La fecha de corte del snapshot se muestra en UTC. Las fechas del documento y del dato pueden diferir.
- No hay precios, rentabilidad histórica, escenarios financieros reales ni tipos de cambio conectados; quedan en BF-013/BF-014 y sus dependencias.

## QA automático

- `tests/catalog.test.ts` incluye búsqueda, formatos USD/TER, nulos, ceros, campos desconocidos y bloqueo de enlaces inseguros.
- CI de aplicación debe ejecutar lint, typecheck, tests, guardrails y build sin necesidad de claves de Supabase.
- QA visual y E2E con **sesión real de propietario** quedan pendientes del despliegue de preview a Vercel y aprobación del PO.

## Verificación manual requerida antes del merge y despliegue

1. Iniciar sesión como usuario propietario; ver 5 ETF, 13 mediciones presentes, 2 ausencias y 11 campos sin verificar.
2. Abrir `/explorar` y buscar VWRA, FWRA, VOO, VUG y SPYG (y un ticker inexistente).
3. Comprobar fechas y fuentes de TER, patrimonio, y ausencia de `fund_net_assets` en FWRA/SPYG.
4. Confirmar nombre actual de VUG: «Vanguard Morningstar Growth ETF».
5. Validar móvil estrecho, teclado, apertura de los detalles de evidencia y estados de error/ausencia.
6. Confirmar que un usuario anónimo o distinto del propietario no accede a fichas; pruebas RLS ya existentes en SQL deben revalidarse en un ambiente aislado si cambia la autorización.
7. Confirmar que la clave Supabase en Vercel sea **publishable**, nunca secreta.

**Riesgo:** el proyecto Supabase es único para desarrollo/producción (DEC-015). Este cambio no escribe en él. Configurar Vercel deberá requerir autorización y preservar el aislamiento de usuario único.
