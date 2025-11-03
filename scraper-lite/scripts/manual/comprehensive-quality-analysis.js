#!/usr/bin/env node
/**
 * Comprehensive Quality Analysis - All Categories
 * Analyzes meaningfulness of ALL requirement categories
 */
const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, '..', 'data', 'lite', 'state.json');
const pages = JSON.parse(fs.readFileSync(statePath, 'utf8')).pages;

console.log('\n═══════════════════════════════════════════════════════════');
console.log('📊 COMPREHENSIVE QUALITY ANALYSIS - ALL CATEGORIES');
console.log('═══════════════════════════════════════════════════════════\n');

// Define category tiers
const CRITICAL = ['eligibility', 'financial', 'documents', 'timeline', 'project', 'geographic'];
const IMPORTANT = ['team', 'consortium', 'co_financing', 'trl_level', 'capex_opex'];
const CONTEXTUAL = ['impact', 'use_of_funds', 'revenue_model', 'market_size'];
const OTHER = ['technical', 'legal', 'compliance', 'diversity'];

const stats = {};

pages.forEach(page => {
  const reqs = page.categorized_requirements || {};
  Object.keys(reqs).forEach(cat => {
    if (!stats[cat]) {
      stats[cat] = {
        totalItems: 0,
        meaningfulItems: 0,
        pagesWith: 0,
        examples: { good: [], bad: [] },
        avgLength: 0,
        totalLength: 0
      };
    }
    
    const items = reqs[cat] || [];
    if (Array.isArray(items) && items.length > 0) {
      stats[cat].pagesWith++;
      stats[cat].totalItems += items.length;
      
      items.forEach(item => {
        const val = (item.value || '').trim();
        stats[cat].totalLength += val.length;
        
        // Meaningful criteria
        const isMeaningful = val.length >= 20 && 
                            !val.toLowerCase().includes('specified') &&
                            !val.toLowerCase().includes('available') &&
                            !val.toLowerCase().includes('see below') &&
                            !val.toLowerCase().includes('required') &&
                            val.toLowerCase() !== 'required' &&
                            !/^(?:the|die|der|das)\s+(?:program|programm)/i.test(val) &&
                            !/\b(ffg|aws|mbh|gmbh|inc\.|ltd\.)\b/i.test(val); // Filter noise
        
        if (isMeaningful) {
          stats[cat].meaningfulItems++;
          if (stats[cat].examples.good.length < 2) {
            stats[cat].examples.good.push(val.substring(0, 120));
          }
        } else {
          if (stats[cat].examples.bad.length < 2 && val.length > 10) {
            stats[cat].examples.bad.push(val.substring(0, 120));
          }
        }
      });
    }
  });
});

// Calculate averages
Object.keys(stats).forEach(cat => {
  if (stats[cat].totalItems > 0) {
    stats[cat].avgLength = Math.round(stats[cat].totalLength / stats[cat].totalItems);
  }
});

console.log('🎯 CRITICAL CATEGORIES (Essential for Matching):\n');
CRITICAL.forEach(cat => {
  if (!stats[cat]) return;
  const data = stats[cat];
  const meaningfulPct = data.totalItems > 0 ? Math.round((data.meaningfulItems / data.totalItems) * 100) : 0;
  const status = meaningfulPct >= 80 ? '✅' : meaningfulPct >= 60 ? '⚠️' : '❌';
  
  console.log(`${status} ${cat.padEnd(18)}: ${data.pagesWith.toString().padStart(4)} pages, ${data.totalItems.toString().padStart(5)} items, ${meaningfulPct}% meaningful, ${data.avgLength} avg chars`);
  if (data.examples.good.length > 0) {
    console.log(`      ✅ Good: ${data.examples.good[0].substring(0, 100)}...`);
  }
  if (data.examples.bad.length > 0 && meaningfulPct < 80) {
    console.log(`      ❌ Bad:  ${data.examples.bad[0].substring(0, 100)}...`);
  }
});

console.log('\n✅ IMPORTANT CATEGORIES (Useful for Matching):\n');
IMPORTANT.forEach(cat => {
  if (!stats[cat]) return;
  const data = stats[cat];
  const meaningfulPct = data.totalItems > 0 ? Math.round((data.meaningfulItems / data.totalItems) * 100) : 0;
  const status = meaningfulPct >= 80 ? '✅' : meaningfulPct >= 60 ? '⚠️' : '❌';
  
  console.log(`${status} ${cat.padEnd(18)}: ${data.pagesWith.toString().padStart(4)} pages, ${data.totalItems.toString().padStart(5)} items, ${meaningfulPct}% meaningful, ${data.avgLength} avg chars`);
});

console.log('\n📋 CONTEXTUAL CATEGORIES (Good to Have):\n');
CONTEXTUAL.forEach(cat => {
  if (!stats[cat]) return;
  const data = stats[cat];
  const meaningfulPct = data.totalItems > 0 ? Math.round((data.meaningfulItems / data.totalItems) * 100) : 0;
  const status = meaningfulPct >= 80 ? '✅' : meaningfulPct >= 60 ? '⚠️' : '❌';
  
  console.log(`${status} ${cat.padEnd(18)}: ${data.pagesWith.toString().padStart(4)} pages, ${data.totalItems.toString().padStart(5)} items, ${meaningfulPct}% meaningful, ${data.avgLength} avg chars`);
  if (cat === 'impact' && data.examples.bad.length > 0) {
    console.log(`      ⚠️  Noise example: ${data.examples.bad[0].substring(0, 100)}...`);
  }
});

console.log('\n⚠️  OTHER CATEGORIES (Potentially Generic):\n');
OTHER.forEach(cat => {
  if (!stats[cat]) return;
  const data = stats[cat];
  const meaningfulPct = data.totalItems > 0 ? Math.round((data.meaningfulItems / data.totalItems) * 100) : 0;
  const status = meaningfulPct >= 80 ? '✅' : meaningfulPct >= 60 ? '⚠️' : '❌';
  
  console.log(`${status} ${cat.padEnd(18)}: ${data.pagesWith.toString().padStart(4)} pages, ${data.totalItems.toString().padStart(5)} items, ${meaningfulPct}% meaningful, ${data.avgLength} avg chars`);
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('📊 SUMMARY');
console.log('═══════════════════════════════════════════════════════════\n');

const criticalStats = CRITICAL.map(cat => stats[cat]).filter(Boolean);
const criticalMeaningful = criticalStats.reduce((sum, s) => sum + s.meaningfulItems, 0);
const criticalTotal = criticalStats.reduce((sum, s) => sum + s.totalItems, 0);
const criticalPct = criticalTotal > 0 ? Math.round((criticalMeaningful / criticalTotal) * 100) : 0;

console.log(`🎯 Critical Categories: ${criticalMeaningful}/${criticalTotal} (${criticalPct}% meaningful)`);
console.log(`   Target: 80%+ for each critical category`);

const needsImprovement = CRITICAL.filter(cat => {
  const s = stats[cat];
  if (!s || s.totalItems === 0) return false;
  return Math.round((s.meaningfulItems / s.totalItems) * 100) < 80;
});

if (needsImprovement.length > 0) {
  console.log(`\n⚠️  Needs Improvement:`);
  needsImprovement.forEach(cat => {
    const s = stats[cat];
    const pct = Math.round((s.meaningfulItems / s.totalItems) * 100);
    console.log(`   • ${cat}: ${pct}% meaningful (target: 80%+)`);
  });
} else {
  console.log(`\n✅ All critical categories meet 80%+ meaningfulness target!`);
}

console.log('\n');


