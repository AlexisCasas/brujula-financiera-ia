# BF-024b — Motor de comparabilidad histórica y análisis de cobertura

**Estado:** Incremento parcial de BF-024, en rama para revisión. No cerrar la historia; BF-013/BF-014 siguen pendientes.  
**Repositorio:** \`AlexisCasas/brujula-financiera-ia\`  
**Entorno:** Next.js / Supabase lectura autenticada / Vercel Preview (CI sujeto a ejecución).

## Diagnóstico real de Supabase (solo lectura)

Proyecto \`ncalhbwyuwxopokgfcty\` al iniciar el incremento:

- 5 fondos y listings: VWRA, FWRA, VOO, VUG, SPYG.
- 13 mediciones versionadas de TER y patrimonio con fuente; \`saved_etf_comparison\` sin filas al momento de auditar.
- **No hay una tabla de precios diarios ni de FX histórico** en \`public\`.
- La app actual usa \`getEtfCatalog()\`, que consulta las vistas \`catalog_overview\` y \`field_status\` con autenticación y RLS.

Por tanto, **no se cargan precios, no se consulta un proveedor externo y no se presenta rentabilidad real**.

## Entregables

1. **Motor puro \`historical-comparability.ts\`**: recibe 2–5 series diarias verificadas asociadas a listings, un período y una fecha final. Es determinista y reutilizable por BF-013/BF-024.
2. **Ventanas**: 1, 3, 6, 12, 24 meses, basadas en meses calendario, con ajuste exacto del último día del mes y años bisiestos.
3. **Anclas homogéneas**: inicio y fin deben corresponder a **fechas de observación idénticas** para todos los ETF; se acepta el último día observado en los cinco días calendario previos al ancla solicitada, sin interpolación.
4. **Rechazos explícitos**: serie ausente, fechas inválidas, valores nulos/negativos/cero, observaciones duplicadas, cobertura insuficiente, fuente/licencia/metodología desconocida, moneda o tipo de precio diferente, o cambio brusco (>60 % entre sesiones cercanas) a revisar.
5. **Frecuencia mínima compartida**: 12 / 40 / 80 / 160 / 320 sesiones para las cinco ventanas. Son umbrales heurísticos prudentes para **datos diarios**; no sustituyen el QA de BF-013.
6. **Cálculo condicionado**: únicamente al pasar los controles, \`(valor_fin / valor_inicio - 1) × 100\` usando fechas efectivamente observadas. Se muestra si proviene de cierre crudo, ajustado, NAV o índice de retorno total. El precio sin ajustar **no** incluye dividendos.
7. **Panel interactivo \`/comparador\`** con períodos y corte UTC; en esta versión solo indica que las series aún no están integradas. Los *fixtures* de pruebas no se cargan en la interfaz.
8. **Coincidencias de benchmarks**: se detecta igualdad canónica del **nombre declarado del índice** (VWRA/FWRA: FTSE All-World Index), con evidencia por ETF cuando está disponible. **No se infiere exposición geográfica ni solapamiento de empresas**.

## Semántica de moneda y retorno

- Los cálculos del motor requieren una única moneda entre todos los ETF; **no** se equiparan USD y PEN ni se aplica un FX actual a periodos anteriores.
- Cierre crudo: variación **solo de precio**, no retorno total.
- Cierre ajustado: puede incluir ajustes de eventos corporativos según su metodología; no afirmar automáticamente que incluye todos los dividendos.
- NAV: cambio del valor liquidativo; no asumir reinversión de distribuciones.
- Índice de retorno total: solamente si su metodología está validada y el origen/licencia están autorizados.
- El motor **no calcula volatilidad** ni ratios de riesgo hasta que exista cobertura de rendimientos suficiente y metodología validada.

## Integración futura con BF-013 / BF-014

El componente recibe un conjunto tipado \`VerifiedDailySeries[]\`. Hoy se le pasa un arreglo vacío de forma explícita porque el proyecto carece de series. BF-013 añadirá la lectura segura desde almacenamiento, la validación de calidad, el control de licencia y el mapeo \`listing_id\` → serie; entonces se conectará sin reescribir las reglas. BF-014 añadirá FX por fecha y las condiciones de comparación PEN.

## QA

- \`tests/historical-comparability.test.ts\` usa datos sintéticos **solamente dentro de los tests**.
- Escenarios: cinco ventanas, fechas de fin de mes, años bisiestos, series ausentes, monedas dispares, precios ajustados vs sin ajustar, duplicados, observaciones inválidas, anclas comunes, densidad mínima, cambio brusco y coincidencia exacta de índices.
- GitHub CI: npm ci, lint, typecheck, tests, guardrails, Next.js build.
- Vercel Preview y QA real del PO pendientes al crear la PR.

### Checklist de validación visual

1. Iniciar sesión en Preview y abrir \`/comparador\`.
2. Seleccionar **VWRA y FWRA**, luego probar todas las ventanas.
3. Confirmar que dice **No comparable** y que ninguna cifra de rentabilidad aparece como si procediera de Supabase.
4. Verificar que VWRA y FWRA comparten nombre de índice, pero que el sistema no afirma que sus participaciones sean iguales.
5. Seleccionar VOO y SPYG: sus índices tienen nombres distintos y no deben presentarse como equivalentes.
6. Probar fecha final manual, fecha futura/errónea, navegación móvil y teclado.
7. Confirmar que las comparaciones guardadas y el análisis de costos BF-024a continúan funcionando.
8. Comprobar que la vista no es accesible sin sesión.

**Fuera de alcance:** cambios SQL, migraciones, proveedores API, imputación de precios o rendimientos y publicaciones en producción. El PR requiere aprobación explícita para merge.
