// Reusable config imported from legacy institutionConfig
import { 
  institutions as legacyInstitutions, 
  fundingTypes,
  programFocus,
  autoDiscoveryPatterns
} from '../../legacy/institutionConfig';

export interface LiteInstitutionConfig {
  id?: string;
  name: string;
  baseUrl: string;
  seedUrls: string[];
  fundingTypes: string[];
  keywords: string[];
  region: string | string[];
  programFocus?: string[];
}

// Convert legacy config to lite format
export const institutions: LiteInstitutionConfig[] = legacyInstitutions
  .filter(inst => inst.autoDiscovery) // Only use auto-discovery enabled
  .map(inst => ({
    id: inst.id,
    name: inst.name,
    baseUrl: inst.baseUrl,
    seedUrls: inst.programUrls,
    fundingTypes: inst.fundingTypes,
    keywords: inst.keywords || [],
    region: inst.region,
    programFocus: inst.programFocus
  }));

export { fundingTypes, programFocus, autoDiscoveryPatterns };

// Get all unique seed URLs across institutions
export function getAllSeedUrls(): string[] {
  const urls = new Set<string>();
  institutions.forEach(inst => {
    inst.seedUrls.forEach(url => urls.add(url));
  });
  return Array.from(urls);
}

// Find institution by URL
export function findInstitutionByUrl(url: string): LiteInstitutionConfig | null {
  try {
    const urlObj = new URL(url);
    return institutions.find(inst => {
      const instUrl = new URL(inst.baseUrl);
      return instUrl.hostname === urlObj.hostname || url.startsWith(inst.baseUrl);
    }) || null;
  } catch {
    return null;
  }
}

