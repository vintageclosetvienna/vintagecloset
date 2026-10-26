import type { Metadata, Viewport } from 'next';
import { StaffApp } from '@/components/staff/StaffApp';

export const metadata: Metadata = {
  title: 'Team | Vintage Closet',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'VC Team', statusBarStyle: 'default' },
  // Lets Edge/Chrome on Windows and Mac install the team app as its own window ("Install VC Team")
  manifest: '/team-app.webmanifest', // outside /staff: the browser check there would block the manifest
  icons: { apple: '/brand/app-icon-192.png' },
};

export const viewport: Viewport = {
  themeColor: '#F5F7F8',
  viewportFit: 'cover',
};

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <StaffApp>{children}</StaffApp>;
}
