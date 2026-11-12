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

## Mediciones versionadas y snapshots (BF-012)

Migración: `supabase/migrations/20261112300000_bf012_measurements_snapshots.sql`. Pruebas: `supabase/tests/measurements_snapshots.sql`. Carga: `supabase/seed/bf012_pilot_measurements.sql`.

### Qué se guarda y dónde

| Dato | Dónde | Cómo se versiona |
|---|---|---|
| Nombre, gestora, índice, política de dividendos, domicilio, fecha de inicio | `instrument` + `field_evidence` (BF-011) | Cada corrección retira la afirmación anterior sin borrarla |
| TER, tamaño del ETF y tamaño del fondo | `instrument_measurement` | Cada cifra nueva es una **fila nueva** |
| Fecha | `as_of_date` de cada medición y `document_date` de la fuente | — |

`instrument_measurement` es **solo de adición**: ni el propietario ni el rol de migraciones pueden editar o borrar filas (un disparador lo impide). Solo existe una medición si una fuente la declara (`source_record_id` es obligatorio); si no hay fuente, no hay fila.

- `ter_percent`: porcentaje (`0.14` = 0,14 %), entre 0 y 100, sin divisa.
- `net_assets`: tamaño del ETF o de la clase de acciones, con divisa obligatoria.
- `fund_net_assets`: total del fondo (todas las clases), con divisa obligatoria.

### Versionado

- Misma fecha y mismo valor y fuente: no hace nada (idempotente).
- Misma fecha con otra cifra: **versión 2** que apunta a la 1 (`supersedes_id`); la versión 1 conserva valor y fuente.
- Otra fecha: nueva fila en versión 1.

### Consultas

| Objeto | Uso |
|---|---|
| `record_measurement(...)` | Alta con versionado automático. |
| `snapshot_as_of(fecha)` | Para cada instrumento y métrica, la última medición **a esa fecha** (versión más reciente de la fecha más reciente que no la supere). |
| `measurement_history` (vista) | Historial completo con `is_latest_version`. |

**Dato faltante:** en `snapshot_as_of`, sin medición el valor es `NULL`, la disponibilidad dice **"no disponible"** y no hay divisa ni fecha. Nunca aparece como cero (probado: una fecha anterior a todas las mediciones devuelve 15 filas "no disponible", 0 valores y 0 ceros).

### Carga piloto

13 mediciones de las cinco fuentes oficiales de BF-011. Algunas salidas relevantes:

| ETF | TER | Tamaño del ETF | Fecha de la cifra |
|---|---|---|---|
| VWRA | 0,14 % | USD 62,19 mil millones | 2026-11-11 (la página no declara fecha; es la de lectura) |
| FWRA | 0,15 % | USD 5.184,69 millones | 2026-09-30 |
| VOO | 0,03 % | USD 1,03 billones | 2026-09-30 |
| VUG | 0,03 % | USD 232.870 millones | 2026-09-30 |
| SPYG | 0,04 % (bruto) | USD 52.602,73 millones | TER 2026-11-11, tamaño 2026-11-10 |

### Correcciones a las brechas de BF-011

Con el texto de las fichas de Vanguard leído en orden, "Dividend schedule: Quarterly" aparece rotulado: la distribución de **VOO y VUG** pasó a `verificado`. La página de SPYG indica "Trading currency: USD": su divisa pasó a `verificado`. Las afirmaciones anteriores quedaron como `superseded` (historial conservado). Resultado de `field_status`: 41 verificados, 3 derivados, 11 "sin verificar" (antes 38, 3 y 14).

### Límites

- **Tamaño de FWRA:** la ficha lo rotula "Fund size" sin aclarar si es de la clase o del fondo; se guardó como `net_assets` y se dejó la salvedad en la nota.
- **VWRA:** la página no declara fecha de TER ni de tamaño; se usó la fecha de lectura y consta en la nota. Fuentes de terceros muestran TER de 0,19 a 0,22 %; se usa el valor oficial.
- **SPYG:** la página da el gasto bruto, no el neto.
- **`fund_net_assets`** de FWRA y SPYG: "no disponible" (la fuente no lo da).
- La **identidad en el tiempo** (qué nombre tenía el fondo en una fecha) queda en el historial de `field_evidence`, pero `snapshot_as_of` aún no la reconstruye: devuelve la identidad actual.
- Las pruebas SQL no corren en CI.
