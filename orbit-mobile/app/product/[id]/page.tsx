"use client";
import { useParams } from "next/navigation";
import { ProductDetail } from "@/components/products/ProductDetail";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  return <ProductDetail id={id} />;
}
