"use client";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart, useProducts } from "@/lib/hooks";
import { priceLines, totals, FREE_SHIPPING_THRESHOLD } from "@/lib/pricing";
import { formatPKR } from "@/lib/format";
import { ProductImage } from "@/components/products/ProductImage";

export default function CartPage() {
  const { lines, setQty, remove } = useCart();
  const { products } = useProducts();
  const priced = priceLines(lines, products);
  const t = totals(priced);

  if (priced.length === 0) return (
    <div className="container-x grid place-items-center gap-4 py-24 text-center">
      <ShoppingBag size={40} className="text-muted" />
      <h1 className="text-3xl font-bold">Your cart is empty</h1>
      <p className="text-muted">Add a phone and it will show up here.</p>
      <Link href="/shop" className="btn btn-primary">Continue shopping</Link>
    </div>
  );

  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-3xl font-bold sm:text-4xl">Your cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="space-y-3">
          {priced.map((l) => (
            <li key={`${l.productId}${l.color}${l.storage}`} className="card flex gap-4 p-4">
              <Link href={`/product/${l.productId}`} className="grid h-28 w-24 shrink-0 place-items-center rounded-lg bg-paper"><ProductImage product={l.product} color={l.color} className="h-24 w-auto" /></Link>
              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-2"><Link href={`/product/${l.productId}`} className="font-semibold hover:underline">{l.product.name}</Link><span className="font-bold">{formatPKR(l.lineTotal)}</span></div>
                <p className="text-sm text-muted">{l.color}, {l.storage} · {formatPKR(l.product.price)} each</p>
                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center rounded-lg border border-line" role="group" aria-label={`Quantity for ${l.product.name}`}>
                    <button className="grid h-10 w-10 place-items-center disabled:opacity-40" disabled={l.qty <= 1} aria-label="Decrease quantity" onClick={() => setQty(l, l.qty - 1)}><Minus size={15} /></button>
                    <span className="w-8 text-center text-sm font-semibold">{l.qty}</span>
                    <button className="grid h-10 w-10 place-items-center disabled:opacity-40" disabled={l.qty >= l.product.stock} aria-label="Increase quantity" onClick={() => setQty(l, l.qty + 1)}><Plus size={15} /></button>
                  </div>
                  <button className="flex items-center gap-1 text-sm font-semibold text-sale" onClick={() => remove(l)}><Trash2 size={15} /> Remove</button>
                </div>
                {l.qty >= l.product.stock && <p className="mt-2 text-xs text-warn">Maximum available stock reached.</p>}
              </div>
            </li>
          ))}
        </ul>
        <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-28">
          <h2 className="text-lg font-bold">Order summary</h2>
          <Row k="Subtotal" v={formatPKR(t.subtotal)} />
          <Row k="Shipping" v={t.shipping === 0 ? "Free" : formatPKR(t.shipping)} />
          {t.shipping > 0 && <p className="text-xs text-muted">Add {formatPKR(FREE_SHIPPING_THRESHOLD - t.subtotal)} more for free delivery.</p>}
          <div className="border-t border-line pt-3"><Row k="Total" v={formatPKR(t.total)} bold /></div>
          <Link href="/checkout" className="btn btn-primary w-full">Proceed to checkout</Link>
          <Link href="/shop" className="btn btn-outline w-full">Continue shopping</Link>
        </aside>
      </div>
    </div>
  );
}
const Row = ({ k, v, bold }: { k: string; v: string; bold?: boolean }) => <div className={`flex justify-between ${bold ? "text-lg font-bold" : "text-sm"}`}><span className={bold ? "" : "text-muted"}>{k}</span><span>{v}</span></div>;
