import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  user: { id: "u-1" } as { id: string } | null,
  authError: null as unknown,
  result: { data: [] as unknown[] | null, error: null as unknown },
  throwOnQuery: false,
  calls: [] as string[],
}));

vi.mock("server-only", () => ({}));
vi.mock("next/server", () => ({ connection: async () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (location: string) => {
    throw new Error(`NEXT_REDIRECT:${location}`);
  },
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => {
    const query: Record<string, unknown> = {};
    for (const m of ["select", "eq", "order", "limit"]) {
      query[m] = (...args: unknown[]) => {
        state.calls.push(`${m}:${args.map(String).join(",")}`);
        return query;
      };
    }
    query.then = (resolve: (v: unknown) => void, reject: (e: unknown) => void) => {
      if (state.throwOnQuery) return reject(new Error("boom"));
      return resolve(state.result);
    };
    return {
      auth: { getUser: async () => ({ data: { user: state.user }, error: state.authError }) },
      from: (table: string) => {
        state.calls.push(`from:${table}`);
        return query;
      },
    };
  },
}));

import { getLabPriceIndex } from "../src/lib/lab/queries";
import {
  LAB_ROW_LIMIT, LAB_UNAVAILABLE, buildLabView, formatIndexValue, type LabPriceRow,
} from "../src/lib/lab/view";
import { NAV_ITEMS, findNavItem } from "../src/lib/navigation";

const row = (over: Partial<LabPriceRow> = {}): LabPriceRow => ({
  series_code: "LAB-A", as_of_date: "2026-01-31", index_value: 101.5,
  unit: "PTS", is_synthetic: true, source_label: "EDUCATE_LAB_SYNTHETIC_2026", ...over,
});

beforeEach(() => {
  state.user = { id: "u-1" };
  state.authError = null;
  state.result = { data: [], error: null };
  state.throwOnQuery = false;
  state.calls = [];
});

describe("BF-LAB-01 view model", () => {
  it("is empty when there are no rows", () => {
    expect(buildLabView([])).toEqual({ status: "empty" });
  });

  it("renders synthetic rows with source labels", () => {
    const view = buildLabView([row(), row({ as_of_date: "2026-02-28", index_value: "102.25" })]);
    expect(view.status).toBe("ready");
    if (view.status !== "ready") return;
    expect(view.rows).toHaveLength(2);
    expect(view.rows[0]).toMatchObject({ seriesCode: "LAB-A", asOfDate: "2026-01-31", unit: "PTS" });
    expect(view.sourceLabels).toEqual(["EDUCATE_LAB_SYNTHETIC_2026"]);
    expect(view.truncated).toBe(false);
  });

  it("fails closed when any row is not synthetic", () => {
    expect(buildLabView([row(), row({ is_synthetic: false })])).toEqual({ status: "integrity_error" });
  });

  it("never shows missing or invalid values as zero", () => {
    for (const bad of [null, undefined, "", "abc", NaN, 0, -3]) {
      expect(formatIndexValue(bad)).toBe(LAB_UNAVAILABLE);
    }
    expect(formatIndexValue(101.5)).not.toBe(LAB_UNAVAILABLE);
  });

  it("caps rows and reports truncation", () => {
    const rows = Array.from({ length: LAB_ROW_LIMIT + 1 }, (_, i) =>
      row({ as_of_date: `2026-01-${String(i)}` }));
    const view = buildLabView(rows);
    expect(view.status === "ready" && view.rows.length).toBe(LAB_ROW_LIMIT);
    expect(view.status === "ready" && view.truncated).toBe(true);
  });
});

describe("BF-LAB-01 query", () => {
  it("redirects to /login without a session", async () => {
    state.user = null;
    await expect(getLabPriceIndex()).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("only reads lab_price_index for the authenticated user", async () => {
    state.result = { data: [row()], error: null };
    const result = await getLabPriceIndex();
    expect(result.status).toBe("ready");
    expect(state.calls).toContain("from:lab_price_index");
    expect(state.calls).toContain("eq:owner_user_id,u-1");
    const tables = state.calls.filter((c) => c.startsWith("from:"));
    expect(tables).toEqual(["from:lab_price_index"]);
    expect(state.calls.some((c) => /^(insert|update|delete|upsert|rpc)/.test(c))).toBe(false);
  });

  it("returns a generic error when the query fails, without leaking details", async () => {
    state.result = { data: null, error: { message: "relation secret_detail missing" } };
    const result = await getLabPriceIndex();
    expect(result.status).toBe("error");
    expect(JSON.stringify(result)).not.toContain("secret_detail");
  });

  it("returns an error state when the client throws", async () => {
    state.throwOnQuery = true;
    expect((await getLabPriceIndex()).status).toBe("error");
  });
});

describe("BF-LAB-01 navigation", () => {
  it("registers /laboratorio", () => {
    expect(NAV_ITEMS.some((i) => i.href === "/laboratorio")).toBe(true);
    expect(findNavItem("/laboratorio")?.label).toBe("Laboratorio");
  });
});
