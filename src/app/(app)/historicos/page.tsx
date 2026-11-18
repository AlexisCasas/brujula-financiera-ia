import { getEtfCatalog } from "@/lib/etfs/queries";
import { getHistoricalObservations } from "@/lib/historical-queries";
import { annualizedVolatility, maxDrawdownPct, periodReturnPct } from "@/lib/historical-risk";
import { formatDate, formatPercent } from "@/lib/etfs/catalog";
import Link from "next/link";

export const metadata={title:"Históricos y riesgo · Brújula Financiera IA"};

export default async function HistoricalPage({searchParams}:{searchParams:Promise<{listing?:string}>}){
 const {listing}=await searchParams; const catalog=await getEtfCatalog();
 if(catalog.status!=="ready") return <section><header className="intro"><p className="eyebrow">BF-049</p><h1>Históricos y riesgo.</h1><p>No hay catálogo disponible para seleccionar un instrumento.</p></header></section>;
 const selected=catalog.profiles.find(p=>p.listingId===listing)??catalog.profiles[0];
 const observations=selected?await getHistoricalObservations(selected.listingId):[];
 const values=observations.map(o=>Number(o.close));
 const ret=periodReturnPct(values),vol=annualizedVolatility(values),dd=maxDrawdownPct(values);
 return <section aria-labelledby="screen-title">
  <header className="intro"><p className="eyebrow">Entender el riesgo histórico</p><h1 id="screen-title">Históricos y riesgo.</h1><p>Las métricas solo aparecen cuando existe una serie de precios documentada. No rellenamos huecos con cifras inventadas.</p></header>
  <form className="panel historical-picker" method="get"><label htmlFor="listing">Instrumento</label><select id="listing" name="listing" defaultValue={selected?.listingId}>{catalog.profiles.map(p=><option key={p.listingId} value={p.listingId}>{p.ticker} · {p.exchange} · {p.currency}</option>)}</select><button className="primary-button" type="submit">Analizar</button></form>
  {selected&&observations.length<2?<div className="empty"><h2>Aún no hay serie histórica verificada</h2><p>{selected.ticker} está identificado en el catálogo, pero todavía no tenemos suficientes observaciones de precio para calcular rentabilidad, volatilidad o drawdown.</p><Link className="etf-clear" href="/comparador">Comparar atributos disponibles</Link></div>:
  selected&&<><div className="historical-kpis"><article className="panel"><span>Rentabilidad del periodo</span><strong>{ret===null?"No disponible":formatPercent(String(ret*100))}</strong></article><article className="panel"><span>Volatilidad anualizada</span><strong>{vol===null?"No disponible":formatPercent(String(vol*100))}</strong></article><article className="panel"><span>Máximo drawdown</span><strong>{dd===null?"No disponible":formatPercent(String(dd*100))}</strong></article></div><div className="panel"><p className="etf-meta">Observaciones: {observations.length} · Desde {formatDate(observations[0]?.observed_on)} hasta {formatDate(observations.at(-1)?.observed_on)} · moneda: {observations[0]?.currency}</p><p>Estas métricas describen el pasado de la serie disponible. No predicen el futuro.</p></div></>}
 </section>;
}
