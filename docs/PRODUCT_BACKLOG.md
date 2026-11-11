# Product Backlog — Brújula Financiera IA

**Versión:** 1.0 · **Fecha:** 2026-11-11 · **Estado:** propuesta lista para refinamiento del Product Owner

> Orden, story points y sprint propuesto son hipótesis iniciales, no compromisos de fecha. El PO puede repriorizar en cada refinamiento.

## Product Goal

Permitir a un inversor principiante investigar 5 ETF, comparar atributos verificables, simular inversiones históricas y futuras en USD/PEN, y documentar decisiones trazables desde una plataforma privada; ChatGPT y Claude interactúan desde sus chats externos mediante un MCP controlado.

## Condiciones de MVP / exclusiones

- Usuario personal único, autenticado; no compras reales ni asesoría de inversión automática.
- Sin API de modelos en la aplicación; ChatGPT y Claude se usan por separado, vinculados mediante MCP.
- No se confunde precio con rentabilidad total; toda métrica incluye fórmula, periodo, fuente y limitaciones.
- El catálogo inicial son VWRA, FWRA, VOO, VUG y SPYG, sujetos a verificación por listing/ISIN.
- Propuestas de IA requieren revisión antes de pasar a datos aprobados.

## Resumen de épicas

| Épica | Descripción | Historias | SP preliminares |
|---|---|---:|---:|
| E0 | Producto y gobierno | 5 | 19 |
| E1 | Plataforma y seguridad | 4 | 21 |
| E2 | Catálogo y calidad de datos | 7 | 32 |
| E3 | Investigación externa y MCP | 6 | 32 |
| E4 | Benchmark comparativo | 5 | 26 |
| E5 | Simulación financiera | 6 | 31 |
| E6 | Decisiones, QA y lanzamiento | 5 | 26 |

**Puntos totales preliminares:** 187 SP. No representan horas ni duración comprometida.

## Inventario priorizado

| ID | Historia | Prioridad | SP | Sprint propuesto | Dependencias |
|---|---|---|---:|---|---|
| [BF-001](../backlog/issues/BF-001.md) | Definir visión, audiencia y límites del MVP | P0 | 3 | S0 | — |
| [BF-002](../backlog/issues/BF-002.md) | Instalar gobierno Scrum y trazabilidad | P0 | 3 | S0 | BF-001 |
| [BF-003](../backlog/issues/BF-003.md) | Diseñar navegación y wireframes del MVP | P0 | 5 | S0 | BF-001 |
| [BF-004](../backlog/issues/BF-004.md) | Definir contrato de datos y fuentes financieras | P0 | 5 | S0 | BF-001 |
| [BF-005](../backlog/issues/BF-005.md) | Evaluar cobertura y restricciones de proveedores | P0 | 3 | S0 | BF-004 |
| [BF-006](../backlog/issues/BF-006.md) | Inicializar aplicación, tipado y pipeline QA | P0 | 5 | S1 | BF-002 |
| [BF-007](../backlog/issues/BF-007.md) | Autenticación privada de usuario único | P0 | 5 | S1 | BF-006 |
| [BF-008](../backlog/issues/BF-008.md) | Políticas RLS, secretos y aislamientos | P0 | 8 | S1 | BF-007 |
| [BF-009](../backlog/issues/BF-009.md) | Shell responsive y navegación accesible | P1 | 3 | S1 | BF-003, BF-006 |
| [BF-010](../backlog/issues/BF-010.md) | Modelo de instrumentos y cotizaciones | P0 | 5 | S1 | BF-004, BF-008 |
| [BF-011](../backlog/issues/BF-011.md) | Carga piloto de cinco ETF con evidencia | P0 | 3 | S2 | BF-005, BF-010 |
| [BF-012](../backlog/issues/BF-012.md) | Persistir propiedades y snapshots de ETF | P0 | 5 | S2 | BF-011 |
| [BF-013](../backlog/issues/BF-013.md) | Importar precios históricos con control de calidad | P0 | 8 | S2 | BF-005, BF-010 |
| [BF-014](../backlog/issues/BF-014.md) | Almacenar FX USD/PEN por fecha | P0 | 5 | S2 | BF-004 |
| [BF-015](../backlog/issues/BF-015.md) | Noticias y documentos con citación | P1 | 3 | S2 | BF-011 |
| [BF-016](../backlog/issues/BF-016.md) | Vigencia y fallas de información | P0 | 3 | S2 | BF-012, BF-013, BF-014 |
| [BF-017](../backlog/issues/BF-017.md) | Diseñar contrato MCP con mínimo privilegio | P0 | 5 | S3 | BF-008, BF-010 |
| [BF-018](../backlog/issues/BF-018.md) | Consulta MCP desde ChatGPT | P0 | 8 | S3 | BF-017 |
| [BF-019](../backlog/issues/BF-019.md) | Proponer y aprobar cambios investigados por MCP | P0 | 8 | S3 | BF-017, BF-012 |
| [BF-020](../backlog/issues/BF-020.md) | Compatibilidad MCP con Claude | P0 | 5 | S3 | BF-018, BF-019 |
| [BF-021](../backlog/issues/BF-021.md) | Trazabilidad de análisis y cambios | P1 | 3 | S3 | BF-019 |
| [BF-022](../backlog/issues/BF-022.md) | Puente contextual entre web y conversaciones externas | P1 | 3 | S3 | BF-018, BF-020 |
| [BF-023](../backlog/issues/BF-023.md) | Seleccionar hasta cinco ETF y persistir comparaciones | P0 | 5 | S4 | BF-010, BF-012 |
| [BF-024](../backlog/issues/BF-024.md) | Matriz objetiva con periodos homogéneos | P0 | 8 | S4 | BF-023, BF-013, BF-014 |
| [BF-025](../backlog/issues/BF-025.md) | Exposición regional y solapamiento con cautelas | P1 | 5 | S4 | BF-012, BF-023 |
| [BF-026](../backlog/issues/BF-026.md) | Costos de tenencia y ejecución | P1 | 5 | S4 | BF-023 |
| [BF-027](../backlog/issues/BF-027.md) | Resumen comparativo explicable, no recomendación automática | P1 | 3 | S4 | BF-024, BF-025, BF-026 |
| [BF-028](../backlog/issues/BF-028.md) | Backtest de inversión única | P0 | 8 | S5 | BF-013, BF-014 |
| [BF-029](../backlog/issues/BF-029.md) | Aportes periódicos y capital aportado | P0 | 5 | S5 | BF-028 |
| [BF-030](../backlog/issues/BF-030.md) | Escenarios futuros por supuestos explícitos | P0 | 5 | S5 | BF-029 |
| [BF-031](../backlog/issues/BF-031.md) | Conversión USD/PEN y costes en simulaciones | P0 | 5 | S5 | BF-014, BF-028 |
| [BF-032](../backlog/issues/BF-032.md) | Riesgo histórico y comparación de caídas | P1 | 5 | S5 | BF-028 |
| [BF-033](../backlog/issues/BF-033.md) | Guardar escenarios reproducibles | P1 | 3 | S5 | BF-028, BF-030 |
| [BF-034](../backlog/issues/BF-034.md) | Registro estructurado de decisiones | P0 | 5 | S6 | BF-011, BF-027 |
| [BF-035](../backlog/issues/BF-035.md) | Favoritos y biblioteca de investigaciones | P1 | 3 | S6 | BF-011, BF-021 |
| [BF-036](../backlog/issues/BF-036.md) | Exportar comparaciones y decisiones con referencias | P1 | 5 | S6 | BF-024, BF-034 |
| [BF-037](../backlog/issues/BF-037.md) | QA integral financiero y de seguridad | P0 | 8 | S6 | BF-008, BF-020, BF-024, BF-028, BF-031 |
| [BF-038](../backlog/issues/BF-038.md) | Preparación de release, smoke test y recuperación | P0 | 5 | S6 | BF-037 |

## Detalle y criterios de aceptación

Cada historia contiene su propia aceptación verificable y dependencia, también disponible como archivo independiente para publicarla como GitHub Issue.

### BF-001 — Definir visión, audiencia y límites del MVP
**E0 · S0 · P0 · 3 SP · Dep.: —**

Como Product Owner quiero establecer el problema, resultados y exclusiones para evitar cambios de alcance sin decisión.

**Criterios de aceptación:**
1. Existe visión con usuario único, ETF, USD/PEN, ChatGPT y Claude por MCP, Next.js, Supabase, GitHub y Vercel.
2. Quedan fuera de MVP órdenes de compraventa, asesoramiento personalizado automático, conexión a bróker y chat LLM embebido.
3. Se fijan criterios de éxito verificables y se documentan los supuestos y riesgos pendientes.

### BF-002 — Instalar gobierno Scrum y trazabilidad
**E0 · S0 · P0 · 3 SP · Dep.: BF-001**

Como Product Owner quiero historias identificables y cambios rastreables para revisar entregas sin perder decisiones.

**Criterios de aceptación:**
1. Backlog priorizado incluye ID, historia, aceptación, dependencias, puntos, épica y propuesta de sprint.
2. Existen DoR, DoD, acuerdos de revisión, criterio de cambio de alcance y plantilla de issue/PR.
3. Cada PR futuro referencia BF-ID, evidencia QA, riesgos y aprobación antes de merge.

### BF-003 — Diseñar navegación y wireframes del MVP
**E0 · S0 · P0 · 5 SP · Dep.: BF-001**

Como inversor principiante quiero pantallas claras para analizar sin conocer jerga técnica.

**Criterios de aceptación:**
1. Hay wireframes verificables para Panel, Explorar ETF, Comparador, Simulador, Investigaciones y Decisiones.
2. Cada pantalla describe estados vacío, cargando, error, datos incompletos y móvil.
3. Product Owner valida flujo de búsqueda a decisión antes de programar interfaz.

### BF-004 — Definir contrato de datos y fuentes financieras
**E0 · S0 · P0 · 5 SP · Dep.: BF-001**

Como inversor quiero entender la procedencia y vigencia de cada cifra para confiar en los resultados.

**Criterios de aceptación:**
1. El diccionario distingue fondo por ISIN, cotización por símbolo+bolsa+moneda, y proveedor/licencia.
2. Cada dato susceptible de cambio tiene fuente, URL/documento, fecha efectiva, fecha de captura y estado de validación.
3. Se documentan la política de datos ausentes, ajuste por dividendos, rentabilidades y tipos de cambio.

### BF-005 — Evaluar cobertura y restricciones de proveedores
**E0 · S0 · P0 · 3 SP · Dep.: BF-004**

Como Product Owner quiero comprobar fuentes reales para no construir sobre datos inaccesibles.

**Criterios de aceptación:**
1. Se prueba cobertura y permisos de VWRA, FWRA, VOO, VUG y SPYG por ISIN/listing con al menos dos opciones de fuente.
2. Se registra disponibilidad de series históricas, retrasos, límites, coste y licencia de visualización/almacenamiento.
3. Se documenta una decisión de proveedor y un plan alternativo sin afirmar cobertura no comprobada.

### BF-006 — Inicializar aplicación, tipado y pipeline QA
**E1 · S1 · P0 · 5 SP · Dep.: BF-002**

Como desarrollador quiero un esqueleto desplegable para integrar módulos sin regresiones.

**Criterios de aceptación:**
1. Next.js/React/TypeScript se ejecuta localmente con dependencias fijadas y lockfile.
2. Hay scripts documentados de lint, TypeScript, tests y build; CI falla si alguno falla.
3. No se publican claves ni se requiere OpenAI/Claude API en runtime.

### BF-007 — Autenticación privada de usuario único
**E1 · S1 · P0 · 5 SP · Dep.: BF-006**

Como propietario quiero acceder únicamente yo para proteger mis decisiones.

**Criterios de aceptación:**
1. Acceso no autenticado redirige a login y no expone datos privados.
2. Sesión válida permite entrar; cierre de sesión invalida la sesión local y bloquea rutas privadas.
3. Creación pública de cuentas se mantiene deshabilitada en el MVP.

### BF-008 — Políticas RLS, secretos y aislamientos
**E1 · S1 · P0 · 8 SP · Dep.: BF-007**

Como propietario quiero que clientes y herramientas solo operen sobre datos autorizados.

**Criterios de aceptación:**
1. Todas las tablas expuestas aplican RLS y los permisos se restringen por user_id cuando proceda.
2. Pruebas anónimas y de identidad ajena no pueden leer/escribir registros privados.
3. No hay service_role en navegador ni logs; migraciones y escritura MCP usan credenciales separadas y acceso mínimo.

### BF-009 — Shell responsive y navegación accesible
**E1 · S1 · P1 · 3 SP · Dep.: BF-003, BF-006**

Como inversor quiero navegar desde computadora o móvil con continuidad.

**Criterios de aceptación:**
1. Menú incluye las seis pantallas acordadas, con estado activo y rutas funcionales.
2. Navegación por teclado, etiquetas y contrastes básicos probados.
3. En móvil no aparecen tablas truncadas sin alternativa de desplazamiento o vista adaptada.

### BF-010 — Modelo de instrumentos y cotizaciones
**E2 · S1 · P0 · 5 SP · Dep.: BF-004, BF-008**

Como analista quiero identificar correctamente un ETF para no confundir mercados.

**Criterios de aceptación:**
1. Instrumento tiene identificador único ISIN; cada listing tiene bolsa, ticker, divisa y estado.
2. Ingresar el mismo ISIN y listing por segunda vez es idempotente, no duplica registros.
3. La búsqueda por ticker ambiguo exige seleccionar listing; no se mezcla valor liquidativo con cotización.

### BF-011 — Carga piloto de cinco ETF con evidencia
**E2 · S2 · P0 · 3 SP · Dep.: BF-005, BF-010**

Como inversor quiero comenzar con alternativas conocidas para validar el sistema.

**Criterios de aceptación:**
1. El catálogo contiene VWRA, FWRA, VOO, VUG y SPYG con identificadores verificados.
2. Cada ficha identifica fuente oficial y fecha; un campo sin evidencia aparece sin verificar.
3. Se puede revisar y corregir un registro sin perder el valor previo ni la fuente.

### BF-012 — Persistir propiedades y snapshots de ETF
**E2 · S2 · P0 · 5 SP · Dep.: BF-011**

Como inversor quiero comparar costos y exposición según una fecha específica.

**Criterios de aceptación:**
1. Se guardan nombre, gestora, índice, política de dividendos, domicilio, TER, tamaño y fecha, cuando exista fuente.
2. Una nueva medición crea snapshot versionado y no sobrescribe registros históricos.
3. Un dato faltante se representa como no disponible y no como cero.

### BF-013 — Importar precios históricos con control de calidad
**E2 · S2 · P0 · 8 SP · Dep.: BF-005, BF-010**

Como inversor quiero series consistentes para hacer backtests verificables.

**Criterios de aceptación:**
1. La importación identifica proveedor, listing, fecha, moneda y tipo de precio: cierre, ajustado o total return.
2. Fechas/valores duplicados se manejan idempotentemente y se detectan huecos, negativos y cambios bruscos.
3. No se construye rentabilidad total usando precio sin ajustar como si incluyera dividendos; se muestra limitación.

### BF-014 — Almacenar FX USD/PEN por fecha
**E2 · S2 · P0 · 5 SP · Dep.: BF-004**

Como inversor peruano quiero comparar mi posición en USD y soles.

**Criterios de aceptación:**
1. Cada tipo de cambio tiene fecha, fuente, par, sentido y valor positivo.
2. La conversión histórica usa el FX correspondiente a cada fecha y una regla documentada para no hábiles.
3. Cuando falta FX requerido, el resultado se declara incompleto en lugar de inventar un valor.

### BF-015 — Noticias y documentos con citación
**E2 · S2 · P1 · 3 SP · Dep.: BF-011**

Como inversor quiero registrar noticias pertinentes sin confundirlas con datos oficiales.

**Criterios de aceptación:**
1. Se guarda título, medio/emisor, URL, fecha de publicación, fecha de captura y ETFs vinculados.
2. Noticias duplicadas por URL canónica se detectan y pueden vincularse a varios ETF.
3. El sistema separa noticia, opinión de IA y hecho comprobado.

### BF-016 — Vigencia y fallas de información
**E2 · S2 · P0 · 3 SP · Dep.: BF-012, BF-013, BF-014**

Como inversor quiero reconocer cuándo una cifra no está actualizada.

**Criterios de aceptación:**
1. Ficha y matriz muestran fecha efectiva, fecha de captura y fuente en datos de mercado.
2. Se aplican reglas configurables de dato obsoleto por categoría; un error de proveedor no se reemplaza por cero.
3. Los indicadores incompletos o desactualizados no producen conclusiones categóricas.

### BF-017 — Diseñar contrato MCP con mínimo privilegio
**E3 · S3 · P0 · 5 SP · Dep.: BF-008, BF-010**

Como propietario quiero que ChatGPT y Claude lean/escriban solamente funciones autorizadas.

**Criterios de aceptación:**
1. Existe listado versionado de herramientas de consulta y propuestas de escritura con esquemas validados.
2. El contrato no ofrece SQL arbitrario ni acceso administrativo a producción.
3. Se definen identidad, autorización, límites, errores, logs y mecanismo de aprobación humana.

### BF-018 — Consulta MCP desde ChatGPT
**E3 · S3 · P0 · 8 SP · Dep.: BF-017**

Como usuario quiero preguntar por mis ETF desde ChatGPT y recibir datos vigentes del sistema.

**Criterios de aceptación:**
1. Cliente ChatGPT consulta instrumentos, fuentes y comparaciones usando identidad permitida.
2. La respuesta contiene información consistente con la base y distingue dato ausente o desactualizado.
3. Se demuestra rechazo de acceso no autorizado y no se exponen secretos.

### BF-019 — Proponer y aprobar cambios investigados por MCP
**E3 · S3 · P0 · 8 SP · Dep.: BF-017, BF-012**

Como usuario quiero enviar hallazgos de IA a Supabase sin aceptar datos erróneos automáticamente.

**Criterios de aceptación:**
1. Un asistente envía propuesta con campos tipados, fuentes, fecha y su identidad; no modifica snapshots aprobados directamente.
2. El propietario puede aprobar, rechazar o corregir; solo una aprobación crea snapshot definitivo y auditoría.
3. Repetir una misma propuesta no genera duplicados; entradas malformadas o sin fuente se rechazan.

### BF-020 — Compatibilidad MCP con Claude
**E3 · S3 · P0 · 5 SP · Dep.: BF-018, BF-019**

Como usuario quiero investigar desde Claude sobre el mismo catálogo de datos.

**Criterios de aceptación:**
1. Claude puede consultar el mismo ETF y ver el mismo snapshot que ChatGPT.
2. Claude puede preparar propuesta controlada y se distingue la identidad del origen.
3. Las pruebas de autorización, lectura y errores se ejecutan en ambos clientes.

### BF-021 — Trazabilidad de análisis y cambios
**E3 · S3 · P1 · 3 SP · Dep.: BF-019**

Como inversor quiero conocer quién investigó y qué fuente justificó cada modificación.

**Criterios de aceptación:**
1. Auditoría registra usuario, asistente, acción, objeto, resultado y marca temporal sin almacenar secretos.
2. Desde ficha se puede ver fuente y versión de cambios aprobados.
3. El historial es solo lectura para el usuario ordinario y no puede borrarse desde frontend.

### BF-022 — Puente contextual entre web y conversaciones externas
**E3 · S3 · P1 · 3 SP · Dep.: BF-018, BF-020**

Como inversor quiero pasar del panel al chat sin volver a escribir todo.

**Criterios de aceptación:**
1. La app genera una solicitud contextual copiable con ticker, listing, hipótesis y objetivo; sin claves privadas.
2. La interfaz explica que el chat se realiza fuera de la web y que el MCP sincroniza datos, no conversaciones.
3. Al regresar, puedo consultar la investigación aprobada y la fecha de última actualización.

### BF-023 — Seleccionar hasta cinco ETF y persistir comparaciones
**E4 · S4 · P0 · 5 SP · Dep.: BF-010, BF-012**

Como inversor quiero armar comparaciones para evaluar alternativas.

**Criterios de aceptación:**
1. Se pueden agregar entre dos y cinco ETF válidos y retirar cualquiera sin duplicados.
2. La comparación guarda los listings y la fecha de datos usados.
3. Se muestran estados específicos ante ticker ambiguo, fondos faltantes y datos incompletos.

### BF-024 — Matriz objetiva con periodos homogéneos
**E4 · S4 · P0 · 8 SP · Dep.: BF-023, BF-013, BF-014**

Como inversor quiero evaluar a todos sobre una misma base de comparación.

**Criterios de aceptación:**
1. Se muestran TER, índice, política, región, moneda y rentabilidad en ventanas comparables donde haya cobertura.
2. Si series no comparten un periodo utilizable, se marca indicador no comparable; no se interpolan rendimientos faltantes.
3. El usuario puede inspeccionar periodo, fórmula, fuente y fecha de cada métrica.

### BF-025 — Exposición regional y solapamiento con cautelas
**E4 · S4 · P1 · 5 SP · Dep.: BF-012, BF-023**

Como inversor quiero comprender cuánto se parecen los fondos.

**Criterios de aceptación:**
1. Cuando existan holdings o exposición verificada se calculan porcentajes con fecha y cobertura.
2. La interfaz no infiere solapamiento preciso sin holdings comparables ni confunde compartir índice con identidad exacta.
3. Se señala concentración geográfica y sectorial y la fecha de cada composición.

### BF-026 — Costos de tenencia y ejecución
**E4 · S4 · P1 · 5 SP · Dep.: BF-023**

Como inversor quiero separar comisión del ETF de costos de comprarlo.

**Criterios de aceptación:**
1. Se muestra TER anual y, cuando exista evidencia, spread, comisión de bróker, cambio de divisa y costes fiscales como supuestos.
2. Los costos no verificados quedan editables como hipótesis explícitas; no se afirma comisión cero de ningún bróker.
3. La comparación distingue costo recurrente de costo de transacción.

### BF-027 — Resumen comparativo explicable, no recomendación automática
**E4 · S4 · P1 · 3 SP · Dep.: BF-024, BF-025, BF-026**

Como inversor novato quiero identificar compensaciones entre opciones.

**Criterios de aceptación:**
1. Un resumen determinista destaca menor costo, mayor diversificación y carencias de datos sin prometer ganancias.
2. No asigna puntuación final ni recomendación de compra sin metodología aceptada por el PO.
3. Puede guardarse como hipótesis y se enlaza a la matriz y sus fuentes.

### BF-028 — Backtest de inversión única
**E5 · S5 · P0 · 8 SP · Dep.: BF-013, BF-014**

Como inversor quiero conocer el resultado histórico de invertir un monto en una fecha concreta.

**Criterios de aceptación:**
1. Elijo ETF, inversión inicial, fecha inicio y fin, y la aplicación calcula unidades, valor y retorno con series aptas.
2. El cálculo usa moneda, ajustes de precio y FX documentados; sin datos suficientes muestra error explicativo.
3. Pruebas numéricas reproducibles contrastan resultados con fixtures calculados a mano.

### BF-029 — Aportes periódicos y capital aportado
**E5 · S5 · P0 · 5 SP · Dep.: BF-028**

Como inversor quiero simular compras mensuales para distinguir aporte de rentabilidad.

**Criterios de aceptación:**
1. Configuro importe, periodicidad mensual, fecha inicial y reglas para fechas no hábiles.
2. El resultado separa capital aportado, valor final, rentabilidad y cronología de compras.
3. Un mes sin cotización suficiente activa regla explícita o advertencia; nunca inventa precio.

### BF-030 — Escenarios futuros por supuestos explícitos
**E5 · S5 · P0 · 5 SP · Dep.: BF-029**

Como inversor quiero estimar resultados posibles sin confundir pronóstico con garantía.

**Criterios de aceptación:**
1. El usuario fija retorno nominal anual pesimista, base y optimista, plazo y aportes.
2. Las proyecciones se calculan con fórmulas deterministas y diferencian aportes de resultado.
3. Cada pantalla explica que escenarios hipotéticos no son predicciones ni promesas de rendimiento.

### BF-031 — Conversión USD/PEN y costes en simulaciones
**E5 · S5 · P0 · 5 SP · Dep.: BF-014, BF-028**

Como inversor peruano quiero ver efecto de tipo de cambio y gastos.

**Criterios de aceptación:**
1. En backtest se distinguen rentabilidad del activo y efecto FX; se usa el histórico por fecha.
2. Costos y comisiones son editables, con valor inicial cero solo si se declara como hipótesis y no como costo real.
3. Cambiar moneda de vista no reinterpreta aportes históricos ni cambia la cantidad de títulos adquiridos.

### BF-032 — Riesgo histórico y comparación de caídas
**E5 · S5 · P1 · 5 SP · Dep.: BF-028**

Como inversor quiero observar pérdidas posibles además de ganancias.

**Criterios de aceptación:**
1. Se calcula máxima caída (drawdown) para una serie comparable y se exhiben periodos y fórmula.
2. Se grafica evolución y se distinguen histórico, escenarios futuros y volatilidad si la fuente la permite.
3. Una serie insuficiente no muestra indicador de riesgo ficticio.

### BF-033 — Guardar escenarios reproducibles
**E5 · S5 · P1 · 3 SP · Dep.: BF-028, BF-030**

Como inversor quiero revisar después los supuestos de una simulación.

**Criterios de aceptación:**
1. Se almacena identificador, parámetros, versión de fórmulas, series o corte y resultado.
2. Una simulación abierta posteriormente permite reproducir el resultado congelado.
3. Se avisa si los precios actuales han cambiado desde la ejecución sin alterar la instantánea.

### BF-034 — Registro estructurado de decisiones
**E6 · S6 · P0 · 5 SP · Dep.: BF-011, BF-027**

Como inversor quiero documentar por qué observé, descarté o elegí un ETF.

**Criterios de aceptación:**
1. Registro almacena estado (observando/descartado/considerando), tesis, riesgos, fecha y ETF referenciado.
2. Cambiar opinión conserva historial y no constituye orden de compraventa.
3. Puedo consultar por ETF y fecha los motivos y análisis relacionados.

### BF-035 — Favoritos y biblioteca de investigaciones
**E6 · S6 · P1 · 3 SP · Dep.: BF-011, BF-021**

Como inversor quiero recuperar mis exploraciones con facilidad.

**Criterios de aceptación:**
1. Puedo marcar/desmarcar ETF favorito sin duplicados.
2. Las investigaciones aprobadas se filtran por instrumento, fuente, fecha y autor GPT/Claude/humano.
3. Eliminar un favorito no borra información financiera de catálogo ni auditoría.

### BF-036 — Exportar comparaciones y decisiones con referencias
**E6 · S6 · P1 · 5 SP · Dep.: BF-024, BF-034**

Como inversor quiero guardar un resumen portable para revisar luego.

**Criterios de aceptación:**
1. Se genera exportación CSV o Markdown UTF-8 con métricas, fecha de corte y fuentes.
2. Los datos faltantes aparecen explícitos y no cambian al exportar.
3. El export no incluye claves privadas, identificadores sensibles ni mensajes internos.

### BF-037 — QA integral financiero y de seguridad
**E6 · S6 · P0 · 8 SP · Dep.: BF-008, BF-020, BF-024, BF-028, BF-031**

Como Product Owner quiero evidencia de que los cálculos y permisos cumplen los requisitos.

**Criterios de aceptación:**
1. Existe matriz de pruebas con positivos, negativos, permisos, FX, periodos, duplicados, datos viejos y redondeos.
2. Pruebas automatizadas de cálculos y RLS pasan y la evidencia manual de los 5 ETF queda adjunta.
3. No quedan defectos críticos o altos sin resolver ni aceptados explícitamente por el PO.

### BF-038 — Preparación de release, smoke test y recuperación
**E6 · S6 · P0 · 5 SP · Dep.: BF-037**

Como propietario quiero desplegar sin perder datos ni investigaciones.

**Criterios de aceptación:**
1. Existe procedimiento reproducible de Vercel con variables por entorno y control de autorizaciones.
2. Antes de producción se verifican migraciones, respaldos, rutas privadas, consulta y simulación de punta a punta.
3. Rollback, versionado y smoke test post-release están documentados y cuentan con aprobación de PO.

## Gestión y refinamiento

- Fuente de verdad: este archivo versionado; al publicar Issues, cada Issue es unidad operativa y mantiene enlace al BF-ID.
- Estado inicial de todo ítem: Product Backlog. Solo el PO aprueba entrada a Sprint Backlog.
- Orden inicial por dependencia y riesgo de datos/seguridad, no por preferencia visual.
- Cada historia exige pasar DoR antes de entrar en sprint y DoD antes de cerrar.
- Cambio material de alcance requiere discusión y actualización de historia, riesgos y estimación.
- La división por sprints es una propuesta: antes de Sprint 1 debe elegirse una cadencia fija (máximo 1 mes por Scrum).