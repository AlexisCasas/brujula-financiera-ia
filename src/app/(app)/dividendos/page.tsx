import Link from "next/link";
import { connection } from "next/server";
import { getEtfCatalog } from "@/lib/etfs/queries";
import { getEquityCatalog } from "@/lib/equities/queries";
import { getWatchlistHistory } from "@/lib/watchlist-queries";
import {
  calendarEntries, formatCalendarDate, formatDividendAmount, validCalendarYear,
  MONTH_NAMES, VERIFIED_THROUGH, type CalendarInstrument, type DividendStatus,
} from "@/lib/dividends/calendar";

export const metadata = { title: "Calendario de dividendos · Brújula Financiera IA" };
const STATUS: Record<DividendStatus, string> = {
  declared: "Dividendo anunciado",
  "issuer-calendar": "Fecha programada por emisor",
  conditional: "Posible, no confirmado",
};

export default async function DividendCalendarPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ year?: string; month?: string; market?: string; q?: string; scope?: string }> }>) {
  await connection();
  const params = await searchParams;
  const year = validCalendarYear(params.year);
  const month = typeof params.month === "string" && /^(0[1-9]|1[0-2])$/.test(params.month) ? params.month : "";
  const market = params.market === "ETF" || params.market === "BVL" ? params.market : "all";
  const scope = params.scope === "followed" ? "followed" : "all";
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 80) : "";
  const [etfs, equities, watchlist] = await Promise.all([getEtfCatalog(), getEquityCatalog(), getWatchlistHistory()]);
  const instruments: CalendarInstrument[] = [
    ...etfs.profiles.map((p) => ({ listingId: p.listingId, isin: p.isin, ticker: p.ticker,
      name: p.name, market: "ETF" as const, currency: p.currency, accumulation: p.distributionPolicy === "accumulating" })),
    ...equities.rows.map((p) => ({ listingId: p.listing_id, isin: p.isin, ticker: p.ticker,
      name: p.name, market: "BVL" as const, currency: p.currency, accumulation: false })),
  ];
  const activeIds = new Set(watchlist.items.filter((x) => x.status === "active").map((x) => x.listing_id));
  const visible = instruments.filter((item) => {
    if (market !== "all" && item.market !== market) return false;
    if (scope === "followed" && !activeIds.has(item.listingId)) return false;
    return !query || [item.ticker, item.name, item.isin].some((value) => value.toLocaleLowerCase("es").includes(query.toLocaleLowerCase("es")));
  });
  const allEntries = calendarEntries(visible, year);
  const entries = allEntries.filter((entry) => !month || entry.event.payDate.slice(5, 7) === month);
  const withEvidence = new Set(allEntries.map((entry) => entry.instrument.isin));
  const noEvents = visible.filter((item) => !withEvidence.has(item.isin));
  const scheduled = entries.filter((entry) => entry.event.status !== "conditional").length;
  const conditional = entries.length - scheduled;
  const linkForMonth = (nextMonth: string) => {
    const queryParams = new URLSearchParams({ year: String(year) });
    if (nextMonth) queryParams.set("month", nextMonth);
    if (market !== "all") queryParams.set("market", market);
    if (scope !== "all") queryParams.set("scope", scope);
    if (query) queryParams.set("q", query);
    return "/dividendos?" + queryParams.toString();
  };
  return (
    <section aria-labelledby="screen-title">
      <header className="intro">
        <p className="eyebrow">Distribuciones sustentadas en fuentes</p>
        <h1 id="screen-title">Calendario de dividendos.</h1>
        <p>Consulta las fechas de entrega publicadas para ETF y acciones de nuestro inventario. La lista no representa
          posiciones compradas ni ingresos personales. Información recopilada hasta el {formatCalendarDate(VERIFIED_THROUGH)}.</p>
      </header>
      {(etfs.status === "error" || equities.status === "error" || watchlist.status === "error") && (
        <div className="info" role="alert">Hay catálogos o datos de seguimiento sin cargar.
          Solo se muestran los instrumentos disponibles; el filtro de seguimiento puede ser incompleto.</div>
      )}
      <div className="dividend-stats" aria-label="Cobertura del calendario">
        <div className="panel"><span>Instrumentos visibles</span><strong>{visible.length}</strong><small>ETF y acciones verificadas</small></div>
        <div className="panel"><span>Eventos documentados</span><strong>{scheduled}</strong><small>Pagos históricos y fechas programadas</small></div>
        <div className="panel"><span>Pagos condicionales</span><strong>{conditional}</strong><small>No equivalen a dividendos declarados</small></div>
      </div>
      <form className="panel dividend-filters" method="get" action="/dividendos" role="search">
        <label>Año
          <select name="year" defaultValue={String(year)}><option value="2026">2026</option><option value="2027">2027</option></select>
        </label>
        <label>Mercado
          <select name="market" defaultValue={market}><option value="all">ETF y acciones BVL</option><option value="ETF">Solo ETF</option><option value="BVL">Solo acciones BVL</option></select>
        </label>
        <label>Alcance
          <select name="scope" defaultValue={scope}><option value="all">Todo el catálogo</option><option value="followed">Solo mi seguimiento</option></select>
        </label>
        <label>Instrumento
          <input type="search" name="q" defaultValue={query} maxLength={80} placeholder="Ticker, nombre o ISIN" />
        </label>
        {month && <input name="month" type="hidden" value={month} />}
        <div className="dividend-filter-buttons"><button className="primary-button" type="submit">Aplicar filtros</button>
          <Link href="/dividendos" className="etf-clear">Limpiar</Link></div>
      </form>
      <section className="dividend-month-section" aria-labelledby="dividend-months-title">
        <div className="dividend-heading">
          <h2 id="dividend-months-title">Meses de {year}</h2>
          <Link href={linkForMonth("")} className={month ? "etf-clear" : "tag ok"} aria-current={!month ? "page" : undefined}>Ver todo el año</Link>
        </div>
        <div className="dividend-month-grid">
          {MONTH_NAMES.map((name, i) => {
            const key = String(i + 1).padStart(2, "0");
            const count = allEntries.filter((entry) => entry.event.payDate.slice(5, 7) === key).length;
            return <Link key={key} className={month === key ? "dividend-month active" : "dividend-month"} href={linkForMonth(key)}
              aria-current={month === key ? "page" : undefined}>
              <span>{name}</span><strong>{count}</strong><small>{count === 1 ? "evento" : "eventos"}</small>
            </Link>;
          })}
        </div>
      </section>
      <section className="dividend-results" aria-labelledby="dividend-results-title">
        <div className="dividend-heading">
          <h2 id="dividend-results-title">{month ? MONTH_NAMES[Number(month) - 1] : "Todo el año"} {year}</h2>
          <span className="tag">{entries.length} evento(s)</span>
        </div>
        {entries.length === 0 ? <div className="empty"><h3>No hay pagos identificados para esta selección</h3>
          <p>Esto no significa que los emisores no repartan dividendos. No completamos fechas futuras mediante extrapolaciones.</p></div> :
          <ol className="dividend-events">
            {entries.map(({ instrument, event }, i) => (
              <li key={event.isin + event.payDate + i} className="panel dividend-event">
                <div className="dividend-event-date"><time dateTime={event.payDate}>{formatCalendarDate(event.payDate)}</time>
                  <small>Fecha de entrega / pago</small></div>
                <div className="dividend-event-main">
                  <div className="dividend-event-top"><strong>{instrument.ticker}</strong>
                    <span className={event.status === "conditional" ? "tag" : event.status === "declared" ? "tag ok" : "tag"}>
                      {STATUS[event.status]}</span>
                    <span className="dividend-market">{instrument.market}</span></div>
                  <p className="dividend-name">{instrument.name}</p>
                  <p className="dividend-amount">{formatDividendAmount(event)}</p>
                  <p className="dividend-evidence">
                    {event.recordDate ? "Registro: " + formatCalendarDate(event.recordDate) + " · " : ""}
                    {event.exDate ? "Ex-dividendo: " + formatCalendarDate(event.exDate) + " · " : ""}
                    ISIN {instrument.isin}</p>
                  {event.note && <p className="dividend-evidence">{event.note}</p>}
                  <a href={event.sourceUrl} target="_blank" rel="noopener noreferrer" className="etf-clear">Consultar fuente</a>
                </div>
              </li>
            ))}
          </ol>
        }
      </section>
      {noEvents.length > 0 && (
        <section className="panel dividend-unpublished" aria-labelledby="dividend-unpublished-title">
          <h2 id="dividend-unpublished-title">Sin fecha de pago publicada en esta selección anual</h2>
          <p>Se muestra el inventario completo, incluso cuando todavía no hay fechas verificadas.
            Un ETF de acumulación no entrega dividendos al partícipe.</p>
          <ul>{noEvents.map((item) => <li key={item.listingId}><strong>{item.ticker}</strong><span>{item.name}</span>
            <small>{item.accumulation ? "Acumulación: reinversión interna, sin pago en efectivo" :
              "Sin evento incorporado para " + year + "; no implica ausencia de dividendos"}</small></li>)}</ul>
        </section>
      )}
      <div className="info dividend-disclaimer"><strong>Cómo interpretar este calendario.</strong>
        <p>Las fechas de 2026 incluyen información histórica y programaciones de los emisores. Las posibles distribuciones
          extraordinarias de enero de 2027 son <strong>condicionales</strong>, no pagos anunciados. Los importes en blanco
          son desconocidos, no cero. No se actualiza automáticamente: verifica la fuente antes de operar.</p>
        <p>La fecha de registro identifica a los titulares reconocidos; la fecha ex-dividendo es diferente y puede variar
          según mercado. El cobro depende de ser titular con derecho, del intermediario, de impuestos y de otros factores.</p>
      </div>
    </section>
  );
}
