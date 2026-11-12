export default function LoadingPanel() {
  return (
    <section className="panel" role="status" aria-live="polite">
      <p className="eyebrow">Resumen privado</p>
      <h1>Cargando panel…</h1>
      <p>Obteniendo indicadores verificados desde Supabase.</p>
    </section>
  );
}
