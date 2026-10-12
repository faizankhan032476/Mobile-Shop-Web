import { Suspense } from "react";
import { ShopView } from "@/components/products/ShopView";
export const metadata = { title: "Shop smartphones" };
export default function ShopPage() { return <Suspense fallback={<div className="container-x py-16 text-muted">Loading phones…</div>}><ShopView /></Suspense>; }
