/**
 * BF-017a - Financial MCP contract, not an exposed server.
 * Auth, ownership, approval and rate limits MUST be enforced in the future runtime.
 */
export const FINANCIAL_MCP_CONTRACT_VERSION = "0.1.0";

export type McpFieldSchema = {
  type: "string" | "integer" | "boolean";
  enum?: readonly (string | boolean)[];
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  format?: "uuid" | "date" | "https-url";
};

export type McpToolDefinition = {
  name: string;
  description: string;
  effect: "read" | "personal_write" | "proposal";
  availability: "contract_only";
  humanConfirmation: boolean;
  inputSchema: {
    type: "object";
    additionalProperties: false;
    required: readonly string[];
    properties: Readonly<Record<string, McpFieldSchema>>;
  };
};

const listingId: McpFieldSchema = { type: "string", format: "uuid" };
const limit20: McpFieldSchema = { type: "integer", minimum: 1, maximum: 20 };
const confirmed: McpFieldSchema = { type: "boolean", enum: [true] };

export const FINANCIAL_MCP_TOOLS: readonly McpToolDefinition[] = [
  {
    name: "get_investor_profile",
    description: "Read educational investor profile summary, never raw questionnaire answers.",
    effect: "read", availability: "contract_only", humanConfirmation: false,
    inputSchema: { type: "object", additionalProperties: false, required: [], properties: {} },
  },
  {
    name: "list_watchlist",
    description: "List user-followed instruments; following does not mean ownership.",
    effect: "read", availability: "contract_only", humanConfirmation: false,
    inputSchema: {
      type: "object", additionalProperties: false, required: [],
      properties: {
        status: { type: "string", enum: ["active", "inactive"] },
        limit: { type: "integer", minimum: 1, maximum: 50 },
      },
    },
  },
  {
    name: "search_instruments",
    description: "Resolve identities by ISIN and listing, never by ambiguous ticker for writes.",
    effect: "read", availability: "contract_only", humanConfirmation: false,
    inputSchema: {
      type: "object", additionalProperties: false, required: ["query"],
      properties: {
        query: { type: "string", minLength: 2, maxLength: 80 },
        asset_type: { type: "string", enum: ["etf", "equity"] },
        limit: limit20,
      },
    },
  },
  {
    name: "get_instrument_profile",
    description: "Read an identified listing profile with source and as-of information.",
    effect: "read", availability: "contract_only", humanConfirmation: false,
    inputSchema: {
      type: "object", additionalProperties: false, required: ["listing_id"],
      properties: { listing_id: listingId },
    },
  },
  {
    name: "get_asset_research",
    description: "Reserved research query, dependent on unimplemented BF-015.",
    effect: "read", availability: "contract_only", humanConfirmation: false,
    inputSchema: {
      type: "object", additionalProperties: false, required: ["listing_id"],
      properties: {
        listing_id: listingId,
        since: { type: "string", format: "date" },
        limit: limit20,
      },
    },
  },
  {
    name: "set_watchlist_follow",
    description: "Future explicit-interest change by listing UUID, never a trade.",
    effect: "personal_write", availability: "contract_only", humanConfirmation: true,
    inputSchema: {
      type: "object", additionalProperties: false,
      required: ["listing_id", "action", "confirmed"],
      properties: {
        listing_id: listingId,
        action: { type: "string", enum: ["follow", "unfollow"] },
        confirmed,
      },
    },
  },
  {
    name: "submit_research_proposal",
    description: "Future proposal for human review, never an approved financial fact.",
    effect: "proposal", availability: "contract_only", humanConfirmation: true,
    inputSchema: {
      type: "object", additionalProperties: false,
      required: ["listing_id", "title", "summary", "source_url", "published_on", "idempotency_key", "confirmed"],
      properties: {
        listing_id: listingId,
        title: { type: "string", minLength: 8, maxLength: 160 },
        summary: { type: "string", minLength: 20, maxLength: 1000 },
        source_url: { type: "string", format: "https-url", maxLength: 2048 },
        published_on: { type: "string", format: "date" },
        idempotency_key: { type: "string", format: "uuid" },
        confirmed,
      },
    },
  },
];

export type McpContractError =
  | "UNKNOWN_TOOL" | "INVALID_ARGUMENTS" | "CONFIRMATION_REQUIRED";

export type ParsedMcpCall =
  | { ok: true; tool: McpToolDefinition; arguments: Readonly<Record<string, string | number | boolean>> }
  | { ok: false; error: McpContractError; message: string };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f]/;

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function validHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return url.protocol === "https:" && url.username === "" && url.password === "" &&
      host.length > 0 && !host.includes(":") && !/^\d+(?:\.\d+){3}$/.test(host) &&
      host !== "localhost" && !host.endsWith(".localhost") &&
      !host.endsWith(".local") && !host.endsWith(".internal");
  } catch {
    return false;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function validField(value: unknown, schema: McpFieldSchema): value is string | number | boolean {
  if (schema.type === "string") {
    if (typeof value !== "string" || CONTROL_CHARS_RE.test(value) || value.trim() !== value) return false;
    if (schema.minLength !== undefined && value.length < schema.minLength) return false;
    if (schema.maxLength !== undefined && value.length > schema.maxLength) return false;
    if (schema.format === "uuid" && !UUID_RE.test(value)) return false;
    if (schema.format === "date" && !validDate(value)) return false;
    if (schema.format === "https-url" && !validHttpsUrl(value)) return false;
  } else if (schema.type === "integer") {
    if (typeof value !== "number" || !Number.isSafeInteger(value)) return false;
    if (schema.minimum !== undefined && value < schema.minimum) return false;
    if (schema.maximum !== undefined && value > schema.maximum) return false;
  } else if (typeof value !== "boolean") {
    return false;
  }
  if (schema.enum && !schema.enum.some((entry) => entry === value)) return false;
  return true;
}

/** Input parsing only. This never authenticates, authorizes, executes or approves an MCP call. */
export function parseFinancialMcpCall(name: string, raw: unknown): ParsedMcpCall {
  const tool = FINANCIAL_MCP_TOOLS.find((candidate) => candidate.name === name);
  if (!tool) return { ok: false, error: "UNKNOWN_TOOL", message: "Tool not registered." };
  if (!isPlainObject(raw)) {
    return { ok: false, error: "INVALID_ARGUMENTS", message: "Arguments must be a plain object." };
  }
  const schema = tool.inputSchema;
  if (Object.keys(raw).some((key) => !Object.prototype.hasOwnProperty.call(schema.properties, key))) {
    return { ok: false, error: "INVALID_ARGUMENTS", message: "Unexpected argument." };
  }
  for (const key of schema.required) {
    if (!Object.prototype.hasOwnProperty.call(raw, key)) {
      return { ok: false, error: "INVALID_ARGUMENTS", message: "Required argument missing." };
    }
  }
  for (const [key, value] of Object.entries(raw)) {
    if (!validField(value, schema.properties[key])) {
      if (key === "confirmed" && tool.humanConfirmation) {
        return { ok: false, error: "CONFIRMATION_REQUIRED", message: "Explicit confirmation required." };
      }
      return { ok: false, error: "INVALID_ARGUMENTS", message: "Invalid argument value." };
    }
  }
  return { ok: true, tool, arguments: raw as Record<string, string | number | boolean> };
}

export type McpInvestorProfileSummary = {
  status: "complete" | "incomplete" | "review_needed";
  capacity_band: "low" | "medium" | "high" | null;
  tolerance_band: "low" | "medium" | "high";
  overall_band: "low" | "medium" | "high" | null;
  questionnaire_version: string;
  scoring_version: string;
  assessed_at: string;
  educational_only: true;
};

/** Strict allowlist: no answers, income/debt clues or owner identifiers leave this function. */
export function toMcpInvestorProfileSummary(
  snapshot: Omit<McpInvestorProfileSummary, "assessed_at" | "educational_only"> & { created_at: string },
): McpInvestorProfileSummary {
  return {
    status: snapshot.status,
    capacity_band: snapshot.capacity_band,
    tolerance_band: snapshot.tolerance_band,
    overall_band: snapshot.overall_band,
    questionnaire_version: snapshot.questionnaire_version,
    scoring_version: snapshot.scoring_version,
    assessed_at: snapshot.created_at,
    educational_only: true,
  };
}
