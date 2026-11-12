import { describe, expect, it } from "vitest";
import { findClientExposure } from "../scripts/guardrails.mjs";

describe("findClientExposure (BF-008 AC3)", () => {
  it("flags a secret-like NEXT_PUBLIC variable", () => {
    const name = ["NEXT_PUBLIC", "SUPABASE", "SERVICE", "KEY"].join("_");
    expect(findClientExposure("src/lib/env.ts", `process.env.${name}`)).toHaveLength(1);
  });

  it("allows the public Supabase URL and publishable key names", () => {
    const text = "NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";
    expect(findClientExposure("src/lib/env.ts", text)).toEqual([]);
  });

  it("flags service_role referenced in client-reachable source", () => {
    const word = ["service", "role"].join("_");
    expect(findClientExposure("src/components/X.tsx", `const k = "${word}"`)).toHaveLength(1);
    expect(findClientExposure("src\\app\\page.tsx", `// ${word}`)).toHaveLength(1);
  });

  it("allows service_role only under src/server/", () => {
    const word = ["service", "role"].join("_");
    expect(findClientExposure("src/server/admin.ts", `// ${word}`)).toEqual([]);
  });

  it("does not flag documentation outside src/", () => {
    const word = ["service", "role"].join("_");
    expect(findClientExposure("docs/SECURITY.md", `never expose ${word}`)).toEqual([]);
  });
});
