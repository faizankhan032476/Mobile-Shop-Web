"use client";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { refreshCatalogs, useAdminProducts, useTaxonomy } from "@/lib/hooks";
import { api, ApiClientError } from "@/lib/api-client";
import { formatPKR } from "@/lib/format";
import { toast } from "@/lib/toast";
import type { Product } from "@/types";
import { ProductForm } from "@/components/admin/ProductForm";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ProductImage } from "@/components/products/ProductImage";

export default function AdminProducts() {
  const { products, status, error } = useAdminProducts();
  const { categories } = useTaxonomy();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [editing, setEditing] = useState<Product | undefined>();
  const [formOpen, setFormOpen] = useState(false);
  const [del, setDel] = useState<Product | null>(null);
  const list = products.filter((p) => (!cat || p.category === cat) && `${p.name} ${p.brand} ${p.sku}`.toLowerCase().includes(q.toLowerCase()));
  const fail = (e: unknown, fallback: string) => toast(e instanceof ApiClientError ? e.message : fallback, "error");

  const setStock = async (p: Product, value: string, el: HTMLInputElement) => {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n) || n < 0) { el.value = String(p.stock); return; }
    if (n === p.stock) return;
    try { await api(`/api/admin/products/${p.id}/stock`, { method: "POST", json: { delta: n - p.stock } }); await refreshCatalogs(); toast("Stock updated"); }   // atomic relative change
    catch (e) { el.value = String(p.stock); fail(e, "Couldn’t update stock"); }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">Products & inventory</h1><p className="text-sm text-muted">Changes are saved to the database and appear in the store immediately.</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(undefined); setFormOpen(true); }}><Plus size={18} /> Add product</button></div>
      <div className="flex flex-wrap gap-3"><label className="sr-only" htmlFor="ap-q">Search products</label><input id="ap-q" className="input max-w-xs" placeholder="Search name, brand or SKU" value={q} onChange={(e) => setQ(e.target.value)} />
        <label className="sr-only" htmlFor="ap-c">Category</label><select id="ap-c" className="input !w-auto" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{categories.map((c) => <option key={c.slug}>{c.name}</option>)}</select></div>
      {status === "error" ? <p role="alert" className="text-sale">{error}</p> : status !== "ready" ? <p className="text-muted" aria-live="polite">Loading products…</p> :
      <div className="card overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-line text-muted"><tr><th className="p-3">Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Flags</th><th className="p-3 text-right">Actions</th></tr></thead>
        <tbody className="divide-y divide-line">{list.map((p) => (
          <tr key={p.id}>
            <td className="p-3"><div className="flex items-center gap-3"><div className="grid h-12 w-9 place-items-center rounded bg-paper"><ProductImage product={p} className="h-10 w-auto" /></div><div><p className="font-semibold">{p.name}</p><p className="text-xs text-muted">{p.brand} · {p.sku}</p></div></div></td>
            <td>{p.category}</td><td>{formatPKR(p.price)}{p.originalPrice && p.originalPrice > p.price && <s className="ml-2 text-xs text-muted">{formatPKR(p.originalPrice)}</s>}</td>
            <td><label className="sr-only" htmlFor={`st-${p.id}`}>Stock for {p.name}</label><input id={`st-${p.id}`} type="number" min={0} defaultValue={p.stock} key={p.stock} onBlur={(e) => void setStock(p, e.target.value, e.target)} className={`input !min-h-9 !w-20 ${p.stock <= 5 ? "!border-amber-500" : ""}`} /></td>
            <td className="text-xs">{!p.published && <span className="mr-1 rounded bg-ink/10 px-2 py-0.5 font-bold">Hidden</span>}{p.featured && <span className="mr-1 rounded bg-brand/10 px-2 py-0.5 font-bold text-brand">Featured</span>}{p.onSale && <span className="rounded bg-sale/10 px-2 py-0.5 font-bold text-sale">Sale</span>}</td>
            <td className="p-3 text-right"><button aria-label={`Edit ${p.name}`} className="btn btn-outline !min-h-9 !px-3" onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil size={15} /></button> <button aria-label={`Delete ${p.name}`} className="btn btn-outline !min-h-9 !px-3 text-sale" onClick={() => setDel(p)}><Trash2 size={15} /></button></td>
          </tr>))}</tbody></table>
        {list.length === 0 && <p className="p-8 text-center text-sm text-muted">No products match.</p>}</div>}
      <ProductForm open={formOpen} product={editing} onClose={() => setFormOpen(false)}
        onSaved={(p, event) => { void refreshCatalogs(); setEditing(p); if (event === "created") toast("Product added. You can now upload photos."); if (event === "updated") { toast("Product updated"); setFormOpen(false); } }} />
      <ConfirmDialog open={!!del} title={`Delete ${del?.name ?? "product"}?`} body="It will disappear from the store. Past orders keep their original name and price." confirmLabel="Delete product" onCancel={() => setDel(null)}
        onConfirm={async () => { const p = del; setDel(null); if (!p) return; try { await api(`/api/admin/products/${p.id}`, { method: "DELETE" }); await refreshCatalogs(); toast("Product deleted"); } catch (e) { fail(e, "Couldn’t delete the product"); } }} />
    </div>
  );
}
