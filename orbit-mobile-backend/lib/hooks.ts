"use client";
import { useCallback } from "react";
import { useLocalState } from "./local-store";
import { api } from "./api-client";
import { createResource, fetchAllPages } from "./resource";
import type { CartLine, Me, Product, Taxonomy } from "@/types";
import { toast } from "./toast";

/* ---------- server data (cached, shared) ---------- */
const catalog = createResource(() => fetchAllPages<Product>("/api/products?sort=popular"), [] as Product[]);
const adminCatalog = createResource(() => fetchAllPages<Product>("/api/products?sort=newest&includeUnpublished=1"), [] as Product[]);
const categories = createResource(async () => (await api<{ data: Taxonomy[] }>("/api/categories")).data, [] as Taxonomy[]);
const brands = createResource(async () => (await api<{ data: Taxonomy[] }>("/api/brands")).data, [] as Taxonomy[]);
const me = createResource(async () => (await api<{ data: Me | null }>("/api/me").catch(() => ({ data: null }))).data, null as Me | null);

export const useProducts = () => { const r = catalog.useResource(); return { products: r.data, status: r.status, error: r.error, reload: r.reload }; };
export const useAdminProducts = () => { const r = adminCatalog.useResource(); return { products: r.data, status: r.status, error: r.error, reload: r.reload }; };
export const useTaxonomy = () => { const c = categories.useResource(); const b = brands.useResource(); return { categories: c.data, brands: b.data }; };
export const useMe = () => { const r = me.useResource(); return { me: r.data, status: r.status }; };
export const refreshMe = () => me.refresh();
/** Call after any admin change so both the admin tables and the storefront show fresh database data. */
export const refreshCatalogs = () => Promise.all([catalog.refresh(), adminCatalog.refresh()]);

/* ---------- cart & wishlist: browser-side convenience only; the server re-validates everything at checkout ---------- */
const EMPTY_CART: CartLine[] = [];
const EMPTY_IDS: string[] = [];
export const KEYS = { cart: "orbit.cart.v2", wishlist: "orbit.wishlist.v2" } as const;
const same = (a: CartLine, b: CartLine) => a.productId === b.productId && a.color === b.color && a.storage === b.storage;

export function useCart() {
  const [lines, setLines] = useLocalState<CartLine[]>(KEYS.cart, EMPTY_CART);
  const { products } = useProducts();
  const add = useCallback((l: CartLine) => {
    const p = products.find((x) => x.id === l.productId);
    if (!p || p.stock < 1) { toast("This phone is out of stock", "error"); return false; }
    setLines((prev) => {
      const i = prev.findIndex((x) => same(x, l));
      if (i === -1) return [...prev, { ...l, qty: Math.min(l.qty, p.stock, 10) }];
      return prev.map((x, k) => (k === i ? { ...x, qty: Math.min(x.qty + l.qty, p.stock, 10) } : x));
    });
    return true;
  }, [products, setLines]);
  const setQty = useCallback((l: CartLine, qty: number) => setLines((prev) => prev.map((x) => (same(x, l) ? { ...x, qty } : x))), [setLines]);
  const remove = useCallback((l: CartLine) => setLines((prev) => prev.filter((x) => !same(x, l))), [setLines]);
  const clear = useCallback(() => setLines(EMPTY_CART), [setLines]);
  return { lines, add, setQty, remove, clear, count: lines.reduce((s, l) => s + l.qty, 0) };
}

export function useWishlist() {
  const [ids, setIds] = useLocalState<string[]>(KEYS.wishlist, EMPTY_IDS);
  const toggle = useCallback((id: string) => {
    const has = ids.includes(id);
    setIds(has ? ids.filter((x) => x !== id) : [...ids, id]);
    toast(has ? "Removed from wishlist" : "Saved to wishlist", "info");
  }, [ids, setIds]);
  return { ids, toggle, has: (id: string) => ids.includes(id) };
}
