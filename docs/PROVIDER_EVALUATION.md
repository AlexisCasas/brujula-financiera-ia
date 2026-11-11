# BF-005 · Discovery de proveedores y cobertura de ETF — 2026-11-11

**Estado:** evaluación documental concluida; **prueba de API autenticada pendiente**. Sin credenciales de proveedores no es correcto afirmar que suscripción/plan cubre los cinco instrumentos.  
**Historia:** [BF-005](https://github.com/AlexisCasas/brujula-financiera-ia/issues/5).  
**Decisión propuesta (NO aprobada):** evaluar primero EODHD Historical All-World para **uso personal**, contrastar con Twelve Data; ficha oficial de emisores para propiedades; BCRP para FX. **No contratar ni usar en producción hasta superar el gate.**

## 1. Cinco instrumentos piloto: identidad y listing elegido

| Instrumento | Emisor / nombre | ISIN | Listing piloto | Moneda | Estado identidad |
|---|---|---|---|---|---|
| VWRA | Vanguard FTSE All-World UCITS ETF (USD) Acc | **IE00BK5BQT80** | LSE: VWRA (también hay VWRP/GBP) | USD | Verificado en emisor |
| FWRA | Invesco FTSE All-World UCITS ETF Acc | **IE000716YHJ7** | LSE: FWRA (también FWRG/GBX) | USD | Verificado en emisor |
| VOO | Vanguard S&P 500 ETF | **US9229083632** | NYSE Arca: VOO | USD | Verificado en emisor |
| VUG | Vanguard Growth ETF | **US9229087369** | NYSE Arca: VUG | USD | Emisor confirma ticker/CUSIP/bolsa; ISIN corroborado por BMV |
| SPYG | State Street SPDR Portfolio S&P 500 Growth ETF | **US78464A4094** | NYSE Arca: SPYG | USD | Verificado en emisor |

**Fuentes primarias y comprobación:**
- VWRA (emisor, incluye LSE/USD): https://www.vanguardsouthamerica.com/en/product/etf/equity/9679/vanguard-ftse-all-world-ucits-etf-usd-accumulating
- FWRA (emisor, sección «Trading & security information»): https://www.invesco.com/ch/en/financial-products/etfs/invesco-ftse-all-world-ucits-etf-acc.html
- VOO (emisor): https://www.vanguard.co.uk/professional/product/etf/equity/0968/sp-500-etf
- VUG (emisor/CUSIP): https://advisors.vanguard.com/investments/products/vug/vanguard-growth-etf ; BMV/ISIN: https://www.bmv.com.mx/es/emisoras/perfil/VUG-6773
- SPYG (emisor): https://www.ssga.com/us/en/intermediary/etfs/state-street-spdr-portfolio-sp-500-growth-etf-spyg

**Precaución:** símbolo Yahoo (p. ej., `VWRA.L`) y símbolo EODHD (sufijo `.LSE`) **no son intercambiables por defecto**. Confirmar código exacto por API y por ISIN; evitar mapear el fondo equivocado.

## 2. Dos proveedores candidatos: capacidad comercial vs cobertura real

| Aspecto | EODHD | Twelve Data |
|---|---|---|
| Documentación de histórico global | API EOD, splits y dividendos; bolsa LSE en catálogo | `/time_series` para ETF global; cobertura por nivel |
| Comprobación exacta de VWRA/FWRA | **No probada con token** | **No probada con token** |
| Comprobación exacta de VOO/VUG/SPYG | **No probada con token** | **No probada con token** |
| Tipo de serie y ajuste | Disponible en API según dataset; probar ajuste/splits/dividendos por listing | OHLCV, metadatos; confirmar ajustes y disponibilidad real |
| Free / prueba | Starter $0, 20 llamadas/día, histórico limitado al último año | Basic $0, 8 créditos/minuto y límite diario anunciado de 800; mercados/ETF internacionales pueden requerir plan |
| Plan personal histórico | **All-World $19.99/mes** publicado; 100 000 llamadas/día, 1 000/min, hasta 30+ años donde existe el instrumento | **Grow $79/mes** publicado con EOD global ETF; Pro $229/mes con más mercados/datos |
| Retraso de cotización LSE | Serie EOD, no prometer datos tiempo real; validar fecha de publicación | Grow: EOD global; Pro: algunas capacidades EU en tiempo real según mercado/licencia |
| Licencia | Términos de planes personales: uso personal, no distribución a terceros | Planes individuales: uso personal/interno, sin redistribución; uso comercial distinto |
| Persistencia/derivados | Verificar contrato del plan, retención/cache y si la ficha/serie puede guardarse para app privada | Verificar plan; caché y derechos de derivados pueden depender de licencia |
| Redistribución pública de cotizaciones | **No incluida por defecto** | **No incluida por defecto** |
| Resultado de prueba autenticada | **PENDIENTE** | **PENDIENTE** |

**Fuentes de términos / planes:**
- EODHD planes y límites: https://eodhd.com/lp/forex-api
- EODHD uso comercial/redistribución: https://eodhd.com/help/commercial
- EODHD catálogos por bolsa, código LSE y respuesta con ISIN: https://eodhd.com/financial-apis/exchanges-api-list-of-tickers-and-trading-hours
- EODHD token y API: https://eodhd.com/financial-apis/quick-start-with-our-financial-data-apis
- Twelve Data precios: https://twelvedata.com/pricing
- Twelve Data uso personal/comercial y restricciones: https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage
- Twelve Data créditos: https://support.twelvedata.com/en/articles/5615854-credits
- Twelve Data calidad e histórico: https://support.twelvedata.com/en/articles/5549842-twelve-data-quality-standards

**Precios/cobertura documentales a 2026-11-11; no son cotización contractual ni autorización de acceso.** Un plan «global» no prueba por sí solo cada ISIN. Cambios de precio/cobertura pueden ocurrir.

## 3. Cobertura por símbolo: matriz de pruebas

| Instrumento / bolsa | EODHD: identificador a consultar | EODHD metadata / histórico / derechos | Twelve Data: ticker + bolsa | Twelve metadata / histórico / derechos |
|---|---|---|---|---|
| VWRA · LSE USD | consultar catálogo LSE con `exchange-symbol-list/LSE`, filtrar VWRA localmente y confirmar ISIN/USD (no asumir parámetro `symbols`) | PENDIENTE / PENDIENTE / PENDIENTE | `symbol_search` o catálogo ETFs; confirmar exchange LSE, ISIN y USD | PENDIENTE / PENDIENTE / PENDIENTE |
| FWRA · LSE USD | descubrir FWRA en LSE; ISIN y USD | PENDIENTE / PENDIENTE / PENDIENTE | buscar FWRA LSE; ISIN y USD | PENDIENTE / PENDIENTE / PENDIENTE |
| VOO · NYSE Arca USD | catálogo `US` con símbolo VOO; ISIN | PENDIENTE / PENDIENTE / PENDIENTE | buscar VOO con bolsa/mic | PENDIENTE / PENDIENTE / PENDIENTE |
| VUG · NYSE Arca USD | catálogo `US` con símbolo VUG; ISIN | PENDIENTE / PENDIENTE / PENDIENTE | buscar VUG con bolsa/mic | PENDIENTE / PENDIENTE / PENDIENTE |
| SPYG · NYSE Arca USD | catálogo `US` con símbolo SPYG; ISIN | PENDIENTE / PENDIENTE / PENDIENTE | buscar SPYG con bolsa/mic | PENDIENTE / PENDIENTE / PENDIENTE |

**Lo que sí ha sido probado:** la identidad y bolsa del instrumento en sitios oficiales; existencia documentada de APIs, precios y políticas. **Lo que NO se ha probado:** una respuesta real autenticada para estos 10 pares (5 ETF × 2 proveedores), disponibilidad de los intervalos que necesitaremos, ni derecho efectivo de almacenamiento/visualización. **BF-005 AC1 sigue parcial.**

## 4. Procedimiento de prueba reproducible (sin exponer secretos)

Para cada proveedor contratado/probado, ejecutar desde entorno privado con key en variables de entorno (nunca GitHub, capturas ni PR):

1. **Catálogo:** resolver ticker + exchange + ISIN + currency y guardar evidencia **redactada** (HTTP status, identidad, plan, timestamp).
2. **Histórico:** pedir rango de 30 días y, si existe, 24 meses. Registrar primer/último día, 0/null, split/adj, zona horaria, filas, retraso y estado HTTP; no guardar precios crudos en repo público.
3. **Dividendos:** verificar endpoint y si existe retorno ajustado/documentación para VOO/VUG/SPYG; en VWRA/FWRA verificar clase acumulativa.
4. **Plan:** ejecutar con la clave real del plan propuesto, no asumir que un demo prueba una suscripción.
5. **Licencia:** documentar en privado o en ficha pública sin cláusulas secretas el permiso concreto de uso, caché, almacenamiento y visualización para propietario único y para eventual app de terceros.
6. **Gate:** PASS solo si **los cinco** se resuelven por ISIN/listing y la serie requerida llega en la moneda/periodo correcto con permiso. Un PENDIENTE no se convierte en PASS por extrapolación.

**Criterio de calidad de histórico:** al menos ~24 meses para los cinco, salvo antigüedad real menor; se documenta inicio real de cotización. Para el simulador de 5 años con FWRA (lanzado en 2023), usar periodo disponible o bloquear 5 años; no fabricar cinco años.

## 5. FX USD/PEN: candidata institucional

BCRPData (Banco Central de Reserva del Perú) ofrece series históricas diarias de tipo de cambio interbancario y SBS (compra/venta). Códigos: `PD04637PD`, `PD04638PD`, `PD04639PD`, `PD04640PD`.

- Referencia: https://estadisticas.bcrp.gob.pe/estadisticas/series/daily/tipo-de-cambio-nominal
- Disponibilidad de la **serie**: comprobada en catálogo oficial; política de tasa específica para simulador y acceso mediante API **pendientes** BF-014.
- No asumir que una serie bancaria equivale al tipo efectivo cobrado por un bróker.

## 6. Licencia y repo público: decisión de arquitectura

El repositorio `AlexisCasas/brujula-financiera-ia` es público, pero la app objetivo es de **uso personal con acceso autenticado y datos privados**. No incluir en Git: series históricas, cachés de proveedores, credenciales, extractos extensos, documentos con redistribución restringida ni investigaciones personales.

Si el PO quiere que otras personas **utilicen** la app o vean los datos, **esa es una ampliación material del alcance y de la licencia**: presupuestar plan comercial/redistribución y seguridad multiusuario antes de habilitar acceso. «Código abierto» no implica derecho a exponer datos de mercado.

## 7. Decisión provisional y plan alternativo

**Recomendación técnica para prueba controlada (no compra):** empezar con **EODHD Historical All-World**, porque documenta LSE, series EOD, dividendos/splits y coste personal de referencia bajo; **Twelve Data** como segundo candidato. Para atributos de ETF, priorizar la ficha web del emisor; para FX, BCRP.

**Plan B si falla EODHD:** repetir matriz con Twelve Data; si ambos fallan para VWRA/FWRA, permitir carga manual de extractos **con licencia/uso permitido**, procedencia e ISIN correctos, y habilitar solo las pantallas cuyas métricas puedan calcularse rigurosamente. No simular datos de mercado faltantes. Alternativamente restringir backtesting a ETF cubiertos y dejar UCITS como ficha sin histórico hasta disponer de proveedor autorizado.

**No aprobar BF-005 ni comenzar BF-013 con datos reales** hasta completar pruebas autenticadas y derechos para el caso de uso. Podemos continuar diseño UI, autenticación, datos ficticios con etiqueta fixture y contrato sin riesgos de licencia.

## 8. Aclaración de prueba gratuita (2026-11-11)

- EODHD confirma que **no ofrece trial de los planes de pago**: su versión gratuita limita consultas/histórico y el token público demo funciona solo para un pequeño conjunto de símbolos que **no prueba** VWRA ni FWRA. [Planes/trial](https://eodhd.com/help/plans).
- Twelve Data permite un nivel Basic gratuito, pero los metadatos/búsqueda de ETFs pueden revelar mercados que el plan **no autoriza para históricos**. [Acceso/licencias](https://support.twelvedata.com/en/articles/5332349-commercial-and-personal-usage).
- Para evitar gastos prematuros, el siguiente paso es el protocolo gratuito [BF005_VALIDATION_PLAN.md](BF005_VALIDATION_PLAN.md), sin pago ni conexión a Supabase.
- **Distinguir** uso personal (MVP actual), compartir código en GitHub y **mostrar datos de mercado a terceros** (requiere permiso/licencia comercial según términos).

## 9. Estado de aceptación

- AC1: **PARCIAL**. Cinco identidades por fuentes oficiales; comparación de 2 proveedores a nivel documental; **sin prueba API autenticada**.
- AC2: **PARCIAL**. Documentados intervalos/límites/precios conocidos; cobertura y derechos de almacenamiento por símbolo/plan pendientes.
- AC3: **PROPUESTA**. EODHD como primer candidato, Twelve Data alternativo; pendiente de autorización del PO y prueba del gate.
- **No cerrar BF-005 como Done todavía.** La ejecución del protocolo gratuito **no sustituye** la prueba con plan de producción si ese plan ofrece cobertura distinta.