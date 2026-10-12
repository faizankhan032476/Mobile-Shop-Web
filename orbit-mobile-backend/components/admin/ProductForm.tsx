"use client";
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import type { Product } from "@/types";
import { useTaxonomy } from "@/lib/hooks";
import { api, ApiClientError } from "@/lib/api-client";
import { toast } from "@/lib/toast";

const blank = { name: "", sku: "", brandSlug: "", categorySlug: "", price: "", originalPrice: "", stock: "0", description: "", featured: false, onSale: false, published: true,
  colors: "Black:#222222", storage: "128GB", specs: "Display: \nProcessor: \nCamera: \nBattery: " };
const toText = (p?: Product) => !p ? blank : {
  name: p.name, sku: p.sku, brandSlug: p.brand.toLowerCase().replace(/[^a-z0-9]+/g, "-"), categorySlug: p.category.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  price: String(p.price), originalPrice: String(p.originalPrice ?? ""), stock: String(p.stock), description: p.description, featured: p.featured, onSale: p.onSale, published: p.published,
  colors: p.colors.map((c) => `${c.name}:${c.hex}`).join(", "), storage: p.storage.join(", "), specs: Object.entries(p.specs).map(([k, v]) => `${k}: ${v}`).join("\n"),
};

export function ProductForm({ open, product, onSaved, onClose }: { open: boolean; product?: Product; onSaved: (p: Product, event: "created" | "updated" | "image") => void; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const { categories, brands } = useTaxonomy();
  const [f, setF] = useState(toText(product));
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  // Reset only when the dialog opens or a different product is chosen, so uploading a photo does not discard unsaved edits.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (open) { setF(toText(product)); setErr({}); } }, [open, product?.id]);
  useEffect(() => { const d = ref.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close(); }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr({});
    const colors = f.colors.split(",").map((s) => s.trim()).filter(Boolean).map((s) => { const i = s.lastIndexOf(":"); return { name: s.slice(0, i).trim(), hex: s.slice(i + 1).trim() }; });
    const specs = Object.fromEntries(f.specs.split("\n").map((l) => { const i = l.indexOf(":"); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; }).filter(([k, v]) => k && v));
    const payload = {
      name: f.name, sku: f.sku, brandSlug: f.brandSlug, categorySlug: f.categorySlug, description: f.description,
      price: Number(f.price), originalPrice: f.originalPrice ? Number(f.originalPrice) : null, stock: Number(f.stock),
      colors, storage: f.storage.split(",").map((s) => s.trim()).filter(Boolean), specs,
      images: product?.imagePaths ?? [], published: f.published, featured: f.featured, onSale: f.onSale,
    };
    setBusy(true);
    try {
      const r = await api<{ data: Product }>(product ? `/api/admin/products/${product.id}` : "/api/admin/products", { method: product ? "PATCH" : "POST", json: payload });
      onSaved(r.data, product ? "updated" : "created");
    } catch (ex) {
      if (ex instanceof ApiClientError) { setErr(ex.fields ?? {}); toast(ex.message, "error"); } else toast("Couldn’t save the product", "error");
    } finally { setBusy(false); }
  };

  const upload = async (file: File | undefined) => {
    if (!file || !product) return;
    const body = new FormData(); body.set("file", file);
    try { onSaved((await api<{ data: Product }>(`/api/admin/products/${product.id}/images`, { method: "POST", body })).data, "image"); toast("Image uploaded"); }
    catch (ex) { toast(ex instanceof ApiClientError ? ex.message : "Upload failed", "error"); }
  };
  const removeImage = async (path: string) => {
    if (!product) return;
    try { onSaved((await api<{ data: Product }>(`/api/admin/products/${product.id}/images?path=${encodeURIComponent(path)}`, { method: "DELETE" })).data, "image"); toast("Image removed"); }
    catch (ex) { toast(ex instanceof ApiClientError ? ex.message : "Couldn’t remove image", "error"); }
  };

  const t = (k: keyof typeof f, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div><label htmlFor={`pf-${k}`} className="mb-1 block text-sm font-semibold">{label}</label>
      <input id={`pf-${k}`} className="input" value={String(f[k])} aria-invalid={!!err[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} {...extra} />{err[k] && <p className="field-error">{err[k]}</p>}</div>
  );
  const select = (k: "brandSlug" | "categorySlug", label: string, opts: { slug: string; name: string }[]) => (
    <div><label htmlFor={`pf-${k}`} className="mb-1 block text-sm font-semibold">{label}</label>
      <select id={`pf-${k}`} className="input" value={f[k]} aria-invalid={!!err[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })}><option value="">Choose…</option>{opts.map((o) => <option key={o.slug} value={o.slug}>{o.name}</option>)}</select>{err[k] && <p className="field-error">{err[k]}</p>}</div>
  );

  return (
    <dialog ref={ref} onClose={onClose} className="m-auto max-h-[92vh] w-[min(94vw,42rem)] overflow-y-auto rounded-2xl p-6 backdrop:bg-ink/50">
      <h2 className="text-xl font-bold">{product ? "Edit product" : "Add product"}</h2>
      <form onSubmit={submit} noValidate className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">{t("name", "Name")}{t("sku", "SKU")}{select("brandSlug", "Brand", brands)}{select("categorySlug", "Category", categories)}
          {t("price", "Price (PKR)", { type: "number", min: 1 })}{t("originalPrice", "Original price (optional)", { type: "number", min: 0 })}{t("stock", "Stock", { type: "number", min: 0 })}</div>
        <div><label htmlFor="pf-d" className="mb-1 block text-sm font-semibold">Description</label><textarea id="pf-d" className="input" value={f.description} aria-invalid={!!err.description} onChange={(e) => setF({ ...f, description: e.target.value })} />{err.description && <p className="field-error">{err.description}</p>}</div>
        {t("colors", "Colors (Name:#hex, comma separated)")}{t("storage", "Storage options (comma separated)")}
        <div><label htmlFor="pf-s" className="mb-1 block text-sm font-semibold">Specifications (one “Label: value” per line)</label><textarea id="pf-s" className="input" value={f.specs} onChange={(e) => setF({ ...f, specs: e.target.value })} /></div>
        <div className="flex flex-wrap gap-6 text-sm font-semibold">
          {(["published", "featured", "onSale"] as const).map((k) => <label key={k} className="flex min-h-9 items-center gap-2"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} /> {k === "published" ? "Visible in store" : k === "featured" ? "Featured" : "On sale"}</label>)}
        </div>
        <fieldset className="rounded-xl border border-line p-4"><legend className="px-1 text-sm font-semibold">Images</legend>
          {!product ? <p className="text-sm text-muted">Save the product first, then add photos here.</p> : <>
            <div className="flex flex-wrap gap-3">{product.imagePaths.map((path, i) => (
              <div key={path} className="relative h-24 w-20 overflow-hidden rounded-lg bg-paper">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin preview of Storage URLs */}
                <img src={product.images[i]} alt={`${product.name} photo ${i + 1}`} className="h-full w-full object-contain" />
                <button type="button" aria-label={`Remove photo ${i + 1}`} onClick={() => removeImage(path)} className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-sale shadow"><Trash2 size={14} /></button>
              </div>))}
              <label className="grid h-24 w-20 cursor-pointer place-items-center rounded-lg border-2 border-dashed border-line text-muted hover:border-ink"><ImagePlus size={20} /><span className="sr-only">Upload image</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ""; }} /></label>
            </div><p className="mt-2 text-xs text-muted">JPEG, PNG, WebP or AVIF, up to 5 MB each. The first image is the main photo.</p></>}
        </fieldset>
        <div className="flex justify-end gap-2 pt-2"><button type="button" className="btn btn-outline" onClick={onClose}>Close</button><button className="btn btn-primary" disabled={busy}>{busy ? "Saving…" : "Save product"}</button></div>
      </form>
    </dialog>
  );
}
