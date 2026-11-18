"use client";

import { useState } from "react";

const LESSONS = [
  ["what-is-investing","¿Qué es invertir?","Destinar dinero hoy esperando que pueda crecer o generar ingresos en el futuro, aceptando incertidumbre y riesgo."],
  ["stock","¿Qué es una acción?","Una participación en una empresa. Su precio puede subir o bajar y no existe una rentabilidad garantizada."],
  ["etf","¿Qué es un ETF?","Un vehículo que agrupa activos y cotiza en bolsa. Un ETF puede facilitar diversificación, pero no elimina el riesgo."],
  ["diversification","¿Qué es diversificar?","Repartir la exposición entre distintos activos, empresas, sectores o países para no depender de una sola fuente de resultado."],
  ["risk","¿Qué es riesgo?","La posibilidad de que el resultado sea diferente de lo esperado, incluida una pérdida."],
  ["volatility","¿Qué es volatilidad?","Una medida de cuánto fluctúan los precios. Mucha volatilidad puede implicar caídas temporales importantes."],
  ["return","¿Qué es rentabilidad?","El cambio de valor de una inversión y, cuando corresponde, sus ingresos. Debe analizarse con periodo, moneda y costos."],
  ["ter","¿Qué es TER?","Un gasto anual interno del fondo expresado como porcentaje. No equivale automáticamente a todos los costos del inversor."],
  ["dividend","¿Qué es un dividendo?","Una distribución de dinero de una empresa o fondo cuando corresponde. No es una ganancia adicional garantizada."],
  ["fx","¿Qué es USD/PEN?","El tipo de cambio entre dólares y soles. Puede afectar tu resultado medido en soles aunque el activo no cambie en su moneda de cotización."],
  ["drawdown","¿Qué es drawdown?","La caída desde un máximo previo hasta un mínimo posterior. Ayuda a entender cuánto puede doler una mala etapa histórica."],
] as const;

export function Academy() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section aria-labelledby="screen-title">
      <header className="intro">
        <p className="eyebrow">Aprende antes de decidir</p>
        <h1 id="screen-title">Academia financiera básica.</h1>
        <p>Microlecciones pensadas para alguien que empieza desde cero. Son educativas y no constituyen recomendaciones.</p>
      </header>
      <div className="lesson-grid">
        {LESSONS.map(([id,title,short]) => (
          <article className="panel lesson-card" key={id}>
            <button className="lesson-button" onClick={() => setOpen(open === id ? null : id)} aria-expanded={open === id}>
              <span>{title}</span><span aria-hidden="true">{open === id ? "−" : "+"}</span>
            </button>
            {open === id && <div className="lesson-detail"><p>{short}</p><p><strong>Recuerda:</strong> una definición no sustituye la revisión de fuentes, costos, horizonte y riesgo.</p></div>}
          </article>
        ))}
      </div>
    </section>
  );
}
