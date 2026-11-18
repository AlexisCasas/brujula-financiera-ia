
"use client";
import Link from "next/link";
import { BENCH_CRITERIA, SESSION6_CASE, evaluateBenchmark } from "@/lib/session6/logic";
import { evaluateScenarios, evidenceFlags, stableChoice, type ReviewDraft } from "@/lib/session6/analysis";
import { useSession6Workshop } from "@/components/session6/useSession6Workshop";

const tickerLabel={VWRA:"VWRA · Vanguard",FWRA:"FWRA · Invesco",pending:"Seguir investigando"} as const;
const REVIEW_FIELDS = [
 {key:"argument",label:"Conclusión y justificación",tip:"¿Por qué priorizarías esa alternativa para continuar investigando?"},
 {key:"advantages",label:"Ventajas identificadas",tip:"Separa lo observado de los supuestos y escribe tus fuentes."},
 {key:"risks",label:"Riesgos y contraargumentos",tip:"¿Qué razonamiento podría estar equivocado? ¿Qué pérdida sería posible?"},
 {key:"uncertainties",label:"Información pendiente",tip:"¿Qué faltó sobre costos, FX, liquidez, fiscalidad y bróker?"},
 {key:"nextSteps",label:"Próximos pasos",tip:"Define qué documentos y datos contrastarías antes de cualquier decisión."},
] as const;
export function EvaluationWorkspace(){
 const workshop=useSession6Workshop();
 const {benchmark,review,setReview,loaded,notice,importBenchmark}=workshop;
 const scores=evaluateBenchmark(benchmark);
 const scenarios=evaluateScenarios(benchmark);
 const flags=evidenceFlags(benchmark);
 function edit(key:keyof ReviewDraft,value:string){
  setReview(prev=>({...prev,[key]:value}));
 }
 return <div className="s6-layout">
  <section className="panel s6-case"><div><p className="eyebrow">Caso práctico · Sesión 6</p><h2>Evaluar alternativas, no predecir el mercado</h2>
   <p>{SESSION6_CASE.risk} · {SESSION6_CASE.goal}. Revisamos cómo una conclusión cambia cuando cambian las prioridades.</p></div>
   <div className="s6-case-stats"><span><strong>S/ 1.000</strong>Inicial</span><span><strong>S/ 300</strong>Mensual</span><span><strong>10 años</strong>Horizonte</span></div></section>
  <section className="panel"><p className="eyebrow">Entrada S6-02</p><h2>1. Recuperar la matriz</h2>
    <p>Usamos automáticamente tu ejercicio previo si estás en el mismo dominio. Si vienes del Preview anterior, importa el archivo Markdown exportado desde S6-02.</p>
    <div className="s6-import-row"><label>Importar S6-02 (.md)
      <input type="file" accept=".md,.txt,text/markdown,text/plain" onChange={e=>{void importBenchmark(e.target.files?.[0]);e.target.value="";}}/></label>
      <Link href="/investigaciones/benchmarking" className="s6-secondary">Editar matriz S6-02</Link></div>
    <p className="s6-fine" role="status">{notice|| (loaded?"Matriz local cargada.":"Cargando datos del navegador…")}</p>
    {scores.ready?<div className="s6-scores"><div><span>VWRA</span><strong>{scores.scores.VWRA.toFixed(2)}/5</strong></div>
      <div><span>FWRA</span><strong>{scores.scores.FWRA.toFixed(2)}/5</strong></div></div>
      :<div className="info" role="status">La matriz aún no es evaluable: {scores.reason}</div>}
  </section>
  <section className="panel"><p className="eyebrow">S6-03 · Análisis de sensibilidad</p><h2>2. ¿Cambia la conclusión si cambian los pesos?</h2>
    <p>Se mantienen exactamente las puntuaciones que introdujiste. Solo se modifican las ponderaciones en cuatro escenarios didácticos, cada uno con suma de 100 %.</p>
    <div className="table-scroll" role="region" aria-label="Escenarios de sensibilidad" tabIndex={0}>
    <table className="s6-fact-table s6-sensitivity"><thead><tr><th>Escenario</th><th>VWRA</th><th>FWRA</th><th>Mayor valoración</th></tr></thead>
      <tbody>{scenarios.map(s=><tr key={s.id}><th scope="row">{s.label}<small>{s.reason}</small></th>
        <td>{s.VWRA===null?"No evaluable":s.VWRA.toFixed(2)+"/5"}</td>
        <td>{s.FWRA===null?"No evaluable":s.FWRA.toFixed(2)+"/5"}</td>
        <td>{s.higher??"Pendiente"}</td></tr>)}</tbody></table></div>
    <div className="s6-weight-scenarios">
      {scenarios.slice(1).map(s=><details key={s.id}><summary>Pesos de «{s.label}»</summary>
       <p>{BENCH_CRITERIA.map(c=>c.label+" "+s.weights[c.id]+" %").join(" · ")}</p>
      </details>)}
    </div>
    <div className="info">{scores.ready && stableChoice(scenarios)
     ?"La alternativa mejor puntuada no cambió en estos cuatro escenarios alternativos. Esto no prueba que sea mejor financieramente."
     :"La estabilidad del resultado no está demostrada: pueden faltar valoraciones o el orden cambia entre escenarios."}</div>
  </section>
  <section className="panel"><p className="eyebrow">Calidad de la investigación</p><h2>3. Revisar la solidez de la evidencia</h2>
   <div className="s6-evidence-grid"><div><strong>{flags.generic}/{flags.total}</strong><span>Justificaciones vacías o genéricas</span></div>
   <div><strong>{flags.missingSource}/{flags.total}</strong><span>Sin fuente o fecha identificable en el texto</span></div></div>
   <p>«Justificación 1» permite probar el cálculo, pero <strong>no es evidencia académica suficiente</strong>. Estos indicadores son heurísticos: mencionar una fuente tampoco demuestra que haya sido comprobada.</p>
  </section>
  <section className="panel"><p className="eyebrow">Evaluación de alternativas</p><h2>4. Conclusión razonada</h2>
   <p>Selecciona qué alternativa investigarías más profundamente, o deja la decisión pendiente. Esta selección nunca registra una compra.</p>
   <label className="s6-report-field">Estado de la conclusión<select value={review.choice} onChange={e=>edit("choice",e.target.value)}>
     <option value="pending">{tickerLabel.pending}</option><option value="VWRA">{tickerLabel.VWRA}</option><option value="FWRA">{tickerLabel.FWRA}</option>
   </select></label>
   <div className="s6-form-fields">{REVIEW_FIELDS.map(f=><label key={f.key} className="s6-field"><strong>{f.label}</strong>
     <span>{f.tip}</span><textarea rows={3} maxLength={2000} value={review[f.key]} onChange={e=>edit(f.key,e.target.value)}/></label>)}</div>
   <div className="s6-actions"><Link href="/investigaciones/informe" className="primary-button">Continuar a S6-04 · Informe</Link>
     <span className="s6-fine">El análisis se guarda localmente en el navegador.</span></div>
  </section>
 </div>;
}
