import { getLabPriceIndex } from "@/lib/lab/queries";
import { LAB_ROW_LIMIT } from "@/lib/lab/view";
import { findNavItem } from "@/lib/navigation";
import { ScrollableTable } from "@/components/ScrollableTable";

const item = findNavItem("/laboratorio")!;
export const metadata = { title: "Laboratorio · Brújula Financiera IA" };

export default async function LaboratoryPage() {
  const result = await getLabPriceIndex();
  const view = result.status === "ready" ? result.view : null;

  return (
    <section aria-labelledby="screen-title">
      <header className="intro">
        <p className="eyebrow">{item.eyebrow}</p>
        <h1 id="screen-title">{item.heading}</h1>
        <p>{item.description}</p>
      </header>

      <div className="info" role="note">
        <strong>Datos sintéticos.</strong> Esta tabla es material didáctico en puntos de índice:
        no son precios, rentabilidades ni cotizaciones de ETF reales, y no deben usarse
        para decidir una inversión.
        {view?.status === "ready" && view.sourceLabels.length > 0 &&
          <> Fuente: {view.sourceLabels.join(", ")}.</>}
      </div>

      {result.status === "error" && <div className="info" role="alert"><p>{result.message}</p></div>}
      {view?.status === "integrity_error" && <div className="info" role="alert">
        <p>Se detectaron filas no sintéticas. Por seguridad no se muestran datos hasta revisarlas.</p>
      </div>}
      {view?.status === "empty" && <div className="panel" role="status">
        <p>Sin datos de laboratorio para tu usuario.</p>
      </div>}
      {view?.status === "ready" && <>
        {view.truncated && <p className="etf-meta" role="status">
          Se muestran las primeras {LAB_ROW_LIMIT} filas.</p>}
        <ScrollableTable label="Índice sintético del laboratorio">
          <thead>
            <tr>
              <th scope="col">Serie</th>
              <th scope="col">Fecha</th>
              <th scope="col">Valor</th>
              <th scope="col">Unidad</th>
            </tr>
          </thead>
          <tbody>
            {view.rows.map((row) => (
              <tr key={row.seriesCode + row.asOfDate}>
                <th scope="row">{row.seriesCode}</th>
                <td>{row.asOfDate}</td>
                <td>{row.value}</td>
                <td>{row.unit}</td>
              </tr>
            ))}
          </tbody>
        </ScrollableTable>
      </>}
    </section>
  );
}
