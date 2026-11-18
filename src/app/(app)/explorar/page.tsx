import { EtfCatalog } from "@/components/etfs/EtfCatalog";
import { getEtfCatalog } from "@/lib/etfs/queries";
import { findNavItem } from "@/lib/navigation";
import type { HistoricalMetric } from "@/lib/historical";

const item = findNavItem("/explorar")!;
export const metadata = { title: `${item.label} · Brújula Financiera IA` };

export default async function ExplorePage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ q?: string; distribution?: string; currency?: string }> }>) {
  const { q, distribution, currency } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 120) : "";
  const distributionFilter = distribution === "accumulating" || distribution === "distributing" ? distribution : "";
  const currencyFilter = currency === "USD" || currency === "PEN" ? currency : "";
  const catalog = await getEtfCatalog();
  const client = await (await import("@/lib/supabase/server")).createClient();
  const { data: historicalRows } = await client.from("historical_metric_snapshot").select("listing_id,metric_key,period_years,value,unit,as_of_date,source_date,source_url,methodology,coverage_status,note").order("as_of_date",{ascending:false}).limit(100);
  const historical = (historicalRows ?? []) as HistoricalMetric[];

  return (
    <section aria-labelledby="screen-title">
      <header className="intro">
        <p className="eyebrow">{item.eyebrow}</p>
        <h1 id="screen-title">{item.heading}</h1>
        <p>Identifica cada ETF por ISIN, bolsa y moneda. La información proviene de tu catálogo privado en Supabase.</p>
      </header>
      {catalog.status === "error" && (
        <div className="info" role="alert">
          <p>{catalog.message}</p>
          <a href="/explorar">Reintentar</a>
        </div>
      )}
      {catalog.status === "empty" && (
        <div className="empty">
          <h2>No hay ETF cargados</h2>
          <p>Cuando haya instrumentos autorizados en tu catálogo, aparecerán aquí. No mostramos cifras de ejemplo.</p>
        </div>
      )}
      {catalog.status === "ready" && (
        <EtfCatalog profiles={catalog.profiles} query={query} distributionFilter={distributionFilter} currencyFilter={currencyFilter} historical={historical} asOf={catalog.asOf} />
      )}
    </section>
  );
}
