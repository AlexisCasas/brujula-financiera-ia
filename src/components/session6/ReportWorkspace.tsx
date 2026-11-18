
"use client";
import Link from "next/link";
import {
 BENCH_CRITERIA, RESEARCH_FIELDS, SESSION6_CASE, SOURCE_GUIDES, TARGETS,
 evaluateBenchmark, type TargetTicker
} from "@/lib/session6/logic";
import { createReportMarkdown, evaluateScenarios, evidenceFlags, stableChoice } from "@/lib/session6/analysis";
import { useSession6Workshop } from "@/components/session6/useSession6Workshop";

const TICKERS=["VWRA","FWRA"] as const;
function downloadMarkdown(text:string){
 const blob=new Blob([text],{type:"text/markdown;charset=utf-8"});
 const url=URL.createObjectURL(blob);
 const anchor=document.createElement("a");
 anchor.href=url;anchor.download="S6-04-Informe-Ejecutivo-VWRA-FWRA.md";anchor.click();
 window.setTimeout(()=>URL.revokeObjectURL(url),500);
}
function prettyDate(){
 return new Intl.DateTimeFormat("es-PE",{day:"2-digit",month:"long",year:"numeric",timeZone:"America/Lima"}).format(new Date());
}
export function ReportWorkspace(){
 const {benchmark,research,review,loaded,notice,importBenchmark,importResearch}=useSession6Workshop();
 const scores=evaluateBenchmark(benchmark);
 const scenarios=evaluateScenarios(benchmark);
 const flags=evidenceFlags(benchmark);
 const missingResearch=TARGETS.filter(t=>!RESEARCH_FIELDS.some(f=>research[t.ticker][f.key].trim().length>=15));
 const conclusion=review.choice==="pending"?"Seguir investigando":"Priorizar "+review.choice+" para investigar; no comprar";
 function exportReport(){
  downloadMarkdown(createReportMarkdown({benchmark,research,review,date:prettyDate()}));
 }
 return <div className="s6-layout">
  <section className="panel s6-report-toolbar">
   <p className="eyebrow">Trabajo final de la sesión 6</p><h2>Preparar el informe comparativo</h2>
   <p>La vista integra la matriz S6-02, la evaluación S6-03 y las fichas S6-01 guardadas en el mismo navegador. Si trabajaste en otro Preview, importa los archivos Markdown exportados.</p>
   <div className="s6-import-row">
    <label>Importar matriz S6-02 (.md)<input type="file" accept=".md,.txt,text/markdown,text/plain" onChange={e=>{void importBenchmark(e.target.files?.[0]);e.target.value="";}}/></label>
    <label>Importar ficha S6-01 (.md)<input type="file" accept=".md,.txt,text/markdown,text/plain" onChange={e=>{void importResearch(e.target.files?.[0]);e.target.value="";}}/></label>
   </div>
   <p role="status" className="s6-fine">{notice|| (loaded?"Los borradores del navegador están cargados.":"Cargando información local…")}</p>
   <div className="s6-actions"><button type="button" className="primary-button" onClick={exportReport}>Descargar informe Markdown</button>
    <button type="button" className="s6-secondary" onClick={()=>window.print()}>Imprimir / Guardar PDF</button>
    <Link href="/investigaciones/evaluacion" className="s6-secondary">Revisar S6-03</Link></div>
  </section>
  <article className="s6-print panel" aria-labelledby="s6-report-title">
   <div className="s6-report-head"><p className="eyebrow">Brújula Financiera IA · Taller académico</p>
    <h2 id="s6-report-title">Informe ejecutivo de investigación comparativa</h2>
    <p>Sesión 6 · S6-04 · VWRA vs. FWRA</p></div>
   <section><h3>1. Objetivo y contexto</h3>
    <p>Un inversionista principiante peruano evalúa alternativas para construir patrimonio a largo plazo, con un perfil moderado <strong>hipotético</strong>.</p>
    <div className="s6-report-facts"><span><strong>S/ 1.000</strong>Capital inicial</span><span><strong>S/ 300</strong>Aporte mensual</span><span><strong>10 años</strong>Horizonte</span></div>
    <p>VWRA (IE00BK5BQT80) y FWRA (IE000716YHJ7) son los instrumentos comparables. Credicorp BAP (BMG2519Y1084) se investiga como empresa individual y no participa en esta clasificación.</p>
   </section>
   <section><h3>2. Resumen ejecutivo</h3>
    {scores.ready?<p>Resultado del ejercicio: <strong>VWRA {scores.scores.VWRA.toFixed(2)}/5</strong> y <strong>FWRA {scores.scores.FWRA.toFixed(2)}/5</strong>. Mayor valoración según las ponderaciones del estudiante: <strong>{scores.higher}</strong>.</p>
     :<p className="s6-report-warning">Matriz aún no evaluable: {scores.reason}</p>}
    <p><strong>Conclusión del estudiante:</strong> {conclusion}.</p>
    <p>{review.argument.trim()||"Pendiente: redactar la justificación de la conclusión en S6-03."}</p>
   </section>
   <section><h3>3. Metodología y matriz</h3>
    <p>Se aplicó una suma ponderada de seis criterios, con notas de 1 a 5 y pesos que suman 100 %. Las calificaciones expresan un juicio didáctico y no una rentabilidad esperada.</p>
    <div className="table-scroll" role="region" aria-label="Matriz del informe" tabIndex={0}><table className="s6-fact-table">
     <thead><tr><th>Criterio</th><th>Peso</th><th>VWRA</th><th>FWRA</th></tr></thead>
     <tbody>{BENCH_CRITERIA.map(c=><tr key={c.id}><th scope="row">{c.label}</th><td>{benchmark.weights[c.id]} %</td>
      {TICKERS.map(t=><td key={t}>{benchmark.ratings[c.id][t].score??"Sin calificar"}/5</td>)}</tr>)}</tbody>
    </table></div>
    <details className="s6-report-details"><summary>Ver las justificaciones originales de cada criterio</summary>
     {BENCH_CRITERIA.map(c=><div key={c.id}><h4>{c.label}</h4>{TICKERS.map(t=><p key={t}><strong>{t}:</strong> {benchmark.ratings[c.id][t].justification||"Pendiente de documentar."}</p>)}</div>)}
    </details>
   </section>
   <section><h3>4. Análisis de sensibilidad</h3>
    <p>Para evaluar la dependencia de los pesos, las puntuaciones originales permanecen fijas mientras se ensayan cuatro combinaciones alternativas.</p>
    <div className="table-scroll" role="region" aria-label="Escenarios en el informe" tabIndex={0}><table className="s6-fact-table">
     <thead><tr><th>Escenario</th><th>VWRA</th><th>FWRA</th><th>Mayor valoración</th></tr></thead>
     <tbody>{scenarios.map(s=><tr key={s.id}><th scope="row">{s.label}</th><td>{s.VWRA?.toFixed(2)??"ND"}</td>
      <td>{s.FWRA?.toFixed(2)??"ND"}</td><td>{s.higher??"No evaluable"}</td></tr>)}</tbody>
    </table></div>
    <p>{stableChoice(scenarios)?"El orden no cambió entre los escenarios ensayados. No demuestra superioridad financiera.":"No puede afirmarse estabilidad del resultado en los escenarios ensayados."}</p>
   </section>
   <section><h3>5. Evaluación crítica</h3>
    <h4>Ventajas identificadas</h4><p>{review.advantages.trim()||"Pendiente de investigar."}</p>
    <h4>Riesgos y contraargumentos</h4><p>{review.risks.trim()||"Pendiente de investigar."}</p>
    <h4>Incertidumbres</h4><p>{review.uncertainties.trim()||"Pendiente de investigar."}</p>
    <h4>Próximos pasos</h4><p>{review.nextSteps.trim()||"Pendiente de definir."}</p>
   </section>
   <section><h3>6. Fichas de investigación</h3>
    {TARGETS.map(t=><div key={t.ticker} className="s6-report-research"><h4>{t.ticker} · {t.isin}</h4>
     {RESEARCH_FIELDS.map(f=><p key={f.key}><strong>{f.label}:</strong> {research[t.ticker][f.key].trim()||"No se incorporó información todavía."}</p>)}</div>)}
   </section>
   <section><h3>7. Calidad de la evidencia y limitaciones</h3>
    <p><strong>{flags.generic} de {flags.total}</strong> justificaciones parecen genéricas o vacías y <strong>{flags.missingSource} de {flags.total}</strong> no incluyen una fuente o fecha reconocible mediante revisión automática básica.</p>
    {missingResearch.length>0&&<p>Faltan fichas desarrolladas para: {missingResearch.map(t=>t.ticker).join(", ")}.</p>}
    <p>Estas advertencias son indicadores preliminares, no una auditoría documental. Antes de presentar conclusiones formales hay que verificar las fuentes, las fechas, los costos reales, la disponibilidad en el bróker y el riesgo financiero.</p>
   </section>
   <section><h3>8. Referencias sugeridas</h3>
    <p>Los siguientes enlaces son fuentes propuestas por la plataforma. <strong>No significa que hayan sido consultadas por el estudiante.</strong></p>
    <ul>{TARGETS.flatMap(t=>SOURCE_GUIDES[t.ticker].map(s=><li key={s.url}>
      <a href={s.url} target="_blank" rel="noopener noreferrer">{t.ticker} · {s.label}</a>{s.date?" ("+s.date+")":""}
    </li>))}</ul>
   </section>
   <footer className="s6-report-footer"><strong>Documento educativo.</strong> No constituye asesoría de inversión, no predice rentabilidad y no ejecuta compras ni ventas. La fecha de elaboración queda incorporada al exportar.</footer>
  </article>
 </div>;
}
