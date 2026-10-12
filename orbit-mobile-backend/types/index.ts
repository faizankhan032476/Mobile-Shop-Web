export interface ColorOption { name: string; hex: string }

export interface Product {
  id: string;            // database UUID (used by cart and orders)
  slug: string;          // used in URLs
  sku: string;
  name: string;
  brand: string;
  category: string;
  price: number;         // PKR
  originalPrice?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  popularity: number;
  createdAt: string;
  featured: boolean;
  onSale: boolean;
  published: boolean;
  colors: ColorOption[];
  storage: string[];
  description: string;
  specs: Record<string, string>;
  images: string[];      // absolute URLs for display
  imagePaths: string[];  // raw stored paths/URLs (what the admin API expects back)
  imageUrl?: string;     // first image, if any
}

export interface Taxonomy { slug: string; name: string; blurb?: string }

export interface CartLine { productId: string; color: string; storage: string; qty: number }

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed";

export interface OrderItem { productId: string | null; name: string; sku: string; color: string; storage: string; qty: number; unitPrice: number }

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  customer: { name: string; email: string; phone: string };
  shipping: { address: string; city: string; postalCode: string | null };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  discountCode: string | null;
  total: number;
}

export interface Me { id: string; email: string; fullName: string; phone: string | null; role: "customer" | "admin" }
