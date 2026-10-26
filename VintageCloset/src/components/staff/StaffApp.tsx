'use client';

import { ReactNode, useSyncExternalStore } from 'react';
import { StaffI18nProvider } from '@/lib/staff/i18n';
import { StaffSessionProvider } from '@/lib/staff/session';
import { StaffShell } from './Shell';
import { Spinner, ToastProvider } from './ui';

const noop = () => () => {};

/** Client-only team app: language and login live in this browser, so nothing renders on the server */
export function StaffApp({ children }: { children: ReactNode }) {
  const mounted = useSyncExternalStore(noop, () => true, () => false);
  if (!mounted) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-surface">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  return (
    <StaffI18nProvider>
      <StaffSessionProvider>
        <ToastProvider>
          <StaffShell>{children}</StaffShell>
        </ToastProvider>
      </StaffSessionProvider>
    </StaffI18nProvider>
  );
}
