
import {describe,it,expect} from "vitest";
import {BENCH_CRITERIA,emptyBenchDraft,emptyResearchDraft,evaluateBenchmark} from "../src/lib/session6/logic";
import {
 createReportMarkdown,emptyReview,parseReview,parseSavedBenchmark,parseSavedResearch,
 importBenchmarkMarkdown,importResearchMarkdown,evaluateScenarios,evidenceFlags,stableChoice,
} from "../src/lib/session6/analysis";
function sample(){
 const draft=emptyBenchDraft();
 const scores={VWRA:[5,4,5,5,5,5],FWRA:[4,4,4,4,5,5]};
 BENCH_CRITERIA.forEach((c,i)=>{
  for(const ticker of ["VWRA","FWRA"] as const)
   draft.ratings[c.id][ticker]={score:scores[ticker][i],justification:"Justificación 1"};
 });
 return draft;
}
function markdown(){
 const draft=sample();
 return [
 "# Sesión 6 · S6-02 · Matriz de benchmarking",
 "Caso: S/ 1.000 inicial, S/ 300 mensual, horizonte de 10 años, perfil moderado hipotético.",
 "Comparación homogénea: VWRA (IE00BK5BQT80) vs FWRA (IE000716YHJ7).",
 ...BENCH_CRITERIA.flatMap(c=>[
  "## "+c.label+" ("+draft.weights[c.id]+" %)",
  "- VWRA ("+draft.ratings[c.id].VWRA.score+"/5): Justificación 1",
  "- FWRA ("+draft.ratings[c.id].FWRA.score+"/5): Justificación 1",
 ])
 ].join("\n");
}
describe("S6-03 evaluation and sensitivity",()=>{
 it("imports the exported S6-02 exercise from a different Netlify origin",()=>{
  const parsed=importBenchmarkMarkdown(markdown());
  expect(evaluateBenchmark(parsed)).toMatchObject({ready:true,scores:{VWRA:4.8,FWRA:4.2},higher:"VWRA"});
 });
 it("rejects mismatched or incomplete document and unsafe ratings",()=>{
  expect(()=>importBenchmarkMarkdown("texto simple")).toThrow();
  expect(()=>importBenchmarkMarkdown(markdown().replace("IE000716YHJ7","OTHER"))).toThrow();
  expect(()=>importBenchmarkMarkdown(markdown().replace("5/5): Justificación 1","9/5): Justificación 1"))).toThrow();
 });
 it("reweights only criteria, without changing the student scores",()=>{
  const before=sample();
  const scenarios=evaluateScenarios(before);
  expect(scenarios).toHaveLength(5);
  expect(scenarios[0]).toMatchObject({VWRA:4.8,FWRA:4.2,higher:"VWRA"});
  expect(scenarios.every(x=>x.ready)).toBe(true);
  expect(scenarios.every(x=>x.VWRA!==null&&x.FWRA!==null)).toBe(true);
  expect(stableChoice(scenarios)).toBe(true);
  expect(before.weights.diversification).toBe(25);
 });
 it("flags generic evidence without treating it as research quality validation",()=>{
  expect(evidenceFlags(sample())).toMatchObject({generic:12,missingSource:12,total:12});
  const draft=sample();
  for(const c of BENCH_CRITERIA){
   draft.ratings[c.id].VWRA.justification="Vanguard factsheet 2026-09-30, exposición documentada.";
  }
  expect(evidenceFlags(draft).generic).toBe(6);
 });
 it("never invents a winner when comparison is incomplete",()=>{
  const result=evaluateScenarios(emptyBenchDraft());
  expect(result.every(x=>x.ready===false&&x.higher===null)).toBe(true);
  expect(stableChoice(result)).toBe(false);
 });
});
describe("S6-04 evidence-preserving report",()=>{
 it("imports S6-01 research Markdown for the correct ticker",()=>{
  const text=[
   "# Sesión 6 · S6-01 · Ficha de investigación",
   "Instrumento: FTSE All World (VWRA)",
   "ISIN: IE00BK5BQT80 | Bolsa: XLON | Moneda: USD",
   "## ¿Qué estoy comprando?",
   "Replica un índice global diversificado.",
   "## Riesgos principales",
   "Puede presentar caídas prolongadas.",
  ].join("\n");
  const parsed=importResearchMarkdown(text);
  expect(parsed.ticker).toBe("VWRA");
  expect(parsed.draft.scope).toContain("índice");
  expect(parsed.draft.risks).toContain("caídas");
  expect(parsed.draft.drivers).toBe("");
 });
 it("includes 4-stage case, sensitivity, warnings and references in export",()=>{
  const report=createReportMarkdown({
   benchmark:sample(),
   research:{VWRA:emptyResearchDraft(),FWRA:emptyResearchDraft(),BAP:emptyResearchDraft()},
   review:{...emptyReview(),choice:"pending",argument:"Aún faltan documentos.",risks:"Sin costos de FX confirmados."},
   date:"2026-11-18",
  });
  expect(report).toContain("4.80");
  expect(report).toContain("4.20");
  expect(report).toContain("Justificaciones potencialmente genéricas: 12 de 12");
  expect(report).toContain("no comprar");
  expect(report).toContain("Credicorp BAP");
  expect(report).toContain("IE000716YHJ7");
 });
 it("recovers saved review and damaged local storage safely",()=>{
  expect(parseReview('{"choice":"FWRA","argument":"Documento revisado"}').choice).toBe("FWRA");
  expect(parseReview("{")).toMatchObject({choice:"pending"});
  expect(parseSavedBenchmark("{").weights.total_cost).toBe(20);
  expect(parseSavedResearch("{").BAP.scope).toBe("");
 });
});
