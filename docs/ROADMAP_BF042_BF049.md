# Roadmap BF-042 a BF-049 — Ruta del inversor principiante

**Estado:** plan aprobado para desarrollo  
**Base:** main (BF-039 + BF-041a + BF-040 integrados)  
**Siguiente etapa posterior:** BF-017a — Contrato MCP

## Objetivo

Cerrar el principal vacío funcional del MVP: que un principiante pueda pasar de conocer su perfil a comprender sus objetivos, aprender los conceptos esenciales, explorar instrumentos, comparar alternativas, simular escenarios y registrar una primera decisión razonada.

La IA/MCP no es el primer objetivo de esta etapa. Primero se construye el contexto financiero estructurado que posteriormente hará útil y seguro al MCP.

## Principios

1. Educación antes que recomendación.
2. Separar perfil, objetivo, datos e interpretación.
3. No presentar rentabilidades futuras como garantías.
4. Mostrar incertidumbre, costos, volatilidad y pérdidas potenciales.
5. Toda información financiera relevante debe conservar fuente/fecha cuando corresponda.
6. El usuario debe poder entender por qué una alternativa encaja o no encaja con sus criterios.
7. No ejecutar compras, ventas ni operaciones financieras.
8. Diseñar primero para un usuario principiante, con profundidad progresiva.
9. Mantener privacidad y RLS para datos personales.
10. Evitar que el perfil produzca recomendaciones automáticas.

## Incrementos

### BF-042 — Objetivo de inversión
Capturar:
- objetivo principal;
- horizonte temporal;
- monto inicial;
- aporte periódico;
- moneda;
- prioridad del objetivo;
- posibilidad de marcar datos como no definidos.

Resultado: el perfil deja de responder solamente “qué tipo de inversor soy” y empieza a responder “para qué estoy invirtiendo”.

**Dependencias:** BF-039.  
**Criterio de cierre:** datos persistidos de forma privada, editables y versionables sin romper el perfil existente.

### BF-043 — Explicación del perfil
Transformar el resultado del cuestionario en una explicación educativa:
- qué significa el perfil;
- qué nivel de volatilidad debe comprender;
- qué pérdidas temporales podría enfrentar;
- qué horizonte suele ser coherente;
- qué NO significa el perfil;
- diferencia entre perfil y recomendación.

**Dependencias:** BF-039, BF-042.  
**Criterio de cierre:** explicación trazable al resultado guardado, sin recomendaciones automáticas de instrumentos.

### BF-044 — Academia financiera básica
Microlecciones contextuales:
- invertir vs ahorrar;
- acción;
- ETF;
- índice;
- diversificación;
- riesgo;
- volatilidad;
- rentabilidad;
- comisión/TER;
- dividendos;
- acumulación/distribución;
- moneda y FX;
- drawdown.

Diseño progresivo: explicación breve + profundización opcional + ejemplo.

**Dependencias:** BF-039/BF-040 y catálogo existente.  
**Criterio de cierre:** contenido accesible desde el contexto donde el concepto aparece, sin convertirse en un curso pesado.

### BF-045 — Explorador educativo
Evolucionar el catálogo para que el principiante pueda buscar por intención:
- diversificación global;
- mercado peruano;
- crecimiento;
- dividendos;
- moneda;
- complejidad;
- riesgo;
- tipo de instrumento.

Mostrar por qué un instrumento aparece en el resultado y distinguir filtros de recomendaciones.

**Dependencias:** BF-040, BF-044.  
**Criterio de cierre:** filtros reproducibles, explicables y sin lenguaje de recomendación personalizada.

### BF-046 — Comparador educativo
Comparación ETF/equity con:
- qué compra;
- exposición;
- diversificación;
- costos;
- moneda;
- riesgo;
- volatilidad;
- comportamiento histórico disponible;
- diferencias relevantes para principiantes;
- limitaciones de los datos.

**Dependencias:** BF-044, BF-045 y datos disponibles.  
**Criterio de cierre:** comparación homogénea y con fuentes/fechas cuando corresponda.

### BF-047 — Simulador de escenarios
Permitir:
- capital inicial;
- aportes;
- horizonte;
- moneda;
- supuestos explícitos;
- escenarios pesimista, central y optimista;
- capital aportado;
- valor final ilustrativo;
- costos;
- sensibilidad;
- posibles caídas.

Nunca presentar un escenario como predicción garantizada.

**Dependencias:** BF-042, BF-046; posteriormente se beneficiará de históricos/FX.  
**Criterio de cierre:** fórmulas reproducibles, supuestos visibles y advertencias claras.

### BF-048 — Primera decisión de inversión
Crear un registro estructurado:
- instrumento considerado;
- objetivo;
- horizonte;
- importe;
- motivo;
- tesis;
- riesgos comprendidos;
- alternativas consideradas;
- dudas pendientes;
- fecha;
- estado de la decisión.

Debe distinguir “considero” de “compré/invertí”. No ejecuta operaciones.

**Dependencias:** BF-042 a BF-047.  
**Criterio de cierre:** decisión auditable y privada, vinculable a instrumentos y perfil.

### BF-049 — Datos históricos y riesgo
Añadir una capa de análisis histórico:
- rentabilidad por periodos comparables;
- volatilidad;
- drawdown;
- recuperación;
- aportes periódicos cuando corresponda;
- FX USD/PEN cuando aplique;
- fecha/fuente de cada serie;
- cobertura y calidad de datos.

**Dependencias:** BF-046/BF-047.  
**Criterio de cierre:** métricas reproducibles, sin mezclar periodos o monedas de forma engañosa.

## Orden de implementación

1. BF-042 Objetivo
2. BF-043 Explicación del perfil
3. BF-044 Academia básica
4. BF-045 Explorador educativo
5. BF-046 Comparador
6. BF-047 Simulador
7. BF-049 Históricos/riesgo
8. BF-048 Primera decisión

BF-049 se adelanta respecto de su numeración porque aporta datos necesarios para que el simulador y el comparador sean financieramente sólidos. BF-048 se cierra después para registrar decisiones con contexto completo.

## QA transversal

Cada incremento debe incluir:
- pruebas unitarias;
- pruebas de integración;
- pruebas SQL/RLS cuando corresponda;
- validación de fuentes;
- revisión de UX para principiante;
- manejo explícito de datos faltantes;
- estados vacíos y errores;
- no regresión de BF-039/BF-040/BF-041a;
- Preview Vercel antes de merge.

## Resultado esperado de la etapa

Al terminar BF-049, un principiante debería poder:

1. conocer su perfil;
2. definir para qué invierte;
3. entender los conceptos esenciales;
4. explorar instrumentos;
5. comparar alternativas;
6. observar escenarios ilustrativos;
7. entender riesgo histórico;
8. registrar una decisión razonada.

## Puerta hacia BF-017a

BF-017a queda deliberadamente bloqueado hasta cerrar esta etapa.

Cuando BF-042–BF-049 estén integrados, el MCP tendrá un dominio estructurado que podrá consultar de forma segura:

**perfil → objetivos → instrumentos → métricas → fuentes → simulaciones → decisiones → seguimiento**

El MCP será entonces una capa de interacción sobre un producto financiero educativo ya funcional, no un sustituto de las funcionalidades base.
