# BF-005 — Guía de ejecución segura en Windows 11

**Estado:** lista para ejecutar con tus cuentas gratuitas (EODHD y Twelve Data). No subir claves al repositorio público ni pegarlas en ChatGPT/Claude.

## 1. Preparar el repositorio local

1. Abre **GitHub Desktop → File → Clone repository** y usa `https://github.com/AlexisCasas/brujula-financiera-ia`.
2. En **Current Branch**, selecciona `docs/BF-001-005-sprint0-discovery` (la versión del PR #39 que contiene el script).
3. Abre **Repository → Show in Explorer**.
4. Dentro de la carpeta, clic derecho en un espacio vacío → **Abrir en Terminal** (PowerShell). Si abre otra consola, elige perfil PowerShell.

## 2. Prueba EODHD (primera tanda)

En PowerShell, **desde la carpeta raíz del repositorio**, ejecuta:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\bf005-test-providers.ps1 -Provider EODHD
```

Se solicitará tu clave EODHD sin mostrarla. Cópiala desde el panel de EODHD, pégala en la terminal oculta y presiona Enter. **No la escribas en el comando ni en un archivo**.

La prueba hace hasta **10 solicitudes** (cinco búsquedas + cinco series de 350 días), dentro de las 20 llamadas diarias publicadas para el plan gratuito cuando no hubo consumo previo. Si una cuota está agotada, el script registra el bloqueo sin reintentos.

**Resultado:** imprime un resumen por ETF y genera un archivo JSON de metadatos en **Documentos → BF005-Resultados**.

## 3. Prueba Twelve Data (segunda tanda)

Ejecuta:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\bf005-test-providers.ps1 -Provider TwelveData
```

Introduce la clave de Twelve Data cuando la pida, también oculta. Hace hasta **10 consultas** (cinco fichas ETF + cinco series 24 meses), con pausas de 9 segundos para no superar 8 créditos por minuto en el supuesto de un crédito por consulta. Si un endpoint consume más de uno o el plan no permite un mercado, los códigos de error quedarán registrados. No hace reintentos automáticos.

Puedes abrir el último JSON desde **Documentos → BF005-Resultados** y **adjuntarlo al chat después de revisarlo**. Contiene **códigos, cantidad de filas y fechas**, sin claves API ni precios completos. Si detectas algún dato sensible inesperado, no compartas el archivo; avisa y lo corregimos.

## 4. Cómo interpretaremos el resultado

- `ISIN_MATCH`: el proveedor devolvió el ISIN que esperábamos.
- `ISIN_NOT_RETURNED`: el catálogo devolvió un listing candidato, pero no confirmó ISIN. **No es validación de identidad**.
- `BARS_RETURNED_IDENTITY_PENDING`: existen datos históricos, pero hay que comprobar identidad, moneda, serie y licencia antes de aceptar uso financiero.
- `NO_EXACT_LISTING`: el catálogo consultado no dio coincidencia suficiente.
- `PLAN_RESTRICTED`, `API_ERROR`, `RATE_LIMIT`: falta permiso, hubo error documentado o se alcanzó un límite.
- `bars_30d`, `bars_350d`, `bars_24m`: número de fechas devueltas, no cantidad de llamadas consumidas.
- `adjusted_method=...NOT_VERIFIED`: no se verificó si las barras representan retorno total, por lo que **no se usarán aún para simulación**.

**La prueba no elige el proveedor automáticamente.** El informe BF-005 debe cruzar resultados y condiciones comerciales antes de proponer una suscripción.

## 5. Seguridad y alcance

- No subir `Documentos/BF005-Resultados` a GitHub. Los reportes corresponden a la cuenta privada y las políticas de las fuentes.
- EODHD documenta `api_token` en query y Twelve Data recomienda cabecera `Authorization: apikey ...`; el script construye ambas en memoria y nunca las imprime.
- El script captura errores sin imprimir la excepción completa porque podría incluir el token en la URL.
- No toca Supabase, Vercel ni precios de producción; no crea cuentas ni realiza pagos.
- La sintaxis del script se valida sin claves ni llamadas API en GitHub Actions; las pruebas reales solo se realizan en tu Windows con tu autorización y credenciales locales.

**Nota:** en PowerShell la política `-ExecutionPolicy Bypass` se aplica a esa invocación de `powershell.exe`, no cambia permanentemente la configuración de tu equipo. Revisa el archivo en GitHub antes de ejecutarlo.
