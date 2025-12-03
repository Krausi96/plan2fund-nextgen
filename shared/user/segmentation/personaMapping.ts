// Persona to User Segment Mapping
// Maps user-friendly persona names to internal segment values

export type Persona = 'founder' | 'advisor' | 'incubator' | 'sme';

export type UserSegment = 'B2C_FOUNDER' | 'SME_LOAN' | 'VISA' | 'PARTNER';

/**
 * Maps persona selection to user segment
 */
export function mapPersonaToSegment(persona: Persona | string | null | undefined): UserSegment {
  if (!persona) {
    return 'B2C_FOUNDER'; // Default
  }

  const normalized = persona.toLowerCase().trim();

  switch (normalized) {
    case 'founder':
    case 'startups':
    case 'startup':
      return 'B2C_FOUNDER';
    
    case 'advisor':
    case 'advisors':
    case 'consultant':
    case 'consultants':
    case 'partner':
      return 'PARTNER';
    
    case 'incubator':
    case 'incubators':
    case 'university':
    case 'universities':
    case 'accelerator':
      return 'PARTNER'; // Incubators are also PARTNER segment
    
    case 'sme':
    case 'smes':
    case 'scaleup':
    case 'scaleups':
      return 'SME_LOAN';
    
    default:
      return 'B2C_FOUNDER'; // Default fallback
  }
}

/**
 * Gets persona from target group selection (localStorage) if available
 */
export function getPersonaFromTargetGroup(): Persona | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const targetGroup = localStorage.getItem('selectedTargetGroup');
  if (!targetGroup) {
    return null;
  }

  const normalized = targetGroup.toLowerCase().trim();
  
  if (normalized === 'startups' || normalized === 'startup') {
    return 'founder';
  }
  if (normalized === 'advisors' || normalized === 'advisor') {
    return 'advisor';
  }
  if (normalized === 'universities' || normalized === 'university' || normalized === 'incubator' || normalized === 'incubators') {
    return 'incubator';
  }
  if (normalized === 'sme' || normalized === 'smes') {
    return 'sme';
  }

  return null;
}

