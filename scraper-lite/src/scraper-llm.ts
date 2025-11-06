/**
 * LLM-Enhanced Scraper
 * Integrates LLM extraction into the scraper workflow
 * Can be used as a drop-in replacement or hybrid approach
 */

import { extractWithLLM, extractHybrid } from './llm-extract';
import { scrape as patternScrape } from './scraper';
import { LitePage } from './scraper';

export type ExtractionMode = 'llm' | 'hybrid' | 'pattern';

interface ScrapeOptions {
  mode?: ExtractionMode;
  url: string;
  html: string;
  title?: string;
  description?: string;
}

/**
 * Scrape page with LLM extraction
 */
export async function scrapeWithLLM(options: ScrapeOptions): Promise<LitePage> {
  const { mode = 'llm', url, html, title, description } = options;
  
  let extractionResult;
  
  switch (mode) {
    case 'llm':
      // Full LLM extraction
      extractionResult = await extractWithLLM({ html, url, title, description });
      break;
      
    case 'hybrid':
      // Hybrid: pattern-based for high coverage, LLM for missing
      extractionResult = await extractHybrid(html, url, title, description);
      break;
      
    case 'pattern':
      // Pattern-based only (fallback)
      const { extractAllRequirements, extractMeta } = await import('./extract');
      const cheerio = await import('cheerio');
      const $ = cheerio.load(html);
      const text = $('body').text();
      const categorized = await extractAllRequirements(text, url);
      const meta = extractMeta($, html, url);
      extractionResult = {
        categorized_requirements: categorized,
        metadata: meta
      };
      break;
      
    default:
      throw new Error(`Unknown extraction mode: ${mode}`);
  }
  
  // Use existing scraper logic for quality assessment, etc.
  // This is a simplified version - you may want to integrate more deeply
  const page: LitePage = {
    url,
    title: title || extractionResult.metadata.program_focus?.[0] || 'Unknown Program',
    description: description || 'No description available',
    funding_amount_min: extractionResult.metadata.funding_amount_min,
    funding_amount_max: extractionResult.metadata.funding_amount_max,
    currency: extractionResult.metadata.currency,
    deadline: extractionResult.metadata.deadline,
    open_deadline: extractionResult.metadata.open_deadline,
    contact_email: extractionResult.metadata.contact_email,
    contact_phone: extractionResult.metadata.contact_phone,
    categorized_requirements: extractionResult.categorized_requirements,
    fetched_at: new Date().toISOString()
  };
  
  return page;
}

/**
 * Get extraction mode from environment or config
 */
export function getExtractionMode(): ExtractionMode {
  const mode = process.env.EXTRACTION_MODE || 'hybrid';
  
  if (mode === 'llm' || mode === 'hybrid' || mode === 'pattern') {
    return mode;
  }
  
  return 'hybrid'; // Default to hybrid
}

