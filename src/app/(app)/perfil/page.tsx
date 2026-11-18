import Link from "next/link";
import { connection } from "next/server";
import { InvestorProfileQuestionnaire } from "@/components/profile/InvestorProfileQuestionnaire";
import { listInvestorProfiles } from "@/lib/investor-profile-queries";
import {
  BAND_SHORT_LABELS, PROFILE_LABELS, RESULT_EXPLANATIONS,
  formatProfileDate, type RiskBand,
} from "@/lib/investor-profile";


export const metadata = { title: "Mi perfil de inversionista · Brújula Financiera IA" };

const GOALS: Record<string, string> = {
  preserve: "Proteger el capital",
  income: "Obtener ingresos periódicos",
  growth: "Crecimiento a largo plazo",
  mixed: "Objetivos combinados",
};
const BAND_GUIDANCE: Record<RiskBand,string> = {
  low: "Suele ser más importante proteger liquidez y evitar asumir pérdidas que no podrías tolerar. No significa que una inversión concreta sea segura.",
  medium: "Suele ser coherente estudiar diversificación, horizonte y capacidad de soportar caídas temporales. No convierte un ETF en una recomendación.",
  high: "Puedes sentirte cómodo con fluctuaciones mayores, pero seguirás necesitando un horizonte y una capacidad financiera compatibles. Tolerar riesgo no obliga a tomarlo.",
};
const EXPERIENCE: Record<string, string> = {
  none: "Sin experiencia previa",
  basic: "Básica",
  intermediate: "Intermedia",
  advanced: "Avanzada",
};

function BandCard({
  title, score, maximum, band,
}: Readonly<{
  title: string; score: number | null; maximum: number; band: RiskBand | null;
}>) {
  return (
    <article className="panel profile-band-card">
      <p>{title}</p>
      <strong>{band ? BAND_SHORT_LABELS[band] : "No determinada"}</strong>
      <span>{score === null ? "Información insuficiente" : score + " / " + maximum + " puntos"}</span>
    </article>
  );
}

export default async function InvestorProfilePage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ id?: string; notice?: string }> }>) {
  await connection();
  const { id, notice } = await searchParams;
  const history = await listInvestorProfiles();
  const selected = history.status === "ready"
    ? (id ? history.rows.find((row) => row.id === id) : history.rows[0])
    : undefined;

  return (
    <section aria-labelledby="screen-title">
      <header className="intro">
        <p className="eyebrow">Tu punto de partida</p>
        <h1 id="screen-title">Mi perfil de inversionista.</h1>
        <p>
          Comprende cuánto riesgo podrías asumir según tu situación financiera
          y cuánto riesgo te sientes cómodo tolerando. Son dimensiones distintas.
        </p>
      </header>

      {notice === "incomplete" && <div className="info" role="alert">
        Completa todas las preguntas. En las preguntas sensibles puedes elegir
        «Prefiero no responder»; en ese caso no asignaremos un perfil global.
      </div>}
      {notice === "privacy" && <div className="info" role="alert">
        Confirma que has leído el aviso de privacidad para guardar tus respuestas.
      </div>}
      {notice === "save" && <div className="info" role="alert">
        No se pudo guardar la evaluación. Comprueba que BF-039 esté habilitada
        en Supabase y vuelve a intentarlo.
      </div>}

      {history.status === "error" && <div className="info" role="alert">
        {history.message} La migración de BF-039 puede estar pendiente o el acceso requiere revisión. Por ahora puedes revisar el cuestionario, pero el guardado está deshabilitado.
      </div>}

      {selected && (
        <section className="profile-result" aria-labelledby="profile-result-title">
          <div className="profile-result-header">
            <div>
              <p className="eyebrow">Evaluación guardada · v{selected.questionnaire_version}</p>
              <h2 id="profile-result-title">
                {selected.overall_band
                  ? PROFILE_LABELS[selected.overall_band]
                  : selected.profile_status === "incomplete"
                    ? "Perfil global no determinado"
                    : "Necesitamos revisar tus respuestas"}
              </h2>
              <p>Evaluado el {formatProfileDate(selected.created_at)}</p>
            </div>
            <span className="tag">
              {selected.profile_status === "complete" ? "Resultado completo"
                : selected.profile_status === "incomplete" ? "Información incompleta"
                  : "Revisión necesaria"}
            </span>
          </div>

          <div className="profile-band-grid">
            <BandCard title="Capacidad financiera" score={selected.capacity_score}
              maximum={12} band={selected.capacity_band}/>
            <BandCard title="Tolerancia emocional" score={selected.tolerance_score}
              maximum={8} band={selected.tolerance_band}/>
          </div>

          <div className="panel profile-interpretation">
            <h3>¿Qué significa este resultado?</h3>
            <p>{RESULT_EXPLANATIONS[selected.result_reason]}</p>{selected.overall_band && <><h4>¿Cómo leerlo?</h4><p>{BAND_GUIDANCE[selected.overall_band]}</p></>}
            {selected.overall_band && (
              <p>
                El perfil global se limita a la dimensión más restrictiva.
                Por eso, aunque una dimensión sea alta, no eleva automáticamente
                el resultado de la otra.
              </p>
            )}
            <p className="etf-meta">
              Objetivo declarado: {GOALS[selected.answers.goal] ?? "No disponible"} ·
              Experiencia: {EXPERIENCE[selected.answers.experience] ?? "No disponible"} ·
              Scoring v{selected.scoring_version}
            </p>
          </div>
          <p className="profile-disclaimer">
            Este resultado es una autoevaluación educativa, no una prueba
            regulatoria de idoneidad ni una recomendación de inversión.
          </p>
        </section>
      )}

      {history.status === "ready" && history.rows.length > 0 && (
        <section className="panel profile-history" aria-labelledby="profile-history-title">
          <div className="profile-history-heading">
            <h2 id="profile-history-title">Historial de evaluaciones</h2>
            <span className="tag">{history.rows.length} registro(s)</span>
          </div>
          <ul>
            {history.rows.map((row) => (
              <li key={row.id}>
                <Link href={"/perfil?id=" + row.id}>
                  {row.overall_band ? PROFILE_LABELS[row.overall_band]
                    : row.profile_status === "incomplete" ? "Perfil no determinado"
                      : "Revisar respuestas"}
                </Link>
                <span>{formatProfileDate(row.created_at)}</span>
                <span>Cuestionario v{row.questionnaire_version}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <details className="profile-questionnaire-details" open={!selected}>
        <summary>{selected ? "Volver a realizar el cuestionario" : "Completa tu primera evaluación"}</summary>
        <p className="profile-intro-note">
          Son 12 preguntas. Puedes volver a realizarlo cuando cambien tus objetivos
          o situación; cada evaluación se guarda como un registro independiente.
        </p>
        <InvestorProfileQuestionnaire disabled={history.status === "error"}/>
      </details>

      <div className="profile-next-step"><h2>Siguiente paso: define tu objetivo</h2><p>Tu perfil describe límites; tu objetivo define para qué quieres invertir. Ambos deben entenderse antes de comparar instrumentos.</p><Link href="/objetivo" className="primary-button">Definir mi objetivo</Link></div><div className="profile-next-step">
        <h2>¿Qué haremos con tu perfil?</h2>
        <p>
          En los siguientes incrementos servirá para contextualizar tus
          investigaciones y comparaciones. No elegirá inversiones por ti
          ni enviará tus respuestas a los asistentes externos.
        </p>
        <Link href="/comparador" className="etf-clear">Volver al comparador de ETF</Link>
      </div>
    </section>
  );
}
