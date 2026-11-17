import { normalizedSearch } from "./etfs/catalog";

/**
 * BF-040 discovery seed, read-only. These are nine BVL capital-share
 * mnemonics (Oct 2026 reference table), cross-matched with older issuer names
 * in BVL's S&P/BVL ESG basket. A separate BVL spot report as of Nov 16, 2026 corroborates
 * ISIN and quote currency. NOT a traded-price feed, investment advice,
 * or instruments registered in Supabase.
 */
export type BvlCandidate = {
  mnemonic: string;
  issuerName: string;
  marketLabel: "BVL · Perú";
  classLabel: "Acción de capital";
  isin: string;
  currency: "PEN" | "USD";
};

export const BVL_CODES_SOURCE = "https://documents.bvl.com.pe/empresas/alertas/TVR%202026-4T.pdf";
export const BVL_ISSUERS_SOURCE = "https://documents.bvl.com.pe/pubdif/boldia/emp_ibgc.htm";
export const BVL_CODES_AS_OF = "2026-10-01";
export const BVL_STOCK_REPORT_SOURCE = "https://documents.bvl.com.pe/pubdif/boldia/stockq.htm";
export const BVL_STOCK_REPORT_AS_OF = "2026-11-16";
export const BVL_ISSUERS_AS_OF = "2025-07-25";

export const BVL_DISCOVERY_CANDIDATES: readonly BvlCandidate[] = [
  { mnemonic: "ALICORC1", issuerName: "Alicorp S.A.", marketLabel: "BVL · Perú", classLabel: "Acción de capital", isin: "PEP214001005", currency: "PEN" },
  { mnemonic: "FERREYC1", issuerName: "Ferreycorp S.A.A.", marketLabel: "BVL · Perú", classLabel: "Acción de capital", isin: "PEP736001004", currency: "PEN" },
  { mnemonic: "INRETC1", issuerName: "InRetail Perú Corp.", marketLabel: "BVL · Perú", classLabel: "Acción de capital", isin: "PAL1801171A1", currency: "USD" },
  { mnemonic: "BBVAC1", issuerName: "Banco BBVA Perú", marketLabel: "BVL · Perú", classLabel: "Acción de capital", isin: "PEP116001004", currency: "PEN" },
  { mnemonic: "CPACASC1", issuerName: "Cementos Pacasmayo S.A.A.", marketLabel: "BVL · Perú", classLabel: "Acción de capital", isin: "PEP239501005", currency: "PEN" },
  { mnemonic: "ENGIEC1", issuerName: "Engie Energía Perú S.A.", marketLabel: "BVL · Perú", classLabel: "Acción de capital", isin: "PEP702101002", currency: "PEN" },
  { mnemonic: "UNACEMC1", issuerName: "Unacem Corp S.A.A.", marketLabel: "BVL · Perú", classLabel: "Acción de capital", isin: "PEP761001002", currency: "PEN" },
  { mnemonic: "NEXAPEC1", issuerName: "Nexa Resources Perú S.A.A.", marketLabel: "BVL · Perú", classLabel: "Acción de capital", isin: "PEP620001003", currency: "PEN" },
  { mnemonic: "BAP", issuerName: "Credicorp Ltd.", marketLabel: "BVL · Perú", classLabel: "Acción de capital", isin: "BMG2519Y1084", currency: "USD" },
];

export function filterBvlCandidates(
  candidates: readonly BvlCandidate[],
  query: string,
): BvlCandidate[] {
  const q = normalizedSearch(query).slice(0, 120);
  return !q ? [...candidates] : candidates.filter((candidate) =>
    [candidate.mnemonic, candidate.issuerName, candidate.marketLabel]
      .some((value) => normalizedSearch(value).includes(q)),
  );
}
