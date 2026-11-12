# Modelo de datos — instrumentos y listings (BF-010)

Migración: `supabase/migrations/20261112100000_bf010_instrument_listing_model.sql`. Pruebas: `supabase/tests/instrument_model.sql`.

## Entidades

| Tabla | Identidad | Notas |
|---|---|---|
| `instrument` | `isin` único, validado (formato ISO 6166 + dígito de control) | Un fondo **no** es su ticker. Atributos desconocidos son `NULL`, nunca cero. Los atributos versionados (TER, tamaño, fecha) llegan en BF-012. |
| `listing` | `instrument_id` + `exchange` (MIC, 4 caracteres) + `ticker` + `currency` (3 letras) | `status`: `unverified` (por defecto), `active`, `suspended`, `delisted`. Un ticker vigente en una bolsa pertenece a un solo listing. |

## Cotización frente a valor liquidativo (NAV)

La cotización de mercado cuelga de `listing`; el NAV cuelga de `instrument`. Ninguna de las dos tablas tiene columnas de precio ni NAV: llegan en BF-013 como tablas tipadas distintas, de modo que no se puedan mezclar. **Esta separación está definida en el modelo pero aún no se puede probar con datos de precios.**

## Funciones

| Función | Comportamiento |
|---|---|
| `upsert_instrument_listing(isin, name, exchange, ticker, currency, issuer?, index_name?)` | Idempotente. Normaliza mayúsculas y espacios. Repetir la llamada no duplica ni sobrescribe atributos existentes. Devuelve ids y si cada fila fue creada. |
| `search_listings(ticker)` | Devuelve **todos** los listings del ticker y marca `ambiguous` si hay más de uno. |
| `resolve_listing(ticker, exchange?, currency?)` | Devuelve un único `listing_id`. Ticker ambiguo → error `ambiguous_ticker`; inexistente → `listing_not_found`. Nunca adivina. |

Las tres son `SECURITY INVOKER`: se ejecutan con RLS, solo `authenticated` tiene `EXECUTE` y las políticas exigen `private.is_owner()`.

## Seguridad

- Catálogo compartido del propietario único: no lleva `user_id`; el acceso se restringe con `private.is_owner()` (ver `docs/SECURITY.md`).
- `anon` no tiene acceso. No hay `DELETE` desde el cliente: el historial se conserva.
- `mcp_writer` sigue sin privilegios; las propuestas del MCP irán a staging (BF-019).

## Límites conocidos

- Los ISIN de las pruebas son fixtures válidos por dígito de control; no acreditan la identidad de ningún fondo (eso es BF-011).
- No existe un diccionario de datos formal (BF-004) en el repositorio; este modelo parte de `docs/ARCHITECTURE.md`.
- Procedencia (fuente, URL, fecha de captura) de cada dato se modelará en BF-011/BF-012.
- Las pruebas SQL no corren en CI.

## Evidencia por campo y carga piloto (BF-011)

Migración: `supabase/migrations/20261112200000_bf011_source_evidence.sql`. Pruebas: `supabase/tests/source_evidence.sql`. Carga: `supabase/seed/bf011_pilot_etf.sql`.

### Tablas y funciones

| Objeto | Función |
|---|---|
| `source_record` | Documento o página consultada: URL, editor, tipo, fecha del documento (la fecha "al" que declara la fuente), fecha de captura, hash SHA-256 si es un archivo y nota de licencia. |
| `field_evidence` | Historial **solo de adición** de afirmaciones por campo. Estados: `verified` (lo declara una fuente oficial), `derived` (calculado de un identificador verificado por una regla determinista), `unverified` (sin fuente oficial), `superseded` y `rejected` (retiradas). Un solo registro vigente por campo. |
| `set_field(...)` | Registra o **corrige** un campo. Una corrección retira la afirmación vigente (pasa a `superseded`, conserva valor y fuente), enlaza la nueva con `supersedes_id` y actualiza el valor visible en `instrument`/`listing`. Repetir la misma afirmación no crea filas. |
| `record_source(...)` | Alta idempotente de una fuente. |
| `field_status` (vista) | Estado por campo; sin evidencia o `unverified` muestra **"sin verificar"**. |
| `catalog_overview` (vista) | Un registro por listing con cuántos campos siguen sin verificar. |

Las vistas usan `security_invoker`: respetan RLS (solo el propietario). La evidencia no se puede editar ni borrar desde el cliente, tampoco por el propietario; solo se puede retirar una afirmación vigente.

### Resultado de la carga (leído el 2026-11-11)

5 instrumentos, 5 listings, 5 fuentes oficiales y 47 afirmaciones: 38 verificadas, 3 derivadas y 14 "sin verificar".

| ETF | ISIN | Listing piloto | Fuente oficial (fecha del documento) |
|---|---|---|---|
| VWRA | IE00BK5BQT80 | XLON · VWRA · USD | Vanguard, página del producto (2026-11-11) |
| FWRA | IE000716YHJ7 | XLON · FWRA · USD* | Invesco, factsheet (2026-09-30) |
| VOO | US9229083632 (derivado) | ARCX · VOO · USD* | Vanguard, ficha (2026-09-30) |
| VUG | US9229087369 (derivado) | ARCX · VUG · USD* | Vanguard, ficha (2026-09-30) |
| SPYG | US78464A4094 | ARCX · SPYG · USD* | State Street, página del fondo (2026-11-11) |

\* La divisa de cotización no la declara la fuente: queda "sin verificar".

### Discrepancias y límites

- **VUG cambió de nombre.** La ficha oficial dice **Vanguard Morningstar Growth ETF** con índice **Morningstar US Large Cap Growth** (antes Vanguard Growth ETF / CRSP US Large Cap Growth, tras la compra de CRSP por Morningstar). El prototipo BF-003 aún usa el nombre antiguo.
- **ISIN derivado.** Las fichas de VOO y VUG imprimen el CUSIP pero no el ISIN. Se derivó como `US` + CUSIP + dígito de control ISO 6166 (la base valida el dígito). Para marcarlos `verified` hace falta una fuente oficial que imprima el ISIN.
- **Sin verificar:** domicilio de VOO, VUG y SPYG (no declarado en lo leído); política de distribución de VOO y VUG (la ficha muestra "Quarterly" pero no se pudo leer la columna sin ambigüedad); divisa de cotización de FWRA, VOO, VUG y SPYG; el estado (`status`) de los cinco listings. La bolsa de FWRA es `derivada` (código Bloomberg "FWRA LN").
- **Vanguard EE. UU. no se puede leer con herramientas simples.** Las páginas de producto cargan por JavaScript con banner de cookies; los datos de VOO y VUG salen de las fichas PDF oficiales.
- **Fuentes no oficiales** (justETF, TradingView y otras) se consultaron solo para localizar la fuente oficial y **no se usan como evidencia**. Discrepan entre sí en TER y tamaño; eso es de BF-012.
- Solo se guardan identificadores. No se almacena contenido de las páginas ni de los documentos (nota de licencia en cada fuente).
