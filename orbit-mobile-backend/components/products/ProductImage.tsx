"use client";
import { useState } from "react";
import { PhoneArt, type PhoneView } from "@/components/ui/PhoneArt";
import type { Product } from "@/types";

/** Uses the product's image URL when present; falls back to generated artwork if missing or broken. */
export function ProductImage({ product, color, view = "front", className = "" }: { product: Pick<Product, "name" | "imageUrl" | "colors">; color?: string; view?: PhoneView; className?: string }) {
  const [failed, setFailed] = useState(false);
  const hex = product.colors.find((c) => c.name === color)?.hex ?? product.colors[0]?.hex;
  if (product.imageUrl && !failed && view === "front") {
    // eslint-disable-next-line @next/next/no-img-element -- admin-supplied arbitrary URLs
    return <img src={product.imageUrl} alt={product.name} loading="lazy" onError={() => setFailed(true)} className={`object-contain ${className}`} />;
  }
  return <PhoneArt color={hex} view={view} label={`${product.name}, ${view} view`} className={className} />;
}
