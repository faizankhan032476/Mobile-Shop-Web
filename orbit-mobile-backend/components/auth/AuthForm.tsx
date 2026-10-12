"use client";
import Link from "next/link";
import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { requestPasswordReset, signIn, signUp, updatePassword, type AuthState } from "@/app/auth/actions";

const MODES = {
  login: { title: "Sign in", action: signIn, cta: "Sign in", fields: ["email", "password"] },
  register: { title: "Create your account", action: signUp, cta: "Create account", fields: ["fullName", "email", "password"] },
  forgot: { title: "Reset your password", action: requestPasswordReset, cta: "Send reset link", fields: ["email"] },
  reset: { title: "Choose a new password", action: updatePassword, cta: "Save password", fields: ["password"] },
} as const;
const LABEL = { fullName: "Full name", email: "Email", password: "Password" } as const;
const AUTOCOMPLETE = { fullName: "name", email: "email", password: "current-password" } as const;

export function AuthForm({ mode }: { mode: keyof typeof MODES }) {
  const m = MODES[mode];
  const sp = useSearchParams();
  const [state, formAction, pending] = useActionState<AuthState, FormData>(m.action, {});
  return (
    <div className="container-x max-w-md py-14">
      <h1 className="text-3xl font-bold">{m.title}</h1>
      {sp.get("error") === "link" && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-sale">That link has expired or was already used. Please try again.</p>}
      <form action={formAction} noValidate className="card mt-6 space-y-4 p-6">
        <input type="hidden" name="next" value={sp.get("next") ?? ""} />
        {m.fields.map((f) => (
          <div key={f}>
            <label htmlFor={f} className="mb-1 block text-sm font-semibold">{f === "password" && mode === "reset" ? "New password" : LABEL[f]}</label>
            <input id={f} name={f} type={f === "password" ? "password" : f === "email" ? "email" : "text"} className="input" required
              autoComplete={f === "password" && mode !== "login" ? "new-password" : AUTOCOMPLETE[f]} aria-invalid={!!state.fields?.[f]} aria-describedby={state.fields?.[f] ? `${f}-e` : undefined} />
            {state.fields?.[f] && <p id={`${f}-e`} className="field-error">{state.fields[f]}</p>}
          </div>
        ))}
        {state.error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-sale">{state.error}</p>}
        {state.message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-ok">{state.message}</p>}
        <button className="btn btn-primary w-full" disabled={pending}>{pending ? "Please wait…" : m.cta}</button>
      </form>
      <p className="mt-4 space-x-4 text-sm text-muted">
        {mode === "login" && <><Link href="/register" className="font-semibold text-brand">Create an account</Link><Link href="/forgot-password" className="font-semibold text-brand">Forgot password?</Link></>}
        {mode === "register" && <Link href="/login" className="font-semibold text-brand">Already have an account? Sign in</Link>}
        {mode === "forgot" && <Link href="/login" className="font-semibold text-brand">Back to sign in</Link>}
      </p>
    </div>
  );
}
