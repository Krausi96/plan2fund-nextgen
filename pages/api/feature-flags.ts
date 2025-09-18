// Feature Flags API Endpoint
import type { NextApiRequest, NextApiResponse } from 'next';
import { FeatureFlagConfig } from '@/lib/featureFlags';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { segment } = req.query;

    // In a real implementation, this would fetch from Airtable or another data source
    // For now, return the default configuration
    const config: FeatureFlagConfig = {
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
        ADDON_CHIPS: {
          name: 'ADDON_CHIPS',
          enabled: true,
          description: 'Show contextual add-on chips in editor',
          segments: ['B2C_FOUNDER', 'SME_LOAN', 'VISA', 'PARTNER']
        },
        SUCCESS_HUB_V1: {
          name: 'SUCCESS_HUB_V1',
          enabled: true,
          description: 'Enable success hub after export',
          segments: ['B2C_FOUNDER', 'SME_LOAN', 'VISA', 'PARTNER']
        },
        ANALYTICS_AB: {
          name: 'ANALYTICS_AB',
          enabled: true,
          description: 'Enable A/B testing and analytics',
          segments: ['B2C_FOUNDER', 'SME_LOAN', 'VISA', 'PARTNER']
        },
        PR_BOT_FRESHNESS: {
          name: 'PR_BOT_FRESHNESS',
          enabled: false,
          description: 'Enable automated program data freshness checks',
          segments: ['PARTNER']
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

    // Filter flags based on segment if provided
    if (segment && typeof segment === 'string') {
      const filteredConfig = {
        ...config,
        flags: Object.fromEntries(
          Object.entries(config.flags).filter(([_, flag]) => 
            !flag.segments || flag.segments.includes(segment)
          )
        )
      };
      return res.status(200).json(filteredConfig);
    }

    return res.status(200).json(config);
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    return res.status(500).json({ error: 'Failed to fetch feature flags' });
  }
}
