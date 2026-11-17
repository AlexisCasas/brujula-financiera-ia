import Link from "next/link";
import { getEtfCatalog } from "@/lib/etfs/queries";
import {
  distributionLabel, formatPercent, type EtfProfile,
} from "@/lib/etfs/catalog";
import { getWatchlistHistory } from "@/lib/watchlist-queries";
import {
  buildWatchlistView, searchWatchlistView, watchlistDate,
  watchlistEventText, watchlistNotice, watchlistAsOfText,
  type WatchlistViewItem,
} from "@/lib/watchlist";
import { findNavItem } from "@/lib/navigation";
import { changeWatchlistAction } from "./actions";
import { WatchlistSubmit } from "@/components/watchlist/WatchlistSubmit";
import { BvlDiscoveryList } from "@/components/watchlist/BvlDiscoveryList";

const item = findNavItem("/seguimiento")!;
export const metadata = { title: "Mi seguimiento · Brújula Financiera IA" };

function ListingIdentity({ profile }: Readonly<{ profile: EtfProfile }>) {
  return (
    <div className="watchlist-identity">
      <div className="watchlist-ticker">{profile.ticker}</div>
      <div>
        <strong>{profile.name}</strong>
        <span>{profile.exchange} · {profile.currency} · ISIN {profile.isin}</span>
      </div>
    </div>
  );
}

function WatchCard({
  row, canEdit,
}: Readonly<{ row: WatchlistViewItem; canEdit: boolean }>) {
  const { profile, saved, isFollowing } = row;
  const ter = profile.metrics.ter_percent;
  const terLabel = ter?.availability === "disponible"
    ? formatPercent(ter.value) : "No disponible";
  return (
    <article className="panel watchlist-card" aria-labelledby={"watch-" + profile.listingId}>
      <div className="watchlist-card-top">
        <div id={"watch-" + profile.listingId}>
          <ListingIdentity profile={profile} />
        </div>
        <span className={isFollowing ? "tag ok" : "tag"}>
          {isFollowing ? "En seguimiento" : saved ? "Dejaste de seguir" : "Disponible"}
        </span>
      </div>
      <div className="watchlist-facts">
        <div><span>Política del fondo</span><strong>{distributionLabel(profile.distributionPolicy)}</strong></div>
        <div><span>Gasto anual documentado</span><strong>{terLabel}</strong></div>
      </div>
      <p className="etf-meta">{watchlistAsOfText(profile)}.
        Los valores corresponden a la fuente, no son cotizaciones actuales.</p>
      {saved && <p className="etf-meta">
        Primer seguimiento: {watchlistDate(saved.first_followed_at)}
        {" · "}Último cambio: {watchlistDate(saved.status_changed_at)}
      </p>}
      <div className="watchlist-card-actions">
        {canEdit && (
          <form action={changeWatchlistAction}>
            <input type="hidden" name="listing_id" value={profile.listingId} />
            <input type="hidden" name="mode" value={isFollowing ? "unfollow" : "follow"} />
            <WatchlistSubmit
              label={isFollowing ? "Dejar de seguir" : saved ? "Volver a seguir" : "Agregar a seguimiento"}
              variant={isFollowing ? "secondary" : "primary"}
            />
          </form>
        )}
        <Link href={"/explorar?q=" + encodeURIComponent(profile.isin)}
          className="etf-clear">Consultar ficha y fuentes</Link>
      </div>
    </article>
  );
}

export default async function WatchlistPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ q?: string; notice?: string }> }>) {
  const { q, notice } = await searchParams;
  const query = typeof q === "string" ? q.trim().slice(0, 120) : "";
  const [catalog, history] = await Promise.all([
    getEtfCatalog(), getWatchlistHistory(),
  ]);
  const canEdit = catalog.status === "ready" && history.status === "ready";
  const rows = buildWatchlistView(catalog.profiles, history.items);
  const matching = searchWatchlistView(rows, query);
  const followed = matching.filter((row) => row.isFollowing);
  const available = matching.filter((row) => !row.isFollowing);
  const totalFollowing = rows.filter((row) => row.isFollowing).length;
  const profileById = new Map(catalog.profiles.map((p) => [p.listingId, p]));
  const noticeText = watchlistNotice(notice);

  return (
    <section aria-labelledby="screen-title">
      <header className="intro">
        <p className="eyebrow">{item.eyebrow}</p>
        <h1 id="screen-title">{item.heading}</h1>
        <p>
          Guarda los ETF que quieres investigar, deja de seguirlos cuando quieras
          y conserva las fechas de tus cambios. <strong>Seguir un activo no significa
          que lo hayas comprado ni que forme parte de tu cartera.</strong>
        </p>
      </header>

      {noticeText && <div className="info" role="status">{noticeText}</div>}
      {history.status === "error" && <div className="info" role="alert">
        <p>{history.message}</p>
        <p>La pantalla se puede revisar, pero el guardado está deshabilitado
          hasta que se autorice y aplique la migración BF-041a.</p>
      </div>}
      {catalog.status === "error" && <div className="info" role="alert">
        <p>{catalog.message}</p><Link href="/seguimiento">Reintentar</Link>
      </div>}

      <div className="watchlist-summary" aria-label="Resumen de seguimiento">
        <div className="panel">
          <span>Siguiendo actualmente</span>
          <strong>{history.status === "ready" ? totalFollowing : "N/D"}</strong>
          <small>Intereses, no tenencias</small>
        </div>
        <div className="panel">
          <span>Activos en catálogo</span>
          <strong>{catalog.status === "ready" ? catalog.profiles.length : "N/D"}</strong>
          <small>ETF identificados con ISIN y bolsa</small>
        </div>
        <div className="panel">
          <span>Historial registrado</span>
          <strong>{history.status === "ready" ? history.events.length : "N/D"}</strong>
          <small>Últimos 40 eventos disponibles</small>
        </div>
      </div>

      <section className="panel watchlist-discovery" aria-labelledby="watchlist-discovery-title">
        <h2 id="watchlist-discovery-title">Buscar activos registrados</h2>
        <form method="get" action="/seguimiento" role="search">
          <label htmlFor="watchlist-query">Nombre, ticker, ISIN o mercado</label>
          <div className="etf-search-row">
            <input type="search" id="watchlist-query" name="q"
              defaultValue={query} maxLength={120}
              placeholder="Ejemplo: VWRA, FWRA o Vanguard" />
            <button className="primary-button" type="submit">Buscar</button>
            {query && <Link href="/seguimiento" className="etf-clear">Limpiar</Link>}
          </div>
        </form>
        <p className="etf-meta">
          Solo están disponibles los ETF ya identificados en Supabase.
          Las acciones individuales de la Bolsa local aparecen abajo como referencias para investigar; su incorporación al seguimiento requiere BF-040.
          no agregamos un ticker sin verificar el emisor y su mercado.
        </p>
      </section>

      {catalog.status === "ready" && (
        <>
          <section aria-labelledby="watchlist-following-title" className="watchlist-section">
            <div className="watchlist-heading">
              <h2 id="watchlist-following-title">Mi lista de seguimiento</h2>
              <span className="tag ok">{followed.length} activo(s)</span>
            </div>
            {followed.length === 0 ? (
              <div className="empty">
                <h3>{query ? "No hay coincidencias entre tus activos seguidos"
                  : "Aún no sigues ningún ETF"}</h3>
                <p>Puedes empezar con los instrumentos del catálogo inferior.
                  Tu selección se guardará sin registrar compras ni cantidades.</p>
              </div>
            ) : (
              <div className="watchlist-grid">
                {followed.map((row) => (
                  <WatchCard key={row.profile.listingId} row={row} canEdit={canEdit} />
                ))}
              </div>
            )}
          </section>

          <section aria-labelledby="watchlist-available-title" className="watchlist-section">
            <div className="watchlist-heading">
              <h2 id="watchlist-available-title">Otros ETF disponibles</h2>
              <span className="tag">{available.length} opción(es)</span>
            </div>
            {available.length === 0 ? (
              <p className="info">No hay más ETF en el catálogo que coincidan con la búsqueda.</p>
            ) : (
              <div className="watchlist-grid">
                {available.map((row) => (
                  <WatchCard key={row.profile.listingId} row={row} canEdit={canEdit} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <BvlDiscoveryList query={query} />

      <section className="panel watchlist-history" aria-labelledby="watchlist-history-title">
        <h2 id="watchlist-history-title">Historial de seguimiento</h2>
        <p className="etf-meta">Un registro de interés personal, no un historial de operaciones bursátiles.</p>
        {history.status === "ready" && history.events.length === 0 && (
          <p className="info">Todavía no hay altas, bajas ni reactivaciones registradas.</p>
        )}
        {history.status === "ready" && history.events.length > 0 && (
          <ol>
            {history.events.map((event) => {
              const profile = profileById.get(event.listing_id);
              return <li key={event.id}>
                <div>
                  <strong>{profile?.ticker ?? "Listing sin ficha visible"}</strong>
                  <span>{profile?.exchange ?? "Mercado no disponible"}</span>
                </div>
                <span>{watchlistEventText(event.action)}</span>
                <time dateTime={event.occurred_at}>{watchlistDate(event.occurred_at)}</time>
              </li>;
            })}
          </ol>
        )}
      </section>

      <div className="watchlist-footnote">
        <h2>Qué agregaremos en el siguiente incremento</h2>
        <p>
          Acciones individuales con identidad validada, noticias, resultados
          empresariales y distribuciones por activo. La futura integración
          ChatGPT/Claude por MCP permitirá administrar esta misma lista mediante
          acciones explícitas. Ningún seguimiento representa una recomendación.
        </p>
      </div>
    </section>
  );
}
