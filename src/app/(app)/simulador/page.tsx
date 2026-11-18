"use client";
import {useMemo,useState} from "react";
import {simulateScenario} from "@/lib/beginner-journey";
const money=new Intl.NumberFormat("es-PE",{style:"currency",currency:"PEN",maximumFractionDigits:0});
export default function SimulatorPage(){
 const [initial,setInitial]=useState(1000),[monthly,setMonthly]=useState(500),[years,setYears]=useState(10),[rate,setRate]=useState(5);
 const results=useMemo(()=>[{label:"Pesimista",rate:-4,note:"Supuesto ilustrativo; no es una predicción."},{label:"Central",rate,note:"Supuesto definido por ti; no es una garantía."},{label:"Optimista",rate:9,note:"Supuesto ilustrativo; no es una predicción."}].map(s=>({...s,point:simulateScenario({initial,contribution:monthly,years,annualRates:[s.rate/100],periodicity:"monthly"}).at(-1)!})),[initial,monthly,years,rate]);
 return <section aria-labelledby="screen-title"><header className="intro"><p className="eyebrow">Prueba tus hipótesis</p><h1 id="screen-title">Simulador de escenarios.</h1><p>Elige tus aportes y observa escenarios ilustrativos. No son predicciones ni promesas de rentabilidad.</p></header>
 <div className="panel simulator-controls"><div className="beginner-grid-2"><label className="beginner-field">Monto inicial<input type="number" min="0" value={initial} onChange={e=>setInitial(Number(e.target.value)||0)}/></label><label className="beginner-field">Aporte mensual<input type="number" min="0" value={monthly} onChange={e=>setMonthly(Number(e.target.value)||0)}/></label><label className="beginner-field">Horizonte (años)<input type="number" min="1" max="50" value={years} onChange={e=>setYears(Math.min(50,Math.max(1,Number(e.target.value)||1)))}/></label><label className="beginner-field">Supuesto central (% anual)<input type="number" step="0.1" min="-99" max="100" value={rate} onChange={e=>setRate(Number(e.target.value)||0)}/></label></div><p className="etf-meta">El escenario central usa el supuesto que introduces; los extremos son bandas educativas fijas. Los resultados no incluyen impuestos, comisiones de bróker ni FX.</p></div>
 <div className="scenario-grid">{results.map(r=><article className="panel scenario-card" key={r.label}><p className="eyebrow">{r.label} · {r.rate.toFixed(1)}%</p><strong>{money.format(r.point.value)}</strong><span>Capital aportado: {money.format(r.point.contributed)}</span><p>{r.note}</p></article>)}</div>
 <div className="info"><strong>Lectura correcta:</strong> cambiar supuestos cambia el resultado. El mercado real puede quedar fuera de cualquiera de estos escenarios.</div>
 </section>;
}
