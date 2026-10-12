export type Category = "Flagship" | "Mid-range" | "Budget" | "Foldable";

export interface ColorOption { name: string; hex: string }

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: Category;
  price: number; // PKR, current selling price
  originalPrice?: number; // PKR, shown struck-through when higher than price
  stock: number;
  rating: number; // demo rating 0-5
  reviewCount: number; // demo
  popularity: number; // demo "units sold" used for sorting only
  createdAt: string; // ISO date
  featured: boolean;
  onSale: boolean;
  colors: ColorOption[];
  storage: string[];
  description: string;
  specs: Record<string, string>;
  imageUrl?: string; // optional; falls back to generated artwork
}

export interface CartLine {
  productId: string;
  color: string;
  storage: string;
  qty: number;
}

export type OrderStatus = "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";
export type PaymentMethod = "Cash on Delivery" | "Bank Transfer (demo)" | "Card (demo, not processed)";

export interface OrderItem {
  productId: string;
  name: string;
  color: string;
  storage: string;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  number: string;
  createdAt: string;
  status: OrderStatus;
  customer: { name: string; email: string; phone: string };
  shipping: { address: string; city: string; postalCode: string };
  payment: PaymentMethod;
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  simulated: true;
}
