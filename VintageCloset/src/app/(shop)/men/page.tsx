import type { Metadata } from "next";
import { CollectionLayout } from "@/components/shop/CollectionLayout";
import { ProductGrid } from "@/components/shop/ProductGrid";

export const metadata: Metadata = {
  title: "Men's Vintage Clothing",
  description: "Vintage for men in Vienna: 90s streetwear, jackets, knitwear and denim. Shop online or in our stores in 1090 and 1020 Wien.",
  alternates: { canonical: "/men" },
};

export default function MenPage() {
  return (
    <CollectionLayout
      title="Men"
      description="Timeless sportswear, rugged workwear, and the finest leather jackets from decades past."
      gender="men"
    >
      <ProductGrid filter="men" />
    </CollectionLayout>
  );
}
