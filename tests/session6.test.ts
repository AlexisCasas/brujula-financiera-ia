
import { describe, expect, it } from "vitest";
import {
  BENCH_CRITERIA, SESSION6_CASE, SOURCE_GUIDES, TARGETS,
  benchmarkMarkdown, emptyBenchDraft, emptyResearchDraft,
  evaluateBenchmark, makeResearchInstruments, researchCompletion, researchMarkdown
} from "../src/lib/session6/logic";
import type { EtfProfile } from "../src/lib/etfs/catalog";
import type { EquityListing } from "../src/lib/equities/types";

function mockEtf(ticker: "VWRA" | "FWRA", isin: string): EtfProfile {
  return {
    listingId: ticker + "-listing", instrumentId: ticker + "-instrument", ticker, isin,
    exchange: "XLON", currency: "USD", name: ticker + " global ETF", issuer: ticker + " manager",
    indexName: "FTSE All-World", domicile: "IE", distributionPolicy: "accumulating",
    inceptionDate: null, unverifiedCount: 0, evidence: [],
    metrics: { ter_percent: {metric:"ter_percent", value:null, currency:null, asOfDate:null, sourceDate:null, sourceUrl:null, version:null, availability:"no_disponible",note:null}, net_assets:null, fund_net_assets:null },
  };
}
const bap: EquityListing = {
  listing_id: "bap-listing", instrument_id: "bap-instrument", ticker:"BAP", isin:"BMG2519Y1084",
  name:"Credicorp Ltd.", issuer:"Credicorp Ltd.", exchange:"XLIM", currency:"USD",
  listing_status:"unverified", asset_type:"equity", source_url:"https://documents.bvl.com.pe/pubdif/boldia/stockq.htm",
  source_date:"2026-11-16", identity_documented:true,
};

describe("S6-01 research fichas", () => {
  const etfs = [mockEtf("VWRA","IE00BK5BQT80"),mockEtf("FWRA","IE000716YHJ7")];
  it("only uses exact listing identity, never guesses by ticker", () => {
    expect(makeResearchInstruments(etfs,[bap]).map(p=>p.ticker)).toEqual(["VWRA","FWRA","BAP"]);
    expect(makeResearchInstruments([mockEtf("VWRA","WRONG")],[])).toHaveLength(0);
  });
  it("does not fabricate TER and acknowledges unverified BAP listing status", () => {
    const rows=makeResearchInstruments(etfs,[bap]);
    expect(rows.find(x=>x.ticker==="VWRA")?.ter).toBeNull();
    expect(rows.find(x=>x.ticker==="BAP")?.verification).toContain("no verificada");
  });
  it("progress reflects actual learner text and report distinguishes blanks", () => {
    const draft=emptyResearchDraft();
    expect(researchCompletion(draft)).toBe(0);
    draft.risks="Riesgo de cambios de moneda.";
    expect(researchCompletion(draft)).toBe(1);
    const item=makeResearchInstruments(etfs,[])[0];
    const report=researchMarkdown(item,draft,"2026-11-18");
    expect(report).toContain("Pendiente de investigar");
    expect(report).toContain(item.isin);
    expect(report).toContain("S/ 300");
  });
  it("links verified primary documents for all three case instruments", () => {
    expect(TARGETS).toHaveLength(3);
    for (const target of TARGETS) expect(SOURCE_GUIDES[target.ticker][0].url).toMatch(/^https:\/\//);
  });
});

describe("S6-02 weighted educational matrix", () => {
  it("does not provide default scores or a pre-selected winner", () => {
    const draft=emptyBenchDraft();
    const result=evaluateBenchmark(draft);
    expect(result.ready).toBe(false);
    expect(BENCH_CRITERIA.reduce((s,c)=>s+c.defaultWeight,0)).toBe(100);
  });
  it("rejects weights unequal to 100 and scores without evidence", () => {
    const draft=emptyBenchDraft();
    draft.weights.diversification=20;
    expect(evaluateBenchmark(draft).ready).toBe(false);
    draft.weights.diversification=25;
    draft.ratings.risk.VWRA.score=5;
    expect(evaluateBenchmark(draft).ready).toBe(false);
  });
  it("calculates weighted score only after two justified alternatives", () => {
    const draft=emptyBenchDraft();
    for(const c of BENCH_CRITERIA){
      draft.ratings[c.id].VWRA={score:3,justification:"Evaluación documentada del caso A."};
      draft.ratings[c.id].FWRA={score:4,justification:"Evaluación documentada del caso B."};
    }
    const result=evaluateBenchmark(draft);
    expect(result.ready).toBe(true);
    if(result.ready){
      expect(result.scores.VWRA).toBe(3);
      expect(result.scores.FWRA).toBe(4);
      expect(result.higher).toBe("FWRA");
    }
    expect(benchmarkMarkdown(draft,"2026-11-18")).toContain("no rentabilidades");
  });
  it("a zero-weight criterion is excluded rather than requiring unsupported evidence",()=>{
    const draft=emptyBenchDraft();
    draft.weights.diversification=0;
    draft.weights.total_cost=45;
    for(const c of BENCH_CRITERIA){
      if(draft.weights[c.id]===0) continue;
      draft.ratings[c.id].VWRA={score:2,justification:"Datos revisados en documento A."};
      draft.ratings[c.id].FWRA={score:2,justification:"Datos revisados en documento B."};
    }
    const result=evaluateBenchmark(draft);
    expect(result.ready).toBe(true);
    if(result.ready) expect(result.higher).toBe("Empate");
  });
  it("case numbers are stable for the classroom",()=>{
    expect(SESSION6_CASE).toMatchObject({initialPen:1000,monthlyPen:300,years:10});
  });
});
