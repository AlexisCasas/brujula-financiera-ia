import type { ReactNode } from "react";
import { NavLinks } from "./NavLinks";

export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="shell">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <header className="shell-header">
        <p className="brand">Brújula Financiera IA</p>
        <NavLinks />
      </header>
      <main id="contenido" tabIndex={-1} className="shell-main">
        {children}
      </main>
    </div>
  );
}
