import { describe, expect, it } from "vitest";
import { decideAccess, isPublicPath, safeNextPath } from "../src/lib/auth/access";

describe("decideAccess (AC1)", () => {
  it("redirects an unauthenticated visitor from a private route to login, keeping the destination", () => {
    expect(decideAccess({ pathname: "/comparador", authenticated: false })).toEqual({
      action: "redirect",
      location: "/login?next=%2Fcomparador",
    });
  });

  it("sends an unauthenticated visitor to a clean login from the root", () => {
    expect(decideAccess({ pathname: "/", authenticated: false })).toEqual({ action: "redirect", location: "/login" });
  });

  it("protects every screen of the product", () => {
    for (const p of ["/panel", "/explorar", "/comparador", "/simulador", "/investigaciones", "/decisiones", "/panel/anything"]) {
      expect(decideAccess({ pathname: p, authenticated: false }).action).toBe("redirect");
    }
  });

  it("lets anyone open the login page", () => {
    expect(decideAccess({ pathname: "/login", authenticated: false })).toEqual({ action: "allow" });
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/login/extra")).toBe(false);
  });

  it("lets an authenticated visitor through and keeps them out of the login page", () => {
    expect(decideAccess({ pathname: "/panel", authenticated: true })).toEqual({ action: "allow" });
    expect(decideAccess({ pathname: "/login", authenticated: true })).toEqual({ action: "redirect", location: "/panel" });
  });
});

describe("safeNextPath (no open redirects)", () => {
  it("accepts same-site relative paths", () => {
    expect(safeNextPath("/comparador")).toBe("/comparador");
    expect(safeNextPath("/explorar?q=VOO")).toBe("/explorar?q=VOO");
  });

  it.each([
    "https://evil.example/steal",
    "//evil.example",
    "/\\evil.example",
    "/\\/evil.example",
    "javascript:alert(1)",
    "evil",
    "",
    "/login",
    "/",
  ])("falls back to the panel for %j", (raw) => {
    expect(safeNextPath(raw)).toBe("/panel");
  });

  it("handles null and undefined", () => {
    expect(safeNextPath(null)).toBe("/panel");
    expect(safeNextPath(undefined)).toBe("/panel");
  });
});
