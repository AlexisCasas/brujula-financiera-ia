# Definition of Done (DoD) — v1.0

**Aplicación:** a cada Product Backlog Item convertido en Increment. Un ítem sin evidencia de cada requisito aplicable permanece abierto, aunque esté programado. No confundir DoD con criterios de aceptación: los criterios prueban la historia específica; la DoD exige calidad transversal.

## Checklist verificable

| Código | Requisito de cierre | Evidencia requerida |
|---|---|---|
| DOD-01 | Historia `BF-###` vinculada y aceptación vigente | Issue/PR enlazado, sin criterios pendientes |
| DOD-02 | Implementación cumple 100% de sus criterios de aceptación | Pruebas unitarias/integración o QA manual firmado por criterio |
| DOD-03 | Cambio limitado al alcance; contratos y dependencias no se rompen | Diff revisado, migraciones compatibles o justificadas |
| DOD-04 | Lint, TypeScript, tests y build ejecutados y aprobados cuando el código exista | Comandos, salida o CI verde; 0 fallos no justificados |
| DOD-05 | Nuevas reglas financieras tienen tests deterministas y tolerancias explícitas | Fixtures con resultados esperados, precisión y redondeo documentados |
| DOD-06 | Cada métrica financiera muestra fuente, fecha, periodo, moneda, fórmula o limitación relevante | QA en pantalla y registros de base de datos |
| DOD-07 | Casos negativos y bordes cubiertos | Pruebas de datos faltantes, tickers ambiguos, divisiones por 0, fechas/FX ausentes |
| DOD-08 | Si afecta datos o autenticación: RLS, roles, secretos y logs validados | Prueba de acceso no autorizado y revisión de permisos |
| DOD-09 | Si afecta MCP: contrato, identidad, autorizaciones, idempotencia y aprobación humana verificados | Evidencias separadas en ChatGPT y Claude cuando proceda |
| DOD-10 | Interfaz usable en desktop/móvil, con estados vacío/error/cargando, teclado y etiquetas | Capturas/QA responsive y accesibilidad básica |
| DOD-11 | Documentación, decisiones y changelog actualizados según el impacto | Enlaces a README, arquitectura, ADR/decisión, guía operativa |
| DOD-12 | PR revisado, sin comentarios bloqueantes y con autorización de merge | Revisión y aprobación del PO |
| DOD-13 | Despliegue o migración (si corresponde) probado con respaldo/rollback y smoke test | Identificador de release, evidencias y aprobación explícita |
| DOD-14 | No quedan defectos críticos o altos conocidos sin resolución formal | Registro de hallazgos y validación PO |

**Documentación / Sprint 0:** DOD-04, 05, 08, 09, 10 y 13 son `N/A` por inexistencia de código/servicios; DOD-01, 02 (revisión documental), 03, 07 (consistencia), 11 y 12 (aprobación documental) siguen vigentes. Es obligatorio registrar explícitamente N/A y por qué, no marcar PASS ficticio.

## Bloqueos automáticos

- No hay fuente verificable para precio/rentabilidad presentada como definitiva.
- Una métrica usa distinta ventana/moneda silenciosamente o contiene un cálculo no reproducible.
- RLS expone datos a un usuario no autorizado o un secreto se publica en el navegador.
- La IA puede modificar datos aprobados sin revisión y trazabilidad.
- CI o QA crítico en rojo; o falta aprobación requerida para merge/despliegue.

## Evidencia mínima en PR

```text
BF-ID:
Criterios probados: AC1 [PASS/FAIL/N/A + evidencia], AC2 ..., AC3 ...
Calidad: lint / typecheck / tests / build [resultado real o N/A justificado]
Seguridad y datos: [RLS, origen, moneda, fecha, validaciones]
QA visual: [desktop/móvil + estado vacío/error, si aplica]
Impacto: [schema/entornos/servicios]; respaldo / rollback [si aplica]
Aprobación: [pendiente / aprobada + referencia]
```