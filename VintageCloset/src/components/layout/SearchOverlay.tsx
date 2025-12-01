'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlass, X, ArrowRight } from '@phosphor-icons/react';
import Image from 'next/image';
import Link from 'next/link';
import { getProducts, Product } from '@/lib/data';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load products on mount
  useEffect(() => {
    async function loadProducts() {
      const products = await getProducts();
      setAllProducts(products);
    }
    loadProducts();
  }, []);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Search logic
  const handleSearch = useCallback((searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    const lowerQuery = searchQuery.toLowerCase();
    const filtered = allProducts.filter(product => 
      product.title.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery) ||
      product.gender.toLowerCase().includes(lowerQuery) ||
      (product.era && product.era.toLowerCase().includes(lowerQuery))
    ).slice(0, 6); // Limit to 6 results

    setResults(filtered);
    setIsLoading(false);
  }, [allProducts]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-ink/60 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />

          {/* Search Panel */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed top-0 left-0 right-0 z-[60] bg-white shadow-2xl"
          >
            <div className="container mx-auto px-4 md:px-6">
              {/* Search Input */}
              <div className="flex items-center h-20 md:h-24 gap-4">
                <MagnifyingGlass size={24} className="text-muted flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search products..."
                  className="flex-1 text-xl md:text-2xl font-display text-ink placeholder:text-muted/50 bg-transparent border-none outline-none"
                />
                <button
                  onClick={onClose}
                  className="p-2 text-muted hover:text-ink transition-colors"
                >
                  <X size={24} weight="bold" />
                </button>
              </div>

              {/* Results */}
              <AnimatePresence mode="wait">
                {query.length >= 2 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-hairline overflow-hidden"
                  >
                    <div className="py-6 max-h-[60vh] overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                      {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-6 h-6 border-2 border-accent-start border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : results.length > 0 ? (
                        <div className="space-y-2">
                          <p className="text-xs text-muted uppercase tracking-wider mb-4">
                            {results.length} result{results.length !== 1 ? 's' : ''}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {results.map((product) => (
                              <Link
                                key={product.id}
                                href={`/product/${product.slug}`}
                                onClick={onClose}
                                className="group flex items-center gap-4 p-3 rounded-xl hover:bg-surface transition-colors"
                              >
                                <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                  <Image
                                    src={product.image}
                                    alt={product.title}
                                    fill
                                    className="object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-ink text-sm truncate group-hover:text-accent-start transition-colors">
                                    {product.title}
                                  </h3>
                                  <p className="text-xs text-muted mt-1">
                                    {product.category} · {product.size}
                                  </p>
                                  <p className="text-sm font-bold text-ink mt-1">
                                    {product.price}
                                  </p>
                                </div>
                                <ArrowRight size={16} className="text-muted group-hover:text-accent-start transition-colors flex-shrink-0" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted">No products found for &quot;{query}&quot;</p>
                          <p className="text-sm text-muted/60 mt-1">Try a different search term</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick Links when no search */}
              {query.length < 2 && (
                <div className="border-t border-hairline py-6">
                  <p className="text-xs text-muted uppercase tracking-wider mb-4">Quick Links</p>
                  <div className="flex flex-wrap gap-2">
                    {['Women', 'Men', 'Unisex', 'Sweatshirts', 'Pants', 'Outerwear'].map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSearch(term)}
                        className="px-4 py-2 rounded-full bg-surface text-sm font-medium text-ink hover:bg-accent-start/10 hover:text-accent-start transition-colors border border-hairline"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

