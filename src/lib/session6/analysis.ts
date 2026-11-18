
import {
 BENCH_CRITERIA, RESEARCH_FIELDS, TARGETS, SOURCE_GUIDES, SESSION6_CASE,
 emptyBenchDraft, emptyResearchDraft, evaluateBenchmark,
 type BenchDraft, type CriterionId, type ResearchDraft, type TargetTicker,
} from "./logic";

export const BENCH_STORE = "brujula-s6-benchmark-v1";
export const RESEARCH_STORE = "brujula-s6-research-v1";
export const REVIEW_STORE = "brujula-s6-evaluation-v1";
export type Choice = "VWRA" | "FWRA" | "pending";
export type ReviewDraft = {
 choice: Choice;
 argument: string;
 advantages: string;
 risks: string;
 uncertainties: string;
 nextSteps: string;
};
export function emptyReview(): ReviewDraft {
 return {choice:"pending",argument:"",advantages:"",risks:"",uncertainties:"",nextSteps:""};
}
export function parseReview(value: string | null): ReviewDraft {
 const draft=emptyReview();
 if(!value) return draft;
 try {
  const p=JSON.parse(value) as Partial<ReviewDraft>;
  for(const key of ["argument","advantages","risks","uncertainties","nextSteps"] as const) {
   if(typeof p[key]==="string") draft[key]=p[key].slice(0,2000);
  }
  if(p.choice==="VWRA"||p.choice==="FWRA"||p.choice==="pending") draft.choice=p.choice;
 } catch { /* invalid local data */ }
 return draft;
}
export function parseSavedBenchmark(value: string | null): BenchDraft {
 const draft=emptyBenchDraft();
 if(!value) return draft;
 try {
  const saved=JSON.parse(value) as Partial<BenchDraft>;
  for(const c of BENCH_CRITERIA){
   const w=saved.weights?.[c.id];
   if(typeof w==="number"&&Number.isInteger(w)&&w>=0&&w<=100) draft.weights[c.id]=w;
   for(const ticker of ["VWRA","FWRA"] as const){
    const item=saved.ratings?.[c.id]?.[ticker];
    if(!item) continue;
    draft.ratings[c.id][ticker]={
     score:typeof item.score==="number"&&Number.isInteger(item.score)&&item.score>=1&&item.score<=5?item.score:null,
     justification:typeof item.justification==="string"?item.justification.slice(0,1000):"",
    };
   }
  }
 }catch{ /* use empty */ }
 return draft;
}
export function parseSavedResearch(value: string | null): Record<TargetTicker,ResearchDraft> {
 const result={VWRA:emptyResearchDraft(),FWRA:emptyResearchDraft(),BAP:emptyResearchDraft()};
 if(!value) return result;
 try{
  const data=JSON.parse(value) as Partial<Record<TargetTicker,ResearchDraft>>;
  for(const target of TARGETS){
   for(const field of RESEARCH_FIELDS){
    const v=data[target.ticker]?.[field.key];
    if(typeof v==="string") result[target.ticker][field.key]=v.slice(0,2000);
   }
  }
 } catch { /* no prior browser data */ }
 return result;
}

export type WeightScenario={
 id:string;label:string;reason:string;weights:Record<CriterionId,number>;
};
function weights(numbers:readonly number[]):Record<CriterionId,number>{
 return Object.fromEntries(BENCH_CRITERIA.map((criterion,index)=>[criterion.id,numbers[index]])) as Record<CriterionId,number>;
}
export const SCENARIOS:readonly WeightScenario[]=[
 {id:"original",label:"Tus prioridades",reason:"Mismas ponderaciones que S6-02.",weights:weights([25,20,20,15,10,10])},
 {id:"costs",label:"Priorizar costos",reason:"Aumenta el peso de costos a 40 %.",weights:weights([15,40,20,10,5,10])},
 {id:"risk",label:"Priorizar riesgo",reason:"Aumenta riesgo a 40 %.",weights:weights([15,15,40,15,5,10])},
 {id:"diversification",label:"Priorizar diversificación",reason:"Aumenta diversificación a 40 %.",weights:weights([40,15,20,10,5,10])},
 {id:"access",label:"Priorizar acceso al bróker",reason:"Aumenta acceso a 35 %.",weights:weights([15,15,15,10,35,10])},
];
export type ScenarioResult={
 id:string;label:string;reason:string;
 ready:boolean;
 VWRA:number|null;FWRA:number|null;
 higher:"VWRA"|"FWRA"|"Empate"|null;
 difference:number|null;
};
export function evaluateScenarios(draft:BenchDraft):ScenarioResult[]{
 return SCENARIOS.map((scenario)=>{
  const next:BenchDraft={weights:scenario.id==="original"?{...draft.weights}:{...scenario.weights},ratings:draft.ratings};
  const output=evaluateBenchmark(next);
  return output.ready
   ?{id:scenario.id,label:scenario.label,reason:scenario.reason,ready:true,VWRA:output.scores.VWRA,FWRA:output.scores.FWRA,higher:output.higher,difference:Math.round((output.scores.VWRA-output.scores.FWRA)*100)/100}
   :{id:scenario.id,label:scenario.label,reason:scenario.reason,ready:false,VWRA:null,FWRA:null,higher:null,difference:null};
 });
}
export function stableChoice(scenarios:readonly ScenarioResult[]):boolean{
 const results=scenarios.filter(s=>s.ready&&s.higher!=="Empate");
 return results.length===scenarios.length&&results.length>0&&results.every(s=>s.higher===results[0].higher);
}
export function evidenceFlags(draft:BenchDraft):{generic:number;missingSource:number;total:number}{
 let generic=0,missingSource=0,total=0;
 for(const c of BENCH_CRITERIA){
  if(draft.weights[c.id]===0)continue;
  for(const ticker of ["VWRA","FWRA"] as const){
   const text=draft.ratings[c.id][ticker].justification.trim();
   total++;
   if(!text||/^(justificaci[oó]n|prueba|test|ejemplo|pendiente)(\s*\d+|\s*\d+\s*\.)?$/iu.test(text))generic++;
   if(!/https?:\/\/|(?:20\d{2}[-/]\d{2}[-/]\d{2})|(?:sec|vanguard|invesco|ficha|factsheet|documento|fuente|bvl|smv)/iu.test(text))missingSource++;
  }
 }
 return{generic,missingSource,total};
}
export function importBenchmarkMarkdown(markdown:string):BenchDraft{
 if(markdown.length>100000) throw new Error("Archivo demasiado grande.");
 if(!markdown.includes("IE00BK5BQT80")||!markdown.includes("IE000716YHJ7"))
  throw new Error("La matriz debe corresponder al caso VWRA/FWRA.");
 const draft=emptyBenchDraft();
 const sections=markdown.split(/^##\s+/gm).slice(1);
 const found=new Set<CriterionId>();
 for(const section of sections){
  const lines=section.trim().split(/\r?\n/);
  const header=lines[0];
  const c=BENCH_CRITERIA.find(x=>header.startsWith(x.label+" ("));
  if(!c) continue;
  if(found.has(c.id))throw new Error("Criterio duplicado: "+c.label);
  found.add(c.id);
  const weight=header.match(/\((\d{1,3})\s*%\)/)?.[1];
  if(weight===undefined)throw new Error("Peso sin formato válido en "+c.label);
  draft.weights[c.id]=Number(weight);
  const seen=new Set<string>();
  for(const line of lines.slice(1)){
   const match=line.match(/^-\s+(VWRA|FWRA)\s+\((\d|pendiente)\/5\):\s*(.*)$/);
   if(!match)continue;
   const ticker=match[1] as "VWRA"|"FWRA";
   if(seen.has(ticker))throw new Error("Instrumento duplicado en "+c.label);
   seen.add(ticker);
   const score=match[2]==="pendiente"?null:Number(match[2]);
   if(score!==null&&(!Number.isInteger(score)||score<1||score>5))throw new Error("Puntuación inválida.");
   draft.ratings[c.id][ticker]={score,justification:match[3].slice(0,1000)==="Pendiente"?"":match[3].slice(0,1000)};
  }
  if(seen.size!==2)throw new Error("Falta VWRA o FWRA en "+c.label);
 }
 if(found.size!==BENCH_CRITERIA.length)throw new Error("La matriz exportada está incompleta.");
 return draft;
}
export function importResearchMarkdown(markdown:string):{ticker:TargetTicker;draft:ResearchDraft}{
 if(markdown.length>100000)throw new Error("Ficha demasiado grande.");
 const target=TARGETS.find(t=>markdown.includes(t.isin+" |")&&markdown.includes("("+t.ticker+")"));
 if(!target)throw new Error("La ficha no corresponde a VWRA, FWRA o BAP.");
 const result=emptyResearchDraft();
 const sections=markdown.split(/^##\s+/gm).slice(1);
 for(const part of sections){
  const lines=part.trim().split(/\r?\n/);
  const c=RESEARCH_FIELDS.find(f=>f.label===lines[0].trim());
  if(c)result[c.key]=(lines.slice(1).join("\n").trim()==="Pendiente de investigar"?"":lines.slice(1).join("\n").trim()).slice(0,2000);
 }
 return{ticker:target.ticker,draft:result};
}
export function createReportMarkdown(input:{
 benchmark:BenchDraft;research:Record<TargetTicker,ResearchDraft>;review:ReviewDraft;date:string;
}):string{
 const {benchmark,research,review,date}=input;
 const evaluation=evaluateBenchmark(benchmark);
 const scenarios=evaluateScenarios(benchmark);
 const flags=evidenceFlags(benchmark);
 const lines=[
 "# Sesión 6 · Informe ejecutivo comparativo",
 "",
 "**Fecha de elaboración:** "+date,
 "**Caso docente:** "+SESSION6_CASE.risk+"; "+SESSION6_CASE.goal+".",
 "**Capital inicial:** S/ 1.000 | **Aporte mensual:** S/ 300 | **Horizonte:** 10 años.",
 "**Alternativas equivalentes:** VWRA (IE00BK5BQT80) vs FWRA (IE000716YHJ7).",
 "**Instrumento no equivalente:** Credicorp BAP (BMG2519Y1084); ficha empresarial separada.",
 "",
 "## 1. Resumen ejecutivo",
 evaluation.ready ?
 "Resultado ponderado del estudiante: VWRA "+evaluation.scores.VWRA.toFixed(2)+"/5; FWRA "+evaluation.scores.FWRA.toFixed(2)+"/5. Mayor puntuación: "+evaluation.higher+"." :
 "Aún no hay resultado evaluable: "+evaluation.reason,
 "Decisión didáctica declarada: "+(review.choice==="pending"?"seguir investigando":review.choice+" como alternativa para investigar, no comprar")+".",
 "Argumento: "+(review.argument.trim()||"Pendiente de redactar."),
 "",
 "## 2. Alcance y metodología",
 "Se comparan dos fondos globales mediante seis criterios ponderados. Las puntuaciones son subjetivas; no reflejan precios, retorno esperado ni asesoría.",
 "La puntuación es la suma de (peso × calificación)/100. Si faltan respuestas, no se publica un total.",
 "",
 "## 3. Matriz de benchmarking",
 "| Criterio | Peso | VWRA | FWRA | Sustento VWRA | Sustento FWRA |",
 "|---|---:|---:|---:|---|---|",
 ];
 for(const c of BENCH_CRITERIA){
  const a=benchmark.ratings[c.id].VWRA;
  const b=benchmark.ratings[c.id].FWRA;
  lines.push("| "+c.label+" | "+benchmark.weights[c.id]+" % | "+(a.score??"ND")+" | "+(b.score??"ND")+" | "+oneLine(a.justification||"Sin sustento")+" | "+oneLine(b.justification||"Sin sustento")+" |");
 }
 lines.push("","## 4. Sensibilidad a la ponderación","| Escenario | VWRA | FWRA | Mayor puntuación |","|---|---:|---:|---|");
 for(const s of scenarios){
  lines.push("| "+s.label+" | "+(s.VWRA?.toFixed(2)??"ND")+" | "+(s.FWRA?.toFixed(2)??"ND")+" | "+(s.higher??"No evaluable")+" |");
 }
 lines.push("","**Estabilidad frente a estos escenarios didácticos:** "+(stableChoice(scenarios)?"no cambia el orden entre los escenarios ensayados":"no se demuestra estabilidad o hay escenarios no evaluables")+".",
 "","## 5. Hallazgos y riesgos","**Ventajas observadas:** "+(review.advantages.trim()||"Pendiente."),
 "**Riesgos:** "+(review.risks.trim()||"Pendiente."),
 "**Incertidumbres:** "+(review.uncertainties.trim()||"Pendiente."),
 "**Próximos pasos de verificación:** "+(review.nextSteps.trim()||"Pendiente."),
 "","## 6. Resumen de fichas de investigación");
 for(const target of TARGETS){
  lines.push("### "+target.ticker+" · "+target.isin);
  for(const field of RESEARCH_FIELDS){
   lines.push("**"+field.label+":** "+(research[target.ticker][field.key].trim()||"Pendiente de investigar."));
  }
 }
 lines.push("","## 7. Calidad de la evidencia y limitaciones",
 "Justificaciones potencialmente genéricas: "+flags.generic+" de "+flags.total+".",
 "Justificaciones sin referencia documental o fecha identificable automáticamente: "+flags.missingSource+" de "+flags.total+".",
 "Estas verificaciones son heurísticas y NO acreditan autenticidad de las fuentes ni calidad económica de los argumentos.",
 "Los valores faltantes no se imputan; disponibilidad en bróker, liquidez, FX, fiscalidad y precios históricos pueden requerir investigación adicional.",
 "Credicorp BAP no se incluye en la misma clasificación ponderada que los ETF.",
 "",
 "## 8. Fuentes sugeridas para contrastar (no acreditan lectura del estudiante)");
 for(const target of TARGETS){for(const source of SOURCE_GUIDES[target.ticker])lines.push("- "+target.ticker+" · "+source.label+": "+source.url);}
 lines.push("","**Aviso:** Ejercicio educativo. No constituye recomendación personalizada ni registra operaciones.");
 return lines.join("\n");
}
function oneLine(text:string):string{return text.replace(/\r?\n/g," ").replace(/\|/g,"\\|").slice(0,250);}
