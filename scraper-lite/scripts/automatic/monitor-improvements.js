#!/usr/bin/env node
// Monitor extraction improvements over time
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, '..', 'data', 'lite', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

const pages = state.pages || [];

console.log('\n📊 Extraction Improvements Monitor\n');
console.log('='.repeat(80));

let totalItems = 0;
let contextExtractions = 0;
let headingExtractions = 0;
let meaningfulItems = 0;
let genericPlaceholders = 0;
const byCategory = {};

pages.forEach(page => {
  const reqs = page.categorized_requirements || {};
  Object.entries(reqs).forEach(([category, items]) => {
    if (!Array.isArray(items)) return;
    
    if (!byCategory[category]) {
      byCategory[category] = { total: 0, context: 0, heading: 0, meaningful: 0, generic: 0 };
    }
    
    totalItems += items.length;
    byCategory[category].total += items.length;
    
    items.forEach(item => {
      const source = item.source || '';
      const val = (item.value || '').toLowerCase();
      
      if (source === 'context_extraction') {
        contextExtractions++;
        byCategory[category].context++;
      }
      if (source === 'heading_section') {
        headingExtractions++;
        byCategory[category].heading++;
      }
      
      const isMeaningful = val.length > 20 && 
                          !val.includes('specified') && 
                          !val.includes('required') && 
                          !val.includes('available') &&
                          !val.includes('soll') &&
                          !val.includes('muss');
      
      if (isMeaningful) {
        meaningfulItems++;
        byCategory[category].meaningful++;
      }
      
      if (val.includes('specified') || val.includes('required') || val.includes('available')) {
        genericPlaceholders++;
        byCategory[category].generic++;
      }
    });
  });
});

console.log('\n📈 Overall Statistics:');
console.log(`  Total requirement items: ${totalItems.toLocaleString()}`);
console.log(`  Context extractions: ${contextExtractions} (${totalItems > 0 ? Math.round(contextExtractions/totalItems*100) : 0}%)`);
console.log(`  Heading extractions: ${headingExtractions} (${totalItems > 0 ? Math.round(headingExtractions/totalItems*100) : 0}%)`);
console.log(`  Meaningful items: ${meaningfulItems} (${totalItems > 0 ? Math.round(meaningfulItems/totalItems*100) : 0}%)`);
console.log(`  Generic placeholders: ${genericPlaceholders} (${totalItems > 0 ? Math.round(genericPlaceholders/totalItems*100) : 0}%)`);

console.log('\n📋 By Category (Top 10 by total items):');
const sorted = Object.entries(byCategory)
  .sort((a, b) => b[1].total - a[1].total)
  .slice(0, 10);

sorted.forEach(([cat, stats]) => {
  const ctxPct = stats.total > 0 ? Math.round(stats.context/stats.total*100) : 0;
  const hdPct = stats.total > 0 ? Math.round(stats.heading/stats.total*100) : 0;
  const meanPct = stats.total > 0 ? Math.round(stats.meaningful/stats.total*100) : 0;
  console.log(`  ${cat.padEnd(25)} ${stats.total.toString().padStart(4)} items | Context: ${ctxPct.toString().padStart(2)}% | Heading: ${hdPct.toString().padStart(2)}% | Meaningful: ${meanPct.toString().padStart(2)}%`);
});

console.log('\n📄 Pages with Enhanced Extraction:');
let pagesWithContext = 0;
let pagesWithHeading = 0;
pages.forEach(page => {
  const reqs = page.categorized_requirements || {};
  let hasContext = false;
  let hasHeading = false;
  Object.values(reqs).forEach(items => {
    if (!Array.isArray(items)) return;
    items.forEach(item => {
      if (item.source === 'context_extraction') hasContext = true;
      if (item.source === 'heading_section') hasHeading = true;
    });
  });
  if (hasContext) pagesWithContext++;
  if (hasHeading) pagesWithHeading++;
});
console.log(`  Pages with context extraction: ${pagesWithContext} (${Math.round(pagesWithContext/pages.length*100)}%)`);
console.log(`  Pages with heading extraction: ${pagesWithHeading} (${Math.round(pagesWithHeading/pages.length*100)}%)`);

console.log('\n🎯 Improvement Status:');
const improvementPct = totalItems > 0 ? Math.round((contextExtractions + headingExtractions)/totalItems*100) : 0;
if (improvementPct >= 10) {
  console.log('  ✅ Excellent: 10%+ using enhanced extraction');
} else if (improvementPct >= 5) {
  console.log('  ✅ Good: 5%+ using enhanced extraction');
} else if (improvementPct >= 1) {
  console.log('  ⚠️  Improving: Enhanced extraction active but needs more pages');
} else {
  console.log('  ❌ Limited: Very few enhanced extractions found');
}

// CRITICAL CATEGORIES QUALITY ANALYSIS
console.log('\n📊 Critical Categories Quality Analysis:');
const criticalCategories = ['eligibility', 'financial', 'documents', 'project', 'timeline'];
const criticalStats = {};

criticalCategories.forEach(cat => {
  if (!byCategory[cat]) {
    byCategory[cat] = { total: 0, context: 0, heading: 0, meaningful: 0, generic: 0, pagesWith: 0 };
  }
  
  let pagesWith = 0;
  let totalItems = 0;
  let meaningful = 0;
  pages.forEach(page => {
    const items = (page.categorized_requirements || {})[cat] || [];
    if (Array.isArray(items) && items.length > 0) {
      pagesWith++;
      totalItems += items.length;
      meaningful += items.filter((i) => {
        const val = (i.value || '').toLowerCase();
        return val.length >= 20 && 
               !val.includes('specified') && 
               !val.includes('required') && 
               !val.includes('available');
      }).length;
    }
  });
  
  criticalStats[cat] = {
    pagesWith,
    totalItems,
    meaningful,
    avgPerPage: pagesWith > 0 ? (totalItems / pagesWith).toFixed(2) : '0.00',
    meaningfulPct: totalItems > 0 ? ((meaningful / totalItems) * 100).toFixed(1) : '0.0',
    coveragePct: pages.length > 0 ? ((pagesWith / pages.length) * 100).toFixed(1) : '0.0'
  };
});

criticalCategories.forEach(cat => {
  const stats = criticalStats[cat];
  const status = parseFloat(stats.meaningfulPct) >= 80 ? '✅' : parseFloat(stats.meaningfulPct) >= 60 ? '⚠️' : '❌';
  console.log(`  ${status} ${cat.padEnd(15)}: ${stats.pagesWith.toString().padStart(4)} pages (${stats.coveragePct}%), ${stats.totalItems} items, ${stats.avgPerPage} avg/item, ${stats.meaningfulPct}% meaningful`);
});

console.log('\n' + '='.repeat(80));
console.log(`\nTotal pages analyzed: ${pages.length}`);
console.log(`Baseline (old): ~73% meaningful`);
console.log(`Current: ${totalItems > 0 ? Math.round(meaningfulItems/totalItems*100) : 0}% meaningful\n`);

