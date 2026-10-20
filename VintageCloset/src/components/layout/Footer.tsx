'use client';

import Link from 'next/link';
import { InstagramLogo, FacebookLogo, TiktokLogo, YoutubeLogo } from '@phosphor-icons/react';
import { SOCIAL_LINKS } from '@/lib/site';
import { Logo } from '@/components/ui/Logo';

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
            </ul>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-ink">Support</h4>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/terms" className="hover:text-accent-start transition-colors">Shipping & Returns</Link></li>
              <li><Link href="/visit" className="hover:text-accent-start transition-colors">Visit Store</Link></li>
              <li>
                <a 
                  href="mailto:vintage.closet.vienna@gmail.com"
                  className="hover:text-accent-start transition-colors"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Follow Us */}
          <div className="space-y-4">
            <h4 className="font-display font-bold text-ink">Follow Us</h4>
            <p className="text-sm text-muted">Stay updated on new arrivals and events.</p>
            <div className="flex items-center space-x-4">
              <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-muted hover:text-accent-start transition-colors"><InstagramLogo size={20} /></a>
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-muted hover:text-accent-start transition-colors"><YoutubeLogo size={20} /></a>
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="text-muted hover:text-accent-start transition-colors"><TiktokLogo size={20} /></a>
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-muted hover:text-accent-start transition-colors"><FacebookLogo size={20} /></a>
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


