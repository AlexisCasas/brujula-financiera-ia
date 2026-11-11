# BF-004 · Contrato lógico de datos financieros y procedencia v1

**Estado:** políticas P01–P05 aprobadas por Product Owner el 2026-11-11; NO es migración SQL · **Fecha:** 2026-11-11.  
**Historia:** [BF-004](https://github.com/AlexisCasas/brujula-financiera-ia/issues/4)

## 1. Reglas de identidad

- **ETF/share class:** identificado por ISIN (ISO 6166), cadena de 12 caracteres validada por dígito de control y cotejada con emisor/bolsa. El ISIN representa el valor mobiliario/share class y **no identifica por sí solo el listing**.
- **Listing:** un instrumento puede tener varios listings. Identidad candidata: (ISIN + MIC de mercado + ticker local + moneda de cotización), con identificador interno estable y vigencia. MIC específico si disponible, no asumir una bolsa por sufijo genérico de API.
- **Ticker:** buscador no identificador primario; VWRA puede ser USD en LSE o CHF en SIX, y FWRA puede existir en varias bolsas/monedas.
- **Gestora, índice, domicilio y política de distribución** pertenecen a la ficha del fondo/ISIN y tienen vigencia de dato. Spread, volumen, precio y símbolo pertenecen al listing.
- **Moneda base del fondo, moneda de share class, moneda de negociación y moneda de resultado** son conceptos distintos y deben conservarse por separado.

## 2. Modelo lógico propuesto (no crear tablas aún)

| Entidad | Clave / relaciones | Campos obligatorios | Estado |
|---|---|---|---|
| `funds` | `id`, `isin` único | issuer, name, domicile, fund_currency, dividend_policy, status | Borrador |
| `listings` | `id`, `fund_id` FK | mic, exchange_name, ticker, trading_currency, active_from, active_to | Borrador |
| `data_providers` | `id` | name, plan, license_type, terms_url, usage_restrictions, verified_at | Borrador |
| `source_documents` | `id`, provider FK | canonical_url / document_ref, issuer, title, published_at, retrieved_at, rights | Borrador |
| `observations` | `id`, fund_id/listing_id, source FK | field_key, value, unit, effective_at, captured_at, provenance_status, method, revision | Borrador |
| `price_bars` | `id`, listing FK, provider FK | date, currency, price_kind, open/high/low/close as applicable, adjusted_flag, captured_at | Borrador |
| `corporate_actions` | `id`, fund/listing FK, provider FK | action_type, ex_date/effective_date, amount/currency/ratio, source | Borrador |
| `fx_rates` | `id`, provider FK | base_currency, quote_currency, quote_per_base, rate_type, date, captured_at | Borrador |
| `research_notes` | `id`, fund_ids, user FK | question, author_client, summary, source_refs, observed_at, validation_status | Borrador |
| `research_proposals` | `id`, source/target FK | proposed_payload, reason, author, status, created_at, reviewed_by, reviewed_at, idempotency_key | Borrador |
| `comparisons` / `simulation_runs` | IDs + user FK | input_snapshot, methodology_version, source_snapshot_refs, output_summary, created_at | Borrador |
| `investment_decisions` | `id`, user FK | thesis, reasons, risks, status, reviewed_at, research_refs, created_at | Borrador |
| `audit_events` | `id` | actor, entity_ref, action, before_hash, after_hash, occurred_at | Borrador |

**Permisos:** usuario autenticado único; todas las tablas expuestas con RLS por propietario cuando proceda. Tablas privadas/servicio y propuestas MCP con autorización de servidor y auditoría; no exponer `service_role` al cliente. La elección de schema/RPC/Edge Function pertenece a BF-008/BF-017, no queda comprometida aquí.

## 3. Esquema de observación y estados

Cada valor mutable debe tener: `field_key`, `value` (decimal o texto tipado), `unit`, `subject_ref` (ISIN/listing), `source_ref`, `canonical_url`, `effective_at` (fecha del dato), `captured_at` (UTC), `validation_status`, `method_version` (si calculado), `provider_license_ref`. Timestamp técnico UTC; fecha de mercado en zona de la bolsa, con calendario del mercado.

`validation_status`: `proposed` → `under_review` → `approved` / `rejected` / `superseded`. Ningún resultado LLM se marca `approved` solo por tener una URL. La aprobación es humana y auditable.

`freshness_status`: `current` / `stale` / `unknown` / `missing`. Frescura depende de cada campo (p. ej., cotización diario versus OCF mensual/anual); ventana concreta por campo se define con el proveedor, no inventar SLA.

**Nulos:** dato faltante = `null`, no cero; mostrar **No disponible**. Si no hay denominador, FX de la fecha o serie homogénea, cálculo queda `unavailable` con `reason_code`. No sustituir valores por cifras de IA ni interpolar mercado sin política explícita.

## 4. Precios, rentabilidades y dividendos

| Tipo | Qué representa | Permitido para |
|---|---|---|
| `market_close` | Cierre del listing en moneda de negociación; puede ser no ajustado | Visualización de cotización y retorno **solo precio** |
| `adjusted_close` | Ajustado según metodología explícita del proveedor | Cálculos históricos solo si ajustes descritos |
| `nav` | Valor liquidativo del fondo/share class, no precio de mercado | Informar NAV; no intercambiar silenciosamente con cierre |
| `total_return_index` | Índice o serie de retorno total con dividendos tratados explícitamente | Backtest total-return solo si licenciado y suficientemente documentado |
| `distribution` | Distribución real de efectivo, con ex-date y payment-date | Flujos o reinversión según política explícita |

- Para clases de **acumulación**, los dividendos reinvertidos ya se reflejan en el valor; no sumar un dividendo ficticio otra vez.
- Para **distribución**, retorno total requiere reinversión y fechas ajustadas; si no hay datos, informar retorno de precio y la limitación.
- Corporate actions (splits, consolidaciones, cambios ticker) tienen eventos con procedencia. Nunca tratar un split como pérdida de mercado.
- Rendimiento de precio de una única inversión, sin aportes: `(P_fin/P_inicio)-1` usando el **mismo listing, misma base de ajuste y fechas**. Para dividendos/aportes usar motor determinista separado y metodología versionada.
- Comparar retornos en **ventana común exacta** con datos homogéneos; si no existe, bloquear la clasificación y mostrar la causa.

## 5. USD/PEN y políticas de mercado

- Tipo de cambio guardado como **PEN por 1 USD** si `base=USD, quote=PEN`; `valor_PEN=valor_USD*fx`, y la inversa solo con tasa positiva y redondeo final.
- Guardar serie, fuente oficial, compra/venta/interbancario/medio, fecha de cotización, vigencia, fecha de consulta. No mezclar compra y venta sin avisar.
- **Candidato:** BCRPData series diarias `PD04637PD` (interbancario compra), `PD04638PD` (venta); `PD04639PD/PD04640PD` SBS. La elección de una única tasa para el simulador se aprobará en BF-014. URL: https://estadisticas.bcrp.gob.pe/estadisticas/series/daily/tipo-de-cambio-nominal
- Si el mercado o FX no cotiza una fecha solicitada: **no** crear observación sintética. Para simulación se propone usar último cierre anterior **con máximo de días acotado y visible** (pendiente de aprobar) y registrar `requested_date` y `effective_date`. Si no hay tasa apropiada, devolver error explicativo.
- Para la valoración a mercado: tasa de cambio observada ≠ tipo de cambio real del bróker (spread/comisiones), ambos se mostrarán por separado cuando proceda.

## 6. Precisión, idempotencia y procedencia

- `DECIMAL/NUMERIC` para dinero, tarifas y tasas; sin `FLOAT` para persistir resultados financieros sensibles. Precisión/escala final después de prueba de fixtures.
- Unicidad de barras propuesta: `(provider, listing, trading_date, price_kind, revision)`; correcciones crean revisión y no destruyen la serie anterior.
- Propuestas IA: `idempotency_key` por `source+subject+field+effective_date+normalized_value_hash`, sin asumir que coincidencia de hash prueba veracidad.
- Toda cita conserva URL canónica, fuente, fecha de captura, fecha de publicación, tipo de derecho y solo extractos permitidos; no clonar prospectos o noticias completas sin autorización.
- Títulos de noticias ≠ datos de precio; contenidos de internet son entrada no confiable, nunca instrucciones ejecutables para MCP.

## 7. Reglas de error que deben probarse después

1. Mismo ticker en distintas bolsas => obliga a elegir listing.
2. Falta FX de fecha => simulación USD/PEN incompleta, no devuelve cero.
3. Ausencia de dividendos => no etiqueta retorno de precio como retorno total.
4. Mismo ISIN/listing recargado => comportamiento idempotente y revisiones auditadas.
5. Fuente sin permiso de reutilización => no se ingesta ni redistribuye.
6. Propuesta GPT/Claude sin fuentes => puede guardarse como borrador, no aprobarse como cifra.
7. Precio sospechoso, negativo o `NaN` => rechazo y registro de error, no ocultar.
8. Diferencias de moneda y periodos => aviso/bloqueo en matriz.

## 8. Decisiones abiertas para siguientes historias

- Cuál proveedor ofrece realmente histórico de LSE VWRA/FWRA y ETF estadounidenses bajo el plan elegido (BF-005).
- Política de ajuste de series para benchmarks/backtest (BF-013/BF-028).
- Tasa USD/PEN para valoración informativa versus costo efectivo de conversión (BF-014/BF-031).
- Estructura definitiva SQL con migraciones y tests RLS (BF-008/BF-010).
- Campos públicos/privados y duración de retención de contenido/licencias (BF-005/BF-015).

## Verificación BF-004

AC1: claves y entidades distinguen ISIN/share class y listing (ticker+MIC+moneda).  
AC2: `observations` + fuente/fecha/estado de validación, sin sobrescritura silenciosa.  
AC3: política explícita para nulos, dividendos, ajustes, FX, calendario y métodos.  
**Estado:** contrato documental y políticas P01–P05 aprobados por el PO el 2026-11-11. La futura implementación, pruebas financieras, fuente FX y migraciones permanecen pendientes.

## 9. Políticas P01–P05 aprobadas por el Product Owner (2026-11-11)

**Decisión:** el Product Owner aprobó expresamente P01–P05 el 2026-11-11 como línea base de diseño. Esta aprobación no autoriza desplegar, crear tablas, contratar proveedores ni dar por comprobada la serie de tipo de cambio. La tasa BCRP exacta se seleccionará y probará en BF-014; el límite de hasta 5 días calendario queda aprobado como política de fallback, sujeto a su aplicación y pruebas de calendario.

| Código | Política propuesta | Criterio de prueba futura |
|---|---|---|
| P01 — Identidad | Fondo/share class por ISIN; listing por MIC + ticker + divisa, con ID interno. El mismo ISIN puede tener varios listings. | VWRA y otro listing de la misma share class no generan dos fondos; tickers ambiguos requieren selección. |
| P02 — Calidad | Cada campo financiero lleva fuente, fecha efectiva, captura, plan/licencia y estado. Las revisiones no borran valores anteriores. | Un campo sin evidencia aparece «No disponible»; una corrección conserva historial. |
| P03 — Rentabilidad | Diferenciar cierre, cierre ajustado, NAV y retorno total. Comparar solo ventanas y moneda homogéneas; dividendos y splits según metodología documentada. | Si falta serie comparativa o dividendos requeridos, no declarar retorno total ni ganador. |
| P04 — USD/PEN | Para valoración informativa, proponer **tasa de referencia histórica BCRP**, especificando serie y dirección en BF-014; no equipararla con tipo efectivo del bróker. En fecha sin tasa, evaluar último dato anterior con **límite propuesto de 5 días calendario**, mostrando fecha real y aviso; pasado ese límite, no calcular. | El resultado muestra tasa, día real y fuente; no inventa FX. Para retorno en PEN se convierte **cada flujo** a la fecha que corresponde, no solo el saldo final. |
| P05 — Investigación MCP | GPT/Claude solo proponen datos con fuente y fecha. La aprobación del usuario precede cualquier publicación en registros verificados; propuestas repetidas son idempotentes. | Dos propuestas iguales no crean dos hechos; un texto web no puede convertirse en instrucción de base de datos. |

### Reglas de comparación y simulación que se desprenden

1. Precio histórico y riesgo calculados usando el **mismo listing**, intervalo y ajuste. Si un ETF tiene menor antigüedad, el sistema informa período común disponible en lugar de completar años inexistentes.
2. Los rendimientos históricos incluyen impacto de moneda solo si la política FX se aplica de forma consistente al **capital inicial, aportes y valor final**; los costos de conversión y de bróker se muestran aparte si están disponibles.
3. Costos corrientes TER/OCF pertenecen a la ficha del ETF y no se restan automáticamente de una serie neta de comisiones del propio fondo; distinguir costos internos del fondo de comisiones de bróker para evitar doble conteo.
4. Uso de fecha anterior para valoración no significa crear un precio o FX nuevo: se conserva la observación original, la fecha solicitada y la regla aplicada.
5. Cualquier retorno o escenario muestra método, moneda, fecha, fuente y limitación de cobertura.

**Decisiones pendientes:** identificación y prueba de serie FX BCRP (BF-014); proveedor y permiso histórico (BF-005); modelo físico y RLS (BF-008/BF-010).