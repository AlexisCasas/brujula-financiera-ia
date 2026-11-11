# BF-003 · Wireframes y experiencia de usuario — versión de revisión

**Estado:** diseño funcional/visual **aprobado por Product Owner el 2026-11-11** · **Alcance:** escritorio y móvil, sin programación.  
**Historia:** [BF-003](https://github.com/AlexisCasas/brujula-financiera-ia/issues/3)

## 1. Arquitectura de información

Navegación primaria (6 destinos): **Panel**, **Explorar ETF**, **Comparador**, **Simulador**, **Investigaciones**, **Mis decisiones**. Elementos secundarios: favoritos, configuración (moneda preferida, fuentes y privacidad), ayuda/glosario.

Flujo principal: **Panel → Explorar → Ficha ETF → Comparador → Simulador → Investigaciones (ChatGPT/Claude externo) → Decisiones**. Desde cualquier ficha puede agregarse el ETF al comparador o a favoritos.

### Principios de contenido

- Español claro; explicación breve al lado de terminología (TER, volatilidad, drawdown, tracking).
- Datos numéricos solo cuando exista fuente licenciada y fecha; ninguna cifra ficticia en producción.
- Nunca «compra recomendada»; usar «ventajas», «limitaciones», «riesgos» y «qué deberías verificar».
- Distinguir tres marcadores en toda ficha: **verificado**, **pendiente de revisión**, **dato no disponible**.
- USD/PEN es un **selector de visualización**; el precio original de cada listing y el tipo de cambio deben permanecer visibles.
- No tratar el navegador como chat GPT; «Investigar con IA» abre/copia contexto estructurado para ChatGPT o Claude conectados al MCP cuando esté habilitado.

## 2. Wireframe A — Panel

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Brújula IA      Panel | Explorar | Comparar | Simular | Investigar | Decidir│
├─────────────────────────────────────────────────────────────────────────────┤
│ Bienvenido                      [USD ▼] [PEN equivalentes] [Última revisión]│
│ [ETF observados: 5] [Investigaciones] [Decisiones abiertas] [Fuentes vencidas]│
│                                                                             │
│ Continuar tu investigación                   Estado de calidad de datos     │
│ ┌─────────────────────────────────────────┐ ┌───────────────────────────┐ │
│ │ VWRA  ·  por validar proveedor          │ │ 2 datos requieren fuente │ │
│ │ FWRA  ·  fuente oficial disponible      │ │ 0 cambios auto-aprobados │ │
│ │ [Ir al comparador] [Explorar ETF]       │ │ [Revisar propuestas]      │ │
│ └─────────────────────────────────────────┘ └───────────────────────────┘ │
│ Actividad reciente [fecha | asunto | estado | abrir]                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Acciones:** buscar, continuar comparación, revisar fuentes y abrir una decisión. **Prohibido:** mostrar portafolio real o rentabilidad personal si no existe registro explícito.

## 3. Wireframe B — Explorar ETF / ficha

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Explorar ETF       [Buscar por ticker, nombre o ISIN .................. 🔎 ] │
│ Filtros: [Región] [Domicilio] [Distribución/Acumulación] [Estado datos]    │
│ Resultados: VWRA | FWRA | VOO | VUG | SPYG                                 │
│ [VWRA] Vanguard ...   ISIN IE00BK5BQT80  ▼ Elegir listing                 │
│         LSE · USD · VWRA     |   LSE · GBP · VWRP    (mismo fondo)           │
│                                                                             │
│ FICHA: VWRA / London Stock Exchange / USD                                   │
│ [Costos] [Índice] [Riesgo] [Distribución] [Fecha y fuente]                 │
│ [Ver histórico] [Agregar a comparación] [Investigar con IA] [Favorito]     │
│ Fuentes: [Emisor]  Datos faltantes: [campo + motivo]                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Regla crítica:** si ticker coincidente en varias bolsas, exigir selección explícita de bolsa y moneda antes de graficar o simular.

## 4. Wireframe C — Comparador

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Comparador                 [USD / PEN] [Fecha inicial] → [Fecha final]     │
│ [VWRA · LSE USD ×] [FWRA · LSE USD ×] [+ Añadir ETF (máx. 5)]             │
│                                                                             │
│ Métrica                      VWRA                  FWRA                     │
│ Fondo/ISIN                 [verificado]          [verificado]              │
│ Índice                     [fuente]              [fuente]                  │
│ Costo de gestión           [cifra o N/D]         [cifra o N/D]             │
│ Rendimiento histórico      [serie y periodo]     [serie y periodo]         │
│ Caída máxima               [calc + nota]         [calc + nota]             │
│ Liquidez                   [fuente o N/D]        [fuente o N/D]             │
│                                                                             │
│ [Ver evidencias] [Guardar comparación] [Llevar al simulador]               │
│ Advertencia: «No comparable» si falta serie homogénea.                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Regla:** no pintar líder/ganador con datos incompletos. Si fechas disponibles difieren, usar intersección explícita o marcar «no comparable».

## 5. Wireframe D — Simulador

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Simulador [Histórico ▼ | Escenarios hipotéticos]                           │
│ ETF/listing [VWRA LSE USD ▼]   Moneda salida [USD ▼] [PEN]                 │
│ Inversión inicial [500.00]   Aporte mensual [0]  Periodo [5 años]         │
│ Fecha inicio [       ] Fecha fin [       ] Comisiones [definir]            │
│ [Calcular]                                                                  │
│                                                                             │
│ Capital aportado [ ]   Valor final [ ]   Resultado +/- [ ]                 │
│ ┌─────────────────────────────────────────────────────────────────────────┐│
│ │ [Gráfico temporal con pérdida y rango de fechas de cada serie]         ││
│ └─────────────────────────────────────────────────────────────────────────┘│
│ Fuentes: precios / dividendos / FX; método usado; datos ausentes; límites  │
│ [Guardar escenario] [Comparar 2 alternativas]                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Regla:** selector de modo visible; histórico no equivale a pronóstico; escenarios muestran supuestos editables y resultados de pérdidas, no probabilidades inventadas.

## 6. Wireframe E — Investigaciones / propuestas IA

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Investigaciones           [Todas] [GPT] [Claude] [Pendientes de aprobar]    │
│ [Nueva investigación] → instrucciones para abrir chat externo con contexto │
│                                                                             │
│ Investigación #...  ETF VWRA / FWRA / Fecha / Fuente GPT o Claude          │
│ Pregunta: ¿Qué diferencias de costos, liquidez y riesgos presentan?        │
│ Hallazgos [explicación + URL + fecha]    Estado: propuesta                 │
│ [Ver fuentes] [Abrir propuesta] [Guardar nota personal]                    │
│                                                                             │
│ Cola de revisión: campo/cambio propuesto → evidencia → [Aceptar] [Rechazar]│
│ Ninguna propuesta se activa sin autorización explícita.                    │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Regla:** no simular que existe un chat en Vercel. «Nueva investigación» proporciona contexto exportable y conexión externa futura; si MCP no está configurado, mostrar **pendiente de integración**.

## 7. Wireframe F — Mis decisiones

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ Mis decisiones        [+ Registrar tesis] [Abiertas ▼] [Revisar por fecha]│
│                                                                             │
│ [Fecha] VWRA · Considerar / Observar / Descartar / Revisar                 │
│ Alternativas contrastadas: FWRA, VOO                                       │
│ Motivos: [campo libre]       Riesgos: [campo libre]                        │
│ Evidencias: [enlaces y versiones guardadas]                                │
│ Supuestos que invalidarían la tesis: [campo]                               │
│ [Editar borrador] [Marcar revisada] [Ver comparación origen]                │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Regla:** la decisión es propiedad del usuario, no de una respuesta de IA; mantener historial y fecha de revisión.

## 8. Estados y móvil: matriz de aceptación

| Pantalla | Vacío | Cargando | Error | Datos incompletos | Móvil |
|---|---|---|---|---|---|
| Panel | invitación a explorar | skeleton sin cifras inventadas | reintentar y estado fuente | tarjeta de pendientes | tarjetas apiladas |
| Explorar | sugerir 5 ETF piloto | skeleton lista/ficha | búsqueda reintentable | etiqueta N/D por campo | tarjetas con listing expandible |
| Comparador | sugerir 2 ETF | encabezados estables | recuperar selección previa | columna con N/D; sin ganador | tabla con scroll horizontal etiquetado o tarjetas por métrica |
| Simulador | formulario con ejemplo editable | botón deshabilitado + indicador | error de serie/FX específico | no calcular retorno engañoso | formulario vertical, gráfico adaptado |
| Investigaciones | CTA investigar vía chat externo | cola con indicadores | fallo MCP y ruta de recuperación | propuesta no aprobable sin evidencia | acordeones con fuente accesible |
| Decisiones | CTA crear tesis | skeleton de historial | recuperar borrador | permite nota con «sin evidencia» y advertencia | tarjetas cronológicas |

**Accesibilidad:** navegación por teclado, foco visible, nombres de botones expresivos, contraste revisable, lectura de tablas con encabezados, no depender solo del color.

## 9. Recorrido de QA manual BF-003 (sin backend)

1. Desde Panel entrar a Explorar, buscar VWRA y seleccionar **LSE/USD**.
2. Añadir FWRA a Comparador, identificar dos ISIN y escoger ventana homogénea.
3. Abrir Simulador y distinguir claramente histórico/hipótesis, USD/PEN y supuesto de tipo de cambio.
4. Desde la comparación iniciar investigación: indicar que conversación sucede en ChatGPT/Claude externo.
5. Revisar una propuesta IA sin aplicarla automáticamente y guardar tesis personal.
6. Repetir con pantalla estrecha; comprobar cinco estados de cada módulo en la matriz.

**BF-003 AC3 — APROBADO:** el Product Owner confirmó en conversación el 2026-11-11 la aprobación del prototipo navegable de seis pantallas, sin cambios solicitados. La aprobación cubre el flujo y la propuesta visual, **no** el funcionamiento de la futura aplicación en Next.js. Quedan pendientes la revisión/merge del PR y la posterior implementación y QA responsive real.