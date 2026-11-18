
import Link from "next/link";
import { getEtfCatalog } from "@/lib/etfs/queries";
import { getEquityCatalog } from "@/lib/equities/queries";
import { ResearchWorkspace } from "@/components/session6/ResearchWorkspace";
import { makeResearchInstruments } from "@/lib/session6/logic";

export const metadata = { title: "S6-01 · Ficha de investigación · Brújula IA" };
export default async function ResearchCardsPage() {
  const [etfs, equities] = await Promise.all([getEtfCatalog(), getEquityCatalog()]);
  const instruments = makeResearchInstruments(etfs.profiles, equities.rows);
  const asOf = etfs.asOf;
  return <section aria-labelledby="screen-title">
    <header className="intro"><p className="eyebrow">Sesión 6 · S6-01</p><h1 id="screen-title">Ficha de investigación financiera.</h1>
      <p>Completa una ficha sustentada en documentos, identifica vacíos de información y distingue entre un ETF diversificado y una empresa individual.</p></header>
    <p className="s6-back"><Link href="/investigaciones">← Volver al laboratorio</Link></p>
    {(etfs.status === "error" || equities.status === "error") && <div className="info" role="alert">
      Alguno de los catálogos no se pudo consultar. Las fichas disponibles podrían ser incompletas; vuelve a intentar tras verificar la conexión.</div>}
    <ResearchWorkspace instruments={instruments} asOf={asOf}/>
  </section>;
}
