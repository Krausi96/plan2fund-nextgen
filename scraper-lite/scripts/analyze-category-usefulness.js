#!/usr/bin/env node
/**
 * Analyze category usefulness and recommend improvements
 */
const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, '..', 'data', 'lite', 'state.json');
const pages = JSON.parse(fs.readFileSync(statePath, 'utf8')).pages;

console.log('\n═══════════════════════════════════════════════════════════');
console.log('📊 CATEGORY USEFULNESS ANALYSIS');
console.log('═══════════════════════════════════════════════════════════\n');

// Define category usefulness
const categoryRanking = {
  // CRITICAL - Must have, actionable, measurable
  critical: ['eligibility', 'financial', 'documents', 'timeline', 'project', 'geographic'],
  // IMPORTANT - Useful for matching/filtering
  important: ['team', 'consortium', 'co_financing', 'trl_level', 'capex_opex'],
  // CONTEXTUAL - Good to have but often generic
  contextual: ['impact', 'use_of_funds', 'revenue_model', 'market_size'],
  // POTENTIALLY FLUFF - Often too vague or not actionable
  potentiallyFluff: ['technical', 'legal', 'compliance', 'diversity']
};

const stats = {};
pages.forEach(page => {
  const reqs = page.categorized_requirements || {};
  Object.keys(reqs).forEach(cat => {
    if (!stats[cat]) {
      stats[cat] = {
        totalItems: 0,
        meaningfulItems: 0,
        pagesWith: 0,
        examples: [],
        avgLength: 0
      };
    }
    
    const items = reqs[cat] || [];
    if (Array.isArray(items) && items.length > 0) {
      stats[cat].pagesWith++;
      stats[cat].totalItems += items.length;
      
      let totalLength = 0;
      items.forEach(item => {
        const val = (item.value || '').trim();
        totalLength += val.length;
        
        // Check if meaningful
        const isMeaningful = val.length >= 20 && 
                            !val.toLowerCase().includes('specified') &&
                            !val.toLowerCase().includes('available') &&
                            !val.toLowerCase().includes('see below') &&
                            !val.toLowerCase().includes('required') &&
                            val.toLowerCase() !== 'required';
        
        if (isMeaningful) {
          stats[cat].meaningfulItems++;
          if (stats[cat].examples.length < 2) {
            stats[cat].examples.push(val.substring(0, 100));
          }
        }
      });
      
      stats[cat].avgLength = totalLength / items.length;
    }
  });
});

console.log('📊 Category Statistics:\n');
const sorted = Object.entries(stats).sort((a, b) => b[1].totalItems - a[1].totalItems);

sorted.forEach(([cat, data]) => {
  const meaningfulPct = data.totalItems > 0 ? Math.round((data.meaningfulItems / data.totalItems) * 100) : 0;
  const avgLength = Math.round(data.avgLength);
  
  // Determine category tier
  let tier = '';
  if (categoryRanking.critical.includes(cat)) {
    tier = '🎯 CRITICAL';
  } else if (categoryRanking.important.includes(cat)) {
    tier = '✅ IMPORTANT';
  } else if (categoryRanking.contextual.includes(cat)) {
    tier = '📋 CONTEXTUAL';
  } else if (categoryRanking.potentiallyFluff.includes(cat)) {
    tier = '⚠️  POTENTIALLY FLUFF';
  } else {
    tier = '❓ UNKNOWN';
  }
  
  const status = meaningfulPct >= 80 ? '✅' : meaningfulPct >= 60 ? '⚠️' : '❌';
  
  console.log(`${tier} ${status} ${cat.padEnd(18)}: ${data.pagesWith.toString().padStart(4)} pages, ${data.totalItems.toString().padStart(5)} items, ${meaningfulPct}% meaningful, ${avgLength} avg chars`);
  
  if (data.examples.length > 0 && (meaningfulPct < 60 || categoryRanking.potentiallyFluff.includes(cat))) {
    console.log(`      Example: ${data.examples[0].substring(0, 80)}...`);
  }
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('💡 RECOMMENDATIONS');
console.log('═══════════════════════════════════════════════════════════\n');

console.log('1. FOCUS ON CRITICAL CATEGORIES:');
categoryRanking.critical.forEach(cat => {
  const stat = stats[cat];
  if (stat) {
    const pct = stat.totalItems > 0 ? Math.round((stat.meaningfulItems / stat.totalItems) * 100) : 0;
    if (pct < 80) {
      console.log(`   ⚠️  ${cat}: ${pct}% meaningful - needs improvement`);
    } else {
      console.log(`   ✅ ${cat}: ${pct}% meaningful - good`);
    }
  }
});

console.log('\n2. DEPRIORITIZE LOW-VALUE CATEGORIES:');
categoryRanking.potentiallyFluff.forEach(cat => {
  const stat = stats[cat];
  if (stat && stat.totalItems > 0) {
    const pct = stat.totalItems > 0 ? Math.round((stat.meaningfulItems / stat.totalItems) * 100) : 0;
    console.log(`   📋 ${cat}: ${stat.totalItems} items, ${pct}% meaningful`);
  }
});

console.log('\n3. IMPACT CATEGORY SPECIFIC ANALYSIS:');
const impact = stats.impact;
if (impact) {
  console.log(`   Total items: ${impact.totalItems}`);
  console.log(`   Meaningful: ${impact.meaningfulItems} (${Math.round((impact.meaningfulItems / impact.totalItems) * 100)}%)`);
  console.log(`   Assessment: ${impact.meaningfulItems / impact.totalItems < 0.7 ? '⚠️  Many generic values - consider stricter filtering' : '✅ Good quality'}`);
  if (impact.examples.length > 0) {
    console.log(`   Example: ${impact.examples[0].substring(0, 100)}`);
  }
}

console.log('\n');


