import type { CartLine, Product } from "@/types";

export interface PricedLine extends CartLine { product: Product; lineTotal: number }

/** Joins cart lines to current catalog data for DISPLAY. Prices that count (totals) come from the server's /api/quote. */
export function priceLines(lines: CartLine[], products: Product[]): PricedLine[] {
  return lines.flatMap((l) => {
    const product = products.find((p) => p.id === l.productId);
    if (!product || product.stock < 1) return [];
    const qty = Math.max(1, Math.min(l.qty, product.stock, 10));
    return [{ ...l, qty, product, lineTotal: product.price * qty }];
  });
}
