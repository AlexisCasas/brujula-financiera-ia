import Link from "next/link";
import { saveComparisonAction } from "./actions";
import { listSavedComparisons } from "@/lib/etfs/saved-queries";
import { formatSavedTimestamp } from "@/lib/etfs/saved";
import type { ReactNode } from "react";
import { getEtfCatalog } from "@/lib/etfs/queries";
import {
  type EtfProfile, type Measurement, NOT_AVAILABLE,
  distributionLabel, formatDate, metricText, validSourceUrl,
} from "@/lib/etfs/catalog";
import {
  hasUnavailableMeasurements, parseListingSelection,
  selectEtfsForComparison, MAX_COMPARISON_ETFS, MIN_COMPARISON_ETFS,
} from "@/lib/etfs/comparison";
import { findNavItem } from "@/lib/navigation";

const item = findNavItem("/comparador")!;
export const metadata = { title: `${item.label} · Brújula Financiera IA` };

function MetricCell({ metric }: Readonly<{ metric: Measurement | null }>) {
  if (!metric || metric.availability !== "disponible" || metric.value === null) {
    return <span className="comparison-missing">{NOT_AVAILABLE}</span>;
  }
  const url = validSourceUrl(metric.sourceUrl);
  return (
    <span className="comparison-value">
      <strong>{metricText(metric)}</strong>
      <small>
        Dato: {formatDate(metric.asOfDate)} · Fuente: {formatDate(metric.sourceDate)}
        {metric.version ? ` · v${metric.version}` : ""}
      </small>
      {metric.note && <small>{metric.note}</small>}
      {url && <a href={url} target="_blank" rel="noopener noreferrer">Documento ↗</a>}
    </span>
  );
}

function ComparisonTable({ profiles, asOf }: Readonly<{ profiles: EtfProfile[]; asOf: string }>) {
  const rows: { label: string; render: (profile: EtfProfile) => ReactNode }[] = [
    { label: "ISIN", render: (p) => <code>{p.isin}</code> },
    { label: "Nombre", render: (p) => p.name },
    { label: "Gestora", render: (p) => p.issuer || NOT_AVAILABLE },
    { label: "Índice", render: (p) => p.indexName || NOT_AVAILABLE },
    { label: "Región / exposición", render: () => <span className="comparison-missing">No disponible sin desglose documentado</span> },
    { label: "Domicilio", render: (p) => p.domicile || NOT_AVAILABLE },
    { label: "Política de dividendos", render: (p) => distributionLabel(p.distributionPolicy) },
    { label: "Bolsa y moneda", render: (p) => `${p.exchange} · ${p.currency}` },
    { label: "TER / gasto anual", render: (p) => <MetricCell metric={p.metrics.ter_percent} /> },
    { label: "Patrimonio ETF / clase", render: (p) => <MetricCell metric={p.metrics.net_assets} /> },
    { label: "Patrimonio total del fondo", render: (p) => <MetricCell metric={p.metrics.fund_net_assets} /> },
    { label: "Rentabilidad histórica", render: () => <span className="comparison-missing">No comparable: falta serie de precios homogénea</span> },
    { label: "Riesgo histórico", render: () => <span className="comparison-missing">No disponible sin serie verificada</span> },
  ];
  return (
    <section className="panel comparison-result" aria-labelledby="matrix-heading">
      <h2 id="matrix-heading">Matriz comparativa</h2>
      <p className="comparison-help">
        Datos consultados a {formatDate(asOf)} (UTC). Una métrica solo se presenta si existe
        fuente, unidad y fecha; no se selecciona un «ganador» por datos incompletos.
      </p>
      {hasUnavailableMeasurements(profiles) && (
        <div className="info" role="status">
          La comparación incluye mediciones no disponibles. Consulta las fechas y notas de cada celda.
        </div>
      )}
      <div className="table-scroll comparison-scroll" role="region" aria-label="Matriz de comparación ETF" tabIndex={0}>
        <table className="comparison-table">
          <caption>Comparación documental de {profiles.length} listings. Sin series históricas ni FX.</caption>
          <thead>
            <tr>
              <th scope="col">Variable</th>
              {profiles.map((p) => <th scope="col" key={p.listingId}>{p.ticker}<span>{p.exchange} · {p.currency}</span></th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {profiles.map((p) => <td key={p.listingId}>{row.render(p)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="etf-meta">
        Patrimonio de clase y de fondo son categorías diferentes. TER es costo interno del fondo;
        los gastos de bróker y las divisas aún no se calculan. Este incremento es una comparación
        documental, no una recomendación.
      </p>
      <div className="comparison-actions">
        <Link href="/explorar" className="etf-clear">Consultar fichas y evidencias completas</Link>
      </div>
    </section>
  );
}

export default async function ComparatorPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ listing?: string | string[]; notice?: string }> }>) {
  const { listing, notice } = await searchParams;
  const selectedIds = parseListingSelection(listing);
  const [catalog, history] = await Promise.all([getEtfCatalog(), listSavedComparisons()]);

  return (
    <section aria-labelledby="screen-title">
      <header className="intro">
        <p className="eyebrow">{item.eyebrow}</p>
        <h1 id="screen-title">Comparar ETF con evidencia.</h1>
        <p>Selecciona entre dos y cinco listings. Por ahora comparamos costos y atributos verificables;
          los rendimientos históricos quedan pendientes de fuentes licenciadas.</p>
      </header>
      {notice && (
        <div className="info" role="alert">
          {notice === "selection" ? "La selección debe contener entre 2 y 5 ETF válidos, sin repetidos."
            : notice === "title" ? "El título supera los 120 caracteres permitidos."
            : "No se pudo guardar la comparación. Verifica tu sesión y reintenta."}
        </div>
      )}
      {catalog.status === "error" && (
        <div className="info" role="alert"><p>{catalog.message}</p><Link href="/comparador">Reintentar</Link></div>
      )}
      {catalog.status === "empty" && (
        <div className="empty"><h2>Catálogo vacío</h2><p>No hay ETF disponibles en tu sesión.</p></div>
      )}
      {catalog.status === "ready" && (() => {
        const selection = selectEtfsForComparison(catalog.profiles, selectedIds);
        return (
          <>
            <form action="/comparador" method="get" className="panel comparison-picker">
              <fieldset>
                <legend>Elige {MIN_COMPARISON_ETFS} a {MAX_COMPARISON_ETFS} ETF</legend>
                <p className="comparison-help">La selección identifica cada listing por un ID único; un ticker en otra bolsa se trata como otro listing.</p>
                <div className="comparison-choices">
                  {catalog.profiles.map((p) => (
                    <label key={p.listingId} className="comparison-choice">
                      <input type="checkbox" name="listing" value={p.listingId} defaultChecked={selectedIds.includes(p.listingId)} />
                      <span><strong>{p.ticker}</strong><small>{p.exchange} · {p.currency}</small><small>{p.isin}</small></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="comparison-actions">
                <button className="primary-button" type="submit">Comparar seleccionados</button>
                <Link href="/comparador" className="etf-clear">Limpiar</Link>
              </div>
            </form>
            {selection.kind === "empty" && (
              <div className="empty"><h2>Selecciona tus alternativas</h2><p>Marca entre dos y cinco ETF para visualizar su matriz comparativa.</p></div>
            )}
            {selection.kind === "too_few" && <div className="info" role="alert">Selecciona al menos dos ETF diferentes.</div>}
            {selection.kind === "too_many" && <div className="info" role="alert">La comparación admite un máximo de cinco ETF.</div>}
            {selection.kind === "not_found" && (
              <div className="info" role="alert">Uno o más listings ya no están disponibles en el catálogo. Revisa la selección y vuelve a comparar.</div>
            )}
            {selection.kind === "ready" && (
              <>
                <ComparisonTable profiles={selection.items} asOf={catalog.asOf} />
                <form action={saveComparisonAction} className="panel comparison-save"
                  aria-labelledby="save-comparison-heading">
                  <h2 id="save-comparison-heading">Guardar esta comparación</h2>
                  <p className="comparison-help">
                    Se conservarán los listings, la fecha de corte, los valores
                    disponibles, las versiones y los documentos de origen.
                    No podrás sobrescribir una fotografía anterior.
                  </p>
                  {selection.items.map((p) => (
                    <input key={p.listingId} type="hidden" name="listing" value={p.listingId} />
                  ))}
                  <label htmlFor="comparison-title">Título de la comparación</label>
                  <input id="comparison-title" name="title" type="text" maxLength={120}
                    placeholder={`Ejemplo: ${selection.items.map((p) => p.ticker).join(" vs ")}`} />
                  <div className="comparison-actions">
                    <button className="primary-button" type="submit">Guardar fotografía</button>
                    <Link href="/comparador/guardadas" className="etf-clear">Ver historial</Link>
                  </div>
                </form>
              </>
            )}
          </>
        );
      })()}
      <section className="panel comparison-history" aria-labelledby="comparison-history-title">
        <h2 id="comparison-history-title">Comparaciones guardadas</h2>
        {history.status === "error"
          ? <p className="comparison-help">{history.message}</p>
          : history.rows.length === 0
            ? <p className="comparison-help">Todavía no hay comparaciones guardadas.</p>
            : <ul className="comparison-history-list">
                {history.rows.slice(0, 5).map((row) => (
                  <li key={row.id}>
                    <Link href={`/comparador/guardadas/${row.id}`}>{row.title}</Link>
                    <small>{formatSavedTimestamp(row.saved_at)} · {row.listing_ids.length} ETF</small>
                  </li>
                ))}
              </ul>}
        <Link href="/comparador/guardadas" className="etf-clear">Abrir historial completo</Link>
      </section>
    </section>
  );
}
