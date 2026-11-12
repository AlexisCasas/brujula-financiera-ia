# PR #48 — QA de vista previa Vercel

**Objetivo:** validar el Panel y Explorador ETF usando los datos reales del proyecto privado Supabase `ncalhbwyuwxopokgfcty`, **sin fusionar el PR ni modificar producción**.

## Fuente y alcance exacto

- Rama del PR: `feat/BF-011-012-catalog-dashboard`.
- Branch de producción de Vercel: `main`.
- Repositorio: `AlexisCasas/brujula-financiera-ia`.
- Frontend: `/login`, `/panel`, `/explorar`.
- No se incluyen operaciones sobre instrumentos, mediciones ni migraciones SQL.

**Alerta:** `https://brujula-financiera-ia.vercel.app/login` es el dominio de producción del proyecto recién importado; por defecto apunta a `main`, **no** al PR #48. Obtener la URL de Preview por la pestaña *Deployments* de Vercel o por el comentario/check del PR. No usar el dominio principal como evidencia de QA del PR.

## Variables a verificar sin revelar sus valores

Vercel → proyecto `brujula-financiera-ia` → Settings → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`: presente en **Preview** (debe pertenecer al proyecto Supabase correcto).
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: presente en **Preview**, con prefijo `sb_publishable_`.
- **No** configurar `service_role`, `sb_secret_` ni secretos administrativos en variables `NEXT_PUBLIC_*`.

Si se modifican variables de entorno, es necesario **redeplegar** la rama para que queden incorporadas al build.

## QA manual con sesión del propietario

1. Abrir **URL Preview del PR #48**, no URL pública de `main`. Registrar URL, commit SHA, target `Preview` y estado `Ready`.
2. Abrir `/login`; iniciar sesión con la cuenta del propietario (no registrar ni compartir credenciales).
3. Abrir `/panel`: esperar 5 instrumentos, 5 listings, 13 mediciones presentes y 2 ausentes entre 15 celdas para 5 fondos × 3 métricas; revisar que el total «campos sin verificar» se derive del catálogo, sin inventar cero.
4. Abrir `/explorar`: buscar por VWRA, FWRA, VOO, VUG, SPYG, por ISIN y por texto inexistente. Verificar ficha y estado «No disponible».
5. Comprobar fecha de las mediciones, versión, fuente original y notas, en particular: FWRA «Fund size» ambiguo y SPYG gasto bruto.
6. Navegar en escritorio y móvil, teclado, foco, apertura de `details`, carga/vacío/error y uso de enlaces externos HTTPS.
7. Salir de sesión; las rutas internas deben redirigir al login. Un usuario ajeno no debe acceder a datos privados.
8. Registrar capturas **sin correos, cookies, claves, contraseñas ni información privada**; anotar cualquier error de la consola.
9. Si falla una consulta, verificar que el frontend muestre error y reintento, no una cifra 0 o contenido ficticio.

## Gate del Pull Request

- [ ] Build de Vercel Preview `READY` para la rama/commit correctos.
- [ ] Login y lectura del catálogo con el usuario propietario, sin errores.
- [ ] Matriz financiera coincide con valores, fechas y notas de Supabase.
- [ ] RLS y acceso anónimo preservados.
- [ ] QA responsive y accesible realizado.
- [ ] Product Owner aprueba visualmente las pantallas.
- [ ] Solo entonces se considera la autorización **separada** de merge y despliegue definitivo.

**Nota de auditoría:** el proyecto Vercel nuevo fue creado por el propietario. Si la conexión MCP de Vercel no muestra el proyecto, verificar acceso a la cuenta/equipo correcto; **no** interpretar su ausencia como un fallo de compilación ni crear un segundo proyecto.
