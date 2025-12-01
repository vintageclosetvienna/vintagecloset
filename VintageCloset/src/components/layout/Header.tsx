'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { List, X, ShoppingBag, MagnifyingGlass } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { CartSheet } from '@/components/cart/CartSheet';
import { SearchOverlay } from '@/components/layout/SearchOverlay';
import { useCart } from '@/lib/cart';

const NAV_LINKS = [
  { label: 'Women', href: '/women' },
  { label: 'Men', href: '/men' },
  { label: 'Unisex', href: '/unisex' },
  { label: 'Journal', href: '/journal' },
  { label: 'Events', href: '/events' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const { itemCount } = useCart();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 40 && !isScrolled) setIsScrolled(true);
    if (latest <= 40 && isScrolled) setIsScrolled(false);
  });

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out border-b border-transparent",
          isScrolled ? "bg-white/90 backdrop-blur-md border-hairline py-2" : "bg-transparent py-4"
        )}
      >
        <div className="container mx-auto px-4 md:px-6 flex items-center justify-between h-[var(--header-height)]">
          {/* Mobile: Left Logo */}
          <div className="flex items-center md:hidden">
            <Logo />
          </div>

          {/* Desktop: Left Placeholder (or Logo if centered nav desired, Plan says: "Primary nav horizontally centered") */}
          <div className="hidden md:flex items-center w-1/4">
            <Logo />
          </div>

          {/* Desktop: Center Nav */}
          <nav className="hidden md:flex items-center justify-center space-x-8 flex-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group relative text-sm font-medium text-ink hover:text-accent-start transition-colors"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-accent transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center justify-end space-x-2 md:w-1/4">
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Search"
              onClick={() => setIsSearchOpen(true)}
            >
              <MagnifyingGlass size={20} weight="bold" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              aria-label="Cart" 
              className="relative"
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag size={20} weight="bold" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-accent-start text-white text-xs font-bold flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
            
            <div className="hidden md:block ml-2">
               <Button variant="primary" size="sm">
                 Visit Store
               </Button>
            </div>

            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Menu"
            >
              <List size={24} weight="bold" />
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50 md:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[85%] max-w-xs bg-surface z-50 shadow-2xl border-l border-hairline md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-hairline h-[var(--header-height)]">
                <span className="text-sm font-semibold text-muted uppercase tracking-wider">Menu</span>
                <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(false)}>
                  <X size={24} />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto py-6 px-4 space-y-6">
                <nav className="flex flex-col space-y-4">
                  {NAV_LINKS.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-2xl font-heading font-medium text-ink hover:text-accent-start transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
                
                <div className="w-full h-px bg-hairline" />
                
                <div className="space-y-4">
                   <p className="text-xs text-muted uppercase tracking-widest">Account</p>
                   <Link href="/login" className="block text-sm font-medium hover:text-accent-start">Sign In</Link>
                   <Link href="/orders" className="block text-sm font-medium hover:text-accent-start">Orders</Link>
                </div>
              </div>

              <div className="p-4 border-t border-hairline bg-surface">
                <Button variant="primary" className="w-full">
                  Visit Store
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

