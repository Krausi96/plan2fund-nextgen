// Reusable config imported from legacy institutionConfig
import { 
  institutions as legacyInstitutions, 
  fundingTypes,
  programFocus,
  autoDiscoveryPatterns,
  type InstitutionConfig
} from './institutionConfig';

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

// Get all unique seed URLs across institutions + discovered seeds from DB
export async function getAllSeedUrls(): Promise<string[]> {
  const urls = new Set<string>();
  
  // Add hardcoded seed URLs from config
  institutions.forEach(inst => {
    inst.seedUrls.forEach(url => urls.add(url));
  });
  
  // Add discovered seed URLs from database (self-expanding discovery)
  try {
    const { getPool } = await import('../../db/db');
    const pool = getPool();
    
    // Ensure table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS discovered_seed_urls (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL UNIQUE,
        source_type VARCHAR(50) NOT NULL,
        institution_id VARCHAR(100),
        discovered_at TIMESTAMP DEFAULT NOW(),
        last_checked TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 50
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_discovered_seeds_active 
      ON discovered_seed_urls(is_active, priority DESC, last_checked NULLS FIRST)
    `);
    
    // Get active discovered seeds
    const discoveredSeeds = await pool.query(`
      SELECT url FROM discovered_seed_urls 
      WHERE is_active = true 
      ORDER BY priority DESC, discovered_at DESC
    `);
    
    discoveredSeeds.rows.forEach((row: any) => {
      urls.add(row.url);
    });
  } catch (error: any) {
    // Silently fail - use only hardcoded seeds if DB fails
    console.warn(`⚠️  Could not load discovered seeds: ${error.message}`);
  }
  
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

// Find full institution config by URL (for login config, etc.)
export function findInstitutionConfigByUrl(url: string): InstitutionConfig | null {
  try {
    const urlObj = new URL(url);
    return legacyInstitutions.find(inst => {
      const instUrl = new URL(inst.baseUrl);
      return instUrl.hostname === urlObj.hostname || url.startsWith(inst.baseUrl);
    }) || null;
  } catch {
    return null;
  }
}

