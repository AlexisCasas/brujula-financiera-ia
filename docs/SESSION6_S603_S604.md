
# Sesión 6 — S6-03 Evaluación y S6-04 Informe ejecutivo

## Estado
Incrementos de continuación de S6-01/S6-02 integrados mediante PR #73. Se despliegan inicialmente como **Netlify Deploy Preview** del PR de esta fase, sin nuevos esquemas ni escritura a Supabase.

## Caso transversal
Inversionista hipotético de perfil moderado, con capital inicial S/ 1.000, aporte mensual S/ 300, horizonte 10 años. VWRA y FWRA se comparan entre sí. Credicorp BAP se investiga por separado como acción individual: no entra en el ranking de ETF.

## S6-03 — Evaluación de alternativas
Ruta: `/investigaciones/evaluacion`.

- Recupera pesos y 12 evaluaciones de S6-02 desde `localStorage`.
- **Importa el Markdown S6-02**, necesario cuando el usuario cambia de Netlify Preview o dominio (los borradores del navegador no comparten origen).
- Calcula escenarios de sensibilidad: pesos originales; costos prioritarios; riesgo prioritario; diversificación prioritaria; acceso al bróker prioritario. Las notas originales permanecen fijas.
- Cada vector de pesos suma 100% (mismas seis dimensiones). Sin matriz completa, no existe conclusión cuantitativa.
- Señala textos genéricos como «Justificación 1» y ausencia de referencias verificables. La comprobación es **heurística**, no auditoría de documentos.
- Permite escribir conclusión, ventajas, riesgos/contraargumentos, incertidumbres y siguientes pasos. El valor «seguir investigando» es válido. No simula una compra.
- Conserva las notas en `brujula-s6-evaluation-v1` dentro del navegador.

## S6-04 — Informe ejecutivo
Ruta: `/investigaciones/informe`.

- Integra el mismo benchmark, escenarios, notas S6-03 y fichas S6-01 (también importables desde Markdown cuando cambia el dominio).
- Estructura: resumen ejecutivo, objetivo, metodología, matriz, sensibilidad, ventajas, riesgos, incertidumbres, fichas de los tres instrumentos, calidad de evidencia, fuentes y limitaciones.
- Exporta **Markdown** y ofrece impresión desde el navegador («Guardar como PDF» en el diálogo de impresión).
- El informe puede ser incompleto; en ese caso muestra «Pendiente» en vez de inventar conclusiones.
- Los enlaces de fuentes sugeridas están identificados como tales: no demuestran que el estudiante los haya consultado.

## Privacidad y seguridad
- Sin migraciones, sin operaciones financieras, sin lectura de claves privadas y sin escritura a Supabase.
- `localStorage` no constituye almacenamiento seguro para información privada sensible: no se deben introducir números de cuenta, DNI ni credenciales.
- Se usa texto seguro de React, sin renderizar HTML arbitrario de archivos importados.
- Importación limitada a 100 KB y verificación de ISIN, formato, rango de pesos, puntuaciones y duplicados.

## QA obligatoria
1. Importar el archivo S6-02 validado por el usuario y observar 4.80 / 4.20 sin recrear notas.
2. Probar matriz incompleta: resultado bloqueado.
3. Confirmar escenarios determinísticos y suma de pesos.
4. Revisar que «Justificación 1» genera alertas de calidad.
5. Registrar una conclusión que diga «Seguir investigando».
6. Importar por separado tres fichas S6-01.
7. Descargar .md e imprimir/guardar PDF desde el navegador.
8. Visualizar páginas en escritorio y teléfono.
9. CI: lint, TS, tests, guardrails, build.
10. No fusionar a main hasta revisión del usuario.
