/**
 * Template Versioning System
 * Stores and manages template versions with metadata
 * Part of Area 3: Editor Entry
 */

import { SectionTemplate } from './types';
import crypto from 'crypto';

interface TemplateVersion {
  id?: number;
  program_id: string;
  section_id: string;
  template_data: SectionTemplate;
  version_number: number;
  version_type: 'llm-generated' | 'manual-edit' | 'rule-based';
  model_version?: string;
  prompt_version?: string;
  generated_by: 'llm' | 'rule-based' | 'admin';
  generated_at: Date;
  generated_from_requirements_hash?: string;
  edited_by?: string;
  edited_at?: Date;
  edit_notes?: string;
  is_active: boolean;
  is_verified: boolean;
}

/**
 * Compute hash of requirements for change detection
 */
export function computeRequirementsHash(
  categorized_requirements: Record<string, any[]>
): string {
  const sorted = Object.keys(categorized_requirements)
    .sort()
    .map(key => `${key}:${JSON.stringify(categorized_requirements[key])}`)
    .join('|');
  
  return crypto.createHash('sha256').update(sorted).digest('hex').substring(0, 16);
}

/**
 * Save template version to database
 */
export async function saveTemplateVersion(
  programId: string,
  section: SectionTemplate,
  metadata: {
    version_type: 'llm-generated' | 'manual-edit' | 'rule-based';
    model_version?: string;
    prompt_version?: string;
    generated_by: 'llm' | 'rule-based' | 'admin';
    requirements_hash?: string;
    edited_by?: string;
    edit_notes?: string;
  }
): Promise<void> {
  try {
    // Get database pool (server-side only)
    if (typeof window !== 'undefined') {
      console.warn('saveTemplateVersion can only be called server-side');
      return;
    }
    
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
    });
    
    try {
      // Deactivate existing active version for this program+section
      await pool.query(
        `UPDATE template_versions 
         SET is_active = FALSE, updated_at = NOW()
         WHERE program_id = $1 AND section_id = $2 AND is_active = TRUE`,
        [programId, section.id]
      );
      
      // Get next version number
      const versionResult = await pool.query(
        `SELECT COALESCE(MAX(version_number), 0) + 1 as next_version
         FROM template_versions
         WHERE program_id = $1 AND section_id = $2`,
        [programId, section.id]
      );
      const versionNumber = parseInt(versionResult.rows[0]?.next_version || '1', 10);
      
      // Insert new version
      await pool.query(
        `INSERT INTO template_versions (
          program_id, section_id, template_data, version_number,
          version_type, model_version, prompt_version,
          generated_by, generated_from_requirements_hash,
          edited_by, edit_notes, is_active, is_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          programId,
          section.id,
          JSON.stringify(section),
          versionNumber,
          metadata.version_type,
          metadata.model_version || null,
          metadata.prompt_version || null,
          metadata.generated_by,
          metadata.requirements_hash || null,
          metadata.edited_by || null,
          metadata.edit_notes || null,
          true, // is_active
          false // is_verified (admin can verify later)
        ]
      );
      
      console.log(`✅ Saved template version ${versionNumber} for ${programId}/${section.id}`);
    } finally {
      await pool.end();
    }
  } catch (error: any) {
    console.error('Error saving template version:', error?.message || String(error));
    // Non-fatal: continue even if versioning fails
  }
}

/**
 * Load active template versions for a program
 */
export async function loadTemplateVersions(
  programId: string,
  baseUrl?: string
): Promise<SectionTemplate[]> {
  try {
    // Server-side only
    if (typeof window !== 'undefined') {
      // Client-side: fetch from API
      const apiUrl = baseUrl 
        ? `${baseUrl}/api/templates/${programId}/versions`
        : `/api/templates/${programId}/versions`;
      
      const response = await fetch(apiUrl);
      if (!response.ok) return [];
      
      const data = await response.json();
      return data.templates || [];
    }
    
    // Server-side: query database directly
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
    });
    
    try {
      const result = await pool.query(
        `SELECT template_data, version_number, version_type, model_version
         FROM template_versions
         WHERE program_id = $1 AND is_active = TRUE
         ORDER BY section_id`,
        [programId]
      );
      
      return result.rows.map((row: any) => row.template_data as SectionTemplate);
    } finally {
      await pool.end();
    }
  } catch (error: any) {
    console.error('Error loading template versions:', error?.message || String(error));
    return [];
  }
}

/**
 * Check if template needs updating (requirements changed)
 */
export async function checkTemplateNeedsUpdate(
  programId: string,
  currentRequirementsHash: string
): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') return false; // Client-side: skip
    
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
    });
    
    try {
      // Check if we have a template version for this program
      const versionResult = await pool.query(
        `SELECT generated_from_requirements_hash
         FROM template_versions
         WHERE program_id = $1 AND is_active = TRUE
         LIMIT 1`,
        [programId]
      );
      
      if (versionResult.rows.length === 0) {
        return true; // No template exists, needs generation
      }
      
      const storedHash = versionResult.rows[0].generated_from_requirements_hash;
      return storedHash !== currentRequirementsHash; // Different hash = needs update
    } finally {
      await pool.end();
    }
  } catch (error: any) {
    console.error('Error checking template update:', error?.message || String(error));
    return true; // On error, assume needs update
  }
}

/**
 * Save requirements hash for change detection
 */
export async function saveRequirementsHash(
  programId: string,
  requirementsHash: string,
  requirementsSnapshot: Record<string, any[]>
): Promise<void> {
  try {
    if (typeof window !== 'undefined') return; // Server-side only
    
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false
    });
    
    try {
      await pool.query(
        `INSERT INTO template_requirements_hash (program_id, requirements_hash, requirements_snapshot)
         VALUES ($1, $2, $3)
         ON CONFLICT (program_id, requirements_hash) DO NOTHING`,
        [programId, requirementsHash, JSON.stringify(requirementsSnapshot)]
      );
    } finally {
      await pool.end();
    }
  } catch (error: any) {
    console.error('Error saving requirements hash:', error?.message || String(error));
    // Non-fatal
  }
}

