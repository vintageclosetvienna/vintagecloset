// When this browser last looked at the drafts (31 Oct, his ask: after signing in, a note pops up when new drafts arrived from the Mac).
// A draft counts as new when it was sent (or sent again) after that moment.

const KEY = 'vc.draftsSeen';

export function draftsSeenAt(): number {
  try {
    return Number(localStorage.getItem(KEY) || 0);
  } catch {
    return 0;
  }
}

export function markDraftsSeen(at = Date.now()): void {
  try {
    localStorage.setItem(KEY, String(Math.max(at, draftsSeenAt())));
  } catch {
    /* private mode: the note simply shows again */
  }
}

export const sentAt = (d: { updated_at?: string | null; created_at?: string | null }) => new Date(d.updated_at || d.created_at || 0).getTime();
