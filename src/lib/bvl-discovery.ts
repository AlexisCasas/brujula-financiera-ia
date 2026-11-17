import { normalizedSearch } from "./etfs/catalog";

/**
 * BF-040 discovery seed, read-only. These are eight BVL capital-share
 * mnemonics (Oct 2026 reference table), cross-matched with older issuer names
 * in BVL's S&P/BVL ESG basket. NOT a traded-price feed, a verified listing
 * identity, investment advice, or instruments in Supabase.
 */
export type BvlCandidate = {
  mnemonic: string;
  issuerName: string;
  marketLabel: "BVL · Perú";
  classLabel: "Acción de capital";
};

export const BVL_CODES_SOURCE = "https://documents.bvl.com.pe/empresas/alertas/TVR%202026-4T.pdf";
export const BVL_ISSUERS_SOURCE = "https://documents.bvl.com.pe/pubdif/boldia/emp_ibgc.htm";
export const BVL_CODES_AS_OF = "2026-10-01";
export const BVL_ISSUERS_AS_OF = "2025-07-25";

export const BVL_DISCOVERY_CANDIDATES: readonly BvlCandidate[] = [
  { mnemonic: "ALICORC1", issuerName: "Alicorp S.A.", marketLabel: "BVL · Perú", classLabel: "Acción de capital" },
  { mnemonic: "FERREYC1", issuerName: "Ferreycorp S.A.A.", marketLabel: "BVL · Perú", classLabel: "Acción de capital" },
  { mnemonic: "INRETC1", issuerName: "InRetail Perú Corp.", marketLabel: "BVL · Perú", classLabel: "Acción de capital" },
  { mnemonic: "BBVAC1", issuerName: "Banco BBVA Perú", marketLabel: "BVL · Perú", classLabel: "Acción de capital" },
  { mnemonic: "CPACASC1", issuerName: "Cementos Pacasmayo S.A.A.", marketLabel: "BVL · Perú", classLabel: "Acción de capital" },
  { mnemonic: "ENGIEC1", issuerName: "Engie Energía Perú S.A.", marketLabel: "BVL · Perú", classLabel: "Acción de capital" },
  { mnemonic: "UNACEMC1", issuerName: "Unacem Corp S.A.A.", marketLabel: "BVL · Perú", classLabel: "Acción de capital" },
  { mnemonic: "NEXAPEC1", issuerName: "Nexa Resources Perú S.A.A.", marketLabel: "BVL · Perú", classLabel: "Acción de capital" },
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
