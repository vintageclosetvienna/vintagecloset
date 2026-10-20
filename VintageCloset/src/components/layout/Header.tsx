'use client';

import React, { useCallback, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useScroll, useMotionValueEvent } from 'framer-motion';
import { List, ShoppingBag, MagnifyingGlass } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { CartSheet } from '@/components/cart/CartSheet';
import { SearchOverlay } from '@/components/layout/SearchOverlay';
import { MenuDrawer, MENU_TABS, type MenuTab } from '@/components/layout/MenuDrawer';
import { useCart } from '@/lib/cart';

const SECONDARY_LINKS = [
  { label: 'Journal', href: '/journal' },
  { label: 'Events', href: '/events' },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuTab, setMenuTab] = useState<MenuTab | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { scrollY } = useScroll();
  const pathname = usePathname();
  const { itemCount } = useCart();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 40 && !isScrolled) setIsScrolled(true);
    if (latest <= 40 && isScrolled) setIsScrolled(false);
  });

  // Close the menu when the route changes (also covers the back button)
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuTab(null);
  }

  const closeMenu = useCallback(() => setMenuTab(null), []);
  const openSearchFromMenu = useCallback(() => {
    setMenuTab(null);
    setIsSearchOpen(true);
  }, []);

  // Women / Men / Unisex open the menu on that tab; cmd/ctrl/middle click still opens the page
  const openMenuFromLink = (e: React.MouseEvent<HTMLAnchorElement>, tab: MenuTab) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    setMenuTab(tab);
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out border-b border-transparent",
          isScrolled ? "bg-white/90 backdrop-blur-md border-hairline" : "bg-transparent"
        )}
      >
        <div className="container mx-auto px-4 md:px-6 grid grid-cols-[1fr_auto_1fr] items-center h-[var(--header-height)]">
          {/* Left: menu button on mobile, collection tabs on desktop */}
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden -ml-2"
              onClick={() => setMenuTab('women')}
              aria-label="Open menu"
              aria-haspopup="dialog"
              aria-expanded={menuTab !== null}
            >
              <List size={24} weight="bold" />
            </Button>

            <nav className="hidden md:flex items-center gap-7" aria-label="Collections">
              {MENU_TABS.map((tab) => (
                <Link
                  key={tab.id}
                  href={tab.href}
                  onClick={(e) => openMenuFromLink(e, tab.id)}
                  aria-haspopup="dialog"
                  aria-expanded={menuTab === tab.id}
                  className="group relative text-sm font-medium text-ink hover:text-accent-start transition-colors"
                >
                  {tab.label}
                  <span
                    className={cn(
                      "absolute -bottom-1 left-0 h-[2px] bg-gradient-accent transition-all duration-300",
                      menuTab === tab.id || pathname.startsWith(tab.href) ? "w-full" : "w-0 group-hover:w-full"
                    )}
                  />
                </Link>
              ))}
            </nav>
          </div>

          {/* Center: logo */}
          <div className="flex justify-center">
            <Logo compact={isScrolled} />
          </div>

          {/* Right: Journal, Events, search, cart, store */}
          <div className="flex items-center justify-end gap-1 md:gap-2">
            <nav className="hidden lg:flex items-center gap-6 mr-3" aria-label="More">
              {SECONDARY_LINKS.map((link) => (
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

            <Link href="/visit" className="hidden md:block ml-2">
              <Button variant="primary" size="sm" tabIndex={-1}>
                Visit Store
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <MenuDrawer
        tab={menuTab}
        onTabChange={setMenuTab}
        onClose={closeMenu}
        onSearch={openSearchFromMenu}
      />
      <CartSheet isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
