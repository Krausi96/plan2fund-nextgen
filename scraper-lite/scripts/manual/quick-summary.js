#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, '..', 'data', 'lite', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

const pages = state.pages || [];
const jobs = state.jobs || [];
const seen = Object.keys(state.seen || {});

console.log('\n📊 Scraping Results Summary\n');
console.log('='.repeat(80));
console.log(`Total pages scraped: ${pages.length}`);
console.log(`Jobs queued: ${jobs.length}`);
console.log(`URLs discovered: ${seen.length}\n`);

// Pages by institution
const byInst = {};
pages.forEach(p => {
  try {
    const host = new URL(p.url).hostname.replace('www.', '');
    byInst[host] = (byInst[host] || 0) + 1;
  } catch (e) {
    // Skip invalid URLs
  }
});

console.log('📋 Pages by Institution (top 10):');
Object.entries(byInst)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([inst, count]) => {
    console.log(`  ${inst}: ${count} pages`);
  });

// Extraction quality
const withTitle = pages.filter(p => p.title && p.title.trim()).length;
const withDesc = pages.filter(p => p.description && p.description.trim()).length;
const withReqs = pages.filter(p => {
  const reqs = p.categorized_requirements;
  if (!reqs || typeof reqs !== 'object') return false;
  // Check if any category has items
  return Object.values(reqs).some(items => Array.isArray(items) && items.length > 0);
}).length;
const withMeaningfulReqs = pages.filter(p => {
  const reqs = p.categorized_requirements;
  if (!reqs || typeof reqs !== 'object') return false;
  // Check if any category has non-generic items (not from 'full_page_content' or has actual details)
  return Object.values(reqs).some(items => {
    if (!Array.isArray(items) || items.length === 0) return false;
    return items.some(item => {
      const source = item.source || '';
      const value = item.value || '';
      // Structured sources or detailed values (not generic placeholders)
      return (source !== 'full_page_content') || 
             (value.length > 50 && !value.includes('specified') && !value.includes('required') && !value.includes('available'));
    });
  });
}).length;

console.log('\n📈 Extraction Quality:');
console.log(`  Pages with title: ${withTitle} (${Math.round(withTitle/pages.length*100)}%)`);
console.log(`  Pages with description: ${withDesc} (${Math.round(withDesc/pages.length*100)}%)`);
console.log(`  Pages with requirements: ${withReqs} (${Math.round(withReqs/pages.length*100)}%)`);
console.log(`  Pages with meaningful requirements: ${withMeaningfulReqs} (${Math.round(withMeaningfulReqs/pages.length*100)}%)`);

// Sample pages
console.log('\n📄 Sample Pages (first 5):');
pages.slice(0, 5).forEach((p, i) => {
  console.log(`\n${i + 1}. ${p.url}`);
  console.log(`   Title: ${p.title || '(none)'}`);
  console.log(`   Description: ${p.description ? p.description.substring(0, 80) + '...' : '(none)'}`);
});

console.log('\n' + '='.repeat(80));

