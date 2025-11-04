#!/usr/bin/env node
/**
 * Re-scrape pages with missing metadata from database
 * 
 * Finds pages missing funding amounts, deadlines, or contact info
 * Re-scrapes them with improved extraction patterns
 * Updates database with new data
 * 
 * Usage: node scripts/manual/rescrape-missing-metadata.js
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');
const { extractMeta } = require('../../src/extract.ts');
const { normalizeMetadata } = require('../../src/extract.ts');
const { fetchHtml } = require('../../src/utils.ts');
const { savePageWithRequirements } = require('../../src/db/page-repository.ts');

async function rescrapeMissingMetadata() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 RE-SCRAPING PAGES WITH MISSING METADATA');
  console.log('='.repeat(70));
  
  const pool = getPool();
  
  try {
    // Find pages missing critical metadata
    console.log('\n📊 Finding pages with missing metadata...');
    
    // Find pages missing ANY critical metadata
    // Pages that already have complete metadata will be automatically skipped
    const missingPages = await pool.query(`
      SELECT id, url, title,
        CASE WHEN funding_amount_min IS NULL AND funding_amount_max IS NULL THEN 'amount' ELSE '' END as missing_amount,
        CASE WHEN deadline IS NULL AND (open_deadline IS NULL OR open_deadline = false) THEN 'deadline' ELSE '' END as missing_deadline,
        CASE WHEN contact_email IS NULL AND contact_phone IS NULL THEN 'contact' ELSE '' END as missing_contact
      FROM pages
      WHERE (
        (funding_amount_min IS NULL AND funding_amount_max IS NULL) OR
        (deadline IS NULL AND (open_deadline IS NULL OR open_deadline = false)) OR
        (contact_email IS NULL AND contact_phone IS NULL)
      )
      ORDER BY id DESC
      LIMIT 500
    `);
    
    const totalMissing = missingPages.rows.length;
    console.log(`✅ Found ${totalMissing} pages with missing metadata`);
    
    if (totalMissing === 0) {
      console.log('✅ All pages have complete metadata!');
      return;
    }
    
    // Check if there are more pages beyond the limit
    const totalMissingCount = await pool.query(`
      SELECT COUNT(*) as total
      FROM pages
      WHERE (
        (funding_amount_min IS NULL AND funding_amount_max IS NULL) OR
        (deadline IS NULL AND (open_deadline IS NULL OR open_deadline = false)) OR
        (contact_email IS NULL AND contact_phone IS NULL)
      )
    `);
    const totalMissingAll = parseInt(totalMissingCount.rows[0].total);
    
    if (totalMissingAll > totalMissing) {
      console.log(`ℹ️  Note: ${totalMissingAll} total pages need re-scraping (processing ${totalMissing} now)`);
      console.log(`   Run this script again to process the remaining ${totalMissingAll - totalMissing} pages`);
    }
    
    // Count what's missing
    const missingStats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE funding_amount_min IS NULL AND funding_amount_max IS NULL) as missing_amounts,
        COUNT(*) FILTER (WHERE deadline IS NULL) as missing_deadlines,
        COUNT(*) FILTER (WHERE contact_email IS NULL AND contact_phone IS NULL) as missing_contacts
      FROM pages
      WHERE (
        funding_amount_min IS NULL OR
        funding_amount_max IS NULL OR
        deadline IS NULL OR
        contact_email IS NULL OR
        contact_phone IS NULL
      )
    `);
    
    const stats = missingStats.rows[0];
    console.log(`\n📋 Missing Data Breakdown:`);
    console.log(`   Funding Amounts: ${stats.missing_amounts} pages`);
    console.log(`   Deadlines: ${stats.missing_deadlines} pages`);
    console.log(`   Contact Info: ${stats.missing_contacts} pages`);
    
    console.log(`\n🚀 Starting re-scraping...`);
    console.log(`   Processing ${totalMissing} pages (limit 500 per run)`);
    console.log(`   Using improved extraction patterns (table-based, expanded keywords)\n`);
    
    let successCount = 0;
    let errorCount = 0;
    let improvedCount = 0;
    
    for (let i = 0; i < totalMissing; i++) {
      const page = missingPages.rows[i];
      const progress = `[${i + 1}/${totalMissing}]`;
      
      try {
        console.log(`${progress} Scraping: ${page.url.slice(0, 60)}...`);
        
        // Fetch and extract
        const fetchResult = await fetchHtml(page.url);
        const meta = extractMeta(fetchResult.html, page.url);
        const normalized = normalizeMetadata(meta);
        
        // Check what we got
        const before = {
          hasAmount: page.funding_amount_min !== null || page.funding_amount_max !== null,
          hasDeadline: page.deadline !== null,
          hasContact: page.contact_email !== null || page.contact_phone !== null
        };
        
        const after = {
          hasAmount: normalized.funding_amount_min !== null || normalized.funding_amount_max !== null,
          hasDeadline: normalized.deadline !== null || normalized.open_deadline === true,
          hasContact: normalized.contact_email !== null || normalized.contact_phone !== null
        };
        
        const improved = (!before.hasAmount && after.hasAmount) ||
                        (!before.hasDeadline && after.hasDeadline) ||
                        (!before.hasContact && after.hasContact);
        
        if (improved) {
          improvedCount++;
          console.log(`  ✅ IMPROVED! Found: ${after.hasAmount ? 'amount' : ''} ${after.hasDeadline ? 'deadline' : ''} ${after.hasContact ? 'contact' : ''}`);
        }
        
        // Save to database (will update existing page via ON CONFLICT)
        normalized.url = page.url; // Ensure URL matches
        const pageId = await savePageWithRequirements(normalized);
        
        successCount++;
        
        // Log progress every 10 pages
        if ((i + 1) % 10 === 0) {
          console.log(`\n📊 Progress: ${i + 1}/${totalMissing} | Success: ${successCount} | Improved: ${improvedCount} | Errors: ${errorCount}\n`);
        }
        
        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        errorCount++;
        const errorMsg = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
        console.error(`  ❌ Error: ${errorMsg.slice(0, 100)}`);
        
        // Continue with next page
        continue;
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ RE-SCRAPING COMPLETE');
    console.log('='.repeat(70));
    console.log(`📊 Results:`);
    console.log(`   Total Processed: ${totalMissing}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Improved: ${improvedCount} pages got new metadata`);
    console.log('='.repeat(70));
    
    // Check final stats
    console.log('\n📊 Final Metadata Coverage:');
    const finalStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE funding_amount_min IS NOT NULL OR funding_amount_max IS NOT NULL) as has_amounts,
        COUNT(*) FILTER (WHERE deadline IS NOT NULL OR open_deadline = true) as has_deadlines,
        COUNT(*) FILTER (WHERE contact_email IS NOT NULL OR contact_phone IS NOT NULL) as has_contacts
      FROM pages
    `);
    
    const final = finalStats.rows[0];
    const total = parseInt(final.total);
    const amountsPct = ((final.has_amounts / total) * 100).toFixed(1);
    const deadlinesPct = ((final.has_deadlines / total) * 100).toFixed(1);
    const contactsPct = ((final.has_contacts / total) * 100).toFixed(1);
    
    console.log(`   Funding Amounts: ${final.has_amounts}/${total} (${amountsPct}%)`);
    console.log(`   Deadlines: ${final.has_deadlines}/${total} (${deadlinesPct}%)`);
    console.log(`   Contact Info: ${final.has_contacts}/${total} (${contactsPct}%)`);
    
    console.log('\n✅ Done! Run verify-database-quality.js to see full quality metrics.');
    
  } catch (error) {
    const errorMsg = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
    console.error('\n❌ Fatal error:', errorMsg);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  rescrapeMissingMetadata().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { rescrapeMissingMetadata };

