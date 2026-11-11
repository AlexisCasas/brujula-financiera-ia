# Preparación S0 · Informe de revisión y criterios de salida

**Fecha:** 2026-11-11 · **Estado global:** documentación presentada para revisión, **no Done**.  
**Rama:** \`docs/BF-001-005-sprint0-discovery\` · **Base:** \`main\`  
**Alcance:** [BF-001](../backlog/issues/BF-001.md) a [BF-005](../backlog/issues/BF-005.md). Sin migraciones, APIs de IA ni despliegue.

## Entregables vinculados

| Historia | Entregable principal | Evidencia / resultado |
|---|---|---|
| BF-001 | [Visión y alcance](PRODUCT_VISION.md) | Audiencia, Product Goal, fuera de alcance, G-01 a G-09 y riesgos |
| BF-002 | [Gobierno Scrum](WORKING_AGREEMENT.md) | DoR, DoD, flujo GitHub, proceso de cambios y PR |
| BF-003 | [Wireframes](UX_WIREFRAMES.md) | Seis pantallas, flujo, matriz de estados y móvil |
| BF-004 | [Contrato de datos](DATA_CONTRACT.md) | ISIN/listing, fuentes, series/FX, nulos, revisión IA y pruebas negativas |
| BF-005 | [Evaluación proveedores](PROVIDER_EVALUATION.md) | Cinco identidades oficiales, EODHD/Twelve y matriz de pruebas pendiente |

## Aceptación por criterio

| ID | AC1 | AC2 | AC3 | Estado global |
|---|---|---|---|---|
| BF-001 | DOCUMENTADO | DOCUMENTADO | DOCUMENTADO | **En revisión PO** |
| BF-002 | DOCUMENTADO | DOCUMENTADO | ESTÁNDAR ESTABLECIDO, por verificar en PR futuro | **En revisión PO** |
| BF-003 | DOCUMENTADO | DOCUMENTADO | **PENDIENTE validación visual PO** | **En revisión PO** |
| BF-004 | DOCUMENTADO | DOCUMENTADO | DOCUMENTADO | **En revisión PO** |
| BF-005 | **PARCIAL: identidad sí, APIs no** | **PARCIAL: límites generales, derechos exactos no** | PROPUESTA, plan B documentado | **Bloqueado para cierre** |

**Significado:** «DOCUMENTADO» no equivale a Done ni a QA funcional; requiere aprobación del PO. «PARCIAL» es criterio incompleto; no se maquilla como PASS.

## QA que sí corresponde en S0

| Control | Evidencia esperada | Estado |
|---|---|---|
| Integridad de enlaces en la rama | Archivos y enlaces relativos presentes | Pendiente revisión de diff/PR |
| Cobertura documental AC | Contenido trazado en cada documento | Preparado |
| Criterios negativos financieros | Nulos, divisas, ISIN/listing, div/ajustes, licencias | Preparado como casos para desarrollo futuro |
| Seguridad documental | Sin credenciales ni datasets propietarios en docs | Revisión necesaria antes de merge |
| GitHub Actions | \`scripts/verify-backlog.py\` | Estado remoto aún por verificar |
| Lint, typecheck, unit tests, build Next.js | No hay código de aplicación | **N/A** |
| RLS/MCP funcional | No hay proyecto Supabase/MCP configurado | **N/A** |
| QA responsive real | Wireframes estáticos, no UI implementada | **N/A** |
| Backups/rollback de producción | Sin infraestructura creada | **N/A** |

## Gate BF-005 que falta para el siguiente desarrollo con datos reales

- [ ] Obtener un plan o trial de **EODHD** que permita buscar los cinco tickers y solicitar histórico por ISIN/listing.
- [ ] Obtener acceso o trial de **Twelve Data** y repetir idéntica prueba de cinco instrumentos.
- [ ] Registrar HTTP status, identidad, moneda, primer/último dato, intervalo, dividendos/ajustes y límite de cuota por cada prueba **sin subir datos sensibles**.
- [ ] Validar derecho de **uso personal, almacenamiento/caché y visualización privada** con el proveedor seleccionado.
- [ ] Registrar respuesta oficial si se piensa permitir que otras personas utilicen la app (uso multiusuario/redistribución).
- [ ] PO aprueba proveedor, costo máximo y contingencia.

Sin estas evidencias se puede construir estructura de app con fixtures y diagramas, pero **no** ingestión histórica real para backtesting de los cinco ETF.

## Checklist del Product Owner para esta review

- [ ] Aprobar Product Goal y exclusiones BF-001.
- [ ] Aprobar convenios GitHub/Scrum y si desean releases solamente tras aprobación explícita.
- [ ] Validar recorrido de seis pantallas, móvil y los cinco estados BF-003.
- [ ] Aprobar el contrato lógico BF-004 y decidir cómo tratar nulos/FX en el simulador.
- [ ] Autorizar prueba gratuita/plan EODHD y Twelve Data y un presupuesto máximo; BF-005 queda abierto hasta prueba.
- [ ] Fijar timebox constante y Sprint Goal al preparar Sprint 1.

## Riesgos y siguientes decisiones

- **Licencias:** publicar repositorio ≠ autorizar acceso de terceros a cotizaciones. Mantener datos y credenciales fuera del repo.
- **Datos:** las fichas oficiales identifican los ETF, pero no prueban cobertura histórica en proveedores.
- **Acumulación vs distribución:** retorno total no se infiere del precio sin ajustar.
- **No hay recomendación de inversión automática** ni chat de modelos embebido.

## Definition of Done aplicada a esta etapa

DOD-01/02/03/07/11: documentación y trazabilidad preparadas, **aceptación aún pendiente**.  
DOD-04/05/08/09/10/13: **N/A para ejecución funcional**, porque no existe aplicación, migración ni MCP.  
DOD-12: revisión del PR y autorización **pendientes**.  
DOD-14: bloqueante BF-005 registrado y sin ocultarlo.

**Resultado esperado de la revisión:** aceptar documentos BF-001/002/004, ajustar/aprobar BF-003 y decidir siguiente experimento de BF-005; no cerrar ninguna historia sin decisión explícita.