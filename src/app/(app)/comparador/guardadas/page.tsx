import Link from "next/link";
import { connection } from "next/server";
import { listSavedComparisons } from "@/lib/etfs/saved-queries";
import { formatSavedTimestamp } from "@/lib/etfs/saved";
import { formatDate } from "@/lib/etfs/catalog";

export const metadata = { title: "Historial de comparaciones · Brújula Financiera IA" };

export default async function SavedComparisonsPage() {
  await connection(); // Per-request private rendering under Next.js cacheComponents.
  const history = await listSavedComparisons();
  return (
    <section aria-labelledby="history-title">
      <header className="intro">
        <p className="eyebrow">Análisis con trazabilidad</p>
        <h1 id="history-title">Mis comparaciones guardadas</h1>
        <p>Cada comparación conserva una fotografía de valores, fechas y
          fuentes. Las nuevas cifras no modifican registros anteriores.</p>
      </header>
      <div className="comparison-actions">
        <Link href="/comparador" className="primary-button">Crear comparación</Link>
      </div>
      {history.status === "error" && <div className="info" role="alert">
        {history.message} <Link href="/comparador/guardadas">Reintentar</Link>
      </div>}
      {history.status === "ready" && history.rows.length === 0 &&
        <div className="empty"><h2>Sin comparaciones guardadas</h2>
          <p>Selecciona dos o más ETF en el comparador y guarda una fotografía
            de sus métricas para verla aquí.</p>
        </div>}
      {history.status === "ready" && history.rows.length > 0 && (
        <div className="panel comparison-result" style={{ marginTop: 16 }}>
          <h2>Últimas {history.rows.length} comparaciones</h2>
          <div className="table-scroll" role="region"
            aria-label="Historial de comparaciones ETF" tabIndex={0}>
            <table>
              <thead><tr>
                <th scope="col">Título</th>
                <th scope="col">Guardada</th>
                <th scope="col">Corte de datos</th>
                <th scope="col">ETF</th>
                <th scope="col">Acción</th>
              </tr></thead>
              <tbody>
                {history.rows.map((row) => (
                  <tr key={row.id}>
                    <th scope="row">{row.title}</th>
                    <td>{formatSavedTimestamp(row.saved_at)}</td>
                    <td>{formatDate(row.as_of_date)}</td>
                    <td>{row.listing_ids.length}</td>
                    <td><Link href={`/comparador/guardadas/${row.id}`}>Ver fotografía</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="etf-meta">
            Se muestran las 30 comparaciones más recientes. Sin edición ni borrado
            desde el MVP; se conserva su integridad para auditoría.
          </p>
        </div>
      )}
    </section>
  );
}
