'use client';

import { useEffect, useState, useMemo } from 'react';
import { ProductCard } from '@/components/shop/ProductCard';
import { Product, getProducts, getProductsByGender, getPriceAsNumber } from '@/lib/data';

interface ProductGridProps {
  filter?: 'men' | 'women' | 'unisex';
  filters?: Record<string, string[]>;
}

// Helper function to check if price matches a range
function matchPriceRange(price: number, range: string): boolean {
  switch (range) {
    case 'Under €50':
      return price < 50;
    case '€50 – €100':
      return price >= 50 && price <= 100;
    case '€100 – €200':
      return price > 100 && price <= 200;
    case '€200+':
      return price > 200;
    default:
      return true;
  }
}

export function ProductGrid({ filter, filters }: ProductGridProps) {
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

  // Apply filters to products
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by category (skip "All")
    if (filters?.category?.length && !filters.category.includes('All')) {
      result = result.filter(p => 
        filters.category.some(cat => 
          p.category.toLowerCase() === cat.toLowerCase()
        )
      );
    }

    // Filter by size
    if (filters?.size?.length) {
      result = result.filter(p => 
        filters.size.some(size => 
          p.size.toUpperCase() === size.toUpperCase()
        )
      );
    }

    // Filter by price
    if (filters?.price?.length) {
      result = result.filter(p => {
        const price = getPriceAsNumber(p.price);
        return filters.price.some(range => matchPriceRange(price, range));
      });
    }

    return result;
  }, [products, filters]);

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

  if (filteredProducts.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted text-lg">No products match your filters.</p>
        <p className="text-sm text-muted mt-2">Try adjusting your filter selections.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 auto-rows-fr">
      {filteredProducts.map((product, idx) => (
        <ProductCard key={product.id} product={product} priority={idx < 4} />
      ))}
    </div>
  );
}
