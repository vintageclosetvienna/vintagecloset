'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@phosphor-icons/react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

interface AuthGuardProps {
  children: React.ReactNode;
}

type Access = 'checking' | 'allowed' | 'staff' | 'denied';

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  // Role check result, tied to the user it was made for
  const [checked, setChecked] = useState<{ userId: string; access: Access } | null>(null);
  const access: Access = checked && checked.userId === user?.id ? checked.access : 'checking';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Only owners and managers may use the full admin area
  useEffect(() => {
    const userId = user?.id;
    if (!isAuthenticated || !userId) return;
    let cancelled = false;
    supabase.rpc('my_staff_profile' as never).then(({ data, error }) => {
      if (cancelled) return;
      const row = Array.isArray(data) ? (data[0] as { role?: string } | undefined) : undefined;
      let result: Access = 'denied';
      if (!error && row) {
        if (row.role === 'owner' || row.role === 'manager') result = 'allowed';
        else if (row.role === 'staff') result = 'staff';
      }
      setChecked({ userId, access: result });
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (access === 'staff') router.replace('/staff');
  }, [access, router]);

  if (isLoading || (isAuthenticated && access === 'checking') || access === 'staff') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="text-center">
          <Spinner size={32} className="animate-spin text-accent-start mx-auto mb-4" />
          <p className="text-muted text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7]">
        <div className="text-center">
          <Spinner size={32} className="animate-spin text-accent-start mx-auto mb-4" />
          <p className="text-muted text-sm">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  if (access === 'denied') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f7] px-6">
        <div className="max-w-sm text-center space-y-4">
          <p className="text-lg font-semibold text-ink">No access to the admin area</p>
          <p className="text-muted text-sm">
            This account is not on the shop team list. Ask the owner to add it.
          </p>
          <button
            onClick={async () => {
              await signOut();
              router.push('/admin/login');
            }}
            className="px-4 py-2 rounded-md bg-ink text-white text-sm"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
