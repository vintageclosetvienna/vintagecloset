'use client';

import { useState } from 'react';
import { Plus, Minus, Heart, ShoppingBag, CreditCard, Check } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { AnimatePresence, motion } from 'framer-motion';
import { Product, getDiscountedPrice } from '@/lib/data';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';

export function ProductInfo({ product }: { product: Product }) {
  // Dynamic sections based on product data
  const SECTIONS = [
    { 
      title: 'Description', 
      content: product.description || 'A unique vintage piece carefully selected for its quality and style. Each item has its own story and character.' 
    },
    { 
      title: 'Measurements', 
      content: 'Please contact us for detailed measurements.\n\nEach vintage item is unique and measurements may vary.' 
    },
    { 
      title: 'Condition & Care', 
      content: 'Excellent vintage condition with no major flaws. Washed, steamed, and ready to wear.\n\nMachine wash cold, gentle cycle. Hang dry. Do not bleach.' 
    }
  ];
  const [openSection, setOpenSection] = useState<string>('Description');
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

       {/* Accordion */}
       <div className="space-y-2">
          {SECTIONS.map(section => (
             <div key={section.title} className="border-b border-hairline last:border-none">
                <button
                   onClick={() => setOpenSection(openSection === section.title ? '' : section.title)}
                   className="flex items-center justify-between w-full py-4 text-left group"
                >
                   <span className="font-bold text-ink group-hover:text-accent-start transition-colors">{section.title}</span>
                   <div className="p-1 rounded-full bg-gray-100 group-hover:bg-accent-start/10 transition-colors">
                      {openSection === section.title ? <Minus size={14} className="text-accent-start" /> : <Plus size={14} />}
                   </div>
                </button>
                <AnimatePresence>
                   {openSection === section.title && (
                      <motion.div
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         transition={{ duration: 0.3 }}
                         className="overflow-hidden"
                      >
                         <p className="pb-6 text-muted text-base leading-relaxed whitespace-pre-line">{section.content}</p>
                      </motion.div>
                   )}
                </AnimatePresence>
             </div>
          ))}
       </div>

       {/* Store Info */}
       <div className="pt-6 border-t border-hairline">
          <p className="text-sm text-muted leading-relaxed">
             Questions? <Link href="/contact" className="font-bold text-accent-start hover:underline">Get in touch</Link> or visit us at our Vienna flagship.
          </p>
       </div>
    </div>
  );
}
