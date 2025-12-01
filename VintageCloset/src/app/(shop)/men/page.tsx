import { CollectionLayout } from "@/components/shop/CollectionLayout";
import { ProductGrid } from "@/components/shop/ProductGrid";

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
