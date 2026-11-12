import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  owner: { data: null as { user_id: string } | null },
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { signInWithPassword: state.signIn, signOut: state.signOut },
    from: () => ({ select: () => ({ maybeSingle: async () => state.owner }) }),
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: (location: string) => {
    throw new Error(`NEXT_REDIRECT:${location}`);
  },
}));

import { signIn, signOut } from "../src/lib/auth/actions";

function form(values: Record<string, string>): FormData {
  const data = new FormData();
  for (const [k, v] of Object.entries(values)) data.set(k, v);
  return data;
}

const empty = { error: null };

beforeEach(() => {
  state.signIn.mockReset();
  state.signOut.mockReset();
  state.owner = { data: null };
});

describe("signIn (AC2)", () => {
  it("opens a session for the registered owner and redirects to the requested page", async () => {
    state.signIn.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    state.owner = { data: { user_id: "u1" } };
    await expect(signIn(empty, form({ email: "a@b.c", password: "x", next: "/comparador" }))).rejects.toThrow(
      "NEXT_REDIRECT:/comparador",
    );
    expect(state.signOut).not.toHaveBeenCalled();
  });

  it("ignores a hostile next parameter", async () => {
    state.signIn.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    state.owner = { data: { user_id: "u1" } };
    await expect(signIn(empty, form({ email: "a@b.c", password: "x", next: "https://evil.example" }))).rejects.toThrow(
      "NEXT_REDIRECT:/panel",
    );
  });

  it("returns a generic error for wrong credentials", async () => {
    state.signIn.mockResolvedValue({ data: { user: null }, error: { message: "Invalid login credentials" } });
    expect(await signIn(empty, form({ email: "a@b.c", password: "bad" }))).toEqual({ error: "Credenciales inválidas." });
    expect(state.signOut).not.toHaveBeenCalled();
  });

  it("rejects an authenticated user who is not the owner, and ends that session", async () => {
    state.signIn.mockResolvedValue({ data: { user: { id: "intruder" } }, error: null });
    state.owner = { data: null };
    expect(await signIn(empty, form({ email: "x@y.z", password: "ok" }))).toEqual({ error: "Credenciales inválidas." });
    expect(state.signOut).toHaveBeenCalledOnce();
  });

  it("does not call Supabase when a field is missing", async () => {
    expect((await signIn(empty, form({ email: "", password: "" }))).error).toMatch(/correo/);
    expect(state.signIn).not.toHaveBeenCalled();
  });
});

describe("signOut (AC2)", () => {
  it("ends the session and sends the user to the login page", async () => {
    await expect(signOut()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(state.signOut).toHaveBeenCalledOnce();
  });
});
