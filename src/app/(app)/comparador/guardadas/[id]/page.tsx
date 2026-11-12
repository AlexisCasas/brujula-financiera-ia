import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getSavedComparison } from "@/lib/etfs/saved-queries";
import {
  formatSavedTimestamp, savedMetricAsDisplay,
  type SavedItem,
} from "@/lib/etfs/saved";
import {
  NOT_AVAILABLE, distributionLabel, formatDate,
  metricText, validSourceUrl,
} from "@/lib/etfs/catalog";

export const metadata = { title: "Comparación guardada · Brújula Financiera IA" };

const COLUMNS = [
  { key: "ter_percent", label: "TER / gasto anual" },
  { key: "net_assets", label: "Patrimonio ETF / clase" },
  { key: "fund_net_assets", label: "Patrimonio total del fondo" },
] as const;

function MeasuredCell({ item, metric }: Readonly<{
  item: SavedItem; metric: (typeof COLUMNS)[number]["key"];
}>) {
  const raw = item.metrics[metric];
  const formatted = savedMetricAsDisplay(metric, raw);
  if (!raw || raw.availability !== "disponible") {
    return <span className="comparison-missing">{NOT_AVAILABLE}</span>;
  }
  const source = validSourceUrl(raw.source_url);
  return (
    <span className="comparison-value">
      <strong>{metricText(formatted)}</strong>
      <small>Dato {formatDate(raw.as_of_date)} · Fuente {formatDate(raw.source_date)}
        {raw.version ? ` · v${raw.version}` : ""}
      </small>
      <small>Referencia: {raw.source_record_id ?? NOT_AVAILABLE}</small>
      {raw.note && <small>{raw.note}</small>}
      {source && <a href={source} target="_blank" rel="noopener noreferrer">Fuente original ↗</a>}
    </span>
  );
}

export default async function SavedComparisonPage({
  params,
}: Readonly<{ params: Promise<{ id: string }> }>) {
  await connection(); // Per-request private rendering under Next.js cacheComponents.
  const { id } = await params;
  const saved = await getSavedComparison(id);
  if (!saved) notFound();
  const items = saved.items_snapshot;

  return (
    <section aria-labelledby="saved-title">
      <header className="intro">
        <p className="eyebrow">Registro histórico · Solo lectura</p>
        <h1 id="saved-title">{saved.title}</h1>
        <p>Guardada el {formatSavedTimestamp(saved.saved_at)} · Corte financiero:
          {formatDate(saved.as_of_date)} (UTC) · {items.length} ETF</p>
        <p>Esta fotografía conserva las cifras, versiones y referencias originales:
          no cambia aunque se actualice el catálogo posteriormente.</p>
      </header>
      <div className="comparison-actions">
        <Link className="primary-button" href="/comparador">Nueva comparación</Link>
        <Link className="etf-clear" href="/comparador/guardadas">Ver historial</Link>
      </div>
      <div className="panel comparison-result" style={{ marginTop: 16 }}>
        <h2>Datos preservados al guardar</h2>
        <p className="comparison-help">
          Las propiedades de identificación reflejan el momento de guardar.
          El TER y patrimonio corresponden a la fecha de corte indicada en cada fuente.
          No se reconstruye retrospectivamente el nombre o índice del fondo.
        </p>
        <div className="table-scroll comparison-scroll" role="region" aria-label="Matriz histórica guardada" tabIndex={0}>
          <table className="comparison-table">
            <caption>Fotografía inmutable de {items.length} ETF</caption>
            <thead><tr><th scope="col">Variable</th>
              {items.map((item) =>
                <th scope="col" key={item.listing_id}>
                  {item.ticker}<span>{item.exchange} · {item.currency}</span>
                </th>)}
            </tr></thead>
            <tbody>
              <tr><th scope="row">ISIN</th>{items.map(i => <td key={i.listing_id}><code>{i.isin}</code></td>)}</tr>
              <tr><th scope="row">Fondo</th>{items.map(i => <td key={i.listing_id}>{i.name}</td>)}</tr>
              <tr><th scope="row">Gestora</th>{items.map(i => <td key={i.listing_id}>{i.issuer ?? NOT_AVAILABLE}</td>)}</tr>
              <tr><th scope="row">Índice</th>{items.map(i => <td key={i.listing_id}>{i.index_name ?? NOT_AVAILABLE}</td>)}</tr>
              <tr><th scope="row">Política de dividendos</th>{items.map(i => <td key={i.listing_id}>{distributionLabel(i.distribution_policy)}</td>)}</tr>
              {COLUMNS.map(c => <tr key={c.key}><th scope="row">{c.label}</th>
                {items.map(i => <td key={i.listing_id}><MeasuredCell item={i} metric={c.key}/></td>)}
              </tr>)}
              <tr><th scope="row">Rentabilidad histórica</th>{items.map(i =>
                <td key={i.listing_id} className="comparison-missing">No comparable: falta histórico</td>)}</tr>
            </tbody>
          </table>
        </div>
        <h2>Fuentes de los atributos</h2>
        {items.map((item) => (
          <details key={item.listing_id} className="etf-details">
            <summary>{item.ticker} · {item.field_sources.length} referencias de campos</summary>
            <ul className="etf-evidence">
              {item.field_sources.map((ref, index) => (
                <li key={`${item.listing_id}-${ref.entity_type}-${ref.field}-${index}`}>
                  <strong>{ref.field}</strong>
                  <span>{ref.display_status}</span>
                  <span>{formatDate(ref.source_date)}</span>
                  {validSourceUrl(ref.source_url) &&
                    <a href={validSourceUrl(ref.source_url)!} target="_blank"
                      rel="noopener noreferrer">Documento ↗</a>}
                </li>
              ))}
            </ul>
          </details>
        ))}
        <p className="etf-meta">Documento privado para seguimiento personal. No es una recomendación de inversión.</p>
      </div>
    </section>
  );
}
