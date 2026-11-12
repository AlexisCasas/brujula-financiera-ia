import { EtfCatalog } from "@/components/etfs/EtfCatalog";
import { getEtfCatalog } from "@/lib/etfs/queries";
import { findNavItem } from "@/lib/navigation";

const item = findNavItem("/explorar")!;
export const metadata = { title: `${item.label} · Brújula Financiera IA` };
export const dynamic = "force-dynamic";

export default async function ExplorePage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ q?: string }> }>) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 120) : "";
  const catalog = await getEtfCatalog();

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
        <EtfCatalog profiles={catalog.profiles} query={query} asOf={catalog.asOf} />
      )}
    </section>
  );
}
