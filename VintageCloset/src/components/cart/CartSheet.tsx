'use client';

import { useState, useEffect } from 'react';
import { X, Trash, ShoppingBag, Tag } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { SafeImage } from '@/components/ui/SafeImage';
import { useCart } from '@/lib/cart';
import { useRouter } from 'next/navigation';
import { getProductById, type Product } from '@/lib/data';

interface CartSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartSheet({ isOpen, onClose }: CartSheetProps) {
  const { items, removeItem, getSubtotal, itemCount } = useCart();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);

  // Fetch product data to get discount info
  useEffect(() => {
    async function fetchProduct() {
      if (items.length > 0 && items[0].id) {
        const productData = await getProductById(items[0].id);
        setProduct(productData);
      } else {
        setProduct(null);
      }
    }
    fetchProduct();
  }, [items]);

  // Calculate original price and discount
  const getOriginalPrice = (): number => {
    if (!product) return parseFloat(getSubtotal().replace('€', '').replace(',', '.'));
    return parseFloat(product.price.replace('€', '').replace(',', '.'));
  };

  const getDiscountAmount = (): number => {
    if (!product || !product.discount || product.discount === 0) return 0;
    return getOriginalPrice() * (product.discount / 100);
  };

  const getFinalPrice = (): number => {
    return getOriginalPrice() - getDiscountAmount();
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    onClose();
    router.push('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full md:w-[480px] bg-surface z-50 shadow-2xl flex flex-col border-l border-hairline"
          >
             {/* Header */}
             <div className="flex items-center justify-between p-6 border-b border-hairline">
                <div className="flex items-center gap-3">
                   <ShoppingBag size={24} />
                   <h2 className="text-xl font-bold font-display">Your Bag ({itemCount})</h2>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                   <X size={24} />
                </Button>
             </div>

             {/* Items */}
             <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-6">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-4 border border-hairline">
                      <ShoppingBag size={32} className="text-muted" />
                    </div>
                    <h3 className="font-display font-bold text-lg text-ink mb-2">Your bag is empty</h3>
                    <p className="text-sm text-muted max-w-[200px]">
                      Explore our collections and find something you love.
                    </p>
                  </div>
                ) : (
                  items.map(item => (
                    <div key={item.id} className="flex gap-4">
                       <div className="relative w-20 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          <SafeImage src={item.image} alt={item.title} fill className="object-cover" />
                       </div>
                       <div className="flex-1 flex flex-col justify-between">
                          <div>
                             <div className="flex justify-between items-start">
                                <h3 className="font-bold text-ink text-sm">{item.title}</h3>
                                <span className="text-sm font-medium">{item.price}</span>
                             </div>
                             <p className="text-xs text-muted uppercase mt-1">Size: {item.size}</p>
                          </div>
                          <div className="flex items-center justify-between">
                             <span className="text-xs text-muted">Qty: {item.quantity}</span>
                             <button 
                               onClick={() => removeItem(item.id)}
                               className="text-muted hover:text-red-500 transition-colors"
                             >
                                <Trash size={18} />
                             </button>
                          </div>
                       </div>
                    </div>
                  ))
                )}
             </div>

             {/* Footer */}
             {items.length > 0 && (
               <div className="p-6 border-t border-hairline bg-surface space-y-4">
                  <div className="space-y-2">
                     <div className="flex justify-between text-sm">
                        <span className="text-muted">Subtotal</span>
                        <span className="font-medium text-ink">€{getOriginalPrice().toFixed(2)}</span>
                     </div>
                     {getDiscountAmount() > 0 && (
                       <div className="flex justify-between text-sm">
                         <span className="flex items-center gap-1.5 text-blue-600">
                           <Tag size={14} weight="fill" />
                           <span className="font-medium">Discount ({product?.discount}%)</span>
                         </span>
                         <span className="font-medium text-blue-600">-€{getDiscountAmount().toFixed(2)}</span>
                       </div>
                     )}
                     <div className="flex justify-between text-sm text-muted">
                        <span>Shipping</span>
                        <span className="font-medium">Free</span>
                     </div>
                     <div className="flex justify-between text-lg font-bold text-ink pt-2 border-t border-dashed border-hairline">
                        <span>Total</span>
                        <span>€{getFinalPrice().toFixed(2)}</span>
                     </div>
                  </div>
                  <Button 
                    size="lg" 
                    className="w-full mt-4"
                    onClick={handleCheckout}
                  >
                    Checkout
                  </Button>
               </div>
             )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
