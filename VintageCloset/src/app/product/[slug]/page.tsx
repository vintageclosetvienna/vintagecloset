import { getProduct, getProducts } from '@/lib/data';
import { ProductGallery } from '@/components/shop/ProductGallery';
import { ProductInfo } from '@/components/shop/ProductInfo';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { Reveal } from '@/components/shared/Reveal';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from '@phosphor-icons/react/dist/ssr';

// Generate static params from database
export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({
    slug: product.slug,
  }));
}

// Make the page dynamic to fetch real data
export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Fetch product from database (falls back to mock data if Supabase not configured)
  const product = await getProduct(slug);

  if (!product) {
    return notFound();
  }

  // Check if product is sold
  if (product.isSold) {
    return (
      <div className="min-h-screen pb-24 bg-surface">
        <div className="container mx-auto px-4 pt-8 md:pt-16">
          <Link 
            href={`/${product.gender}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-accent-start transition-colors mb-8 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to {product.gender.charAt(0).toUpperCase() + product.gender.slice(1)}
          </Link>
          
          <div className="max-w-lg mx-auto text-center py-16">
            <h1 className="text-2xl font-display font-bold text-ink mb-4">This item has been sold</h1>
            <p className="text-muted mb-8">
              Unfortunately, <strong>{product.title}</strong> is no longer available. 
              Check out similar items below.
            </p>
            <Link 
              href={`/${product.gender}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-white rounded-lg font-medium hover:bg-ink/90 transition-colors"
            >
              Browse Collection
            </Link>
          </div>

          {/* Related Items */}
          <div className="border-t border-hairline pt-16">
            <Reveal>
              <h2 className="font-display font-bold text-2xl md:text-3xl mb-8 text-center">Similar items</h2>
              <ProductGrid filter={product.gender} />
            </Reveal>
          </div>
        </div>
      </div>
    );
  }

  // Determine the collection path based on gender
  const collectionPath = `/${product.gender}`;
  const collectionName = product.gender.charAt(0).toUpperCase() + product.gender.slice(1);

  return (
    <div className="min-h-screen pb-24 bg-surface">
      <div className="container mx-auto px-4 pt-8 md:pt-16">
        
        {/* Back Button */}
        <Link 
          href={collectionPath}
          className="inline-flex items-center gap-2 text-sm font-medium text-muted hover:text-accent-start transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to {collectionName}
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 mb-24">
           <div className="lg:col-span-7">
              <ProductGallery images={product.images || [product.image]} />
           </div>
           <div className="lg:col-span-5 lg:sticky lg:top-24 h-fit">
              <ProductInfo product={product} />
           </div>
        </div>

        {/* Related Items */}
        <div className="border-t border-hairline pt-16">
          <Reveal>
             <h2 className="font-display font-bold text-2xl md:text-3xl mb-8 text-center lg:text-left">You might also like</h2>
             <ProductGrid filter={product.gender} />
          </Reveal>
        </div>

      </div>
    </div>
  );
}
