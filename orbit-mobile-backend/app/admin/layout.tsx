"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Menu, Package, Settings, ShoppingCart, Store, X } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { useMe } from "@/lib/hooks";

const NAV = [["Dashboard", "/admin", LayoutDashboard], ["Products", "/admin/products", Package], ["Orders", "/admin/orders", ShoppingCart], ["Settings", "/admin/settings", Settings]] as const;

/** UI gate only. The real checks happen in every /api/admin/* route and in the database (RLS + is_admin()). */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { me, status } = useMe();
  const [open, setOpen] = useState(false);

  if (status !== "ready") return <div className="grid min-h-screen place-items-center text-muted" aria-live="polite">Checking access…</div>;
  if (me?.role !== "admin") return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="card max-w-md space-y-4 p-8 text-center">
        <h1 className="text-2xl font-bold">{me ? "Administrators only" : "Sign in required"}</h1>
        <p className="text-sm text-muted">{me ? "Your account doesn’t have admin access. Admin rights are granted by the store owner in the database." : "Sign in with the store owner’s account to continue."}</p>
        {!me && <Link href="/login?next=/admin" className="btn btn-dark w-full">Sign in</Link>}
        <Link href="/" className="btn btn-outline w-full">Back to store</Link>
      </div>
    </div>
  );

  const nav = (
    <nav aria-label="Admin" className="space-y-1">
      {NAV.map(([l, h, Icon]) => {
        const on = h === "/admin" ? path === h : path.startsWith(h);
        return <Link key={h} href={h} onClick={() => setOpen(false)} aria-current={on ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold ${on ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10"}`}><Icon size={18} />{l}</Link>;
      })}
      <Link href="/" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-white/70 hover:bg-white/10"><Store size={18} />View storefront</Link>
      <form action={signOut}><button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-white/70 hover:bg-white/10">Sign out</button></form>
    </nav>
  );
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden bg-ink p-4 lg:block"><p className="mb-1 px-3 font-display text-xl font-bold text-white">Orbit admin</p><p className="mb-6 truncate px-3 text-xs text-white/60">{me.email}</p>{nav}</aside>
      <div className="flex items-center justify-between bg-ink px-4 py-3 text-white lg:hidden">
        <p className="font-display text-lg font-bold">Orbit admin</p>
        <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="bg-ink px-4 pb-4 lg:hidden">{nav}</div>}
      <div className="min-w-0 p-4 sm:p-8">{children}</div>
    </div>
  );
}
