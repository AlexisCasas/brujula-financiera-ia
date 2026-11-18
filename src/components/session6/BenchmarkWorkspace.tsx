
"use client";
import { useEffect, useState } from "react";
import {
  BENCH_CRITERIA, SESSION6_CASE, SOURCE_GUIDES, benchmarkMarkdown, emptyBenchDraft, evaluateBenchmark,
  type BenchDraft, type CriterionId, type ResearchInstrument,
} from "@/lib/session6/logic";

const STORAGE_KEY = "brujula-s6-benchmark-v1";
type Ticker = "VWRA" | "FWRA";
const TICKERS: readonly Ticker[] = ["VWRA", "FWRA"];
function downloadReport(report: string) {
  const blob = new Blob([report], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = "S6-02-Benchmarking-VWRA-FWRA.md"; anchor.click(); URL.revokeObjectURL(url);
}
export function BenchmarkWorkspace({ instruments, asOf }: Readonly<{ instruments: ResearchInstrument[]; asOf: string }>) {
  const [draft, setDraft] = useState<BenchDraft>(emptyBenchDraft);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<BenchDraft>;
        const next = emptyBenchDraft();
        for (const c of BENCH_CRITERIA) {
          const w = Number(saved.weights?.[c.id]);
          if (Number.isInteger(w) && w >= 0 && w <= 100) next.weights[c.id] = w;
          for (const ticker of TICKERS) {
            const entry = saved.ratings?.[c.id]?.[ticker];
            if (entry && typeof entry.justification === "string") {
              next.ratings[c.id][ticker] = {
                score: Number.isInteger(entry.score) && entry.score! >= 1 && entry.score! <= 5 ? entry.score : null,
                justification: entry.justification.slice(0, 1000),
              };
            }
          }
        }
        setDraft(next);
      }
    } catch { /* optional local draft */ }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) { try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch { /* optional */ } }
  }, [draft, loaded]);
  const result = evaluateBenchmark(draft);
  const profiles = TICKERS.map(ticker => instruments.find(x => x.ticker === ticker));
  if (profiles.some(p => !p)) return <div className="info" role="alert">Faltan VWRA o FWRA en el catálogo. No se crearán instrumentos de demostración ficticios.</div>;

  function weightChange(id: CriterionId, value: string) {
    const weight = value === "" ? 0 : Number(value);
    setDraft(prev => ({ ...prev, weights: { ...prev.weights, [id]: Number.isFinite(weight) ? Math.min(100, Math.max(0, Math.floor(weight))) : 0 } }));
  }
  function ratingChange(id: CriterionId, ticker: Ticker, key: "score" | "justification", value: string) {
    setDraft(prev => ({
      ...prev, ratings: { ...prev.ratings,
        [id]: { ...prev.ratings[id],
          [ticker]: { ...prev.ratings[id][ticker], [key]: key === "score" ? (value ? Number(value) : null) : value },
        },
      },
    }));
  }
  function reset() {
    if (!window.confirm("¿Restablecer pesos y borrar todas las calificaciones del ejercicio?")) return;
    setDraft(emptyBenchDraft());
  }
  const link = "/comparador?" + new URLSearchParams(profiles.map(p => ["listing", p!.id] as [string,string])).toString();
  return <div className="s6-layout">
    <section className="panel s6-case">
      <div><p className="eyebrow">Caso guiado · Sesión 6</p><h2>¿Cómo elegir qué alternativa investigar más?</h2>
        <p>Se comparan dos ETF globales equivalentes en propósito. BAP se estudia por separado en S6-01 porque una acción individual no es un ETF diversificado.</p></div>
      <div className="s6-case-stats"><span><strong>S/ {SESSION6_CASE.initialPen.toLocaleString("es-PE")}</strong>Inicial</span><span><strong>S/ {SESSION6_CASE.monthlyPen}</strong>Mensual</span><span><strong>{SESSION6_CASE.years} años</strong>Horizonte</span></div>
    </section>
    <section className="panel">
      <div className="s6-title-row"><div><p className="eyebrow">Datos existentes, no puntuaciones</p><h2>1. Compara la identidad y los costos documentados</h2></div><a href={link} className="etf-clear">Abrir comparador de datos ↗</a></div>
      <div role="region" aria-label="Atributos documentados de los ETF" tabIndex={0} className="table-scroll">
        <table className="s6-fact-table"><thead><tr><th>Atributo</th>{profiles.map(p => <th key={p!.id}>{p!.ticker}</th>)}</tr></thead>
          <tbody>
            <tr><th>ISIN</th>{profiles.map(p => <td key={p!.id}>{p!.isin}</td>)}</tr>
            <tr><th>Índice</th>{profiles.map(p => <td key={p!.id}>{p!.indexName || "No documentado"}</td>)}</tr>
            <tr><th>Distribución</th>{profiles.map(p => <td key={p!.id}>{p!.distribution === "accumulating" ? "Acumulación" : p!.distribution || "No disponible"}</td>)}</tr>
            <tr><th>TER</th>{profiles.map(p => <td key={p!.id}>{p!.ter === null ? "No disponible" : p!.ter + " %"}</td>)}</tr>
            <tr><th>Bolsa · moneda</th>{profiles.map(p => <td key={p!.id}>{p!.exchange} · {p!.currency}</td>)}</tr>
          </tbody>
        </table>
      </div>
      <p className="s6-fine">No rellenamos liquidez, rendimientos, costos de bróker o métricas históricas sin datos homogéneos.</p>
      <div className="s6-source-mini">{TICKERS.map(ticker => <a key={ticker} target="_blank" rel="noopener noreferrer" href={SOURCE_GUIDES[ticker][0].url}>Documento oficial {ticker} ↗</a>)}</div>
    </section>
    <section className="panel">
      <p className="eyebrow">S6-02 · Matriz ponderada</p>
      <h2>2. Evalúa los criterios con tu evidencia</h2>
      <p><strong>Escala educativa:</strong> 1 = poco favorable para el caso, 3 = intermedio, 5 = muy favorable. No equivale a rendimiento esperado ni recomienda un producto.</p>
      <div className="s6-total" role="status"><strong>Pesos: {result.weightTotal} % / 100 %</strong>
        <span className={result.weightTotal === 100 ? "tag ok" : "tag"}>{result.weightTotal === 100 ? "Distribución válida" : "Ajustar ponderaciones"}</span>
      </div>
      <div role="region" aria-label="Matriz de benchmarking editable" tabIndex={0} className="table-scroll s6-matrix-scroll">
        <table className="s6-matrix">
          <thead><tr><th scope="col">Criterio y peso</th><th scope="col">VWRA: puntuación y sustento</th><th scope="col">FWRA: puntuación y sustento</th></tr></thead>
          <tbody>{BENCH_CRITERIA.map(c => <tr key={c.id}>
            <th scope="row"><span>{c.label}</span><small>{c.question}</small>
              <label className="s6-weight">Peso (%) <input type="number" min="0" max="100" step="1" aria-label={"Peso de " + c.label} value={draft.weights[c.id]} onChange={e=>weightChange(c.id,e.target.value)}/></label></th>
            {TICKERS.map(ticker => <td key={ticker}><label className="s6-score-label">
              <span>Calificación {ticker}</span>
              <select aria-label={ticker + ": puntuación de " + c.label} value={draft.ratings[c.id][ticker].score ?? ""}
                onChange={e=>ratingChange(c.id,ticker,"score",e.target.value)}>
                <option value="">Sin evaluar</option>{[1,2,3,4,5].map(i => <option key={i} value={i}>{i}/5</option>)}
              </select></label>
              <label className="s6-justify"><span>Evidencia / justificación</span>
                <textarea rows={3} maxLength={1000} value={draft.ratings[c.id][ticker].justification}
                  aria-label={ticker + ": justificación de " + c.label}
                  onChange={e=>ratingChange(c.id,ticker,"justification",e.target.value)}
                  placeholder="Documento, fecha y argumento. No inventes datos." /></label></td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </section>
    <section className="panel s6-result" aria-labelledby="s6-result-heading">
      <div className="s6-title-row"><div><p className="eyebrow">Resultado sujeto a evidencia</p><h2 id="s6-result-heading">3. Interpretación del ejercicio</h2></div></div>
      {result.ready ? <div>
        <div className="s6-scores"><div><span>VWRA</span><strong>{result.scores.VWRA.toFixed(2)} / 5</strong></div><div><span>FWRA</span><strong>{result.scores.FWRA.toFixed(2)} / 5</strong></div></div>
        <p>Mayor valoración según tus respuestas: <strong>{result.higher}</strong>. La matriz es subjetiva y cambiar los pesos o investigar nuevos datos puede modificar el resultado.</p>
        <p><strong>No es una recomendación de compra.</strong> Antes de decidir, verifica disponibilidad en el bróker, costos reales y riesgos no incluidos.</p>
      </div> : <div className="info" role="status"><strong>Resultado pendiente</strong><p>{result.reason}</p>
        <p>No asignamos puntuaciones por defecto ni proclamamos una alternativa ganadora con información incompleta.</p></div>}
      <div className="s6-actions"><button className="primary-button" type="button" onClick={()=>downloadReport(benchmarkMarkdown(draft,asOf))}>Exportar matriz (.md)</button>
        <button type="button" className="s6-secondary" onClick={reset}>Restablecer ejercicio</button>
        <small className="s6-fine">{loaded ? "Borrador guardado solo en este navegador" : "Cargando borrador..."}</small></div>
    </section>
  </div>;
}
