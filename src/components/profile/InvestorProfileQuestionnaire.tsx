import { saveInvestorProfileAction } from "@/app/(app)/perfil/actions";
import { QUESTIONNAIRE_VERSION } from "@/lib/investor-profile";

type Option = { value: string; label: string };
type QuestionProps = {
  name: string;
  title: string;
  description?: string;
  options: Option[];
};

function Question({ name, title, description, options }: Readonly<QuestionProps>) {
  return (
    <fieldset className="profile-question">
      <legend>{title}</legend>
      {description && <p>{description}</p>}
      <div className="profile-options">
        {options.map((option, index) => {
          const id = name + "-" + option.value;
          return (
            <label className="profile-option" htmlFor={id} key={option.value}>
              <input
                id={id}
                type="radio"
                name={name}
                value={option.value}
                required={index === 0}
              />
              <span>{option.label}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

const horizon: Option[] = [
  { value: "under_1y", label: "Menos de 1 año" },
  { value: "1_3y", label: "Entre 1 y 3 años" },
  { value: "3_5y", label: "Entre 3 y 5 años" },
  { value: "5_10y", label: "Entre 5 y 10 años" },
  { value: "over_10y", label: "Más de 10 años" },
];
const withdrawal: Option[] = [
  { value: "under_1y", label: "Necesitaré una parte importante en menos de 1 año" },
  { value: "1_3y", label: "Podría necesitar una parte dentro de 1 a 3 años" },
  { value: "over_3y", label: "No preveo necesitarlo durante al menos 3 años" },
];
const emergency: Option[] = [
  { value: "under_1m", label: "Menos de 1 mes de gastos esenciales" },
  { value: "1_3m", label: "Entre 1 y 3 meses" },
  { value: "over_3m", label: "Más de 3 meses" },
  { value: "prefer_not", label: "Prefiero no responder" },
];
const stability: Option[] = [
  { value: "variable", label: "Variable o incierto" },
  { value: "mixed", label: "Relativamente estable, con variaciones" },
  { value: "stable", label: "Estable y previsible" },
];
const dependency: Option[] = [
  { value: "essential", label: "Necesito este dinero para gastos esenciales o compromisos próximos" },
  { value: "partial", label: "Es importante para un objetivo, pero tengo otras fuentes" },
  { value: "not_needed", label: "Es capital de largo plazo que no necesito para mis gastos" },
];
const debt: Option[] = [
  { value: "yes", label: "Sí" },
  { value: "no", label: "No" },
  { value: "unsure", label: "No estoy seguro / prefiero no responder" },
];
const drawdown: Option[] = [
  { value: "sell_all", label: "Vendería toda la posición" },
  { value: "reduce", label: "Reduciría una parte" },
  { value: "hold", label: "Mantendría la inversión según mi plan" },
  { value: "buy_more", label: "Consideraría invertir más, solo si mi plan y liquidez lo permiten" },
];
const emotion: Option[] = [
  { value: "very_anxious", label: "Me preocuparía mucho y probablemente actuaría impulsivamente" },
  { value: "concerned_wait", label: "Me sentiría incómodo, pero podría esperar y revisar mi plan" },
  { value: "comfortable", label: "Aceptaría la volatilidad sin cambiar mi plan" },
];
const goals: Option[] = [
  { value: "preserve", label: "Proteger el capital" },
  { value: "income", label: "Obtener ingresos periódicos" },
  { value: "growth", label: "Hacer crecer el capital a largo plazo" },
  { value: "mixed", label: "Combinar crecimiento, estabilidad e ingresos" },
];
const experience: Option[] = [
  { value: "none", label: "Ninguna experiencia previa" },
  { value: "basic", label: "Básica: conozco algunos conceptos" },
  { value: "intermediate", label: "Intermedia: he invertido y entiendo las fluctuaciones" },
  { value: "advanced", label: "Avanzada: conozco instrumentos y sus riesgos" },
];

export function InvestorProfileQuestionnaire() {
  return (
    <form action={saveInvestorProfileAction} className="profile-form">
      <input type="hidden" name="questionnaire_version" value={QUESTIONNAIRE_VERSION} />
      <section className="panel profile-section" aria-labelledby="capacity-title">
        <p className="eyebrow">Dimensión 1 · Capacidad financiera</p>
        <h2 id="capacity-title">¿Qué margen tienes para asumir pérdidas?</h2>
        <p className="profile-section-intro">
          Estas preguntas se refieren a tu situación y a cuándo podrías necesitar el dinero.
          No pedimos montos exactos.
        </p>
        <div className="profile-question-grid">
          <Question name="horizon" title="1. ¿Durante cuánto tiempo podrías mantener invertido este dinero antes de necesitarlo?" options={horizon} />
          <Question name="withdrawal" title="2. ¿Cuándo podrías necesitar retirar una parte importante de tu inversión?" options={withdrawal} />
          <Question name="emergency_fund" title="3. ¿Cuánto cubre aproximadamente tu fondo de emergencia?" description="Considera solo dinero disponible para gastos esenciales, separado de tus inversiones." options={emergency} />
          <Question name="income_stability" title="4. ¿Cómo describirías la estabilidad de tus ingresos?" options={stability} />
          <Question name="capital_dependency" title="5. ¿Qué tan necesario es este capital para tus gastos u objetivos próximos?" options={dependency} />
          <Question name="high_cost_debt" title="6. ¿Actualmente tienes deudas de alto costo (por ejemplo, tarjeta de crédito con saldo financiado)?" description="No indiques importes ni entidades." options={debt} />
        </div>
      </section>

      <section className="panel profile-section" aria-labelledby="tolerance-title">
        <p className="eyebrow">Dimensión 2 · Tolerancia emocional</p>
        <h2 id="tolerance-title">¿Cómo reaccionarías ante una caída?</h2>
        <p className="profile-section-intro">
          Imagina que el valor de tu inversión cae y la pérdida todavía no se ha recuperado.
          No hay respuestas correctas o incorrectas: responde con sinceridad.
        </p>
        <div className="profile-question-grid">
          <Question name="drop_10" title="7. Si tu inversión cayera un 10 % en poco tiempo, ¿qué harías?" options={drawdown} />
          <Question name="drop_20" title="8. Si la caída llegara al 20 %, ¿qué harías?" options={drawdown} />
          <Question name="drop_30" title="9. Si la caída llegara al 30 %, ¿qué harías?" options={drawdown} />
          <Question name="emotional_reaction" title="10. ¿Cómo te afectaría emocionalmente ver pérdidas temporales en tu inversión?" options={emotion} />
        </div>
      </section>

      <section className="panel profile-section" aria-labelledby="context-title">
        <p className="eyebrow">Dimensión 3 · Contexto personal</p>
        <h2 id="context-title">¿Qué buscas y qué experiencia tienes?</h2>
        <p className="profile-section-intro">
          Estas respuestas ayudan a contextualizar tu resultado. No aumentan ni reducen
          directamente tu puntuación de riesgo.
        </p>
        <div className="profile-question-grid">
          <Question name="goal" title="11. ¿Cuál es tu principal objetivo de inversión?" options={goals} />
          <Question name="experience" title="12. ¿Cómo describirías tu experiencia invirtiendo?" options={experience} />
        </div>
      </section>

      <section className="profile-privacy">
        <strong>Privacidad y uso del resultado</strong>
        <p>
          Se guardan las opciones elegidas, la versión del cuestionario y el resultado
          en tu cuenta privada. No solicitamos ingresos exactos, patrimonio, cuentas
          bancarias ni texto libre. Tus respuestas no se envían a ChatGPT ni a Claude.
        </p>
        <p>
          Esta autoevaluación es educativa y orientativa; no es una prueba regulatoria
          de idoneidad, asesoría financiera ni recomendación de compra o venta.
        </p>
        <label className="profile-consent">
          <input type="checkbox" name="privacy_acknowledged" value="yes" required />
          <span>Entiendo cómo se utilizarán y guardarán mis respuestas.</span>
        </label>
      </section>

      <div className="profile-submit">
        <button className="primary-button" type="submit">Calcular y guardar mi perfil</button>
        <span className="etf-meta">Cuestionario v{QUESTIONNAIRE_VERSION} · Se conservará el historial de evaluaciones.</span>
      </div>
    </form>
  );
}
