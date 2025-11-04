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
    
    // Find pages missing ANY metadata OR missing requirements categories - CHECK EVERYTHING!
    // IMPORTANT: Pages that get complete metadata after re-scraping will be automatically skipped in next run
    const missingPages = await pool.query(`
      SELECT p.id, p.url, p.title,
        -- Count existing requirements categories
        COUNT(DISTINCT r.category) as req_categories_count
      FROM pages p
      LEFT JOIN requirements r ON p.id = r.page_id
      WHERE (
        -- ALL metadata fields - check EVERYTHING
        p.title IS NULL OR 
        p.description IS NULL OR
        (p.funding_amount_min IS NULL AND p.funding_amount_max IS NULL) OR
        p.currency IS NULL OR
        (p.deadline IS NULL AND (p.open_deadline IS NULL OR p.open_deadline = false)) OR
        (p.contact_email IS NULL AND p.contact_phone IS NULL) OR
        p.region IS NULL OR
        p.funding_types IS NULL OR array_length(p.funding_types, 1) IS NULL OR
        p.program_focus IS NULL OR array_length(p.program_focus, 1) IS NULL OR
        p.metadata_json IS NULL OR p.metadata_json = '{}'::jsonb
      )
      OR (
        -- Missing critical requirements categories (at least 5 should be present)
        NOT EXISTS (
          SELECT 1 FROM requirements r2 
          WHERE r2.page_id = p.id 
          AND r2.category IN ('eligibility', 'financial', 'documents', 'timeline', 'project')
        )
      )
      GROUP BY p.id, p.url, p.title
      ORDER BY 
        -- Prioritize pages missing critical requirements categories
        CASE WHEN COUNT(DISTINCT r.category) < 5 THEN 0 ELSE 1 END,
        -- Count how many metadata fields are missing - prioritize pages missing the most
        (
          CASE WHEN p.title IS NULL THEN 1 ELSE 0 END +
          CASE WHEN p.description IS NULL THEN 1 ELSE 0 END +
          CASE WHEN p.funding_amount_min IS NULL AND p.funding_amount_max IS NULL THEN 1 ELSE 0 END +
          CASE WHEN p.currency IS NULL THEN 1 ELSE 0 END +
          CASE WHEN p.deadline IS NULL AND (p.open_deadline IS NULL OR p.open_deadline = false) THEN 1 ELSE 0 END +
          CASE WHEN p.contact_email IS NULL AND p.contact_phone IS NULL THEN 1 ELSE 0 END +
          CASE WHEN p.region IS NULL THEN 1 ELSE 0 END +
          CASE WHEN p.funding_types IS NULL OR array_length(p.funding_types, 1) IS NULL THEN 1 ELSE 0 END +
          CASE WHEN p.program_focus IS NULL OR array_length(p.program_focus, 1) IS NULL THEN 1 ELSE 0 END +
          CASE WHEN p.metadata_json IS NULL OR p.metadata_json = '{}'::jsonb THEN 1 ELSE 0 END
        ) DESC,
        p.id DESC
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
      SELECT COUNT(DISTINCT p.id) as total
      FROM pages p
      LEFT JOIN requirements r ON p.id = r.page_id
      WHERE (
        -- ALL metadata fields
        p.title IS NULL OR 
        p.description IS NULL OR
        (p.funding_amount_min IS NULL AND p.funding_amount_max IS NULL) OR
        p.currency IS NULL OR
        (p.deadline IS NULL AND (p.open_deadline IS NULL OR p.open_deadline = false)) OR
        (p.contact_email IS NULL AND p.contact_phone IS NULL) OR
        p.region IS NULL OR
        p.funding_types IS NULL OR array_length(p.funding_types, 1) IS NULL OR
        p.program_focus IS NULL OR array_length(p.program_focus, 1) IS NULL OR
        p.metadata_json IS NULL OR p.metadata_json = '{}'::jsonb
      )
      OR (
        -- Missing critical requirements categories
        NOT EXISTS (
          SELECT 1 FROM requirements r2 
          WHERE r2.page_id = p.id 
          AND r2.category IN ('eligibility', 'financial', 'documents', 'timeline', 'project')
        )
      )
    `);
    const totalMissingAll = parseInt(totalMissingCount.rows[0].total);
    
    if (totalMissingAll > totalMissing) {
      console.log(`ℹ️  Note: ${totalMissingAll} total pages need re-scraping (processing ${totalMissing} now)`);
      console.log(`   Run this script again to process the remaining ${totalMissingAll - totalMissing} pages`);
    }
    
    // Count what's missing - CHECK EVERYTHING (metadata + requirements)
    const missingStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id) FILTER (WHERE p.title IS NULL) as missing_title,
        COUNT(DISTINCT p.id) FILTER (WHERE p.description IS NULL) as missing_description,
        COUNT(DISTINCT p.id) FILTER (WHERE p.funding_amount_min IS NULL AND p.funding_amount_max IS NULL) as missing_amounts,
        COUNT(DISTINCT p.id) FILTER (WHERE p.currency IS NULL) as missing_currency,
        COUNT(DISTINCT p.id) FILTER (WHERE p.deadline IS NULL AND (p.open_deadline IS NULL OR p.open_deadline = false)) as missing_deadlines,
        COUNT(DISTINCT p.id) FILTER (WHERE p.contact_email IS NULL AND p.contact_phone IS NULL) as missing_contacts,
        COUNT(DISTINCT p.id) FILTER (WHERE p.region IS NULL) as missing_region,
        COUNT(DISTINCT p.id) FILTER (WHERE p.funding_types IS NULL OR array_length(p.funding_types, 1) IS NULL) as missing_funding_types,
        COUNT(DISTINCT p.id) FILTER (WHERE p.program_focus IS NULL OR array_length(p.program_focus, 1) IS NULL) as missing_program_focus,
        COUNT(DISTINCT p.id) FILTER (WHERE p.metadata_json IS NULL OR p.metadata_json = '{}'::jsonb) as missing_metadata_json,
        COUNT(DISTINCT p.id) FILTER (WHERE NOT EXISTS (
          SELECT 1 FROM requirements r2 
          WHERE r2.page_id = p.id 
          AND r2.category IN ('eligibility', 'financial', 'documents', 'timeline', 'project')
        )) as missing_critical_reqs
      FROM pages p
      WHERE (
        p.title IS NULL OR 
        p.description IS NULL OR
        (p.funding_amount_min IS NULL AND p.funding_amount_max IS NULL) OR
        p.currency IS NULL OR
        (p.deadline IS NULL AND (p.open_deadline IS NULL OR p.open_deadline = false)) OR
        (p.contact_email IS NULL AND p.contact_phone IS NULL) OR
        p.region IS NULL OR
        p.funding_types IS NULL OR array_length(p.funding_types, 1) IS NULL OR
        p.program_focus IS NULL OR array_length(p.program_focus, 1) IS NULL OR
        p.metadata_json IS NULL OR p.metadata_json = '{}'::jsonb
      )
      OR (
        NOT EXISTS (
          SELECT 1 FROM requirements r 
          WHERE r.page_id = p.id 
          AND r.category IN ('eligibility', 'financial', 'documents', 'timeline', 'project')
        )
      )
    `);
    
    const stats = missingStats.rows[0];
    console.log(`\n📋 Missing Data Breakdown - ALL FIELDS:`);
    console.log(`   📄 Basic Fields:`);
    console.log(`      Title: ${stats.missing_title} pages`);
    console.log(`      Description: ${stats.missing_description} pages`);
    console.log(`   💰 Funding Fields:`);
    console.log(`      Funding Amounts: ${stats.missing_amounts} pages`);
    console.log(`      Currency: ${stats.missing_currency} pages`);
    console.log(`   📅 Timeline Fields:`);
    console.log(`      Deadlines: ${stats.missing_deadlines} pages`);
    console.log(`   📞 Contact Fields:`);
    console.log(`      Contact Info: ${stats.missing_contacts} pages`);
    console.log(`   📍 Classification Fields:`);
    console.log(`      Region: ${stats.missing_region} pages`);
    console.log(`      Funding Types: ${stats.missing_funding_types} pages`);
    console.log(`      Program Focus: ${stats.missing_program_focus} pages`);
    console.log(`   📊 Metadata Fields:`);
    console.log(`      Metadata JSON: ${stats.missing_metadata_json} pages`);
    
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
        
        // Get current page data to compare - CHECK EVERYTHING
        const currentPage = await pool.query('SELECT title, description, funding_amount_min, funding_amount_max, currency, deadline, open_deadline, contact_email, contact_phone, region, funding_types, program_focus, metadata_json FROM pages WHERE id = $1', [page.id]);
        const current = currentPage.rows[0];
        
        // Check what we got - ALL fields
        const before = {
          hasTitle: current.title !== null && current.title.trim().length > 0,
          hasDescription: current.description !== null && current.description.trim().length > 0,
          hasAmount: current.funding_amount_min !== null || current.funding_amount_max !== null,
          hasCurrency: current.currency !== null,
          hasDeadline: current.deadline !== null || current.open_deadline === true,
          hasContact: current.contact_email !== null || current.contact_phone !== null,
          hasRegion: current.region !== null,
          hasFundingTypes: current.funding_types && current.funding_types.length > 0,
          hasProgramFocus: current.program_focus && current.program_focus.length > 0,
          hasMetadataJson: current.metadata_json && Object.keys(current.metadata_json).length > 0
        };
        
        const after = {
          hasTitle: normalized.title !== null && normalized.title.trim().length > 0,
          hasDescription: normalized.description !== null && normalized.description.trim().length > 0,
          hasAmount: normalized.funding_amount_min !== null || normalized.funding_amount_max !== null,
          hasCurrency: normalized.currency !== null,
          hasDeadline: normalized.deadline !== null || normalized.open_deadline === true,
          hasContact: normalized.contact_email !== null || normalized.contact_phone !== null,
          hasRegion: normalized.region !== null,
          hasFundingTypes: normalized.funding_types && normalized.funding_types.length > 0,
          hasProgramFocus: normalized.program_focus && normalized.program_focus.length > 0,
          hasMetadataJson: normalized.metadata_json && Object.keys(normalized.metadata_json).length > 0
        };
        
        const improved = (!before.hasTitle && after.hasTitle) ||
                        (!before.hasDescription && after.hasDescription) ||
                        (!before.hasAmount && after.hasAmount) ||
                        (!before.hasCurrency && after.hasCurrency) ||
                        (!before.hasDeadline && after.hasDeadline) ||
                        (!before.hasContact && after.hasContact) ||
                        (!before.hasRegion && after.hasRegion) ||
                        (!before.hasFundingTypes && after.hasFundingTypes) ||
                        (!before.hasProgramFocus && after.hasProgramFocus) ||
                        (!before.hasMetadataJson && after.hasMetadataJson);
        
        if (improved) {
          improvedCount++;
          const improvements = [];
          if (!before.hasTitle && after.hasTitle) improvements.push('title');
          if (!before.hasDescription && after.hasDescription) improvements.push('description');
          if (!before.hasAmount && after.hasAmount) improvements.push('amount');
          if (!before.hasCurrency && after.hasCurrency) improvements.push('currency');
          if (!before.hasDeadline && after.hasDeadline) improvements.push('deadline');
          if (!before.hasContact && after.hasContact) improvements.push('contact');
          if (!before.hasRegion && after.hasRegion) improvements.push('region');
          if (!before.hasFundingTypes && after.hasFundingTypes) improvements.push('funding_types');
          if (!before.hasProgramFocus && after.hasProgramFocus) improvements.push('program_focus');
          if (!before.hasMetadataJson && after.hasMetadataJson) improvements.push('metadata_json');
          console.log(`  ✅ IMPROVED! Found: ${improvements.join(', ')}`);
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
    
    // Check final stats - ALL FIELDS
    console.log('\n📊 Final Metadata Coverage - ALL FIELDS:');
    const finalStats = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE title IS NOT NULL AND title != '') as has_title,
        COUNT(*) FILTER (WHERE description IS NOT NULL AND description != '') as has_description,
        COUNT(*) FILTER (WHERE funding_amount_min IS NOT NULL OR funding_amount_max IS NOT NULL) as has_amounts,
        COUNT(*) FILTER (WHERE currency IS NOT NULL) as has_currency,
        COUNT(*) FILTER (WHERE deadline IS NOT NULL OR open_deadline = true) as has_deadlines,
        COUNT(*) FILTER (WHERE contact_email IS NOT NULL OR contact_phone IS NOT NULL) as has_contacts,
        COUNT(*) FILTER (WHERE region IS NOT NULL) as has_region,
        COUNT(*) FILTER (WHERE funding_types IS NOT NULL AND array_length(funding_types, 1) > 0) as has_funding_types,
        COUNT(*) FILTER (WHERE program_focus IS NOT NULL AND array_length(program_focus, 1) > 0) as has_program_focus,
        COUNT(*) FILTER (WHERE metadata_json IS NOT NULL AND metadata_json != '{}'::jsonb) as has_metadata_json
      FROM pages
    `);
    
    const final = finalStats.rows[0];
    const total = parseInt(final.total);
    
    console.log(`   Title: ${final.has_title}/${total} (${(final.has_title / total * 100).toFixed(1)}%)`);
    console.log(`   Description: ${final.has_description}/${total} (${(final.has_description / total * 100).toFixed(1)}%)`);
    console.log(`   Funding Amounts: ${final.has_amounts}/${total} (${(final.has_amounts / total * 100).toFixed(1)}%)`);
    console.log(`   Currency: ${final.has_currency}/${total} (${(final.has_currency / total * 100).toFixed(1)}%)`);
    console.log(`   Deadlines: ${final.has_deadlines}/${total} (${(final.has_deadlines / total * 100).toFixed(1)}%)`);
    console.log(`   Contact Info: ${final.has_contacts}/${total} (${(final.has_contacts / total * 100).toFixed(1)}%)`);
    console.log(`   Region: ${final.has_region}/${total} (${(final.has_region / total * 100).toFixed(1)}%)`);
    console.log(`   Funding Types: ${final.has_funding_types}/${total} (${(final.has_funding_types / total * 100).toFixed(1)}%)`);
    console.log(`   Program Focus: ${final.has_program_focus}/${total} (${(final.has_program_focus / total * 100).toFixed(1)}%)`);
    console.log(`   Metadata JSON: ${final.has_metadata_json}/${total} (${(final.has_metadata_json / total * 100).toFixed(1)}%)`);
    
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

