'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  House, 
  Package, 
  Notebook, 
  CalendarBlank, 
  Images,
  SignOut,
  List,
  X
} from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/Logo';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: House },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/journal', label: 'Journal', icon: Notebook },
  { href: '/admin/events', label: 'Events', icon: CalendarBlank },
  { href: '/admin/media', label: 'Site Images', icon: Images },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-ink/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 h-full w-64 bg-ink z-50 flex flex-col transition-transform duration-300 lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <Logo className="h-6 w-auto text-white" />
            <span className="text-white font-bold text-sm">Admin</span>
          </Link>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-white/60 hover:text-white transition-colors"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive 
                    ? "bg-gradient-to-r from-accent-start to-accent-end text-white shadow-lg shadow-accent-start/20" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={20} weight={isActive ? "fill" : "regular"} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-white/10">
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <SignOut size={20} />
            Exit Admin
          </Link>
        </div>
      </aside>
    </>
  );
}

export function AdminMobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-ink z-30 flex items-center justify-between px-4">
      <button 
        onClick={onMenuClick}
        className="p-2 text-white/60 hover:text-white transition-colors"
      >
        <List size={24} weight="bold" />
      </button>
      <Link href="/admin" className="flex items-center gap-2">
        <Logo className="h-6 w-auto text-white" />
        <span className="text-white font-bold text-sm">Admin</span>
      </Link>
      <div className="w-10" /> {/* Spacer for centering */}
    </header>
  );
}

