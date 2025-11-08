/**
 * Requirement Quality Pattern Learning
 * Automatically learns patterns to improve requirement extraction and filtering
 */

import { getPool } from '../../db/db';

export interface RequirementPattern {
  category: string;
  genericValues: string[]; // Values to filter out (e.g., "SME", "all", "none specified")
  duplicatePatterns: Array<{ pattern: string; keep: string; remove: string[] }>; // Deduplication rules
  typicalValues: string[]; // Good example values
}

/**
 * Learn requirement patterns from existing data
 */
export async function learnRequirementPatterns(): Promise<RequirementPattern[]> {
  const pool = getPool();
  
  // Get all categories with their values
  const categoriesResult = await pool.query(`
    SELECT 
      category,
      value,
      meaningfulness_score,
      COUNT(*) as count
    FROM requirements
    WHERE value IS NOT NULL
    GROUP BY category, value, meaningfulness_score
    ORDER BY category, count DESC
  `);
  
  // Group by category
  const byCategory: Record<string, Array<{ value: string; meaning: number | null; count: number }>> = {};
  categoriesResult.rows.forEach((r: any) => {
    if (!byCategory[r.category]) {
      byCategory[r.category] = [];
    }
    byCategory[r.category].push({
      value: r.value,
      meaning: r.meaningfulness_score,
      count: r.count
    });
  });
  
  const patterns: RequirementPattern[] = [];
  
  // Analyze each category
  for (const [category, values] of Object.entries(byCategory)) {
    // Find generic values (low meaningfulness, high frequency)
    const genericValues = values
      .filter(v => (v.meaning !== null && v.meaning < 10) || 
                   ['SME', 'all', 'none specified', 'N/A', 'Not specified', 'Nicht angegeben', 'Keine Angabe', ''].includes(v.value.trim()))
      .map(v => v.value)
      .slice(0, 20); // Top 20 generic values
    
    // Find potential duplicates (similar values with different meaningfulness)
    const duplicates: Array<{ pattern: string; keep: string; remove: string[] }> = [];
    const valueMap = new Map<string, { meaning: number | null; count: number }>();
    
    values.forEach(v => {
      const key = v.value.toLowerCase().trim();
      const existing = valueMap.get(key);
      if (!existing || (v.meaning !== null && (existing.meaning === null || v.meaning > existing.meaning))) {
        valueMap.set(key, { meaning: v.meaning, count: v.count });
      }
    });
    
    // Find similar values (fuzzy matching)
    const similarGroups: string[][] = [];
    const processed = new Set<string>();
    
    values.forEach(v1 => {
      if (processed.has(v1.value)) return;
      const group = [v1.value];
      processed.add(v1.value);
      
      values.forEach(v2 => {
        if (v1.value === v2.value || processed.has(v2.value)) return;
        
        // Check if similar (one contains the other, or very similar)
        const v1Lower = v1.value.toLowerCase();
        const v2Lower = v2.value.toLowerCase();
        
        if (v1Lower.includes(v2Lower) || v2Lower.includes(v1Lower)) {
          // Keep the one with higher meaningfulness
          const keep = (v1.meaning || 0) >= (v2.meaning || 0) ? v1.value : v2.value;
          const remove = keep === v1.value ? v2.value : v1.value;
          
          if (!duplicates.find(d => d.keep === keep)) {
            duplicates.push({ pattern: v1Lower, keep, remove: [remove] });
          } else {
            const dup = duplicates.find(d => d.keep === keep);
            if (dup && !dup.remove.includes(remove)) {
              dup.remove.push(remove);
            }
          }
          
          group.push(v2.value);
          processed.add(v2.value);
        }
      });
      
      if (group.length > 1) {
        similarGroups.push(group);
      }
    });
    
    // Get typical good values (high meaningfulness)
    const typicalValues = values
      .filter(v => v.meaning !== null && v.meaning >= 50)
      .sort((a, b) => (b.meaning || 0) - (a.meaning || 0))
      .slice(0, 10)
      .map(v => v.value);
    
    if (genericValues.length > 0 || duplicates.length > 0 || typicalValues.length > 0) {
      patterns.push({
        category,
        genericValues,
        duplicatePatterns: duplicates.slice(0, 10), // Top 10 duplicates
        typicalValues
      });
    }
  }
  
  return patterns;
}

/**
 * Store learned patterns in database
 */
export async function storeRequirementPatterns(patterns: RequirementPattern[]): Promise<void> {
  const pool = getPool();
  
  // Create table if it doesn't exist
  await pool.query(`
    CREATE TABLE IF NOT EXISTS requirement_patterns (
      id SERIAL PRIMARY KEY,
      category VARCHAR(50) NOT NULL,
      generic_values JSONB,
      duplicate_patterns JSONB,
      typical_values JSONB,
      learned_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(category)
    )
  `);
  
  // Store each pattern
  for (const pattern of patterns) {
    await pool.query(`
      INSERT INTO requirement_patterns (
        category, generic_values, duplicate_patterns, typical_values
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (category) DO UPDATE SET
        generic_values = EXCLUDED.generic_values,
        duplicate_patterns = EXCLUDED.duplicate_patterns,
        typical_values = EXCLUDED.typical_values,
        learned_at = NOW()
    `, [
      pattern.category,
      JSON.stringify(pattern.genericValues),
      JSON.stringify(pattern.duplicatePatterns),
      JSON.stringify(pattern.typicalValues)
    ]);
  }
}

/**
 * Get stored requirement patterns
 */
export async function getStoredRequirementPatterns(): Promise<RequirementPattern[]> {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT category, generic_values, duplicate_patterns, typical_values
      FROM requirement_patterns
      ORDER BY category
    `);
    
    return result.rows.map((r: any) => ({
      category: r.category,
      genericValues: r.generic_values || [],
      duplicatePatterns: r.duplicate_patterns || [],
      typicalValues: r.typical_values || []
    }));
  } catch {
    return [];
  }
}

/**
 * Apply learned patterns to filter and deduplicate requirements
 * This should be called during requirement extraction
 */
export async function applyRequirementPatterns(
  category: string,
  value: string
): Promise<{ shouldFilter: boolean; reason?: string; deduplicateTo?: string }> {
  const patterns = await getStoredRequirementPatterns();
  const pattern = patterns.find(p => p.category.toLowerCase() === category.toLowerCase());
  
  if (!pattern) {
    return { shouldFilter: false };
  }
  
  const valueLower = value.toLowerCase().trim();
  
  // Check if it's a generic value
  if (pattern.genericValues.some(g => valueLower === g.toLowerCase().trim())) {
    return { shouldFilter: true, reason: 'Generic value' };
  }
  
  // Check for duplicates
  for (const dup of pattern.duplicatePatterns) {
    if (dup.remove.some(r => valueLower.includes(r.toLowerCase()) || r.toLowerCase().includes(valueLower))) {
      return { shouldFilter: false, deduplicateTo: dup.keep };
    }
  }
  
  return { shouldFilter: false };
}

/**
 * Auto-learn requirement patterns (called by auto-learning system)
 */
export async function autoLearnRequirementPatterns(): Promise<RequirementPattern[] | null> {
  try {
    const pool = getPool();
    
    // Check if we have enough requirements (at least 1000)
    const countResult = await pool.query(`
      SELECT COUNT(*) as count FROM requirements
    `);
    
    const totalReqs = parseInt(countResult.rows[0].count) || 0;
    if (totalReqs < 1000) {
      console.log('📊 Not enough requirements yet for pattern learning (need 1000+)');
      return null;
    }
    
    console.log(`🧠 Auto-learning requirement patterns from ${totalReqs} requirements...`);
    const patterns = await learnRequirementPatterns();
    
    // Store learned patterns
    await storeRequirementPatterns(patterns);
    
    console.log(`✅ Learned patterns for ${patterns.length} categories`);
    return patterns;
  } catch (error: any) {
    console.warn(`⚠️  Auto-learning requirement patterns failed: ${error.message}`);
    return null;
  }
}

