# BF-023b — Persistencia de comparaciones de ETF

**Estado:** migración aplicada al proyecto Supabase existente; frontend en rama de revisión; no se hizo merge ni despliegue de producción.

## Modelo de persistencia

- Tabla **`public.saved_etf_comparison`**, identificador UUID, propietario, título, fecha de corte UTC, momento de guardado, 2–5 IDs de listings y snapshot JSONB inmutable.
- RPC **`save_etf_comparison(uuid[],text,date)`** genera el snapshot **dentro de una única transacción PostgreSQL**, sin aceptar cifras financieras desde el navegador.
- Por cada listing, conserva ISIN, ticker, bolsa, moneda, atributos actuales al guardar, métricas TER / patrimonio, versiones, identificadores de medición, fechas, enlaces de fuente y estado de ausencia.
- Para un histórico anterior se selecciona la última medición cuya `as_of_date <= fecha de corte`; un dato inexistente se guarda como `null` y «no disponible».
- Los datos de **nombre, índice y distribución** se congelan **en el instante de guardado**, porque aún no tenemos un historial bitemporal de atributos. La fecha de corte aplica a **mediciones**, no a toda la ficha histórica.
- Cada guardado crea un registro nuevo; no se sobrescriben comparaciones anteriores.

## Controles de acceso

- RLS activo, lectura solo del propietario verificado con `auth.uid()` y `private.is_owner()`.
- Tabla: `authenticated` tiene únicamente **SELECT**; `anon` no tiene acceso.
- El guardado utiliza una función **SECURITY DEFINER** con verificación explícita contra `app_owner`. Se ha revocado EXECUTE a `PUBLIC` / `anon`, y concedido exclusivamente a `authenticated`.
- La función rechaza usuario distinto del propietario, IDs inexistentes, duplicados, menos de 2, más de 5 y fecha futura.
- El frontend utiliza el cliente SSR con cookies de sesión; ninguna clave de servicio aparece en código de interfaz.
- Sin cambios ni escritura en las tablas de instrumentos o mediciones.

## Evidencias ejecutadas sobre Supabase

Proyecto: `ncalhbwyuwxopokgfcty`.

1. Dry-run DDL dentro de `BEGIN/ROLLBACK`: PASS; tabla protegida y permisos adecuados.
2. Migración `bf023_saved_etf_comparison`: aplicada correctamente.
3. Prueba de permisos: RLS activo, `anon` sin acceso, `authenticated` SELECT pero no INSERT/UPDATE, RPC solo para autenticado: PASS.
4. Suite SQL de **9 pruebas** con transacción revertida: PASS. Ver `supabase/tests/bf023_saved_comparisons.sql`.
5. Conteo final de comparaciones guardadas tras pruebas: **0**; no se generaron datos ficticios persistentes.

**No se ejecutaron pruebas de navegador con sesión del usuario** ni se verificó visualmente Vercel para este nuevo incremento.

## Interfaz web

- `/comparador`: selección BF-023a, botón «Guardar fotografía» y últimas cinco comparaciones guardadas.
- `/comparador/guardadas`: listado de las últimas 30, fecha de guardado, fecha de corte, cantidad de ETF y acceso a detalle.
- `/comparador/guardadas/[id]`: matriz histórica que lee exclusivamente `items_snapshot`; muestra cifras y referencias originales aunque después cambien las mediciones.
- Estados: selección inválida, error de guardado, historial vacío, registro inexistente, usuario no autorizado y ausencia de métricas.

## QA solicitado al Product Owner

1. Ingresar al preview con el usuario propietario y abrir `/comparador`.
2. Seleccionar **VWRA y FWRA**, introducir un título y pulsar **Guardar fotografía**.
3. Comprobar que abre una URL de comparación guardada y que aparecen TER, patrimonio, ISIN, fechas y fuentes.
4. Volver a `/comparador/guardadas` y reabrir el registro.
5. Comparar tres a cinco ETF; guardar un segundo registro y verificar que el primero no cambió.
6. Confirmar que se muestra «No disponible» donde falta patrimonio de clase/fondo y que no aparecen retornos históricos inventados.
7. Probar móvil y usuario sin sesión. Comprobar que no puede acceder al historial.
8. No habilitar merge ni despliegue productivo hasta la validación visual.

## Riesgos y siguientes incrementos

- El proyecto Supabase actual es compartido por desarrollo y producción: la migración ya existe, pero las tablas están vacías y solo el dueño puede guardar.
- BF-024 (rendimiento comparable, FX y periodos históricos) continúa pendiente de fuentes de datos reales.
- La función SECURITY DEFINER requiere protección y pruebas de aislamiento; se hicieron pruebas contra un segundo UID simulado, pero sigue pendiente QA de extremo a extremo con un usuario de Auth real distinto.
- La vista de historial presenta hasta 30 registros; paginación queda pendiente si el volumen crece.
- Un snapshot conserva evidencia, pero no transforma un dato sin verificar en verificado.

**Definition of Done BF-023:** se requiere QA visual real, CI verde, aprobación de merge, y evidencia de persistencia desde la aplicación antes de cerrar el Issue.
