# Roadmap orientativo de Sprints (sin fechas comprometidas)

**Nota Scrum:** S0 es preparación inicial fuera de Sprint formal. S1–S6 son *agrupaciones sugeridas* para refinamiento; la capacidad, duración constante y Sprint Goal definitivo se establecen en Sprint Planning. No convertir los story points en días.

| Bloque | Objetivo observable / Sprint Goal sugerido | Historias propuestas | Gate de salida |
|---|---|---|---|
| S0 — Inicio | Alinear producto, criterios, fuentes y diseño | BF-001 a BF-005 | PO revisa documentos, riesgos y fuentes piloto; sin código productivo |
| S1 — Base segura | Entrar a una app privada con catálogo modelado | BF-006 a BF-010 | Login/denegación no autenticado + RLS y CI verde |
| S2 — Datos verificables | Consultar fichas con series y USD/PEN trazables | BF-011 a BF-016 | 5 ETF + fechas/fuentes + negativos por datos ausentes |
| S3 — Investigación MCP | Investigar desde ChatGPT o Claude y aprobar cambios | BF-017 a BF-022 | Lectura, propuesta, revisión, auditoría y prueba cruzada |
| S4 — Comparador | Comparar ETF sin mezclar métricas incompatibles | BF-023 a BF-027 | Matriz 2–5 ETF con periodos, evidencia y cautelas |
| S5 — Simulador | Probar capital, aportes y escenarios sin inventar retornos | BF-028 a BF-033 | Fixtures reproducibles y FX/risks explícitos |
| S6 — Decisiones y release | Conservar tesis y lanzar versión segura | BF-034 a BF-038 | Decisiones, export, QA integral y smoke test |

## Dependencias y riesgo de secuencia

- BF-005 es **gate de viabilidad**: no seleccionar fuente definitiva sin comprobar cobertura de listings y licencia de redistribución.
- BF-008 es **gate de seguridad** antes de conectar producción o MCP con escritura.
- BF-013/BF-014 son **gates matemáticos** para benchmarking y backtests; si fallan, no sustituir series mediante inferencias de IA.
- BF-017–BF-020 son **gates de acceso externo**; si el proveedor de chat requiere configuración adicional, usar stubs y seguir con frontend sin simular que el MCP está operativo.
- BF-037/BF-038 son **gates de release**, no tareas opcionales.

## Propuesta inicial de tablero

Columnas: `Product Backlog`, `Ready`, `Sprint Backlog`, `In Progress`, `In Review/QA`, `Done`.

Filtros: `Epic`, `Priority`, `Sprint`, `BF-ID`. No marcar fechas hasta Sprint Planning. Una historia bloqueada regresa a backlog o se gestiona como impedimento explícito.