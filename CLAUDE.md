# Contexto de Claude para Brújula Financiera IA

**Antes de cualquier trabajo, leer y aplicar [`AGENTS.md`](AGENTS.md).** Este archivo existe porque distintos clientes de IA reconocen convenciones de instrucciones diferentes.

Documentos obligatorios: `docs/PRODUCT_BACKLOG.md`, `docs/SCRUM_FRAMEWORK.md`, `docs/DEFINITION_OF_DONE.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`.

## Recordatorios esenciales

- Producto financiero personal, ETF, USD/PEN, datos trazables.
- Claude y ChatGPT interactúan desde sus propios chats mediante un MCP de privilegios limitados; **no** integrar API de Claude ni API de OpenAI dentro del MVP.
- Escrituras investigadas: proponer -> revisión humana -> aprobar -> versionar/auditar. Nunca asumir permiso para SQL arbitrario en producción.
- No iniciar despliegues, migraciones, merges o acciones externas sin autorización del Product Owner.
- Cada tarea debe referenciar una historia `BF-###` y satisfacer su aceptación y la DoD.