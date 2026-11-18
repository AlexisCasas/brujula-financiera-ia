import {DecisionForm} from "@/components/beginner/DecisionForm";
export const metadata={title:"Mis decisiones · Brújula Financiera IA"};
export default function DecisionsPage(){return <section aria-labelledby="screen-title"><header className="intro"><p className="eyebrow">Bitácora personal</p><h1 id="screen-title">Mi primera decisión.</h1><p>Registra qué estás considerando, por qué, qué riesgos entiendes y qué alternativas comparaste. Considerar no significa comprar.</p></header><DecisionForm/></section>;}
