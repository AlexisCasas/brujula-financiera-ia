
import type { EtfProfile } from "@/lib/etfs/catalog";
import type { EquityListing } from "@/lib/equities/types";

export const SESSION6_CASE = {
  initialPen: 1000,
  monthlyPen: 300,
  years: 10,
  risk: "Moderado (hipotético)",
  goal: "Construir patrimonio a largo plazo",
} as const;

export const SOURCE_GUIDES = {
  VWRA: [
    { label: "Ficha oficial Vanguard FTSE All-World (corte septiembre 2026)", url: "https://fund-docs.vanguard.com/FTSE_All-World_UCITS_ETF_USD_Accumulating_9679_INT_OFF_ETF_EN.pdf?domicile=IE", date: "2026-09-30" },
    { label: "Documento de información clave Vanguard", url: "https://fund-docs.vanguard.com/ie00bk5bqt80-en.pdf", date: null },
  ],
  FWRA: [
    { label: "Ficha oficial Invesco FTSE All-World (corte septiembre 2026)", url: "https://www.invesco.com/content/dam/invesco/uk/en/product-documents/etf/share-class/factsheet/IE000716YHJ7_factsheet_en-uk.pdf", date: "2026-09-30" },
    { label: "Documento de información clave Invesco", url: "https://www.invesco.com/content/dam/invesco/es/es/product-documents/etf/share-class/kid/IE000716YHJ7_kid_es-es.pdf", date: null },
  ],
  BAP: [
    { label: "Credicorp: resultados del tercer trimestre de 2026 (SEC)", url: "https://www.sec.gov/Archives/edgar/data/1001290/000100129026000011/credicorpltdex-9913q26ingls.htm", date: "2026-11-09" },
  ],
} as const;

export type TargetTicker = "VWRA" | "FWRA" | "BAP";
export type ResearchInstrument = {
  id: string;
  ticker: TargetTicker;
  isin: string;
  name: string;
  kind: "ETF" | "Acción";
  exchange: string;
  currency: string;
  issuer: string | null;
  indexName: string | null;
  distribution: string | null;
  domicile: string | null;
  ter: string | null;
  terSource: string | null;
  terDate: string | null;
  catalogSource: string | null;
  catalogDate: string | null;
  verification: string;
  evidenceUrls: string[];
};
export const TARGETS: readonly { ticker: TargetTicker; isin: string }[] = [
  { ticker: "VWRA", isin: "IE00BK5BQT80" },
  { ticker: "FWRA", isin: "IE000716YHJ7" },
  { ticker: "BAP", isin: "BMG2519Y1084" },
];

function safeHttps(url: string | null | undefined): string | null {
  if (!url) return null;
  try { return new URL(url).protocol === "https:" ? url : null; } catch { return null; }
}
export function makeResearchInstruments(etfs: readonly EtfProfile[], equities: readonly EquityListing[]): ResearchInstrument[] {
  const result: ResearchInstrument[] = [];
  for (const target of TARGETS) {
    if (target.ticker !== "BAP") {
      const p = etfs.find((row) => row.ticker === target.ticker && row.isin === target.isin);
      if (!p) continue;
      const ter = p.metrics.ter_percent;
      result.push({
        id: p.listingId, ticker: target.ticker, isin: p.isin, name: p.name, kind: "ETF",
        exchange: p.exchange, currency: p.currency, issuer: p.issuer,
        indexName: p.indexName, distribution: p.distributionPolicy, domicile: p.domicile,
        ter: ter?.availability === "disponible" && ter.value !== null ? ter.value : null,
        terSource: safeHttps(ter?.sourceUrl), terDate: ter?.sourceDate ?? null,
        catalogSource: null, catalogDate: null,
        verification: p.unverifiedCount === 0 ? "Identidad registrada" : "Hay campos pendientes de verificar",
        evidenceUrls: Array.from(new Set(p.evidence.map(e => safeHttps(e.sourceUrl)).filter((x): x is string => Boolean(x)))),
      });
    } else {
      const p = equities.find((row) => row.ticker === target.ticker && row.isin === target.isin);
      if (!p) continue;
      result.push({
        id: p.listing_id, ticker: target.ticker, isin: p.isin, name: p.name, kind: "Acción",
        exchange: p.exchange, currency: p.currency, issuer: p.issuer,
        indexName: null, distribution: null, domicile: null, ter: null, terSource: null, terDate: null,
        catalogSource: safeHttps(p.source_url), catalogDate: p.source_date || null,
        verification: p.listing_status === "unverified" ? "Negociación actual no verificada" : p.listing_status,
        evidenceUrls: safeHttps(p.source_url) ? [p.source_url] : [],
      });
    }
  }
  return result;
}
export const RESEARCH_FIELDS = [
  { key: "scope", label: "¿Qué estoy comprando?", prompt: "Describe la actividad empresarial, o qué índice replica el fondo." },
  { key: "drivers", label: "Factores que pueden influir", prompt: "Enumera variables de mercado o del negocio; distingue hechos de hipótesis." },
  { key: "risks", label: "Riesgos principales", prompt: "Incluye volatilidad, concentración, divisas o riesgos de negocio según aplique." },
  { key: "evidence", label: "Evidencias consultadas", prompt: "Anota documentos, fecha de consulta y qué información sustenta cada conclusión." },
  { key: "questions", label: "Preguntas pendientes", prompt: "¿Qué falta comprobar antes de evaluar este instrumento?" },
] as const;
export type ResearchField = typeof RESEARCH_FIELDS[number]["key"];
export type ResearchDraft = Record<ResearchField, string>;
export function emptyResearchDraft(): ResearchDraft {
  return { scope: "", drivers: "", risks: "", evidence: "", questions: "" };
}
export function researchCompletion(draft: ResearchDraft): number {
  return RESEARCH_FIELDS.filter(field => (draft[field.key] || "").trim().length >= 15).length;
}
export function researchMarkdown(instrument: ResearchInstrument, draft: ResearchDraft, date: string): string {
  const lines = [
    "# Sesión 6 · S6-01 · Ficha de investigación",
    "",
    "Instrumento: " + instrument.name + " (" + instrument.ticker + ")",
    "ISIN: " + instrument.isin + " | Bolsa: " + instrument.exchange + " | Moneda: " + instrument.currency,
    "Tipo: " + instrument.kind,
    "Corte de revisión: " + date,
    "Verificación: " + instrument.verification,
    "",
    "## Caso del taller",
    "Perfil hipotético: " + SESSION6_CASE.risk,
    "Capital inicial: S/ 1.000; aporte mensual: S/ 300; horizonte: 10 años.",
    "",
    ...RESEARCH_FIELDS.flatMap(field => ["## " + field.label, (draft[field.key] || "").trim() || "Pendiente de investigar", ""]),
    "## Documentos sugeridos por el laboratorio",
    ...SOURCE_GUIDES[instrument.ticker].map(s => "- " + s.label + ": " + s.url),
    "",
    "Investigación educativa; no equivale a recomendación ni a una compra.",
  ];
  return lines.join("\n");
}

export type CriterionId = "diversification" | "total_cost" | "risk" | "liquidity" | "broker" | "understanding";
export const BENCH_CRITERIA: readonly { id: CriterionId; label: string; defaultWeight: number; question: string }[] = [
  { id: "diversification", label: "Diversificación", defaultWeight: 25, question: "¿Qué exposición tiene el fondo y qué concentración debe verificarse?" },
  { id: "total_cost", label: "Costos totales", defaultWeight: 20, question: "Distingue TER, costos de negociación, FX e impuestos desconocidos." },
  { id: "risk", label: "Riesgo", defaultWeight: 20, question: "Considera volatilidad, riesgos y posibles pérdidas; no inventes drawdown." },
  { id: "liquidity", label: "Tamaño y liquidez", defaultWeight: 15, question: "¿Hay información sobre patrimonio y volumen o spread?" },
  { id: "broker", label: "Acceso mediante bróker", defaultWeight: 10, question: "¿Comprobaste si el instrumento y la bolsa están disponibles?" },
  { id: "understanding", label: "Facilidad de comprensión", defaultWeight: 10, question: "¿Entiendes su política, replicación y riesgos?" },
];
export type BenchAssessment = { score: number | null; justification: string };
export type BenchDraft = {
  weights: Record<CriterionId, number>;
  ratings: Record<CriterionId, Record<"VWRA" | "FWRA", BenchAssessment>>;
};
export function emptyBenchDraft(): BenchDraft {
  return {
    weights: Object.fromEntries(BENCH_CRITERIA.map(c => [c.id, c.defaultWeight])) as Record<CriterionId, number>,
    ratings: Object.fromEntries(BENCH_CRITERIA.map(c => [c.id, {
      VWRA: { score: null, justification: "" },
      FWRA: { score: null, justification: "" },
    }])) as BenchDraft["ratings"],
  };
}
export type BenchEvaluation =
  | { ready: false; weightTotal: number; remaining: number; reason: string }
  | { ready: true; weightTotal: 100; remaining: 0; scores: Record<"VWRA" | "FWRA", number>; higher: "VWRA" | "FWRA" | "Empate" };
export function evaluateBenchmark(draft: BenchDraft): BenchEvaluation {
  const weights = BENCH_CRITERIA.map(c => Number(draft.weights?.[c.id]));
  const total = weights.reduce((acc, value) => acc + (Number.isFinite(value) ? value : 0), 0);
  if (weights.some(w => !Number.isInteger(w) || w < 0 || w > 100) || total !== 100) {
    return { ready: false, weightTotal: total, remaining: 0, reason: "La suma de pesos debe ser exactamente 100 %, con valores enteros entre 0 y 100." };
  }
  let missing = 0;
  for (const criterion of BENCH_CRITERIA) {
    if (draft.weights[criterion.id] === 0) continue;
    for (const ticker of ["VWRA", "FWRA"] as const) {
      const rating = draft.ratings?.[criterion.id]?.[ticker];
      if (!rating || !Number.isInteger(rating.score) || rating.score! < 1 || rating.score! > 5 || rating.justification.trim().length < 15) missing++;
    }
  }
  if (missing > 0) return {
    ready: false, weightTotal: 100, remaining: missing,
    reason: "Faltan " + missing + " valoraciones o justificaciones (mínimo 15 caracteres) en criterios ponderados.",
  };
  const scores = { VWRA: 0, FWRA: 0 };
  for (const criterion of BENCH_CRITERIA) {
    for (const ticker of ["VWRA", "FWRA"] as const) {
      scores[ticker] += draft.weights[criterion.id] * (draft.ratings[criterion.id][ticker].score || 0) / 100;
    }
  }
  const rounded = { VWRA: Math.round(scores.VWRA * 100) / 100, FWRA: Math.round(scores.FWRA * 100) / 100 };
  return { ready: true, weightTotal: 100, remaining: 0, scores: rounded,
    higher: Math.abs(scores.VWRA - scores.FWRA) < 0.001 ? "Empate" : scores.VWRA > scores.FWRA ? "VWRA" : "FWRA" };
}
export function benchmarkMarkdown(draft: BenchDraft, date: string): string {
  const evaluation = evaluateBenchmark(draft);
  const lines = [
    "# Sesión 6 · S6-02 · Matriz de benchmarking",
    "",
    "Caso: S/ 1.000 inicial, S/ 300 mensual, horizonte de 10 años, perfil moderado hipotético.",
    "Comparación homogénea: VWRA (IE00BK5BQT80) vs FWRA (IE000716YHJ7).",
    "Corte: " + date, "",
  ];
  for (const c of BENCH_CRITERIA) {
    lines.push("## " + c.label + " (" + draft.weights[c.id] + " %)");
    for (const ticker of ["VWRA", "FWRA"] as const) {
      const v = draft.ratings[c.id][ticker];
      lines.push("- " + ticker + " (" + (v.score ?? "pendiente") + "/5): " + (v.justification.trim() || "Pendiente"));
    }
  }
  lines.push("", evaluation.ready ?
    "Puntuaciones según criterio del estudiante: VWRA " + evaluation.scores.VWRA + "/5, FWRA " + evaluation.scores.FWRA + "/5." :
    "Matriz aún no evaluable: " + evaluation.reason,
    "Las puntuaciones reflejan valoraciones educativas del usuario; no rentabilidades, recomendación ni asesoría.",
    "Fuentes sugeridas: " + SOURCE_GUIDES.VWRA[0].url + " ; " + SOURCE_GUIDES.FWRA[0].url);
  return lines.join("\n");
}
