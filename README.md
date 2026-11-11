# Brújula Financiera IA

**Estado:** definición Scrum y preparación del MVP — todavía no hay aplicación desplegada.

Plataforma personal para investigar ETF, comparar alternativas, simular inversiones en USD/PEN y registrar decisiones con evidencia. ChatGPT y Claude realizan investigación desde sus chats y, tras configurar un MCP seguro, pueden consultar y proponer información para Supabase. La web Next.js/React en Vercel es el tablero y motor de cálculo; **no contiene un chat LLM integrado ni requiere OpenAI/Claude API en el MVP**.

## Alcance aprobado

- **ETF solamente:** catálogo piloto propuesto VWRA, FWRA, VOO, VUG y SPYG (validar identificación y cobertura).
- **Usuario único personal** con sesión privada; no se habilita registro público.
- **USD y PEN** con tipo de cambio histórico trazable.
- **Equilibrio:** investigación guiada, benchmarking y simulador.
- **Stack futuro:** Next.js + TypeScript + React, Supabase PostgreSQL/Auth/RLS, Vercel y GitHub.
- **Fuera de alcance:** compras en bróker, conexiones a XTB, ejecución financiera, predicciones garantizadas, recomendaciones automáticas, OpenAI API y Claude API dentro de la aplicación.

## Documentación inicial

| Documento | Propósito |
|---|---|
| [`docs/PRODUCT_BACKLOG.md`](docs/PRODUCT_BACKLOG.md) | 38 historias con aceptación y dependencias |
| [`docs/SCRUM_FRAMEWORK.md`](docs/SCRUM_FRAMEWORK.md) | Product Goal, eventos, roles, cadencia y reglas |
| [`docs/DEFINITION_OF_DONE.md`](docs/DEFINITION_OF_DONE.md) | Requisitos verificables para cerrar una historia |
| [`docs/SPRINT_ROADMAP.md`](docs/SPRINT_ROADMAP.md) | Orden tentativo de sprints basado en objetivos |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Arquitectura conceptual y riesgos técnicos |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Acuerdos cerrados y pendientes a validar |
| [`AGENTS.md`](AGENTS.md) | Instrucciones para agentes de desarrollo |
| [`CLAUDE.md`](CLAUDE.md) | Punto de entrada para agentes Claude |
| [`backlog/PRODUCT_BACKLOG.csv`](backlog/PRODUCT_BACKLOG.csv) | Exportación tabular de historias |
| [`backlog/issues/`](backlog/issues/) | 38 cuerpos de Issue listos para publicar |

## Sprint 0 — refinamiento BF-001 a BF-005 (rama de revisión)

- [Visión y criterios de éxito](docs/PRODUCT_VISION.md) — BF-001
- [Acuerdos Scrum y trazabilidad](docs/WORKING_AGREEMENT.md) — BF-002
- [Wireframes de seis módulos](docs/UX_WIREFRAMES.md) — BF-003
- [Contrato lógico financiero](docs/DATA_CONTRACT.md) — BF-004
- [Evaluación de proveedores](docs/PROVIDER_EVALUATION.md) — BF-005
- [Revisión y gates de S0](docs/SPRINT0_REVIEW.md)

Los documentos de Sprint 0 son **propuestas para revisión del Product Owner**; la prueba autenticada de cobertura de las APIs y sus derechos de uso permanece pendiente. El repositorio es público, pero los datos personales y de proveedores restringidos son privados.

## QA documental inicial

`python scripts/verify-backlog.py` valida consistencia de 38 historias, criterios, dependencias y documentos; `.github/workflows/docs-validation.yml` lo ejecutará en GitHub Actions al publicarse. Esto no certifica el QA de una aplicación todavía inexistente.

## Cómo arrancaremos

1. Revisar el Product Backlog, refinar prioridades y validar diseño funcional.
2. Repositorio **público** creado por el propietario en `AlexisCasas/brujula-financiera-ia`. Solo documentación y código publicables; datos personales y credenciales permanecen privados. Publicar archivos iniciales.
3. Publicar historias en GitHub Issues y revisar prioridades en abierto.
4. Antes de iniciar Sprint 1, fijar duración constante del Sprint (Scrum: un mes o menos) y compromiso de Sprint Goal.
5. Solo después configurar Supabase, desarrollar la web y desplegar en Vercel con QA y aprobación explícita.

## Reglas de confianza financiera

- No confundir ticker con ETF: identificar instrumentos por ISIN y listings por bolsa + símbolo + moneda.
- No presentar datos inventados, obsoletos o incompletos como hechos.
- Distinguir cierre, cierre ajustado y rentabilidad total; registrar fuentes, fechas y fórmulas.
- Diferenciar resultados históricos de escenarios futuros; los segundos no son predicciones.
- Los cambios propuestos por ChatGPT/Claude se revisan antes de escribir datos aprobados.
- No exponer credenciales de servicio ni permitir SQL libre mediante MCP en producción.

> Herramienta educativa y de investigación, no servicio de asesoría de inversiones ni sistema de ejecución de operaciones.