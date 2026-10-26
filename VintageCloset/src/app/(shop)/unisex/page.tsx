import type { Metadata } from "next";
import { CollectionLayout } from "@/components/shop/CollectionLayout";
import { ProductGrid } from "@/components/shop/ProductGrid";

export const metadata: Metadata = {
  title: "Unisex Vintage",
  description: "Unisex vintage pieces from the Vienna archive: streetwear, outerwear and accessories for everyone.",
  alternates: { canonical: "/unisex" },
};

export default function UnisexPage() {
  return (
    <CollectionLayout
      title="Unisex"
      description="Fluid silhouettes and neutral tones. Vintage has no gender."
      gender="unisex"
    >
      <ProductGrid filter="unisex" />
    </CollectionLayout>
  );
}
