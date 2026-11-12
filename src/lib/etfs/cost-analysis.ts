import type { EtfProfile, Measurement } from "./catalog";
import { validSourceUrl } from "./catalog";

export type ScenarioCurrency = "USD" | "PEN";
export type ExpenseKind = "gross" | "ongoing" | "expense_ratio" | "unclassified";

export type ExpenseFund = {
  listingId: string;
  ticker: string;
  isin: string;
  kind: ExpenseKind;
  ratePercent: number | null;
  asOfDate: string | null;
  sourceDate: string | null;
  sourceUrl: string | null;
  note: string | null;
  unavailableReason: string | null;
};

const DATE = /^\\d{4}-\\d{2}-\\d{2}$/;
const MAX_CAPITAL = 10_000_000;

export function classifyExpenseNote(note: string | null): ExpenseKind {
  const text = (note ?? "").toLocaleLowerCase("en");
  if (/gross expense ratio|gross ongoing charge|gasto bruto/.test(text)) return "gross";
  if (/ongoing charge|ongoing charges|ocf/.test(text)) return "ongoing";
  if (/expense ratio|ter/.test(text)) return "expense_ratio";
  return "unclassified";
}

export function parseCapitalInput(raw: string): number | null {
  if (!/^\\d+(?:\\.\\d{1,2})?$/.test(raw.trim())) return null;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 100 && value <= MAX_CAPITAL
    ? value : null;
}

export function calculateIllustrativeAnnualCost(
  capital: number, ratePercent: number | null,
): number | null {
  if (!Number.isFinite(capital) || capital < 0 || capital > MAX_CAPITAL ||
      ratePercent === null || !Number.isFinite(ratePercent) ||
      ratePercent < 0 || ratePercent > 100) return null;
  return Math.round((capital * ratePercent / 100 + Number.EPSILON) * 100) / 100;
}

export function expenseFundFromProfile(profile: EtfProfile): ExpenseFund {
  const measurement: Measurement | null = profile.metrics.ter_percent;
  const note = measurement?.note ?? null;
  const kind = classifyExpenseNote(note);
  const sourceUrl = validSourceUrl(measurement?.sourceUrl);
  const asOfDate = measurement?.asOfDate ?? null;
  const value = measurement?.value;
  const numeric = value !== null && value !== undefined &&
    value.trim() !== "" ? Number(value) : NaN;
  const rateValid = Number.isFinite(numeric) && numeric >= 0 && numeric <= 100;
  let unavailableReason: string | null = null;

  if (!measurement || measurement.availability !== "disponible" || !rateValid) {
    unavailableReason = "No hay un porcentaje de gasto válido";
  } else if (!sourceUrl || !asOfDate || !DATE.test(asOfDate)) {
    unavailableReason = "La medición no cuenta con fecha y fuente HTTPS comprobables";
  }

  return {
    listingId: profile.listingId,
    ticker: profile.ticker,
    isin: profile.isin,
    kind,
    ratePercent: unavailableReason ? null : numeric,
    asOfDate,
    sourceDate: measurement?.sourceDate ?? null,
    sourceUrl,
    note,
    unavailableReason,
  };
}

export type Coverage = {
  available: number;
  total: number;
  datesAligned: boolean;
  methodologyAligned: boolean;
  canClaimHistoricalReturn: false;
};

export function summarizeExpenseCoverage(funds: readonly ExpenseFund[]): Coverage {
  const supported = funds.filter((f) => f.ratePercent !== null);
  const dates = new Set(supported.map((f) => f.asOfDate));
  const methods = new Set(supported.map((f) => f.kind));
  return {
    available: supported.length,
    total: funds.length,
    datesAligned: supported.length === funds.length && dates.size === 1,
    methodologyAligned: supported.length === funds.length &&
      methods.size === 1 && !methods.has("gross") && !methods.has("unclassified"),
    canClaimHistoricalReturn: false,
  };
}

export function formatScenarioMoney(value: number, currency: ScenarioCurrency): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
