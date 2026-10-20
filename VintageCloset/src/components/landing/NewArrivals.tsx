'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useSpring } from 'framer-motion';
import Link from 'next/link';
import { Plus, Check, ArrowRight } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { useCart } from '@/lib/cart';
import { SafeImage } from '@/components/ui/SafeImage';
import { Reveal } from '@/components/shared/Reveal';
import { Product, getProducts, getDiscountedPrice } from '@/lib/data';
import { getMediaCarouselImages } from '@/lib/site-images';

// Campaign shots between the products; the media carousel images replace these once uploaded
const FALLBACK_CAMPAIGN_IMAGES = [
  'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=2070&auto=format&fit=crop',
];

type Tile =
  | { kind: 'campaign'; image: string; span: 2 | 3 }
  | { kind: 'product'; product: Product };

// Repeating rows of four columns, like the reference:
// row A = wide campaign shot (3) + product, row B = product + product + campaign shot (2)
function buildTiles(products: Product[], campaign: string[]): Tile[] {
  const tiles: Tile[] = [];
  let p = 0;
  let c = 0;
  const nextCampaign = () => campaign[c++ % campaign.length];

  while (p < products.length) {
    tiles.push({ kind: 'campaign', image: nextCampaign(), span: 3 });
    tiles.push({ kind: 'product', product: products[p++] });
    if (p >= products.length) break;
    tiles.push({ kind: 'product', product: products[p++] });
    if (p < products.length) tiles.push({ kind: 'product', product: products[p++] });
    tiles.push({ kind: 'campaign', image: nextCampaign(), span: 2 });
  }
  return tiles;
}

// Campaign shot that slowly zooms (Ken Burns) and drifts against the mouse
function CampaignTile({ image, className }: { image: string; className?: string }) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 80, damping: 20 });
  const y = useSpring(0, { stiffness: 80, damping: 20 });

  const onPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || reduceMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set(-((e.clientX - rect.left) / rect.width - 0.5) * 24);
    y.set(-((e.clientY - rect.top) / rect.height - 0.5) * 24);
  };

  return (
    <Reveal direction="scale" width="100%" className={className}>
      <div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerLeave={() => { x.set(0); y.set(0); }}
        className="absolute inset-0 overflow-hidden"
      >
        <motion.div style={{ x, y }} className="absolute -inset-4">
          <div className="absolute inset-0 animate-kenburns">
            <SafeImage src={image} alt="Vintage Closet campaign" fill sizes="75vw" className="object-cover" />
          </div>
        </motion.div>
      </div>
    </Reveal>
  );
}

function ArrivalCard({ product, priority }: { product: Product; priority?: boolean }) {
  const { addItem, items } = useCart();
  const isInCart = items.some(item => item.id === product.id);
  const hoverImage = product.images[1];

  const handleAdd = () => {
    addItem({
      id: product.id,
      title: product.title,
      price: product.discount ? getDiscountedPrice(product.price, product.discount) : product.price,
      size: product.size,
      image: product.image,
      slug: product.slug,
    });
  };

  const href = `/product/${product.slug}`;

  return (
    <div className="group">
      <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
        <Link href={href} className="absolute inset-0">
          <SafeImage
            src={product.image}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, 50vw"
            className={cn('object-cover transition-[opacity,transform] duration-700 group-hover:scale-[1.04]', hoverImage && 'group-hover:opacity-0')}
            priority={priority}
          />
          {hoverImage && (
            <SafeImage
              src={hoverImage}
              alt=""
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover opacity-0 transition-[opacity,transform] duration-700 group-hover:opacity-100 group-hover:scale-[1.04]"
            />
          )}
          <span className="absolute top-3 left-3 text-[11px] text-ink">New in</span>
        </Link>
        <button
          type="button"
          onClick={handleAdd}
          aria-label={isInCart ? 'In cart' : `Add ${product.title} to cart`}
          className="absolute bottom-3 right-3 p-1.5 text-ink hover:opacity-60 transition-opacity"
        >
          {isInCart ? <Check size={18} /> : <Plus size={18} />}
        </button>
      </div>
      <Link href={href} className="block">
        <div className="flex items-start justify-between gap-3 pt-3 pb-1 text-sm text-ink">
          <span className="line-clamp-1">{product.title}</span>
          <span className="whitespace-nowrap">
            {product.discount ? getDiscountedPrice(product.price, product.discount) : product.price}
          </span>
        </div>
        <p className="text-xs text-muted">{[product.size, product.era].filter(Boolean).join(' · ')}</p>
      </Link>
    </div>
  );
}

interface NewArrivalsProps {
  // How many products to show; leave empty to show all
  limit?: number;
  // Heading level: h2 inside the homepage, h1 on its own page
  asPage?: boolean;
}

export function NewArrivals({ limit, asPage = false }: NewArrivalsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [campaign, setCampaign] = useState<string[]>(FALLBACK_CAMPAIGN_IMAGES);
  const [justWomen, setJustWomen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [items, images] = await Promise.all([getProducts(), getMediaCarouselImages()]);
        setProducts(items);
        if (images.length > 0) setCampaign(images.map(img => img.url));
      } catch (error) {
        console.error('Error fetching new arrivals:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Newest first comes from getProducts(); filter, then cut to the limit
  const tiles = useMemo(() => {
    const visible = products.filter(p => !justWomen || p.gender === 'women');
    return buildTiles(limit ? visible.slice(0, limit) : visible, campaign);
  }, [products, campaign, justWomen, limit]);

  const Heading = asPage ? 'h1' : 'h2';

  return (
    <section id="new-arrivals" className={cn('scroll-mt-24', asPage ? 'pt-28 md:pt-32 pb-16' : 'py-8 md:py-12')}>
      <div className="px-4 md:px-6">
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <Heading className="font-display text-2xl md:text-4xl text-ink">New Arrivals</Heading>
          <label className="flex items-center gap-3 text-sm text-ink cursor-pointer select-none">
            <button
              type="button"
              role="switch"
              aria-checked={justWomen}
              onClick={() => setJustWomen(v => !v)}
              className={cn(
                'relative w-9 h-5 rounded-full border border-ink transition-colors',
                justWomen ? 'bg-ink' : 'bg-transparent'
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all',
                  justWomen ? 'left-[18px] bg-white' : 'left-0.5 bg-ink'
                )}
              />
            </button>
            Just Women
          </label>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
            <div className="col-span-2 lg:col-span-3 aspect-[2/1] lg:aspect-auto bg-gray-100 animate-pulse" />
            <div className="aspect-[3/4] bg-gray-100 animate-pulse" />
          </div>
        ) : tiles.length === 0 ? (
          <p className="text-muted text-sm py-12 text-center">New pieces are on their way. Check back soon.</p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-2 gap-y-6 md:gap-x-4 md:gap-y-8">
            {tiles.map((tile, i) =>
              tile.kind === 'campaign' ? (
                <CampaignTile
                  key={`c-${i}`}
                  image={tile.image}
                  className={cn(
                    'relative col-span-2 aspect-[16/9] lg:aspect-auto lg:min-h-full overflow-hidden bg-gray-100',
                    tile.span === 3 ? 'lg:col-span-3' : 'lg:col-span-2'
                  )}
                />
              ) : (
                <Reveal key={tile.product.id} width="100%" delay={(i % 4) * 0.06}>
                  <ArrivalCard product={tile.product} priority={i < 3} />
                </Reveal>
              )
            )}
          </div>
        )}

        {!asPage && limit && products.length > limit && (
          <div className="flex justify-center mt-10">
            <Link href="/new-arrivals" className="group inline-flex items-center gap-2 text-sm text-ink hover:opacity-70 transition-opacity">
              View all new arrivals <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
