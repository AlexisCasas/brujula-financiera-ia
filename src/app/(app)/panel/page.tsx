import Link from "next/link";
import { findNavItem } from "@/lib/navigation";
import { getEtfCatalog } from "@/lib/etfs/queries";
import { formatDate, METRIC_KEYS } from "@/lib/etfs/catalog";

const item = findNavItem("/panel")!;
export const metadata = { title: `${item.label} · Brújula Financiera IA` };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const catalog = await getEtfCatalog();
  const profiles = catalog.profiles;
  const distinctFunds = new Set(profiles.map((p) => p.isin)).size;
  const measured = profiles.reduce(
    (count, p) => count + METRIC_KEYS.filter((key) => p.metrics[key]?.availability === "disponible").length, 0,
  );
  const missing = profiles.length * METRIC_KEYS.length - measured;
  const unknownFields = profiles.some((p) => p.unverifiedCount === null)
    ? null : profiles.reduce((total, p) => total + (p.unverifiedCount ?? 0), 0);

  return (
    <section aria-labelledby="screen-title">
      <header className="intro">
        <p className="eyebrow">{item.eyebrow}</p>
        <h1 id="screen-title">Tu laboratorio de ETF.</h1>
        <p>Resumen de los instrumentos cargados en Supabase, sus mediciones y campos pendientes de verificación.</p>
      </header>
      {catalog.status === "error" && (
        <div className="info" role="alert"><p>{catalog.message}</p><a href="/panel">Reintentar</a></div>
      )}
      {catalog.status === "empty" && (
        <div className="empty"><h2>El catálogo está vacío</h2><p>El panel aparecerá cuando existan ETF autorizados en tu base.</p></div>
      )}
      {catalog.status === "ready" && (
        <>
          <p className="etf-meta">Estado a {formatDate(catalog.asOf)} (fecha UTC) · Consulta directa con autenticación y RLS</p>
          <div className="dashboard-grid" aria-label="Resumen del catálogo">
            <article className="panel dashboard-kpi">
              <p>ETF disponibles</p><strong>{distinctFunds}</strong><span>{profiles.length} listings registrados</span>
            </article>
            <article className="panel dashboard-kpi">
              <p>Mediciones con evidencia</p><strong>{measured}</strong><span>TER y patrimonio</span>
            </article>
            <article className="panel dashboard-kpi">
              <p>Mediciones faltantes</p><strong>{missing}</strong><span>Se presentan como «No disponible»</span>
            </article>
            <article className="panel dashboard-kpi">
              <p>Campos sin verificar</p>
              <strong>{unknownFields ?? "N/D"}</strong>
              <span>Identificación y estado del listing</span>
            </article>
          </div>
          <div className="dashboard-bottom">
            <article className="panel">
              <h2>Continúa tu investigación</h2>
              <p>Abre las fichas para inspeccionar fechas, fuentes oficiales y notas que explican los datos.</p>
              <Link href="/explorar" className="primary-button">Explorar los ETF</Link>
            </article>
            <article className="panel">
              <h2>Qué falta para el análisis histórico</h2>
              <p>Los precios históricos y el tipo de cambio USD/PEN aún no están integrados. Por eso el panel no presenta rentabilidades, pérdidas ni ganancias.</p>
              <p className="etf-meta">Las cifras de patrimonio no representan rentabilidad personal.</p>
            </article>
          </div>
          <section className="panel dashboard-table" aria-labelledby="etf-overview-heading">
            <h2 id="etf-overview-heading">Estado de los instrumentos</h2>
            <div className="table-scroll" role="region" aria-label="Resumen ETF" tabIndex={0}>
              <table>
                <thead><tr><th scope="col">Ticker</th><th scope="col">ISIN</th><th scope="col">Bolsa</th><th scope="col">Sin verificar</th><th scope="col">Detalle</th></tr></thead>
                <tbody>
                  {profiles.map((profile) => (
                    <tr key={profile.listingId}>
                      <th scope="row">{profile.ticker}</th>
                      <td>{profile.isin}</td><td>{profile.exchange} · {profile.currency}</td>
                      <td>{profile.unverifiedCount ?? "N/D"}</td>
                      <td><Link href={`/explorar?q=${encodeURIComponent(profile.ticker)}`}>Ver ficha</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
}
