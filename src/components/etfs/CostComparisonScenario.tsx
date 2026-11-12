"use client";

import { useState } from "react";
import { formatDate, formatPercent } from "@/lib/etfs/catalog";
import {
  calculateIllustrativeAnnualCost,
  formatScenarioMoney,
  parseCapitalInput,
  summarizeExpenseCoverage,
  type ExpenseFund,
  type ExpenseKind,
  type ScenarioCurrency,
} from "@/lib/etfs/cost-analysis";

const KIND_LABELS: Record<ExpenseKind, string> = {
  gross: "Gasto bruto",
  ongoing: "Gasto corriente / OCF",
  expense_ratio: "Ratio de gastos",
  unclassified: "Metodología no identificada",
};

export function CostComparisonScenario({
  funds,
}: Readonly<{ funds: ExpenseFund[] }>) {
  const [capitalInput, setCapitalInput] = useState("500");
  const [currency, setCurrency] = useState<ScenarioCurrency>("USD");
  const capital = parseCapitalInput(capitalInput);
  const coverage = summarizeExpenseCoverage(funds);

  return (
    <section className="panel cost-scenario" aria-labelledby="scenario-title">
      <div className="cost-scenario-heading">
        <div>
          <p className="eyebrow">BF-024a · Metodología financiera</p>
          <h2 id="scenario-title">¿Qué implican los gastos anuales?</h2>
          <p className="comparison-help">
            Estimación determinista sobre el mismo capital inicial y un año
            supuesto. No representa ganancias ni una comisión adicional.
          </p>
        </div>
        <span className="tag">{coverage.available} / {coverage.total} con TER y fuente</span>
      </div>

      <div className="cost-controls">
        <label htmlFor="cost-capital">Capital supuesto</label>
        <input
          id="cost-capital" type="number" min="100" max="10000000"
          step="0.01" inputMode="decimal" value={capitalInput}
          onChange={(event) => setCapitalInput(event.target.value)}
          aria-describedby="cost-capital-help"
        />
        <label htmlFor="cost-currency">Moneda de referencia</label>
        <select id="cost-currency" value={currency}
          onChange={(event) => setCurrency(event.target.value as ScenarioCurrency)}>
          <option value="USD">USD — dólares</option>
          <option value="PEN">PEN — soles</option>
        </select>
      </div>
      <p id="cost-capital-help" className="etf-meta">
        Ingresa entre 100 y 10.000.000, con hasta dos decimales. Elegir
        PEN no convierte dólares: la cifra se interpreta directamente en soles,
        sin tipo de cambio.
      </p>
      {capital === null && (
        <p className="info" role="alert">
          Introduce un capital válido. No se calculan importes con un valor incompleto.
        </p>
      )}

      <div className="cost-evidence" aria-label="Estado de comparabilidad">
        <div>
          <strong>Fechas de la información</strong>
          <p>{coverage.datesAligned
            ? "Las fechas efectivas del TER coinciden entre los seleccionados."
            : "Los datos no tienen una fecha efectiva homogénea; no son una serie temporal comparable."}</p>
        </div>
        <div>
          <strong>Tipo de gasto informado</strong>
          <p>{coverage.methodologyAligned
            ? "Las fuentes usan la misma categoría de gasto."
            : "Existen categorías diferentes o sin clasificar (bruto, OCF o ratio de gastos). No establecer un ranking."}</p>
        </div>
      </div>

      <div className="table-scroll" role="region" aria-label="Estimación anual por ETF" tabIndex={0}>
        <table className="cost-table">
          <caption>Estimación ilustrativa, saldo constante por un año. Sin rendimientos futuros.</caption>
          <thead>
            <tr>
              <th scope="col">ETF</th>
              <th scope="col">Dato publicado</th>
              <th scope="col">Categoría / fecha</th>
              <th scope="col">Costo ilustrativo / año</th>
              <th scope="col">Fuente</th>
            </tr>
          </thead>
          <tbody>
            {funds.map((fund) => {
              const cost = capital === null ? null :
                calculateIllustrativeAnnualCost(capital, fund.ratePercent);
              return (
                <tr key={fund.listingId}>
                  <th scope="row">{fund.ticker}</th>
                  <td>{formatPercent(fund.ratePercent === null
                    ? null : String(fund.ratePercent))}</td>
                  <td>
                    <strong>{KIND_LABELS[fund.kind]}</strong>
                    <span className="etf-meta">Dato: {formatDate(fund.asOfDate)}</span>
                    <span className="etf-meta">Fuente: {formatDate(fund.sourceDate)}</span>
                  </td>
                  <td>
                    {cost === null ? "No calculable" : (
                      <strong>{formatScenarioMoney(cost, currency)}</strong>
                    )}
                    {fund.unavailableReason && <p className="etf-note">{fund.unavailableReason}</p>}
                  </td>
                  <td>
                    {fund.sourceUrl ? (
                      <a href={fund.sourceUrl} target="_blank" rel="noopener noreferrer">
                        Ver documento
                      </a>
                    ) : "No disponible"}
                    {fund.note && <p className="etf-note">{fund.note}</p>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <details className="etf-details" open>
        <summary>Fórmula, supuestos y límites del análisis</summary>
        <div className="cost-methodology">
          <p><strong>Fórmula:</strong> costo ilustrativo =
            capital constante × (porcentaje anual publicado ÷ 100).</p>
          <p>
            Solo es una referencia de magnitud para un saldo hipotético mantenido
            un año. El gasto interno del fondo ya se refleja en su valor liquidativo;
            no debe restarse otra vez de una rentabilidad publicada neta de gastos.
          </p>
          <p>
            No incluye aportes, mercado, variación del patrimonio, comisiones del
            bróker, impuestos, spreads, conversión USD/PEN ni futuros cambios del TER.
            Los «gastos brutos» no equivalen necesariamente a gastos netos o corrientes.
          </p>
          <p>
            <strong>Rentabilidad y riesgo históricos:</strong> no comparables
            mientras no existan series verificadas, ajustadas y con una ventana común.
            Este panel no selecciona ganadores ni predice rendimientos.
          </p>
        </div>
      </details>
      <p className="etf-meta">
        Este escenario se calcula únicamente en tu navegador y no modifica
        ni guarda las fotografías financieras en Supabase.
      </p>
    </section>
  );
}
