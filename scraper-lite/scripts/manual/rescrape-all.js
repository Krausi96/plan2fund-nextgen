#!/usr/bin/env node
/**
 * Re-scrape ALL pages from database to improve data quality
 * 
 * This script reparses everything with improved extraction patterns
 * 
 * Usage: 
 *   node scripts/manual/rescrape-all.js              # Re-scrape all pages
 *   node scripts/manual/rescrape-all.js --missing    # Only pages with missing metadata
 *   node scripts/manual/rescrape-all.js --limit=100  # Process only first 100 pages
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');
const { extractMeta } = require('../../src/extract.ts');
const { normalizeMetadata } = require('../../src/extract.ts');
const { fetchHtml } = require('../../src/utils.ts');
const { savePageWithRequirements } = require('../../src/db/page-repository.ts');

// Quality measurement functions
async function measureQualityBefore(pool) {
  const stats = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE p.title IS NOT NULL AND p.title != '') as has_title,
      COUNT(*) FILTER (WHERE p.description IS NOT NULL AND p.description != '') as has_description,
      COUNT(*) FILTER (WHERE p.funding_amount_min IS NOT NULL OR p.funding_amount_max IS NOT NULL) as has_amounts,
      COUNT(*) FILTER (WHERE p.currency IS NOT NULL) as has_currency,
      COUNT(*) FILTER (WHERE p.deadline IS NOT NULL OR p.open_deadline = true) as has_deadlines,
      COUNT(*) FILTER (WHERE p.contact_email IS NOT NULL OR p.contact_phone IS NOT NULL) as has_contacts,
      COUNT(*) FILTER (WHERE p.region IS NOT NULL) as has_region,
      COUNT(*) FILTER (WHERE p.funding_types IS NOT NULL AND array_length(p.funding_types, 1) > 0) as has_funding_types,
      COUNT(*) FILTER (WHERE p.program_focus IS NOT NULL AND array_length(p.program_focus, 1) > 0) as has_program_focus,
      COUNT(*) FILTER (WHERE p.metadata_json IS NOT NULL AND p.metadata_json != '{}'::jsonb) as has_metadata_json,
      COUNT(DISTINCT r.page_id) FILTER (WHERE r.id IS NOT NULL) as has_requirements,
      COUNT(DISTINCT r.page_id) FILTER (
        WHERE r.category IN ('eligibility', 'financial', 'documents', 'timeline', 'project')
      ) as has_critical_reqs
    FROM pages p
    LEFT JOIN requirements r ON p.id = r.page_id
  `);
  
  return stats.rows[0];
}

async function calculateQualityScore(stats) {
  const total = parseInt(stats.total) || 0;
  if (total === 0) return 0;
  
  const weights = {
    title: 0.10,
    description: 0.10,
    amounts: 0.15,
    currency: 0.05,
    deadlines: 0.10,
    contacts: 0.10,
    region: 0.05,
    funding_types: 0.10,
    program_focus: 0.05,
    metadata_json: 0.05,
    requirements: 0.10,
    critical_reqs: 0.05
  };
  
  let score = 0;
  const safeParse = (val) => parseInt(val) || 0;
  
  score += (safeParse(stats.has_title) / total) * weights.title * 100;
  score += (safeParse(stats.has_description) / total) * weights.description * 100;
  score += (safeParse(stats.has_amounts) / total) * weights.amounts * 100;
  score += (safeParse(stats.has_currency) / total) * weights.currency * 100;
  score += (safeParse(stats.has_deadlines) / total) * weights.deadlines * 100;
  score += (safeParse(stats.has_contacts) / total) * weights.contacts * 100;
  score += (safeParse(stats.has_region) / total) * weights.region * 100;
  score += (safeParse(stats.has_funding_types) / total) * weights.funding_types * 100;
  score += (safeParse(stats.has_program_focus) / total) * weights.program_focus * 100;
  score += (safeParse(stats.has_metadata_json) / total) * weights.metadata_json * 100;
  score += (safeParse(stats.has_requirements) / total) * weights.requirements * 100;
  score += (safeParse(stats.has_critical_reqs) / total) * weights.critical_reqs * 100;
  
  const finalScore = Math.round(score * 10) / 10;
  return isNaN(finalScore) ? 0 : finalScore;
}

async function printQualityReport(stats, label = 'Quality Report') {
  const total = parseInt(stats.total) || 0;
  const score = await calculateQualityScore(stats);
  const safeScore = isNaN(score) ? 0 : score;
  
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📊 ${label}`);
  console.log('='.repeat(70));
  console.log(`📄 Basic Fields:`);
  console.log(`   Title:         ${stats.has_title}/${total} (${total > 0 ? ((parseInt(stats.has_title) || 0) / total * 100).toFixed(1) : 0}%)`);
  console.log(`   Description:   ${stats.has_description}/${total} (${total > 0 ? ((parseInt(stats.has_description) || 0) / total * 100).toFixed(1) : 0}%)`);
  console.log(`\n💰 Funding Fields:`);
  console.log(`   Amounts:       ${stats.has_amounts}/${total} (${total > 0 ? ((parseInt(stats.has_amounts) || 0) / total * 100).toFixed(1) : 0}%)`);
  console.log(`   Currency:       ${stats.has_currency}/${total} (${total > 0 ? ((parseInt(stats.has_currency) || 0) / total * 100).toFixed(1) : 0}%)`);
  console.log(`\n📅 Timeline Fields:`);
  console.log(`   Deadlines:     ${stats.has_deadlines}/${total} (${total > 0 ? ((parseInt(stats.has_deadlines) || 0) / total * 100).toFixed(1) : 0}%)`);
  console.log(`\n📞 Contact Fields:`);
  console.log(`   Contacts:      ${stats.has_contacts}/${total} (${total > 0 ? ((parseInt(stats.has_contacts) || 0) / total * 100).toFixed(1) : 0}%)`);
  console.log(`\n📍 Classification Fields:`);
  console.log(`   Region:        ${stats.has_region}/${total} (${total > 0 ? ((parseInt(stats.has_region) || 0) / total * 100).toFixed(1) : 0}%)`);
  console.log(`   Funding Types:  ${stats.has_funding_types}/${total} (${total > 0 ? ((parseInt(stats.has_funding_types) || 0) / total * 100).toFixed(1) : 0}%)`);
  console.log(`   Program Focus:  ${stats.has_program_focus}/${total} (${total > 0 ? ((parseInt(stats.has_program_focus) || 0) / total * 100).toFixed(1) : 0}%)`);
  console.log(`\n📊 Metadata:`);
  console.log(`   Metadata JSON:  ${stats.has_metadata_json}/${total} (${total > 0 ? ((parseInt(stats.has_metadata_json) || 0) / total * 100).toFixed(1) : 0}%)`);
  console.log(`\n📋 Requirements:`);
  console.log(`   Has Reqs:      ${stats.has_requirements}/${total} (${total > 0 ? ((parseInt(stats.has_requirements) || 0) / total * 100).toFixed(1) : 0}%)`);
  console.log(`   Critical Reqs: ${stats.has_critical_reqs}/${total} (${total > 0 ? ((parseInt(stats.has_critical_reqs) || 0) / total * 100).toFixed(1) : 0}%)`);
  console.log(`\n🎯 Overall Quality Score: ${safeScore.toFixed(1)}/100`);
  if (safeScore >= 80) {
    console.log('   ✅ Excellent data quality!');
  } else if (safeScore >= 60) {
    console.log('   ⚠️  Good data quality, room for improvement');
  } else if (safeScore >= 40) {
    console.log('   ⚠️  Moderate data quality, needs improvement');
  } else {
    console.log('   ❌ Poor data quality, significant improvement needed');
  }
  console.log('='.repeat(70));
}

async function rescrapeAll() {
  console.log('\n' + '='.repeat(70));
  console.log('🔄 RE-SCRAPING ALL PAGES TO IMPROVE DATA QUALITY');
  console.log('='.repeat(70));
  
  const pool = getPool();
  
  try {
    // Parse arguments
    const args = process.argv.slice(2);
    const missingOnly = args.includes('--missing');
    const limitArg = args.find(arg => arg.startsWith('--limit='));
    const limit = limitArg ? parseInt(limitArg.split('=')[1]) : null;
    
    // Measure quality BEFORE
    console.log('\n📊 Measuring quality BEFORE re-scraping...');
    const qualityBefore = await measureQualityBefore(pool);
    await printQualityReport(qualityBefore, 'Quality Report - BEFORE Re-scraping');
    
    // Find pages to re-scrape
    console.log('\n📋 Finding pages to re-scrape...');
    
    // First, check requirement coverage statistics
    const reqCoverageStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT p.id) as total_pages,
        COUNT(DISTINCT p.id) FILTER (WHERE NOT EXISTS (SELECT 1 FROM requirements r WHERE r.page_id = p.id)) as pages_with_no_reqs,
        COUNT(DISTINCT p.id) FILTER (WHERE (SELECT COUNT(DISTINCT r.category) FROM requirements r WHERE r.page_id = p.id) < 5) as pages_with_few_reqs,
        COUNT(DISTINCT p.id) FILTER (WHERE (SELECT COUNT(DISTINCT r.category) FROM requirements r WHERE r.page_id = p.id) < 10) as pages_with_less_than_10_cats,
        AVG((SELECT COUNT(DISTINCT r.category) FROM requirements r WHERE r.page_id = p.id)) as avg_categories_per_page
      FROM pages p
    `);
    
    const reqStats = reqCoverageStats.rows[0];
    console.log(`\n📊 Current Requirement Coverage:`);
    console.log(`   Total Pages: ${reqStats.total_pages}`);
    console.log(`   Pages with NO requirements: ${reqStats.pages_with_no_reqs} (${(reqStats.pages_with_no_reqs / reqStats.total_pages * 100).toFixed(1)}%)`);
    console.log(`   Pages with < 5 categories: ${reqStats.pages_with_few_reqs} (${(reqStats.pages_with_few_reqs / reqStats.total_pages * 100).toFixed(1)}%)`);
    console.log(`   Pages with < 10 categories: ${reqStats.pages_with_less_than_10_cats} (${(reqStats.pages_with_less_than_10_cats / reqStats.total_pages * 100).toFixed(1)}%)`);
    console.log(`   Avg categories per page: ${parseFloat(reqStats.avg_categories_per_page || 0).toFixed(1)} / 19`);
    
    let query;
    if (missingOnly) {
      // PRIORITIZE REQUIREMENTS FIRST - Only get pages with missing requirements OR very few categories
      // Then also include pages with missing metadata if they also have < 10 categories
      query = `
        SELECT p.id, p.url, p.title,
          COUNT(DISTINCT r.category) as req_categories_count,
          (SELECT COUNT(*) FROM requirements r3 WHERE r3.page_id = p.id) as total_req_count
        FROM pages p
        LEFT JOIN requirements r ON p.id = r.page_id
        WHERE (
          -- PRIORITY 1: Pages with NO requirements at all
          NOT EXISTS (SELECT 1 FROM requirements r2 WHERE r2.page_id = p.id)
          -- PRIORITY 2: Pages with very few categories (< 5)
          OR (SELECT COUNT(DISTINCT r4.category) FROM requirements r4 WHERE r4.page_id = p.id) < 5
          -- PRIORITY 3: Pages with missing metadata AND < 10 categories (need both requirements AND metadata)
          OR (
            (SELECT COUNT(DISTINCT r5.category) FROM requirements r5 WHERE r5.page_id = p.id) < 10
            AND (
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
          )
        )
        GROUP BY p.id, p.url, p.title
        ORDER BY 
          -- STRICT priority: NO requirements FIRST
          CASE WHEN COUNT(DISTINCT r.category) = 0 OR COUNT(DISTINCT r.category) IS NULL THEN 0 ELSE 1 END,
          -- Then pages with very few categories (< 5)
          CASE WHEN COUNT(DISTINCT r.category) < 5 THEN 1 ELSE 2 END,
          -- Then pages with less than 10 categories
          CASE WHEN COUNT(DISTINCT r.category) < 10 THEN 3 ELSE 4 END,
          -- Then by category count (ascending - fewer is better)
          COUNT(DISTINCT r.category) ASC,
          p.id DESC
      `;
    } else {
      query = `
        SELECT p.id, p.url, p.title,
          COUNT(DISTINCT r.category) as req_categories_count,
          (SELECT COUNT(*) FROM requirements r3 WHERE r3.page_id = p.id) as total_req_count
        FROM pages p
        LEFT JOIN requirements r ON p.id = r.page_id
        GROUP BY p.id, p.url, p.title
        ORDER BY 
          -- Prioritize pages with NO or few requirements
          CASE WHEN COUNT(DISTINCT r.category) = 0 OR COUNT(DISTINCT r.category) IS NULL THEN 0 ELSE 1 END,
          COUNT(DISTINCT r.category) ASC,
          p.id DESC
      `;
    }
    
    if (limit) {
      query += ` LIMIT ${limit}`;
    } else if (missingOnly) {
      query += ` LIMIT 500`;
    }
    
    const pagesToRescrape = await pool.query(query);
    const totalMissing = pagesToRescrape.rows.length;
    
    // Show breakdown of pages to rescrape
    const pagesWithNoReqs = pagesToRescrape.rows.filter(p => !p.req_categories_count || p.req_categories_count === 0).length;
    const pagesWithFewReqs = pagesToRescrape.rows.filter(p => p.req_categories_count && p.req_categories_count < 5).length;
    
    console.log(`✅ Found ${totalMissing} pages to re-scrape`);
    if (missingOnly) {
      console.log(`   (Pages with missing metadata OR missing requirements)`);
      console.log(`   - ${pagesWithNoReqs} pages with NO requirements`);
      console.log(`   - ${pagesWithFewReqs} pages with < 5 requirement categories`);
    } else {
      console.log(`   (ALL pages, prioritized by missing requirements)`);
    }
    
    if (totalMissing === 0) {
      console.log('✅ No pages to re-scrape!');
      return;
    }
    
    console.log(`\n🚀 Starting re-scraping...`);
    console.log(`   Processing ${totalMissing} pages`);
    console.log(`   Using improved extraction patterns\n`);
    
    let successCount = 0;
    let errorCount = 0;
    let improvedCount = 0;
    const improvements = {
      title: 0,
      description: 0,
      amounts: 0,
      currency: 0,
      deadlines: 0,
      contacts: 0,
      region: 0,
      funding_types: 0,
      program_focus: 0,
      metadata_json: 0,
      requirements: 0
    };
    
    const startTime = Date.now();
    
    for (let i = 0; i < totalMissing; i++) {
      const page = pagesToRescrape.rows[i];
      const progress = `[${i + 1}/${totalMissing}]`;
      
      try {
        console.log(`${progress} Scraping: ${page.url.slice(0, 60)}...`);
        
        // Fetch and extract
        const fetchResult = await fetchHtml(page.url);
        const meta = extractMeta(fetchResult.html, page.url);
        const normalized = normalizeMetadata(meta);
        
        // Get current page data to compare (including requirements)
        const currentPage = await pool.query(`
          SELECT title, description, funding_amount_min, funding_amount_max, currency, 
                 deadline, open_deadline, contact_email, contact_phone, region, 
                 funding_types, program_focus, metadata_json 
          FROM pages WHERE id = $1
        `, [page.id]);
        const current = currentPage.rows[0];
        
        // Get current requirements count
        const currentReqs = await pool.query(`
          SELECT 
            COUNT(*) as total_count,
            COUNT(DISTINCT category) as category_count,
            array_agg(DISTINCT category) as categories
          FROM requirements WHERE page_id = $1
        `, [page.id]);
        const reqBefore = currentReqs.rows[0];
        const categoriesBefore = reqBefore.categories || [];
        
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
          hasMetadataJson: current.metadata_json && Object.keys(current.metadata_json).length > 0,
          reqCount: parseInt(reqBefore.total_count || 0),
          reqCategories: parseInt(reqBefore.category_count || 0),
          categoriesList: categoriesBefore
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
        
        // Check metadata improvements
        const metadataImproved = (!before.hasTitle && after.hasTitle) ||
                        (!before.hasDescription && after.hasDescription) ||
                        (!before.hasAmount && after.hasAmount) ||
                        (!before.hasCurrency && after.hasCurrency) ||
                        (!before.hasDeadline && after.hasDeadline) ||
                        (!before.hasContact && after.hasContact) ||
                        (!before.hasRegion && after.hasRegion) ||
                        (!before.hasFundingTypes && after.hasFundingTypes) ||
                        (!before.hasProgramFocus && after.hasProgramFocus) ||
                        (!before.hasMetadataJson && after.hasMetadataJson);
        
        if (metadataImproved) {
          const improvementList = [];
          if (!before.hasTitle && after.hasTitle) { improvements.title++; improvementList.push('title'); }
          if (!before.hasDescription && after.hasDescription) { improvements.description++; improvementList.push('description'); }
          if (!before.hasAmount && after.hasAmount) { improvements.amounts++; improvementList.push('amounts'); }
          if (!before.hasCurrency && after.hasCurrency) { improvements.currency++; improvementList.push('currency'); }
          if (!before.hasDeadline && after.hasDeadline) { improvements.deadlines++; improvementList.push('deadlines'); }
          if (!before.hasContact && after.hasContact) { improvements.contacts++; improvementList.push('contacts'); }
          if (!before.hasRegion && after.hasRegion) { improvements.region++; improvementList.push('region'); }
          if (!before.hasFundingTypes && after.hasFundingTypes) { improvements.funding_types++; improvementList.push('funding_types'); }
          if (!before.hasProgramFocus && after.hasProgramFocus) { improvements.program_focus++; improvementList.push('program_focus'); }
          if (!before.hasMetadataJson && after.hasMetadataJson) { improvements.metadata_json++; improvementList.push('metadata_json'); }
          if (improvementList.length > 0) {
            console.log(`  ✅ IMPROVED! Found: ${improvementList.join(', ')}`);
          }
        }
        
        // Save to database (will update existing page via ON CONFLICT)
        normalized.url = page.url; // Ensure URL matches
        const pageId = await savePageWithRequirements(normalized);
        
        // Check requirements after saving
        const reqsAfter = await pool.query(`
          SELECT 
            COUNT(*) as total_count,
            COUNT(DISTINCT category) as category_count,
            array_agg(DISTINCT category) as categories
          FROM requirements WHERE page_id = $1
        `, [pageId]);
        const reqAfter = reqsAfter.rows[0];
        const categoriesAfter = reqAfter.categories || [];
        
        // Check if requirements improved
        const reqImproved = parseInt(reqAfter.total_count || 0) > before.reqCount || 
                          parseInt(reqAfter.category_count || 0) > before.reqCategories;
        
        if (reqImproved) {
          improvedCount++;
          improvements.requirements++;
          const newCategories = categoriesAfter.filter((cat) => !categoriesBefore.includes(cat));
          if (newCategories.length > 0) {
            console.log(`  ✅ IMPROVED Requirements! Added ${parseInt(reqAfter.total_count || 0) - before.reqCount} requirements, ${newCategories.length} new categories: ${newCategories.join(', ')}`);
          } else {
            console.log(`  ✅ IMPROVED Requirements! Added ${parseInt(reqAfter.total_count || 0) - before.reqCount} requirements`);
          }
        } else if (metadataImproved) {
          improvedCount++;
        }
        
        successCount++;
        
        // Log progress every 10 pages
        if ((i + 1) % 10 === 0) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
          const rate = (i + 1) / (elapsed / 60);
          console.log(`\n📊 Progress: ${i + 1}/${totalMissing} | Success: ${successCount} | Improved: ${improvedCount} | Errors: ${errorCount}`);
          console.log(`   Rate: ${rate.toFixed(1)} pages/min | Elapsed: ${elapsed}s\n`);
        }
        
        // Small delay to be respectful
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        errorCount++;
        const errorMsg = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
        console.error(`  ❌ Error: ${errorMsg.slice(0, 100)}`);
        continue;
      }
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ RE-SCRAPING COMPLETE');
    console.log('='.repeat(70));
    console.log(`📊 Results:`);
    console.log(`   Total Processed: ${totalMissing}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Improved: ${improvedCount} pages got new metadata`);
    console.log(`   Time Elapsed: ${elapsed}s`);
    console.log(`   Average Rate: ${(successCount / (elapsed / 60)).toFixed(1)} pages/min`);
    
    console.log(`\n📈 Improvements by Field:`);
    Object.entries(improvements).forEach(([field, count]) => {
      if (count > 0) {
        console.log(`   ${field.padEnd(20)}: ${count} pages`);
      }
    });
    
    console.log('='.repeat(70));
    
    // Measure quality AFTER
    console.log('\n📊 Measuring quality AFTER re-scraping...');
    const qualityAfter = await measureQualityBefore(pool);
    await printQualityReport(qualityAfter, 'Quality Report - AFTER Re-scraping');
    
    // Calculate improvement
    const scoreBefore = await calculateQualityScore(qualityBefore);
    const scoreAfter = await calculateQualityScore(qualityAfter);
    const improvement = scoreAfter - scoreBefore;
    
    console.log(`\n📊 Quality Improvement:`);
    console.log(`   Before: ${scoreBefore.toFixed(1)}/100`);
    console.log(`   After:  ${scoreAfter.toFixed(1)}/100`);
    console.log(`   Change: ${improvement >= 0 ? '+' : ''}${improvement.toFixed(1)} points`);
    
    if (improvement > 0) {
      console.log(`   ✅ Data quality improved!`);
    } else if (improvement === 0) {
      console.log(`   ⚠️  No change in quality score`);
    } else {
      console.log(`   ⚠️  Quality score decreased (may be due to data validation)`);
    }
    
    console.log('\n✅ Done!');
    
  } catch (error) {
    const errorMsg = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
    console.error('\n❌ Fatal error:', errorMsg);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  rescrapeAll().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { rescrapeAll, measureQualityBefore, calculateQualityScore };

