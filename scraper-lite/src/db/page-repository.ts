/**
 * Page Repository
 * Saves pages and requirements to database with extraction method and confidence
 */

import { getPool } from './neon-client';
import { PageMetadata } from '../extract';

export async function savePageWithRequirements(page: PageMetadata): Promise<number> {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Save page
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
        page.funding_amount_min || null,
        page.funding_amount_max || null,
        page.currency || 'EUR',
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
    
    // Delete existing requirements for this page
    await client.query('DELETE FROM requirements WHERE page_id = $1', [pageId]);
    
    // Save requirements with extraction method and confidence
    if (page.categorized_requirements) {
      const requirements: any[] = [];
      
      Object.entries(page.categorized_requirements).forEach(([category, items]) => {
        if (Array.isArray(items)) {
          items.forEach((item: any) => {
            requirements.push({
              page_id: pageId,
              category,
              type: item.type || 'general',
              value: item.value || '',
              required: item.required !== undefined ? item.required : true,
              source: item.source || 'context_extraction',
              extraction_method: item.extraction_method || 'pattern',
              confidence: item.confidence !== undefined ? item.confidence : (item.extraction_method === 'llm' ? 0.8 : 1.0),
              description: item.description || null,
              format: item.format || null,
              requirements: item.requirements ? JSON.stringify(item.requirements) : null,
              meaningfulness_score: item.meaningfulness_score || null
            });
          });
        }
      });
      
      if (requirements.length > 0) {
        // Batch insert requirements
        const values = requirements.map((req, idx) => {
          const base = idx * 12;
          return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11}, $${base + 12})`;
        }).join(', ');
        
        const params = requirements.flatMap(req => [
          req.page_id,
          req.category,
          req.type,
          req.value,
          req.required,
          req.source,
          req.extraction_method,
          req.confidence,
          req.description,
          req.format,
          req.requirements,
          req.meaningfulness_score
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

