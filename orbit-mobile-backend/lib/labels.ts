import type { OrderStatus, PaymentStatus } from "@/types";
export const STATUS_LABEL: Record<OrderStatus, string> = { pending: "Pending", confirmed: "Confirmed", shipped: "Shipped", delivered: "Delivered", cancelled: "Cancelled" };
export const PAYMENT_LABEL: Record<PaymentStatus, string> = { unpaid: "Unpaid", paid: "Paid", refunded: "Refunded", failed: "Failed" };
export const ORDER_STATUSES = Object.keys(STATUS_LABEL) as OrderStatus[];
