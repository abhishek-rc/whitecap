// src/lib/visitorId.ts
// Utility to generate and persist a unique visitorId for the session (browser)

/**
 * Get or create a unique visitorId for the current browser session.
 * Falls back to 'anonymous-user' in SSR or non-browser environments.
 */
import { v4 as uuidv4 } from 'uuid';

export function getOrCreateVisitorId(): string {
  // SSR or non-browser fallback
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 'anonymous-user';
  }

  let visitorId = null;
  try {
    visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
      visitorId = uuidv4();
      localStorage.setItem('visitorId', visitorId);
    }
  } catch (e) {
    // localStorage might be unavailable (private mode, etc.)
    return 'anonymous-user';
  }
  return visitorId;
}
