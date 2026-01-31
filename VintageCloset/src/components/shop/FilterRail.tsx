'use client';

import React, { useState } from 'react';
import { Sliders, X, Check, CaretDown } from '@phosphor-icons/react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Category options per gender
const CATEGORIES_BY_GENDER = {
  women: [
    'All',
    'Tops',
    'Blouses',
    'T-Shirts',
    'Sweaters',
    'Cardigans',
    'Dresses',
    'Skirts',
    'Pants',
    'Jeans',
    'Shorts',
    'Blazers',
    'Coats',
    'Jackets',
    'Knitwear',
    'Loungewear',
    'Activewear',
    'Swimwear',
    'Lingerie',
    'Accessories',
    'Bags',
    'Shoes',
    'Jewelry',
    'Scarves',
  ],
  men: [
    'All',
    'T-Shirts',
    'Shirts',
    'Polos',
    'Sweaters',
    'Hoodies',
    'Sweatshirts',
    'Pants',
    'Jeans',
    'Shorts',
    'Chinos',
    'Blazers',
    'Suits',
    'Coats',
    'Jackets',
    'Jerseys',
    'Knitwear',
    'Activewear',
    'Swimwear',
    'Underwear',
    'Accessories',
    'Bags',
    'Shoes',
    'Watches',
    'Hats',
  ],
  unisex: [
    'All',
    'T-Shirts',
    'Sweatshirts',
    'Hoodies',
    'Sweaters',
    'Pants',
    'Jeans',
    'Shorts',
    'Jackets',
    'Coats',
    'Outerwear',
    'Sets',
    'Tracksuits',
    'Activewear',
    'Loungewear',
    'Accessories',
    'Bags',
    'Shoes',
    'Hats',
    'Scarves',
  ],
};

const FILTERS = [
  { id: 'category', label: 'Category', options: [] as string[] },
  { id: 'size', label: 'Size', options: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
  { id: 'condition', label: 'Condition', options: ['Deadstock', 'Excellent', 'Good', 'Fair'] },
  { id: 'price', label: 'Price', options: ['Under €50', '€50 – €100', '€100 – €200', '€200+'] },
];

interface FilterRailProps {
  gender?: 'women' | 'men' | 'unisex';
  onFilterChange?: (filters: Record<string, string[]>) => void;
}

export function FilterRail({ gender = 'unisex', onFilterChange }: FilterRailProps) {
  const [activeDrawer, setActiveDrawer] = useState<string | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string[]>>({});

  // Get category options based on gender
  const categoryOptions = CATEGORIES_BY_GENDER[gender];

  // Build filters with dynamic category options
  const filters = FILTERS.map(filter => 
    filter.id === 'category' 
      ? { ...filter, options: categoryOptions }
      : filter
  );

  const toggleFilter = (category: string, value: string) => {
    setSelectedFilters(prev => {
      const current = prev[category] || [];
      const updated = current.includes(value) 
        ? current.filter(item => item !== value)
        : [...current, value];
      const newFilters = { ...prev, [category]: updated };
      onFilterChange?.(newFilters);
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setSelectedFilters({});
    onFilterChange?.({});
  };

  const hasActiveFilters = Object.values(selectedFilters).some(arr => arr.length > 0);

  return (
    <>
      {/* Sticky Filter Rail */}
      <div className="sticky top-[calc(var(--header-height)-1px)] z-30 bg-surface/95 backdrop-blur-md border-b border-hairline">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {/* All Filters Button */}
            <button
              onClick={() => setActiveDrawer('all')}
              className={cn(
                "flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                "border border-hairline bg-white hover:border-muted",
                hasActiveFilters && "border-accent-start bg-accent-start/5"
              )}
            >
              <Sliders size={16} weight="bold" />
              <span>Filters</span>
              {hasActiveFilters && (
                <span className="w-5 h-5 rounded-full bg-gradient-to-r from-accent-start to-accent-end text-white text-xs flex items-center justify-center font-bold">
                  {Object.values(selectedFilters).flat().length}
                </span>
              )}
            </button>

            <div className="w-px h-5 bg-hairline flex-shrink-0" />

            {/* Individual Filter Chips */}
            {filters.map(filter => {
              const count = selectedFilters[filter.id]?.length || 0;
              const isActive = count > 0;
              
              return (
                <button
                  key={filter.id}
                  onClick={() => setActiveDrawer(filter.id)}
                  className={cn(
                    "flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm transition-all",
                    "border whitespace-nowrap",
                    isActive 
                      ? "border-transparent bg-gradient-to-r from-accent-start to-accent-end text-white font-medium"
                      : "border-hairline bg-white text-ink hover:border-muted hover:shadow-sm"
                  )}
                >
                  <span>{filter.label}</span>
                  {isActive ? (
                    <span className="bg-white/20 px-1.5 py-0.5 rounded text-xs font-bold">{count}</span>
                  ) : (
                    <CaretDown size={12} weight="bold" className="text-muted" />
                  )}
                </button>
              );
            })}

            {/* Clear All */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="flex-shrink-0 text-sm text-muted hover:text-accent-start transition-colors underline underline-offset-2 ml-2"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Drawer */}
      <AnimatePresence>
        {activeDrawer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-40"
              onClick={() => setActiveDrawer(null)}
            />
            
            {/* Drawer */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl shadow-2xl max-h-[70vh] flex flex-col overflow-hidden"
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-hairline rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4 border-b border-hairline">
                <h3 className="font-display font-bold text-lg">
                  {activeDrawer === 'all' 
                    ? 'All Filters' 
                    : `Filter by ${filters.find(f => f.id === activeDrawer)?.label}`
                  }
                </h3>
                <button
                  onClick={() => setActiveDrawer(null)}
                  className="p-2 -mr-2 text-muted hover:text-ink transition-colors"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-5">
                {activeDrawer === 'all' ? (
                  // All Filters View
                  <div className="space-y-6">
                    {filters.map(filter => (
                      <div key={filter.id}>
                        <h4 className="text-sm font-bold text-muted uppercase tracking-wide mb-3">
                          {filter.label}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {filter.options.map(option => {
                            const isSelected = selectedFilters[filter.id]?.includes(option);
                            return (
                              <button
                                key={option}
                                onClick={() => toggleFilter(filter.id, option)}
                                className={cn(
                                  "px-3 py-1.5 rounded-md text-sm transition-all border",
                                  isSelected
                                    ? "bg-gradient-to-r from-accent-start to-accent-end text-white border-transparent font-medium"
                                    : "bg-white border-hairline text-ink hover:border-muted"
                                )}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Single Filter View
                  <div className="space-y-1">
                    {filters.find(f => f.id === activeDrawer)?.options.map(option => {
                      const isSelected = selectedFilters[activeDrawer]?.includes(option);
                      return (
                        <button
                          key={option}
                          onClick={() => toggleFilter(activeDrawer, option)}
                          className={cn(
                            "flex items-center justify-between w-full p-3 rounded-lg transition-all text-left",
                            isSelected 
                              ? "bg-gradient-to-r from-accent-start/10 to-accent-end/10" 
                              : "hover:bg-white"
                          )}
                        >
                          <span className={cn(
                            "text-sm",
                            isSelected ? "font-bold text-accent-start" : "text-ink"
                          )}>
                            {option}
                          </span>
                          {isSelected && (
                            <Check size={18} weight="bold" className="text-accent-start" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-hairline bg-surface flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1" 
                  onClick={() => {
                    if (activeDrawer === 'all') {
                      clearAllFilters();
                    } else {
                      const newFilters = { ...selectedFilters, [activeDrawer]: [] };
                      setSelectedFilters(newFilters);
                      onFilterChange?.(newFilters);
                    }
                  }}
                >
                  Reset
                </Button>
                <Button 
                  className="flex-1" 
                  onClick={() => setActiveDrawer(null)}
                >
                  Apply
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
