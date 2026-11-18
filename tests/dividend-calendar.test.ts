import { describe, expect, it } from "vitest";
import {
  DIVIDEND_EVENTS, VERIFIED_THROUGH, calendarEntries, formatCalendarDate,
  formatDividendAmount, validCalendarYear, type CalendarInstrument,
} from "../src/lib/dividends/calendar";

const instruments: CalendarInstrument[] = [
  { isin: "US9229083632", listingId: "a", ticker: "VOO", name: "Vanguard S&P 500 ETF", market: "ETF", currency: "USD", accumulation: false },
  { isin: "IE00BK5BQT80", listingId: "b", ticker: "VWRA", name: "Vanguard All World Acc", market: "ETF", currency: "USD", accumulation: true },
  { isin: "BMG2519Y1084", listingId: "c", ticker: "BAP", name: "Credicorp Ltd.", market: "BVL", currency: "USD", accumulation: false },
];

describe("BF-050 dividend evidence calendar", () => {
  it("only accepts the present and next year", () => {
    expect(validCalendarYear("2027")).toBe(2027);
    expect(validCalendarYear("2028")).toBe(2026);
    expect(validCalendarYear(undefined)).toBe(2026);
  });

  it("joins by ISIN and ticker, never invents events for accumulating ETFs", () => {
    const rows = calendarEntries(instruments, 2026);
    expect(rows.some(({ instrument }) => instrument.ticker === "BAP")).toBe(true);
    expect(rows.some(({ instrument }) => instrument.ticker === "VWRA")).toBe(false);
    expect(rows.every(({ event }) => event.payDate.startsWith("2026-"))).toBe(true);
    const differentTicker = [{ ...instruments[0], ticker: "WRONG" }];
    expect(calendarEntries(differentTicker, 2026)).toHaveLength(0);
  });

  it("preserves conditional 2027 payments as unknown, not declared cash", () => {
    const next = calendarEntries(instruments, 2027);
    expect(next).toHaveLength(1);
    expect(next[0].event.status).toBe("conditional");
    expect(next[0].event.amount).toBeNull();
    expect(formatDividendAmount(next[0].event)).toBe("Importe no publicado");
  });

  it("requires verifiable source, valid date and sane amount for every curated event", () => {
    expect(VERIFIED_THROUGH).toBe("2026-11-18");
    for (const row of DIVIDEND_EVENTS) {
      expect(row.sourceUrl).toMatch(/^https:\/\//);
      expect(row.isin.length).toBe(12);
      expect(row.payDate).toMatch(/^202[67]-\d{2}-\d{2}$/);
      expect(new Date(row.payDate + "T12:00:00Z").toISOString().slice(0, 10)).toBe(row.payDate);
      expect(row.amount === null || (row.amount > 0 && !!row.currency)).toBe(true);
      if (row.status === "conditional" || row.status === "issuer-calendar") expect(row.amount).toBeNull();
    }
  });

  it("formats dates in UTC to avoid local day shifting", () => {
    expect(formatCalendarDate("2026-12-23")).toContain("2026");
    expect(formatDividendAmount(calendarEntries(instruments, 2026).find(x => x.instrument.ticker === "BAP")!.event)).toContain("S/");
  });
});
