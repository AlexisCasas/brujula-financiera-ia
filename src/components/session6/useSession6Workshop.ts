
"use client";
import { useEffect, useState } from "react";
import { emptyBenchDraft, emptyResearchDraft, type BenchDraft, type ResearchDraft, type TargetTicker } from "@/lib/session6/logic";
import {
 BENCH_STORE, RESEARCH_STORE, REVIEW_STORE,
 emptyReview, importBenchmarkMarkdown, importResearchMarkdown,
 parseReview, parseSavedBenchmark, parseSavedResearch, type ReviewDraft,
} from "@/lib/session6/analysis";

export function useSession6Workshop() {
 const [benchmark,setBenchmark]=useState<BenchDraft>(emptyBenchDraft);
 const [research,setResearch]=useState<Record<TargetTicker,ResearchDraft>>({
  VWRA:emptyResearchDraft(),FWRA:emptyResearchDraft(),BAP:emptyResearchDraft(),
 });
 const [review,setReview]=useState<ReviewDraft>(emptyReview);
 const [loaded,setLoaded]=useState(false);
 const [notice,setNotice]=useState("");
 useEffect(()=>{
  const task=window.setTimeout(()=>{
   try{
    setBenchmark(parseSavedBenchmark(window.localStorage.getItem(BENCH_STORE)));
    setResearch(parseSavedResearch(window.localStorage.getItem(RESEARCH_STORE)));
    setReview(parseReview(window.localStorage.getItem(REVIEW_STORE)));
   }catch{/* browser storage may be disabled */}
   setLoaded(true);
  },0);
  return()=>window.clearTimeout(task);
 },[]);
 useEffect(()=>{
  if(!loaded)return;
  try{
   window.localStorage.setItem(BENCH_STORE,JSON.stringify(benchmark));
   window.localStorage.setItem(RESEARCH_STORE,JSON.stringify(research));
   window.localStorage.setItem(REVIEW_STORE,JSON.stringify(review));
  }catch{/* optional local persistence */}
 },[benchmark,research,review,loaded]);
 async function importBenchmark(file:File|undefined){
  if(!file)return;
  try{
   if(file.size>100000)throw new Error("Archivo demasiado grande.");
   const next=importBenchmarkMarkdown(await file.text());
   setBenchmark(next);setNotice("Matriz S6-02 importada desde "+file.name+".");
  }catch(error){setNotice(error instanceof Error?error.message:"No se pudo importar la matriz.");}
 }
 async function importResearch(file:File|undefined){
  if(!file)return;
  try{
   if(file.size>100000)throw new Error("Archivo demasiado grande.");
   const item=importResearchMarkdown(await file.text());
   setResearch(prev=>({...prev,[item.ticker]:item.draft}));
   setNotice("Ficha "+item.ticker+" importada.");
  }catch(error){setNotice(error instanceof Error?error.message:"No se pudo importar la ficha.");}
 }
 return {benchmark,research,review,setReview,loaded,notice,importBenchmark,importResearch};
}
