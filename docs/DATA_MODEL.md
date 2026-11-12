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
