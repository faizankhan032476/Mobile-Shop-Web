"use client";
import { useCallback } from "react";
import { useLocalState } from "./local-store";
import { SEED_ORDERS, SEED_PRODUCTS } from "@/data/products";
import type { CartLine, Order, Product } from "@/types";
import { toast } from "./toast";

const EMPTY_CART: CartLine[] = [];
const EMPTY_IDS: string[] = [];

export const KEYS = { products: "orbit.products.v1", orders: "orbit.orders.v1", cart: "orbit.cart.v1", wishlist: "orbit.wishlist.v1", admin: "orbit.admin-demo.v1" } as const;

export function useProducts() {
  const [products, setProducts] = useLocalState<Product[]>(KEYS.products, SEED_PRODUCTS);
  const save = useCallback((p: Product) => setProducts((prev) => (prev.some((x) => x.id === p.id) ? prev.map((x) => (x.id === p.id ? p : x)) : [p, ...prev])), [setProducts]);
  const remove = useCallback((id: string) => setProducts((prev) => prev.filter((x) => x.id !== id)), [setProducts]);
  const reset = useCallback(() => setProducts(SEED_PRODUCTS), [setProducts]);
  return { products, save, remove, reset };
}

export function useOrders() {
  const [orders, setOrders] = useLocalState<Order[]>(KEYS.orders, SEED_ORDERS);
  const add = useCallback((o: Order) => setOrders((prev) => [o, ...prev]), [setOrders]);
  const setStatus = useCallback((id: string, status: Order["status"]) => setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o))), [setOrders]);
  return { orders, add, setStatus };
}

export function useCart() {
  const [lines, setLines] = useLocalState<CartLine[]>(KEYS.cart, EMPTY_CART);
  const { products } = useProducts();
  const add = useCallback((l: CartLine) => {
    const p = products.find((x) => x.id === l.productId);
    if (!p || p.stock < 1) { toast("This phone is out of stock", "error"); return false; }
    setLines((prev) => {
      const i = prev.findIndex((x) => x.productId === l.productId && x.color === l.color && x.storage === l.storage);
      if (i === -1) return [...prev, { ...l, qty: Math.min(l.qty, p.stock) }];
      return prev.map((x, k) => (k === i ? { ...x, qty: Math.min(x.qty + l.qty, p.stock) } : x));
    });
    return true;
  }, [products, setLines]);
  const setQty = useCallback((l: CartLine, qty: number) => setLines((prev) => prev.map((x) => (x.productId === l.productId && x.color === l.color && x.storage === l.storage ? { ...x, qty } : x))), [setLines]);
  const remove = useCallback((l: CartLine) => setLines((prev) => prev.filter((x) => !(x.productId === l.productId && x.color === l.color && x.storage === l.storage))), [setLines]);
  const clear = useCallback(() => setLines(EMPTY_CART), [setLines]);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  return { lines, add, setQty, remove, clear, count };
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
