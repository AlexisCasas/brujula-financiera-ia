"use client";

import { useState } from "react";
import { formatDate, validSourceUrl, type EtfProfile } from "@/lib/etfs/catalog";
import {
  RETURN_WINDOWS, assessComparableReturns, exactBenchmarkMatches,
  windowStartDate, type ReturnGateReason, type ReturnWindow,
  type VerifiedDailySeries,
} from "@/lib/etfs/historical-comparability";

const REASON_LABEL: Record<ReturnGateReason, string> = {
  ready: "Período comparable",
  missing_series: "Sin series de precios verificadas",
  invalid_observations: "Datos de precios inválidos",
  unverified_source: "Falta licencia, metodología o fuente documentada",
  incompatible_currency: "Monedas distintas: falta FX por fecha",
  incompatible_price_basis: "No se pueden mezclar tipos de precio",
  nonoverlapping_dates: "No coinciden las fechas efectivamente observadas",
  insufficient_coverage: "Insuficientes sesiones compartidas",
  suspicious_change: "Cambio abrupto: revisar eventos corporativos",
};

export function HistoricalComparabilityPanel({
  profiles, asOf, series,
}: Readonly<{
  profiles: EtfProfile[];
  asOf: string;
  series: VerifiedDailySeries[];
}>) {
  const [window, setWindow] = useState<ReturnWindow>("12M");
  const [endDate, setEndDate] = useState(asOf);
  const ids = profiles.map((p) => p.listingId);
  const assessment = assessComparableReturns(ids, series, endDate, window);
  const benchmarkMatches = exactBenchmarkMatches(profiles);
  const validRequestedDate = windowStartDate(endDate, window) !== null &&
    endDate <= asOf;

  return (
    <section className="panel history-comparability" aria-labelledby="historic-coverage-title">
      <header>
        <p className="eyebrow">BF-024b · Calidad y períodos comparables</p>
        <h2 id="historic-coverage-title">Comparabilidad histórica</h2>
        <p className="comparison-help">
          Selecciona una ventana temporal y examina la cobertura. La app no
          calculará rentabilidad hasta disponer de observaciones documentadas,
          con moneda y metodología compatibles.
        </p>
      </header>
      <div className="history-window-controls">
        <fieldset>
          <legend>Ventana objetivo</legend>
          <div className="history-window-options">
            {RETURN_WINDOWS.map((term) => (
              <label key={term.key}>
                <input type="radio" name="comparison-window" value={term.key}
                  checked={window === term.key}
                  onChange={() => setWindow(term.key)} />
                <span>{term.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="history-end">
          Fecha final de referencia (UTC)
          <input type="date" value={endDate} max={asOf}
            onChange={(event) => setEndDate(event.target.value)} />
        </label>
      </div>

      {!validRequestedDate && (
        <p className="info" role="alert">
          Fecha inválida o posterior al día de consulta. Elige una fecha UTC hasta {formatDate(asOf)}.
        </p>
      )}
      <div className="history-status" role="status" aria-live="polite">
        <div>
          <span>Estado actual</span>
          <strong>{validRequestedDate
            ? REASON_LABEL[assessment.reason]
            : "Fecha de consulta no válida"}</strong>
        </div>
        <div>
          <span>Período solicitado</span>
          <strong>{formatDate(assessment.requestedStart)} — {formatDate(assessment.requestedEnd)}</strong>
        </div>
        <div>
          <span>Sesiones comunes</span>
          <strong>{assessment.sharedSessions} / mínimo {assessment.requiredSessions}</strong>
        </div>
      </div>

      {assessment.reason === "ready" && validRequestedDate ? (
        <div className="table-scroll" role="region" aria-label="Variación histórica comparable" tabIndex={0}>
          <table>
            <caption>
              {assessment.method}. Observaciones comunes del {formatDate(assessment.observedStart)}
              al {formatDate(assessment.observedEnd)}; no se interpolan precios.
            </caption>
            <thead><tr><th scope="col">ETF</th><th scope="col">Variación observada</th>
              <th scope="col">Moneda</th><th scope="col">Fuente</th></tr></thead>
            <tbody>
              {assessment.results.map((result) => (
                <tr key={result.listingId}>
                  <th scope="row">{result.ticker}</th>
                  <td>{new Intl.NumberFormat("es-PE", {
                    minimumFractionDigits: 2, maximumFractionDigits: 2,
                  }).format(result.returnPercent)} %</td>
                  <td>{result.currency}</td>
                  <td><a href={result.sourceUrl} target="_blank" rel="noopener noreferrer">
                    {result.sourceName}
                  </a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="info" role="status">
          <p><strong>No comparable: no se publica ninguna rentabilidad.</strong></p>
          <p>
            {series.length === 0
              ? "BF-013 todavía no ha integrado series autorizadas de precios diarios. Los datos actuales de TER y patrimonio no sirven para reconstruir el rendimiento."
              : REASON_LABEL[assessment.reason] + ". Revisa el período, los precios y las fuentes de cada listing."}
          </p>
        </div>
      )}

      <div className="table-scroll" role="region" aria-label="Estado de cobertura de ETF" tabIndex={0}>
        <table className="history-coverage-table">
          <caption>Estado de entrada real, sin observaciones sintéticas en el navegador.</caption>
          <thead><tr>
            <th scope="col">ETF</th><th scope="col">Bolsa y moneda</th>
            <th scope="col">Serie histórica</th><th scope="col">Fuente validada</th>
          </tr></thead>
          <tbody>
            {profiles.map((profile) => {
              const found = series.find((s) => s.listingId === profile.listingId);
              return <tr key={profile.listingId}>
                <th scope="row">{profile.ticker}</th>
                <td>{profile.exchange} · {profile.currency}</td>
                <td>{found
                  ? String(found.observations.length) + " observaciones · " + found.basis
                  : "No integrada"}</td>
                <td>{found && validSourceUrl(found.sourceUrl) && found.licenseApproved &&
                  found.methodologyVerified ? "Documentada" : "Pendiente"}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      <section aria-labelledby="benchmark-match-title" className="history-benchmarks">
        <h3 id="benchmark-match-title">Índices de referencia declarados</h3>
        {benchmarkMatches.length > 0 ? (
          <>
            <p className="comparison-help">
              Detectamos la coincidencia exacta del nombre del índice registrado;
              no significa que las carteras, participaciones o rendimientos sean idénticos.
            </p>
            <ul>
              {benchmarkMatches.map((match) => <li key={match.indexName}>
                <strong>{match.tickers.join(" y ")}</strong> — {match.indexName}
              </li>)}
            </ul>
          </>
        ) : <p className="comparison-help">
          No hay coincidencias exactas entre los nombres de índices de los ETF seleccionados.
        </p>}
        <details className="etf-details">
          <summary>Inspeccionar origen del índice de cada ETF</summary>
          <ul className="etf-evidence">
            {profiles.map((p) => {
              const evidence = p.evidence.find((x) => x.field === "index_name");
              const url = validSourceUrl(evidence?.sourceUrl);
              return <li key={p.listingId}>
                <strong>{p.ticker}</strong>
                <span>{p.indexName || "Índice no documentado"}</span>
                <span>{evidence?.status || "Sin estado de evidencia"}</span>
                <span>{formatDate(evidence?.sourceDate)}</span>
                {url && <a href={url} target="_blank" rel="noopener noreferrer">Documento ↗</a>}
              </li>;
            })}
          </ul>
        </details>
      </section>

      <details className="etf-details" open>
        <summary>Reglas del cálculo y control de calidad</summary>
        <div className="cost-methodology">
          <p>
            Un período se calcula únicamente cuando todos los ETF tienen el mismo
            tipo de precio, moneda, fechas de observación de inicio y cierre y
            suficientes sesiones diarias compartidas. Se admite el último día
            observado común anterior al inicio/cierre solicitado, con un máximo
            de cinco días calendario de desfase. Nunca se interpolan huecos.
          </p>
          <p>
            Los precios deben ser positivos y únicos por fecha. Se bloquean
            fuentes sin licencia/metodología verificadas y cambios abruptos
            superiores al 60 % entre sesiones cercanas para revisión.
          </p>
          <p>
            Fórmula de variación de la serie: (valor final / valor inicial − 1) × 100.
            La variación del precio sin ajustar excluye dividendos; precio ajustado
            y NAV tampoco se anuncian como retorno total sin metodología verificada.
          </p>
          <p>
            La moneda PEN requiere tipos de cambio históricos pertinentes de
            BF-014; no se aplica un tipo de cambio actual a los valores pasados.
          </p>
        </div>
      </details>
    </section>
  );
}
