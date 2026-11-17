# BF-039 — Perfil del inversor v1.0

**Historia:** [BF-039](../backlog/issues/BF-039.md) · **Issue GitHub:** #54  
**Estado:** migración aplicada en Supabase compartido el 2026-11-17; nueve pruebas SQL con rollback superadas. QA visual y merge pendientes.  
**Cuestionario:** 1.0 · **Scoring:** 1.0.

## Objetivo y límites

Cuestionario educativo para un inversor principiante. Distingue:

- **Capacidad financiera:** cuánto margen permite la situación, horizonte, liquidez y compromisos para tolerar una pérdida sin comprometer necesidades.
- **Tolerancia emocional:** qué reacción declara el usuario ante caídas hipotéticas y cuánta volatilidad cree poder soportar.

El perfil global, cuando está completo, se limita a la banda más baja de ambas dimensiones. El resultado no es una prueba psicométrica validada, una evaluación regulatoria de idoneidad, asesoría ni recomendación de inversión. No asigna ETF ni pesos de cartera.

## Cuestionario

### Capacidad financiera (6 preguntas)

| Pregunta | Opciones / puntos |
|---|---|
| Horizonte | <1 año: 0; 1–3 años: 0; 3–5: 1; 5–10: 2; >10: 2 |
| Necesidad de retiro | <1 año: 0; 1–3: 1; >3: 2 |
| Fondo de emergencia | <1 mes: 0; 1–3 meses: 1; >3 meses: 2; prefiero no responder: no determinada |
| Estabilidad de ingresos | Variable: 0; relativamente estable: 1; estable: 2 |
| Dependencia del capital | Necesario para gastos esenciales: 0; parcialmente necesario: 1; no necesario para gastos: 2 |
| Deuda de alto costo | Sí: 0; no: 2; no estoy seguro/prefiero no responder: no determinada |

**Máximo:** 12 puntos. Bandas: **0–4 bajo**, **5–8 medio**, **9–12 alto**.

No se solicita importe exacto de ingresos, patrimonio, deuda o cuentas. Si el usuario no revela el fondo de emergencia o no sabe si tiene deuda de alto costo, la capacidad se presenta como **no determinada**, no se estima a partir de las otras respuestas.

### Tolerancia emocional (4 preguntas)

Se pregunta qué haría ante caídas del 10 %, 20 % y 30 % y cómo le afectarían emocionalmente.

| Respuesta | Puntos por escenario |
|---|---:|
| Vendería toda la posición | 0 |
| Reduciría una parte | 1 |
| Mantendría la inversión según mi plan | 2 |
| Consideraría invertir más, si el plan y la liquidez lo permiten | 2 |

Reacción emocional: muy ansioso = 0; preocupado pero capaz de esperar = 1; cómodo = 2.

**Máximo:** 8 puntos. Bandas: **0–2 bajo**, **3–5 medio**, **6–8 alto**.

### Coherencia de las respuestas

La puntuación de disposición a asumir riesgo no debería aumentar a medida que la caída hipotética se hace más profunda. Se verifica que la puntuación de -10 % sea mayor o igual que la de -20 %, y esta mayor o igual que la de -30 %. Si no se cumple, se marca `review_needed` y no se asigna un perfil global.

### Contexto que no suma puntos

Objetivo (preservación, ingresos, crecimiento o mixto) y experiencia (ninguna, básica, intermedia o avanzada) se muestran para contextualizar. No se usan para elevar o reducir el score: tener experiencia no significa tener capacidad financiera ni tolerancia alta.

## Perfil global

| Capacidad | Tolerancia | Perfil global |
|---|---|---|
| Bajo | Cualquier nivel | Conservador / bajo |
| Medio | Bajo | Conservador / bajo |
| Medio | Medio o alto | Moderado / medio |
| Alto | Bajo | Conservador / bajo |
| Alto | Medio | Moderado / medio |
| Alto | Alto | Agresivo / alto |

Si capacidad no se puede determinar, el resultado global queda no determinado. Si hay respuestas inconsistentes en caídas, requiere revisión.

## Privacidad y persistencia

- Solo opciones codificadas; sin texto libre ni importes exactos.
- El navegador no envía scores ni propietario: el RPC valida identidad, respuestas y calcula el resultado en PostgreSQL.
- Cada envío crea una fotografía inmutable con respuestas, versión de cuestionario, versión de scoring, bandas, puntuaciones y timestamp.
- RLS restringe lectura al usuario propietario. Cliente autenticado solo tiene SELECT; INSERT/UPDATE/DELETE directos están revocados. El RPC es la única vía de escritura.
- Las respuestas no se envían a GPT ni Claude en BF-039.
- El RPC SECURITY DEFINER es una elevación acotada y genera una advertencia de seguridad que debe revisarse; la función comprueba auth.uid() contra app_owner, no expone parámetros de propietario y valida todas las opciones. No ampliar a multiusuario/MCP sin rediseño y revisión.

## Migración y rollback

Archivo: `supabase/migrations/20261117015103_bf039_investor_profile.sql`.

Crea `public.investor_profile_snapshot`, su índice, RLS, política owner-only y `public.save_investor_profile(jsonb)`. No altera el catálogo ni las comparaciones existentes.

**Supabase es un único proyecto compartido por desarrollo y producción.** Por esa razón la migración se aplicó solo tras autorización explícita del PO y quedó registrada en el historial Supabase como versión `20261117015103`. Una vez aplicada, el rollback preferido es dejar los snapshots históricos intactos y revertir el frontend si aparece un defecto; eliminar la tabla y sus respuestas no es una reversión rutinaria.

Test SQL: `supabase/tests/bf039_investor_profile.sql`; ejecutado en la base compartida con autorización, nueve controles superados y rollback verificado (cero filas residuales).

## QA manual

1. Iniciar sesión en Preview y abrir `/perfil`.
2. Completar un caso alto/alto (capacidad 12/12, tolerancia 8/8); debe resultar agresivo/alto.
3. Completar capacidad baja y tolerancia alta; el perfil global debe ser conservador/bajo.
4. Elegir «Prefiero no responder» para fondo de emergencia; capacidad y perfil global no deben inventarse.
5. Probar respuestas contradictorias entre caídas de -10 %, -20 % y -30 %; debe solicitar revisión.
6. Enviar un segundo cuestionario; el anterior debe seguir en el historial sin alterarse.
7. Probar responsive, teclado, navegación y que sin sesión se redirija al login.
8. Confirmar que los datos anteriores de catálogo, comparador e historial continúan intactos.

## Gate de release

- [ ] App CI: lint, typecheck, Vitest, guardrails y build.
- [ ] Document quality.
- [ ] Vercel Preview listo.
- [ ] Migración aplicada solo tras autorización explícita y prueba RLS.
- [ ] QA visual del Product Owner.
- [ ] Merge y despliegue solo tras aprobación explícita.
