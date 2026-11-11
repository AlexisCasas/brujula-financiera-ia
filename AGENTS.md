# AGENTS.md — Brújula Financiera IA

Estas instrucciones son obligatorias para cualquier agente que trabaje en el repositorio. Leer antes de proponer o modificar código, infraestructura, datos o documentación.

## 1. Propósito y contrato de producto

Producto personal de investigación de **ETF** para inversor principiante. Módulos: Panel, Explorador, Comparador, Simulador, Investigaciones, Mis decisiones. Un usuario; monedas USD y PEN. La información debe tener procedencia, periodo, moneda y fecha.

**Arquitectura pactada:** Next.js + React + TypeScript (frontend y cálculos), Supabase PostgreSQL/Auth/RLS (persistencia), GitHub (control), Vercel (despliegue). ChatGPT y Claude conversan en sus clientes externos y utilizan MCP para leer y proponer actualizaciones. **NO añadir OpenAI API, Anthropic/Claude API ni chat LLM embebido al MVP** sin aprobación explícita del Product Owner. MCP no ejecuta inferencia del modelo en Vercel.

Leer: `docs/PRODUCT_BACKLOG.md`, `docs/SCRUM_FRAMEWORK.md`, `docs/DEFINITION_OF_DONE.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`.

## 2. Estado y autorizaciones

- Estado inicial: **solo documentación**, sin Supabase/Vercel creados ni producción modificada.
- No crear, migrar, desplegar ni publicar recursos externos de forma implícita. Seguir autorización del PO y documentar impacto, rollback y QA.
- No realizar merges o despliegues productivos si las pruebas están fallando o el PO no lo ha aprobado.
- Prohibido alterar servicios, proyectos, repos o cuentas no relacionados.

## 3. Flujo de trabajo Scrum + GitHub

1. Trabajar únicamente sobre una historia `BF-###` refinada y aceptada para un Sprint.
2. Definir alcance, dependencias y criterios antes de escribir código. No suponer requisitos faltantes de negocio.
3. Crear rama temática `feat/BF-###-slug`, `fix/BF-###-slug` o `docs/BF-###-slug` desde base actual; no trabajar directamente en `main` salvo bootstrap autorizado.
4. Cambios mínimos y enfocados; PR con ID, capturas cuando proceda, resultados de pruebas, riesgo, migraciones, rollback y evidencia de aceptación.
5. CI + revisión formal; merge solo tras decisión explícita del PO. Posteriormente smoke test documentado.
6. Mantener `docs/DECISIONS.md` actualizado ante decisiones de diseño; actualizar aceptación y documentación si cambia el comportamiento.

## 4. Finanzas: corrección antes que sofisticación

- Identificar un **fondo** por ISIN; representar sus listings por ticker + mercado + moneda. No mezclar distintas cotizaciones ni activos con ticker ambiguo.
- Registrar origen de cada cifra, URL/referencia, fecha efectiva, fecha de captura, zona horaria y licencia aplicable.
- Nunca crear precios o tipos de cambio faltantes, ni presentar campos desconocidos como cero.
- Segregar precio de cierre, precio ajustado, NAV y serie de rentabilidad total. No comparar periodos incompatibles.
- Backtest y simulador: funciones **deterministas**, probadas con casos de referencia y sin depender de la salida de un LLM.
- Para USD/PEN usar FX de fecha pertinente y distinguir rentabilidad del activo frente a efecto cambiario.
- Separar *datos verificados*, *propuestas/análisis de IA* y *decisiones personales*. IA no decide compras ni ejecuta órdenes.
- Cualquier análisis de rendimiento pasado incluye limitaciones; escenarios futuros son supuestos, no predicciones.

## 5. Seguridad, privacidad y MCP

- Usuario único con autenticación; RLS en toda tabla expuesta; claves secretas exclusivamente server-side.
- Jamás incluir service_role, tokens MCP o credenciales en código del cliente, archivos versionados, prompts o logs.
- El MCP financiero debe tener herramientas específicas (consultar ETF, listar snapshots, proponer investigación, revisar propuesta), validación de esquemas y privilegio mínimo. Evitar SQL arbitrario.
- Las propuestas de escritura de ChatGPT/Claude van a staging/cola de revisión, con autor, fuente, fecha y checksum/idempotencia; aplicación a datos aprobados solo tras revisión humana.
- Separar infraestructura de desarrollo y producción cuando exista; contar con rollback y respaldo antes de cambios destructivos.
- No automatizar scraping que infrinja condiciones de proveedores o restricciones de licencia. No inferir una noticia o cifra sin evidencia.

## 6. Calidad y verificación

- `docs/DEFINITION_OF_DONE.md` es el criterio de cierre de toda historia; criterios de aceptación específicos prevalecen para la función.
- Antes de PR: ejecutar scripts disponibles `lint`, `typecheck`, `test`, `build` (se configuran en BF-006), documentando comandos reales, versiones y resultado. Si aún no existen, no inventar que se ejecutaron.
- Testear caminos felices y negativos, estados sin datos, periodos no comparables, precisión numérica, RLS, permisos MCP y responsive/accesibilidad básica.
- Usar datos de prueba y fixtures; nunca usar operaciones reales ni claves personales en pruebas.
- Ante error: diagnosticar la causa, aplicar corrección acotada, repetir pruebas relevantes y registrar evidencia.

## 7. Convenciones documentales

- Archivos `.md` UTF-8, lenguaje de producto en español, código/identificadores en inglés consistente cuando se implemente.
- No renombrar IDs `BF-###`, romper enlaces ni editar criterios aceptados sin registro de decisión.
- No inventar rutas, endpoints, servicios, integración activa, versiones ni resultados de QA no verificados.
- Mantener `README.md` como guía de entrada. El backlog es la fuente de verdad de alcance, no una especificación ficticia de algo ya implementado.

## 8. Regla de salida de agente

Al cerrar una tarea: reportar archivos cambiados, BF-ID, pruebas realizadas y pruebas pendientes, riesgos, siguiente acción, y si afecta o no producción. Si un requisito es imposible con el conector disponible, informarlo sin afirmar ejecución.