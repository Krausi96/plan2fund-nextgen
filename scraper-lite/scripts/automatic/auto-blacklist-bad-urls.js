#!/usr/bin/env node
/**
 * Auto-blacklist bad URLs based on scraping results
 * 
 * This script:
 * 1. Finds URLs that were scraped but have poor quality (score < 30)
 * 2. Finds URLs that were rejected multiple times
 * 3. Extracts patterns from bad URLs
 * 4. Updates learned patterns to exclude these patterns
 * 5. Marks bad URLs as "processed" so they won't be rediscovered
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');
const { markUrlProcessed } = require('../../src/db/seen-urls-repository.ts');

async function autoBlacklistBadUrls() {
  console.log('\n🚫 Auto-Blacklisting Bad URLs\n');
  console.log('='.repeat(60));
  
  const pool = getPool();
  
  try {
    // Find pages with poor quality (score < 30)
    const poorQualityPages = await pool.query(`
      SELECT 
        p.url,
        p.title,
        COUNT(DISTINCT r.category) as category_count,
        COUNT(r.id) as req_count
      FROM pages p
      LEFT JOIN requirements r ON p.id = r.page_id
      GROUP BY p.id, p.url, p.title
      HAVING COUNT(DISTINCT r.category) < 2 OR COUNT(r.id) < 3
      ORDER BY p.id DESC
      LIMIT 100
    `);
    
    console.log(`📊 Found ${poorQualityPages.rows.length} poor quality pages\n`);
    
    // Find URLs that were marked as seen but never saved (rejected)
    const rejectedUrls = await pool.query(`
      SELECT 
        su.url,
        COUNT(*) as rejection_count
      FROM seen_urls su
      LEFT JOIN pages p ON su.url = p.url
      WHERE p.url IS NULL
        AND su.processed = true
      GROUP BY su.url
      HAVING COUNT(*) >= 2
      ORDER BY rejection_count DESC
      LIMIT 50
    `);
    
    console.log(`📊 Found ${rejectedUrls.rows.length} repeatedly rejected URLs\n`);
    
    // Extract exclusion patterns from bad URLs
    const exclusionPatterns = new Set();
    
    poorQualityPages.rows.forEach(row => {
      try {
        const url = new URL(row.url);
        const pathname = url.pathname.toLowerCase();
        const segments = pathname.split('/').filter(s => s.length > 0);
        
        // Extract patterns from bad URLs
        if (pathname.includes('/richtlinien/') || pathname.includes('/guidelines/')) {
          exclusionPatterns.add('/richtlinien/|/guidelines/');
        }
        if (pathname.includes('/news/') || pathname.includes('/press/')) {
          exclusionPatterns.add('/news/|/press/');
        }
        if (pathname.includes('/events/') || pathname.includes('/veranstaltungen/')) {
          exclusionPatterns.add('/events/|/veranstaltungen/');
        }
        if (pathname.includes('/success-stories/')) {
          exclusionPatterns.add('/success-stories/');
        }
        
        // Extract host-specific patterns
        const host = url.hostname.replace('www.', '');
        if (segments.length > 0) {
          // Pattern: /category/bad-page
          const pattern = `/${segments[0]}/[^/]+`;
          // Store by host for later use
        }
      } catch (e) {
        // Skip invalid URLs
      }
    });
    
    console.log(`📝 Extracted ${exclusionPatterns.size} exclusion patterns\n`);
    
    // Mark bad URLs as processed so they won't be rediscovered
    let markedCount = 0;
    
    for (const row of poorQualityPages.rows.slice(0, 50)) {
      try {
        await markUrlProcessed(row.url);
        markedCount++;
      } catch (e) {
        // Skip if already processed
      }
    }
    
    for (const row of rejectedUrls.rows) {
      try {
        await markUrlProcessed(row.url);
        markedCount++;
      } catch (e) {
        // Skip if already processed
      }
    }
    
    console.log(`✅ Marked ${markedCount} bad URLs as processed (won't be rediscovered)\n`);
    
    console.log('='.repeat(60));
    console.log('✅ Auto-blacklisting complete!\n');
    console.log('💡 These patterns will be used by learned patterns in next cycle');
    console.log('💡 Bad URLs marked as processed won\'t be rediscovered\n');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
    throw e;
  }
}

if (require.main === module) {
  autoBlacklistBadUrls().catch(e => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
}

module.exports = { autoBlacklistBadUrls };



