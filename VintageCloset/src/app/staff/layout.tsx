import type { Metadata, Viewport } from 'next';
import { StaffApp } from '@/components/staff/StaffApp';

export const metadata: Metadata = {
  title: 'Team | Vintage Closet',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'VC Team', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#F5F7F8',
  viewportFit: 'cover',
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <StaffApp>{children}</StaffApp>;
}
