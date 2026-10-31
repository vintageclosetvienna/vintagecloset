'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { viennaToday } from './db';

// The working day (Vienna date). Everything in the team app hangs on it: when the day changes (laptop left open
// overnight, or the first open on a new day), every page loads again, the timeline starts empty and the app asks
// who is working today.
const DAY_KEY = 'vc-staff-day';

interface WorkdayValue {
  day: string;
  /** true on the first open of a new working day, until the welcome is dismissed */
  freshDay: boolean;
  dismissFresh: () => void;
}

const Ctx = createContext<WorkdayValue | null>(null);

function readStoredDay(): string {
  try {
    return window.localStorage.getItem(DAY_KEY) || '';
  } catch {
    return '';
  }
}

function storeDay(day: string) {
  try {
    window.localStorage.setItem(DAY_KEY, day);
  } catch {
    /* storage blocked: the day still changes while the app is open */
  }
}

export function WorkdayProvider({ children }: { children: ReactNode }) {
  const [day, setDay] = useState(viennaToday);
  const [freshDay, setFresh] = useState(() => {
    const stored = readStoredDay();
    return stored !== '' && stored !== viennaToday();
  });
  const current = useRef(day);

  useEffect(() => storeDay(day), [day]);

  // Look at the clock every minute and whenever the app comes back to the screen
  useEffect(() => {
    const check = () => {
      const now = viennaToday();
      if (now === current.current) return;
      current.current = now;
      setDay(now);
      setFresh(true);
    };
    const onVisible = () => document.visibilityState === 'visible' && check();
    const id = window.setInterval(check, 60_000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const dismissFresh = useCallback(() => setFresh(false), []);
  return <Ctx.Provider value={{ day, freshDay, dismissFresh }}>{children}</Ctx.Provider>;
}

/** The working day; outside the team app it is simply today */
export function useDay(): string {
  return useContext(Ctx)?.day ?? viennaToday();
}

export function useWorkday(): WorkdayValue {
  return useContext(Ctx) ?? { day: viennaToday(), freshDay: false, dismissFresh: () => {} };
}
