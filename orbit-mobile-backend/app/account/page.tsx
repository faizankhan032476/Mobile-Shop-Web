"use client";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "@/app/auth/actions";
import { useMe, refreshMe } from "@/lib/hooks";
import { api, ApiClientError } from "@/lib/api-client";
import { toast } from "@/lib/toast";

export default function Account() {
  const { me, status } = useMe();
  const [name, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  if (status !== "ready") return <div className="container-x py-24 text-center text-muted" aria-live="polite">Loading your account…</div>;
  if (!me) return <div className="container-x grid place-items-center gap-4 py-24 text-center"><h1 className="text-3xl font-bold">Sign in to your account</h1><Link href="/login?next=/account" className="btn btn-primary">Sign in</Link></div>;

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setErrors({});
    try { await api("/api/me", { method: "PATCH", json: { fullName: name ?? me.fullName, phone: phone ?? me.phone ?? "" } }); await refreshMe(); toast("Profile saved"); }
    catch (ex) { if (ex instanceof ApiClientError) { setErrors(ex.fields ?? {}); toast(ex.message, "error"); } }
  };
  return (
    <div className="container-x max-w-2xl py-12">
      <h1 className="text-4xl font-bold">Account</h1>
      <p className="mt-2 text-muted">Signed in as {me.email}</p>
      <form onSubmit={save} noValidate className="card mt-6 space-y-4 p-5">
        <div><label htmlFor="fullName" className="mb-1 block text-sm font-semibold">Full name</label><input id="fullName" className="input" value={name ?? me.fullName} onChange={(e) => setName(e.target.value)} />{errors.fullName && <p className="field-error">{errors.fullName}</p>}</div>
        <div><label htmlFor="phone" className="mb-1 block text-sm font-semibold">Mobile number</label><input id="phone" className="input" placeholder="03001234567" value={phone ?? me.phone ?? ""} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!errors.phone} />{errors.phone && <p className="field-error">{errors.phone}</p>}</div>
        <button className="btn btn-primary">Save changes</button>
      </form>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/orders" className="btn btn-outline">My orders</Link><Link href="/wishlist" className="btn btn-outline">Wishlist</Link>
        {me.role === "admin" && <Link href="/admin" className="btn btn-dark">Admin dashboard</Link>}
        <form action={signOut}><button className="btn btn-outline">Sign out</button></form>
      </div>
    </div>
  );
}
