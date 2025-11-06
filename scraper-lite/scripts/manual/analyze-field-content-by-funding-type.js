#!/usr/bin/env node
/**
 * Analyze Field Content by Funding Type
 * 
 * Analyzes 10 mixed URLs (different funding types) and shows:
 * - What's in each field (category and metadata)
 * - What's missing
 * - What needs improvement
 * - Patterns recognized based on funding type and other categories
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');

async function analyzeFieldContent() {
  console.log('\n📊 ANALYZING FIELD CONTENT BY FUNDING TYPE\n');
  console.log('='.repeat(80));
  
  const pool = getPool();
  
  try {
    // Get 10 random pages with different funding types
    const pages = await pool.query(`
      SELECT 
        p.id,
        p.url,
        p.title,
        SUBSTRING(p.url FROM 'https?://([^/]+)') as host,
        p.funding_amount_min,
        p.funding_amount_max,
        p.deadline,
        p.open_deadline,
        p.contact_email,
        p.contact_phone,
        p.metadata_json->>'funding_type' as funding_type,
        json_agg(
          json_build_object(
            'category', r.category,
            'type', r.type,
            'value', r.value,
            'meaningfulness', r.meaningfulness_score
          )
        ) FILTER (WHERE r.id IS NOT NULL) as requirements
      FROM pages p
      LEFT JOIN requirements r ON p.id = r.page_id
      GROUP BY p.id, p.url, p.title, p.funding_amount_min, p.funding_amount_max, 
               p.deadline, p.open_deadline, p.contact_email, p.contact_phone, p.metadata_json
      ORDER BY RANDOM()
      LIMIT 10
    `);
    
    if (pages.rows.length === 0) {
      console.log('\n⚠️  No pages in database. Run a batch first.\n');
      return;
    }
    
    console.log(`\n📄 ANALYZING ${pages.rows.length} PAGES\n`);
    
    // Group by funding type for pattern analysis
    const byFundingType = {};
    
    pages.rows.forEach((page, i) => {
      const reqs = page.requirements || [];
      const byCategory = {};
      
      reqs.forEach(req => {
        if (!byCategory[req.category]) {
          byCategory[req.category] = [];
        }
        byCategory[req.category].push(req);
      });
      
      const fundingType = page.funding_type || 'unknown';
      if (!byFundingType[fundingType]) {
        byFundingType[fundingType] = [];
      }
      byFundingType[fundingType].push({ page, byCategory, reqs });
      
      console.log('\n' + '='.repeat(80));
      console.log(`${i + 1}. [${fundingType.toUpperCase()}] ${page.host}`);
      console.log(`   URL: ${page.url}`);
      console.log(`   Title: ${(page.title || 'NO TITLE').substring(0, 70)}`);
      
      // Metadata
      console.log(`\n   📋 METADATA:`);
      console.log(`      Funding Min: ${page.funding_amount_min || 'NULL'}`);
      console.log(`      Funding Max: ${page.funding_amount_max || 'NULL'}`);
      console.log(`      Deadline: ${page.deadline || 'NULL'}`);
      console.log(`      Open Deadline: ${page.open_deadline ? 'YES' : 'NO'}`);
      console.log(`      Contact Email: ${page.contact_email || 'NULL'}`);
      console.log(`      Contact Phone: ${page.contact_phone || 'NULL'}`);
      
      // Requirements by category
      const categories = ['eligibility', 'documents', 'financial', 'timeline', 'geographic', 
                         'team', 'project', 'impact', 'consortium', 'technical', 'legal'];
      
      console.log(`\n   📝 REQUIREMENTS (${reqs.length} items, ${Object.keys(byCategory).length} categories):\n`);
      
      categories.forEach(category => {
        const items = byCategory[category] || [];
        if (items.length > 0) {
          console.log(`      ${category.toUpperCase()} (${items.length}):`);
          items.slice(0, 2).forEach((item, idx) => {
            const value = String(item.value || '').trim();
            const displayValue = value.length > 80 ? value.substring(0, 80) + '...' : value;
            const meaningfulness = item.meaningfulness || 0;
            const status = meaningfulness >= 70 ? '✅' : meaningfulness >= 50 ? '⚠️' : '❌';
            console.log(`         ${status} ${displayValue}`);
          });
          if (items.length > 2) {
            console.log(`         ... and ${items.length - 2} more`);
          }
        } else {
          console.log(`      ${category.toUpperCase()}: ❌ EMPTY`);
        }
      });
    });
    
    // Pattern Analysis
    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 PATTERN ANALYSIS BY FUNDING TYPE\n');
    
    Object.keys(byFundingType).forEach(fundingType => {
      const pagesOfType = byFundingType[fundingType];
      console.log(`\n${fundingType.toUpperCase()} (${pagesOfType.length} pages):`);
      
      // Analyze what's commonly present/missing
      const categoryPresence = {};
      let hasFundingAmount = 0;
      let hasDeadline = 0;
      let hasContact = 0;
      
      pagesOfType.forEach(({ page, byCategory }) => {
        Object.keys(byCategory).forEach(cat => {
          categoryPresence[cat] = (categoryPresence[cat] || 0) + 1;
        });
        if (page.funding_amount_min || page.funding_amount_max) hasFundingAmount++;
        if (page.deadline || page.open_deadline) hasDeadline++;
        if (page.contact_email || page.contact_phone) hasContact++;
      });
      
      console.log(`   📊 Metadata Coverage:`);
      console.log(`      Funding Amount: ${hasFundingAmount}/${pagesOfType.length} (${Math.round(hasFundingAmount/pagesOfType.length*100)}%)`);
      console.log(`      Deadline: ${hasDeadline}/${pagesOfType.length} (${Math.round(hasDeadline/pagesOfType.length*100)}%)`);
      console.log(`      Contact: ${hasContact}/${pagesOfType.length} (${Math.round(hasContact/pagesOfType.length*100)}%)`);
      
      console.log(`   📊 Category Coverage:`);
      const categories = ['eligibility', 'documents', 'financial', 'timeline', 'geographic', 
                         'team', 'project', 'impact', 'consortium', 'technical', 'legal'];
      categories.forEach(cat => {
        const count = categoryPresence[cat] || 0;
        const percentage = Math.round(count / pagesOfType.length * 100);
        const status = percentage >= 70 ? '✅' : percentage >= 50 ? '⚠️' : '❌';
        console.log(`      ${status} ${cat}: ${count}/${pagesOfType.length} (${percentage}%)`);
      });
    });
    
    // Overall Recommendations
    console.log('\n' + '='.repeat(80));
    console.log('\n💡 RECOMMENDATIONS\n');
    
    const allCategories = ['eligibility', 'documents', 'financial', 'timeline', 'geographic', 
                          'team', 'project', 'impact', 'consortium', 'technical', 'legal'];
    
    const overallCategoryPresence = {};
    pages.rows.forEach(page => {
      const reqs = page.requirements || [];
      reqs.forEach(req => {
        overallCategoryPresence[req.category] = (overallCategoryPresence[req.category] || 0) + 1;
      });
    });
    
    console.log('   Missing Categories (need improvement):');
    allCategories.forEach(cat => {
      const count = overallCategoryPresence[cat] || 0;
      const percentage = Math.round(count / pages.rows.length * 100);
      if (percentage < 50) {
        console.log(`      ❌ ${cat}: Only ${percentage}% coverage - needs more keywords/patterns`);
      }
    });
    
    console.log('\n   Missing Metadata:');
    let missingFunding = 0;
    let missingDeadline = 0;
    let missingContact = 0;
    pages.rows.forEach(page => {
      if (!page.funding_amount_min && !page.funding_amount_max) missingFunding++;
      if (!page.deadline && !page.open_deadline) missingDeadline++;
      if (!page.contact_email && !page.contact_phone) missingContact++;
    });
    
    if (missingFunding > 0) {
      console.log(`      ❌ Funding Amount: ${missingFunding}/${pages.rows.length} missing - improve extraction from descriptions`);
    }
    if (missingDeadline > 0) {
      console.log(`      ❌ Deadline: ${missingDeadline}/${pages.rows.length} missing - improve timeline extraction`);
    }
    if (missingContact > 0) {
      console.log(`      ⚠️  Contact: ${missingContact}/${pages.rows.length} missing - less critical`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Analysis complete!\n');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
    if (e.stack) console.error('Stack:', e.stack);
    throw e;
  }
}

if (require.main === module) {
  analyzeFieldContent().catch(e => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
}

module.exports = { analyzeFieldContent };

