// BF-LAB-01: pure read model for the synthetic lab index. No network, no financial maths.
// The data is educational and synthetic: it is never a price, return or ETF quote.

export const LAB_ROW_LIMIT = 500;
export const LAB_UNAVAILABLE = "No disponible";

export type LabPriceRow = {
  series_code: string;
  as_of_date: string;
  index_value: number | string | null;
  unit: string;
  is_synthetic: boolean;
  source_label: string;
};

export type LabViewRow = {
  seriesCode: string;
  asOfDate: string;
  value: string;
  unit: string;
};

export type LabView =
  | { status: "empty" }
  | { status: "integrity_error" }
  | {
      status: "ready";
      rows: LabViewRow[];
      sourceLabels: string[];
      truncated: boolean;
    };

// Unknown or invalid values are shown as unavailable, never as zero.
export function formatIndexValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return LAB_UNAVAILABLE;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return LAB_UNAVAILABLE;
  return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 4 }).format(n);
}

export function buildLabView(rows: readonly LabPriceRow[]): LabView {
  if (rows.length === 0) return { status: "empty" };
  // Fail closed: only synthetic rows may be rendered in the laboratory.
  if (rows.some((row) => row.is_synthetic !== true)) return { status: "integrity_error" };
  const truncated = rows.length > LAB_ROW_LIMIT;
  const visible = rows.slice(0, LAB_ROW_LIMIT);
  return {
    status: "ready",
    truncated,
    rows: visible.map((row) => ({
      seriesCode: row.series_code,
      asOfDate: row.as_of_date,
      value: formatIndexValue(row.index_value),
      unit: row.unit,
    })),
    sourceLabels: [...new Set(visible.map((row) => row.source_label))].sort(),
  };
}
