"use client";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useProducts } from "@/lib/hooks";
import { CATEGORIES } from "@/data/products";
import { formatPKR } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { Product } from "@/types";
import { ProductForm } from "@/components/admin/ProductForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProductImage } from "@/components/products/ProductImage";

export default function AdminProducts() {
  const { products, save, remove } = useProducts();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [editing, setEditing] = useState<Product | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [del, setDel] = useState<Product | null>(null);
  const list = products.filter((p) => (!cat || p.category === cat) && `${p.name} ${p.brand}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">Products & inventory</h1><p className="text-sm text-muted">Changes appear on the storefront immediately.</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(undefined); setFormOpen(true); }}><Plus size={18} /> Add product</button></div>
      <div className="flex flex-wrap gap-3"><label className="sr-only" htmlFor="ap-q">Search products</label><input id="ap-q" className="input max-w-xs" placeholder="Search name or brand" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="sr-only" htmlFor="ap-c">Category</label><select id="ap-c" className="input !w-auto" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}</select></div>
      <div className="card overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-line text-muted"><tr><th className="p-3">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Flags</th><th className="p-3 text-right">Actions</th></tr></thead>
        <tbody className="divide-y divide-line">{list.map((p) => (
          <tr key={p.id}>
            <td className="p-3"><div className="flex items-center gap-3"><div className="grid h-12 w-9 place-items-center rounded bg-paper"><ProductImage product={p} className="h-10 w-auto" /></div><div><p className="font-semibold">{p.name}</p><p className="text-xs text-muted">{p.brand}</p></div></div></td>
            <td>{p.category}</td><td>{formatPKR(p.price)}{p.originalPrice && p.originalPrice > p.price && <s className="ml-2 text-xs text-muted">{formatPKR(p.originalPrice)}</s>}</td>
            <td><label className="sr-only" htmlFor={`st-${p.id}`}>Stock for {p.name}</label><input id={`st-${p.id}`} type="number" min={0} defaultValue={p.stock} key={p.stock} onBlur={(e) => { const n = Math.floor(Number(e.target.value)); if (Number.isFinite(n) && n >= 0 && n !== p.stock) { save({ ...p, stock: n }); toast("Stock updated"); } else e.target.value = String(p.stock); }} className={`input !min-h-9 !w-20 ${p.stock <= 5 ? "!border-amber-500" : ""}`} /></td>
            <td className="text-xs">{p.featured && <span className="mr-1 rounded bg-brand/10 px-2 py-0.5 font-bold text-brand">Featured</span>}{p.onSale && <span className="rounded bg-sale/10 px-2 py-0.5 font-bold text-sale">Sale</span>}</td>
            <td className="p-3 text-right"><button aria-label={`Edit ${p.name}`} className="btn btn-outline !min-h-9 !px-3" onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil size={15} /></button> <button aria-label={`Delete ${p.name}`} className="btn btn-outline !min-h-9 !px-3 text-sale" onClick={() => setDel(p)}><Trash2 size={15} /></button></td>
          </tr>))}</tbody></table>
        {list.length === 0 && <p className="p-8 text-center text-sm text-muted">No products match.</p>}</div>
      <ProductForm open={formOpen} product={editing} existingIds={products.map((p) => p.id)} onClose={() => setFormOpen(false)} onSave={(p) => { save(p); setFormOpen(false); toast(editing ? "Product updated" : "Product added"); }} />
      <ConfirmDialog open={!!del} title={`Delete ${del?.name ?? "product"}?`} body="It will disappear from the storefront and from carts. Existing demo orders keep their record." confirmLabel="Delete product" onCancel={() => setDel(null)} onConfirm={() => { if (del) remove(del.id); setDel(null); toast("Product deleted"); }} />
    </div>
  );
}
