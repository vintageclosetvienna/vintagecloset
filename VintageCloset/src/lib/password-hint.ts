// Password hint for the admin login, kept only in this browser (never on the server, never the password itself)
const key = (email: string) => `vc-admin-hint:${email.trim().toLowerCase()}`;

export function readHint(email: string): string {
  if (!email.trim()) return '';
  try {
    return window.localStorage.getItem(key(email)) || '';
  } catch {
    return '';
  }
}

export function saveHint(email: string, hint: string) {
  try {
    if (hint.trim()) window.localStorage.setItem(key(email), hint.trim().slice(0, 80));
    else window.localStorage.removeItem(key(email));
  } catch {
    /* storage blocked */
  }
}
