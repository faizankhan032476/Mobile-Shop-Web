"use client";
import { useEffect, useRef, useState } from "react";
import { BRANDS, CATEGORIES } from "@/data/products";
import type { Category, Product } from "@/types";
import { ProductImage } from "@/components/products/ProductImage";

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const toText = (p?: Product) => ({
  name: p?.name ?? "", brand: p?.brand ?? BRANDS[0], category: (p?.category ?? "Mid-range") as Category,
  price: String(p?.price ?? ""), originalPrice: String(p?.originalPrice ?? ""), stock: String(p?.stock ?? "0"),
  description: p?.description ?? "", featured: p?.featured ?? false, onSale: p?.onSale ?? false, imageUrl: p?.imageUrl ?? "",
  colors: p ? p.colors.map((c) => `${c.name}:${c.hex}`).join(", ") : "Black:#222222",
  storage: p ? p.storage.join(", ") : "128GB",
  specs: p ? Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join("\n") : "Display: \nProcessor: \nCamera: \nBattery: ",
});

export function ProductForm({ open, product, existingIds, onSave, onClose }: { open: boolean; product?: Product; existingIds: string[]; onSave: (p: Product) => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [f, setF] = useState(toText(product));
  const [err, setErr] = useState<Record<string, string>>({});
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reload form fields whenever the dialog opens for a product
  useEffect(() => { if (open) { setF(toText(product)); setErr({}); } }, [open, product]);
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const x: Record<string, string> = {};
    const price = Number(f.price), orig = f.originalPrice ? Number(f.originalPrice) : undefined, stock = Number(f.stock);
    const colors = f.colors.split(",").map((s) => s.trim()).filter(Boolean).map((s) => { const [name, hex] = s.split(":"); return { name: name.trim(), hex: (hex ?? "").trim() }; });
    const storage = f.storage.split(",").map((s) => s.trim()).filter(Boolean);
    if (f.name.trim().length < 3) x.name = "Enter a product name.";
    if (!Number.isFinite(price) || price <= 0) x.price = "Enter a price above 0.";
    if (orig !== undefined && (!Number.isFinite(orig) || orig < price)) x.originalPrice = "Original price must be at least the selling price.";
    if (!Number.isInteger(stock) || stock < 0) x.stock = "Stock must be a whole number, 0 or more.";
    if (colors.length === 0 || colors.some((c) => !/^#[0-9a-fA-F]{6}$/.test(c.hex))) x.colors = "Use Name:#hex pairs, like Black:#222222, Blue:#2244aa.";
    if (storage.length === 0) x.storage = "Add at least one storage option.";
    if (f.description.trim().length < 10) x.description = "Write a short description (10+ characters).";
    if (f.imageUrl && !/^https?:\/\//.test(f.imageUrl)) x.imageUrl = "Image URLs must start with http:// or https://";
    setErr(x);
    if (Object.keys(x).length) return;
    const specs = Object.fromEntries(f.specs.split("\n").map((l) => l.split(/:([\s\S]*)/)).filter((a) => a[0].trim() && a[1]?.trim()).map((a) => [a[0].trim(), a[1].trim()]));
    let id = product?.id ?? slug(f.name);
    if (!product) { let n = 2; const base = id; while (existingIds.includes(id)) id = `${base}-${n++}`; }
    onSave({ id, name: f.name.trim(), brand: f.brand, category: f.category, price, originalPrice: orig && orig > price ? orig : undefined, stock, description: f.description.trim(), specs, colors, storage, featured: f.featured, onSale: f.onSale || (!!orig && orig > price), imageUrl: f.imageUrl || undefined,
      rating: product?.rating ?? 4.0, reviewCount: product?.reviewCount ?? 0, popularity: product?.popularity ?? 0, createdAt: product?.createdAt ?? new Date().toISOString().slice(0, 10) });
  };

  const t = (k: keyof typeof f, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><label htmlFor={`pf-${k}`} className="mb-1 block text-sm font-semibold">{label}</label>
      <input id={`pf-${k}`} className="input" value={String(f[k])} aria-invalid={!!err[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} {...extra} />{err[k] && <p className="field-error">{err[k]}</p>}</div>
  );
  const preview = { name: f.name || "Preview", imageUrl: f.imageUrl || undefined, colors: [{ name: "x", hex: /^#[0-9a-f]{6}/i.test(f.colors.split(":")[1] ?? "") ? f.colors.split(":")[1].slice(0, 7) : "#2d2e30" }] };

  return (
    <dialog ref={ref} onClose={onClose} className="m-auto max-h-[92vh] w-[min(94vw,42rem)] overflow-y-auto rounded-2xl p-6 backdrop:bg-ink/50">
      <h2 className="text-xl font-bold">{product ? "Edit product" : "Add product"}</h2>
      <form onSubmit={submit} noValidate className="mt-4 space-y-4">
        {t("name", "Name")}
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="pf-brand" className="mb-1 block text-sm font-semibold">Brand</label><input id="pf-brand" list="brands" className="input" value={f.brand} onChange={(e) => setF({ ...f, brand: e.target.value })} /><datalist id="brands">{BRANDS.map((b) => <option key={b} value={b} />)}</datalist></div>
          <div><label htmlFor="pf-cat" className="mb-1 block text-sm font-semibold">Category</label><select id="pf-cat" className="input" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value as Category })}>{CATEGORIES.map((c) => <option key={c.name}>{c.name}</option>)}</select></div>
          {t("price", "Price (PKR)", { type: "number", min: 0 })}{t("originalPrice", "Original price (optional)", { type: "number", min: 0 })}{t("stock", "Stock", { type: "number", min: 0 })}
        </div>
        <div><label htmlFor="pf-d" className="mb-1 block text-sm font-semibold">Description</label><textarea id="pf-d" className="input" value={f.description} aria-invalid={!!err.description} onChange={(e) => setF({ ...f, description: e.target.value })} />{err.description && <p className="field-error">{err.description}</p>}</div>
        {t("colors", "Colors (Name:#hex, comma separated)")}{t("storage", "Storage options (comma separated)")}
        <div><label htmlFor="pf-s" className="mb-1 block text-sm font-semibold">Specifications (one “Label: value” per line)</label><textarea id="pf-s" className="input" value={f.specs} onChange={(e) => setF({ ...f, specs: e.target.value })} /></div>
        <div className="flex items-end gap-4"><div className="flex-1">{t("imageUrl", "Image URL (optional)", { placeholder: "https://…" })}</div><div className="grid h-24 w-16 place-items-center rounded-lg bg-paper"><ProductImage product={preview} className="h-20 w-auto" /></div></div>
        <div className="flex gap-6 text-sm font-semibold"><label className="flex min-h-9 items-center gap-2"><input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} /> Featured</label><label className="flex min-h-9 items-center gap-2"><input type="checkbox" checked={f.onSale} onChange={(e) => setF({ ...f, onSale: e.target.checked })} /> On sale</label></div>
        <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button><button className="btn btn-primary">Save product</button></div>
      </form>
    </dialog>
  );
}
