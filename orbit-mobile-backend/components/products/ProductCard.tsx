"use client";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/types";
import { discountPct, formatPKR } from "@/lib/format";
import { useCart, useWishlist } from "@/lib/hooks";
import { toast } from "@/lib/toast";
import { Stars } from "@/components/ui/Stars";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product: p }: { product: Product }) {
  const { add } = useCart();
  const wish = useWishlist();
  const pct = discountPct(p.price, p.originalPrice);
  const saved = wish.has(p.id);
  return (
    <article className="card group relative flex flex-col overflow-hidden transition-shadow hover:shadow-lg">
      <button onClick={() => wish.toggle(p.id)} aria-pressed={saved} aria-label={saved ? `Remove ${p.name} from wishlist` : `Save ${p.name} to wishlist`} className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-surface/90 shadow-sm hover:bg-white">
        <Heart size={18} className={saved ? "fill-sale text-sale" : ""} />
      </button>
      <Link href={`/product/${p.slug}`} className="flex flex-1 flex-col">
        <div className="relative grid h-56 place-items-center bg-gradient-to-b from-paper to-white px-6 pt-4">
          <ProductImage product={p} className="h-48 w-auto transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-2deg]" />
          <div className="absolute left-3 top-3 flex flex-col items-start gap-1 text-xs font-bold">
            {pct > 0 && <span className="rounded-md bg-sale px-2 py-1 text-white">-{pct}%</span>}
            {p.stock === 0 ? <span className="rounded-md bg-ink px-2 py-1 text-white">Out of stock</span> : p.stock <= 5 && <span className="rounded-md bg-amber-100 px-2 py-1 text-warn">Only {p.stock} left</span>}
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          <p className="text-xs font-semibold text-muted">{p.brand}</p>
          <h3 className="text-base font-semibold leading-snug">{p.name}</h3>
          <Stars value={p.rating} count={p.reviewCount} />
          <div className="mt-auto flex items-baseline gap-2 pt-3">
            <span className="text-lg font-bold">{formatPKR(p.price)}</span>
            {p.originalPrice && p.originalPrice > p.price && <s className="text-sm text-muted">{formatPKR(p.originalPrice)}</s>}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button disabled={p.stock === 0} className="btn btn-dark w-full" onClick={() => add({ productId: p.id, color: p.colors[0].name, storage: p.storage[0], qty: 1 }) && toast(`${p.name} added to cart`)}>
          <ShoppingBag size={16} /> {p.stock === 0 ? "Out of stock" : "Add to cart"}
        </button>
      </div>
    </article>
  );
}
