// ========= PLAN2FUND — TARGET GROUP DETECTION =========
// Comprehensive detection for external traffic, UTM params, referrers, and query params

export type TargetGroup = 'startups' | 'smes' | 'advisors' | 'universities' | 'default';

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
  'sme': 'smes',
  'smes': 'smes',
  'scaleup': 'smes',
  'scaleups': 'smes',
  'advisor': 'advisors',
  'advisors': 'advisors',
  'consultant': 'advisors',
  'consultants': 'advisors',
  'university': 'universities',
  'universities': 'universities',
  'accelerator': 'universities',
  'accelerators': 'universities'
};

// Referrer domain mapping
const REFERRER_MAPPING: Record<string, TargetGroup> = {
  'linkedin.com': 'advisors',
  'xing.com': 'advisors',
  'startup.com': 'startups',
  'crunchbase.com': 'startups',
  'angel.co': 'startups',
  'university.edu': 'universities',
  'ac.at': 'universities',
  'researchgate.net': 'universities',
  'google.com': 'default', // Generic search
  'bing.com': 'default',
  'duckduckgo.com': 'default'
};

export function detectTargetGroup(): DetectionResult {
  if (typeof window === 'undefined') {
    return { targetGroup: 'default', source: 'default', confidence: 0 };
  }

  // 1. Check URL path first (highest priority)
  const urlResult = detectFromURL();
  if (urlResult.targetGroup !== 'default') {
    return { ...urlResult, confidence: 0.9 };
  }

  // 2. Check UTM parameters
  const utmResult = detectFromUTM();
  if (utmResult.targetGroup !== 'default') {
    return { ...utmResult, confidence: 0.8 };
  }

  // 3. Check query parameters
  const queryResult = detectFromQuery();
  if (queryResult.targetGroup !== 'default') {
    return { ...queryResult, confidence: 0.7 };
  }

  // 4. Check referrer
  const referrerResult = detectFromReferrer();
  if (referrerResult.targetGroup !== 'default') {
    return { ...referrerResult, confidence: 0.6 };
  }

  // 5. Check localStorage (user's previous choice)
  const localStorageResult = detectFromLocalStorage();
  if (localStorageResult.targetGroup !== 'default') {
    return { ...localStorageResult, confidence: 0.5 };
  }

  // 6. Default fallback
  return { targetGroup: 'default', source: 'default', confidence: 0 };
}

function detectFromURL(): DetectionResult {
  const path = window.location.pathname;
  
  if (path.includes('/for/startups') || path.includes('/startups')) {
    return { targetGroup: 'startups', source: 'url', confidence: 0.9 };
  }
  if (path.includes('/for/sme') || path.includes('/smes')) {
    return { targetGroup: 'smes', source: 'url', confidence: 0.9 };
  }
  if (path.includes('/for/advisors') || path.includes('/advisors')) {
    return { targetGroup: 'advisors', source: 'url', confidence: 0.9 };
  }
  if (path.includes('/for/universities') || path.includes('/universities')) {
    return { targetGroup: 'universities', source: 'url', confidence: 0.9 };
  }
  
  return { targetGroup: 'default', source: 'url', confidence: 0 };
}

function detectFromUTM(): DetectionResult {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check utm_content first (most specific)
  const utmContent = urlParams.get('utm_content')?.toLowerCase();
  if (utmContent && UTM_TARGET_MAPPING[utmContent]) {
    return { 
      targetGroup: UTM_TARGET_MAPPING[utmContent], 
      source: 'utm', 
      confidence: 0.8 
    };
  }
  
  // Check utm_campaign
  const utmCampaign = urlParams.get('utm_campaign')?.toLowerCase();
  if (utmCampaign && UTM_TARGET_MAPPING[utmCampaign]) {
    return { 
      targetGroup: UTM_TARGET_MAPPING[utmCampaign], 
      source: 'utm', 
      confidence: 0.7 
    };
  }
  
  // Check utm_source
  const utmSource = urlParams.get('utm_source')?.toLowerCase();
  if (utmSource && UTM_TARGET_MAPPING[utmSource]) {
    return { 
      targetGroup: UTM_TARGET_MAPPING[utmSource], 
      source: 'utm', 
      confidence: 0.6 
    };
  }
  
  return { targetGroup: 'default', source: 'utm', confidence: 0 };
}

function detectFromQuery(): DetectionResult {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Check 'target' parameter
  const target = urlParams.get('target')?.toLowerCase();
  if (target && UTM_TARGET_MAPPING[target]) {
    return { 
      targetGroup: UTM_TARGET_MAPPING[target], 
      source: 'query', 
      confidence: 0.7 
    };
  }
  
  // Check 'audience' parameter
  const audience = urlParams.get('audience')?.toLowerCase();
  if (audience && UTM_TARGET_MAPPING[audience]) {
    return { 
      targetGroup: UTM_TARGET_MAPPING[audience], 
      source: 'query', 
      confidence: 0.7 
    };
  }
  
  return { targetGroup: 'default', source: 'query', confidence: 0 };
}

function detectFromReferrer(): DetectionResult {
  const referrer = document.referrer;
  if (!referrer) {
    return { targetGroup: 'default', source: 'referrer', confidence: 0 };
  }
  
  try {
    const referrerDomain = new URL(referrer).hostname.toLowerCase();
    
    // Direct domain match
    if (REFERRER_MAPPING[referrerDomain]) {
      return { 
        targetGroup: REFERRER_MAPPING[referrerDomain], 
        source: 'referrer', 
        confidence: 0.6 
      };
    }
    
    // Partial domain match
    for (const [domain, targetGroup] of Object.entries(REFERRER_MAPPING)) {
      if (referrerDomain.includes(domain)) {
        return { 
          targetGroup, 
          source: 'referrer', 
          confidence: 0.5 
        };
      }
    }
    
  } catch (error) {
    // Invalid referrer URL
    console.warn('Invalid referrer URL:', referrer);
  }
  
  return { targetGroup: 'default', source: 'referrer', confidence: 0 };
}

function detectFromLocalStorage(): DetectionResult {
  try {
    const stored = localStorage.getItem('selectedTargetGroup');
    if (stored && UTM_TARGET_MAPPING[stored]) {
      return { 
        targetGroup: UTM_TARGET_MAPPING[stored], 
        source: 'localStorage', 
        confidence: 0.5 
      };
    }
  } catch (error) {
    // localStorage not available
  }
  
  return { targetGroup: 'default', source: 'localStorage', confidence: 0 };
}

// Store target group selection
export function storeTargetGroupSelection(targetGroup: TargetGroup): void {
  try {
    localStorage.setItem('selectedTargetGroup', targetGroup);
  } catch (error) {
    console.warn('Could not store target group selection:', error);
  }
}

// Generate tracking URL for external campaigns
export function generateTrackingURL(
  baseURL: string, 
  targetGroup: TargetGroup, 
  campaign?: string
): string {
  const url = new URL(baseURL);
  url.searchParams.set('utm_content', targetGroup);
  if (campaign) {
    url.searchParams.set('utm_campaign', campaign);
  }
  return url.toString();
}
