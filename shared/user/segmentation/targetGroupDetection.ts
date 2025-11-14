// ========= PLAN2FUND — TARGET GROUP DETECTION =========
// Minimal implementation for target group detection

export type TargetGroup = 'startups' | 'sme' | 'advisors' | 'universities' | 'default';

export interface DetectionResult {
  targetGroup: TargetGroup;
  source: 'url' | 'utm' | 'referrer' | 'query' | 'localStorage' | 'default';
  confidence: number;
}

// UTM parameter mapping
const UTM_TARGET_MAPPING: Record<string, TargetGroup> = {
  'startup': 'startups',
  'startups': 'startups',
  'founder': 'startups',
  'founders': 'startups',
  'sme': 'sme',
  'smes': 'sme',
  'scaleup': 'sme',
  'scaleups': 'sme',
  'advisor': 'advisors',
  'advisors': 'advisors',
  'consultant': 'advisors',
  'consultants': 'advisors',
  'university': 'universities',
  'universities': 'universities',
  'accelerator': 'universities',
  'accelerators': 'universities'
};

export function detectTargetGroup(): DetectionResult {
  if (typeof window === 'undefined') {
    return { targetGroup: 'default', source: 'default', confidence: 0 };
  }

  // Check localStorage first (user's previous choice)
  const stored = localStorage.getItem('selectedTargetGroup');
  if (stored && UTM_TARGET_MAPPING[stored]) {
    return { 
      targetGroup: UTM_TARGET_MAPPING[stored], 
      source: 'localStorage', 
      confidence: 0.5 
    };
  }

  // Default fallback
  return { targetGroup: 'default', source: 'default', confidence: 0 };
}

// Store target group selection
export function storeTargetGroupSelection(targetGroup: TargetGroup): void {
  try {
    localStorage.setItem('selectedTargetGroup', targetGroup);
  } catch (error) {
    console.warn('Could not store target group selection:', error);
  }
}

