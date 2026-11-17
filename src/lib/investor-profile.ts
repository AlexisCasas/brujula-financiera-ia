export const QUESTIONNAIRE_VERSION = "1.0";
export const SCORING_VERSION = "1.0";

export const ANSWER_KEYS = [
  "horizon", "withdrawal", "emergency_fund", "income_stability",
  "capital_dependency", "high_cost_debt", "drop_10", "drop_20",
  "drop_30", "emotional_reaction", "goal", "experience",
] as const;

export type AnswerKey = (typeof ANSWER_KEYS)[number];
export type InvestorAnswers = {
  horizon: "under_1y" | "1_3y" | "3_5y" | "5_10y" | "over_10y";
  withdrawal: "under_1y" | "1_3y" | "over_3y";
  emergency_fund: "under_1m" | "1_3m" | "over_3m" | "prefer_not";
  income_stability: "variable" | "mixed" | "stable";
  capital_dependency: "essential" | "partial" | "not_needed";
  high_cost_debt: "yes" | "no" | "unsure";
  drop_10: "sell_all" | "reduce" | "hold" | "buy_more";
  drop_20: "sell_all" | "reduce" | "hold" | "buy_more";
  drop_30: "sell_all" | "reduce" | "hold" | "buy_more";
  emotional_reaction: "very_anxious" | "concerned_wait" | "comfortable";
  goal: "preserve" | "income" | "growth" | "mixed";
  experience: "none" | "basic" | "intermediate" | "advanced";
};

export type RiskBand = "low" | "medium" | "high";
export type ProfileStatus = "complete" | "incomplete" | "review_needed";
export type ResultReason =
  | "aligned" | "capacity_limited" | "tolerance_limited"
  | "incomplete" | "review_needed";

export type InvestorProfileAssessment = {
  questionnaireVersion: string;
  scoringVersion: string;
  status: ProfileStatus;
  capacityScore: number | null;
  capacityBand: RiskBand | null;
  toleranceScore: number;
  toleranceBand: RiskBand;
  overallBand: RiskBand | null;
  reason: ResultReason;
};

const OPTIONS: Record<AnswerKey, readonly string[]> = {
  horizon: ["under_1y", "1_3y", "3_5y", "5_10y", "over_10y"],
  withdrawal: ["under_1y", "1_3y", "over_3y"],
  emergency_fund: ["under_1m", "1_3m", "over_3m", "prefer_not"],
  income_stability: ["variable", "mixed", "stable"],
  capital_dependency: ["essential", "partial", "not_needed"],
  high_cost_debt: ["yes", "no", "unsure"],
  drop_10: ["sell_all", "reduce", "hold", "buy_more"],
  drop_20: ["sell_all", "reduce", "hold", "buy_more"],
  drop_30: ["sell_all", "reduce", "hold", "buy_more"],
  emotional_reaction: ["very_anxious", "concerned_wait", "comfortable"],
  goal: ["preserve", "income", "growth", "mixed"],
  experience: ["none", "basic", "intermediate", "advanced"],
};

export function parseInvestorAnswers(raw: Record<string, unknown>):
  | { ok: true; answers: InvestorAnswers }
  | { ok: false; missing: AnswerKey[]; reason?: "missing_or_invalid" | "extra_fields" } {
  const extraKeys = Object.keys(raw).filter((key) => !ANSWER_KEYS.includes(key as AnswerKey));
  const missing = ANSWER_KEYS.filter((key) =>
    typeof raw[key] !== "string" || !OPTIONS[key].includes(raw[key] as string),
  );
  if (extraKeys.length > 0) return { ok: false, missing: [], reason: "extra_fields" };
  if (missing.length > 0) return { ok: false, missing, reason: "missing_or_invalid" };
  return { ok: true, answers: raw as InvestorAnswers };
}

const CAPACITY_POINTS: Record<string, number> = {
  under_1y: 0, "1_3y": 0, "3_5y": 1, "5_10y": 2, over_10y: 2,
  under_1m: 0, "1_3m": 1, over_3m: 2,
  variable: 0, mixed: 1, stable: 2,
  essential: 0, partial: 1, not_needed: 2,
  yes: 0, no: 2,
};

const TOLERANCE_POINTS: Record<string, number> = {
  sell_all: 0, reduce: 1, hold: 2, buy_more: 2,
  very_anxious: 0, concerned_wait: 1, comfortable: 2,
};

function capacityBand(score: number): RiskBand {
  if (score <= 4) return "low";
  if (score <= 8) return "medium";
  return "high";
}

function toleranceBand(score: number): RiskBand {
  if (score <= 2) return "low";
  if (score <= 5) return "medium";
  return "high";
}

const BAND_RANK: Record<RiskBand, number> = { low: 0, medium: 1, high: 2 };

function dropScore(value: InvestorAnswers["drop_10"]): number {
  return TOLERANCE_POINTS[value];
}

export function assessInvestorProfile(answers: InvestorAnswers): InvestorProfileAssessment {
  const capacityUnknown = answers.emergency_fund === "prefer_not" ||
    answers.high_cost_debt === "unsure";

  const capacityScore = capacityUnknown ? null : (
    CAPACITY_POINTS[answers.horizon] +
    CAPACITY_POINTS[answers.withdrawal] +
    CAPACITY_POINTS[answers.emergency_fund] +
    CAPACITY_POINTS[answers.income_stability] +
    CAPACITY_POINTS[answers.capital_dependency] +
    CAPACITY_POINTS[answers.high_cost_debt]
  );

  const toleranceScore =
    dropScore(answers.drop_10) +
    dropScore(answers.drop_20) +
    dropScore(answers.drop_30) +
    TOLERANCE_POINTS[answers.emotional_reaction];

  const tolerance = toleranceBand(toleranceScore);
  const capacity = capacityScore === null ? null : capacityBand(capacityScore);
  const inconsistent = dropScore(answers.drop_10) < dropScore(answers.drop_20) ||
    dropScore(answers.drop_20) < dropScore(answers.drop_30);

  if (capacity === null) {
    return {
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      scoringVersion: SCORING_VERSION,
      status: "incomplete",
      capacityScore: null,
      capacityBand: null,
      toleranceScore,
      toleranceBand: tolerance,
      overallBand: null,
      reason: "incomplete",
    };
  }

  if (inconsistent) {
    return {
      questionnaireVersion: QUESTIONNAIRE_VERSION,
      scoringVersion: SCORING_VERSION,
      status: "review_needed",
      capacityScore,
      capacityBand: capacity,
      toleranceScore,
      toleranceBand: tolerance,
      overallBand: null,
      reason: "review_needed",
    };
  }

  const overallBand = BAND_RANK[capacity] <= BAND_RANK[tolerance] ? capacity : tolerance;
  const reason: ResultReason = capacity === tolerance
    ? "aligned"
    : BAND_RANK[capacity] < BAND_RANK[tolerance]
      ? "capacity_limited" : "tolerance_limited";

  return {
    questionnaireVersion: QUESTIONNAIRE_VERSION,
    scoringVersion: SCORING_VERSION,
    status: "complete",
    capacityScore,
    capacityBand: capacity,
    toleranceScore,
    toleranceBand: tolerance,
    overallBand,
    reason,
  };
}

export const PROFILE_LABELS: Record<RiskBand, string> = {
  low: "Conservador · riesgo bajo",
  medium: "Moderado · riesgo medio",
  high: "Agresivo · riesgo alto",
};

export const BAND_SHORT_LABELS: Record<RiskBand, string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto",
};

export const RESULT_EXPLANATIONS: Record<ResultReason, string> = {
  aligned: "Tu capacidad financiera y tu tolerancia emocional se encuentran en el mismo nivel. Ambas dimensiones coinciden en esta autoevaluación.",
  capacity_limited: "Tu disposición emocional parece mayor que tu capacidad financiera. El perfil global se limita por el horizonte, la liquidez o los compromisos que declaraste.",
  tolerance_limited: "Tu situación podría permitir asumir más variación, pero tu comodidad ante las pérdidas es el límite relevante. No es necesario forzar un perfil más agresivo.",
  incomplete: "No podemos determinar la capacidad financiera con la información disponible. Puedes completar las preguntas sensibles o mantenerlas sin responder; no asignaremos un perfil global por defecto.",
  review_needed: "Tus respuestas ante caídas de distinta magnitud no siguen una progresión coherente. Revisa esos escenarios antes de asignar un perfil global.",
};

export function formatProfileDate(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-PE", {
    dateStyle: "long", timeStyle: "short", timeZone: "America/Lima",
  }).format(date);
}
