"use server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNext } from "@/lib/server/redirects";

export type AuthState = { error?: string; message?: string; fields?: Record<string, string> };

const email = z.email("Enter a valid email address.").max(254);
const password = z.string().min(8, "Use at least 8 characters.").max(72, "Use 72 characters or fewer.");
const fail = (e: z.ZodError): AuthState => ({ error: "Please fix the highlighted fields.", fields: Object.fromEntries(e.issues.map((i) => [String(i.path[0]), i.message])) });
const NOT_READY: AuthState = { error: "The backend isn’t configured yet. See SETUP_GUIDE.md." };

async function origin() {
  const h = await headers();
  return h.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? `https://${h.get("host")}`;
}

export async function signUp(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_READY;
  const p = z.object({ fullName: z.string().trim().min(2, "Enter your name.").max(100), email, password }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fail(p.error);
  const next = safeNext(fd.get("next"));
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: p.data.email, password: p.data.password,
    options: { data: { full_name: p.data.fullName }, emailRedirectTo: `${await origin()}/auth/callback?next=${encodeURIComponent(next)}` }
  });
  if (error) {
    if (error.code === "over_email_send_rate_limit") return { error: "Too many confirmation emails were requested. Wait before trying again; if you already registered, try signing in." };
    return { error: error.message.includes("weak") || error.message.includes("Password") ? "Choose a stronger password." : "We couldn’t create that account. Try again or sign in." };
  }
  if (data.session) redirect(next);                       // email confirmation is switched off in Supabase
  return { message: "Check your email for a confirmation link, then sign in." };
}

export async function signIn(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_READY;
  const p = z.object({ email, password: z.string().min(1, "Enter your password.") }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fail(p.error);
  const { error } = await (await createClient()).auth.signInWithPassword(p.data);
  if (error) return { error: error.message.toLowerCase().includes("confirm") ? "Please confirm your email first. Check your inbox." : "Incorrect email or password." };  // never reveals which one
  redirect(safeNext(fd.get("next")));
}

export async function requestPasswordReset(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_READY;
  const p = z.object({ email }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fail(p.error);
  await (await createClient()).auth.resetPasswordForEmail(p.data.email, { redirectTo: `${await origin()}/auth/callback?next=/reset-password` });
  return { message: "If that email has an account, a reset link is on its way." };   // same answer either way
}

export async function updatePassword(_: AuthState, fd: FormData): Promise<AuthState> {
  if (!isSupabaseConfigured()) return NOT_READY;
  const p = z.object({ password }).safeParse(Object.fromEntries(fd));
  if (!p.success) return fail(p.error);
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { error: "Your reset link has expired. Request a new one." };
  const { error } = await supabase.auth.updateUser({ password: p.data.password });
  if (error) return { error: "Couldn’t update the password. Choose a different one." };
  redirect("/account");
}

export async function signOut() {
  if (isSupabaseConfigured()) await (await createClient()).auth.signOut();
  redirect("/");
}
