/**
 * Authentication utilities
 */
import crypto from 'crypto';

/**
 * Generate a secure random session token
 */
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get session token from cookie
 */
export function getSessionTokenFromCookie(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('pf_session='));
  
  if (!sessionCookie) return null;
  
  return sessionCookie.split('=')[1] || null;
}

