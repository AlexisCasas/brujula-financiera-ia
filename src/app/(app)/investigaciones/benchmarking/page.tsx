
import Link from "next/link";
import { getEtfCatalog } from "@/lib/etfs/queries";
import { BenchmarkWorkspace } from "@/components/session6/BenchmarkWorkspace";
import { makeResearchInstruments } from "@/lib/session6/logic";

export const metadata = { title: "S6-02 · Benchmarking · Brújula IA" };
export default async function BenchmarkingPage() {
  const catalog = await getEtfCatalog();
  const instruments = makeResearchInstruments(catalog.profiles, []);
  return <section aria-labelledby="screen-title">
    <header className="intro"><p className="eyebrow">Sesión 6 · S6-02</p><h1 id="screen-title">Benchmarking competitivo.</h1>
      <p>Construye una matriz para VWRA y FWRA con pesos, justificaciones y un resultado condicionado a la calidad de tus evidencias.</p></header>
    <p className="s6-back"><Link href="/investigaciones">← Volver al laboratorio</Link></p>
    {catalog.status === "error" && <div className="info" role="alert">{catalog.message}</div>}
    <BenchmarkWorkspace instruments={instruments} asOf={catalog.asOf}/>
  </section>;
}
