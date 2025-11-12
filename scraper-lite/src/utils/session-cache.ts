/**
 * Session Cache for Login Credentials
 * Caches session cookies to avoid re-logging in for every request
 */

interface CachedSession {
  cookies: Record<string, string>;
  expiresAt: number; // Timestamp when session expires
  institution: string;
}

const sessionCache = new Map<string, CachedSession>();

/**
 * Get cached session for an institution
 */
export function getCachedSession(institution: string): Record<string, string> | null {
  const cached = sessionCache.get(institution);
  if (!cached) return null;
  
  // Check if session expired (default: 1 hour)
  if (Date.now() > cached.expiresAt) {
    sessionCache.delete(institution);
    return null;
  }
  
  return cached.cookies;
}

/**
 * Cache session for an institution
 */
export function cacheSession(
  institution: string,
  cookies: Record<string, string>,
  ttlMinutes: number = 60 // Default: 1 hour
): void {
  sessionCache.set(institution, {
    cookies,
    expiresAt: Date.now() + (ttlMinutes * 60 * 1000),
    institution
  });
}

/**
 * Clear cached session for an institution
 */
export function clearSession(institution: string): void {
  sessionCache.delete(institution);
}

/**
 * Clear all cached sessions
 */
export function clearAllSessions(): void {
  sessionCache.clear();
}

/**
 * Get all active sessions
 */
export function getActiveSessions(): string[] {
  const now = Date.now();
  const active: string[] = [];
  
  for (const [institution, session] of sessionCache.entries()) {
    if (now < session.expiresAt) {
      active.push(institution);
    } else {
      sessionCache.delete(institution);
    }
  }
  
  return active;
}

