import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { decideAccess } from "@/lib/auth/access";
import { getSupabaseEnv } from "./env";

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let env: { url: string; key: string };
  try {
    env = getSupabaseEnv();
  } catch {
    // Fail closed: without configuration nothing private can be served.
    return new NextResponse("Authentication is not configured.", { status: 503 });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value);
      },
    },
  });

  // Cookie-based claims check (no database round trip), which also refreshes expiring tokens.
  const { data } = await supabase.auth.getClaims();
  const authenticated = Boolean(data?.claims?.sub);

  const decision = decideAccess({ pathname: request.nextUrl.pathname, authenticated });
  if (decision.action === "redirect") {
    const redirect = NextResponse.redirect(new URL(decision.location, request.url));
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }

  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
