# Propuesta de dirección de producto v2 — Brújula Financiera IA

**Estado:** propuesta de reorientación para aprobación del Product Owner.  
**Fecha:** 2026-11-16.  
**Alcance de este documento:** planificación y arquitectura conceptual; no modifica el esquema Supabase, la aplicación ni producción.

## 1. Nueva visión de producto

Brújula Financiera IA será un **asistente personal de investigación y seguimiento para un inversor principiante**. Su propósito no es solo comparar ETF, sino ayudar al usuario a:

1. Entender su perfil y sus objetivos de inversión.
2. Crear y mantener una lista de seguimiento de ETF y acciones.
3. Investigar noticias, resultados, informes, dividendos y hechos relevantes de cada activo.
4. Consultar esos datos conversando con ChatGPT o Claude desde sus clientes externos mediante MCP.
5. Explorar portafolios divulgados públicamente por gestores/inversores, entendiendo cuándo y qué parte de sus posiciones se reveló.
6. Comparar alternativas y documentar decisiones propias con fuentes y fechas.

**Límite del producto:** no ejecuta compras/ventas, no conecta a un bróker y no convierte las posiciones de un tercero ni una respuesta de IA en una recomendación automática.

## 2. Auditoría del estado actual (main)

### Implementado
- Next.js/React/TypeScript desplegado en Vercel.
- Supabase Auth y modelo de propietario único con RLS.
- Catálogo piloto de cinco ETF: VWRA, FWRA, VOO, VUG y SPYG.
- Mediciones versionadas de TER y patrimonio con procedencia.
- Panel, Explorador, Comparador y escenarios ilustrativos de costos.
- Comparaciones guardadas con fotografía inmutable, fechas y referencias.

### No implementado en el repositorio ni en Supabase
- No se encontró una ruta, módulo, test, scoring ni tabla de **perfil personal de riesgo**.
- BF-032 es riesgo histórico de los instrumentos (caídas/drawdown), no perfil del inversor.
- No hay modelo de acciones individuales ni lista de seguimiento.
- BF-015 existe como historia pendiente; la pantalla Investigaciones es actualmente un placeholder.
- BF-017 a BF-022 describen la arquitectura MCP, pero no hay herramientas financieras MCP desplegadas.
- No existen calendario de dividendos/distribuciones ni portafolios de gestores/inversores.
- No existen tablas de precios históricos ni FX; por tanto, no se puede afirmar crecimiento de precio ni rentabilidad histórica.

**PR #52 / BF-024b:** sigue siendo un incremento en borrador, sin merge. Su motor de control de comparabilidad puede conservarse como trabajo habilitador, pero no debe desplazar el nuevo orden de prioridades.

## 3. Experiencia central propuesta

### A. Conocer mi perfil

Un test guiado, en lenguaje sencillo, que entregue una explicación y un resultado trazable:

- **Tolerancia al riesgo:** cuánto movimiento y pérdida temporal puede soportar emocionalmente el usuario.
- **Capacidad de asumir riesgo:** cuánto riesgo permite su situación, liquidez y horizonte sin poner en peligro obligaciones cercanas.
- **Objetivo y horizonte:** crecimiento, preservación, ingresos, objetivo específico y cuándo se necesitará el dinero.
- **Experiencia/conocimiento:** familiaridad con ETF, acciones, volatilidad, dividendos y pérdidas.
- **Necesidades de liquidez y reacción ante caídas:** qué ocurriría ante una pérdida relevante y si tendría que retirar el dinero.

El resultado visible podrá expresarse como **conservador / moderado / agresivo** (equivalente de bajo / medio / alto), pero no debe depender de una única pregunta ni de una suma opaca. Debe mostrar por separado tolerancia y capacidad, explicar contradicciones y evitar asignar un perfil agresivo si la capacidad financiera/horizonte no lo respaldan.

El cuestionario, su versión, las respuestas y el resultado se conservarán con fecha para permitir reevaluaciones. Las respuestas financieras personales se tratarán como datos privados y no se enviarán completas a ChatGPT/Claude por defecto; el MCP expondrá el resumen estrictamente necesario y autorizado.

**Uso del perfil:** contextualiza explicaciones, alertas y comparaciones; no autoriza al sistema a decidir qué comprar.

### B. Mi seguimiento — ETF y acciones

El usuario puede agregar y dejar de seguir activos desde la web o conversando:

- “Agrega VWRA a mi seguimiento”.
- “Empieza a seguir Microsoft en NASDAQ”.
- “Deja de seguir VOO”.
- “¿Qué novedades hay sobre los activos que sigo?”

Cada activo debe resolverse por identidad (ISIN/identificador y listing: mercado, ticker y moneda), no solo por ticker. Si hay ambigüedad, el asistente debe preguntar antes de agregar.

Quitar de seguimiento será una baja lógica: detiene el seguimiento activo, pero conserva noticias, investigaciones, decisiones y auditoría previas. No elimina el instrumento del catálogo ni sus datos históricos. Seguir un activo no significa comprarlo ni tenerlo en cartera.

### C. Noticias, informes y eventos por activo

Cada activo seguido podrá relacionarse con:
- Noticias de medios identificados.
- Comunicados oficiales del emisor.
- Informes trimestrales/anuales, estados financieros y presentaciones de resultados.
- Hechos relevantes, cambios de guidance, adquisiciones, litigios o cambios regulatorios cuando haya fuente.
- Dividendos de acciones y distribuciones de ETF.

Cada elemento guardará título, editor/emisor, URL canónica, fecha de publicación, fecha de captura, activos relacionados y tipo de documento/evento. La síntesis de IA se separará de los hechos citados y conservará enlaces a las fuentes. Las URL duplicadas se consolidarán; un mismo documento podrá relacionarse con varios activos. Se guardarán metadatos y resúmenes, no copias extensas de artículos protegidos.

**Dividendo de acción y distribución de ETF no son sinónimos.** Para acciones se distinguirán anuncio, fecha ex-dividendo, fecha de registro, pago, importe y moneda. Para ETF se registrará su política de acumulación/distribución y los eventos de distribución en efectivo cuando correspondan. Un ETF acumulativo no debe mostrarse como si pagara efectivo al titular: normalmente reinvierte los ingresos dentro del fondo.

### D. Portafolios divulgados públicamente

Módulo separado para explorar gestores e inversores cuyos datos estén divulgados oficialmente. Cada portafolio será un **snapshot** con:
- Gestor/entidad que presenta el reporte.
- Periodo al que corresponde la cartera (as-of / quarter end).
- Fecha de presentación pública.
- Formulario/documento, identificador de presentación y fuente oficial.
- Posiciones reportadas, clase de valor, identificador, acciones y valor reportado.
- Diferencias frente al periodo anterior, solo cuando ambos reportes sean comparables.

La interfaz debe decir “posiciones reportadas al cierre del trimestre X, presentadas el día Y”, no “cartera actual” si la información tiene retraso. El valor reportado al cierre del periodo no es el valor de mercado actual ni la riqueza total del inversor.

#### Caso Warren Buffett / Berkshire Hathaway

Para Estados Unidos, Form 13F puede ser una fuente primaria de posiciones institucionales. La SEC indica que deben presentar los gestores institucionales que ejercen discreción sobre al menos USD 100 millones en valores Section 13(f); se presentan trimestralmente dentro de 45 días después del cierre del trimestre y reportan valor de mercado al cierre del trimestre. El reporte cubre únicamente valores incluidos en la lista Section 13(f), no posiciones cortas y no todos los activos posibles del gestor.

Ejemplo vigente: el filing de **Berkshire Hathaway Inc.** con periodo reportado 2026-09-30 fue presentado el 2026-11-16. Es decir, la divulgación puede llegar varias semanas después del cierre. La SEC también muestra a Warren E. Buffett en un filing de tipo Notice que identifica a Berkshire Hathaway como entidad que presenta las posiciones por él. Por eso la interfaz debe identificar con precisión el **gestor/filer** y no etiquetar automáticamente la tabla como “portafolio personal actual de Warren Buffett”.

El piloto recomendado es **Berkshire Hathaway Inc. — Form 13F**, no una afirmación de que todas las inversiones personales de Warren Buffett sean públicas. Otros gestores se agregarán cuando tengan identificador, filing y fuente oficial verificables.

## 4. Contrato conversacional MCP propuesto

ChatGPT y Claude seguirán funcionando en sus chats externos; no se añadirá OpenAI API ni Anthropic API a Next.js.

Herramientas candidatas (contratos por definir en BF-017):
- `get_investor_profile()`: devuelve solo el resumen autorizado del perfil.
- `list_watchlist()`: lista activos seguidos y su estado.
- `add_to_watchlist(asset_identifier)`: resuelve ISIN/listing y agrega tras validar identidad.
- `remove_from_watchlist(watchlist_item_id)`: deja de seguir sin borrar historial.
- `get_asset_research(asset_id, since)`: noticias, documentos y eventos guardados.
- `submit_research_proposal(payload)`: propone noticia/hallazgo/evento con fuente, fecha y claves idempotentes; no altera hechos aprobados directamente.
- `list_public_investors()` / `get_public_portfolio(manager_id, period)`: consulta snapshots divulgados.

El contrato no expone SQL arbitrario. Las acciones de escritura validan identidad, evitan duplicados y dejan auditoría. Una consulta informativa no debe mutar datos; agregar/quitar un activo es una acción explícita del usuario y debe confirmar el listing si hay ambigüedad.

## 5. Reordenamiento propuesto del Product Backlog

Se conservan los IDs BF-001 a BF-038; se actualizan criterios/dependencias donde corresponda y se agregan nuevas historias. Story points y sprint final se refinan, no se convierten en fechas.

| Orden | Historia / cambio | Prioridad sugerida | Objetivo |
|---:|---|---|---|
| 1 | **Nueva BF-039 — Perfil del inversor y test versionado** | P0 | Cuestionario, tolerancia vs capacidad, resultado explicado e historial |
| 2 | **Nueva BF-040 — Catálogo genérico de ETF y acciones** | P0 | Ampliar `instrument` y listings con tipo de activo e identificadores fiables |
| 3 | **Nueva BF-041 — Mi seguimiento (watchlist)** | P0 | Agregar, pausar y dejar de seguir activos sin borrar historial |
| 4 | **Actualizar BF-017 — Contrato MCP** | P0 | Incorporar herramientas de perfil, watchlist, investigación y consulta de portafolios |
| 5 | **Actualizar BF-018/019/020** | P0 | Lectura desde ChatGPT/Claude y escritura controlada para seguimiento/propuestas |
| 6 | **Actualizar BF-015 — Noticias e informes por activo** | P0 | Noticias, documentos, resultados empresariales, citación y separación hecho/opinión IA |
| 7 | **Actualizar BF-005 — Discovery de fuentes** | P0 | Cobertura/licencia para ETF y acciones, noticias, precios, dividendos y SEC EDGAR |
| 8 | **Repriorizar BF-013 y BF-014** | P0 | Precios históricos y FX por fecha para medir crecimiento de valor sin inventar retornos |
| 9 | **Nueva BF-042 — Calendario de dividendos y distribuciones** | P1 | Eventos de acciones y ETF, fechas, importes, moneda y fuente |
| 10 | **Nueva BF-043 — Biblioteca de gestores y portafolios públicos** | P1 | Registro de gestores, CIK/identificadores y filings oficiales |
| 11 | **Nueva BF-044 — Snapshots y cambios de portafolios públicos** | P1 | Posiciones históricas, fecha de corte/presentación y variación reportada |
| 12 | BF-023/024/025/026/027 | P1/P0 | Comparación y análisis después de disponer de perfil, activos y datos homogéneos |
| 13 | BF-028 a BF-033 | P1/P0 | Simulación/backtest tras BF-013/BF-014 |
| 14 | BF-034/035/036 | P1/P0 | Decisiones, biblioteca y exportación enlazadas al seguimiento |

### Dependencias principales

```text
BF-039 Perfil ───────────────────────────────┐
                                             v
BF-040 Modelo ETF/acciones -> BF-041 Watchlist -> BF-017 MCP
                                             |          |
                                             v          v
                                       BF-015 News   BF-018/019/020
                                             |
BF-005 Fuentes -> BF-013 Precios -> BF-024 Comparador / BF-028 Simulador
             └-> BF-014 FX ────────┘
             └-> BF-042 Dividendos
             └-> BF-043/044 Portafolios públicos (SEC/IR)
```

## 6. Arquitectura y privacidad

Entidades futuras candidatas (no creadas):
- `investor_profile`, `profile_questionnaire_version`, `profile_answer` o un snapshot de respuestas/resultados versionados.
- `instrument.asset_type` (`etf` / `equity`) y metadatos específicos por tipo; listings por mercado y moneda.
- `watchlist_item` con estado activo/inactivo, fecha, nota y auditoría.
- `news_item`, `research_record`, `asset_research_link`, `corporate_event`.
- `public_investor` / `investment_manager`, `manager_filing`, `manager_holding`.

Todo dato privado tendrá RLS y solo el propietario podrá leerlo. No se expondrán respuestas completas del test a terceros. Los datos de portafolios públicos conservarán fuente oficial, periodo y fecha de publicación. Los informes de IA se almacenarán como análisis derivados, no como hechos.

## 7. Reglas de producto no negociables

1. El perfil orienta el análisis; no genera una orden ni una recomendación automática.
2. Seguir un activo no significa poseerlo.
3. Dejar de seguir no borra el historial.
4. Una noticia no equivale a un hecho financiero confirmado.
5. Un dividendo declarado no equivale a un dividendo pagado.
6. Distribuciones de ETF y dividendos de acciones se modelan por separado.
7. Precio de cierre, precio ajustado, NAV y total return son conceptos distintos.
8. Las posiciones 13F son divulgaciones históricas limitadas, no señales de compra ni portafolios en tiempo real.
9. GPT/Claude pueden investigar y proponer; las cifras aprobadas y los cambios guardados conservan fuentes, fecha y auditoría.
10. No se contrata ni integra un proveedor de pago sin discovery de cobertura, coste y licencia (BF-005).

## 8. Decisiones solicitadas al Product Owner

- [x] Reorientar el producto a un asistente personal de inversión para principiante.
- [x] Incorporar acciones individuales además de ETF en el alcance futuro.
- [x] Incorporar perfil del inversor, seguimiento conversacional, noticias/informes y portafolios públicos.
- [ ] Validar el método de puntuación del test (preguntas, ponderación y reglas para contradicciones entre tolerancia y capacidad).
- [ ] Validar los primeros gestores/portafolios a incluir después del piloto Berkshire Hathaway.
- [ ] Confirmar el orden de ejecución del nuevo backlog y el alcance exacto del primer incremento.

## 9. Referencias externas de diseño

- SEC, [Frequently Asked Questions About Form 13F](https://www.sec.gov/rules-regulations/staff-guidance/frequently-asked-questions-about-form-13f): umbral, plazo, valores reportables, valor al cierre de trimestre y posiciones cortas no reportadas.
- SEC EDGAR, [Berkshire Hathaway Inc. Form 13F, periodo 2026-09-30, presentado 2026-11-16](https://www.sec.gov/Archives/edgar/data/1067983/000119312526463399/0001193125-26-463399-index.html).
- Investor.gov, [Asset Allocation and Diversification](https://www.investor.gov/introduction-investing/getting-started/asset-allocation): horizonte y tolerancia al riesgo.
- FINRA, [Know Your Risk Tolerance](https://syndication.finra.org/content/know-your-risk-tolerance): objetivos, horizonte, dependencia de los fondos y comodidad con pérdidas.

**Gate:** aprobar esta dirección antes de reemplazar la fuente de verdad del Product Backlog. Este documento no ejecuta cambios de esquema, no agrega instrumentos ni modifica producción.
