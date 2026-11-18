export type DividendStatus = "declared" | "issuer-calendar" | "conditional";
export type DividendEvent = Readonly<{
  isin: string;
  ticker: string;
  payDate: string;
  status: DividendStatus;
  sourceUrl: string;
  amount: number | null;
  currency: "PEN" | "USD" | null;
  recordDate: string | null;
  exDate: string | null;
  note: string;
}>;
export type CalendarInstrument = Readonly<{
  isin: string;
  listingId: string;
  ticker: string;
  name: string;
  market: "ETF" | "BVL";
  currency: string;
  accumulation: boolean;
}>;
export type CalendarEntry = Readonly<{ instrument: CalendarInstrument; event: DividendEvent }>;
export const VERIFIED_THROUGH = "2026-11-18";
/** Educational evidence snapshot. It is not an automatic market-data feed. */
export const DIVIDEND_EVENTS: readonly DividendEvent[] = [
  {
    "isin": "US9229083632",
    "ticker": "VOO",
    "payDate": "2026-03-31",
    "status": "declared",
    "sourceUrl": "https://investor.vanguard.com/content/dam/retail/us/en/pdfs/taxes/DIVDAT_2026.pdf",
    "amount": 1.8724,
    "currency": "USD",
    "recordDate": "2026-03-27",
    "exDate": "2026-03-27",
    "note": "Monto histórico contrastado con historial; fechas del emisor."
  },
  {
    "isin": "US9229083632",
    "ticker": "VOO",
    "payDate": "2026-06-30",
    "status": "declared",
    "sourceUrl": "https://investor.vanguard.com/content/dam/retail/us/en/pdfs/taxes/DIVDAT_2026.pdf",
    "amount": 1.9622,
    "currency": "USD",
    "recordDate": "2026-06-26",
    "exDate": "2026-06-26",
    "note": "Monto histórico contrastado con historial; fechas del emisor."
  },
  {
    "isin": "US9229083632",
    "ticker": "VOO",
    "payDate": "2026-09-30",
    "status": "declared",
    "sourceUrl": "https://investor.vanguard.com/content/dam/retail/us/en/pdfs/taxes/DIVDAT_2026.pdf",
    "amount": 1.8226,
    "currency": "USD",
    "recordDate": "2026-09-28",
    "exDate": "2026-09-28",
    "note": "Monto histórico contrastado con historial; fechas del emisor."
  },
  {
    "isin": "US9229083632",
    "ticker": "VOO",
    "payDate": "2026-12-23",
    "status": "issuer-calendar",
    "sourceUrl": "https://investor.vanguard.com/content/dam/retail/us/en/pdfs/taxes/DIVDAT_2026.pdf",
    "amount": null,
    "currency": null,
    "recordDate": "2026-12-21",
    "exDate": "2026-12-21",
    "note": "Calendario anual del emisor; importe aún no anunciado."
  },
  {
    "isin": "US9229083632",
    "ticker": "VOO",
    "payDate": "2027-01-04",
    "status": "conditional",
    "sourceUrl": "https://investor.vanguard.com/content/dam/retail/us/en/pdfs/taxes/DIVDAT_2026.pdf",
    "amount": null,
    "currency": null,
    "recordDate": "2026-12-30",
    "exDate": "2026-12-30",
    "note": "Posible distribución extraordinaria por ganancias de capital; no implica pago garantizado."
  },
  {
    "isin": "US9229087369",
    "ticker": "VUG",
    "payDate": "2026-03-31",
    "status": "declared",
    "sourceUrl": "https://investor.vanguard.com/content/dam/retail/us/en/pdfs/taxes/DIVDAT_2026.pdf",
    "amount": 0.07963,
    "currency": "USD",
    "recordDate": "2026-03-27",
    "exDate": "2026-03-27",
    "note": "Monto histórico contrastado con historial; fechas del emisor."
  },
  {
    "isin": "US9229087369",
    "ticker": "VUG",
    "payDate": "2026-06-30",
    "status": "declared",
    "sourceUrl": "https://investor.vanguard.com/content/dam/retail/us/en/pdfs/taxes/DIVDAT_2026.pdf",
    "amount": 0.0923,
    "currency": "USD",
    "recordDate": "2026-06-26",
    "exDate": "2026-06-26",
    "note": "Monto histórico contrastado con historial; fechas del emisor."
  },
  {
    "isin": "US9229087369",
    "ticker": "VUG",
    "payDate": "2026-09-30",
    "status": "declared",
    "sourceUrl": "https://investor.vanguard.com/content/dam/retail/us/en/pdfs/taxes/DIVDAT_2026.pdf",
    "amount": 0.091,
    "currency": "USD",
    "recordDate": "2026-09-28",
    "exDate": "2026-09-28",
    "note": "Monto histórico contrastado con historial; fechas del emisor."
  },
  {
    "isin": "US9229087369",
    "ticker": "VUG",
    "payDate": "2026-12-24",
    "status": "issuer-calendar",
    "sourceUrl": "https://investor.vanguard.com/content/dam/retail/us/en/pdfs/taxes/DIVDAT_2026.pdf",
    "amount": null,
    "currency": null,
    "recordDate": "2026-12-22",
    "exDate": "2026-12-22",
    "note": "Calendario anual del emisor; importe aún no anunciado."
  },
  {
    "isin": "US9229087369",
    "ticker": "VUG",
    "payDate": "2027-01-04",
    "status": "conditional",
    "sourceUrl": "https://investor.vanguard.com/content/dam/retail/us/en/pdfs/taxes/DIVDAT_2026.pdf",
    "amount": null,
    "currency": null,
    "recordDate": "2026-12-30",
    "exDate": "2026-12-30",
    "note": "Posible distribución extraordinaria por ganancias de capital; no implica pago garantizado."
  },
  {
    "isin": "US78464A4094",
    "ticker": "SPYG",
    "payDate": "2026-03-25",
    "status": "declared",
    "sourceUrl": "https://www.ssga.com/us/en/intermediary/resources/documents/etf-dividend-distributions",
    "amount": 0.12923,
    "currency": "USD",
    "recordDate": "2026-03-23",
    "exDate": "2026-03-23",
    "note": "Monto de distribución histórica; calendario del emisor."
  },
  {
    "isin": "US78464A4094",
    "ticker": "SPYG",
    "payDate": "2026-06-24",
    "status": "declared",
    "sourceUrl": "https://www.ssga.com/us/en/intermediary/resources/documents/etf-dividend-distributions",
    "amount": 0.14847,
    "currency": "USD",
    "recordDate": "2026-06-22",
    "exDate": "2026-06-22",
    "note": "Monto de distribución histórica; calendario del emisor."
  },
  {
    "isin": "US78464A4094",
    "ticker": "SPYG",
    "payDate": "2026-09-23",
    "status": "declared",
    "sourceUrl": "https://www.ssga.com/us/en/intermediary/resources/documents/etf-dividend-distributions",
    "amount": 0.148153,
    "currency": "USD",
    "recordDate": "2026-09-21",
    "exDate": "2026-09-21",
    "note": "Monto de distribución histórica; calendario del emisor."
  },
  {
    "isin": "US78464A4094",
    "ticker": "SPYG",
    "payDate": "2026-12-23",
    "status": "issuer-calendar",
    "sourceUrl": "https://www.ssga.com/library-content/products/fund-data/etfs/us/distribution/SPDR_Dividend_Distribution_Schedule.pdf",
    "amount": null,
    "currency": null,
    "recordDate": "2026-12-21",
    "exDate": "2026-12-21",
    "note": "Fecha programada por State Street; importe pendiente de anuncio."
  },
  {
    "isin": "US78464A4094",
    "ticker": "SPYG",
    "payDate": "2027-01-05",
    "status": "conditional",
    "sourceUrl": "https://www.ssga.com/library-content/products/fund-data/etfs/us/distribution/SPDR_Dividend_Distribution_Schedule.pdf",
    "amount": null,
    "currency": null,
    "recordDate": "2026-12-31",
    "exDate": "2026-12-31",
    "note": "Posible distribución extraordinaria por ganancias de capital; no implica pago garantizado."
  },
  {
    "isin": "BMG2519Y1084",
    "ticker": "BAP",
    "payDate": "2026-06-12",
    "status": "declared",
    "sourceUrl": "https://credicorp.gcs-web.com/es/node/5931",
    "amount": 50,
    "currency": "PEN",
    "recordDate": "2026-05-18",
    "exDate": null,
    "note": "La emisora declaró S/ 50 por acción; desembolsó su equivalente en USD."
  },
  {
    "isin": "PEP214001005",
    "ticker": "ALICORC1",
    "payDate": "2026-05-20",
    "status": "declared",
    "sourceUrl": "https://www.smv.gob.pe/ConsultasP8/temp/CartaB30006_3_20260331120944.pdf",
    "amount": 0.37326141,
    "currency": "PEN",
    "recordDate": "2026-04-23",
    "exDate": null,
    "note": ""
  },
  {
    "isin": "PEP214001005",
    "ticker": "ALICORC1",
    "payDate": "2026-11-18",
    "status": "declared",
    "sourceUrl": "https://documents.bvl.com.pe/empresas/entrder1.htm",
    "amount": 0.37499815,
    "currency": "PEN",
    "recordDate": "2026-10-16",
    "exDate": null,
    "note": "Importe y fecha publicados por la BVL."
  },
  {
    "isin": "PEP116001004",
    "ticker": "BBVAC1",
    "payDate": "2026-04-29",
    "status": "declared",
    "sourceUrl": "https://www.smv.gob.pe/ConsultasP8/temp/CartaB80004_3_20260326184326.pdf",
    "amount": 0.12389244,
    "currency": "PEN",
    "recordDate": "2026-04-16",
    "exDate": null,
    "note": ""
  },
  {
    "isin": "PEP736001004",
    "ticker": "FERREYC1",
    "payDate": "2026-10-29",
    "status": "declared",
    "sourceUrl": "https://www.ferreycorp.com.pe/inversionistas/dividendos/",
    "amount": 0.118143426235,
    "currency": "PEN",
    "recordDate": "2026-10-20",
    "exDate": null,
    "note": ""
  },
  {
    "isin": "PAL1801171A1",
    "ticker": "INRETC1",
    "payDate": "2026-05-22",
    "status": "declared",
    "sourceUrl": "https://www.smv.gob.pe/ConsultasP8/temp/CartaOE5087_4_20260422125615.pdf",
    "amount": 0.55173993,
    "currency": "USD",
    "recordDate": "2026-05-12",
    "exDate": null,
    "note": ""
  },
  {
    "isin": "PEP620001003",
    "ticker": "NEXAPEC1",
    "payDate": "2026-06-16",
    "status": "declared",
    "sourceUrl": "https://documents.bvl.com.pe/pubdif/infmen/202606c1.htm",
    "amount": 0.0393048419252725,
    "currency": "USD",
    "recordDate": "2026-06-03",
    "exDate": null,
    "note": "Primera parte de una distribución total de USD 0.07860968."
  },
  {
    "isin": "PEP620001003",
    "ticker": "NEXAPEC1",
    "payDate": "2026-10-27",
    "status": "declared",
    "sourceUrl": "https://documents.bvl.com.pe/pubdif/infmen/202606c1.htm",
    "amount": 0.0393048419252725,
    "currency": "USD",
    "recordDate": "2026-06-03",
    "exDate": null,
    "note": "Segunda parte del mismo acuerdo; no sumar como otro dividendo completo."
  },
  {
    "isin": "PEP761001002",
    "ticker": "UNACEMC1",
    "payDate": "2026-12-02",
    "status": "declared",
    "sourceUrl": "https://www.smv.gob.pe/ConsultasP8/temp/Newsletter%203T26%20ESP%20VF.pdf",
    "amount": 0.026,
    "currency": "PEN",
    "recordDate": null,
    "exDate": null,
    "note": "Dividendo declarado el 30 de octubre de 2026."
  },
  {
    "isin": "PEP702101002",
    "ticker": "ENGIEC1",
    "payDate": "2026-12-18",
    "status": "declared",
    "sourceUrl": "https://www.smv.gob.pe/ConsultasP8/temp/Carta002829_4_20261112163221.pdf",
    "amount": 0.017785485657,
    "currency": "USD",
    "recordDate": "2026-12-04",
    "exDate": null,
    "note": ""
  }
];
export function validCalendarYear(year: string | undefined): 2026 | 2027 {
  return year === "2027" ? 2027 : 2026;
}
export function calendarEntries(instruments: readonly CalendarInstrument[], year: number): CalendarEntry[] {
  const byIsin = new Map(instruments.map((instrument) => [instrument.isin, instrument]));
  return DIVIDEND_EVENTS.flatMap((event) => {
    const instrument = byIsin.get(event.isin);
    return instrument && instrument.ticker === event.ticker &&
      event.payDate.startsWith(String(year) + "-")
      ? [{ instrument, event }] : [];
  }).sort((a, b) => a.event.payDate.localeCompare(b.event.payDate) || a.instrument.ticker.localeCompare(b.instrument.ticker));
}
export function formatCalendarDate(date: string): string {
  return new Intl.DateTimeFormat("es-PE", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(date + "T12:00:00Z"));
}
export function formatDividendAmount(event: DividendEvent): string {
  if (event.amount === null || event.currency === null) return "Importe no publicado";
  const number = new Intl.NumberFormat("es-PE", {
    maximumFractionDigits: 12, minimumFractionDigits: 0,
  }).format(event.amount);
  return (event.currency === "PEN" ? "S/ " : "US$ ") + number + " por acción/participación";
}
export const MONTH_NAMES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"] as const;
