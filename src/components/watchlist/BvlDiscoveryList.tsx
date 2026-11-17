import {
  BVL_CODES_AS_OF, BVL_CODES_SOURCE, BVL_DISCOVERY_CANDIDATES,
  BVL_ISSUERS_AS_OF, BVL_ISSUERS_SOURCE, filterBvlCandidates,
} from "@/lib/bvl-discovery";
import { formatDate } from "@/lib/etfs/catalog";

export function BvlDiscoveryList({ query }: Readonly<{ query: string }>) {
  const entries = filterBvlCandidates(BVL_DISCOVERY_CANDIDATES, query);
  return (
    <section className="watchlist-section" aria-labelledby="bvl-discovery-title">
      <div className="watchlist-heading">
        <h2 id="bvl-discovery-title">Bolsa local · BVL</h2>
        <span className="tag">{entries.length} empresas de referencia</span>
      </div>
      <div className="panel watchlist-bvl-intro">
        <p className="eyebrow">Bolsa de Valores de Lima · selección para investigar</p>
        <p>
          Además de tus cinco ETF, aquí tienes ejemplos de empresas que aparecen
          en documentación de la BVL. Esta es una lista de investigación,
          <strong> no una lista de posiciones que posees o sigues todavía</strong>.
          Para agregarlas a tu seguimiento primero debemos verificar formalmente
          la clase del valor, el identificador y su cotización en BF-040.
        </p>
        <p className="etf-meta">
          Códigos según tabla BVL vigente desde {formatDate(BVL_CODES_AS_OF)};
          relación de emisores del índice BVL publicada al {formatDate(BVL_ISSUERS_AS_OF)}.
          Estas fuentes no garantizan precio, liquidez ni estado actual de negociación.
        </p>
        <div className="watchlist-bvl-sources">
          <a href={BVL_CODES_SOURCE} target="_blank" rel="noopener noreferrer">
            Tabla oficial de valores BVL ↗
          </a>
          <a href={BVL_ISSUERS_SOURCE} target="_blank" rel="noopener noreferrer">
            Listado BVL de empresas ↗
          </a>
        </div>
      </div>
      {entries.length === 0 ? (
        <div className="empty">
          <h3>Sin coincidencias en la selección BVL</h3>
          <p>Prueba con Alicorp, Ferreycorp, BBVA o elimina el filtro de búsqueda.</p>
        </div>
      ) : (
        <div className="watchlist-bvl-grid">
          {entries.map((entry) => (
            <article className="panel watchlist-bvl-card" key={entry.mnemonic}>
              <div className="watchlist-card-top">
                <strong className="watchlist-ticker">{entry.mnemonic}</strong>
                <span className="tag">En investigación</span>
              </div>
              <h3>{entry.issuerName}</h3>
              <p className="etf-meta">{entry.marketLabel} · {entry.classLabel}</p>
              <p className="etf-meta">
                Sin precio ni moneda de negociación verificados en esta ficha.
                No equivale a una recomendación.
              </p>
              <div className="watchlist-bvl-card-footer">
                <span className="watchlist-bvl-pending">Seguimiento disponible tras BF-040</span>
                <a href={BVL_CODES_SOURCE} target="_blank" rel="noopener noreferrer">
                  Referencia BVL ↗
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
