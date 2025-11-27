/**
 * Database Operations - Consolidated
 * All database functions in one file
 */

import { Pool } from 'pg';

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set.');
    }
    
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL.includes('neon.tech') ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000, // Increased from 2000ms to 10000ms (10 seconds)
    });

    pool.on('error', (err) => {
      console.error('Database error:', err);
    });
  }
  
  return pool;
}

export async function testConnection(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) return false;
    const pool = getPool();
    const queryPromise = pool.query('SELECT NOW()');
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), 5000)
    );
    await Promise.race([queryPromise, timeoutPromise]);
    return true;
  } catch {
    return false;
  }
}

// ============================================================================
// PAGE OPERATIONS
// ============================================================================

export interface PageMetadata {
  url: string;
  title?: string | null;
  description?: string | null;
  funding_amount_min?: number | null;
  funding_amount_max?: number | null;
  currency?: string | null;
  deadline?: string | null;
  open_deadline?: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  funding_types?: string[];
  program_focus?: string[];
  region?: string | null;
  categorized_requirements?: Record<string, any[]>;
  metadata_json?: any;
  fetched_at?: string;
  raw_html_path?: string | null;
}

// Normalize metadata (extracted from extract.ts)
export function normalizeMetadata(raw: any): PageMetadata {
  try {
    let funding_amount_min = (raw.funding_amount_min != null && raw.funding_amount_min !== undefined) ? Number(raw.funding_amount_min) : null;
    let funding_amount_max = (raw.funding_amount_max != null && raw.funding_amount_max !== undefined) ? Number(raw.funding_amount_max) : null;
    
    // FIX #4: Validate and fix inverted amounts (min > max)
    if (funding_amount_min != null && funding_amount_max != null && !isNaN(funding_amount_min) && !isNaN(funding_amount_max)) {
      if (funding_amount_min > funding_amount_max) {
        // Swap min and max if inverted
        console.warn(`   ⚠️  Inverted amounts detected (min: ${funding_amount_min} > max: ${funding_amount_max}), swapping...`);
        [funding_amount_min, funding_amount_max] = [funding_amount_max, funding_amount_min];
      }
      // Note: Same min/max is valid (fixed amount) - don't change
    }
    
    // Normalize date format (DD.MM.YYYY -> YYYY-MM-DD)
    const normalizedDeadline = (() => {
      if (!raw.deadline) return null;
      const dateStr = String(raw.deadline).trim();
      // If already in ISO format (YYYY-MM-DD), return as is
      if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
      // Try to parse DD.MM.YYYY format
      const match = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
      if (match) {
        const [, day, month, year] = match;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      }
      // Return as-is if can't parse
      return dateStr;
    })();
    
    return {
      url: raw.url || '',
      title: raw.title ?? null,
      description: raw.description ?? null,
      funding_amount_min: (funding_amount_min != null && !isNaN(funding_amount_min)) ? funding_amount_min : null,
      funding_amount_max: (funding_amount_max != null && !isNaN(funding_amount_max)) ? funding_amount_max : null,
      currency: raw.currency ?? null,
      deadline: normalizedDeadline,
      open_deadline: raw.open_deadline || false,
      contact_email: raw.contact_email ?? null,
      contact_phone: raw.contact_phone ?? null,
      funding_types: (() => {
        const types = raw.funding_types || [];
        if (types.length === 0) return [];
        // Normalize funding types: ensure array, lowercase, remove duplicates
        const normalized = Array.isArray(types) ? types : [types];
        return [...new Set(normalized.map((t: any) => String(t).toLowerCase().trim()))].filter(Boolean);
      })(),
      program_focus: raw.program_focus || [],
      region: raw.region ?? null,
      categorized_requirements: raw.categorized_requirements || {},
      schema_version: raw.schema_version || '1.0',
      metadata_json: raw.metadata_json || {},
      fetched_at: raw.fetched_at || new Date().toISOString(),
      raw_html_path: raw.raw_html_path ?? null
    } as PageMetadata;
  } catch (e: any) {
    return {
      url: raw.url || '',
      title: raw.title || null,
      description: raw.description || null,
      funding_amount_min: null,
      funding_amount_max: null,
      currency: null,
      deadline: null,
      open_deadline: false,
      contact_email: null,
      contact_phone: null,
      funding_types: [],
      program_focus: [],
      region: null,
      categorized_requirements: raw.categorized_requirements || {},
      schema_version: '1.0',
      metadata_json: { _error: String(e) },
      fetched_at: raw.fetched_at || new Date().toISOString(),
      raw_html_path: null
    } as PageMetadata;
  }
}

export async function savePageWithRequirements(page: PageMetadata): Promise<number> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const pageResult = await client.query(
      `INSERT INTO pages (
        url, title, description,
        funding_amount_min, funding_amount_max, currency,
        deadline, open_deadline,
        contact_email, contact_phone,
        funding_types, program_focus, region,
        metadata_json, raw_html_path, fetched_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (url) 
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        funding_amount_min = EXCLUDED.funding_amount_min,
        funding_amount_max = EXCLUDED.funding_amount_max,
        currency = EXCLUDED.currency,
        deadline = EXCLUDED.deadline,
        open_deadline = EXCLUDED.open_deadline,
        contact_email = EXCLUDED.contact_email,
        contact_phone = EXCLUDED.contact_phone,
        funding_types = EXCLUDED.funding_types,
        program_focus = EXCLUDED.program_focus,
        region = EXCLUDED.region,
        metadata_json = EXCLUDED.metadata_json,
        raw_html_path = EXCLUDED.raw_html_path,
        updated_at = NOW()
      RETURNING id`,
      [
        page.url,
        page.title || null,
        page.description || null,
        // Convert to integer (round decimals) or null
        page.funding_amount_min != null ? Math.round(Number(page.funding_amount_min)) : null,
        page.funding_amount_max != null ? Math.round(Number(page.funding_amount_max)) : null,
        page.currency || 'EUR',
        // Deadline is already normalized to ISO format (YYYY-MM-DD) in normalizeMetadata
        page.deadline || null,
        page.open_deadline || false,
        page.contact_email || null,
        page.contact_phone || null,
        page.funding_types || [],
        page.program_focus || [],
        page.region || null,
        JSON.stringify(page.metadata_json || {}),
        page.raw_html_path || null,
        page.fetched_at || new Date().toISOString()
      ]
    );
    
    const pageId = pageResult.rows[0].id;
    
    await client.query('DELETE FROM requirements WHERE page_id = $1', [pageId]);
    
    if (page.categorized_requirements) {
      const requirements: any[] = [];
      
      // Apply learned requirement patterns (async, but we'll do it synchronously for now)
      let requirementPatterns: any = null;
      // NOTE: auto-learning module not yet implemented - skipping pattern learning
      // try {
      //   // Dynamic import with type assertion to handle optional module
      //   // @ts-ignore - Module may not exist, handled gracefully
      //   const autoLearningModule = await import('../src/learning/auto-learning').catch(() => null);
      //   if (autoLearningModule && typeof autoLearningModule.getStoredRequirementPatterns === 'function') {
      //     requirementPatterns = await autoLearningModule.getStoredRequirementPatterns();
      //   }
      // } catch {
      //   // Pattern learning not available yet, continue without filtering
      // }
      
      Object.entries(page.categorized_requirements).forEach(([category, items]) => {
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            // Normalize category to lowercase
            const normalizedCategory = category.toLowerCase();
            
            // Filter out requirements with meaningfulness < 30
            const meaningfulness = item.meaningfulness_score != null 
              ? Number(item.meaningfulness_score) 
              : null;
            
            // Skip if meaningfulness is too low (unless it's null, then we'll save it)
            // Lowered threshold to 10 to capture ALL valid requirements (100% completeness)
            if (meaningfulness !== null && meaningfulness < 10) {
              return; // Skip this requirement
            }
            
            // FIX #1: Filter out metadata fields that were incorrectly extracted as requirements
            const metadataFieldTypes = [
              'currency', 'funding_amount_min', 'funding_amount_max', 'funding_amount_status',
              'deadline', 'open_deadline', 'deadline_status', 'amount_status'
            ];
            if (metadataFieldTypes.includes(item.type?.toLowerCase() || '')) {
              return; // Skip - this is metadata, not a requirement
            }
            
            // Also filter out generic single-word values that are likely metadata
            const valueStr = String(item.value || '').trim();
            if (valueStr.length < 10 && /^(EUR|USD|GBP|CHF|fixed|variable|yes|no|true|false|both|none|all|any)$/i.test(valueStr)) {
              return; // Skip - too generic, likely metadata
            }
            
            // Apply learned requirement patterns (filter generic values, deduplicate)
            if (requirementPatterns && item.value) {
              const pattern = requirementPatterns.find((p: any) => p.category.toLowerCase() === normalizedCategory);
              if (pattern) {
                const valueLower = item.value.toLowerCase().trim();
                
                // Check if it's a generic value
                if (pattern.genericValues.some((g: string) => valueLower === g.toLowerCase().trim())) {
                  return; // Skip generic value
                }
                
                // Check for duplicates and deduplicate
                for (const dup of pattern.duplicatePatterns || []) {
                  if (dup.remove.some((r: string) => {
                    const rLower = r.toLowerCase();
                    return valueLower.includes(rLower) || rLower.includes(valueLower);
                  })) {
                    item.value = dup.keep; // Use the better version
                    break;
                  }
                }
              }
            }
            
            requirements.push({
              page_id: pageId,
              category: normalizedCategory, // Normalize to lowercase
              type: item.type || 'general',
              value: item.value || '',
              required: item.required !== undefined ? item.required : true,
              source: item.source || 'context_extraction',
              extraction_method: item.extraction_method || 'llm',
              confidence: item.confidence !== undefined ? item.confidence : 0.8,
              description: item.description || null,
              format: item.format || null,
              requirements: item.requirements ? JSON.stringify(item.requirements) : null,
              meaningfulness_score: meaningfulness
            });
          });
        }
      });
      
      if (requirements.length > 0) {
        const values = requirements.map((_req, idx) => {
          const base = idx * 12;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12})`;
        }).join(', ');
        
        const params = requirements.flatMap(req => [
          req.page_id, req.category, req.type, req.value, req.required, req.source,
          req.extraction_method, 
          // Ensure confidence is a number between 0 and 1
          req.confidence != null ? Math.max(0, Math.min(1, Number(req.confidence))) : 0.8,
          req.description, req.format,
          req.requirements, 
          // Ensure meaningfulness_score is an integer (0-100)
          req.meaningfulness_score != null ? Math.round(Math.max(0, Math.min(100, Number(req.meaningfulness_score)))) : null
        ]);
        
        await client.query(
          `INSERT INTO requirements (
            page_id, category, type, value, required, source,
            extraction_method, confidence,
            description, format, requirements, meaningfulness_score
          ) VALUES ${values}`,
          params
        );
      }
    }
    
    await client.query('COMMIT');
    return pageId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function isUrlInDatabase(url: string): Promise<boolean> {
  try {
    const pool = getPool();
    // Check if URL exists AND has at least 1 requirement (valid program)
    // Overview pages are allowed to be re-scraped
    const result = await pool.query(`
      SELECT p.id 
      FROM pages p
      WHERE p.url = $1
        AND (
          (metadata_json->>'is_overview_page')::boolean = true
          OR (SELECT COUNT(*) FROM requirements WHERE page_id = p.id) >= 1
        )
      LIMIT 1
    `, [url]);
    return result.rows.length > 0;
  } catch {
    return false;
  }
}

export async function getQueuedUrls(limit: number, includeExisting: boolean = false): Promise<string[]> {
  try {
    const pool = getPool();
    // If includeExisting is true, return queued URLs even if they're already in pages table (for force update)
    const existingFilter = includeExisting ? '' : 'AND p.id IS NULL';
    
    // IMPROVED: Add institution rotation and age-based priority boost
    // This prevents the same institutions (AWS/FFG) from always being processed first
    const result = await pool.query(`
      WITH ranked_urls AS (
        SELECT 
          j.url,
          j.quality_score,
          j.created_at,
          CASE 
            WHEN j.url LIKE '%aws.at%' THEN 'AWS'
            WHEN j.url LIKE '%ffg.at%' THEN 'FFG'
            WHEN j.url LIKE '%wko.at%' THEN 'WKO'
            WHEN j.url LIKE '%viennabusinessagency.at%' THEN 'VBA'
            WHEN j.url LIKE '%sfg.at%' THEN 'SFG'
            WHEN j.url LIKE '%standort-tirol.at%' THEN 'Standort Tirol'
            WHEN j.url LIKE '%wirtschaftsagentur-burgenland.at%' THEN 'WIBAG'
            WHEN j.url LIKE '%noe.gv.at%' THEN 'Land NÖ'
            WHEN j.url LIKE '%bmk.gv.at%' THEN 'BMK'
            ELSE 'Other'
          END as institution,
          -- Age-based priority boost: +1 quality per day old (max +30)
          LEAST(30, EXTRACT(EPOCH FROM (NOW() - j.created_at)) / 86400)::INTEGER as age_days,
          -- Institution rotation: Add random offset to prevent always processing same institution first
          ROW_NUMBER() OVER (PARTITION BY 
            CASE 
              WHEN j.url LIKE '%aws.at%' THEN 'AWS'
              WHEN j.url LIKE '%ffg.at%' THEN 'FFG'
              WHEN j.url LIKE '%wko.at%' THEN 'WKO'
              WHEN j.url LIKE '%viennabusinessagency.at%' THEN 'VBA'
              WHEN j.url LIKE '%sfg.at%' THEN 'SFG'
              WHEN j.url LIKE '%standort-tirol.at%' THEN 'Standort Tirol'
              WHEN j.url LIKE '%wirtschaftsagentur-burgenland.at%' THEN 'WIBAG'
              WHEN j.url LIKE '%noe.gv.at%' THEN 'Land NÖ'
              WHEN j.url LIKE '%bmk.gv.at%' THEN 'BMK'
              ELSE 'Other'
            END 
            ORDER BY j.quality_score DESC, j.created_at ASC
          ) as institution_rank
        FROM scraping_jobs j
        LEFT JOIN pages p ON j.url = p.url
        WHERE j.status = $1 
          ${existingFilter}
          AND j.url NOT LIKE '%cdn-cgi/l/email-protection%'
          AND j.url NOT LIKE '%email-protection#%'
          AND j.url NOT LIKE '%/sitemap/%'
          AND j.url NOT LIKE '%/accessibility/%'
          AND j.url NOT LIKE '%/data-protection/%'
          AND j.url NOT LIKE '%/disclaimer/%'
          AND j.url NOT LIKE '%facebook.com%'
          AND j.url NOT LIKE '%linkedin.com%'
          AND j.url NOT LIKE '%twitter.com%'
          AND j.url NOT LIKE '%x.com%'
          AND j.url NOT LIKE 'mailto:%'
          AND j.url NOT LIKE '%sharer%'
          AND j.url NOT LIKE '%shareArticle%'
      )
      SELECT url
      FROM ranked_urls
      ORDER BY 
        -- Prioritize by adjusted quality (original + age boost)
        (quality_score + age_days) DESC,
        -- Within same quality, rotate institutions (process 1 URL per institution, then next)
        institution_rank ASC,
        -- Finally, oldest first
        created_at ASC
      LIMIT $2
    `, ['queued', limit]);
    return result.rows.map((r: any) => r.url);
  } catch (error: any) {
    console.error('❌ getQueuedUrls error:', error.message);
    return [];
  }
}

export async function markUrlQueued(url: string, qualityScore?: number): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(`
      INSERT INTO scraping_jobs (url, status, depth, seed_url, quality_score)
      VALUES ($1, 'queued', 0, $1, $2)
      ON CONFLICT (url) DO UPDATE SET 
        status = 'queued', 
        quality_score = COALESCE(EXCLUDED.quality_score, scraping_jobs.quality_score),
        updated_at = NOW()
    `, [url, qualityScore || 50]);
  } catch {
    // Silently fail
  }
}

export async function markJobRunning(url: string): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(
      `UPDATE scraping_jobs 
         SET status = 'running', attempts = attempts + 1, updated_at = NOW()
       WHERE url = $1`,
      [url]
    );
  } catch {
    // Silently fail
  }
}

export async function markJobDone(url: string): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(
      `UPDATE scraping_jobs 
         SET status = 'done', last_error = NULL, last_fetched_at = NOW(), updated_at = NOW()
       WHERE url = $1`,
      [url]
    );
  } catch {
    // Silently fail
  }
}

export async function markJobFailed(url: string, errorMessage?: string): Promise<void> {
  try {
    const pool = getPool();
    await pool.query(
      `UPDATE scraping_jobs 
         SET status = 'failed', last_error = $2, updated_at = NOW()
       WHERE url = $1`,
      [url, errorMessage ? errorMessage.slice(0, 500) : null]
    );
  } catch {
    // Silently fail
  }
}

// ============================================================================
// PATTERN LEARNING
// ============================================================================

/**
 * Get all pages from database
 */
export async function getAllPages(limit: number = 1000): Promise<any[]> {
  try {
    const pool = getPool();
    const result = await pool.query(`
      SELECT 
        id, url, title, description,
        funding_amount_min, funding_amount_max, currency,
        deadline, open_deadline,
        contact_email, contact_phone,
        funding_types, program_focus, region,
        metadata_json, fetched_at, raw_html_path
      FROM pages
      ORDER BY fetched_at DESC
      LIMIT $1
    `, [limit]);
    return result.rows;
  } catch (error: any) {
    console.error('❌ getAllPages error:', error.message);
    return [];
  }
}

/**
 * Search pages with filters
 */
export async function searchPages(filters: {
  region?: string;
  funding_type?: string;
  limit?: number;
}): Promise<any[]> {
  try {
    const pool = getPool();
    const limit = filters.limit || 1000;
    let query = `
      SELECT 
        id, url, title, description,
        funding_amount_min, funding_amount_max, currency,
        deadline, open_deadline,
        contact_email, contact_phone,
        funding_types, program_focus, region,
        metadata_json, fetched_at, raw_html_path
      FROM pages
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramCount = 1;

    if (filters.region) {
      query += ` AND region = $${paramCount}`;
      params.push(filters.region);
      paramCount++;
    }

    if (filters.funding_type) {
      query += ` AND $${paramCount} = ANY(funding_types)`;
      params.push(filters.funding_type);
      paramCount++;
    }

    query += ` ORDER BY fetched_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error: any) {
    console.error('❌ searchPages error:', error.message);
    return [];
  }
}

export async function learnUrlPatternFromPage(url: string, host: string, success: boolean): Promise<void> {
  try {
    const pool = getPool();
    const urlObj = new URL(url);
    // Create more specific pattern: include path segments, not just :id replacement
    // This prevents too-broad patterns like "/program/:id" matching everything
    let path = urlObj.pathname;
    
    // Replace numbers with :id, but keep structure
    path = path.replace(/\d+/g, ':id');
    
    // FIX #5: Count path segments (non-empty)
    const pathSegments = path.split('/').filter(s => s.length > 0);
    
    // For exclusions, be more specific - require at least 2 path segments
    // This prevents excluding entire directories
    if (!success && pathSegments.length < 2) {
      // Too broad - don't learn exclusion for root-level paths
      return;
    }
    
    // For inclusions, also require at least 2 segments to avoid too-broad patterns
    // Exception: Very specific single-segment paths like "/foerdermanager" are OK
    if (success && pathSegments.length < 2 && !path.match(/^(foerdermanager|login|anmelden|connexion)$/i)) {
      // Too broad - don't learn inclusion for root-level paths
      return;
    }
    
    const patternType = success ? 'include' : 'exclude';
    
    // FIX #5: Improved confidence calculation:
    // - Inclusions: High confidence (0.9) - we know these work
    // - Exclusions: Start low (0.5), increase with confirmations
    //   - First exclusion: 0.5 (might be false positive)
    //   - After 3 confirmations: 0.7 (probably correct)
    //   - After 5 confirmations: 0.8 (very likely correct)
    //   - Only apply exclusions with confidence >= 0.7
    const baseConfidence = success ? 0.9 : 0.5;
    const successRate = success ? 100 : 0; // Exclusions have 0% success rate

    // Check existing pattern to calculate new confidence
    const existing = await pool.query(
      `SELECT usage_count, confidence FROM url_patterns 
       WHERE host = $1 AND pattern_type = $2 AND pattern = $3`,
      [host, patternType, path]
    );
    
    let newConfidence = baseConfidence;
    if (existing.rows.length > 0 && !success) {
      // For exclusions, increase confidence with confirmations
      const usageCount = existing.rows[0].usage_count + 1;
      if (usageCount >= 5) {
        newConfidence = 0.8; // High confidence after 5 confirmations
      } else if (usageCount >= 3) {
        newConfidence = 0.7; // Medium confidence after 3 confirmations
      } else {
        newConfidence = 0.5; // Low confidence initially
      }
    }

    await pool.query(
      `INSERT INTO url_patterns (host, pattern_type, pattern, learned_from_url, confidence, usage_count, success_rate)
       VALUES ($1, $2, $3, $4, $5, 1, $6)
       ON CONFLICT (host, pattern_type, pattern) DO UPDATE
         SET usage_count = url_patterns.usage_count + 1,
             success_rate = CASE 
               WHEN $2 = 'include' THEN 100 
               ELSE 0 
             END,
             confidence = CASE
               WHEN $2 = 'include' THEN GREATEST(url_patterns.confidence, $5)
               ELSE $5 -- Use calculated confidence for exclusions
             END,
             updated_at = NOW()`,
      [host, patternType, path, url, newConfidence, successRate]
    );
  } catch {
    // Silently fail
  }
}

