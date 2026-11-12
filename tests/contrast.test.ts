import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8");

function tokens(block: string): Record<string, string> {
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map((m) => [m[1], m[2]]),
  );
}

const light = tokens(css.match(/:root\s*\{([^}]*)\}/)![1]);
const darkOverrides = tokens(css.match(/prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^}]*)\}/)![1]);
const dark = { ...light, ...darkOverrides };

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

const pairs: [string, string][] = [
  ["fg", "bg"],
  ["muted", "bg"],
  ["fg", "surface"],
  ["muted", "surface"],
  ["accent-fg", "accent"],
  ["accent", "bg"],
];

describe.each([
  ["light", light],
  ["dark", dark],
])("WCAG AA contrast (%s theme)", (_name, theme) => {
  it.each(pairs)("%s on %s is at least 4.5:1", (fg, bg) => {
    expect(ratio(theme[fg], theme[bg])).toBeGreaterThanOrEqual(4.5);
  });
});
