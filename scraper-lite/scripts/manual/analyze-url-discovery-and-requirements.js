#!/usr/bin/env node
/**
 * Analyze URL Discovery Quality and Actual Requirements Data
 * 
 * Analyzes:
 * 1. URL discovery quality (overview pages, skipped URLs, patterns)
 * 2. Actual requirements data (what was extracted, coverage, quality)
 * 3. Thresholds analysis (what should be improved)
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');
const { loadState } = require('../../src/scraper.ts');

async function analyzeDiscoveryAndRequirements() {
  console.log('\n📊 URL DISCOVERY & REQUIREMENTS ANALYSIS\n');
  console.log('='.repeat(80));
  
  const pool = getPool();
  
  try {
    // ============================================================================
    // 1. URL DISCOVERY QUALITY ANALYSIS
    // ============================================================================
    console.log('\n1️⃣  URL DISCOVERY QUALITY ANALYSIS\n');
    console.log('='.repeat(80));
    
    const state = loadState();
    const seenUrls = Object.keys(state.seen || {});
    const jobs = state.jobs || [];
    
    console.log(`\n📊 Discovery Statistics:`);
    console.log(`   Total URLs seen: ${seenUrls.length}`);
    console.log(`   Total jobs created: ${jobs.length}`);
    
    // Jobs by status
    const jobsByStatus = {};
    jobs.forEach(j => {
      jobsByStatus[j.status] = (jobsByStatus[j.status] || 0) + 1;
    });
    console.log(`\n   Jobs by status:`);
    Object.keys(jobsByStatus).forEach(status => {
      console.log(`      ${status}: ${jobsByStatus[status]} (${Math.round(jobsByStatus[status]/jobs.length*100)}%)`);
    });
    
    // Overview pages analysis
    const overviewPages = jobs.filter(j => j.isOverviewPage || 
      j.url.includes('/programs/') || 
      j.url.includes('/programme/') || 
      j.url.includes('/foerderungen/') ||
      j.url.includes('/funding-opportunities/'));
    console.log(`\n   Overview pages detected: ${overviewPages.length} (${Math.round(overviewPages.length/jobs.length*100)}%)`);
    
    // Program detail pages
    const detailPages = jobs.filter(j => !j.isOverviewPage && j.status === 'done');
    console.log(`   Program detail pages: ${detailPages.length} (${Math.round(detailPages.length/jobs.length*100)}%)`);
    
    // Skipped URLs
    const skippedUrls = seenUrls.filter(url => {
      const job = jobs.find(j => j.url === url);
      return job && (job.status === 'skipped' || job.status === 'rejected');
    });
    console.log(`   Skipped/rejected URLs: ${skippedUrls.length} (${Math.round(skippedUrls.length/seenUrls.length*100)}%)`);
    
    // URL patterns
    console.log(`\n   URL Patterns:`);
    const urlPatterns = {};
    jobs.forEach(j => {
      try {
        const urlObj = new URL(j.url);
        const pathParts = urlObj.pathname.split('/').filter(p => p);
        if (pathParts.length > 0) {
          const pattern = `/${pathParts[0]}/...`;
          urlPatterns[pattern] = (urlPatterns[pattern] || 0) + 1;
        }
      } catch (e) {
        // Invalid URL
      }
    });
    Object.keys(urlPatterns).sort((a, b) => urlPatterns[b] - urlPatterns[a]).slice(0, 10).forEach(pattern => {
      console.log(`      ${pattern}: ${urlPatterns[pattern]} URLs`);
    });
    
    // Discovery efficiency
    const successfulPages = jobs.filter(j => j.status === 'done' && !j.isOverviewPage);
    const discoveryEfficiency = successfulPages.length / jobs.length * 100;
    console.log(`\n   Discovery Efficiency: ${discoveryEfficiency.toFixed(1)}% (${successfulPages.length}/${jobs.length} are program detail pages)`);
    
    if (discoveryEfficiency < 50) {
      console.log(`   ⚠️  LOW EFFICIENCY: Too many overview pages being discovered`);
    } else if (discoveryEfficiency < 70) {
      console.log(`   ⚠️  MODERATE EFFICIENCY: Could be improved`);
    } else {
      console.log(`   ✅ GOOD EFFICIENCY: Most discovered URLs are program detail pages`);
    }
    
    // ============================================================================
    // 2. ACTUAL REQUIREMENTS DATA ANALYSIS
    // ============================================================================
    console.log('\n\n2️⃣  ACTUAL REQUIREMENTS DATA ANALYSIS\n');
    console.log('='.repeat(80));
    
    // Get all pages with their requirements
    const pages = await pool.query(`
      SELECT 
        p.id,
        p.url,
        p.title,
        p.description,
        p.funding_amount_min,
        p.funding_amount_max,
        p.currency,
        p.funding_types,
        p.deadline,
        p.open_deadline,
        json_agg(
          json_build_object(
            'category', r.category,
            'type', r.type,
            'value', r.value,
            'source', r.source
          )
        ) FILTER (WHERE r.id IS NOT NULL) as requirements
      FROM pages p
      LEFT JOIN requirements r ON p.id = r.page_id
      GROUP BY p.id, p.url, p.title, p.description, p.funding_amount_min, 
               p.funding_amount_max, p.currency, p.funding_types, p.deadline, p.open_deadline
      ORDER BY p.id DESC
    `);
    
    if (pages.rows.length === 0) {
      console.log('\n⚠️  No pages in database.\n');
      return;
    }
    
    const totalPages = pages.rows.length;
    console.log(`\n📄 ANALYZING ${totalPages} PAGES\n`);
    
    // Critical categories
    const criticalCategories = ['geographic', 'eligibility', 'financial', 'use_of_funds', 'team', 'impact', 'timeline'];
    const nonCriticalCategories = ['documents', 'project', 'consortium', 'technical', 'legal', 'capex_opex', 'revenue_model', 'market_size', 'trl_level', 'co_financing', 'diversity', 'application_process', 'evaluation_criteria', 'repayment_terms', 'equity_terms', 'intellectual_property', 'success_metrics', 'restrictions'];
    
    // Coverage analysis
    console.log(`\n📊 Coverage Analysis:`);
    const categoryCoverage = {};
    
    criticalCategories.forEach(category => {
      const pagesWithCategory = pages.rows.filter(p => {
        const reqs = p.requirements || [];
        return reqs.some(r => r.category === category);
      }).length;
      const coverage = Math.round((pagesWithCategory / totalPages) * 100);
      categoryCoverage[category] = { coverage, pages: pagesWithCategory, total: totalPages, isCritical: true };
    });
    
    nonCriticalCategories.forEach(category => {
      const pagesWithCategory = pages.rows.filter(p => {
        const reqs = p.requirements || [];
        return reqs.some(r => r.category === category);
      }).length;
      const coverage = Math.round((pagesWithCategory / totalPages) * 100);
      categoryCoverage[category] = { coverage, pages: pagesWithCategory, total: totalPages, isCritical: false };
    });
    
    // Critical categories
    console.log(`\n   🎯 CRITICAL CATEGORIES (Target: 92%):`);
    let criticalTotal = 0;
    criticalCategories.forEach(category => {
      const stats = categoryCoverage[category];
      const status = stats.coverage >= 92 ? '✅' : stats.coverage >= 80 ? '⚠️' : '❌';
      console.log(`      ${status} ${category}: ${stats.pages}/${stats.total} (${stats.coverage}%)`);
      criticalTotal += stats.coverage;
    });
    const criticalAvg = criticalTotal / criticalCategories.length;
    console.log(`\n      📊 CRITICAL AVERAGE: ${criticalAvg.toFixed(1)}% (Target: 92%)`);
    
    // Non-critical categories
    console.log(`\n   📋 NON-CRITICAL CATEGORIES (Target: 80%):`);
    let nonCriticalTotal = 0;
    let nonCriticalCount = 0;
    nonCriticalCategories.forEach(category => {
      const stats = categoryCoverage[category];
      const status = stats.coverage >= 80 ? '✅' : stats.coverage >= 60 ? '⚠️' : '❌';
      console.log(`      ${status} ${category}: ${stats.pages}/${stats.total} (${stats.coverage}%)`);
      nonCriticalTotal += stats.coverage;
      nonCriticalCount++;
    });
    const nonCriticalAvg = nonCriticalTotal / nonCriticalCount;
    console.log(`\n      📊 NON-CRITICAL AVERAGE: ${nonCriticalAvg.toFixed(1)}% (Target: 80%)`);
    
    // Actual data samples
    console.log(`\n\n📝 ACTUAL DATA SAMPLES:`);
    pages.rows.slice(0, 5).forEach((page, idx) => {
      console.log(`\n   Page ${idx + 1}: ${page.title || page.url}`);
      console.log(`      URL: ${page.url}`);
      console.log(`      Funding Type: ${page.funding_types || 'UNKNOWN'}`);
      console.log(`      Funding Amount: ${page.funding_amount_min || 'N/A'} - ${page.funding_amount_max || 'N/A'} ${page.currency || ''}`);
      
      const reqs = page.requirements || [];
      const byCategory = {};
      reqs.forEach(req => {
        if (!byCategory[req.category]) {
          byCategory[req.category] = [];
        }
        byCategory[req.category].push(req);
      });
      
      console.log(`      Requirements (${reqs.length} total):`);
      Object.keys(byCategory).slice(0, 5).forEach(category => {
        const items = byCategory[category];
        console.log(`         ${category} (${items.length}):`);
        items.slice(0, 2).forEach(item => {
          const value = String(item.value || '').substring(0, 80);
          console.log(`            - [${item.type}] ${value}...`);
        });
      });
    });
    
    // ============================================================================
    // 3. THRESHOLDS ANALYSIS
    // ============================================================================
    console.log('\n\n3️⃣  THRESHOLDS ANALYSIS\n');
    console.log('='.repeat(80));
    
    // Current thresholds (from scraper.ts)
    console.log(`\n📊 Current Quality Thresholds:`);
    console.log(`   EXCELLENT (90-100): 5+ critical categories + funding + deadline`);
    console.log(`   GOOD (50-89): 1+ critical categories (relaxed)`);
    console.log(`   FAIR (40-69): 1+ critical OR funding amount`);
    console.log(`   POOR (0-39): Less than 2 critical categories AND no funding amount`);
    
    // Analyze pages by quality tier
    const qualityTiers = {
      excellent: 0,
      good: 0,
      fair: 0,
      poor: 0
    };
    
    // Calculate quality for each page
    pages.rows.forEach(page => {
      const reqs = page.requirements || [];
      const byCategory = {};
      reqs.forEach(req => {
        if (!byCategory[req.category]) {
          byCategory[req.category] = [];
        }
        byCategory[req.category].push(req);
      });
      
      const criticalCount = criticalCategories.filter(cat => 
        byCategory[cat] && byCategory[cat].length > 0
      ).length;
      
      const hasAmount = !!(page.funding_amount_min || page.funding_amount_max);
      const hasDeadline = !!(page.deadline || page.open_deadline);
      
      // Estimate quality tier
      if (criticalCount >= 5 && hasAmount && hasDeadline) {
        qualityTiers.excellent++;
      } else if (criticalCount >= 1) {
        qualityTiers.good++;
      } else if (criticalCount >= 1 || hasAmount) {
        qualityTiers.fair++;
      } else {
        qualityTiers.poor++;
      }
    });
    
    console.log(`\n   Quality Distribution:`);
    Object.keys(qualityTiers).forEach(tier => {
      const count = qualityTiers[tier];
      const percentage = Math.round((count / totalPages) * 100);
      console.log(`      ${tier.toUpperCase()}: ${count} pages (${percentage}%)`);
    });
    
    // Recommendations
    console.log(`\n\n💡 THRESHOLD RECOMMENDATIONS:`);
    
    if (criticalAvg < 92) {
      console.log(`   ❌ Critical coverage (${criticalAvg.toFixed(1)}%) is below target (92%)`);
      console.log(`      → Need to improve extraction patterns for critical categories`);
      console.log(`      → Consider relaxing thresholds for GOOD tier (currently 1+ critical)`);
    }
    
    if (nonCriticalAvg < 80) {
      console.log(`   ❌ Non-critical coverage (${nonCriticalAvg.toFixed(1)}%) is below target (80%)`);
      console.log(`      → Need to improve extraction patterns for non-critical categories`);
    }
    
    if (qualityTiers.poor > totalPages * 0.1) {
      console.log(`   ⚠️  Too many POOR quality pages (${qualityTiers.poor}/${totalPages})`);
      console.log(`      → Consider adjusting POOR threshold (currently: <2 critical AND no funding)`);
    }
    
    if (qualityTiers.excellent < totalPages * 0.2) {
      console.log(`   ⚠️  Too few EXCELLENT quality pages (${qualityTiers.excellent}/${totalPages})`);
      console.log(`      → Consider adjusting EXCELLENT threshold (currently: 5+ critical + funding + deadline)`);
      console.log(`      → Or improve extraction to meet current threshold`);
    }
    
    // Specific category gaps
    console.log(`\n\n🔍 SPECIFIC GAPS:`);
    criticalCategories.forEach(category => {
      const stats = categoryCoverage[category];
      if (stats.coverage < 92) {
        const gap = 92 - stats.coverage;
        console.log(`   ${category}: ${gap}% below target (${stats.coverage}% vs 92% target)`);
      }
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Analysis complete!\n');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
    if (e.stack) console.error('Stack:', e.stack);
    throw e;
  }
}

if (require.main === module) {
  analyzeDiscoveryAndRequirements().catch(e => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
}

module.exports = { analyzeDiscoveryAndRequirements };


