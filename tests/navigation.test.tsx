import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ value: "/panel" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

import { AppShell } from "../src/components/AppShell";
import { NavLinks } from "../src/components/NavLinks";
import { ScrollableTable } from "../src/components/ScrollableTable";
import { NAV_ITEMS, isActivePath } from "../src/lib/navigation";

describe("navigation", () => {
  it("lists the six agreed screens with their routes", () => {
    expect(NAV_ITEMS.map((i) => i.label)).toEqual([
      "Panel",
      "Explorar ETF",
      "Comparador",
      "Simulador",
      "Investigaciones",
      "Mis decisiones",
    ]);
    const html = renderToStaticMarkup(<NavLinks />);
    for (const item of NAV_ITEMS) expect(html).toContain(`href="${item.href}"`);
  });

  it("marks exactly the current screen as active", () => {
    for (const item of NAV_ITEMS) {
      pathname.value = item.href;
      const html = renderToStaticMarkup(<NavLinks />);
      expect(html.match(/aria-current="page"/g)).toHaveLength(1);
      const activeLink = html.match(/<a [^>]*aria-current="page"[^>]*>/)![0];
      expect(activeLink).toContain(`href="${item.href}"`);
    }
  });

  it("matches nested routes but not look-alike prefixes", () => {
    expect(isActivePath("/explorar/abc", "/explorar")).toBe(true);
    expect(isActivePath("/explorarx", "/explorar")).toBe(false);
  });

  it("labels the navigation landmark", () => {
    expect(renderToStaticMarkup(<NavLinks />)).toContain('aria-label="Principal"');
  });
});

describe("AppShell keyboard access and landmarks", () => {
  it("puts the skip link before the navigation and targets the main landmark", () => {
    pathname.value = "/panel";
    const html = renderToStaticMarkup(<AppShell>content</AppShell>);
    expect(html.indexOf("Saltar al contenido")).toBeLessThan(html.indexOf("<nav"));
    expect(html).toContain('href="#contenido"');
    expect(html).toContain('<main id="contenido"');
  });

  it("never removes navigation links from the tab order", () => {
    expect(renderToStaticMarkup(<NavLinks />)).not.toMatch(/<a[^>]*tabindex="-1"/);
  });
});

describe("ScrollableTable (mobile alternative)", () => {
  it("renders a labelled, focusable scroll region around the table", () => {
    const html = renderToStaticMarkup(
      <ScrollableTable label="Comparación">
        <tbody />
      </ScrollableTable>,
    );
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Comparación"');
    expect(html).toContain('tabindex="0"');
  });
});
