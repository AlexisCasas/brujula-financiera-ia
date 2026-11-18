# BF-017a — Contrato MCP financiero v0.1.0

**Fecha:** 17-nov-2026 · **Estado:** contrato y pruebas en rama aislada; integración remota pendiente.
**Dependencia:** PR #60, BF-039 (perfil), BF-041a (seguimiento) y BF-040 (acciones BVL).
**Historia principal:** [BF-017 #17](https://github.com/AlexisCasas/brujula-financiera-ia/issues/17).

## 1. Entrega y exclusiones

- Registro de siete herramientas en `src/lib/mcp/contract.ts`, con versión, efectos, descripción, parámetros requeridos y límites.
- Parser sin dependencias de IA, que rechaza campos no previstos, UUID incorrectos, parámetros excesivos y confirmación ausente/negativa.
- Proyección explícita de ocho campos no sensibles del perfil: bandas, estado, versiones, fecha y etiqueta educativa.
- Pruebas deterministas sobre casos permitidos y denegados.
- **NO se implementó un servidor MCP, endpoint HTTP, OAuth, token, acceso externo a Supabase, cola de propuestas, escritura, nueva tabla ni migración.** `availability=contract_only` evita confundir la especificación con herramientas conectadas.

## 2. Herramientas definidas (no ejecutables)

| Herramienta | Efecto | Parámetros esenciales |
|---|---|---|
| `get_investor_profile` | Lectura | Ninguno; solo resumen autorizado, nunca cuestionario |
| `list_watchlist` | Lectura | Estado opcional activo/inactivo; límite 1–50 |
| `search_instruments` | Lectura | Texto de 2–80 caracteres, tipo ETF/acción, límite 1–20 |
| `get_instrument_profile` | Lectura | Identidad exacta por listing UUID |
| `get_asset_research` | Lectura | Listing UUID, fecha y límite; depende de BF-015 |
| `set_watchlist_follow` | Escritura personal | Listing UUID, follow/unfollow y confirmación |
| `submit_research_proposal` | Propuesta | Listing, título, resumen, fuente HTTPS, fecha, idempotency key, confirmación |

Los esquemas prohíben SQL arbitrario, nombres de usuario suministrados por el modelo, inversiones de dinero, cantidad de acciones, órdenes al bróker y precios sin fuente.

## 3. Identidad y autorización obligatorias para la futura implementación

1. **Sesión y audiencia:** autenticar cada cliente MCP mediante credenciales revocables de corta duración; verificar issuer, audiencia, caducidad y sujeto. No aceptar `user_id` arbitrario ni claims editables de usuario como prueba de autorización.
2. **Scopes mínimos:** distinguir `profile:read`, `watchlist:read`, `assets:read`, `watchlist:write` y `research:propose`. Un scope de lectura no otorga escritura.
3. **Propietario y RLS:** consultar datos privados en una sesión real autorizada; la política del único propietario sigue vigente. No exponer el conector administrativo de Supabase al asistente.
4. **Confirmación doble:** el parámetro `confirmed=true` solo expresa intención en el contrato y **no demuestra consentimiento**; antes de ejecutar una escritura se exige aprobación real en el cliente MCP y validación/auditoría del servidor. Denegar repeticiones no autorizadas.
5. **Identidad financiera:** operar por listing UUID validado contra ISIN, mercado, ticker y moneda. Ante ambigüedad, solicitar elección. Seguir un activo no significa poseerlo.
6. **Escrituras futuras:** seguimiento mediante una función idempotente del propietario; hallazgos solo se envían a cola de revisión humana, no alteran datos financieros aprobados.
7. **Clientes independientes:** ChatGPT y Claude no comparten tokens ni scopes; deben poder revocarse individualmente.

## 4. Seguridad de entradas, respuestas y observabilidad

- Máximo 50 elementos en seguimiento, 20 resultados por búsqueda o investigación, 80 caracteres para búsqueda, 160 para título y 1000 para resumen.
- Rechazar campos desconocidos, valores fuera de rango, fechas inexistentes, URL sin HTTPS, credenciales incorporadas y hosts locales/IP directas. El contrato **no obtiene contenido de URL**. La ingesta posterior requerirá mitigaciones DNS, redirecciones, SSRF y revisión de licencias.
- Devolver fuente, fecha, moneda o ausencia explícita de datos cuando corresponda; nunca inventar cotizaciones, rendimientos o dividendos.
- El resumen de perfil no debe incluir respuestas del cuestionario, saldo, deuda, fondo de emergencia, correo o UID.
- Códigos previstos para runtime: `UNAUTHORIZED`, `FORBIDDEN`, `INVALID_ARGUMENTS`, `UNKNOWN_TOOL`, `CONFIRMATION_REQUIRED`, `RATE_LIMITED`, `DATA_UNAVAILABLE`, `DEPENDENCY_PENDING`, `INTERNAL_ERROR`.
- Al implementar: logs limitados a herramienta, fecha, request ID, latencia y código; nunca registrar tokens, respuestas personales o argumentos sensibles. Separar lectura y escritura con cuotas por cuenta/cliente.

## 5. Verificación y DoD

- [x] Tool registry versionado con validación restrictiva de entrada.
- [x] Proyección con allowlist del resumen de perfil.
- [x] Pruebas unitarias de datos permitidos y bloqueados agregadas.
- [ ] GitHub Actions: lint, TypeScript, Vitest, guardrails y build **a verificar**.
- [ ] Autenticación OAuth/MCP real compatible con ChatGPT y Claude.
- [ ] Test de propietario, scopes, RLS, caducidad, consentimiento y replay con ambos clientes reales.
- [ ] Cola de propuestas con revisión humana e idempotencia para BF-015.
- [ ] Aprobación de PO para integración, publicación o migración (ninguna forma parte de BF-017a).

**Rollback:** eliminar la rama/PR. No hay recursos ni datos de Supabase que revertir. **BF-017 permanece abierto**; se entrega únicamente BF-017a, el contrato previo a implementación.
