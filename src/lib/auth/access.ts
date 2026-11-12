export const LOGIN_PATH = "/login";
export const DEFAULT_PRIVATE_PATH = "/panel";

const PUBLIC_PATHS: readonly string[] = [LOGIN_PATH];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname);
}

export type AccessDecision =
  | { action: "allow" }
  | { action: "redirect"; location: string };

// Optimistic, cookie-based decision used by the proxy. Real authorization lives in
// Postgres (RLS + private.is_owner), never here.
export function decideAccess(input: { pathname: string; authenticated: boolean }): AccessDecision {
  const { pathname, authenticated } = input;
  if (!authenticated && !isPublicPath(pathname)) {
    const next = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname)}`;
    return { action: "redirect", location: `${LOGIN_PATH}${next}` };
  }
  if (authenticated && pathname === LOGIN_PATH) {
    return { action: "redirect", location: DEFAULT_PRIVATE_PATH };
  }
  return { action: "allow" };
}

// Accepts only same-site relative paths, to prevent open redirects after login.
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/")) return DEFAULT_PRIVATE_PATH;
  try {
    const base = "http://internal.invalid";
    const url = new URL(raw, base);
    if (url.origin !== base) return DEFAULT_PRIVATE_PATH;
    if (url.pathname === LOGIN_PATH || url.pathname === "/") return DEFAULT_PRIVATE_PATH;
    return `${url.pathname}${url.search}`;
  } catch {
    return DEFAULT_PRIVATE_PATH;
  }
}
