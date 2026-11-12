import type { NavItem } from "@/lib/navigation";

export function ScreenPlaceholder({ item }: Readonly<{ item: NavItem }>) {
  return (
    <section aria-labelledby="screen-title">
      <div className="intro">
        <p className="eyebrow">{item.eyebrow}</p>
        <h1 id="screen-title">{item.heading}</h1>
        <p>{item.description}</p>
      </div>
      <div className="empty">
        <div className="glyph" aria-hidden="true">
          ◇
        </div>
        <h2>Aún no hay datos</h2>
        <p>Esta pantalla se completará cuando llegue su historia. No mostramos cifras de ejemplo.</p>
      </div>
    </section>
  );
}
