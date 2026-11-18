import { GoalForm } from "@/components/beginner/GoalForm";
import { listInvestorGoals } from "@/lib/beginner-goal-queries";
const LABELS:Record<string,string>={wealth:"Crear patrimonio",retirement:"Jubilación",home:"Comprar una vivienda",education:"Educación",income:"Complementar ingresos",learning:"Aprender a invertir",other:"Otro objetivo"};
const money=(v:number|null,c:string)=>v===null?"No definido":new Intl.NumberFormat("es-PE",{style:"currency",currency:c,maximumFractionDigits:2}).format(v);
export const metadata={title:"Mi objetivo · Brújula Financiera IA"};
export default async function GoalPage(){
 const goals=await listInvestorGoals(); const current=goals[0];
 return <section aria-labelledby="screen-title"><header className="intro"><p className="eyebrow">Define tu propósito</p><h1 id="screen-title">¿Para qué estás invirtiendo?</h1><p>Definir un objetivo convierte tu perfil de riesgo en contexto. No necesitas saber todavía qué comprar.</p></header>
 {current&&<section className="panel beginner-guide"><p className="eyebrow">Objetivo activo</p><h2>{LABELS[current.objective]??current.objective}</h2><div className="guide-grid"><div><strong>Horizonte</strong><p>{current.horizon_years} años</p></div><div><strong>Capital inicial</strong><p>{money(current.initial_amount,current.currency)}</p></div><div><strong>Aporte</strong><p>{money(current.periodic_amount,current.currency)} · {current.periodicity}</p></div><div><strong>Moneda</strong><p>{current.currency}</p></div></div></section>}
 <GoalForm/><p className="etf-meta">Puedes registrar un nuevo objetivo cuando cambie tu situación. El historial permanece privado.</p></section>;
}
