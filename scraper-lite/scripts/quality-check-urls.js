#!/usr/bin/env node
// Quality check: Verify we're scraping the right URLs
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const fs = require('fs');
const path = require('path');
const { isProgramDetailPage } = require('../src/utils.ts');
const { findInstitutionByUrl } = require('../src/config.ts');

const statePath = path.join(__dirname, '..', 'data', 'lite', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

console.log('\n🔍 URL Quality Check\n');
console.log('='.repeat(80));

const pages = state.pages || [];
const jobs = state.jobs || [];

// Analyze scraped pages
console.log('\n📊 Scraped Pages Analysis:');
console.log(`  Total pages scraped: ${pages.length}`);

// Check URL quality
const categoryPages = [];
const goodPages = [];
const excludedPages = [];
const unmatchedPages = [];

pages.forEach(page => {
  const url = page.url || '';
  const institution = findInstitutionByUrl(url);
  const isDetail = isProgramDetailPage(url);
  
  // Check for category page indicators
  const isCategoryPage = url.match(/\/(foerderungen?|programme?|calls?|ausschreibungen?|portfolio|themen)(\/|$)/i) ||
                        url.includes('/category/') ||
                        url.includes('/taxonomy/');
  
  // Check for excluded content
  const hasExclusion = url.match(/(wohnbau|wohnung|housing|real.estate|immobilie|privat|private)/i) ||
                       url.includes('/bauen-wohnen/') ||
                       url.includes('/themen/aw/landwirtschaft') && !url.includes('startup');
  
  if (hasExclusion) {
    excludedPages.push(page);
  } else if (isCategoryPage) {
    categoryPages.push(page);
  } else if (isDetail && institution) {
    goodPages.push(page);
  } else if (!institution) {
    unmatchedPages.push(page);
  } else {
    goodPages.push(page);
  }
});

console.log(`\n  ✅ Good detail pages: ${goodPages.length} (${Math.round(goodPages.length/pages.length*100)}%)`);
console.log(`  ⚠️  Category pages: ${categoryPages.length} (${Math.round(categoryPages.length/pages.length*100)}%)`);
console.log(`  ❌ Excluded content: ${excludedPages.length} (${Math.round(excludedPages.length/pages.length*100)}%)`);
console.log(`  ❓ Unmatched institutions: ${unmatchedPages.length} (${Math.round(unmatchedPages.length/pages.length*100)}%)`);

if (categoryPages.length > 0) {
  console.log(`\n⚠️  Sample Category Pages (should be filtered):`);
  categoryPages.slice(0, 10).forEach(p => {
    console.log(`    ${p.url.substring(0, 65)}`);
  });
}

if (excludedPages.length > 0) {
  console.log(`\n❌ Sample Excluded Pages (should be filtered):`);
  excludedPages.slice(0, 10).forEach(p => {
    console.log(`    ${p.url.substring(0, 65)}`);
  });
}

// Check by institution
console.log('\n📋 Pages by Institution (Top 15):');
const byInst = {};
pages.forEach(p => {
  const inst = findInstitutionByUrl(p.url);
  const name = inst ? inst.name : 'Unknown';
  if (!byInst[name]) byInst[name] = [];
  byInst[name].push(p);
});

Object.entries(byInst)
  .sort((a, b) => b[1].length - a[1].length)
  .slice(0, 15)
  .forEach(([name, pages]) => {
    const good = pages.filter(p => goodPages.includes(p)).length;
    console.log(`  ${name.padEnd(40)} ${pages.length.toString().padStart(3)} pages (${good} good)`);
  });

// Check jobs status
console.log('\n📦 Jobs Status:');
const queued = jobs.filter(j => j.status === 'queued').length;
const done = jobs.filter(j => j.status === 'done').length;
const failed = jobs.filter(j => j.status === 'failed').length;
console.log(`  Queued: ${queued}`);
console.log(`  Done: ${done}`);
console.log(`  Failed: ${failed}`);

// Quality metrics
console.log('\n📈 Quality Metrics:');
const meaningfulPages = pages.filter(p => {
  const reqs = p.categorized_requirements || {};
  const items = Object.values(reqs).flat().filter(Array.isArray);
  const meaningful = items.filter((item) => {
    const val = ((item.value || '') + '').toLowerCase();
    return val.length > 20 && !val.includes('specified') && !val.includes('required') && !val.includes('available');
  });
  return meaningful.length > 0;
}).length;

console.log(`  Pages with meaningful requirements: ${meaningfulPages} (${Math.round(meaningfulPages/pages.length*100)}%)`);
console.log(`  Good detail page rate: ${Math.round(goodPages.length/pages.length*100)}%`);
console.log(`  Category page rate: ${Math.round(categoryPages.length/pages.length*100)}% (should be <5%)`);
console.log(`  Excluded content rate: ${Math.round(excludedPages.length/pages.length*100)}% (should be 0%)`);

console.log('\n' + '='.repeat(80));
console.log('\n✅ Quality Check Complete!\n');

if (categoryPages.length > pages.length * 0.1) {
  console.log('⚠️  WARNING: High category page rate (>10%). Consider improving URL filtering.');
}

if (excludedPages.length > pages.length * 0.05) {
  console.log('⚠️  WARNING: Excluded content found (>5%). Review exclusion patterns.');
}

