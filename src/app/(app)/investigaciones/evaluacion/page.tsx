
import Link from "next/link";
import { EvaluationWorkspace } from "@/components/session6/EvaluationWorkspace";
export const metadata={title:"S6-03 · Evaluación de alternativas · Brújula IA"};
export default function EvaluationPage(){
 return <section aria-labelledby="screen-title">
  <header className="intro"><p className="eyebrow">Sesión 6 · S6-03</p><h1 id="screen-title">Evaluación de alternativas.</h1>
   <p>Investiga cómo las ponderaciones afectan tu resultado y construye una conclusión con argumentos, riesgos e incertidumbre.</p></header>
  <p className="s6-back"><Link href="/investigaciones">← Laboratorio financiero</Link></p><EvaluationWorkspace/>
 </section>;
}
