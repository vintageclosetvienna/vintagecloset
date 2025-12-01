import { CollectionLayout } from "@/components/shop/CollectionLayout";
import { ProductGrid } from "@/components/shop/ProductGrid";

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
