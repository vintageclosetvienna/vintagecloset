import { cache } from 'react';
import type { Metadata } from 'next';
import { getProduct as fetchProduct, getProducts, getDiscountedPrice, getPriceAsNumber, type Product } from '@/lib/data';
import { SITE_URL, SITE_NAME } from '@/lib/site';
import { ProductGallery } from '@/components/shop/ProductGallery';
import { ProductInfo } from '@/components/shop/ProductInfo';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ProductTurnCard } from '@/components/shop/ProductTurnCard';
import { turnViews } from '@/lib/turn-views';
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

// One database read per request, shared by the page and its metadata
const getProduct = cache(fetchProduct);

function shortText(text: string | undefined, max: number): string {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : clean;
}

// Title, description and share preview (photo) for search results and social links
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Item not found', robots: { index: false } };

  const facts = [product.era, product.size && `Size ${product.size}`, getDiscountedPrice(product.price, product.discount)].filter(Boolean).join(' · ');
  const description = shortText(`${facts}. ${product.description || `Vintage ${product.category} from the Vienna archive.`}`, 155);
  const images = (product.images.length ? product.images : [product.image]).filter(Boolean).slice(0, 4);

  return {
    title: product.isSold ? `${product.title} (sold)` : product.title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { type: 'website', title: product.title, description, url: `/product/${product.slug}`, images },
    twitter: { card: 'summary_large_image', title: product.title, description, images },
  };
}

// Product data for Google (price, availability, photos) plus the breadcrumb Home › Collection › Item
function productJsonLd(product: Product) {
  const url = `${SITE_URL}/product/${product.slug}`;
  const collection = product.gender.charAt(0).toUpperCase() + product.gender.slice(1);
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.description || undefined,
      image: product.images.length ? product.images : [product.image],
      sku: product.id,
      category: product.category,
      size: product.size || undefined,
      url,
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'EUR',
        price: getPriceAsNumber(getDiscountedPrice(product.price, product.discount)).toFixed(2),
        availability: product.isSold ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/UsedCondition',
        seller: { '@type': 'Organization', name: SITE_NAME },
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: collection, item: `${SITE_URL}/${product.gender}` },
        { '@type': 'ListItem', position: 3, name: product.title, item: url },
      ],
    },
  ];
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  // Fetch product from database (falls back to mock data if Supabase not configured)
  const product = await getProduct(slug);

  if (!product) {
    return notFound();
  }

  const jsonLd = (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product)).replace(/</g, '\\u003c') }} />
  );

  // Check if product is sold
  if (product.isSold) {
    return (
      <div className="min-h-screen pb-24 bg-surface">
        {jsonLd}
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
  // the turn card (front → side → back) for pieces sent from the shop's app; on phones it follows the price, on a wide screen it sits under the photos
  const turn = turnViews(product.images);

  return (
    <div className="min-h-screen pb-24 bg-surface">
      {jsonLd}
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
           <div className={`lg:col-span-5 lg:sticky lg:top-24 h-fit ${turn.length >= 2 ? 'lg:row-span-2' : ''}`}>
              <ProductInfo product={product} />
           </div>
           {turn.length >= 2 && (
              <div className="lg:col-span-7">
                 <ProductTurnCard views={turn} title={product.title} />
              </div>
           )}
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
