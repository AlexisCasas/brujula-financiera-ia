import type { ReactNode } from "react";

// Wraps wide tables so mobile users scroll horizontally instead of losing columns (BF-009 AC3).
// The region is focusable so keyboard users can scroll it, and labelled for screen readers.
export function ScrollableTable({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div role="region" aria-label={label} tabIndex={0} className="table-scroll">
      <table>{children}</table>
    </div>
  );
}
