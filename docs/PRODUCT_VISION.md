# BF-001 · Visión, audiencia y contrato de MVP

**Estado:** propuesta de aprobación del Product Owner · **Fecha:** 2026-11-11  
**Historia:** [BF-001](https://github.com/AlexisCasas/brujula-financiera-ia/issues/1)

## Problema

Un inversor principiante con residencia en Perú compara ETF mediante webs, documentos, chats y hojas aisladas; puede confundir fondos y listings, comparar rentabilidades en distintas fechas/monedas y tomar decisiones sin registrar la evidencia ni los riesgos.

## Product Goal

En el MVP, una persona autenticada podrá **investigar cinco ETF**, comparar alternativas homogéneas, simular resultados históricos y escenarios hipotéticos en **USD y PEN**, y conservar una tesis de decisión con fuentes. ChatGPT y Claude investigan **fuera de la web** usando MCP seguro para consultar el repositorio de datos y **proponer** nuevos registros sujetos a revisión humana.

## Persona y necesidades

- **Usuario principal:** inversor novato que utiliza un bróker externo y desea entender ETF antes de invertir; usuario único, no se habilita registro público.
- **Contexto:** puede comenzar con capital limitado y realizar aportes esporádicos; trabaja en USD y necesita revisar equivalente PEN.
- **Necesidades:** lenguaje sencillo; explicación de incertidumbre; ISIN y bolsa correctos; comparaciones con periodos idénticos; simulaciones que muestren pérdidas; historial de decisiones; enlaces a evidencia original.
- **Responsable de decisión:** exclusivamente el usuario; la IA **no** decide operaciones ni genera órdenes de inversión.

## Capacidades dentro de alcance

| Módulo | Acción observable | Datos mínimos |
|---|---|---|
| Panel | Ver investigaciones recientes, ETF seguidos y estado de información | Fecha de revisión, alertas de vigencia |
| Explorar ETF | Buscar por ticker/ISIN y seleccionar listing exacto | Fondo, bolsa, moneda, fuente |
| Comparador | Contrastar entre 2 y 5 ETF y guardar matriz | Mismo periodo/moneda, métricas no disponibles visibles |
| Simulador | Calcular inversión única, aportes y escenarios configurables | Serie documentada, FX por fecha, supuestos y costos opcionales |
| Investigaciones | Leer resultados y propuestas de ChatGPT/Claude | Autor, modelo/cliente, fuentes, fecha y estado |
| Decisiones | Documentar tesis, riesgos y revisión pendiente | ETF, argumento, evidencia, estado y fecha |

**Catálogo piloto propuesto:** VWRA, FWRA, VOO, VUG y SPYG; identidad contrastada con emisores y cobertura de API pendiente de prueba autenticada.

## Límites explícitos del MVP

1. **No** compra/venta, órdenes, custodia, gestión de patrimonio, conexión a XTB ni lectura de saldos del bróker.
2. **No** recomendación automática personalizada, predicción de precios garantizada ni clasificación secreta de «mejor ETF».
3. **No** chat de GPT/Claude embebido en Next.js; **no** se incorporan OpenAI API ni Anthropic API sin cambio aprobado.
4. **No** actualización de cotizaciones por inferencia de LLM; importaciones con fuente autorizada y revisión.
5. **No** exposición pública de posiciones, investigaciones personales, claves, tokens ni datos de proveedores que carezcan de licencia de redistribución. **Repositorio público no implica aplicación/datos públicos.**
6. **No** motor fiscal, regulatorio, rebalanceo automático ni asesoría legal/tributaria en MVP.

## Flujo troncal que define el valor

Usuario → Explorar ticker/ISIN → Verificar fondo/listing → Seleccionar 2–5 ETF → Matriz normalizada → Simulación reproducible → Consultar ChatGPT o Claude (MCP) → Revisar propuesta/investigación → Registrar tesis propia → Reabrir revisión cuando cambie la evidencia.

## Medidas de éxito y puertas de aceptación

| ID | Métrica / prueba | Objetivo verificable |
|---|---|---|
| G-01 | Identidad de ETF | Los 5 candidatos tienen ISIN confirmado; no se mezclan listing/moneda |
| G-02 | Trazabilidad | Toda métrica financiera visible presenta fecha efectiva y procedencia o está señalada como faltante |
| G-03 | Comparador | Matriz de 2–5 ETF con ventana/moneda homogéneas; bloqueo o aviso explícito cuando no comparables |
| G-04 | Simulación | Casos fixture reproducibles, muestran pérdidas posibles, y distinguen histórico de hipótesis |
| G-05 | Monedas | Resultados USD/PEN con tipo de cambio histórico de fecha pertinente, sin imputación silenciosa |
| G-06 | MCP | ChatGPT y Claude consultan la misma ficha; cambios propuestos no se publican sin aprobación |
| G-07 | Protección | Usuario ajeno/anónimo no accede a datos privados; 0 secretos en repositorio/navegador |
| G-08 | Decisión | Es posible guardar y revisar una tesis con fecha, fuentes, riesgos y alternativa descartada |
| G-09 | Release | QA crítico PASS y autorización explícita de merge/despliegue |

No se asumen métricas de uso, costos ni plazos hasta disponer de baseline real. Los objetivos son puertas funcionales, no una promesa de retornos financieros.

## Supuestos y riesgos

| Riesgo / supuesto | Impacto | Medida |
|---|---|---|
| Datos API para ETF UCITS de LSE pueden no estar incluidos en un plan económico | Alto | BF-005: prueba por ISIN+listing con 2 proveedores y plan alternativo |
| Proveedores limitan almacenamiento, exposición o redistribución | Alto | Diferenciar uso personal vs compartir app/datos; revisar términos antes de ingestión |
| Ajustes por dividendos y corporate actions incompletos | Alto | Contrato de tipos de precio; no llamar «rendimiento total» a cierre sin ajustar |
| MCP depende de capacidades/permisos de cada cliente | Alto | POC aislado en BF-017–BF-020, sin asumir compatibilidad idéntica |
| Dato encontrado en internet puede estar desactualizado | Medio | Fuente, fecha efectiva/captura, estatus y revisión antes de aprobación |
| Sprints todavía sin cadencia formal | Medio | S0 es fase de preparación; fijar duración constante antes de S1 |

## Aprobaciones

**Ya decidido por el PO en conversación:** solo ETF, un usuario, USD/PEN, equilibrio de investigación/comparación/simulador, GitHub/Supabase/Vercel y ChatGPT/Claude por MCP externo sin API de modelos.

**Pendiente de aprobar expresamente:** flujo UI de BF-003, diccionario y políticas de BF-004, proveedor operativo de BF-005, cadencia y presupuesto. Una propuesta documentada no equivale a aprobación ni a un servicio implementado.

## AC BF-001 y evidencia

- AC1: satisfecha **documentalmente** por este contrato de alcance y el registro de decisiones.
- AC2: satisfecha **documentalmente** por la sección de exclusiones.
- AC3: satisfecha **documentalmente** por G-01..G-09 y tabla de riesgos.
- **Cierre del Issue:** pendiente de revisión del PO, PR sin merge.