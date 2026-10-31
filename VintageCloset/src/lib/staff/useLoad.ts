'use client';

import { useCallback, useEffect, useState } from 'react';
import { useDay } from './workday';

/** Loads data once (and again after reload() or when a new working day starts), without setting state synchronously inside the effect */
export function useLoad<T>(loader: () => PromiseLike<T>, deps: unknown[] = []) {
  const [state, setState] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true,
  });
  const [version, setVersion] = useState(0);
  const day = useDay();

  useEffect(() => {
    let cancelled = false;
    Promise.resolve(loader())
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false });
      })
      .catch((e: unknown) => {
        if (!cancelled) setState((prev) => ({ data: prev.data, error: e instanceof Error ? e.message : String(e), loading: false }));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, day, ...deps]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  return { ...state, reload };
}

/** Throws the Supabase error so useLoad can show it */
export function must<T>(res: { data: unknown; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return (res.data ?? ([] as unknown)) as T;
}
