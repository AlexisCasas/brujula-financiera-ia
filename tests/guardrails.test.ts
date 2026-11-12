import { describe, expect, it } from "vitest";
import { findForbiddenDeps, findSecrets } from "../scripts/guardrails.mjs";

describe("findSecrets", () => {
  it("detects an OpenAI-style key", () => {
    expect(findSecrets("OPENAI=sk-" + "a".repeat(30))).toContain("OpenAI-style key");
  });
  it("detects a JWT-shaped token", () => {
    const jwt = ["eyJhbGciOiJIUzI1NiJ9", "eyJyb2xlIjoic2VydmljZV9yb2xlIn0", "c2lnbmF0dXJlMTIzNDU"].join(".");
    expect(findSecrets(`key=${jwt}`)).toContain("JWT (e.g. Supabase service_role)");
  });
  it("detects a private key block", () => {
    expect(findSecrets(["-----BEGIN RSA", "PRIVATE KEY-----"].join(" "))).toHaveLength(1);
  });
  it("ignores plain mentions of service_role in documentation", () => {
    expect(findSecrets("Never expose service_role in the client")).toEqual([]);
  });
});

describe("findForbiddenDeps", () => {
  it("flags LLM SDK dependencies", () => {
    expect(findForbiddenDeps({ dependencies: { openai: "1.0.0" }, devDependencies: { "@anthropic-ai/sdk": "1.0.0" } })).toEqual([
      "openai",
      "@anthropic-ai/sdk",
    ]);
  });
  it("accepts a clean dependency set", () => {
    expect(findForbiddenDeps({ dependencies: { next: "16.0.0" } })).toEqual([]);
  });
});
