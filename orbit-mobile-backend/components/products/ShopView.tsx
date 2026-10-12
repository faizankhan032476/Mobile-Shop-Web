"use client";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, SearchX } from "lucide-react";
import { useProducts, useTaxonomy } from "@/lib/hooks";
import { formatPKR } from "@/lib/format";
import { ProductCard } from "./ProductCard";

const PAGE = 8;
const SORTS = [["popular", "Most popular"], ["newest", "Newest"], ["price-asc", "Price: low to high"], ["price-desc", "Price: high to low"], ["rating", "Top rated"]] as const;

export function ShopView({ title = "All smartphones" }: { title?: string }) {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const { products, status, error } = useProducts();
  const { categories, brands } = useTaxonomy();
  const [showFilters, setShowFilters] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const q = sp.get("q") ?? "";
  const categorySlug = sp.get("category") ?? "";
  const brandSlug = sp.get("brand") ?? "";
  const category = categories.find((c) => c.slug === categorySlug)?.name ?? (categorySlug && categories.length ? "\u0000" : "");
  const brand = brands.find((b) => b.slug === brandSlug)?.name ?? (brandSlug && brands.length ? "\u0000" : "");
  const sale = sp.get("sale") === "1";
  const inStock = sp.get("stock") === "1";
  const sort = sp.get("sort") ?? "popular";
  const max = Math.max(...products.map((p) => p.price), 100000);
  const maxPrice = Number(sp.get("max")) || max;

  const set = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    router.replace(`${path}?${next.toString()}`, { scroll: false });
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect -- reset pagination when filters change
  useEffect(() => setLimit(PAGE), [q, category, brand, sale, inStock, sort, maxPrice]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = products.filter((p) =>
      (!needle || `${p.name} ${p.brand}`.toLowerCase().includes(needle)) &&
      (!category || p.category === category) && (!brand || p.brand === brand) &&
      (!sale || (p.originalPrice ?? 0) > p.price) && (!inStock || p.stock > 0) && p.price <= maxPrice);
    const by: Record<string, (a: typeof out[0], b: typeof out[0]) => number> = {
      popular: (a, b) => b.popularity - a.popularity, newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
      "price-asc": (a, b) => a.price - b.price, "price-desc": (a, b) => b.price - a.price, rating: (a, b) => b.rating - a.rating,
    };
    return out.sort(by[sort] ?? by.popular);
  }, [products, q, category, brand, sale, inStock, sort, maxPrice]);

  const active = [q, categorySlug, brandSlug, sale && "s", inStock && "i", sp.get("max")].filter(Boolean).length;
  const filters = (
    <div className="space-y-6">
      <fieldset><legend className="mb-2 text-sm font-bold">Category</legend>
        {categories.map((c) => <label key={c.slug} className="flex min-h-9 items-center gap-2 text-sm"><input type="radio" name="cat" checked={categorySlug === c.slug} onChange={() => set({ category: c.slug })} /> {c.name}</label>)}
      </fieldset>
      <fieldset><legend className="mb-2 text-sm font-bold">Brand</legend>
        {brands.map((b) => <label key={b.slug} className="flex min-h-9 items-center gap-2 text-sm"><input type="radio" name="brand" checked={brandSlug === b.slug} onChange={() => set({ brand: b.slug })} /> {b.name}</label>)}
      </fieldset>
      <div><label htmlFor="price" className="mb-2 block text-sm font-bold">Max price: {formatPKR(maxPrice)}</label>
        <input id="price" type="range" min={20000} max={max} step={5000} value={maxPrice} onChange={(e) => set({ max: Number(e.target.value) >= max ? null : e.target.value })} className="w-full accent-brand" /></div>
      <label className="flex min-h-9 items-center gap-2 text-sm"><input type="checkbox" checked={inStock} onChange={(e) => set({ stock: e.target.checked ? "1" : null })} /> In stock only</label>
      <label className="flex min-h-9 items-center gap-2 text-sm"><input type="checkbox" checked={sale} onChange={(e) => set({ sale: e.target.checked ? "1" : null })} /> On sale</label>
      <button className="btn btn-outline w-full" disabled={active === 0} onClick={() => router.replace(path)}>Clear all filters</button>
    </div>
  );

  return (
    <div className="container-x py-8">
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted"><Link href="/" className="hover:text-ink">Home</Link> / <span className="text-ink">Shop</span></nav>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="text-3xl font-bold sm:text-4xl">{q ? `Results for “${q}”` : title}</h1><p className="mt-1 text-sm text-muted" aria-live="polite">{list.length} {list.length === 1 ? "phone" : "phones"}</p></div>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline lg:hidden" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}><SlidersHorizontal size={16} /> Filters{active > 0 && ` (${active})`}</button>
          <label className="sr-only" htmlFor="sort">Sort by</label>
          <select id="sort" value={sort} onChange={(e) => set({ sort: e.target.value })} className="input !w-auto">{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside aria-label="Filters" className={`${showFilters ? "block" : "hidden"} card p-5 lg:block lg:self-start`}>{filters}</aside>
        <div>
          {status === "loading" || status === "idle" ? <p className="card px-6 py-16 text-center text-muted" aria-live="polite">Loading phones…</p> : status === "error" ? <p role="alert" className="card px-6 py-16 text-center text-sale">{error}</p> : list.length === 0 ? (
            <div className="card grid place-items-center gap-3 px-6 py-16 text-center">
              <SearchX size={36} className="text-muted" />
              <h2 className="text-xl font-bold">{products.length === 0 ? "The catalog is empty" : "No phones match these filters"}</h2>
              <p className="max-w-sm text-sm text-muted">{products.length === 0 ? "Add products from the admin panel." : "Try a different search, raise the price limit, or clear your filters."}</p>
              {active > 0 && <button className="btn btn-primary" onClick={() => router.replace(path)}>Clear all filters</button>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 xl:grid-cols-3">{list.slice(0, limit).map((p) => <ProductCard key={p.id} product={p} />)}</div>
              {limit < list.length && <div className="mt-8 text-center"><button className="btn btn-outline" onClick={() => setLimit(limit + PAGE)}>Show more ({list.length - limit} left)</button></div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
