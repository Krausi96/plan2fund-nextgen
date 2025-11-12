/**
 * Usage Tracking System
 * Tracks user usage for freemium limits (plans, PDF exports, AI requests)
 * Based on Phase 1.3 implementation plan
 */

export interface UsageLimits {
  plans: number;
  pdf_exports: number;
  ai_requests: number;
}

export interface UsageCounts {
  plans: number;
  pdf_exports: number;
  ai_requests: number;
  lastResetDate: string; // ISO date string
}

export interface TierLimits {
  free: UsageLimits;
  premium: UsageLimits;
  enterprise: UsageLimits;
}

// Define limits per tier
export const TIER_LIMITS: TierLimits = {
  free: {
    plans: 2,
    pdf_exports: 1,
    ai_requests: 10
  },
  premium: {
    plans: 10,
    pdf_exports: 5,
    ai_requests: 100
  },
  enterprise: {
    plans: Infinity,
    pdf_exports: Infinity,
    ai_requests: Infinity
  }
};

/**
 * Get limits for a subscription tier
 */
export function getLimitsForTier(tier: 'free' | 'premium' | 'enterprise'): UsageLimits {
  return TIER_LIMITS[tier];
}

/**
 * Check if user can perform an action (client-side check)
 */
export function canPerformAction(
  action: 'create_plan' | 'export_pdf' | 'ai_request',
  currentUsage: UsageCounts,
  tier: 'free' | 'premium' | 'enterprise'
): { allowed: boolean; reason?: string } {
  const limits = getLimitsForTier(tier);
  
  // Check if monthly reset is needed
  const lastReset = new Date(currentUsage.lastResetDate);
  const now = new Date();
  const needsReset = now.getMonth() !== lastReset.getMonth() || 
                     now.getFullYear() !== lastReset.getFullYear();
  
  // Reset counts if new month
  const usage = needsReset ? {
    plans: 0,
    pdf_exports: 0,
    ai_requests: 0,
    lastResetDate: now.toISOString()
  } : currentUsage;
  
  switch (action) {
    case 'create_plan':
      if (usage.plans >= limits.plans) {
        return {
          allowed: false,
          reason: `Plan limit reached (${usage.plans}/${limits.plans}). Upgrade to create more plans.`
        };
      }
      break;
      
    case 'export_pdf':
      if (usage.pdf_exports >= limits.pdf_exports) {
        return {
          allowed: false,
          reason: `PDF export limit reached (${usage.pdf_exports}/${limits.pdf_exports}). Upgrade for more exports.`
        };
      }
      break;
      
    case 'ai_request':
      if (usage.ai_requests >= limits.ai_requests) {
        return {
          allowed: false,
          reason: `AI request limit reached (${usage.ai_requests}/${limits.ai_requests}). Upgrade for more AI requests.`
        };
      }
      break;
  }
  
  return { allowed: true };
}

/**
 * Track usage (call this after action is performed)
 */
export async function trackUsage(
  userId: string,
  action: 'create_plan' | 'export_pdf' | 'ai_request'
): Promise<void> {
  try {
    const response = await fetch('/api/usage/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action })
    });
    
    if (!response.ok) {
      console.error('Failed to track usage:', response.statusText);
    }
  } catch (error) {
    console.error('Error tracking usage:', error);
    // Non-fatal: continue even if tracking fails
  }
}

/**
 * Get current usage for a user
 */
export async function getUsage(userId: string): Promise<UsageCounts | null> {
  try {
    const response = await fetch(`/api/usage/${userId}`);
    
    if (!response.ok) {
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching usage:', error);
    return null;
  }
}

/**
 * Get usage display string
 */
export function getUsageDisplay(
  action: 'create_plan' | 'export_pdf' | 'ai_request',
  currentUsage: UsageCounts,
  tier: 'free' | 'premium' | 'enterprise'
): string {
  const limits = getLimitsForTier(tier);
  
  let used: number;
  let limit: number;
  
  switch (action) {
    case 'create_plan':
      used = currentUsage.plans;
      limit = limits.plans;
      break;
    case 'export_pdf':
      used = currentUsage.pdf_exports;
      limit = limits.pdf_exports;
      break;
    case 'ai_request':
      used = currentUsage.ai_requests;
      limit = limits.ai_requests;
      break;
  }
  
  if (limit === Infinity) {
    return `${used} used (unlimited)`;
  }
  
  return `${used} / ${limit}`;
}



