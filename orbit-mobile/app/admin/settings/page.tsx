"use client";
import { useState } from "react";
import { KEYS, useOrders, useProducts } from "@/lib/hooks";
import { writeKey } from "@/lib/local-store";
import { SEED_ORDERS } from "@/data/products";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/lib/toast";

export default function Settings() {
  const { reset } = useProducts();
  useOrders();
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Settings</h1>
      <section className="card space-y-3 p-5"><h2 className="font-bold">Store details (demo)</h2><p className="text-sm text-muted">Store name, currency (PKR) and shipping rules are defined in code for now (<code>lib/pricing.ts</code>). Editable settings arrive with the backend.</p></section>
      <section className="card space-y-3 p-5"><h2 className="font-bold">Reset demo data</h2><p className="text-sm text-muted">Restores the original products and sample orders and clears the cart and wishlist in this browser.</p><button className="btn btn-danger" onClick={() => setConfirm(true)}>Reset demo data</button></section>
      <ConfirmDialog open={confirm} title="Reset all demo data?" body="Your edits, new products and placed demo orders will be lost." confirmLabel="Reset" onCancel={() => setConfirm(false)} onConfirm={() => { reset(); writeKey(KEYS.orders, SEED_ORDERS); writeKey(KEYS.cart, []); writeKey(KEYS.wishlist, []); setConfirm(false); toast("Demo data reset"); }} />
    </div>
  );
}
