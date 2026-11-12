import Link from "next/link";
import type { EtfProfile, Measurement } from "@/lib/etfs/catalog";
import {
  NOT_AVAILABLE, distributionLabel, filterProfiles,
  formatDate, metricText, validSourceUrl,
} from "@/lib/etfs/catalog";

const FIELD_NAMES: Record<string, string> = {
  isin: "ISIN", name: "Nombre", issuer: "Gestora", index_name: "Índice",
  domicile: "Domicilio", distribution_policy: "Distribución",
  inception_date: "Inicio", ticker: "Ticker", exchange: "Bolsa",
  currency: "Divisa", status: "Estado del listing",
};
const METRIC_NAMES = {
  ter_percent: "Gasto anual (TER/expense ratio)",
  net_assets: "Patrimonio del ETF / clase",
  fund_net_assets: "Patrimonio total del fondo",
} as const;

function MeasurementRow({ label, metric }: Readonly<{ label: string; metric: Measurement | null }>) {
  const link = validSourceUrl(metric?.sourceUrl);
  const available = metric?.availability === "disponible" && metric.value !== null;
  return (
    <div className="etf-metric">
      <dt>{label}</dt>
      <dd>{metricText(metric)}</dd>
      {available && (
        <p className="etf-meta">
          Dato al {formatDate(metric?.asOfDate)} · Documento {formatDate(metric?.sourceDate)}
          {metric?.version ? ` · v${metric.version}` : ""}
        </p>
      )}
      {!available && <p className="etf-meta">La fuente no declara esta medición.</p>}
      {metric?.note && available && <p className="etf-note">{metric.note}</p>}
      {link && available && (
        <a href={link} target="_blank" rel="noopener noreferrer" className="etf-source">
          Ver fuente original ↗
        </a>
      )}
    </div>
  );
}

function EtfCard({ profile }: Readonly<{ profile: EtfProfile }>) {
  return (
    <article className="panel etf-card" aria-labelledby={`fund-${profile.listingId}`}>
      <div className="etf-card-head">
        <div>
          <p className="eyebrow">{profile.exchange} · {profile.currency}</p>
          <h2 id={`fund-${profile.listingId}`} className="etf-ticker">
            {profile.ticker}
            <span className="etf-name">{profile.name}</span>
          </h2>
          <p className="etf-id">ISIN: <code>{profile.isin}</code></p>
        </div>
        <span className={profile.unverifiedCount === 0 ? "tag ok" : "tag"}>
          {profile.unverifiedCount === null
            ? "Validación no disponible"
            : profile.unverifiedCount === 0
              ? "Campos identificados"
              : `${profile.unverifiedCount} campo(s) sin verificar`}
        </span>
      </div>
      <div className="etf-attributes">
        <p><strong>Gestora:</strong> {profile.issuer || NOT_AVAILABLE}</p>
        <p><strong>Índice:</strong> {profile.indexName || NOT_AVAILABLE}</p>
        <p><strong>Distribución:</strong> {distributionLabel(profile.distributionPolicy)}</p>
        <p><strong>Domicilio:</strong> {profile.domicile || NOT_AVAILABLE}</p>
        <p><strong>Inicio:</strong> {formatDate(profile.inceptionDate)}</p>
      </div>
      <dl className="etf-metrics">
        {Object.entries(METRIC_NAMES).map(([key, label]) => (
          <MeasurementRow
            key={key}
            label={label}
            metric={profile.metrics[key as keyof typeof METRIC_NAMES]}
          />
        ))}
      </dl>
      <details className="etf-details">
        <summary>Ver trazabilidad de los campos ({profile.evidence.length})</summary>
        <p className="etf-meta">
          Cada estado se obtiene de la evidencia almacenada en Supabase; no implica una cotización en tiempo real.
        </p>
        <ul className="etf-evidence">
          {profile.evidence.map((field) => {
            const source = validSourceUrl(field.sourceUrl);
            return (
              <li key={`${field.entityType}:${field.field}`}>
                <strong>{FIELD_NAMES[field.field] ?? field.field}</strong>
                <span>{field.status}</span>
                <span>Fuente: {source
                  ? <a href={source} target="_blank" rel="noopener noreferrer">Documento ↗</a>
                  : NOT_AVAILABLE}
                </span>
                {field.sourceDate && <span>· {formatDate(field.sourceDate)}</span>}
              </li>
            );
          })}
        </ul>
      </details>
    </article>
  );
}

export function EtfCatalog({
  profiles, query, asOf,
}: Readonly<{ profiles: EtfProfile[]; query: string; asOf: string }>) {
  const filtered = filterProfiles(profiles, query);
  return (
    <section aria-label="Catálogo ETF">
      <form method="get" action="/explorar" className="etf-search panel" role="search">
        <label htmlFor="etf-query">Busca por ticker, nombre, ISIN, gestora o índice</label>
        <div className="etf-search-row">
          <input
            id="etf-query" name="q" type="search" defaultValue={query}
            maxLength={120} placeholder="Ejemplo: VWRA, Vanguard o All-World"
          />
          <button className="primary-button" type="submit">Buscar</button>
          {query && <Link href="/explorar" className="etf-clear">Limpiar</Link>}
        </div>
      </form>
      <div className="etf-results-heading">
        <p>{filtered.length} de {profiles.length} listings · Corte de datos: {formatDate(asOf)} (UTC)</p>
        <p className="etf-meta">No hay precios históricos ni conversión PEN en este incremento.</p>
      </div>
      {filtered.length === 0
        ? <div className="empty"><h2>No se encontraron ETF</h2><p>Modifica la búsqueda o consulta los cinco instrumentos del piloto.</p></div>
        : <div className="etf-grid">{filtered.map((profile) => <EtfCard key={profile.listingId} profile={profile} />)}</div>}
    </section>
  );
}
