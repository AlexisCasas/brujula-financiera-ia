
"use client";
import { useEffect, useState } from "react";
import {
  RESEARCH_FIELDS, SESSION6_CASE, SOURCE_GUIDES, emptyResearchDraft, researchCompletion, researchMarkdown,
  type ResearchDraft, type ResearchField, type ResearchInstrument, type TargetTicker,
} from "@/lib/session6/logic";

const STORAGE_KEY = "brujula-s6-research-v1";
type DraftCollection = Record<TargetTicker, ResearchDraft>;
function emptyAll(): DraftCollection {
  return { VWRA: emptyResearchDraft(), FWRA: emptyResearchDraft(), BAP: emptyResearchDraft() };
}
function saveMarkdown(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
export function ResearchWorkspace({ instruments, asOf }: Readonly<{ instruments: ResearchInstrument[]; asOf: string }>) {
  const [selected, setSelected] = useState<TargetTicker>("VWRA");
  const [drafts, setDrafts] = useState<DraftCollection>(emptyAll);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const task = window.setTimeout(() => {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<DraftCollection>;
          const next = emptyAll();
          for (const ticker of ["VWRA", "FWRA", "BAP"] as const) {
            for (const field of RESEARCH_FIELDS) {
              const value = parsed?.[ticker]?.[field.key];
              if (typeof value === "string") next[ticker][field.key] = value.slice(0, 2000);
            }
          }
          setDrafts(next);
        }
      } catch { /* no draft available */ }
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(task);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts)); } catch { /* optional browser persistence */ }
  }, [drafts, loaded]);
  const instrument = instruments.find(p => p.ticker === selected) ?? instruments[0];
  if (!instrument) return <div className="info" role="alert">Los tres instrumentos del caso todavía no están disponibles en el catálogo autenticado.</div>;
  const draft = drafts[instrument.ticker];
  const progress = researchCompletion(draft);
  function change(field: ResearchField, value: string) {
    setDrafts(prev => ({ ...prev, [instrument.ticker]: { ...prev[instrument.ticker], [field]: value } }));
  }
  function reset() {
    if (!window.confirm("¿Vaciar el borrador local de " + instrument.ticker + "?")) return;
    setDrafts(prev => ({ ...prev, [instrument.ticker]: emptyResearchDraft() }));
  }
  return <div className="s6-layout">
    <section className="panel s6-case" aria-labelledby="s6-case-heading">
      <div><p className="eyebrow">Caso guiado · Sesión 6</p><h2 id="s6-case-heading">Mi primera inversión: investigar antes de elegir</h2>
        <p>Perfil moderado hipotético · {SESSION6_CASE.goal}. No se presupone que los estudiantes ya posean estos activos.</p></div>
      <div className="s6-case-stats"><span><strong>S/ 1.000</strong>Capital inicial</span><span><strong>S/ 300</strong>Aporte mensual</span><span><strong>10 años</strong>Horizonte</span></div>
    </section>
    <section className="panel s6-intro">
      <h2>1. Elige qué investigar</h2>
      <p>VWRA y FWRA son ETF globales comparables. BAP es una acción individual: sirve para investigar una empresa, no para puntuarla como si fuera un ETF global.</p>
      <div role="group" aria-label="Instrumentos del caso" className="s6-tabs">
        {instruments.map(p => <button key={p.id} type="button" className={p.ticker === instrument.ticker ? "s6-tab active" : "s6-tab"}
          aria-pressed={p.ticker === instrument.ticker} onClick={() => setSelected(p.ticker)}>{p.ticker}<span>{p.kind}</span></button>)}
      </div>
    </section>
    <section className="panel" aria-labelledby="s6-facts-title">
      <div className="s6-title-row"><div><p className="eyebrow">Datos del catálogo · {asOf}</p><h2 id="s6-facts-title">{instrument.ticker} · {instrument.name}</h2></div><span className="tag">{instrument.kind}</span></div>
      <dl className="s6-facts">
        <div><dt>Identificación</dt><dd>{instrument.isin}</dd></div>
        <div><dt>Mercado y moneda</dt><dd>{instrument.exchange} · {instrument.currency}</dd></div>
        <div><dt>Gestora / emisor</dt><dd>{instrument.issuer || "No disponible"}</dd></div>
        <div><dt>Índice / actividad</dt><dd>{instrument.kind === "ETF" ? instrument.indexName || "No documentado" : "Investigar modelo de negocio y segmentos"}</dd></div>
        <div><dt>Dividendos</dt><dd>{instrument.kind === "ETF" ? instrument.distribution === "accumulating" ? "Acumulación" : instrument.distribution === "distributing" ? "Distribución" : "Sin validar" : "Consultar declaración de la empresa"}</dd></div>
        <div><dt>TER documentado</dt><dd>{instrument.kind === "ETF" ? instrument.ter !== null ? instrument.ter + " %" : "No disponible" : "No aplica a una acción"}</dd></div>
        <div><dt>Estado de verificación</dt><dd>{instrument.verification}</dd></div>
      </dl>
      {instrument.terSource && <p className="s6-fine">TER: <a href={instrument.terSource} target="_blank" rel="noopener noreferrer">consultar documento original</a>{instrument.terDate ? " · " + instrument.terDate : ""}.</p>}
      <p className="s6-fine">Los datos identifican el instrumento, pero no equivalen a un precio actual ni a una valoración de inversión.</p>
    </section>
    <section className="panel s6-source-panel" aria-labelledby="s6-source-title">
      <h2 id="s6-source-title">2. Documentos para verificar</h2>
      <p>Estas son fuentes primarias para consultar. No completamos las respuestas de la investigación por ti.</p>
      <ul>{SOURCE_GUIDES[instrument.ticker].map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a><small>{source.date ? "Corte: " + source.date : "Revisar fecha en el documento"}</small></li>)}
        {instrument.catalogSource && <li><a href={instrument.catalogSource} target="_blank" rel="noopener noreferrer">Evidencia de identidad del catálogo ↗</a><small>{instrument.catalogDate || "Sin fecha"}</small></li>}
      </ul>
      {instrument.evidenceUrls.length > 0 && <details><summary>Otras fuentes registradas en Brújula ({instrument.evidenceUrls.length})</summary><ul>{instrument.evidenceUrls.map(url => <li key={url}><a target="_blank" rel="noopener noreferrer" href={url}>{url} ↗</a></li>)}</ul></details>}
    </section>
    <section className="panel" aria-labelledby="s6-form-title">
      <div className="s6-title-row"><div><p className="eyebrow">Ficha del estudiante · S6-01</p><h2 id="s6-form-title">3. Construye tu investigación</h2></div><span className="tag">{progress}/{RESEARCH_FIELDS.length} campos desarrollados</span></div>
      <p>Escribe tus propios hallazgos, vinculando afirmaciones con una fuente y su fecha. Los campos se guardan únicamente en este navegador.</p>
      <div className="s6-form-fields">
        {RESEARCH_FIELDS.map(field => <label key={field.key} htmlFor={"s6-" + field.key} className="s6-field">
          <strong>{field.label}</strong><span>{field.prompt}</span>
          <textarea id={"s6-" + field.key} value={draft[field.key]} maxLength={2000} rows={4}
            onChange={e => change(field.key, e.target.value)} placeholder="Escribe tu explicación y registra la evidencia consultada..."/>
        </label>)}
      </div>
      <div className="s6-actions"><button type="button" className="primary-button" onClick={() => saveMarkdown("S6-01-" + instrument.ticker + ".md", researchMarkdown(instrument, draft, asOf))}>Exportar ficha (.md)</button>
        <button type="button" className="s6-secondary" onClick={reset}>Vaciar esta ficha</button>
        <span className="s6-fine" role="status">{loaded ? "Borrador local de este navegador (no sincronizado)" : "Cargando borrador…"}</span></div>
    </section>
    <div className="info">Consejo docente: antes de calificar un instrumento, comprueba identidad, fuentes, riesgo y datos faltantes.
      <a className="s6-inline-link" href="/investigaciones/benchmarking">Continuar con S6-02 →</a></div>
  </div>;
}
