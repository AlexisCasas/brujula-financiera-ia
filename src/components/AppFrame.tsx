"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { findNavItem } from "@/lib/navigation";
import { NavLinks } from "./NavLinks";

function CurrentBreadcrumb() {
  const pathname = usePathname();
  const current = findNavItem(pathname);
  return <span className="crumb">Brújula IA <span className="crumb-sep">/</span> {current?.label ?? "Panel"}</span>;
}

export function AppFrame({
  children,
  signOutAction,
}: Readonly<{ children: ReactNode; signOutAction: () => Promise<void> }>) {
  const [open, setOpen] = useState(false);
  // Escape closes the mobile drawer.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="app">
      <a href="#contenido" className="skip-link">
        Saltar al contenido
      </a>
      <aside id="aside" className={open ? "aside open" : "aside"}>
        <p className="brand">
          <span className="mark" aria-hidden="true">
            ◈
          </span>
          <span>
            Brújula <span className="brand-accent">IA</span>
          </span>
        </p>
        <div className="navlabel">Laboratorio financiero</div>
        <Suspense fallback={<p className="smalltxt">Cargando navegación…</p>}>
          <NavLinks onNavigate={() => setOpen(false)} />
        </Suspense>
        <div className="sidefoot">
          <span className="tag ok">● Sesión privada</span>
          <p className="smalltxt">Usuario único. Metadatos de ETF disponibles; precios históricos pendientes.</p>
          <form action={signOutAction}>
            <button type="submit" className="logout-button">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <div className={open ? "scrim open" : "scrim"} onClick={() => setOpen(false)} aria-hidden="true" />
      <div className="main-wrap">
        <main id="contenido" tabIndex={-1} className="main">
          <div className="top">
            <div className="row">
              <button
                type="button"
                className="mobilemenu"
                aria-label={open ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={open}
                aria-controls="aside"
                onClick={() => setOpen((value) => !value)}
              >
                ☰
              </button>
              <Suspense fallback={<span className="crumb">Brújula IA / …</span>}>
                <CurrentBreadcrumb />
              </Suspense>
            </div>
            <span className="tag">Usuario único</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
