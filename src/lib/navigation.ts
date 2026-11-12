export type NavItem = {
  href: string;
  label: string;
  description: string;
};

// The six screens agreed in BF-003 / BF-009, in menu order.
export const NAV_ITEMS: readonly NavItem[] = [
  { href: "/panel", label: "Panel", description: "Resumen general de tu investigación." },
  { href: "/explorar", label: "Explorar ETF", description: "Busca y revisa fondos y sus listings." },
  { href: "/comparador", label: "Comparador", description: "Compara hasta cinco ETF con periodos homogéneos." },
  { href: "/simulador", label: "Simulador", description: "Simula inversiones históricas y escenarios futuros." },
  { href: "/investigaciones", label: "Investigaciones", description: "Revisa las investigaciones aprobadas." },
  { href: "/decisiones", label: "Mis decisiones", description: "Documenta por qué observas, descartas o eliges un ETF." },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}
