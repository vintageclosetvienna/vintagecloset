'use client';

import Link from 'next/link';
import { ArrowRight, InstagramLogo, FacebookLogo, TiktokLogo } from '@phosphor-icons/react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-hairline pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-4">
            <Logo />
            <p className="text-muted text-sm leading-relaxed max-w-xs">
              Curated vintage clothing for the modern wardrobe. 
              Based in Vienna, shipping worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-ink">Shop</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/women" className="hover:text-accent-start transition-colors">Women</Link></li>
              <li><Link href="/men" className="hover:text-accent-start transition-colors">Men</Link></li>
              <li><Link href="/unisex" className="hover:text-accent-start transition-colors">Unisex</Link></li>
              <li><Link href="/new-arrivals" className="hover:text-accent-start transition-colors">New Arrivals</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-ink">Support</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/faq" className="hover:text-accent-start transition-colors">FAQ</Link></li>
              <li><Link href="/shipping" className="hover:text-accent-start transition-colors">Shipping & Returns</Link></li>
              <li><Link href="/visit" className="hover:text-accent-start transition-colors">Visit Store</Link></li>
              <li><Link href="/contact" className="hover:text-accent-start transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-ink">Newsletter</h4>
            <p className="text-sm text-muted">First dibs on drops and events.</p>
            <form className="relative flex items-center">
              <input 
                type="email" 
                placeholder="Email address" 
                className="w-full bg-transparent border-b border-hairline py-2 text-sm text-ink focus:outline-none focus:border-accent-start transition-colors placeholder:text-muted/50"
              />
              <button type="button" className="absolute right-0 p-2 text-ink hover:text-accent-start transition-colors">
                <ArrowRight size={16} />
              </button>
            </form>
            <div className="flex items-center space-x-4 pt-2">
              <a href="https://www.instagram.com/vintage_closet_vienna" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent-start transition-colors"><InstagramLogo size={20} /></a>
              <a href="https://www.tiktok.com/@vintage_closet_vienna" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent-start transition-colors"><TiktokLogo size={20} /></a>
              <a href="https://www.facebook.com/profile.php?id=61567529122786" target="_blank" rel="noopener noreferrer" className="text-muted hover:text-accent-start transition-colors"><FacebookLogo size={20} /></a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-hairline flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted">
          <p>&copy; {new Date().getFullYear()} Vintage Closet Vienna. All rights reserved.</p>
          <div className="flex space-x-6">
            <Link href="/privacy" className="hover:text-ink">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ink">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}


