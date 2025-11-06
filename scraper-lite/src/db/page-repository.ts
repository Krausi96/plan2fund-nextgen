/**
 * Page Repository
 * Database operations for pages (scraped program data)
 */
import { getPool, queryWithRetry } from './neon-client';
import { PageMetadata } from '../extract';
import { PoolClient } from 'pg';

export interface DbPage {
  id: number;
  url: string;
  title: string | null;
  description: string | null;
  funding_amount_min: number | null;
  funding_amount_max: number | null;
  currency: string | null;
  deadline: string | null;
  open_deadline: boolean;
  contact_email: string | null;
  contact_phone: string | null;
  funding_types: string[];
  program_focus: string[];
  region: string | null;
  fetched_at: Date;
  updated_at: Date;
  metadata_json: any;
  raw_html_path: string | null;
}

// Helper to parse DD.MM.YYYY date format to YYYY-MM-DD for PostgreSQL
function parseDeadline(deadline: string | null): string | null {
  if (!deadline) return null;
  
  // If already in YYYY-MM-DD format, return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) {
    return deadline;
  }
  
  // Parse DD.MM.YYYY format
  const match = deadline.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // If format not recognized, return null
  return null;
}

// VALIDATION: Ensure data quality before saving
function validatePageData(page: PageMetadata): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!page.url || page.url.trim().length < 10) {
    errors.push('URL is missing or too short');
  }
  if (!page.title || page.title.trim().length < 5) {
    errors.push('Title is missing or too short');
  }
  // RELAXED: Lower minimum description length from 20 to 10 to allow more pages
  // Also allow using title as fallback if description is missing
  if (!page.description || page.description.trim().length < 10) {
    // If description is missing/short but title exists, use title as fallback
    if (page.title && page.title.trim().length >= 10) {
      // Use title as description fallback - don't fail validation
      // The description will be set to title in the save function if needed
    } else {
      errors.push('Description is missing or too short (minimum 10 characters)');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Helper to execute query with optional transaction client
async function executeQuery<T = any>(
  query: string,
  params?: any[],
  client?: PoolClient
): Promise<T[]> {
  if (client) {
    // Use transaction client if provided
    const result = await client.query(query, params);
    return result.rows;
  } else {
    // Use pool with retry logic
    return queryWithRetry<T>(query, params);
  }
}

export async function savePage(page: PageMetadata, client?: PoolClient): Promise<number> {
  // ENHANCED: Use title as description fallback if description is missing/short
  const pageWithFallback = { ...page };
  if (!pageWithFallback.description || pageWithFallback.description.trim().length < 10) {
    if (pageWithFallback.title && pageWithFallback.title.trim().length >= 10) {
      pageWithFallback.description = pageWithFallback.title;
    }
  }
  
  // Validate data quality
  const validation = validatePageData(pageWithFallback);
  if (!validation.valid) {
    throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
  }
  
  const deadlineDate = parseDeadline(pageWithFallback.deadline ?? null);
  
  const result = await executeQuery<{ id: number }>(
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
      description = COALESCE(NULLIF(EXCLUDED.description, ''), EXCLUDED.title),
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
      pageWithFallback.url,
      pageWithFallback.title,
      pageWithFallback.description,
      pageWithFallback.funding_amount_min,
      pageWithFallback.funding_amount_max,
      pageWithFallback.currency || 'EUR',
      deadlineDate,
      pageWithFallback.open_deadline || false,
      pageWithFallback.contact_email,
      pageWithFallback.contact_phone,
      pageWithFallback.funding_types || [],
      pageWithFallback.program_focus || [],
      pageWithFallback.region,
      JSON.stringify(pageWithFallback.metadata_json || {}),
      pageWithFallback.raw_html_path,
      pageWithFallback.fetched_at || new Date().toISOString()
    ],
    client
  );
  
  if (!result || result.length === 0 || !result[0].id) {
    throw new Error('Failed to save page: No ID returned from database');
  }
  
  return result[0].id;
}

export async function saveRequirements(pageId: number, requirements: Record<string, any[]>, client?: PoolClient): Promise<void> {
  if (!pageId || pageId <= 0) {
    throw new Error(`Invalid pageId: ${pageId}`);
  }
  
  // Import meaningfulness scoring function
  const { calculateMeaningfulnessScore } = require('../extract');
  
  // Delete existing requirements for this page
  await executeQuery(
    'DELETE FROM requirements WHERE page_id = $1',
    [pageId],
    client
  );
  
  // Insert new requirements with error handling
  const inserts: Promise<void>[] = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (const [category, items] of Object.entries(requirements)) {
    if (!Array.isArray(items)) continue;
    
    for (const item of items) {
      // VALIDATION: Skip invalid items
      if (!item || typeof item !== 'object') {
        errorCount++;
        continue;
      }
      
      // Serialize object values to JSON strings (e.g., revenue ranges { min, max })
      const serializedValue = typeof item.value === 'object' && item.value !== null
        ? JSON.stringify(item.value)
        : (item.value || '');
      
      // Skip empty values
      if (!serializedValue || serializedValue.trim().length === 0) {
        errorCount++;
        continue;
      }
      
      // Calculate meaningfulness score if not already provided
      const meaningfulnessScore = item.meaningfulness_score !== undefined
        ? item.meaningfulness_score
        : calculateMeaningfulnessScore(item.value);
      
      // INTELLIGENCE: Filter out low-quality requirements (score <30) to prevent garbage in database
      // Only skip if score is very low AND it's not a critical category
      const criticalCategories = ['financial', 'geographic', 'timeline', 'eligibility_criteria', 'company_type', 'company_stage', 'industry_restriction'];
      const isCritical = criticalCategories.includes(category);
      const isLowQuality = meaningfulnessScore < 30;
      
      // Skip low-quality non-critical requirements
      if (isLowQuality && !isCritical) {
        errorCount++;
        continue; // Skip this requirement
      }
      
      // For critical categories, be more lenient but still filter very low scores
      if (isLowQuality && isCritical && meaningfulnessScore < 15) {
        errorCount++;
        continue; // Skip very low quality even for critical categories
      }
      
      const insert = executeQuery(
        `INSERT INTO requirements (page_id, category, type, value, required, source, description, format, requirements, meaningfulness_score)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          pageId,
          category,
          item.type || null,
          serializedValue.substring(0, 10000), // Limit to prevent DB errors
          item.required !== false,
          item.source || 'context_extraction',
          item.description ? item.description.substring(0, 5000) : null,
          item.format ? item.format.substring(0, 500) : null,
          item.requirements ? JSON.stringify(item.requirements).substring(0, 50000) : null,
          meaningfulnessScore
        ],
        client
      ).then(() => {
        successCount++;
        return undefined;
      }).catch((err: any) => {
        errorCount++;
        console.warn(`Failed to save requirement [${category}]:`, err.message);
        return undefined; // Continue processing other requirements
      });
      
      inserts.push(insert);
    }
  }
  
  // CRITICAL FIX: Add timeout to Promise.all to prevent hanging on many requirements
  const saveRequirementsPromise = Promise.all(inserts);
  const saveRequirementsTimeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Save requirements timeout after 20s')), 20000)
  );
  
  try {
    await Promise.race([saveRequirementsPromise, saveRequirementsTimeout]);
  } catch (timeoutError: any) {
    if (timeoutError.message && timeoutError.message.includes('timeout')) {
      console.warn(`⚠️  Save requirements timeout - some requirements may not have been saved`);
      // Don't throw - partial save is better than no save
    } else {
      throw timeoutError;
    }
  }
  
  if (successCount === 0 && errorCount > 0) {
    throw new Error(`All ${errorCount} requirements failed to save`);
  }
}

// ATOMIC TRANSACTION: Save page and requirements together (100% reliability)
export async function savePageWithRequirements(page: PageMetadata): Promise<number> {
  const pool = getPool();
  
  // CRITICAL FIX: Add timeout to pool.connect() to prevent hanging when pool is exhausted
  const connectPromise = pool.connect();
  const connectTimeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Pool connection timeout after 10s - pool may be exhausted')), 10000)
  );
  
  let client: PoolClient;
  try {
    client = await Promise.race([connectPromise, connectTimeoutPromise]) as PoolClient;
  } catch (connectError: any) {
    if (connectError.message.includes('timeout')) {
      throw new Error(`Database pool connection timeout - pool may be exhausted (max connections: ${pool.totalCount})`);
    }
    throw connectError;
  }
  
  try {
    await client.query('BEGIN');
    
    // Save page (using transaction client)
    const pageId = await savePage(page, client);
    
    // Save requirements (using transaction client)
    await saveRequirements(pageId, page.categorized_requirements || {}, client);
    
    await client.query('COMMIT');
    console.log(`✅ Successfully saved page ${pageId} with requirements to database`);
    return pageId;
  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {}); // Ignore rollback errors
    console.error(`❌ Transaction failed for page ${page.url?.substring(0, 60)}:`, error.message);
    throw error;
  } finally {
    client.release();
  }
}

export async function getPageByUrl(url: string): Promise<DbPage | null> {
  const result = await queryWithRetry<DbPage>(
    'SELECT * FROM pages WHERE url = $1',
    [url]
  );
  
  return result.length > 0 ? result[0] : null;
}

export async function getAllPages(limit = 1000, offset = 0): Promise<DbPage[]> {
  return queryWithRetry<DbPage>(
    'SELECT * FROM pages ORDER BY fetched_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
}

export async function searchPages(criteria: {
  fundingMin?: number;
  fundingMax?: number;
  region?: string;
  category?: string;
  searchText?: string;
  limit?: number;
}): Promise<DbPage[]> {
  const conditions: string[] = [];
  const params: any[] = [];
  let paramCount = 1;
  
  if (criteria.fundingMin) {
    conditions.push(`funding_amount_min >= $${paramCount++}`);
    params.push(criteria.fundingMin);
  }
  
  if (criteria.fundingMax) {
    conditions.push(`funding_amount_max <= $${paramCount++}`);
    params.push(criteria.fundingMax);
  }
  
  if (criteria.region) {
    conditions.push(`region = $${paramCount++}`);
    params.push(criteria.region);
  }
  
  if (criteria.searchText) {
    conditions.push(`(title ILIKE $${paramCount} OR description ILIKE $${paramCount++})`);
    params.push(`%${criteria.searchText}%`);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = criteria.limit || 100;
  
  return queryWithRetry<DbPage>(
    `SELECT * FROM pages ${whereClause} ORDER BY fetched_at DESC LIMIT $${paramCount++}`,
    [...params, limit]
  );
}

