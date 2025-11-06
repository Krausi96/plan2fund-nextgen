#!/usr/bin/env node
/**
 * Learn Institution-Specific Patterns
 * 
 * Learns URL patterns and exclusion keywords from successful/failed scrapes
 * Updates institution-specific patterns automatically
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');
const { 
  learnUrlPatternFromPage, 
  learnExclusionKeyword,
  recordInstitutionPattern 
} = require('../../src/db/institution-pattern-repository.ts');

async function learnInstitutionPatterns() {
  console.log('\n🧠 Learning Institution-Specific Patterns\n');
  console.log('='.repeat(60));
  
  const pool = getPool();
  
  try {
    // Get pages with their quality scores
    const pagesResult = await pool.query(`
      SELECT 
        p.id,
        p.url,
        COUNT(DISTINCT r.category) as category_count,
        COUNT(r.id) as req_count,
        CASE 
          WHEN COUNT(DISTINCT r.category) >= 3 AND (p.funding_amount_min IS NOT NULL OR p.funding_amount_max IS NOT NULL) THEN true
          ELSE false
        END as is_good_page
      FROM pages p
      LEFT JOIN requirements r ON p.id = r.page_id
      GROUP BY p.id, p.url, p.funding_amount_min, p.funding_amount_max
      ORDER BY p.id DESC
      LIMIT 500
    `);
    
    console.log(`📊 Analyzing ${pagesResult.rows.length} pages...\n`);
    
    let learnedCount = 0;
    const hostStats = {};
    
    for (const page of pagesResult.rows) {
      try {
        const url = new URL(page.url);
        const host = url.hostname.replace('www.', '');
        
        if (!hostStats[host]) {
          hostStats[host] = { good: 0, bad: 0, learned: 0 };
        }
        
        const isGoodPage = page.is_good_page || (page.category_count >= 2 && page.req_count >= 3);
        
        if (isGoodPage) {
          hostStats[host].good++;
        } else {
          hostStats[host].bad++;
        }
        
        // Learn URL patterns
        await learnUrlPatternFromPage(page.url, host, isGoodPage);
        
        // Learn exclusion keywords from bad pages
        if (!isGoodPage) {
          const pathname = url.pathname.toLowerCase();
          const exclusionKeywords = ['news', 'press', 'events', 'richtlinien', 'guidelines', 'policy', 'events-workshop', 'veranstaltung'];
          
          for (const keyword of exclusionKeywords) {
            if (pathname.includes(keyword)) {
              await learnExclusionKeyword(page.url, host, keyword);
              hostStats[host].learned++;
            }
          }
        }
        
        learnedCount++;
      } catch (e) {
        // Skip invalid URLs
      }
    }
    
    console.log(`✅ Learned patterns from ${learnedCount} pages\n`);
    
    // Show statistics by host
    console.log('📊 Statistics by Host:\n');
    Object.entries(hostStats).forEach(([host, stats]) => {
      const total = stats.good + stats.bad;
      const goodRate = total > 0 ? Math.round((stats.good / total) * 100) : 0;
      console.log(`  ${host}:`);
      console.log(`    Good: ${stats.good} (${goodRate}%)`);
      console.log(`    Bad: ${stats.bad}`);
      console.log(`    Learned patterns: ${stats.learned}\n`);
    });
    
    console.log('='.repeat(60));
    console.log('✅ Institution pattern learning complete!\n');
    console.log('💡 Learned patterns are now used automatically in discovery\n');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
    throw e;
  }
}

if (require.main === module) {
  learnInstitutionPatterns().catch(e => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
}

module.exports = { learnInstitutionPatterns };



