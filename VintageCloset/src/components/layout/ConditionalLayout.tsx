'use client';

import { usePathname } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { NewsletterPopup } from '@/components/layout/NewsletterPopup';
import { SiteOpening } from '@/components/landing/SiteOpening';

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Admin and the team app bring their own layout
  const isAdmin = pathname.startsWith('/admin') || pathname.startsWith('/staff');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Launch intro on the home page, above the header (main is its own layer, so it cannot sit inside it) */}
      {pathname === '/' && <SiteOpening />}
      <Header />
      <main className="relative z-10 flex-1 pt-[var(--header-height)]">
        {children}
      </main>
      <Footer />
      <NewsletterPopup />
    </>
  );
}

