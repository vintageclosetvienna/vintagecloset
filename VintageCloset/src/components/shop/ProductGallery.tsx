'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from '@phosphor-icons/react';

interface ProductGalleryProps {
  images: string[];
}

export function ProductGallery({ images }: ProductGalleryProps) {
  const [activeImage, setActiveImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  return (
    <>
      <div className="flex flex-col gap-4">
         {/* Main Image */}
         <div 
            className="relative aspect-[3/4] w-full bg-gray-100 rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
            onClick={() => setIsLightboxOpen(true)}
         >
            <AnimatePresence mode="wait">
               <motion.div
                  key={activeImage}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="absolute inset-0"
               >
                  <Image 
                     src={images[activeImage]} 
                     alt="Product Main" 
                     fill 
                     className="object-cover group-hover:scale-105 transition-transform duration-700" 
                     priority
                  />
               </motion.div>
            </AnimatePresence>
            
            {/* Zoom Hint */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
               <span className="text-white text-sm font-medium bg-black/40 backdrop-blur-sm px-4 py-2 rounded-full">
                  Click to zoom
               </span>
            </div>
         </div>

         {/* Thumbnails */}
         <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {images.map((img, idx) => (
               <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={cn(
                     "relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                     activeImage === idx ? "border-accent-start scale-105 shadow-md" : "border-transparent hover:border-hairline opacity-70 hover:opacity-100"
                  )}
               >
                  <Image src={img} alt={`View ${idx + 1}`} fill className="object-cover" />
               </button>
            ))}
         </div>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
         {isLightboxOpen && (
            <>
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-ink/95 backdrop-blur-md z-[100]"
                  onClick={() => setIsLightboxOpen(false)}
               />
               <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed inset-0 z-[101] flex items-center justify-center p-4"
                  onClick={() => setIsLightboxOpen(false)}
               >
                  <button 
                     className="absolute top-6 right-6 p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white hover:text-ink transition-colors"
                     onClick={() => setIsLightboxOpen(false)}
                  >
                     <X size={24} weight="bold" />
                  </button>
                  
                  <div className="relative w-full max-w-5xl aspect-[4/5] rounded-2xl overflow-hidden">
                     <Image 
                        src={images[activeImage]} 
                        alt="Product Full View" 
                        fill 
                        className="object-contain"
                     />
                  </div>
               </motion.div>
            </>
         )}
      </AnimatePresence>
    </>
  );
}
