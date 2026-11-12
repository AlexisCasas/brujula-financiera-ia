export function ScreenPlaceholder({ title, description }: Readonly<{ title: string; description: string }>) {
  return (
    <section aria-labelledby="screen-title">
      <h1 id="screen-title">{title}</h1>
      <p>{description}</p>
      <p className="empty-state">Aún no hay datos. Esta pantalla se completará en una historia posterior.</p>
    </section>
  );
}
