// Comprehensive Analytics Implementation
interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  timestamp?: string;
}


class Analytics {
  private userId: string = '';
  private sessionId: string = '';
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Generate session ID if not exists
    if (typeof window !== 'undefined') {
      this.sessionId = localStorage.getItem('pf_session_id') || this.generateSessionId();
      localStorage.setItem('pf_session_id', this.sessionId);
      this.isInitialized = true;
    }
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  private async sendEvent(event: AnalyticsEvent) {
    if (!this.isInitialized) return;

    try {
      // Send to internal API
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...event,
          userId: this.userId || undefined,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString(),
        }),
      });

      // Send to Google Analytics 4 (if available)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', event.event, {
          ...event.properties,
          user_id: this.userId,
          session_id: this.sessionId,
        });
      }

      // Console log for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Analytics event:', event);
      }
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  setUserId(userId: string) {
    this.userId = userId;
    
    // Set user ID in Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        user_id: userId,
      });
    }
  }

  // Core tracking methods
  async trackEvent(event: AnalyticsEvent) {
    await this.sendEvent(event);
  }

  async trackPageView(page: string, title?: string) {
    await this.sendEvent({
      event: 'page_view',
      properties: {
        page,
        title: title || page,
      },
    });
  }

  async trackUserAction(action: string, properties?: Record<string, any>) {
    await this.sendEvent({
      event: 'user_action',
      properties: {
        action,
        ...properties,
      },
    });
  }

  // Business-specific tracking methods
  async trackWizardStart(mode: string) {
    await this.sendEvent({
      event: 'wizard_started',
      properties: {
        mode,
        user_type: this.getUserType(),
      },
    });
  }

  async trackWizardComplete(answers: any, recommendations: any) {
    await this.sendEvent({
      event: 'wizard_completed',
      properties: {
        answers_count: Object.keys(answers).length,
        recommendations_count: recommendations?.length || 0,
        user_type: this.getUserType(),
        completion_time: this.getCompletionTime(),
      },
    });
  }

  async trackOnboardingComplete(profile: any) {
    await this.sendEvent({
      event: 'onboarding_completed',
      properties: {
        user_type: profile.segment,
        user_id: profile.id,
        onboarding_time: this.getCompletionTime(),
      },
    });
  }

  trackEditorStart(type: string, programId?: string) {
    this.sendEvent({
      event: 'editor_started',
      properties: {
        editor_type: type,
        program_id: programId,
        user_type: this.getUserType(),
      },
    });
  }

  trackEditorComplete(planId: string, completionPercentage: number, wordCount: number) {
    this.sendEvent({
      event: 'editor_completed',
      properties: {
        plan_id: planId,
        completion_percentage: completionPercentage,
        word_count: wordCount,
        user_type: this.getUserType(),
      },
    });
  }

  trackEditorSectionEdit(sectionId: string, sectionTitle: string, wordCount: number) {
    this.sendEvent({
      event: 'editor_section_edited',
      properties: {
        section_id: sectionId,
        section_title: sectionTitle,
        word_count: wordCount,
        user_type: this.getUserType(),
      },
    });
  }

  async trackTestimonialSubmit(planId: string, rating: number) {
    await this.sendEvent({
      event: 'testimonial_submitted',
      properties: {
        plan_id: planId,
        rating,
        user_type: this.getUserType(),
      },
    });
  }

  trackSuccessHubView(planId: string) {
    this.sendEvent({
      event: 'success_hub_viewed',
      properties: {
        plan_id: planId,
        user_type: this.getUserType(),
      },
    });
  }

  trackNextStepClick(stepId: string, planId: string) {
    this.sendEvent({
      event: 'next_step_clicked',
      properties: {
        step_id: stepId,
        plan_id: planId,
        user_type: this.getUserType(),
      },
    });
  }

  async trackGapTicketCreated(reason: string, data: any) {
    await this.sendEvent({
      event: 'gap_ticket_created',
      properties: {
        reason,
        data,
        user_type: this.getUserType(),
      },
    });
  }

  async trackError(error: Error, context: string) {
    await this.sendEvent({
      event: 'error_occurred',
      properties: {
        error_message: error.message,
        error_stack: error.stack,
        context,
        user_type: this.getUserType(),
      },
    });
  }

  // Conversion tracking
  async trackConversion(conversionType: string, value?: number, currency?: string) {
    await this.sendEvent({
      event: 'conversion',
      properties: {
        conversion_type: conversionType,
        value,
        currency: currency || 'EUR',
        user_type: this.getUserType(),
      },
    });
  }

  // Engagement tracking
  async trackEngagement(action: string, duration?: number) {
    await this.sendEvent({
      event: 'engagement',
      properties: {
        action,
        duration,
        user_type: this.getUserType(),
      },
    });
  }

  // Helper methods
  private getUserType(): string {
    if (typeof window !== 'undefined') {
      const profile = localStorage.getItem('pf_user_profile');
      if (profile) {
        try {
          const parsed = JSON.parse(profile);
          return parsed.segment || 'unknown';
        } catch {
          return 'unknown';
        }
      }
    }
    return 'unknown';
  }

  private getCompletionTime(): number {
    // This would be calculated based on when the process started
    // For now, return a placeholder
    return Date.now();
  }

  // GDPR compliance
  async trackConsentGiven(consentType: string) {
    await this.sendEvent({
      event: 'consent_given',
      properties: {
        consent_type: consentType,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async trackDataDeletion(userId: string) {
    await this.sendEvent({
      event: 'data_deletion_requested',
      properties: {
        user_id: userId,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

export default new Analytics();

// ============================================================================
// DATA COLLECTION - ML Training Data Pipeline
// ============================================================================

export interface AnonymizedPlan {
  id: string; // Anonymized ID
  structure: {
    sections: Array<{
      id: string;
      title: string;
      wordCount: number;
      qualityScore?: number;
    }>;
    totalWordCount: number;
    completionPercentage: number;
  };
  qualityMetrics: {
    readability: number;
    completeness: number;
    persuasiveness: number;
    overall: number;
  };
  programMatched?: {
    programId: string;
    programType: string;
    matchScore: number;
  };
  outcome?: {
    submitted: boolean;
    approved?: boolean;
    fundingAmount?: number;
  };
  metadata: {
    fundingType: string;
    industry?: string;
    createdAt: string;
    anonymizedAt: string;
  };
}

export interface TemplateUsage {
  templateId: string;
  templateType: 'section' | 'document';
  usageCount: number;
  editRate: number; // Percentage of times template was edited
  qualityRating?: number; // Average rating if collected
  lastUsed: string;
}

export interface UserFeedback {
  id: string;
  userId: string;
  type: 'ai_suggestion' | 'template' | 'extraction' | 'recommendation';
  itemId: string;
  action: 'accepted' | 'rejected' | 'edited';
  rating?: number; // 1-5
  comment?: string;
  timestamp: string;
}

/**
 * Anonymize business plan data for ML training
 */
export function anonymizePlan(plan: any, userId: string): AnonymizedPlan {
  // Remove PII and sensitive information
  const anonymizedId = `plan_${hashString(userId + plan.id)}`;
  
  return {
    id: anonymizedId,
    structure: {
      sections: (plan.sections || []).map((section: any) => ({
        id: section.id || section.key || '',
        title: section.title || '',
        wordCount: countWords(section.content || ''),
        qualityScore: section.qualityScore
      })),
      totalWordCount: countWords(JSON.stringify(plan)),
      completionPercentage: calculateCompletion(plan.sections || [])
    },
    qualityMetrics: plan.qualityMetrics || {
      readability: 0,
      completeness: 0,
      persuasiveness: 0,
      overall: 0
    },
    programMatched: plan.programMatched ? {
      programId: plan.programMatched.programId || '',
      programType: plan.programMatched.programType || '',
      matchScore: plan.programMatched.matchScore || 0
    } : undefined,
    outcome: plan.outcome,
    metadata: {
      fundingType: plan.fundingType || 'unknown',
      industry: plan.industry, // Can be kept if not sensitive
      createdAt: plan.createdAt || new Date().toISOString(),
      anonymizedAt: new Date().toISOString()
    }
  };
}

/**
 * Store anonymized plan for ML training
 */
export async function storeAnonymizedPlan(
  plan: AnonymizedPlan,
  userConsent: boolean
): Promise<boolean> {
  if (!userConsent) {
    return false;
  }

  try {
    const response = await fetch('/api/ml-training/plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(plan)
    });

    return response.ok;
  } catch (error) {
    console.error('Error storing anonymized plan:', error);
    return false;
  }
}

/**
 * Track template usage
 */
export async function trackTemplateUsage(
  templateId: string,
  templateType: 'section' | 'document',
  wasEdited: boolean
): Promise<void> {
  try {
    await fetch('/api/analytics/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        templateId,
        templateType,
        wasEdited,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error tracking template usage:', error);
  }
}

/**
 * Submit user feedback
 */
export async function submitFeedback(
  feedback: Omit<UserFeedback, 'id' | 'timestamp'>
): Promise<boolean> {
  try {
    const response = await fetch('/api/feedback/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...feedback,
        timestamp: new Date().toISOString()
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return false;
  }
}

/**
 * Get user consent status
 */
export async function getUserConsent(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/ml-training/consent/${userId}`);
    if (!response.ok) return false;
    
    const data = await response.json();
    return data.consent === true;
  } catch (error) {
    console.error('Error fetching consent:', error);
    return false;
  }
}

/**
 * Set user consent
 */
export async function setUserConsent(
  userId: string,
  consent: boolean,
  consentType: 'data_collection' | 'ml_training' = 'data_collection'
): Promise<boolean> {
  try {
    const response = await fetch('/api/ml-training/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        consent,
        consentType,
        timestamp: new Date().toISOString()
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error setting consent:', error);
    return false;
  }
}

// Helper functions for data collection
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

function countWords(text: string): number {
  if (!text) return 0;
  // Strip HTML tags
  const cleanText = text.replace(/<[^>]*>/g, ' ');
  // Count words
  return cleanText.trim().split(/\s+/).filter(w => w.length > 0).length;
}

function calculateCompletion(sections: any[]): number {
  if (sections.length === 0) return 0;
  
  const completed = sections.filter(s => {
    const content = s.content || '';
    const wordCount = countWords(content);
    const minWords = s.wordCountMin || 50;
    return wordCount >= minWords;
  }).length;
  
  return Math.round((completed / sections.length) * 100);
}

// ============================================================================
// USAGE TRACKING - Freemium Limits
// ============================================================================

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
