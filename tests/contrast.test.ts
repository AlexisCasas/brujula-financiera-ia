import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");

// The app uses the single dark theme of the approved BF-003 prototype.
const theme: Record<string, string> = Object.fromEntries(
  [...css.match(/:root\s*\{([^}]*)\}/)![1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]),
);

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Foreground token on the background token it is actually drawn on.
const pairs: [string, string][] = [
  ["fg", "bg"],
  ["muted", "bg"],
  ["sub", "bg"],
  ["muted", "side"],
  ["fg", "surface"],
  ["muted", "surface"],
  ["sub", "surface"],
  ["accent-fg", "accent"],
  ["nav-active-fg", "nav-active-bg"],
  ["accent", "bg"],
  ["accent", "side"],
  ["warn", "surface"],
  ["danger", "surface"],
];

describe("WCAG AA contrast (prototype dark theme)", () => {
  it("defines every token the pairs rely on", () => {
    for (const [fg, bg] of pairs) {
      expect(theme[fg], fg).toBeDefined();
      expect(theme[bg], bg).toBeDefined();
    }
  });

  it.each(pairs)("%s on %s is at least 4.5:1", (fg, bg) => {
    expect(ratio(theme[fg], theme[bg])).toBeGreaterThanOrEqual(4.5);
  });
});
