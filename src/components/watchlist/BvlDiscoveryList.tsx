import { changeWatchlistAction } from "@/app/(app)/seguimiento/actions";
import { WatchlistSubmit } from "@/components/watchlist/WatchlistSubmit";
import {
  BVL_CODES_SOURCE, BVL_DISCOVERY_CANDIDATES,
  BVL_STOCK_REPORT_SOURCE, BVL_STOCK_REPORT_AS_OF,
  filterBvlCandidates,
} from "@/lib/bvl-discovery";
import { formatDate, validSourceUrl } from "@/lib/etfs/catalog";
import type { EquityListing } from "@/lib/equities/types";
import { buildEquityWatchRows } from "@/lib/equities/types";
import type { WatchlistItem } from "@/lib/watchlist";
import { watchlistDate } from "@/lib/watchlist";

export function BvlDiscoveryList({
  query, equities, history, ready,
}: Readonly<{
  query: string;
  equities: EquityListing[];
  history: WatchlistItem[];
  ready: boolean;
}>) {
  const rows = buildEquityWatchRows(equities, history, query);
  const fallback = ready ? [] : filterBvlCandidates(BVL_DISCOVERY_CANDIDATES, query);
  const count = ready ? rows.length : fallback.length;
  return (
    <section className="watchlist-section" aria-labelledby="bvl-discovery-title">
      <div className="watchlist-heading">
        <h2 id="bvl-discovery-title">Bolsa local · BVL</h2>
        <span className="tag">{count} acciones</span>
      </div>
      <div className="panel watchlist-bvl-intro">
        <p className="eyebrow">Acciones de la Bolsa de Valores de Lima</p>
        <p>
          Selección inicial de nueve acciones de capital, incluida
          <strong> Credicorp Ltd. (BAP)</strong>. Puedes agregar a seguimiento
          los valores identificados en Supabase y recuperar todo el historial si
          más adelante decides dejarlos de seguir.
        </p>
        <p>
          <strong>Seguir no significa comprar ni poseer.</strong> La identidad
          documentada no garantiza negociación continua o liquidez. La BVL puede
          cotizar valores tanto en PEN como USD: Credicorp e InRetail figuran en USD.
          No estamos mostrando precios actuales, dividendos ni recomendaciones.
        </p>
        <p className="etf-meta">
          Identificadores, ISIN y moneda revisados con el boletín oficial BVL al
          {formatDate(BVL_STOCK_REPORT_AS_OF)}. Cada ficha enlaza a su fuente.
          Credicorp BAP también cotiza en NYSE, pero esta sección sigue
          específicamente su listing en Lima (XLIM).
        </p>
        <div className="watchlist-bvl-sources">
          <a href={BVL_STOCK_REPORT_SOURCE} target="_blank" rel="noopener noreferrer">
            Boletín BVL · Fuente principal ↗
          </a>
          <a href="https://credicorp.gcs-web.com/resources/faqs"
             target="_blank" rel="noopener noreferrer">
            Relaciones con Inversores · Credicorp ↗
          </a>
          <a href={BVL_CODES_SOURCE} target="_blank" rel="noopener noreferrer">
            Referencia BVL de nemónicos ↗
          </a>
        </div>
        {!ready && (
          <div className="info" role="alert">
            Las acciones están en modo referencia porque el catálogo BF-040
            todavía no está disponible. No se habilitan cambios hasta verificar
            el acceso a la base de datos.
          </div>
        )}
      </div>

      {count === 0 && (
        <div className="empty">
          <h3>No hay acciones de la BVL que coincidan</h3>
          <p>Prueba con Credicorp, Alicorp, Ferreycorp, BAP o limpia el filtro.</p>
        </div>
      )}

      <div className="watchlist-bvl-grid">
        {ready ? rows.map((row) => {
          const evidence = validSourceUrl(row.source_url);
          return (
            <article className="panel watchlist-bvl-card" key={row.listing_id}>
              <div className="watchlist-card-top">
                <strong className="watchlist-ticker">{row.ticker}</strong>
                <span className={row.following ? "tag ok" : "tag"}>
                  {row.following ? "En seguimiento" :
                    row.saved ? "Dejaste de seguir" : "Disponible"}
                </span>
              </div>
              <h3>{row.name}</h3>
              <p className="etf-meta">
                BVL · {row.exchange} · Acción · {row.currency}
              </p>
              <p className="etf-meta">ISIN: <code>{row.isin}</code></p>
              <p className="etf-meta">
                Identidad: documentada al {formatDate(row.source_date)}.
                Estado de negociación: {row.listing_status === "unverified"
                  ? "no verificado" : row.listing_status}.
              </p>
              {row.saved && <p className="etf-meta">
                Desde {watchlistDate(row.saved.first_followed_at)} ·
                Último cambio {watchlistDate(row.saved.status_changed_at)}
              </p>}
              <div className="watchlist-bvl-card-footer">
                <form action={changeWatchlistAction}>
                  <input type="hidden" name="listing_id" value={row.listing_id} />
                  <input type="hidden" name="mode"
                    value={row.following ? "unfollow" : "follow"} />
                  <WatchlistSubmit
                    label={row.following ? "Dejar de seguir"
                      : row.saved ? "Volver a seguir" : "Agregar a seguimiento"}
                    variant={row.following ? "secondary" : "primary"}
                  />
                </form>
                {evidence && <a href={evidence} target="_blank"
                  rel="noopener noreferrer">Ver fuente BVL ↗</a>}
              </div>
            </article>
          );
        }) : fallback.map((entry) => (
          <article className="panel watchlist-bvl-card" key={entry.mnemonic}>
            <div className="watchlist-card-top">
              <strong className="watchlist-ticker">{entry.mnemonic}</strong>
              <span className="tag">Referencia</span>
            </div>
            <h3>{entry.issuerName}</h3>
            <p className="etf-meta">
              {entry.marketLabel} · {entry.classLabel} · {entry.currency}
            </p>
            <p className="etf-meta">ISIN: <code>{entry.isin}</code></p>
            <div className="watchlist-bvl-card-footer">
              <span className="watchlist-bvl-pending">Alta pendiente de habilitación</span>
              <a href={BVL_STOCK_REPORT_SOURCE} target="_blank"
                rel="noopener noreferrer">Ver fuente BVL ↗</a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
