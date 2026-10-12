"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Menu, Package, Settings, ShoppingCart, Store, X } from "lucide-react";
import { KEYS } from "@/lib/hooks";
import { useLocalState } from "@/lib/local-store";

const NAV = [["Dashboard", "/admin", LayoutDashboard], ["Products", "/admin/products", Package], ["Orders", "/admin/orders", ShoppingCart], ["Settings", "/admin/settings", Settings]] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [entered, setEntered] = useLocalState<boolean>(KEYS.admin, false);
  const [open, setOpen] = useState(false);

  if (!entered) return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="card max-w-md space-y-4 p-8 text-center">
        <h1 className="text-2xl font-bold">Demo admin access</h1>
        <p className="text-sm text-muted">This frontend-only version has <b>no real login</b>. The button below only flips a flag in your browser and is <b>not secure</b>. Real authentication and authorization will be added with the backend.</p>
        <button className="btn btn-dark w-full" onClick={() => setEntered(true)}>Enter demo admin</button>
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
      <button onClick={() => setEntered(false)} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-white/70 hover:bg-white/10">Exit demo admin</button>
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden bg-ink p-4 lg:block"><p className="mb-6 px-3 font-display text-xl font-bold text-white">Orbit admin</p>{nav}</aside>
      <div className="flex items-center justify-between bg-ink px-4 py-3 text-white lg:hidden">
        <p className="font-display text-lg font-bold">Orbit admin</p>
        <button aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-11 w-11 place-items-center">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <div className="bg-ink px-4 pb-4 lg:hidden">{nav}</div>}
      <div className="min-w-0 p-4 sm:p-8">
        <p className="mb-6 rounded-lg bg-amber-50 px-4 py-2 text-xs font-semibold text-warn">Demo admin: all data is simulated and stored in this browser. Not secure authentication.</p>
        {children}
      </div>
    </div>
  );
}
