// Feature Flag System for Runtime Configuration
export interface FeatureFlag {
  name: string;
  enabled: boolean;
  description: string;
  segments?: string[]; // Only enable for specific segments
  experiments?: {
    id: string;
    variant: string;
    weight: number;
  }[];
}

export interface FeatureFlagConfig {
  flags: Record<string, FeatureFlag>;
  experiments: Record<string, {
    id: string;
    variants: Array<{
      name: string;
      weight: number;
    }>;
    enabled: boolean;
  }>;
}

// Default feature flags
const DEFAULT_FLAGS: FeatureFlagConfig = {
  flags: {
    SEGMENTED_ONBOARDING: {
      name: 'SEGMENTED_ONBOARDING',
      enabled: true,
      description: 'Enable segmented onboarding flow',
      segments: ['B2C_FOUNDER', 'SME_LOAN', 'VISA', 'PARTNER']
    },
    RECO_DECISION_TREE: {
      name: 'RECO_DECISION_TREE',
      enabled: true,
      description: 'Use decision tree logic for recommendations',
      segments: ['B2C_FOUNDER', 'SME_LOAN', 'VISA', 'PARTNER']
    },
    EDITOR_TEMPLATES_V1: {
      name: 'EDITOR_TEMPLATES_V1',
      enabled: true,
      description: 'Enable program-aware editor templates',
      segments: ['B2C_FOUNDER', 'SME_LOAN', 'VISA', 'PARTNER']
    },
    EXPORT_PAYWALL: {
      name: 'EXPORT_PAYWALL',
      enabled: true,
      description: 'Enable paid export with watermarks',
      segments: ['B2C_FOUNDER', 'SME_LOAN', 'VISA', 'PARTNER']
    },
    ANALYTICS_AB: {
      name: 'ANALYTICS_AB',
      enabled: true,
      description: 'Enable A/B testing and analytics',
      segments: ['B2C_FOUNDER', 'SME_LOAN', 'VISA', 'PARTNER']
    },
    AI_EXPLANATIONS: {
      name: 'AI_EXPLANATIONS',
      enabled: true,
      description: 'Use AI for recommendation explanations',
      segments: ['B2C_FOUNDER', 'SME_LOAN', 'VISA', 'PARTNER']
    },
    GDPR_COMPLIANCE: {
      name: 'GDPR_COMPLIANCE',
      enabled: true,
      description: 'Enable GDPR compliance features',
      segments: ['B2C_FOUNDER', 'SME_LOAN', 'VISA', 'PARTNER']
    },
    PAYMENT_INTEGRATION: {
      name: 'PAYMENT_INTEGRATION',
      enabled: true,
      description: 'Enable Stripe payment integration',
      segments: ['B2C_FOUNDER', 'SME_LOAN', 'VISA', 'PARTNER']
    },
    PROGRAM_AWARE_EDITOR: {
      name: 'PROGRAM_AWARE_EDITOR',
      enabled: true,
      description: 'Enable program-specific editor templates and guidance',
      segments: ['B2C_FOUNDER', 'SME_LOAN', 'VISA', 'PARTNER']
    }
  },
  experiments: {
    LANDING_PAGE_HERO: {
      id: 'LANDING_PAGE_HERO',
      variants: [
        { name: 'control', weight: 50 },
        { name: 'benefit_focused', weight: 30 },
        { name: 'social_proof', weight: 20 }
      ],
      enabled: true
    },
    PERSONA_DEFAULT: {
      id: 'PERSONA_DEFAULT',
      variants: [
        { name: 'newbie', weight: 60 },
        { name: 'expert', weight: 40 }
      ],
      enabled: true
    },
    PRICING_DISPLAY: {
      id: 'PRICING_DISPLAY',
      variants: [
        { name: 'monthly', weight: 50 },
        { name: 'annual', weight: 30 },
        { name: 'lifetime', weight: 20 }
      ],
      enabled: true
    }
  }
};

class FeatureFlagManager {
  private config: FeatureFlagConfig;
  private userSegment: string | null = null;
  private userId: string | null = null;

  constructor() {
    this.config = DEFAULT_FLAGS;
    this.loadConfig();
  }

  private loadConfig(): void {
    // Load from environment variables or API
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pf_feature_flags');
      if (stored) {
        try {
          this.config = { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
        } catch (error) {
          console.error('Failed to parse feature flags:', error);
        }
      }
    }
  }

  setUserContext(segment: string, userId: string): void {
    this.userSegment = segment;
    this.userId = userId;
  }

  isEnabled(flagName: string): boolean {
    const flag = this.config.flags[flagName];
    if (!flag) return false;

    // Check if flag is enabled
    if (!flag.enabled) return false;

    // Check segment restrictions
    if (flag.segments && this.userSegment && !flag.segments.includes(this.userSegment)) {
      return false;
    }

    return true;
  }

  getExperimentVariant(experimentId: string): string | null {
    const experiment = this.config.experiments[experimentId];
    if (!experiment || !experiment.enabled) return null;

    // Use userId for consistent assignment
    const seed = this.userId ? this.hashCode(this.userId) : Math.random();
    const random = (seed % 100) / 100;

    let cumulativeWeight = 0;
    for (const variant of experiment.variants) {
      cumulativeWeight += variant.weight / 100;
      if (random <= cumulativeWeight) {
        return variant.name;
      }
    }

    return experiment.variants[0].name; // Fallback to first variant
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getFlag(flagName: string): FeatureFlag | null {
    return this.config.flags[flagName] || null;
  }

  getAllFlags(): Record<string, FeatureFlag> {
    return this.config.flags;
  }

  updateFlag(flagName: string, updates: Partial<FeatureFlag>): void {
    if (this.config.flags[flagName]) {
      this.config.flags[flagName] = { ...this.config.flags[flagName], ...updates };
      this.saveConfig();
    }
  }

  private saveConfig(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pf_feature_flags', JSON.stringify(this.config));
    }
  }

  // Runtime flag updates (for A/B testing)
  async refreshFlags(): Promise<void> {
    try {
      const response = await fetch('/api/feature-flags');
      if (response.ok) {
        const newConfig = await response.json();
        this.config = { ...this.config, ...newConfig };
        this.saveConfig();
      }
    } catch (error) {
      console.error('Failed to refresh feature flags:', error);
    }
  }

  // Get all enabled flags for current user
  getEnabledFlags(): string[] {
    return Object.keys(this.config.flags).filter(flagName => this.isEnabled(flagName));
  }

  // Get experiment assignments for current user
  getExperimentAssignments(): Record<string, string> {
    const assignments: Record<string, string> = {};
    for (const experimentId of Object.keys(this.config.experiments)) {
      const variant = this.getExperimentVariant(experimentId);
      if (variant) {
        assignments[experimentId] = variant;
      }
    }
    return assignments;
  }
}

export const featureFlags = new FeatureFlagManager();
export default featureFlags;
