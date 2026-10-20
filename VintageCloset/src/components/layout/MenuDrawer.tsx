'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X,
  CaretRight,
  MagnifyingGlass,
  TShirt,
  Pants,
  CoatHanger,
  Dress,
  Sneaker,
  Hoodie,
  Handbag,
  Storefront,
} from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { CATEGORIES_BY_GENDER, type ProductGender } from '@/lib/product-categories';
import { getProducts, getDiscountedPrice, type Product } from '@/lib/data';

export type MenuTab = ProductGender;

export const MENU_TABS: { id: MenuTab; label: string; href: string }[] = [
  { id: 'women', label: 'Women', href: '/women' },
  { id: 'men', label: 'Men', href: '/men' },
  { id: 'unisex', label: 'Unisex', href: '/unisex' },
];

const same = <T,>(value: T): Record<MenuTab, T> => ({ women: value, men: value, unisex: value });

// Category groups of the menu; each tab only shows the categories its gender has
const GROUPS: { id: string; label: Record<MenuTab, string>; icon: Record<MenuTab, Icon>; categories: string[] }[] = [
  {
    id: 'tops',
    label: same('Tops'),
    icon: same(TShirt),
    categories: ['Tops', 'T-Shirts', 'Shirts', 'Blouses', 'Polos', 'Hoodies', 'Sweatshirts', 'Sweaters', 'Cardigans', 'Knitwear', 'Jerseys'],
  },
  {
    id: 'outerwear',
    label: same('Outerwear'),
    icon: same(CoatHanger),
    categories: ['Jackets', 'Coats', 'Blazers', 'Outerwear', 'Suits'],
  },
  {
    id: 'bottoms',
    label: same('Bottoms'),
    icon: same(Pants),
    categories: ['Jeans', 'Denim', 'Pants', 'Chinos', 'Shorts', 'Skirts'],
  },
  {
    id: 'more',
    label: { women: 'Dresses & More', men: 'Sport & More', unisex: 'Sets & More' },
    icon: { women: Dress, men: Sneaker, unisex: Hoodie },
    categories: ['Dresses', 'Sets', 'Tracksuits', 'Activewear', 'Loungewear', 'Swimwear', 'Lingerie', 'Underwear'],
  },
  {
    id: 'accessories',
    label: same('Accessories'),
    icon: same(Handbag),
    categories: ['Bags', 'Shoes', 'Footwear', 'Hats', 'Scarves', 'Jewelry', 'Watches', 'Accessories'],
  },
];

// Groups for one tab; categories that no group lists end up in "more"
function groupsFor(tab: MenuTab) {
  const available = CATEGORIES_BY_GENDER[tab];
  const grouped = new Set(GROUPS.flatMap(g => g.categories));
  const leftovers = available.filter(c => !grouped.has(c));

  return GROUPS.map(group => ({
    id: group.id,
    label: group.label[tab],
    icon: group.icon[tab],
    categories: [
      ...group.categories.filter(c => available.includes(c)),
      ...(group.id === 'more' ? leftovers : []),
    ],
  })).filter(group => group.categories.length > 0);
}

// Products are loaded once, the first time the menu opens
let productsPromise: Promise<Product[]> | null = null;
function loadProducts() {
  if (!productsPromise) {
    productsPromise = getProducts().catch(() => {
      productsPromise = null;
      return [];
    });
  }
  return productsPromise;
}

interface MenuDrawerProps {
  // Open tab, or null when the menu is closed
  tab: MenuTab | null;
  onTabChange: (tab: MenuTab) => void;
  onClose: () => void;
  onSearch: () => void;
}

export function MenuDrawer({ tab, onTabChange, onClose, onSearch }: MenuDrawerProps) {
  const isOpen = tab !== null;
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [direction, setDirection] = useState(1);
  const [isTouch] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  );

  // Load stock for counts and the "Just in" strip
  useEffect(() => {
    if (!isOpen || products) return;
    let alive = true;
    loadProducts().then(items => {
      if (alive) setProducts(items);
    });
    return () => {
      alive = false;
    };
  }, [isOpen, products]);

  // While open: lock page scroll, focus the active tab, Escape closes, Tab stays inside the menu
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      panelRef.current?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
    }, 60);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      ).filter(el => el.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', onKeyDown);
      root.style.overflow = previousOverflow;
      opener?.focus?.();
    };
  }, [isOpen, onClose]);

  const stock = useMemo(() => {
    if (!products || !tab) return null;
    const items = products.filter(p => p.gender === tab);
    const counts = new Map<string, number>();
    items.forEach(p => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    return { total: items.length, counts, newest: items.slice(0, 10) };
  }, [products, tab]);

  const switchTab = (next: MenuTab) => {
    if (!tab || next === tab) return;
    const order = MENU_TABS.map(t => t.id);
    setDirection(order.indexOf(next) > order.indexOf(tab) ? 1 : -1);
    onTabChange(next);
  };

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    if (!tab || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
    e.preventDefault();
    const order = MENU_TABS.map(t => t.id);
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = order[(order.indexOf(tab) + step + order.length) % order.length];
    switchTab(next);
    window.requestAnimationFrame(() => {
      panelRef.current?.querySelector<HTMLElement>(`#menu-tab-${next}`)?.focus();
    });
  };

  const activeTab = MENU_TABS.find(t => t.id === tab);

  return (
    <AnimatePresence>
      {isOpen && activeTab && (
        <div key="menu" className="fixed inset-0 z-[70]" data-lenis-prevent>
          {/* Blurred page behind the menu */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-white/20 backdrop-blur-xl"
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Shop menu"
            initial={reduceMotion ? { opacity: 0 } : { x: '-100%' }}
            animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { x: '-100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            drag={isTouch ? 'x' : false}
            dragDirectionLock
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={{ left: 0.5, right: 0 }}
            onDragEnd={(_, info) => {
              if (info.offset.x < -80 || info.velocity.x < -500) onClose();
            }}
            className="absolute inset-y-0 left-0 flex w-full flex-col bg-surface/80 backdrop-blur-[40px] backdrop-saturate-150 shadow-[0_0_60px_rgba(12,17,20,0.08)] sm:w-[420px] lg:w-[440px]"
          >
            {/* Tabs */}
            <div className="flex h-[var(--header-height)] shrink-0 items-end border-b border-ink/10 px-6 md:px-10">
              <div role="tablist" aria-label="Collections" className="flex gap-6" onKeyDown={onTabKeyDown}>
                {MENU_TABS.map(t => {
                  const selected = t.id === tab;
                  return (
                    <button
                      key={t.id}
                      id={`menu-tab-${t.id}`}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-controls="menu-tab-panel"
                      tabIndex={selected ? 0 : -1}
                      onClick={() => switchTab(t.id)}
                      className={cn(
                        'relative pb-3 text-sm transition-colors',
                        selected ? 'font-medium text-ink' : 'text-ink/70 hover:text-ink'
                      )}
                    >
                      {t.label}
                      {selected && (
                        <motion.span
                          layoutId="menu-tab-underline"
                          className="absolute inset-x-0 -bottom-px h-[2px] bg-ink"
                          transition={{ type: 'spring', damping: 30, stiffness: 400 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="mb-2 ml-auto rounded-full p-2 text-ink/70 transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div
              id="menu-tab-panel"
              role="tabpanel"
              aria-labelledby={`menu-tab-${activeTab.id}`}
              className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeTab.id}
                  initial={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -24 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                  className="px-6 pb-12 pt-8 md:px-10"
                >
                  <MenuContent
                    tab={activeTab}
                    stock={stock}
                    onNavigate={onClose}
                    onSearch={onSearch}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

interface MenuContentProps {
  tab: (typeof MENU_TABS)[number];
  stock: { total: number; counts: Map<string, number>; newest: Product[] } | null;
  onNavigate: () => void;
  onSearch: () => void;
}

function Count({ value }: { value?: number }) {
  if (!value) return null;
  return <sup className="ml-0.5 text-[10px] font-normal text-muted">{value}</sup>;
}

function MenuContent({ tab, stock, onNavigate, onSearch }: MenuContentProps) {
  // Before stock has loaded every category shows; afterwards only what is in stock
  const groups = groupsFor(tab.id)
    .map(group => ({
      ...group,
      categories: stock ? group.categories.filter(c => (stock.counts.get(c) || 0) > 0) : group.categories,
    }))
    .filter(group => group.categories.length > 0);

  const isEmpty = stock !== null && stock.total === 0;
  const bigLink = 'block w-fit text-[26px] font-medium leading-[1.15] tracking-tight text-ink transition-colors hover:text-brand-plum';
  const smallLink = 'block w-fit text-[17px] leading-snug text-ink transition-colors hover:text-brand-plum';

  return (
    <div className="space-y-10">
      {/* Search */}
      <button
        type="button"
        onClick={onSearch}
        className="flex w-full items-center gap-2.5 rounded-full bg-ink/[0.04] px-4 py-2.5 text-left text-sm text-muted transition-colors hover:bg-ink/[0.07]"
      >
        <MagnifyingGlass size={16} />
        Search the archive
      </button>

      <nav aria-label="Highlights" className="space-y-0.5">
        <Link href="/new-arrivals" onClick={onNavigate} className={bigLink}>New Arrivals</Link>
        <Link href="/journal" onClick={onNavigate} className={bigLink}>Journal</Link>
        <Link href="/events" onClick={onNavigate} className={bigLink}>Events</Link>
      </nav>

      <div className="space-y-8">
        <Link href={tab.href} onClick={onNavigate} className="block w-fit text-[19px] font-medium tracking-tight text-ink transition-colors hover:text-brand-plum">
          Shop All {tab.label}
          <Count value={stock?.total} />
        </Link>

        {isEmpty ? (
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            New {tab.label.toLowerCase()} pieces are on their way. Have a look at the{' '}
            <Link href="/new-arrivals" onClick={onNavigate} className="text-ink underline underline-offset-2">new arrivals</Link>{' '}
            in the meantime.
          </p>
        ) : (
          groups.map(group => {
            const GroupIcon = group.icon;
            const groupHref = `${tab.href}?category=${encodeURIComponent(group.categories.join(','))}`;
            return (
              <div key={group.id}>
                <Link
                  href={groupHref}
                  onClick={onNavigate}
                  className="group mb-3 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
                >
                  <GroupIcon size={18} weight="fill" className="text-brand-teal" />
                  Shop {group.label}
                  <CaretRight size={11} weight="bold" className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <ul className="grid grid-cols-2 gap-x-6 gap-y-1">
                  {group.categories.map(category => (
                    <li key={category}>
                      <Link
                        href={`${tab.href}?category=${encodeURIComponent(category)}`}
                        onClick={onNavigate}
                        className={smallLink}
                      >
                        {category}
                        <Count value={stock?.counts.get(category)} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}

        {stock && !isEmpty && (
          <p className="text-xs text-muted">Only what is in stock. Every piece is one of a kind.</p>
        )}
      </div>

      <nav aria-label="Store" className="space-y-1.5">
        <Link href="/visit" onClick={onNavigate} className="flex w-fit items-center gap-2 text-[17px] font-medium tracking-tight text-ink transition-colors hover:text-brand-plum">
          <Storefront size={18} weight="fill" className="text-brand-teal" />
          Visit the Store
        </Link>
        <Link href="/terms" onClick={onNavigate} className={smallLink}>Shipping &amp; Terms</Link>
      </nav>

      {/* Newest pieces of this tab */}
      {(stock === null || stock.newest.length > 0) && (
        <div>
          <p className="mb-4 text-[17px] font-medium tracking-tight text-ink">
            Just in
            <Count value={stock?.newest.length} />
          </p>
          {stock === null ? (
            <div className="flex gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] w-[104px] shrink-0 animate-pulse rounded-md bg-ink/[0.06]" />
              ))}
            </div>
          ) : (
            <JustInMarquee products={stock.newest} onNavigate={onNavigate} />
          )}
        </div>
      )}
    </div>
  );
}

// Endless sliding row with faded edges; pauses on hover or keyboard focus
function JustInMarquee({ products, onNavigate }: { products: Product[]; onNavigate: () => void }) {
  // Repeat the set until one half is wider than the menu, then render it twice for a seamless loop
  const repeats = Math.max(1, Math.ceil(6 / products.length));
  const half = Array.from({ length: repeats }, () => products).flat();
  const items = [...half, ...half];

  return (
    <div
      className="marquee-fade -mx-6 overflow-hidden md:-mx-10"
      onPointerDownCapture={e => e.stopPropagation()}
    >
      <div
        className="marquee-track flex w-max"
        style={{ animationDuration: `${half.length * 4}s` }}
      >
        {items.map((product, i) => (
          <Link
            key={`${product.id}-${i}`}
            href={`/product/${product.slug}`}
            onClick={onNavigate}
            aria-hidden={i >= half.length}
            tabIndex={i >= half.length ? -1 : undefined}
            className="group mr-3 w-[104px] shrink-0"
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-ink/[0.06]">
              {product.image && (
                <Image
                  src={product.image}
                  alt={i >= half.length ? '' : product.title}
                  fill
                  sizes="104px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
            </div>
            <p className="mt-1.5 truncate text-xs text-ink">{product.title}</p>
            <p className="text-xs text-muted">
              {product.discount ? getDiscountedPrice(product.price, product.discount) : product.price}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
