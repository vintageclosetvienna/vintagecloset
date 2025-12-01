'use client';

import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/shop/ProductCard';
import { Product, getProducts, getProductsByGender } from '@/lib/data';

export function ProductGrid({ filter }: { filter?: 'men' | 'women' | 'unisex' }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      
      try {
        let fetchedProducts: Product[];
        
        if (filter) {
          fetchedProducts = await getProductsByGender(filter);
          // Also include unisex products for men/women pages
          if (filter !== 'unisex') {
            const unisexProducts = await getProductsByGender('unisex');
            fetchedProducts = [...fetchedProducts, ...unisexProducts];
          }
        } else {
          fetchedProducts = await getProducts();
        }
        
        // Filter out sold products
        fetchedProducts = fetchedProducts.filter(p => !p.isSold);
        
        setProducts(fetchedProducts);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      }
      
      setIsLoading(false);
    }

    fetchProducts();
  }, [filter]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
        {[...Array(8)].map((_, idx) => (
          <div key={idx} className="animate-pulse">
            <div className="bg-gray-200 rounded-2xl h-[280px] mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted text-lg">No products available at the moment.</p>
        <p className="text-sm text-muted mt-2">Check back soon for new arrivals!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 auto-rows-fr">
      {products.map((product, idx) => (
        <ProductCard key={product.id} product={product} priority={idx < 4} />
      ))}
    </div>
  );
}
