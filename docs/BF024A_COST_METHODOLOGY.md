# BF-024a — Comparación documentada de gastos anuales

**Historia:** BF-024 (incremento parcial). **Estado:** desarrollo en PR, pendiente de QA visual del Product Owner.

## Objetivo

Ampliar la matriz documental del Comparador con un escenario cuantitativo simple de gastos internos de los ETF, usando únicamente mediciones ya guardadas en Supabase. No se integran todavía series de precios, noticias, FX, proyecciones de rentabilidad ni proveedores API.

## Fórmula y precisión

```text
gasto_ilustrativo_anual = capital_constante × TER_publicado_en_puntos_porcentuales / 100
```

Ejemplos con capital hipotético **USD 500**, manteniéndolo sin cambios durante un año:

| ETF | Porcentaje documentado en el piloto | Referencia anual ilustrativa |
|---|---:|---:|
| VWRA | 0,14 % · Ongoing charge | USD 0,70 |
| FWRA | 0,15 % · Ongoing charge | USD 0,75 |
| VOO | 0,03 % · Expense ratio | USD 0,15 |
| VUG | 0,03 % · Expense ratio | USD 0,15 |
| SPYG | 0,04 % · Gasto **bruto** | USD 0,20 (no equiparable al neto) |

Estos ejemplos son resultados aritméticos sobre cifras previamente registradas; **no** son cotizaciones en tiempo real, retornos esperados, ni comisiones facturadas al inversionista. Los gastos internos del fondo normalmente ya se reflejan en el NAV/precio y no deben descontarse dos veces de una rentabilidad neta.

### Reglas implementadas

1. El capital se valida entre 100 y 10.000.000, con máximo dos decimales; error visible en caso inválido.
2. Dos monedas disponibles, **USD/PEN**, sin conversiones: al alternarlas se interpreta el mismo capital numérico en la moneda seleccionada, no como equivalencia cambiaria.
3. Un TER almacenado como `0.14` se interpreta como 0,14 %, no como 14 %.
4. No se calcula gasto si el valor está ausente/no disponible, fuera del dominio 0–100, carece de fecha efectiva o de fuente HTTPS.
5. Gastos **brutos**, gastos **corrientes/OCF** y **expense ratio** se etiquetan por las notas originales de la fuente, sin igualarlos forzadamente. La clasificación `unclassified` impide afirmar metodología homogénea.
6. Si las fechas efectivas son distintas, la interfaz alerta que los datos no tienen un corte homogéneo.
7. No hay ganador, ranking ni recomendación automática. Se conserva la advertencia «No comparable» de BF-024 para rentabilidad/riesgo históricos.
8. El escenario se calcula en cliente a partir de mediciones consultadas con la sesión privada actual; no se crean tablas ni se alteran las fotografías guardadas en BF-023.

**Advertencia de modelado:** la clasificación actual se basa en texto de la nota guardada en cada medición. Es una clasificación documental auxiliar, no un campo tipado verificado de la base. Para comparaciones regulatorias/costos definitivos, se necesitará normalizar tipo de ratio en un incremento futuro.

## Criterios BF-024 cubiertos parcialmente

| Criterio BF-024 | Resultado BF-024a |
|---|---|
| TER, índice, política, región, moneda, rentabilidad en ventanas comparables | TER/índice/política/moneda están disponibles con procedencia; región y rentabilidad siguen explícitamente N/D |
| No rellenar series o periodos no comparables | Se informa el desacople de fechas de TER y se sigue marcando rentabilidad/riesgo no comparables |
| Inspección de periodo, fórmula, fuente y fecha | La fórmula ilustrativa y supuestos se muestran, junto con fechas y URLs oficiales de TER; el periodo de retornos históricos aún está pendiente |

**NO cerrar BF-024**. Depende de BF-013/BF-014 para series, ventanas homogéneas, retorno total y efecto FX.

## QA automatizado

`tests/cost-analysis.test.ts`: porcentaje en puntos, redondeo a centavos, nulos frente a cero real, importe inválido, categorías de gastos, fuente HTTPS, fechas heterogéneas, metodología dispar y moneda sin FX. Se ejecuta con el CI del repositorio (ESLint, TypeScript, Vitest, guardrails y build Next.js).

## QA manual Preview

1. Inicia sesión con el usuario propietario y entra a `/comparador`.
2. Selecciona **VWRA y FWRA**. Abre la matriz y el nuevo bloque «¿Qué implican los gastos anuales?».
3. Usa capital **500** en USD. Revisa 0,70 y 0,75 USD, con sus notas y fechas correspondientes.
4. Cambia a PEN: debe mostrar 0,70 y 0,75 en soles, acompañado del mensaje explícito **sin FX**.
5. Prueba vacío, 99, negativo, más de 10 millones y tres decimales: no deben mostrar costo calculado.
6. Añade VOO/VUG/SPYG. Comprueba que SPYG está rotulado como gasto bruto y se muestra la alerta por tipos de gasto dispares; no debe haber ranking.
7. Verifica enlaces a fuentes, accesibilidad de tabla y diseño móvil. Comprueba que guardar una comparación BF-023 sigue funcionando y que el escenario **no se añade** al registro inmutable.
8. Confirma que un usuario no autenticado no puede abrir el comparador.

**Gate:** CI + Vercel Preview verdes, aceptación visual explícita del PO antes de merge o despliegue de producción. Ninguna operación SQL nueva forma parte de este incremento.
