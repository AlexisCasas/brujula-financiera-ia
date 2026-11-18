
import Link from "next/link";
export const metadata = { title: "Laboratorio de investigación · Brújula Financiera IA" };
export default function ResearchHub() {
  return <section aria-labelledby="screen-title">
    <header className="intro">
      <p className="eyebrow">Sesión 6 · Investigación financiera y análisis comparativo</p>
      <h1 id="screen-title">Laboratorio de investigación.</h1>
      <p>Aprende a recopilar evidencia, comparar alternativas y sostener una conclusión sin confundir una hipótesis con un dato verificado.</p>
    </header>
    <section className="panel s6-case" aria-labelledby="s6-case-title">
      <div><p className="eyebrow">Caso común de la clase</p><h2 id="s6-case-title">Mi primera inversión</h2>
        <p>Inversionista principiante peruano, perfil moderado hipotético, objetivo de construir patrimonio y horizonte de 10 años.</p></div>
      <div className="s6-case-stats"><span><strong>S/ 1.000</strong>Capital inicial</span><span><strong>S/ 300</strong>Mensuales</span><span><strong>10 años</strong>Horizonte</span></div>
    </section>
    <div className="s6-hub-grid">
      <article className="panel s6-hub-card"><p className="eyebrow">S6-01 · Investigación</p><h2>Ficha de investigación</h2>
        <p>Investiga <strong>VWRA</strong>, <strong>FWRA</strong> y <strong>Credicorp (BAP)</strong>. Describe qué compras, riesgos, fuentes y preguntas pendientes.</p>
        <ul><li>Identidad documental real del catálogo</li><li>Fuentes primarias del emisor</li><li>Bitácora de hipótesis y evidencias</li></ul>
        <Link href="/investigaciones/fichas" className="primary-button">Abrir fichas de investigación</Link>
      </article>
      <article className="panel s6-hub-card"><p className="eyebrow">S6-02 · Benchmarking</p><h2>Matriz comparativa ponderada</h2>
        <p>Evalúa <strong>VWRA frente a FWRA</strong> con criterios coherentes, pesos que sumen 100 % y justificaciones escritas.</p>
        <ul><li>Criterios ponderados por el estudiante</li><li>Puntuación 1–5 sin valores prefijados</li><li>Conclusión solo con matriz completa</li></ul>
        <Link href="/investigaciones/benchmarking" className="primary-button">Abrir matriz de benchmarking</Link>
      </article>
    </div>
    <div className="info s6-bottom-note"><strong>Secuencia pedagógica:</strong> primero investigar, después comparar. BAP se trabaja como empresa individual; no se trata como un ETF equivalente.
      S6-03 (evaluación de alternativas) y S6-04 (informe ejecutivo) quedan para el siguiente desarrollo.</div>
  </section>;
}
