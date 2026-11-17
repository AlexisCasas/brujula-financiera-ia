export type NavItem = {
  href: string;
  label: string;
  icon: string;
  eyebrow: string;
  heading: string;
  description: string;
};

// Core screens plus incrementally approved personal workspace modules, in menu order.
export const NAV_ITEMS: readonly NavItem[] = [
  {
    href: "/panel",
    label: "Panel",
    icon: "▦",
    eyebrow: "Tu centro de decisiones",
    heading: "Invierte con más contexto.",
    description: "Organiza tus ETF, investigaciones y escenarios antes de tomar una decisión.",
  },
  {
    href: "/perfil",
    label: "Mi perfil",
    icon: "◎",
    eyebrow: "Conoce tu perfil",
    heading: "Mi perfil de inversionista.",
    description: "Comprende tu capacidad financiera y tu tolerancia al riesgo antes de analizar alternativas.",
  },
  {
    href: "/seguimiento",
    label: "Mi seguimiento",
    icon: "◎",
    eyebrow: "Tu lista personal",
    heading: "Mi seguimiento.",
    description: "Sigue ETF y acciones BVL identificadas, deja de seguirlas o reanuda tu interés sin borrar el historial.",
  },
  {
    href: "/explorar",
    label: "Explorar ETF",
    icon: "⌕",
    eyebrow: "Catálogo piloto",
    heading: "Explorar ETF",
    description: "Busca por nombre, ticker o ISIN. Selecciona el mercado de cotización antes de analizar resultados.",
  },
  {
    href: "/comparador",
    label: "Comparador",
    icon: "⇄",
    eyebrow: "Matriz objetiva",
    heading: "Compara lo comparable.",
    description: "Selecciona entre dos y cinco ETF. Los datos ausentes se identifican claramente, sin inventar resultados.",
  },
  {
    href: "/simulador",
    label: "Simulador",
    icon: "▥",
    eyebrow: "Prueba tus hipótesis",
    heading: "Simulador de inversión",
    description: "Calcula escenarios hipotéticos o explora históricos verificados. No son predicciones.",
  },
  {
    href: "/investigaciones",
    label: "Investigaciones",
    icon: "✧",
    eyebrow: "Centro de conocimiento",
    heading: "Investigaciones con IA",
    description: "ChatGPT y Claude estarán conectados mediante MCP; aquí revisarás hallazgos y propuestas, sin chat embebido.",
  },
  {
    href: "/decisiones",
    label: "Mis decisiones",
    icon: "▤",
    eyebrow: "Bitácora personal",
    heading: "Mis decisiones",
    description: "Registra tu tesis, riesgos y alternativas. La decisión final siempre es tuya.",
  },
];

export function isActivePath(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function findNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => isActivePath(pathname, item.href));
}
