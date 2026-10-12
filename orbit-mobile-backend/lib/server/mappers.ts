import "server-only";
import type { Order, Product } from "@/types";
import { SUPABASE_URL } from "@/lib/supabase/env";

export const PRODUCT_SELECT = "*, brand:brands(slug,name), category:categories(slug,name)";
const imageUrl = (p: string) => (/^https?:\/\//.test(p) ? p : `${SUPABASE_URL}/storage/v1/object/public/product-images/${p}`);

/* eslint-disable @typescript-eslint/no-explicit-any -- rows come from PostgREST joins */
export function toProduct(r: any): Product {
  const images = ((r.images ?? []) as string[]).map(imageUrl);
  return {
    id: r.id, slug: r.slug, sku: r.sku, name: r.name, brand: r.brand?.name ?? "", category: r.category?.name ?? "",
    price: r.price, originalPrice: r.compare_at_price ?? undefined, stock: r.stock, rating: Number(r.rating), reviewCount: r.review_count,
    popularity: r.popularity, createdAt: r.created_at, featured: r.is_featured, onSale: r.is_on_sale, published: r.is_published,
    colors: r.colors, storage: r.storage_options, description: r.description, specs: r.specs, images, imagePaths: r.images ?? [], imageUrl: images[0],
  };
}

export function toOrder(r: any): Order {
  const items = (r.items ?? r.order_items ?? []) as any[];
  return {
    id: r.id, number: r.order_number, createdAt: r.created_at, status: r.status, paymentStatus: r.payment_status, paymentMethod: r.payment_method,
    customer: { name: r.customer_name, email: r.customer_email, phone: r.customer_phone },
    shipping: { address: r.shipping_address?.address ?? "", city: r.shipping_address?.city ?? "", postalCode: r.shipping_address?.postal_code ?? null },
    items: items.map((i) => ({ productId: i.product_id, name: i.product_name, sku: i.sku, color: i.color, storage: i.storage, qty: i.quantity, unitPrice: i.unit_price })),
    subtotal: r.subtotal, shippingCost: r.shipping_cost, discount: r.discount_amount, discountCode: r.discount_code, total: r.total,
  };
}

/** Strips characters that have meaning inside PostgREST filter strings. */
export const safeTerm = (s: string) => s.replace(/[,()%*\\"':]/g, " ").trim().slice(0, 60);
