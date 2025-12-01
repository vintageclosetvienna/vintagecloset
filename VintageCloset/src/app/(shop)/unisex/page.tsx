import { CollectionLayout } from "@/components/shop/CollectionLayout";
import { ProductGrid } from "@/components/shop/ProductGrid";

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
