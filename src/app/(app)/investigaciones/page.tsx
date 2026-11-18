
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
      <article className="panel s6-hub-card"><p className="eyebrow">S6-03 · Evaluación</p><h2>Evaluación de alternativas</h2>
        <p>Analiza si cambian las conclusiones con otros pesos. Identifica argumentos, riesgos e información pendiente.</p>
        <ul><li>Cuatro escenarios de sensibilidad</li><li>Advertencias de justificaciones genéricas</li><li>Conclusión razonada y autoguardada</li></ul>
        <Link href="/investigaciones/evaluacion" className="primary-button">Abrir evaluación de alternativas</Link>
      </article>
      <article className="panel s6-hub-card"><p className="eyebrow">S6-04 · Reporte</p><h2>Informe ejecutivo comparativo</h2>
        <p>Reúne investigación, matriz, sensibilidad, riesgos y conclusión en un documento listo para presentar.</p>
        <ul><li>Importación de fichas y matriz anteriores</li><li>Vista para revisión y impresión PDF</li><li>Exportación Markdown</li></ul>
        <Link href="/investigaciones/informe" className="primary-button">Abrir informe ejecutivo</Link>
      </article>
    </div>
    <div className="info s6-bottom-note"><strong>Secuencia pedagógica:</strong> primero investigar, después comparar. BAP se trabaja como empresa individual; no se trata como un ETF equivalente.
      S6-03 analiza la sensibilidad y S6-04 genera el informe de cierre; los borradores son locales al navegador.</div>
  </section>;
}
