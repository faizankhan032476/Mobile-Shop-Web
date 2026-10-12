"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Heart, Minus, Plus, ShoppingBag, ZoomIn } from "lucide-react";
import { useCart, useProducts, useWishlist } from "@/lib/hooks";
import { discountPct, formatPKR } from "@/lib/format";
import { toast } from "@/lib/toast";
import { DEMO_REVIEWS } from "@/data/products";
import { Stars } from "@/components/ui/Stars";
import { ProductImage } from "./ProductImage";
import { ProductCard } from "./ProductCard";
import type { PhoneView } from "@/components/ui/PhoneArt";

const VIEWS: PhoneView[] = ["front", "back", "side"];

export function ProductDetail({ id }: { id: string }) {
  const router = useRouter();
  const { products } = useProducts();
  const { add } = useCart();
  const wish = useWishlist();
  const p = products.find((x) => x.id === id);
  const [colorSel, setColor] = useState("");
  const [storageSel, setStorage] = useState("");
  const [qty, setQty] = useState(1);
  const [view, setView] = useState<PhoneView>("front");
  const [zoom, setZoom] = useState(false);

  if (!p) return (
    <div className="container-x grid place-items-center gap-4 py-24 text-center">
      <h1 className="text-3xl font-bold">We couldn’t find that phone</h1>
      <p className="text-muted">It may have been removed from the catalog.</p>
      <Link href="/shop" className="btn btn-primary">Back to shop</Link>
    </div>
  );

  const color = p.colors.some((c) => c.name === colorSel) ? colorSel : p.colors[0].name;
  const storage = p.storage.includes(storageSel) ? storageSel : p.storage[0];
  const q = Math.max(1, Math.min(qty, p.stock || 1));
  const pct = discountPct(p.price, p.originalPrice);
  const related = products.filter((x) => x.id !== p.id && (x.brand === p.brand || x.category === p.category)).slice(0, 4);
  const line = { productId: p.id, color, storage, qty: q };

  return (
    <div className="container-x py-8">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted"><Link href="/" className="hover:text-ink">Home</Link> / <Link href="/shop" className="hover:text-ink">Shop</Link> / <Link href={`/shop?brand=${p.brand}`} className="hover:text-ink">{p.brand}</Link> / <span className="text-ink">{p.name}</span></nav>
      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="card relative grid h-[420px] place-items-center overflow-hidden bg-gradient-to-b from-paper to-white">
            <button aria-pressed={zoom} aria-label={zoom ? "Zoom out" : "Zoom in"} onClick={() => setZoom(!zoom)} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-surface shadow-sm"><ZoomIn size={18} /></button>
            <ProductImage product={p} color={color} view={view} className={`h-[360px] w-auto transition-transform duration-300 ${zoom ? "scale-150" : ""}`} />
          </div>
          <div className="mt-3 flex gap-3">
            {VIEWS.map((v) => (
              <button key={v} onClick={() => setView(v)} aria-label={`Show ${v} view`} aria-pressed={view === v} className={`card grid h-20 w-20 place-items-center ${view === v ? "!border-brand ring-2 ring-brand/30" : ""}`}>
                <ProductImage product={{ ...p, imageUrl: undefined }} color={color} view={v} className="h-14 w-auto" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-muted">{p.brand}</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{p.name}</h1>
          <div className="mt-2"><Stars value={p.rating} count={p.reviewCount} /></div>
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold">{formatPKR(p.price)}</span>
            {pct > 0 && <><s className="text-muted">{formatPKR(p.originalPrice!)}</s><span className="rounded-md bg-sale px-2 py-0.5 text-sm font-bold text-white">-{pct}%</span></>}
          </div>
          <p className={`mt-2 text-sm font-semibold ${p.stock === 0 ? "text-sale" : p.stock <= 5 ? "text-warn" : "text-ok"}`}>{p.stock === 0 ? "Out of stock" : p.stock <= 5 ? `Only ${p.stock} left (demo stock)` : "In stock (demo stock)"}</p>
          <p className="mt-4 max-w-prose text-muted">{p.description}</p>

          <fieldset className="mt-6"><legend className="mb-2 text-sm font-bold">Color: <span className="font-medium text-muted">{color}</span></legend>
            <div className="flex gap-3">{p.colors.map((c) => (
              <button key={c.name} onClick={() => setColor(c.name)} aria-label={c.name} aria-pressed={color === c.name} className={`h-10 w-10 rounded-full border-2 ${color === c.name ? "border-brand ring-2 ring-brand/30" : "border-line"}`} style={{ background: c.hex }} />
            ))}</div></fieldset>
          <fieldset className="mt-5"><legend className="mb-2 text-sm font-bold">Storage</legend>
            <div className="flex flex-wrap gap-2">{p.storage.map((s) => <button key={s} onClick={() => setStorage(s)} aria-pressed={storage === s} className={`btn btn-outline ${storage === s ? "!border-brand !bg-brand/5 text-brand" : ""}`}>{s}</button>)}</div></fieldset>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-[10px] border-[1.5px] border-line bg-surface" role="group" aria-label="Quantity">
              <button className="grid h-11 w-11 place-items-center disabled:opacity-40" disabled={q <= 1} aria-label="Decrease quantity" onClick={() => setQty(q - 1)}><Minus size={16} /></button>
              <span className="w-10 text-center font-semibold" aria-live="polite">{q}</span>
              <button className="grid h-11 w-11 place-items-center disabled:opacity-40" disabled={q >= p.stock} aria-label="Increase quantity" onClick={() => setQty(q + 1)}><Plus size={16} /></button>
            </div>
            <button disabled={p.stock === 0} className="btn btn-dark flex-1" onClick={() => add(line) && toast(`${p.name} added to cart`)}><ShoppingBag size={18} /> Add to cart</button>
            <button disabled={p.stock === 0} className="btn btn-primary flex-1" onClick={() => add(line) && router.push("/checkout")}>Buy now</button>
            <button onClick={() => wish.toggle(p.id)} aria-pressed={wish.has(p.id)} aria-label="Toggle wishlist" className="btn btn-outline !px-3"><Heart size={18} className={wish.has(p.id) ? "fill-sale text-sale" : ""} /></button>
          </div>
        </div>
      </div>

      <section className="mt-14" aria-labelledby="specs"><h2 id="specs" className="mb-4 text-2xl font-bold">Specifications</h2>
        <dl className="card divide-y divide-line">{Object.entries({ Brand: p.brand, Category: p.category, Storage: p.storage.join(" / "), ...p.specs }).map(([k, v]) => <div key={k} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[200px_1fr]"><dt className="font-semibold text-muted">{k}</dt><dd>{v}</dd></div>)}</dl></section>

      <section className="mt-14" aria-labelledby="rv"><h2 id="rv" className="text-2xl font-bold">Reviews</h2><p className="mb-4 mt-1 text-sm text-muted">Sample reviews for demonstration only.</p>
        <div className="grid gap-4 md:grid-cols-3">{DEMO_REVIEWS.map((r) => <figure key={r.name} className="card p-5"><Stars value={r.rating} /><blockquote className="mt-3 text-sm">{r.text}</blockquote><figcaption className="mt-3 text-xs font-semibold text-muted">{r.name}, {r.city}</figcaption></figure>)}</div></section>

      {related.length > 0 && <section className="mt-14" aria-labelledby="rel"><h2 id="rel" className="mb-4 text-2xl font-bold">You might also like</h2><div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-4">{related.map((r) => <ProductCard key={r.id} product={r} />)}</div></section>}
    </div>
  );
}
