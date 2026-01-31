'use client';

import { useState } from 'react';
import { Heart, ShoppingBag, CreditCard, Check } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { Product, getDiscountedPrice } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';

export function ProductInfo({ product }: { product: Product }) {
  const [addedToCart, setAddedToCart] = useState(false);
  const { addItem, items } = useCart();
  const router = useRouter();

  // Check if product is already in cart
  const isInCart = items.some(item => item.id === product.id);

  // Extract brand from title if available or use category
  const brand = product.title.split(' ')[1] || product.category;

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      title: product.title,
      price: product.discount ? getDiscountedPrice(product.price, product.discount) : product.price,
      size: product.size,
      image: product.image,
      slug: product.slug,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  // Handle Buy Now - add to cart and redirect to checkout
  const handleBuyNow = () => {
    // Add to cart if not already there
    if (!isInCart) {
      addItem({
        id: product.id,
        title: product.title,
        price: product.discount ? getDiscountedPrice(product.price, product.discount) : product.price,
        size: product.size,
        image: product.image,
        slug: product.slug,
      });
    }
    // Redirect to checkout page
    router.push('/checkout');
  };

  return (
    <div className="space-y-8 bg-white rounded-2xl p-6 md:p-8 border border-hairline shadow-sm">
       {/* Header */}
       <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
             <span className="px-3 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wide rounded-full border border-green-200">
                In Stock
             </span>
             <span className="px-3 py-1 bg-gray-50 text-muted text-xs font-bold uppercase tracking-wide rounded-full border border-hairline">
                {product.era || 'Vintage'}
             </span>
          </div>
          
          <h1 className="text-2xl md:text-4xl font-display font-bold text-ink leading-tight">{product.title}</h1>
          
          <div className="flex items-baseline gap-4">
             <p className="text-3xl text-ink font-bold">
               {product.discount ? getDiscountedPrice(product.price, product.discount) : product.price}
             </p>
             {product.discount && product.discount > 0 ? (
               <>
                 <span className="text-sm text-muted line-through">{product.price}</span>
                 <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-md">-{product.discount}%</span>
               </>
             ) : (
               <span className="text-sm text-muted line-through">€{(parseFloat(product.price.replace('€', '')) * 1.3).toFixed(2)}</span>
             )}
          </div>
       </div>

       {/* Actions */}
       <div className="space-y-3">
          {product.isSold ? (
            <div className="w-full h-14 rounded-xl bg-red-50 border-2 border-red-200 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-700 font-bold text-lg">SOLD OUT</p>
                <p className="text-red-600 text-xs mt-0.5">This item has been sold</p>
              </div>
            </div>
          ) : (
            <>
              <Button 
                size="lg" 
                className={`w-full h-14 text-base font-bold shadow-sm hover:shadow-lg ${isInCart || addedToCart ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={handleAddToCart}
                disabled={isInCart}
              >
                 {isInCart || addedToCart ? (
                   <>
                     <Check className="mr-2" size={20} weight="bold" />
                     Added to Bag
                   </>
                 ) : (
                   <>
                     <ShoppingBag className="mr-2" size={20} weight="bold" />
                     Add to Bag
                   </>
                 )}
              </Button>
              <div className="grid grid-cols-2 gap-3">
                 <Button 
                    variant="secondary" 
                    size="lg" 
                    className="w-full h-12 text-sm font-bold"
                    onClick={handleBuyNow}
                 >
                    <CreditCard className="mr-2" size={18} weight="bold" />
                    Buy Now
                 </Button>
                 <Button variant="ghost" size="lg" className="h-12 border border-hairline hover:border-accent-start">
                    <Heart size={20} weight="bold" />
                 </Button>
              </div>
            </>
          )}
       </div>

       {/* Details Grid */}
       <div className="grid grid-cols-2 gap-x-6 gap-y-4 py-6 border-y border-hairline bg-surface/30 rounded-xl px-4">
          <div>
             <span className="block text-xs text-muted uppercase tracking-wider mb-1">Brand</span>
             <span className="block text-sm font-bold text-ink">{brand}</span>
          </div>
          <div>
             <span className="block text-xs text-muted uppercase tracking-wider mb-1">Size</span>
             <span className="block text-sm font-bold text-ink">{product.size}</span>
          </div>
          <div>
             <span className="block text-xs text-muted uppercase tracking-wider mb-1">Category</span>
             <span className="block text-sm font-bold text-ink">{product.category}</span>
          </div>
          <div>
             <span className="block text-xs text-muted uppercase tracking-wider mb-1">Condition</span>
             <span className="block text-sm font-bold text-ink">Excellent</span>
          </div>
       </div>

       {/* Description */}
       <div className="space-y-3">
          <h3 className="font-bold text-ink text-lg">Description</h3>
          <p className="text-muted text-base leading-relaxed">
            {product.description || 'A unique vintage piece carefully selected for its quality and style. Each item has its own story and character.'}
          </p>
       </div>

       {/* Store Info */}
       <div className="pt-6 border-t border-hairline">
          <p className="text-sm text-muted leading-relaxed">
             Questions? <a href="mailto:vintage.closet.vienna@gmail.com" className="font-bold text-accent-start hover:underline">Get in touch</a> or visit us at our Vienna flagship.
          </p>
       </div>
    </div>
  );
}
