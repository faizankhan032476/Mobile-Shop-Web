"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { refreshMe, useCart, useMe, useWishlist } from "@/lib/hooks";

const LINKS = [["Shop", "/shop"], ["Flagship", "/shop?category=flagship"], ["Foldable", "/shop?category=foldable"], ["Offers", "/shop?sale=1"], ["Orders", "/orders"]] as const;

export function Navbar() {
  const router = useRouter();
  const path = usePathname();
  const { me } = useMe();
  useEffect(() => { void refreshMe(); }, [path]);   // pick up sign-in / sign-out after navigation
  const { count } = useCart();
  const { ids } = useWishlist();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const submit = (e: React.FormEvent) => { e.preventDefault(); router.push(`/search?q=${encodeURIComponent(q.trim())}`); setOpen(false); };

  return (
    <header className="sticky top-0 z-50">
      <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-white">
        Free delivery on orders over Rs 150,000. Pay on delivery anywhere in Pakistan.
      </div>
      <div className="border-b border-line bg-surface/95 backdrop-blur">
        <div className="container-x flex h-16 items-center gap-4">
          <button className="btn btn-outline !px-3 md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen(!open)}>
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
          <Link href="/" className="font-display text-2xl font-bold tracking-tight">Orbit<span className="text-brand">.</span></Link>
          <nav aria-label="Main" className="ml-4 hidden items-center gap-6 text-sm font-semibold md:flex">
            {LINKS.map(([l, h]) => <Link key={l} href={h} className="text-muted hover:text-ink">{l}</Link>)}
          </nav>
          <form onSubmit={submit} role="search" className="ml-auto hidden max-w-xs flex-1 lg:block">
            <label className="sr-only" htmlFor="nav-search">Search phones</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden />
              <input id="nav-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search phones or brands" className="input !min-h-10 pl-9" />
            </div>
          </form>
          <div className="ml-auto flex items-center gap-1 lg:ml-0">
            <Link href="/wishlist" aria-label={`Wishlist, ${ids.length} saved`} className="btn !px-3 relative hover:bg-paper"><Heart size={20} />{ids.length > 0 && <Badge n={ids.length} />}</Link>
            <Link href={me ? "/account" : "/login"} aria-label={me ? "Account" : "Sign in"} className="btn !px-3 hidden hover:bg-paper sm:inline-flex"><UserRound size={20} /></Link>
            <Link href="/cart" aria-label={`Cart, ${count} items`} className="btn !px-3 relative hover:bg-paper"><ShoppingBag size={20} />{count > 0 && <Badge n={count} />}</Link>
          </div>
        </div>
        {open && (
          <div className="container-x space-y-1 pb-4 md:hidden">
            <form onSubmit={submit} role="search" className="mb-2">
              <label className="sr-only" htmlFor="m-search">Search phones</label>
              <input id="m-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search phones or brands" className="input" />
            </form>
            {[...LINKS, ["Account", "/account"] as const].map(([l, h]) => (
              <Link key={l} href={h} onClick={() => setOpen(false)} className="block rounded-lg px-3 py-3 font-semibold hover:bg-paper">{l}</Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

const Badge = ({ n }: { n: number }) => (
  <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-white">{n}</span>
);
