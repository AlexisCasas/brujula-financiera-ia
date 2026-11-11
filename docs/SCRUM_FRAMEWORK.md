# Marco Scrum — Brújula Financiera IA

## Contexto

Implementaremos un **Scrum adaptado a un producto unipersonal con asistencia de agentes**: un solo responsable de producto, trabajo técnico ejecutado por personas/agentes y validación manual del PO. No se fingen un equipo Scrum completo ni ceremonias sin participantes; mantenemos sus artefactos y compromisos para conservar inspección, adaptación y transparencia.

## Roles y responsabilidades

| Responsabilidad | Responsable inicial | Qué decide |
|---|---|---|
| Product Owner (PO) | Propietario del proyecto | Product Goal, prioridades, aceptación, presupuesto, alcance y aprobación de producción |
| Developers (función) | Implementadores humanos y/o agentes ChatGPT/Claude | Diseño técnico, estimación, plan de trabajo, QA y entregables; sin autoridad implícita para producción |
| Scrum Master (función facilitadora) | PO con apoyo del asistente | Quitar impedimentos, mantener eventos, DoR/DoD, seguimiento y mejora del proceso |

## Artefactos y compromisos

- **Product Backlog → Product Goal:** `docs/PRODUCT_BACKLOG.md`, priorizado y emergente, único inventario autorizado.
- **Sprint Backlog → Sprint Goal:** historias escogidas para el sprint, con objetivo verificable, tareas y plan de realización.
- **Increment → Definition of Done:** funcionalidad integrada, verificable y aprobada según `docs/DEFINITION_OF_DONE.md`.

## Cadencia y eventos

No fijamos fechas hoy. **Antes de empezar S1 elegiremos una duración constante de Sprint de un mes o menos** (propuesta: 1 o 2 semanas). No hay sprints indefinidos. S0 es una fase inicial de preparación documental, no un sprint Scrum formal sin timebox.

1. **Sprint Planning**: definir Sprint Goal, capacidad, historias preparadas y evidencia de aceptación. Nadie asume que todos los ítems propuestos cabrán.
2. **Daily Scrum / sincronización**: inspeccionar progreso, impedimentos y plan; para un solo propietario puede ser revisión breve por sesión de trabajo; no se inventa reunión realizada.
3. **Refinamiento continuo**: dividir historias mayores a ~8 SP, resolver incertidumbres, dependencias, fuentes y reglas de datos.
4. **Sprint Review**: demostrar incremento funcionando con resultados de QA; PO acepta, modifica o devuelve al backlog. No equivale por sí sola a merge o despliegue.
5. **Retrospectiva**: acordar 1–3 ajustes concretos para el siguiente sprint (calidad, flujo, velocidad, autonomía).

## Definition of Ready (DoR) para seleccionar historias

- Historia expresada en valor de usuario, con alcance delimitado.
- 3 o más criterios de aceptación comprobables, incluyendo bordes relevantes.
- Dependencias conocidas y datos/credenciales o mocks identificados.
- Riesgos financieros, seguridad, permisos y licencias evaluados.
- Es estimable y terminable en un sprint; si no, dividir antes de compromiso.
- Existe diseño/contrato necesario o el sprint incluye su validación explícita.
- PO ha priorizado la historia. `Ready` no equivale a `Done`.

## Flujo operativo GitHub

`Product Backlog` → `Ready` → `Sprint Backlog` → `In progress` → `In review/QA` → `Done`.

- GitHub Issues son la unidad de trabajo `BF-###`; labels de épica, prioridad y sprint; GitHub Projects es opcional al inicio.
- Rama y PR por historia o por paquete técnico autorizado; se referencia el BF-ID.
- Todo cambio de alcance se refleja en Issue y docs; no reescribir silenciosamente aceptación aprobada.
- No se completa un Issue por solo abrir un PR; exige DoD y validación PO.
- Solo se incluyen en Sprint Backlog historias priorizadas y refinadas durante Planning.

## Definición de éxito del MVP

- Cinco ETF piloto con identificadores comprobados, snapshots y fuentes auditables.
- Comparación de 2–5 ETF con criterios y períodos homogéneos, indicación de datos faltantes.
- Backtest reproducible y escenarios hipotéticos con importe, aportes, FX USD/PEN y pérdidas posibles.
- ChatGPT y Claude leen datos mediante MCP y proponen cambios que pasan aprobación humana.
- Usuario único accede de forma segura; decisiones quedan vinculadas a investigaciones, hipótesis y fuentes.
- QA crítico y pruebas de seguridad/finanzas sin bloqueantes; aprobación explícita de release.

## Riesgos Scrum a vigilar

- **Estimaciones falsas:** SP expresan tamaño relativo, no horas; no hay velocidad real hasta varios sprints.
- **Fuentes:** datos históricos y licencias pueden alterar alcance; discovery BF-005 es gate.
- **MCP:** validar capacidades en los dos clientes y permisos disponibles; no tratar chat externo como chat embebido.
- **Single-person PO:** evitar ceremonias vacías, pero mantener review y retrospectiva efectivas.