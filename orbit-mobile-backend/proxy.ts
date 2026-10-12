import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Keeps the Supabase session fresh and bounces signed-out visitors away from private pages.
 * This is a convenience, NOT the security boundary: every API route and database policy re-checks access.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(list) {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, { ...options, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" }));
      },
    },
  });
  const { data } = await supabase.auth.getClaims();   // validates the JWT signature, unlike getSession()
  const path = request.nextUrl.pathname;
  const needsLogin = path.startsWith("/account") || path === "/orders" || path.startsWith("/admin");
  if (needsLogin && !data?.claims) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] };
