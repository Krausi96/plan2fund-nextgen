// Basic persona and segmentation utilities used by auth and onboarding flows.
// This is intentionally lightweight and can be extended with real logic later.

export type Persona = 'founder' | 'advisor' | 'incubator' | 'sme';

/**
 * Map a high-level persona to an internal segment identifier used by the app.
 */
export function mapPersonaToSegment(persona: Persona): string {
  switch (persona) {
    case 'advisor':
      return 'B2B_ADVISOR';
    case 'incubator':
      return 'B2B_INCUBATOR';
    case 'sme':
      return 'B2B_SME';
    case 'founder':
    default:
      return 'B2C_FOUNDER';
  }
}

/**
 * Read the last selected persona from localStorage-based target group selection.
 * Falls back to `null` if nothing is stored or storage is unavailable.
 */
export function getPersonaFromTargetGroup(): Persona | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem('pf_target_group_persona');
    if (!raw) return null;
    if (raw === 'founder' || raw === 'advisor' || raw === 'incubator' || raw === 'sme') {
      return raw;
    }
    return null;
  } catch {
    return null;
  }
}



