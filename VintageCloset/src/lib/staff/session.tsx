'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { db, StaffProfile, Shift } from './db';
import { useDay } from './workday';

const WORKER_KEY = 'vc-staff-worker';
// The day the name was given: each new working day asks again who is working
const WORKER_DAY_KEY = 'vc-staff-worker-day';
const MANAGER_IDLE_MS = 10 * 60 * 1000;

interface StaffSessionValue {
  ready: boolean;
  session: Session | null;
  profile: StaffProfile | null;
  isManager: boolean;
  worker: string;
  /** Who worked last time, offered as a one-tap choice on a new day */
  lastWorker: string;
  setWorker: (name: string) => void;
  shift: Shift | null;
  startShift: () => Promise<void>;
  endShift: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<'ok' | 'bad-login' | 'not-team'>;
  signOut: () => Promise<void>;
  unlockManager: (email: string, password: string) => Promise<'ok' | 'bad-login' | 'not-manager'>;
  lockManager: () => Promise<void>;
}

const Ctx = createContext<StaffSessionValue | null>(null);

function readLastWorker(): string {
  try {
    return window.localStorage.getItem(WORKER_KEY) || '';
  } catch {
    return '';
  }
}

/** The name, only if it was given on this working day */
function readWorker(day: string): string {
  try {
    return window.localStorage.getItem(WORKER_DAY_KEY) === day ? readLastWorker() : '';
  } catch {
    return '';
  }
}

async function loadProfile(): Promise<StaffProfile | null> {
  const { data, error } = await db.rpc('my_staff_profile');
  if (error || !Array.isArray(data) || data.length === 0) return null;
  return data[0] as StaffProfile;
}

// Like loadProfile, but tells a network/token hiccup apart from "not on the team" and retries the hiccup once
async function fetchProfile(): Promise<{ profile: StaffProfile | null; failed: boolean }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const { data, error } = await db.rpc('my_staff_profile');
    if (!error) return { profile: Array.isArray(data) && data.length ? (data[0] as StaffProfile) : null, failed: false };
    await new Promise((r) => window.setTimeout(r, 1200));
  }
  return { profile: null, failed: true };
}

/** The running shift of this working day; a shift left open on an earlier day does not carry over */
async function loadOpenShift(worker: string, day: string): Promise<Shift | null> {
  const startOfDay = new Date(`${day}T00:00:00`).toISOString();
  let query = db.from('staff_shifts').select('*').is('ended_at', null).gte('started_at', startOfDay).order('started_at', { ascending: false }).limit(1);
  if (worker) query = query.eq('worker_name', worker);
  const { data } = await query;
  return (data?.[0] as Shift) ?? null;
}

export function StaffSessionProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const day = useDay();
  const [worker, setWorkerState] = useState<string>(() => readWorker(day));
  const [lastWorker, setLastWorker] = useState<string>(readLastWorker);
  // A new working day while the app is open: ask again who is working
  const [workerDay, setWorkerDay] = useState(day);
  if (workerDay !== day) {
    setWorkerDay(day);
    setWorkerState(readWorker(day));
  }
  const [shift, setShift] = useState<Shift | null>(null);
  // The team session saved while the manager is unlocked, so locking returns to it without a new login
  const savedTeamSession = useRef<{ access_token: string; refresh_token: string } | null>(null);

  // Session and profile.
  // Supabase re-announces the login whenever the window gets focus again (SIGNED_IN / TOKEN_REFRESHED). For the
  // same person only the session is updated: reloading the profile each time could fail right after a window
  // switch or wake-up, empty the profile and throw the whole app back to the login screen.
  const profileUserId = useRef<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const apply = async (s: Session | null) => {
      const userId = s?.user.id ?? null;
      if (userId && userId === profileUserId.current) {
        setSession(s);
        return;
      }
      const { profile: p } = s ? await fetchProfile() : { profile: null };
      if (cancelled) return;
      setSession(s);
      profileUserId.current = p ? userId : null;
      setProfile(p);
      setReady(true);
    };
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Run outside the auth callback; awaiting Supabase inside it can deadlock
      window.setTimeout(() => apply(s), 0);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Open shift for the person working
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    loadOpenShift(worker, day).then((s) => {
      if (!cancelled) setShift(s);
    });
    return () => {
      cancelled = true;
    };
  }, [profile, worker, day]);

  const isManager = profile?.role === 'owner' || profile?.role === 'manager';

  const setWorker = useCallback((name: string) => {
    const clean = name.trim().slice(0, 40);
    setWorkerState(clean);
    if (clean) setLastWorker(clean);
    try {
      if (clean) window.localStorage.setItem(WORKER_KEY, clean);
      window.localStorage.setItem(WORKER_DAY_KEY, clean ? day : '');
    } catch {
      /* storage blocked */
    }
  }, [day]);

  const startShift = useCallback(async () => {
    const { data, error } = await db
      .from('staff_shifts')
      .insert({ worker_name: worker || null })
      .select()
      .single();
    if (!error) setShift(data as Shift);
  }, [worker]);

  const endShift = useCallback(async () => {
    if (!shift) return;
    const { error } = await db.from('staff_shifts').update({ ended_at: new Date().toISOString() }).eq('id', shift.id);
    if (!error) setShift(null);
  }, [shift]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) return 'bad-login' as const;
    const p = await loadProfile();
    if (!p || p.role === 'studio') {
      await supabase.auth.signOut();
      return 'not-team' as const;
    }
    return 'ok' as const;
  }, []);

  const signOut = useCallback(async () => {
    savedTeamSession.current = null;
    await supabase.auth.signOut();
  }, []);

  const unlockManager = useCallback(async (email: string, password: string) => {
    const { data: current } = await supabase.auth.getSession();
    const team = current.session;
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      // Wrong password: the team session stays as it was
      if (team) await supabase.auth.setSession({ access_token: team.access_token, refresh_token: team.refresh_token });
      return 'bad-login' as const;
    }
    const p = await loadProfile();
    if (!p || (p.role !== 'owner' && p.role !== 'manager')) {
      if (team) await supabase.auth.setSession({ access_token: team.access_token, refresh_token: team.refresh_token });
      else await supabase.auth.signOut();
      return 'not-manager' as const;
    }
    savedTeamSession.current = team ? { access_token: team.access_token, refresh_token: team.refresh_token } : null;
    return 'ok' as const;
  }, []);

  const lockManager = useCallback(async () => {
    const team = savedTeamSession.current;
    savedTeamSession.current = null;
    if (team) {
      const { error } = await supabase.auth.setSession(team);
      if (!error) return;
    }
    await supabase.auth.signOut();
  }, []);

  // Manager mode locks itself after 10 minutes without activity
  useEffect(() => {
    if (!isManager || !savedTeamSession.current) return;
    let timer = window.setTimeout(() => lockManager(), MANAGER_IDLE_MS);
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => lockManager(), MANAGER_IDLE_MS);
    };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [isManager, lockManager]);

  return (
    <Ctx.Provider
      value={{
        ready,
        session,
        profile,
        isManager,
        worker,
        lastWorker,
        setWorker,
        shift,
        startShift,
        endShift,
        signIn,
        signOut,
        unlockManager,
        lockManager,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStaff() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStaff must be used inside StaffSessionProvider');
  return ctx;
}
