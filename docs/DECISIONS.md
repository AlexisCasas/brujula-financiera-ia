# Registro de decisiones (ADR ligero) — MVP

| ID | Decisión / restricción | Estado | Evidencia de decisión |
|---|---|---|---|
| DEC-001 | Alcance inicial: solo ETF, no acciones individuales | Aprobada | Definición del propietario |
| DEC-002 | Usuario único personal; no onboarding público en MVP | Aprobada | Definición del propietario |
| DEC-003 | Dos monedas: USD/PEN, con FX histórico si la fecha lo requiere | Aprobada | Definición del propietario |
| DEC-004 | Equilibrio: investigación, benchmark y simulación | Aprobada | Definición del propietario |
| DEC-005 | Investigar en ChatGPT y Claude externos vía MCP; no usar APIs de modelos en la web MVP | Aprobada | Cambio de arquitectura indicado por propietario |
| DEC-006 | GitHub, Supabase, Next.js/React y Vercel como stack objetivo | Aprobada | Definición del propietario |
| DEC-007 | Adoptar Scrum con backlog, criterios de aceptación, DoD y sprints | Aprobada | Instrucción del propietario |
| DEC-008 | Definir aún sin fechas ni duración los sprints; fijar timebox antes de S1 | Propuesta de proceso | Requisito de Scrum y preferencia de planificación inicial |
| DEC-009 | Catálogo piloto de cinco ETF (VWRA, FWRA, VOO, VUG, SPYG) | Por validar | Propuesta preliminar de la solución |
| DEC-010 | Arquitectura de propuesta/aprobación humana para escritura MCP | Propuesta técnica | Minimizar riesgo de datos falsos y credenciales |
| DEC-011 | Elegir proveedor de datos históricos/FX solo después del discovery BF-005 | Pendiente | Cobertura, precio y licencias no verificados |
| DEC-012 | Repositorio GitHub público `AlexisCasas/brujula-financiera-ia` | Aprobado 2026-11-11 | Solo código y documentación publicables; datos personales y secretos fuera de GitHub |
| DEC-013 | Sprint timebox constante (propuesto 1 o 2 semanas) | Pendiente | Se decide en Sprint Planning previo a S1 |
| DEC-014 | Nombre del repositorio: `brujula-financiera-ia` | Propuesta técnica | Slug identificable y sin datos personales |
| DEC-015 | Un único proyecto Supabase (`Brujula AI Finance`, `ncalhbwyuwxopokgfcty`) sin entorno dev/prod separado por ahora | Aprobada 2026-11-12 | Instrucción del PO; se aparta de la recomendación de AGENTS.md §5, por lo que la base queda cerrada por defecto y se exige respaldo antes de cambios destructivos |
| DEC-016 | Diferir BF-007 (autenticación) y entrar directo a la app; BF-009 y BF-008 se adelantan | Aprobada 2026-11-12 | Instrucción del PO; sin datos privados mientras no haya identidad. Retomar BF-007 antes de cargar datos personales |
| DEC-017 | Modelo de propietario único (`app_owner` + `private.is_owner()`) y RLS cerrada por defecto | Propuesta técnica | Defensa en profundidad si el registro público se habilitara por error; pendiente de validación del PO |
| DEC-018 | Acceso por correo y contraseña con Supabase Auth, sin registro público | Propuesta técnica | Menor fricción para un usuario único y sin depender de correo transaccional; pendiente de validación del PO |

**Regla:** no convertir una propuesta técnica en decisión aprobada sin confirmación explícita del PO. Toda modificación añade fecha, motivo e impacto en historias/arquitectura.