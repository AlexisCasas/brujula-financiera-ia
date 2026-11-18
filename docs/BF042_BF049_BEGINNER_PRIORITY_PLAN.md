# BF-042 a BF-049 — Ruta prioritaria para inversor principiante

**Fecha:** 2026-11-18  
**Estado:** plan aprobado para desarrollo  
**Rama:** `feat/BF-042-049-beginner-path`  
**Objetivo:** completar la capa de orientación, aprendizaje y decisión que debe existir antes de conectar el MCP BF-017.

## Por qué este bloque va antes de BF-017

Brújula ya dispone de tres capacidades base: perfil de riesgo (BF-039), seguimiento privado (BF-041a) y catálogo BVL/ETF (BF-040). El siguiente valor para un principiante no es infraestructura conversacional, sino cerrar el recorrido:

`¿Quién soy? → ¿Qué quiero lograr? → ¿Qué debo entender? → ¿Qué alternativas tengo? → ¿Qué podría pasar? → ¿Qué decisión estoy considerando?`

El MCP se mantiene deliberadamente después de este bloque para que la IA consulte un producto funcional y con contexto propio.

## Principios de producto

1. **Educación antes que recomendación.** La aplicación explica características, riesgos, costos y supuestos; no asigna una compra automáticamente.
2. **Perfil no equivale a producto.** Un perfil moderado no convierte por sí solo un ETF o acción en una recomendación.
3. **Objetivo + horizonte + capacidad + tolerancia** son contexto de la decisión. El horizonte y la tolerancia son factores centrales para la asignación de activos y la diversificación. Referencia educativa: Investor.gov.
4. **No inventar datos.** Un dato ausente se muestra como no disponible. Una métrica histórica requiere fuente, fecha, unidad, metodología y cobertura.
5. **Escenarios no son pronósticos.** El simulador trabaja con supuestos explícitos y los presenta como ilustraciones matemáticas.
6. **Seguir no es poseer.** La watchlist sigue siendo una lista de interés, no un registro de tenencias.
7. **Primero usuario único y privado.** Los datos personales, objetivos, simulaciones y decisiones quedan owner-only mediante RLS.
8. **MCP después.** BF-017a será el siguiente bloque una vez cerrados BF-042–BF-049 y su QA.

## Historias

### BF-042 — Objetivo de inversión

**Historia:** Como inversor principiante quiero declarar qué quiero conseguir, en cuánto tiempo y con qué capacidad de aporte, para que Brújula pueda interpretar mi perfil y mis investigaciones dentro de un objetivo concreto.

**Incluye**
- objetivo principal y categoría;
- monto objetivo opcional;
- moneda USD/PEN;
- horizonte;
- aporte inicial;
- aporte periódico;
- frecuencia;
- estado de preparación financiera sin solicitar datos bancarios;
- historial de cambios mediante snapshots.

**No incluye:** conexión bancaria, patrimonio neto automático ni recomendación de asignación.

**Dependencias:** BF-039, Auth/RLS.

### BF-043 — Explicación del perfil

**Historia:** Como principiante quiero que Brújula me explique qué significa mi perfil y cuáles son sus límites, para no confundir una etiqueta de riesgo con una recomendación de producto.

**Incluye**
- explicación de capacidad y tolerancia por separado;
- razón limitante;
- horizonte y liquidez como factores de contexto;
- ejemplos de comportamientos compatibles/no compatibles;
- aviso de autoevaluación educativa;
- enlace al objetivo y a la exploración.

**Dependencias:** BF-039, BF-042.

### BF-044 — Academia financiera básica

**Historia:** Como principiante quiero aprender los conceptos mínimos justo cuando los necesito, sin tener que estudiar un curso completo antes de usar la aplicación.

**Módulos**
- invertir vs. ahorrar;
- acción;
- ETF;
- diversificación;
- riesgo;
- volatilidad;
- rentabilidad;
- TER/costos;
- dividendos;
- horizonte;
- interés compuesto;
- USD/PEN;
- drawdown.

Cada lección tendrá explicación corta, ejemplo, “por qué importa” y una advertencia de lo que no significa.

**Fuentes educativas base:** Investor.gov y documentación oficial de los emisores cuando corresponda.

### BF-045 — Explorador educativo

**Historia:** Como principiante quiero filtrar instrumentos por características que entiendo, para reducir el catálogo sin convertir el filtro en una recomendación automática.

**Incluye**
- filtros de tipo de activo;
- diversificación documentada;
- política de dividendos;
- región/mercado cuando exista evidencia;
- enfoque amplio vs. concentrado cuando pueda demostrarse;
- moneda/mercado;
- tarjetas de “qué significa” y “qué no significa”;
- acciones BVL separadas de ETF.

### BF-046 — Comparador educativo

**Historia:** Como principiante quiero comparar alternativas y entender qué diferencias importan realmente.

**Incluye**
- comparación existente enriquecida con tipo de activo;
- explicación de cada métrica;
- costo recurrente vs. costo de transacción;
- diversificación y concentración cuando estén verificadas;
- calidad/cobertura de datos;
- resumen de compensaciones, sin “ganador” automático;
- contexto con el objetivo del usuario;
- preguntas de comprobación antes de una decisión.

**Dependencias:** BF-042 a BF-045 + BF-023/BF-027.

### BF-047 — Simulador de escenarios

**Historia:** Como principiante quiero introducir un capital inicial, aportes y horizonte para observar escenarios hipotéticos y distinguir aportes de crecimiento.

**Incluye**
- PEN/USD;
- capital inicial;
- aporte mensual;
- plazo;
- escenarios conservador/base/optimista definidos por el usuario;
- capital aportado;
- valor final hipotético;
- crecimiento sobre aportes;
- tabla anual;
- fórmula reproducible;
- advertencias claras de que no es una predicción.

**Guardado:** escenario reproducible owner-only.

**No incluye:** rentabilidad futura “esperada” calculada automáticamente a partir de un ETF.

### BF-048 — Mi primera decisión

**Historia:** Como principiante quiero registrar por qué estoy considerando un instrumento, qué riesgos entiendo y qué alternativas descarté, para convertir la investigación en una decisión trazable.

**Incluye**
- instrumento/listing;
- objetivo relacionado;
- tesis;
- razones a favor;
- riesgos;
- alternativa;
- escenario consultado;
- estado: observando / considerando / descartado;
- fecha;
- historial append-only.

**No incluye:** orden bursátil ni registro de tenencia.

### BF-049 — Capa de datos históricos verificables

**Historia:** Como inversor quiero consultar rendimiento histórico y riesgo únicamente cuando exista una serie o medición verificable y comparable.

**Implementación en esta fase**
- modelo versionado para snapshots históricos;
- métricas: rendimiento por periodo, volatilidad y drawdown cuando exista cobertura;
- fuente, fecha efectiva, fecha de captura, unidad, metodología y cobertura;
- soporte para series diarias futuras sin acoplar la UI a un proveedor;
- datos oficiales de rendimiento disponibles públicamente solo cuando la identidad del listing/fondo y el periodo sean inequívocos;
- estado explícito `no disponible` cuando falte una serie licenciada o comparable.

**Gate de datos:** no se descargan precios masivos ni se contrata una API sin una decisión posterior de proveedor/licencia. Esta fase puede dejar métricas sin disponibilidad para determinados listings y debe mostrarlo claramente.

## Dependencias de salida

```
BF-039
   ↓
BF-042 → BF-043 → BF-044
   ↓        ↓
BF-045 → BF-046
   ↓        ↓
BF-047 → BF-048
   ↓
BF-049
   ↓
QA integral del bloque
   ↓
BF-017a MCP
```

La dependencia real no es estrictamente lineal: BF-045/BF-046 pueden desarrollarse con datos documentales existentes; BF-047 funciona con supuestos introducidos por el usuario; BF-049 queda condicionado por la cobertura de fuentes.

## Mejoras adicionales incorporadas

- **Ruta de principiante en Panel:** progreso visible y siguiente acción recomendada por estado, sin recomendar instrumentos.
- **Contexto cruzado:** perfil y objetivo se muestran como contexto, no como regla automática de compra.
- **Explicabilidad local:** cada métrica nueva tiene “qué es”, “por qué importa”, “cómo se calcula” y “qué no permite concluir”.
- **Guardrails financieros:** no mostrar rentabilidad futura como hecho, no usar datos faltantes como cero, no convertir el perfil en recomendación y no mezclar seguimiento con tenencia.
- **Persistencia reproducible:** objetivos, escenarios y decisiones guardan versión/metodología cuando corresponda.
- **Preparación MCP:** las entidades y consultas quedan diseñadas para ser consultables posteriormente por herramientas de solo lectura.

## Fuentes educativas iniciales

- Investor.gov — Asset Allocation and Diversification: https://www.investor.gov/introduction-investing/getting-started/asset-allocation
- Investor.gov — Beginners' Guide to Asset Allocation, Diversification, and Rebalancing: https://www.investor.gov/additional-resources/general-resources/publications-research/info-sheets/beginners-guide-asset
- Investor.gov — Define Your Goals: https://www.investor.gov/introduction-investing/investing-basics/save-and-invest/define-your-goals
- Investor.gov — Compound Interest Calculator: https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator
- FINRA — Getting Started as an Investor: https://syndication.finra.org/content/getting-started-investor

## Definition of Done específica

- CI verde: lint, typecheck, tests, guardrails y build.
- Pruebas deterministas para cálculos y validaciones.
- RLS probado para objetivos, escenarios y decisiones.
- No hay claves ni secretos en frontend.
- Datos históricos con fuente/fecha/metodología; los faltantes se muestran como no disponibles.
- QA visual responsive en las rutas nuevas/modificadas.
- Preview Vercel verificado.
- PR de integración con BF-ID y evidencia.
- **No se integra BF-017a durante este bloque.**
