# BF-005 — Protocolo de pruebas de proveedores (sin pagos)

**Fecha:** 2026-11-11 · **Estado:** preparación; ejecución autenticada pendiente.  
**Historia:** [BF-005](https://github.com/AlexisCasas/brujula-financiera-ia/issues/5)  
**Proveedor primario de prueba:** EODHD Free Starter; **alternativo:** Twelve Data Basic. **No se ha contratado ningún plan.**

## 1. Precauciones

- **El repositorio es público.** No publicar claves, tokens, cabeceras, URLs de consulta con token, capturas que revelen cuentas, series históricas licenciadas ni datos personales.
- Una respuesta de catálogo o `symbol_search` **no demuestra** permiso para acceder al histórico. Twelve Data advierte expresamente que un mercado puede aparecer en metadatos y no estar habilitado en el plan. [Fuente](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage).
- EODHD declara que **no hay trial de planes de pago**; Free Starter: 20 solicitudes/día, un año de histórico limitado, más un token demo que funciona para una lista pequeña de instrumentos de ejemplo. [Fuente](https://eodhd.com/help/plans). La prueba real de nuestros 5 ETF requiere una cuenta y confirmar el acceso.
- Twelve Data Basic ofrece límites de uso de 8 créditos API y 800/día; la cobertura de históricos globales depende del plan. [Planes](https://twelvedata.com/pricing).
- EODHD personal **no** autoriza redistribuir cotizaciones a terceros sin licencia comercial. [Uso comercial](https://eodhd.com/help/commercial). Twelve Data requiere licencia adicional para redistribución. [Términos](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage).

## 2. Matriz de aceptación de cobertura (completar con evidencia real)

| ETF | ISIN | Bolsa y moneda buscadas | EODHD metadatos | EODHD EOD 30 días | EODHD EOD 24 meses | Twelve metadatos | Twelve EOD 30 días | Twelve EOD 24 meses | Fuente/licencia |
|---|---|---|---|---|---|---|---|---|---|
| VWRA | IE00BK5BQT80 | LSE / USD | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| FWRA | IE000716YHJ7 | LSE / USD | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| VOO | US9229083632 | NYSE Arca / USD | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| VUG | US9229087369 | NYSE Arca / USD | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |
| SPYG | US78464A4094 | NYSE Arca / USD | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente | Pendiente |

**Interpretación:** `PASS` indica respuesta autenticada real del plan, identidad/moneda correctas, datos suficientes, fuente y derecho de uso; `RESTRICTED` si el plan no deja consultar; `MISSING` si no existe instrumento/serie; `ERROR` si falla la ejecución. Nunca marcar PASS por texto comercial.

## 3. Secuencia segura sugerida (Windows 11)

1. Registrarse en [EODHD](https://eodhd.com/) y obtener la clave gratuita en su propia cuenta. **No enviarla en el chat ni subirla a GitHub.**
2. Validar primero catálogo de la bolsa LSE y US: [documentación de exchanges y símbolos](https://eodhd.com/financial-apis/exchanges-api-list-of-tickers-and-trading-hours). La ruta documentada para el listado es `/api/exchange-symbol-list/LSE?api_token=...` y análoga `US`; el filtrado específico por ticker debe verificarse según parámetros soportados. Confirmar `Code`, `Exchange`, `Currency` y `Isin` (puede faltar en algunos valores).
3. Probar series EOD de hasta 30 días para cada listing resuelto; anotar estado HTTP (sin mostrar URL completa), fechas primera/última, cantidad de filas y `adjusted_close` si corresponde.
4. Intentar rango 24 meses; si la respuesta es restringida, registrar que la prueba del plan gratis **no sirve para demostrar** el histórico ampliado.
5. Abrir cuenta Basic en [Twelve Data](https://twelvedata.com/) y repetir catálogo + `time_series` si el plan autoriza esos mercados. No asumir que un resultado de búsqueda da acceso a EOD.
6. Revisar permisos escritos de almacenamiento/caché y uso en una web de **usuario personal único**; antes de exponer información a terceros, negociar licencia apropiada.
7. Solo si un proveedor cumple, solicitar autorización al Product Owner para adoptar plan y costo. No comprar ni desplegar por inferencia.

## 4. Formato de evidencia por prueba

```text
Proveedor:
Plan usado:
Fecha/hora:
ETF / ISIN / ticker / bolsa / moneda:
Metadatos: HTTP [código] / Identidad coincidente [sí/no/parcial]:
Histórico 30 d: HTTP / filas / primera fecha / última fecha:
Histórico 24 m: HTTP / filas / primera fecha / última fecha:
Campos: [close, adjusted_close, dividends, splits], cobertura real:
Retardo / zona horaria / ajustes:
Cuota y respuesta al exceder:
Términos de uso verificados: [URL, fecha, alcance, permiso almacenamiento]:
Resultado: PASS / RESTRICTED / MISSING / ERROR:
Observaciones y soporte:
```

**No incluir respuesta JSON completa si contiene información comercial sujeta a licencia.** El reporte público solo debe guardar metadatos/estadísticas, nunca secretos ni series licenciadas.

## 5. Gate de salida BF-005

- [ ] Se ejecutan y registran **10 pruebas de catálogo e histórico** (5 ETF × 2 candidatos), identificando restricciones de los planes.
- [ ] Se confirma por escrito la licencia para uso personal, almacenamiento/caché y visualización privada; la licencia para terceros se evaluará solo si se amplía el alcance.
- [ ] Se compara cobertura, ajustes, retraso, límites, disponibilidad y costo sin confundir catálogos con series.
- [ ] Se propone un proveedor principal y un sustituto sustentados con pruebas, y el PO aprueba la elección.
- [ ] Si ningún proveedor sirve, el MVP continúa con **fixtures o cargas manuales con derechos permitidos**, nunca datos inventados presentados como reales.

**Resultado actual:** documentación pública contrastada; pruebas de cobertura real y licencia específica **pendientes**.