'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { getRecentProductsCount } from '@/lib/data';

export function CalloutBanner() {
  const [recentCount, setRecentCount] = useState<number | null>(null);

  useEffect(() => {
    async function fetchCount() {
      const count = await getRecentProductsCount(7);
      setRecentCount(count);
    }
    fetchCount();
  }, []);

  // Don't show banner if no recent products
  if (recentCount === 0) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 bg-gradient-accent py-2 text-white shadow-md">
       <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
             <span className="font-bold uppercase tracking-wide text-xs md:text-sm whitespace-nowrap">New Drop Live</span>
             <span className="hidden md:inline text-white/50">|</span>
             <span className="text-xs md:text-sm text-white/90 truncate">
               {recentCount !== null ? (
                 recentCount > 0 
                   ? `${recentCount} new vintage item${recentCount !== 1 ? 's' : ''} added this week.`
                   : 'Fresh drops coming soon.'
               ) : (
                 'Loading new arrivals...'
               )}
             </span>
          </div>
          <Link href="/women">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 border-white/20 hover:border-white h-8 text-xs px-4 ml-4 flex-shrink-0">
               Shop Now
            </Button>
          </Link>
       </div>
    </div>
  );
}
