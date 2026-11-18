
# Sesión 6 — Investigación financiera y análisis comparativo

## Propósito

Enseñar a un inversionista principiante a investigar instrumentos, contrastar fuentes y comparar alternativas sin prometer rentabilidades ni automatizar decisiones bursátiles.

## Caso de clase (hipotético)

- Perfil: **moderado** (supuesto para la sesión, distinto del perfil real guardado por el usuario).
- Capital inicial: **S/ 1.000**.
- Aporte mensual: **S/ 300**.
- Horizonte: **10 años**.
- Objetivo: construcción de patrimonio, asumiendo fondo de emergencia y sin necesidad de liquidez inmediata.
- Instrumentos del catálogo existente: **VWRA** (ISIN IE00BK5BQT80), **FWRA** (IE000716YHJ7), **Credicorp BAP** (BMG2519Y1084).

### Distinción didáctica

VWRA y FWRA son dos ETF de acumulación referenciados al FTSE All-World, por lo que se prestan al benchmarking ETF vs ETF. Credicorp BAP es una acción individual: **no es metodológicamente válido otorgarle la misma nota como si fuese un ETF global**. Para BAP se prepara una ficha individual de investigación empresarial y riesgo.

## S6-01: Ficha de investigación (/investigaciones/fichas)

Flujo:
1. Seleccionar VWRA, FWRA o BAP **por ISIN y ticker exactos**.
2. Consultar identidad y métricas solo del catálogo real de Supabase. Si la métrica no existe, mostrar **No disponible**.
3. Abrir documentos primarios del emisor / SEC y fuentes ya registradas por Brújula.
4. Responder cinco apartados: qué se compra, factores que influyen, riesgos, evidencia consultada y preguntas pendientes.
5. Exportar ficha en Markdown como evidencia de clase.

Los campos **no se completan automáticamente**. Un registro de identidad no asegura que la negociación bursátil actual esté verificada. TER no aplica a una acción individual.

## S6-02: Matriz de benchmarking (/investigaciones/benchmarking)

1. Revisar atributos de VWRA/FWRA y sus fichas oficiales.
2. Asignar pesos enteros a seis criterios: diversificación 25%, costos 20%, riesgo 20%, tamaño/liquidez 15%, disponibilidad en bróker 10%, comprensión 10% (pesos iniciales didácticos, editables).
3. Valorar de 1 a 5 cada alternativa y redactar una justificación (mínimo 15 caracteres) en cada criterio ponderado.
4. Solo calcular resultado cuando la suma sea exactamente **100 %** y existan puntuaciones justificadas de ambos ETF.
5. Exportar la matriz en Markdown y reflexionar sobre la sensibilidad de la conclusión a los supuestos.

Cálculo reproducible: **puntaje = Σ(peso porcentual × calificación de 1–5) / 100**. El resultado expresa un juicio didáctico del estudiante, no una recomendación, una predicción de rentabilidad ni una clasificación objetiva de mercado.

## Datos y privacidad

- Solo consulta lectura del catálogo Supabase mediante el cliente autenticado y RLS existente.
- No crea tablas, migra esquema ni escribe datos en Supabase.
- Los borradores se guardan **únicamente en localStorage del navegador** para permitir retomar el ejercicio en ese dispositivo; no se sincronizan con otros dispositivos ni cuentan como historial persistente de la plataforma.
- Exportación Markdown local con contenido introducido por el estudiante.
- No se muestran cotizaciones en tiempo real ni se inventan precios, rentabilidades o spreads.

## QA y criterios de aceptación

- Identificar exactamente los tres ISIN del ejercicio.
- Ficha vacía no equivale a una investigación completada.
- Ausencia de TER verificable no crea un número simulado.
- Criterios sin puntuar no producen un ganador.
- Pesos distintos de 100 bloquean resultado.
- Matríz con seis justificaciones por ETF produce suma ponderada determinística.
- UI accesible (labels, encabezados, tablas con scroll, móvil).
- Mantener funcionamiento actual de perfil, catálogo, comparador y seguimiento.
- Netlify deploy-preview sin integrar a main ni cambiar producción.

## Siguiente trabajo

S6-03 evaluará alternativas y sensibilidad a pesos; S6-04 generará el informe ejecutivo. BF-017a MCP sigue siendo una etapa separada.
