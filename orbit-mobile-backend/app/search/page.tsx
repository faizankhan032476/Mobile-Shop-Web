import { Suspense } from "react";
import { ShopView } from "@/components/products/ShopView";
export const metadata = { title: "Search" };
export default function SearchPage() { return <Suspense fallback={<div className="container-x py-16 text-muted">Searching…</div>}><ShopView title="Search" /></Suspense>; }
