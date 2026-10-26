import { useSyncExternalStore } from 'react';

// Tells the home page hero when the launch intro has finished (or was skipped), so the photo deck deals in after it
let done = false;
const listeners = new Set<() => void>();

export function markOpeningDone() {
  if (done) return;
  done = true;
  listeners.forEach(l => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useOpeningDone(): boolean {
  return useSyncExternalStore(subscribe, () => done, () => false);
}

/** Shared rule (also run inline before first paint): skip for this session, reduced motion, bots and automated browsers;
 *  the inline copy also hides the stage after 7 s, so a failed script can never leave it covering the shop */
export const OPENING_SESSION_KEY = 'vc-opening-played';
export const OPENING_SKIP_SCRIPT = `(function(){try{var n=navigator,s=window.sessionStorage;if(s.getItem('${OPENING_SESSION_KEY}')||n.webdriver||/bot|crawl|spider|slurp|lighthouse|headless|preview/i.test(n.userAgent)||window.matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.setAttribute('data-vc-intro','skip')}}catch(e){document.documentElement.setAttribute('data-vc-intro','skip')}setTimeout(function(){document.documentElement.setAttribute('data-vc-intro','skip')},7000)})();`;

export function shouldSkipOpening(): boolean {
  if (typeof window === 'undefined') return false;
  if (document.documentElement.getAttribute('data-vc-intro') === 'skip') return true;
  try {
    const n = navigator;
    return Boolean(
      window.sessionStorage.getItem(OPENING_SESSION_KEY) ||
        n.webdriver ||
        /bot|crawl|spider|slurp|lighthouse|headless|preview/i.test(n.userAgent) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  } catch {
    return true;
  }
}
