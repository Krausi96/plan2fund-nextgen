/**
 * Data Collection Pipeline for ML Training
 * Collects anonymized data for model training while respecting user privacy
 * Based on Phase 2.1 implementation plan
 */

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

export interface ScraperQualityMetric {
  institution: string;
  pageType: string;
  extractionMethod: 'regex' | 'llm' | 'hybrid' | 'custom_llm' | 'openai_llm';
  accuracy: number; // 0-1
  confidence: number; // 0-1
  extractionPattern?: string;
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
    const response = await fetch('/api/data-collection/plans', {
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
    await fetch('/api/data-collection/templates', {
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
 * Track scraper quality metrics
 */
export async function trackScraperQuality(
  metric: ScraperQualityMetric
): Promise<void> {
  try {
    // Skip in Node.js context (scraper runs server-side, no API endpoint available)
    if (typeof window === 'undefined') {
      return;
    }
    
    await fetch('/api/data-collection/scraper-quality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric)
    });
  } catch (error) {
    // Silently fail - telemetry is non-critical
  }
}

/**
 * Get user consent status
 */
export async function getUserConsent(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/data-collection/consent/${userId}`);
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
    const response = await fetch('/api/data-collection/consent', {
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

// Helper functions

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

