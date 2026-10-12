"use client";
import Link from "next/link";
import { useProducts, useWishlist } from "@/lib/hooks";
import { ProductCard } from "@/components/products/ProductCard";

export default function WishlistPage() {
  const { ids } = useWishlist();
  const { products, status } = useProducts();
  const items = products.filter((p) => ids.includes(p.id));
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-3xl font-bold sm:text-4xl">Wishlist</h1>
      {status !== "ready" ? <p className="text-muted" aria-live="polite">Loading…</p> : items.length === 0 ? <div className="card grid place-items-center gap-3 px-6 py-16 text-center"><h2 className="text-xl font-bold">Nothing saved yet</h2><p className="text-sm text-muted">Tap the heart on any phone to keep it here.</p><Link href="/shop" className="btn btn-primary">Browse phones</Link></div>
        : <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-4">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>}
    </div>
  );
}
