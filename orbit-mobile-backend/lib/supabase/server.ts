import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./env";

/**
 * Supabase client bound to the current request's session cookies.
 * Every query runs as the signed-in user (or anon), so Row Level Security applies.
 * Session cookies are httpOnly: the browser never needs to read them because all data goes through our own API.
 */
export async function createClient() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll(list) {
        try {
          list.forEach(({ name, value, options }) =>
            store.set(name, value, { ...options, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" }));
        } catch { /* called from a Server Component: the proxy refreshes the session instead */ }
      },
    },
  });
}
