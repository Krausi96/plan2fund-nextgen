#!/usr/bin/env node
/**
 * Deep Content Analysis - URL Discovery & Requirements Content
 * Analyzes actual content, patterns, and identifies improvements
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');
const { calculateMeaningfulnessScore } = require('../../src/extract.ts');
const { loadState } = require('../../src/scraper.ts');

async function deepAnalysis() {
  const pool = getPool();
  
  console.log('\n🔍 DEEP CONTENT ANALYSIS\n');
  console.log('='.repeat(100));
  
  // ============================================================================
  // 1. URL DISCOVERY ANALYSIS
  // ============================================================================
  console.log('\n1️⃣  URL DISCOVERY DEEP ANALYSIS\n');
  console.log('-'.repeat(100));
  
  const state = loadState();
  const seenUrls = Object.keys(state.seen || {});
  const jobs = state.jobs || [];
  
  // Analyze skipped URLs
  const skippedUrls = jobs.filter(j => j.status === 'skipped' || j.status === 'rejected');
  console.log(`\n📊 Skipped URLs Analysis:`);
  console.log(`   Total skipped: ${skippedUrls.length}`);
  
  // Group skipped URLs by reason
  const skipReasons = {};
  skippedUrls.forEach(j => {
    const reason = j.skipReason || j.rejectReason || 'unknown';
    skipReasons[reason] = (skipReasons[reason] || 0) + 1;
  });
  console.log(`\n   Skip Reasons:`);
  Object.entries(skipReasons)
    .sort((a, b) => b[1] - a[1])
    .forEach(([reason, count]) => {
      console.log(`      ${reason}: ${count}`);
    });
  
  // Check if URLs are being re-skipped (blacklisted)
  const skippedUrlMap = new Map();
  skippedUrls.forEach(j => {
    if (!skippedUrlMap.has(j.url)) {
      skippedUrlMap.set(j.url, []);
    }
    skippedUrlMap.get(j.url).push(j);
  });
  const reSkipped = Array.from(skippedUrlMap.entries()).filter(([url, instances]) => instances.length > 1);
  console.log(`\n   Re-skipped URLs: ${reSkipped.length}`);
  if (reSkipped.length > 0) {
    console.log(`   ⚠️  URLs are being skipped multiple times - blacklisting may not be working`);
    reSkipped.slice(0, 5).forEach(([url, instances]) => {
      console.log(`      ${url}: ${instances.length} times`);
    });
  } else {
    console.log(`   ✅ No re-skipping detected - blacklisting is working`);
  }
  
  // Check database seen_urls
  const dbSeenUrls = await pool.query(`
    SELECT url, COUNT(*) as count 
    FROM seen_urls 
    GROUP BY url 
    HAVING COUNT(*) > 1
    LIMIT 10
  `);
  console.log(`\n   Duplicate URLs in database: ${dbSeenUrls.rows.length}`);
  if (dbSeenUrls.rows.length > 0) {
    console.log(`   ⚠️  Some URLs are stored multiple times in seen_urls`);
  }
  
  // Analyze overview page detection
  const overviewPages = jobs.filter(j => j.isOverviewPage);
  console.log(`\n📋 Overview Page Detection:`);
  console.log(`   Total overview pages: ${overviewPages.length}`);
  console.log(`   Overview page rate: ${((overviewPages.length / jobs.length) * 100).toFixed(1)}%`);
  
  // Check if overview pages are being properly skipped
  const overviewUrls = new Set(overviewPages.map(j => j.url));
  const overviewRevisited = jobs.filter(j => overviewUrls.has(j.url) && !j.isOverviewPage);
  console.log(`   Overview pages revisited as detail pages: ${overviewRevisited.length}`);
  if (overviewRevisited.length > 0) {
    console.log(`   ⚠️  Some overview pages are being processed as detail pages`);
  }
  
  // ============================================================================
  // 2. ACTUAL REQUIREMENTS CONTENT ANALYSIS
  // ============================================================================
  console.log('\n\n2️⃣  ACTUAL REQUIREMENTS CONTENT ANALYSIS\n');
  console.log('-'.repeat(100));
  
  const pages = await pool.query(`
    SELECT id, url, title, description, funding_amount_min, funding_amount_max, 
           currency, deadline, open_deadline, contact_email, contact_phone,
           funding_types, program_focus, region
    FROM pages
    ORDER BY id DESC
    LIMIT 50
  `);
  
  console.log(`\n📄 Analyzing ${pages.rows.length} pages\n`);
  
  if (pages.rows.length === 0) {
    console.log('   ⚠️  No pages found in database - batch may still be running');
    await pool.end();
    return;
  }
  
  const requirements = await pool.query(`
    SELECT 
      r.category,
      r.type,
      r.value,
      r.source,
      r.meaningfulness_score,
      p.id as page_id,
      p.url,
      p.title
    FROM requirements r
    JOIN pages p ON r.page_id = p.id
    ORDER BY p.id DESC, r.category
  `);
  
  console.log(`📊 Total Requirements: ${requirements.rows.length}`);
  
  // Sample actual content by category
  console.log('\n📝 Sample Actual Content by Category:');
  const byCategory = {};
  requirements.rows.forEach(req => {
    if (!byCategory[req.category]) {
      byCategory[req.category] = [];
    }
    byCategory[req.category].push(req);
  });
  
  Object.entries(byCategory)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)
    .forEach(([category, items]) => {
      console.log(`\n   ${category} (${items.length} items):`);
      items.slice(0, 3).forEach(item => {
        const score = item.meaningfulness_score || calculateMeaningfulnessScore(item.value);
        const preview = item.value.length > 100 ? item.value.substring(0, 100) + '...' : item.value;
        console.log(`      [${item.type}] ${preview} (score: ${score.toFixed(1)}, source: ${item.source})`);
      });
    });
  
  // Identify garbage/non-meaningful content
  console.log('\n\n🗑️  Garbage/Non-Meaningful Content:');
  const garbage = requirements.rows.filter(req => {
    const score = req.meaningfulness_score || calculateMeaningfulnessScore(req.value);
    return score < 30;
  });
  console.log(`   Low quality requirements (score <30): ${garbage.length} (${((garbage.length / requirements.rows.length) * 100).toFixed(1)}%)`);
  if (garbage.length > 0) {
    console.log(`\n   Examples:`);
    garbage.slice(0, 5).forEach(req => {
      const score = req.meaningfulness_score || calculateMeaningfulnessScore(req.value);
      console.log(`      [${req.category}] ${req.value.substring(0, 80)}... (score: ${score.toFixed(1)})`);
    });
  }
  
  // Pattern recognition - common phrases
  console.log('\n\n🔍 Pattern Recognition:');
  const commonPhrases = {};
  requirements.rows.forEach(req => {
    const words = req.value.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    words.forEach(word => {
      commonPhrases[word] = (commonPhrases[word] || 0) + 1;
    });
  });
  console.log(`\n   Most common words (length >4):`);
  Object.entries(commonPhrases)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .forEach(([word, count]) => {
      console.log(`      ${word}: ${count} occurrences`);
    });
  
  // Source quality analysis
  console.log('\n\n📊 Source Quality Analysis:');
  const sourceQuality = {};
  requirements.rows.forEach(req => {
    if (!sourceQuality[req.source]) {
      sourceQuality[req.source] = { count: 0, totalScore: 0 };
    }
    const score = req.meaningfulness_score || calculateMeaningfulnessScore(req.value);
    sourceQuality[req.source].count++;
    sourceQuality[req.source].totalScore += score;
  });
  Object.entries(sourceQuality)
    .sort((a, b) => b[1].count - a[1].count)
    .forEach(([source, stats]) => {
      const avgScore = stats.totalScore / stats.count;
      const emoji = avgScore >= 70 ? '✅' : avgScore >= 50 ? '⚠️' : '❌';
      console.log(`   ${emoji} ${source}: ${stats.count} items, avg score: ${avgScore.toFixed(1)}`);
    });
  
  // ============================================================================
  // 3. METADATA ANALYSIS
  // ============================================================================
  console.log('\n\n3️⃣  METADATA ANALYSIS\n');
  console.log('-'.repeat(100));
  
  // Funding amount analysis
  const withAmount = pages.rows.filter(p => p.funding_amount_min || p.funding_amount_max);
  console.log(`\n💰 Funding Amount:`);
  console.log(`   Pages with amount: ${withAmount.length}/${pages.rows.length} (${((withAmount.length / pages.rows.length) * 100).toFixed(1)}%)`);
  if (withAmount.length > 0) {
    const amounts = withAmount.map(p => ({
      min: p.funding_amount_min,
      max: p.funding_amount_max,
      currency: p.currency || 'EUR'
    }));
    console.log(`   Sample amounts:`);
    amounts.slice(0, 5).forEach(a => {
      console.log(`      ${a.min || 'N/A'}-${a.max || 'N/A'} ${a.currency}`);
    });
  }
  
  // Deadline analysis
  const withDeadline = pages.rows.filter(p => p.deadline || p.open_deadline);
  console.log(`\n📅 Deadline:`);
  console.log(`   Pages with deadline: ${withDeadline.length}/${pages.rows.length} (${((withDeadline.length / pages.rows.length) * 100).toFixed(1)}%)`);
  const openDeadlines = pages.rows.filter(p => p.open_deadline);
  console.log(`   Open deadlines: ${openDeadlines.length}`);
  
  // Contact analysis
  const withContact = pages.rows.filter(p => p.contact_email || p.contact_phone);
  console.log(`\n📧 Contact:`);
  console.log(`   Pages with contact: ${withContact.length}/${pages.rows.length} (${((withContact.length / pages.rows.length) * 100).toFixed(1)}%)`);
  
  // Funding types
  const fundingTypeDist = {};
  pages.rows.forEach(p => {
    const types = p.funding_types || [];
    types.forEach(type => {
      fundingTypeDist[type] = (fundingTypeDist[type] || 0) + 1;
    });
  });
  console.log(`\n💰 Funding Types:`);
  Object.entries(fundingTypeDist)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count} pages`);
    });
  
  // ============================================================================
  // 4. WHAT NEEDS TO BE IMPROVED
  // ============================================================================
  console.log('\n\n4️⃣  WHAT NEEDS TO BE IMPROVED\n');
  console.log('-'.repeat(100));
  
  const improvements = [];
  
  // URL Discovery
  if (reSkipped.length > 0) {
    improvements.push({
      priority: 'HIGH',
      area: 'URL Discovery',
      issue: 'URLs are being re-skipped multiple times',
      recommendation: 'Fix blacklisting mechanism to prevent re-processing skipped URLs'
    });
  }
  
  if (overviewRevisited.length > 0) {
    improvements.push({
      priority: 'MEDIUM',
      area: 'URL Discovery',
      issue: 'Overview pages are being processed as detail pages',
      recommendation: 'Improve overview page detection or prevent re-processing'
    });
  }
  
  // Requirements Quality
  const garbagePct = (garbage.length / requirements.rows.length) * 100;
  if (garbagePct > 10) {
    improvements.push({
      priority: 'HIGH',
      area: 'Requirements Quality',
      issue: `${garbagePct.toFixed(1)}% of requirements are low quality (score <30)`,
      recommendation: 'Improve filtering to remove garbage content before saving'
    });
  }
  
  // Coverage
  const categoriesWithData = Object.keys(byCategory).length;
  const totalCategories = 35; // Updated with split categories
  const coveragePct = (categoriesWithData / totalCategories) * 100;
  if (coveragePct < 50) {
    improvements.push({
      priority: 'HIGH',
      area: 'Coverage',
      issue: `Only ${coveragePct.toFixed(1)}% of categories have data (${categoriesWithData}/${totalCategories})`,
      recommendation: 'Improve extraction patterns for missing categories'
    });
  }
  
  // Metadata
  const amountCoverage = (withAmount.length / pages.rows.length) * 100;
  if (amountCoverage < 70) {
    improvements.push({
      priority: 'MEDIUM',
      area: 'Metadata',
      issue: `Only ${amountCoverage.toFixed(1)}% of pages have funding amounts`,
      recommendation: 'Improve financial extraction patterns'
    });
  }
  
  const deadlineCoverage = (withDeadline.length / pages.rows.length) * 100;
  if (deadlineCoverage < 70) {
    improvements.push({
      priority: 'MEDIUM',
      area: 'Metadata',
      issue: `Only ${deadlineCoverage.toFixed(1)}% of pages have deadlines`,
      recommendation: 'Improve timeline extraction patterns'
    });
  }
  
  // Sort by priority
  const priorityOrder = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
  improvements.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  console.log('🔍 Priority Improvements:');
  improvements.forEach((imp, idx) => {
    const emoji = imp.priority === 'HIGH' ? '🔴' : imp.priority === 'MEDIUM' ? '🟡' : '🟢';
    console.log(`\n   ${emoji} ${imp.priority} Priority - ${imp.area}:`);
    console.log(`      Issue: ${imp.issue}`);
    console.log(`      Recommendation: ${imp.recommendation}`);
  });
  
  if (improvements.length === 0) {
    console.log('   ✅ No critical improvements needed!');
  }
  
  console.log('\n' + '='.repeat(100));
  console.log('✅ Analysis complete!\n');
  
  await pool.end();
}

deepAnalysis().catch(console.error);


