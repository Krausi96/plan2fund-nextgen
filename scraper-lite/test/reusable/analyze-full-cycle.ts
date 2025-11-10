/**
 * Comprehensive Full Cycle Analysis
 * Analyzes: Discovery, Scraping, Learning, Data Quality, Patterns
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

import { getPool } from '../../db/db';
import { 
  getStoredQualityRules, 
  getStoredRequirementPatterns,
  getClassificationAccuracy,
  getLearningStatus
} from '../../src/learning/auto-learning';

async function analyzeFullCycle() {
  const pool = getPool();
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 FULL CYCLE ANALYSIS');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  // ========================================================================
  // 1. URL DISCOVERY ANALYSIS
  // ========================================================================
  console.log('🔍 1. URL DISCOVERY');
  console.log('─'.repeat(60));
  
  // Hardcoded seeds
  const { getAllSeedUrls } = await import('../../src/config/config');
  const allSeeds = await getAllSeedUrls();
  console.log(`   Total Seed URLs: ${allSeeds.length}`);
  
  // Discovered seeds
  const discoveredSeeds = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE source_type = 'overview_page') as overview,
      COUNT(*) FILTER (WHERE source_type = 'listing_page') as listing,
      COUNT(*) FILTER (WHERE last_checked IS NULL) as never_checked
    FROM discovered_seed_urls
    WHERE is_active = true
  `);
  
  const ds = discoveredSeeds.rows[0];
  console.log(`   Discovered Seeds: ${ds.total} (${ds.overview} overview, ${ds.listing} listing)`);
  console.log(`   Never Checked: ${ds.never_checked}`);
  
  // Queue status
  const queue = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE status = 'queued') as queued,
      COUNT(*) FILTER (WHERE status = 'processing') as processing,
      COUNT(*) FILTER (WHERE status = 'failed') as failed,
      COUNT(*) FILTER (WHERE status = 'completed') as completed
    FROM scraping_jobs
  `);
  
  const q = queue.rows[0];
  console.log(`   Queue: ${q.queued} queued, ${q.processing} processing, ${q.failed} failed, ${q.completed} completed`);
  
  // ========================================================================
  // 2. SCRAPING ANALYSIS
  // ========================================================================
  console.log('\n📄 2. SCRAPING');
  console.log('─'.repeat(60));
  
  const scraping = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE fetched_at > NOW() - INTERVAL '24 hours') as today,
      COUNT(*) FILTER (WHERE fetched_at > NOW() - INTERVAL '7 days') as week,
      COUNT(*) FILTER (WHERE metadata_json->>'requires_login' = 'true') as requires_login,
      COUNT(*) FILTER (WHERE metadata_json->>'is_overview_page' = 'true') as overview_pages
    FROM pages
    WHERE funding_types IS NOT NULL
  `);
  
  const s = scraping.rows[0];
  console.log(`   Total Pages: ${s.total}`);
  console.log(`   Scraped Today: ${s.today}`);
  console.log(`   Scraped This Week: ${s.week}`);
  console.log(`   Requires Login: ${s.requires_login}`);
  console.log(`   Overview Pages: ${s.overview_pages}`);
  
  // ========================================================================
  // 3. REQUIREMENTS ANALYSIS
  // ========================================================================
  console.log('\n📝 3. REQUIREMENTS ANALYSIS');
  console.log('─'.repeat(60));
  
  // Requirements are in separate table, count per page
  const requirements = await pool.query(`
    SELECT 
      COUNT(DISTINCT p.id) as total_pages,
      COUNT(DISTINCT p.id) FILTER (WHERE req_counts.req_count >= 5) as good_pages,
      COUNT(DISTINCT p.id) FILTER (WHERE req_counts.req_count < 5) as low_quality,
      AVG(req_counts.req_count) as avg_requirements,
      MIN(req_counts.req_count) as min_requirements,
      MAX(req_counts.req_count) as max_requirements
    FROM pages p
    LEFT JOIN (
      SELECT page_id, COUNT(*) as req_count
      FROM requirements
      GROUP BY page_id
    ) req_counts ON p.id = req_counts.page_id
    WHERE p.funding_types IS NOT NULL
  `);
  
  const r = requirements.rows[0];
  console.log(`   Total Pages: ${r.total_pages}`);
  console.log(`   Good Pages (5+ reqs): ${r.good_pages} (${((r.good_pages / r.total_pages) * 100).toFixed(1)}%)`);
  console.log(`   Low Quality (<5 reqs): ${r.low_quality} (${((r.low_quality / r.total_pages) * 100).toFixed(1)}%)`);
  console.log(`   Avg Requirements: ${parseFloat(r.avg_requirements || 0).toFixed(1)}`);
  console.log(`   Range: ${r.min_requirements} - ${r.max_requirements} requirements`);
  
  // Requirements by category
  const categories = await pool.query(`
    SELECT 
      category,
      COUNT(*) as count,
      COUNT(DISTINCT page_id) as pages_with_category
    FROM requirements
    GROUP BY category
    ORDER BY count DESC
    LIMIT 10
  `);
  
  console.log(`\n   Top Categories:`);
  for (const cat of categories.rows) {
    console.log(`      ${cat.category}: ${cat.count} requirements (${cat.pages_with_category} pages)`);
  }
  
  // ========================================================================
  // 4. DATA QUALITY ANALYSIS
  // ========================================================================
  console.log('\n✅ 4. DATA QUALITY');
  console.log('─'.repeat(60));
  
  // Completeness
  const completeness = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE title IS NOT NULL) as has_title,
      COUNT(*) FILTER (WHERE description IS NOT NULL) as has_description,
      COUNT(*) FILTER (WHERE funding_amount_min IS NOT NULL OR funding_amount_max IS NOT NULL) as has_amount,
      COUNT(*) FILTER (WHERE deadline IS NOT NULL) as has_deadline,
      COUNT(*) FILTER (WHERE contact_email IS NOT NULL) as has_email,
      COUNT(*) FILTER (WHERE region IS NOT NULL) as has_region
    FROM pages
    WHERE funding_types IS NOT NULL
  `);
  
  const c = completeness.rows[0];
  const total = parseInt(c.total);
  console.log(`   Completeness (${total} pages):`);
  console.log(`      Title: ${c.has_title} (${((c.has_title / total) * 100).toFixed(1)}%)`);
  console.log(`      Description: ${c.has_description} (${((c.has_description / total) * 100).toFixed(1)}%)`);
  console.log(`      Amount: ${c.has_amount} (${((c.has_amount / total) * 100).toFixed(1)}%)`);
  console.log(`      Deadline: ${c.has_deadline} (${((c.has_deadline / total) * 100).toFixed(1)}%)`);
  console.log(`      Contact: ${c.has_email} (${((c.has_email / total) * 100).toFixed(1)}%)`);
  console.log(`      Region: ${c.has_region} (${((c.has_region / total) * 100).toFixed(1)}%)`);
  
  // Meaningfulness - check for generic values
  const meaningful = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE value NOT IN ('SME', 'all', 'none specified', 'Austria', 'EUR', 'variable', 'fixed')) as meaningful_values
    FROM requirements
    WHERE value IS NOT NULL
  `);
  
  console.log(`\n   Meaningfulness: ${meaningful.rows[0].meaningful_values} non-generic requirement values`);
  
  // ========================================================================
  // 5. LEARNING ANALYSIS
  // ========================================================================
  console.log('\n🧠 5. LEARNING SYSTEM');
  console.log('─'.repeat(60));
  
  const learning = await getLearningStatus();
  console.log(`   Classification Accuracy: ${learning.classificationAccuracy.toFixed(1)}%`);
  console.log(`   Quality Rules Learned: ${learning.qualityRulesLearned}`);
  console.log(`   URL Patterns Learned: ${learning.urlPatternsLearned}`);
  console.log(`   Total Feedback Records: ${learning.totalFeedback}`);
  
  // Requirement patterns
  const reqPatterns = await getStoredRequirementPatterns();
  console.log(`\n   Requirement Patterns: ${reqPatterns.length} categories`);
  for (const pattern of reqPatterns.slice(0, 5)) {
    console.log(`      ${pattern.category}: ${pattern.genericValues.length} generic values, ${pattern.duplicatePatterns?.length || 0} duplicate patterns`);
  }
  
  // ========================================================================
  // 6. FUNDING TYPES
  // ========================================================================
  console.log('\n💰 6. FUNDING TYPES');
  console.log('─'.repeat(60));
  
  const fundingTypes = await pool.query(`
    SELECT 
      unnest(funding_types) as funding_type,
      COUNT(*) as count
    FROM pages
    WHERE funding_types IS NOT NULL
    GROUP BY unnest(funding_types)
    ORDER BY count DESC
  `);
  
  for (const ft of fundingTypes.rows) {
    console.log(`   ${ft.funding_type}: ${ft.count} pages`);
  }
  
  // ========================================================================
  // 7. RECENT ACTIVITY
  // ========================================================================
  console.log('\n🕐 7. RECENT ACTIVITY (Last 24h)');
  console.log('─'.repeat(60));
  
  const recent = await pool.query(`
    SELECT 
      COUNT(*) as pages_scraped,
      COUNT(DISTINCT metadata_json->>'institution') as institutions,
      AVG(req_counts.req_count) as avg_requirements
    FROM pages p
    LEFT JOIN (
      SELECT page_id, COUNT(*) as req_count
      FROM requirements
      GROUP BY page_id
    ) req_counts ON p.id = req_counts.page_id
    WHERE p.fetched_at > NOW() - INTERVAL '24 hours'
  `);
  
  const rec = recent.rows[0];
  console.log(`   Pages Scraped: ${rec.pages_scraped}`);
  console.log(`   Institutions: ${rec.institutions}`);
  console.log(`   Avg Requirements: ${parseFloat(rec.avg_requirements || 0).toFixed(1)}`);
  
  // ========================================================================
  // SUMMARY
  // ========================================================================
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📊 SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Discovery: ${ds.total} discovered seeds, ${q.queued} in queue`);
  console.log(`✅ Scraping: ${s.total} total pages, ${s.today} scraped today`);
  console.log(`✅ Quality: ${r.good_pages}/${r.total_pages} good pages (${((r.good_pages / r.total_pages) * 100).toFixed(1)}%)`);
  console.log(`✅ Learning: ${learning.classificationAccuracy.toFixed(1)}% accuracy, ${learning.urlPatternsLearned} patterns`);
  console.log('═══════════════════════════════════════════════════════════\n');
  
  await pool.end();
}

analyzeFullCycle().catch(console.error);

