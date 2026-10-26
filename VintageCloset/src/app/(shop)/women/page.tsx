import type { Metadata } from "next";
import { CollectionLayout } from "@/components/shop/CollectionLayout";
import { ProductGrid } from "@/components/shop/ProductGrid";

export const metadata: Metadata = {
  title: "Women's Vintage Clothing",
  description: "Vintage for women in Vienna: 90s dresses, oversized blazers, classic denim and luxury pieces. Shop online or in our stores in 1090 and 1020 Wien.",
  alternates: { canonical: "/women" },
};

export default function WomenPage() {
  return (
    <CollectionLayout
      title="Women"
      description="Handpicked vintage essentials. From 90s floral dresses to oversized blazers and classic denim."
      gender="women"
    >
      <ProductGrid filter="women" />
    </CollectionLayout>
  );
}
