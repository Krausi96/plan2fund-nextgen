/**
 * Feature Flags - Freemium gating system
 * Controls access to premium features based on user subscription status
 */

// Legacy compatibility - default export for old code
const featureFlags = {
  setUserContext: (segment: string, id: string) => {
    // Legacy method - kept for backward compatibility
    // New code should use isFeatureEnabled directly
    console.log('Legacy featureFlags.setUserContext called', { segment, id });
  }
};

export default featureFlags;

export type FeatureFlag = 
  | 'semantic_search'
  | 'llm_extraction'
  | 'advanced_ai'
  | 'pdf_export'
  | 'image_upload'
  | 'additional_documents'
  | 'unlimited_plans'
  | 'priority_support';

export type SubscriptionTier = 'free' | 'premium' | 'enterprise';

interface FeatureConfig {
  name: string;
  description: string;
  premium: boolean;
  enterprise?: boolean;
}

const FEATURE_CONFIG: Record<FeatureFlag, FeatureConfig> = {
  semantic_search: {
    name: 'Semantic Search',
    description: 'AI-powered semantic search to find programs by project description',
    premium: true,
  },
  llm_extraction: {
    name: 'LLM Data Extraction',
    description: 'Advanced AI extraction for funding program data',
    premium: true,
  },
  advanced_ai: {
    name: 'Advanced AI Assistant',
    description: 'Enhanced AI assistance with context-aware suggestions',
    premium: true,
  },
  pdf_export: {
    name: 'PDF Export',
    description: 'Export business plans as PDF without watermark',
    premium: true,
  },
  image_upload: {
    name: 'Image Upload',
    description: 'Upload and insert images into business plans',
    premium: false, // Free feature
  },
  additional_documents: {
    name: 'Additional Documents',
    description: 'Create pitch decks, application forms, and other documents',
    premium: true,
  },
  unlimited_plans: {
    name: 'Unlimited Plans',
    description: 'Create unlimited business plans',
    premium: false, // Free users can create multiple plans
    enterprise: true, // Enterprise gets unlimited
  },
  priority_support: {
    name: 'Priority Support',
    description: 'Priority customer support',
    premium: false,
    enterprise: true,
  },
};

/**
 * Check if a feature is enabled for a user
 */
export function isFeatureEnabled(
  feature: FeatureFlag,
  subscriptionTier: SubscriptionTier = 'free'
): boolean {
  const config = FEATURE_CONFIG[feature];
  
  if (!config) {
    console.warn(`Unknown feature flag: ${feature}`);
    return false;
  }

  // Free features are always enabled
  if (!config.premium && !config.enterprise) {
    return true;
  }

  // Premium features require premium or enterprise
  if (config.premium && (subscriptionTier === 'premium' || subscriptionTier === 'enterprise')) {
    return true;
  }

  // Enterprise features require enterprise
  if (config.enterprise && subscriptionTier === 'enterprise') {
    return true;
  }

  return false;
}

/**
 * Get feature configuration
 */
export function getFeatureConfig(feature: FeatureFlag): FeatureConfig {
  return FEATURE_CONFIG[feature];
}

/**
 * Get all premium features
 */
export function getPremiumFeatures(): FeatureFlag[] {
  return Object.entries(FEATURE_CONFIG)
    .filter(([_, config]) => config.premium)
    .map(([flag]) => flag as FeatureFlag);
}

/**
 * Check if user has premium subscription
 */
export function isPremiumUser(subscriptionTier: SubscriptionTier): boolean {
  return subscriptionTier === 'premium' || subscriptionTier === 'enterprise';
}

/**
 * Get subscription tier from user profile
 * Defaults to 'free' if not specified
 */
export function getSubscriptionTier(userProfile: any): SubscriptionTier {
  if (!userProfile) return 'free';
  
  // Check for subscription field
  if (userProfile.subscription?.tier) {
    return userProfile.subscription.tier as SubscriptionTier;
  }
  
  // Check for isPremium field (backward compatibility)
  if (userProfile.isPremium === true) {
    return 'premium';
  }
  
  // Check for premium field
  if (userProfile.premium === true) {
    return 'premium';
  }
  
  return 'free';
}

/**
 * Get feature description for upgrade modal
 */
export function getFeatureDescription(feature: FeatureFlag): string {
  return FEATURE_CONFIG[feature]?.description || '';
}

/**
 * Get feature name for display
 */
export function getFeatureName(feature: FeatureFlag): string {
  return FEATURE_CONFIG[feature]?.name || feature;
}
