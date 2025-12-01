'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ArrowRight, CaretLeft, CaretRight, Square } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Product, getDiscountedPrice } from '@/lib/data';

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const [currentImage, setCurrentImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const images = product.images && product.images.length > 0 ? product.images : [product.image];

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImage((prev) => (prev - 1 + images.length) % images.length);
  };

  // Category-specific styling
  const categoryStyles = {
    women: {
      accent: 'bg-[#F7C9CF]',
      hoverGlow: 'group-hover:shadow-[0_8px_24px_rgba(247,201,207,0.2)]',
      slideDirection: 1,
      badge: 'bg-white/80 text-ink backdrop-blur-sm',
    },
    men: {
      accent: 'bg-[#1C2A44]',
      hoverGlow: 'group-hover:shadow-[0_8px_24px_rgba(28,42,68,0.2)]',
      slideDirection: -1,
      badge: 'bg-ink/5 text-ink',
    },
    unisex: {
      accent: 'bg-gradient-to-b from-[#00B1BB] to-[#1B7177]',
      hoverGlow: 'group-hover:shadow-[0_8px_24px_rgba(0,177,187,0.2)]',
      slideDirection: 0,
      badge: 'border border-accent-start/30 text-accent-start bg-white',
    },
  };

  const style = categoryStyles[product.gender] || categoryStyles.unisex;

  return (
    <div 
      className={cn(
        "group relative flex flex-col rounded-[20px] bg-white border border-hairline transition-all duration-500 overflow-hidden h-full",
        "hover:shadow-[0_12px_35px_rgba(7,25,32,0.08)]",
        style.hoverGlow
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Accent Bar */}
      <motion.div 
        className={cn("absolute left-0 top-0 w-1 rounded-r-full z-20 opacity-0 group-hover:opacity-100 transition-opacity", style.accent)}
        initial={{ height: '0%' }}
        animate={{ height: isHovered ? '100%' : '0%' }}
        transition={{ duration: 0.4 }}
      />

      {/* Image Container - Fixed Height */}
      <div className="relative w-full h-[280px] overflow-hidden rounded-t-[20px] bg-gray-100 flex-shrink-0">
        <Link href={`/product/${product.slug}`} className="block w-full h-full">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={currentImage}
              initial={style.slideDirection === 0 ? { opacity: 0 } : { x: style.slideDirection * 100 + '%', rotate: style.slideDirection * 1 }}
              animate={{ x: 0, opacity: 1, rotate: 0 }}
              exit={style.slideDirection === 0 ? { opacity: 0 } : { x: style.slideDirection * -100 + '%', rotate: style.slideDirection * -1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute inset-0"
            >
              <Image
                src={images[currentImage]}
                alt={product.title}
                fill
                className="object-cover"
                priority={priority}
              />
            </motion.div>
          </AnimatePresence>

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>

        {/* Navigation Dots/Arrows */}
        {images.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button 
              onClick={prevImage}
              className="p-1.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-ink transition-colors"
            >
              <CaretLeft size={12} weight="bold" />
            </button>
            <button 
              onClick={nextImage}
              className="p-1.5 rounded-full bg-white/20 backdrop-blur-md hover:bg-white text-white hover:text-ink transition-colors"
            >
              <CaretRight size={12} weight="bold" />
            </button>
          </div>
        )}

        {/* Era Badge - Always Present */}
        <div className="absolute top-3 left-3 z-20">
          <span className={cn("px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md inline-block min-w-[40px] text-center", style.badge)}>
            {product.era || '—'}
          </span>
        </div>

        {/* Discount Badge */}
        {product.discount && product.discount > 0 && (
          <div className="absolute top-3 right-3 z-20">
            <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md inline-block bg-red-500 text-white">
              -{product.discount}%
            </span>
          </div>
        )}
      </div>

      {/* Info Stack - Fixed Structure */}
      <div className="p-4 flex flex-col flex-1">
        {/* Divider */}
        <div className="absolute top-[280px] left-4 right-4 h-px bg-ink/[0.08]" />

        {/* Title & Wishlist - Fixed Height */}
        <div className="flex justify-between items-start gap-3 mb-2 min-h-[44px]">
          <Link href={`/product/${product.slug}`} className="group/title flex-1">
            <h3 className={cn(
              "font-display text-base leading-snug text-ink transition-colors line-clamp-2",
              product.gender === 'women' ? "group-hover/title:text-[#D48C94]" :
              product.gender === 'men' ? "group-hover/title:text-[#1C2A44]" :
              "group-hover/title:text-accent-start"
            )}>
              {product.title}
            </h3>
          </Link>

          <button className="text-muted hover:text-red-500 transition-colors flex-shrink-0">
            {product.gender === 'men' ? <Square size={18} weight="bold" /> : <Heart size={18} weight={isHovered ? "fill" : "regular"} className={cn(isHovered && "text-red-500")} />}
          </button>
        </div>

        {/* Metadata - Fixed Height */}
        <div className="flex items-center gap-2 text-xs text-muted mb-3 h-[18px]">
          <span>{product.category}</span>
          <span className="w-1 h-1 rounded-full bg-muted/30" />
          <span>{product.era || '—'}</span>
        </div>

        {/* Price & Size Row - Fixed Height */}
        <div className="flex items-center justify-between mt-auto h-[32px]">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-ink">
              {product.discount ? getDiscountedPrice(product.price, product.discount) : product.price}
            </span>
            {product.discount && product.discount > 0 && (
              <span className="text-sm text-muted line-through">{product.price}</span>
            )}
          </div>
          
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap",
            product.gender === 'women' ? "bg-red-50 text-red-900" :
            product.gender === 'men' ? "bg-blue-50 text-blue-900" :
            "bg-gradient-to-r from-accent-start/10 to-accent-end/10 text-accent-start border border-accent-start/20"
          )}>
            {product.size || '—'}
          </div>
        </div>
      </div>
    </div>
  );
}
