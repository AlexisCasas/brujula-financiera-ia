
import Link from "next/link";
import { ReportWorkspace } from "@/components/session6/ReportWorkspace";
export const metadata={title:"S6-04 · Informe comparativo · Brújula IA"};
export default function ExecutiveReportPage(){
 return <section aria-labelledby="screen-title">
  <header className="intro"><p className="eyebrow">Sesión 6 · S6-04</p><h1 id="screen-title">Informe ejecutivo comparativo.</h1>
   <p>Integra tu investigación y evaluación en un informe estructurado, listo para revisar y exportar como material de clase.</p></header>
  <p className="s6-back"><Link href="/investigaciones">← Laboratorio financiero</Link></p><ReportWorkspace/>
 </section>;
}
