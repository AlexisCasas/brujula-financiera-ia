# BF-002 · Gobierno Scrum, trazabilidad y protocolo de aceptación

**Estado:** listo para revisión del PO · **Fecha:** 2026-11-11  
**Historia:** [BF-002](https://github.com/AlexisCasas/brujula-financiera-ia/issues/2)

## Acuerdos de trabajo

1. **Fuente de verdad de producto:** \`docs/PRODUCT_BACKLOG.md\` + GitHub Issues \`BF-###\`; CSV y JSON son índices auxiliares sincronizados.
2. **Estado:** \`Product Backlog → Ready → Sprint Backlog → In Progress → In Review/QA → Done\`. Sin iniciar sprint formal no se afirma progreso burndown ni velocidad.
3. **S0 = preparación/documentación**, no sprint con duración indefinida. Para S1–S6, definir en Sprint Planning duración fija (máximo un mes), Sprint Goal y capacidad real; los SP no equivalen a días.
4. **DoR** de \`docs/SCRUM_FRAMEWORK.md\`: alcance, valor, AC verificables, dependencias, riesgos, seguridad/licencia y PO prioriza.
5. **DoD** de \`docs/DEFINITION_OF_DONE.md\`: todos los AC + QA adecuado + revisión y aprobación de PO; los N/A por falta de código deben justificarse.
6. **Ramas:** \`docs/BF-###-...\`, \`feat/BF-###-...\`, \`fix/BF-###-...\`; no editar directamente \`main\` salvo bootstrap explícitamente autorizado.
7. **PR:** cita todos los BF-IDs, evidencia por criterio, riesgos, impactados, QA real, CI y rollback cuando corresponda; no se fusiona solo por abrir PR.
8. **Aprobación:** Product Owner revisa documentos/demos y autoriza merge por separado. No cerrar Issues ni marcar Done sin revisión.
9. **Cambios de alcance:** registrar nuevo criterio en Issue y \`docs/DECISIONS.md\` (justificación, efecto sobre dependencia/SP/sprint); no editar silenciosamente AC ya aprobados.
10. **Despliegue:** separado del merge; requiere autorización, backup, rollback y smoke test cuando exista producto. Configurar Supabase/Vercel no forma parte de S0.
11. **Privacidad:** repo público; nunca publicar secretos, claves, datos de cuenta, historial personal de inversiones ni datasets que prohíban redistribución.

## Responsabilidades prácticas

- **PO (propietario):** define valor y presupuesto, decide prioridades, valida diseño y acepta o rechaza cada historia.
- **Developers/Agentes:** producen documentos/código, pruebas y demostraciones; no pueden atribuirse aprobación del PO.
- **Facilitación Scrum:** agenda refinamiento, review, retrospectiva y elimina impedimentos sin fingir ceremonias hechas.

## Trazabilidad mínima obligatoria

\`\`\`text
BF-ID → criterio ACn → documento / cambio → prueba / evidencia → PR/CI → revisión PO → Done
\`\`\`

| Registro | Identificador | Dónde se conserva |
|---|---|---|
| Alcance/valor | BF-ID | Issue + Product Backlog |
| Especificación | ruta en \`docs/\` | PR y archivo |
| Decisión o tradeoff | DEC-### | \`docs/DECISIONS.md\` |
| QA por AC | PASS / FAIL / PARTIAL / N/A | PR y \`docs/SPRINT0_REVIEW.md\` |
| Autoriza merge | usuario/fecha/enlace | PR o comentario de PO |
| Resultado desplegado | commit/release | reporte de QA post-release futuro |

**Regla:** no cerrar BF-005 si solo existe investigación de proveedores sin prueba real de cada ETF, y no cerrar BF-003 antes del QA visual del PO.

## Definition of Ready para S1

- BF-001 contrato producto aprobado por el PO.
- BF-003 wireframes aprobados (o prototipado incluido explícitamente en S1).
- BF-004 diccionario y políticas de finanzas aprobadas.
- BF-005 cobertura de API y licencia: gate para BF-011/013; si aún está bloqueado, dividir trabajo de arquitectura/datos ficticios de ingestión real.
- S1 duración y objetivo fijados; no estimar fechas por SP sin velocidad histórica.

## Revisión S0

Ver \`docs/SPRINT0_REVIEW.md\` para estado por AC, limitaciones y decisiones del PO. El PR de este paquete **no** debe auto-cerrar Issues al fusionarse: BF-005 quedará abierto hasta pruebas autenticadas.