import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const claims = vi.hoisted(() => ({ value: null as { sub: string } | null }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getClaims: async () => ({ data: claims.value ? { claims: claims.value } : null, error: null }) },
  }),
}));

import { updateSession } from "../src/lib/supabase/proxy";

const request = (path: string) => new NextRequest(`http://localhost:3000${path}`);

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  claims.value = null;
});

afterEach(() => vi.unstubAllEnvs());

describe("proxy access control (AC1, AC2)", () => {
  it("redirects an unauthenticated request for a private route to the login page", async () => {
    const response = await updateSession(request("/panel"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname + new URL(response.headers.get("location")!).search).toBe(
      "/login?next=%2Fpanel",
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("blocks private routes again after the session is gone (post-logout state)", async () => {
    claims.value = { sub: "owner" };
    expect((await updateSession(request("/decisiones"))).status).toBe(200);
    claims.value = null;
    expect((await updateSession(request("/decisiones"))).status).toBe(307);
  });

  it("serves a private route when there is a valid session", async () => {
    claims.value = { sub: "owner" };
    const response = await updateSession(request("/comparador"));
    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("serves the login page without a session", async () => {
    expect((await updateSession(request("/login"))).status).toBe(200);
  });

  it("redirects a signed-in visitor away from the login page", async () => {
    claims.value = { sub: "owner" };
    const response = await updateSession(request("/login"));
    expect(response.status).toBe(307);
    expect(new URL(response.headers.get("location")!).pathname).toBe("/panel");
  });

  it("fails closed when Supabase is not configured", async () => {
    vi.unstubAllEnvs();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    const response = await updateSession(request("/panel"));
    expect(response.status).toBe(503);
  });
});
