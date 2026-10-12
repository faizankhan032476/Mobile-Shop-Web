"use client";
import Link from "next/link";
import type { Product } from "@/types";
import { ProductCard } from "./ProductCard";

export function Rail({ title, href, items }: { title: string; href: string; items: Product[] }) {
  if (items.length === 0) return null;
  return (
    <section className="container-x mt-16" aria-labelledby={`r-${title}`}>
      <div className="mb-5 flex items-end justify-between">
        <h2 id={`r-${title}`} className="text-2xl font-bold sm:text-3xl">{title}</h2>
        <Link href={href} className="text-sm font-semibold text-brand hover:underline">View all</Link>
      </div>
      <div className="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2 lg:grid-cols-4">
        {items.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
