import type { CartLine, Product } from "@/types";

export const FREE_SHIPPING_THRESHOLD = 150_000;
export const SHIPPING_FLAT = 500;
export const COUPONS: Record<string, number> = { ORBIT5: 0.05, WELCOME2: 0.02 }; // demo codes

export interface PricedLine extends CartLine { product: Product; lineTotal: number }

/** Joins cart lines to current product data; drops lines whose product was deleted. */
export function priceLines(lines: CartLine[], products: Product[]): PricedLine[] {
  return lines.flatMap((l) => {
    const product = products.find((p) => p.id === l.productId);
    if (!product) return [];
    const qty = Math.max(1, Math.min(l.qty, product.stock));
    return product.stock > 0 ? [{ ...l, qty, product, lineTotal: product.price * qty }] : [];
  });
}

export function totals(lines: PricedLine[], coupon?: string) {
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const rate = coupon ? COUPONS[coupon.trim().toUpperCase()] ?? 0 : 0;
  const discount = Math.round(subtotal * rate);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping, rate };
}
