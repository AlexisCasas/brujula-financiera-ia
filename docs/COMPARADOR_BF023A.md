# Incremento BF-023a · Comparador documental de ETF (solo lectura)

**Origen:** BF-023 / BF-024 · **Rama:** `feat/BF-023-comparador-lectura` · **Estado:** PR pendiente de QA y aprobación del PO.

## Contexto

Se implementa el primer incremento del comparador sobre los **cinco ETF y las mediciones que ya existen** en Supabase. Se adelanta este trabajo respecto del roadmap original, sin afirmar que estén implementadas todas las dependencias de precios y FX.

## Alcance implementado

- Seleccionar entre **2 y 5 listings** mediante casillas y comparar sus atributos documentados; un mismo ticker en bolsas distintas se trata como listing distinto por su identificador.
- Proteger frente a selección vacía, un solo ETF, más de cinco, IDs duplicados e instrumentos que ya no existan.
- Matriz de ISIN, gestora, índice, domicilio, política de dividendos, listing/moneda, TER y patrimonio de clase/fondo como **métricas distintas**.
- Cada medición disponible conserva fecha efectiva, fecha del documento, versión, fuente HTTPS y nota; ausencias se presentan como «No disponible», nunca como cero.
- Exposición regional, rentabilidad y riesgo figuran como no disponibles, sin extrapolaciones de IA. La vista es documental y **no ofrece una recomendación automática**.
- Acceso autenticado mediante el mismo `getEtfCatalog()` que usa Panel/Explorar: SSR y políticas RLS existentes; **sin clave administrativa**.

## Fuera de alcance / pendientes

- **BF-023 AC2:** guardar una comparación persistente en Supabase, con IDs de listings y versión/fecha snapshot, **no está realizado**. La URL con query params permite repetir la selección, pero **no equivale a persistencia** ni mantiene un snapshot histórico estable.
- **BF-024:** rentabilidad temporal común, conversión USD/PEN, región/solapamiento y metodología del retorno; requieren BF-013/014 y fuentes autorizadas.
- No se crean tablas ni RPC, no se escribe en la base, no se configuran proveedores de precios ni se hace merge/despliegue de producción automáticamente.

## QA y aceptación parcial

| Criterio | Evidencia | Estado |
|---|---|---|
| Selección de 2–5 ETF y quitar/agregar | `tests/comparison.test.ts`, formulario | Implementado; QA visual pendiente |
| Sin duplicados | Parser deduplica IDs | Implementado |
| Estados vacíos/inválidos/faltantes | Estados `empty/too_few/too_many/not_found/ready` | Implementado |
| Datos desde Supabase con RLS | Reutiliza `getEtfCatalog` | Implementado; QA real pendiente |
| Fuentes y fechas | Celdas de métrica verificadas | Implementado; QA visual pendiente |
| Comparación guardada | Falta modelo persistente | **Pendiente BF-023** |
| Ventanas históricas, FX y rendimientos | Aún no se integra histórico | **Pendiente BF-024** |

## QA manual sugerido

1. Iniciar sesión en el preview; abrir `/comparador`. Sin selección debe mostrar ayuda y no un ganador.
2. Seleccionar VWRA y FWRA; comparar TER, índices, dividendos y fechas.
3. Añadir VOO, VUG y SPYG; verificar tabla legible con scroll horizontal móvil.
4. Intentar uno, seis y un ID desconocido en la URL; verificar avisos y no mostrar resultados engañosos.
5. Verificar que patrimonio clase/fondo no se sume ni se mezcle, y que FWRA/SPYG conserven sus salvedades.
6. Confirmar «No comparable» en rendimientos mientras no haya series.
7. Confirmar que usuario anónimo/ajeno no puede consultar la matriz; verificar enlaces de fuentes.
8. Capturar evidencia sin correos, cookies ni información personal.

**Gate:** CI verde, despliegue preview y QA visual del Product Owner antes de solicitar merge. Mantener BF-023 y BF-024 abiertos hasta que todas sus AC estén satisfechas.
