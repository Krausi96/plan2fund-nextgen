#!/usr/bin/env node
// Analyze URL quality and detect useless URLs for pattern refinement
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const fs = require('fs');
const path = require('path');
const { isProgramDetailPage } = require('../src/utils.ts');
const { findInstitutionByUrl } = require('../src/config.ts');

const statePath = path.join(__dirname, '..', 'data', 'lite', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

console.log('\n🔍 URL Quality Analysis for Pattern Refinement\n');
console.log('='.repeat(80));

const pages = state.pages || [];
const urlQuality = {
  good: [],
  category: [],
  excluded: [],
  noRequirements: [],
  lowQuality: []
};

pages.forEach(page => {
  const url = page.url || '';
  const reqs = page.categorized_requirements || {};
  const totalItems = Object.values(reqs).flat().filter(Array.isArray).reduce((sum, items) => sum + items.length, 0);
  const meaningfulItems = Object.values(reqs).flat().filter(Array.isArray).reduce((sum, items) => {
    return sum + items.filter(item => {
      const val = ((item.value || '') + '').toLowerCase();
      return val.length > 20 && !val.includes('specified') && !val.includes('required') && !val.includes('available');
    }).length;
  }, 0);
  
  const meaningfulRate = totalItems > 0 ? meaningfulItems / totalItems : 0;
  const institution = findInstitutionByUrl(url);
  const isDetail = isProgramDetailPage(url);
  
  // Classify URL
  const isCategoryPage = url.match(/\/(foerderungen?|programme?|calls?|ausschreibungen?|portfolio|themen)(\/|$)/i) ||
                        url.includes('/category/') ||
                        url.includes('/taxonomy/');
  
  const hasExclusion = url.match(/(wohnbau|wohnung|housing|real.estate|immobilie|privat|private|landwirtschaft|forstwirtschaft|agriculture|forestry)/i);
  
  if (hasExclusion) {
    urlQuality.excluded.push({ url, reason: 'matches exclusion pattern' });
  } else if (isCategoryPage && !isDetail) {
    urlQuality.category.push({ url, reason: 'category/listing page' });
  } else if (totalItems === 0) {
    urlQuality.noRequirements.push({ url, totalItems, meaningfulRate });
  } else if (meaningfulRate < 0.3) {
    urlQuality.lowQuality.push({ url, totalItems, meaningfulRate, meaningfulItems });
  } else {
    urlQuality.good.push({ url, totalItems, meaningfulRate, meaningfulItems });
  }
});

console.log('\n📊 URL Classification:\n');
console.log(`  ✅ Good URLs: ${urlQuality.good.length} (${Math.round(urlQuality.good.length/pages.length*100)}%)`);
console.log(`  ⚠️  Category pages: ${urlQuality.category.length} (${Math.round(urlQuality.category.length/pages.length*100)}%)`);
console.log(`  ❌ Excluded content: ${urlQuality.excluded.length} (${Math.round(urlQuality.excluded.length/pages.length*100)}%)`);
console.log(`  📉 No requirements: ${urlQuality.noRequirements.length} (${Math.round(urlQuality.noRequirements.length/pages.length*100)}%)`);
console.log(`  🔴 Low quality (<30% meaningful): ${urlQuality.lowQuality.length} (${Math.round(urlQuality.lowQuality.length/pages.length*100)}%)`);

if (urlQuality.category.length > 0) {
  console.log('\n⚠️  Sample Category Pages (should be excluded):');
  urlQuality.category.slice(0, 10).forEach(({ url, reason }) => {
    const inst = findInstitutionByUrl(url);
    console.log(`    ${inst ? inst.name.padEnd(40) : 'Unknown'.padEnd(40)} ${url.substring(0, 50)}`);
  });
}

if (urlQuality.lowQuality.length > 0) {
  console.log('\n🔴 Sample Low Quality URLs (<30% meaningful):');
  urlQuality.lowQuality
    .sort((a, b) => a.meaningfulRate - b.meaningfulRate)
    .slice(0, 10)
    .forEach(({ url, totalItems, meaningfulRate, meaningfulItems }) => {
      const inst = findInstitutionByUrl(url);
      console.log(`    ${inst ? inst.name.padEnd(40) : 'Unknown'.padEnd(40)} ${meaningfulRate.toFixed(0).padStart(2)}% meaningful (${meaningfulItems}/${totalItems} items) ${url.substring(0, 40)}`);
    });
}

// Analyze patterns from low-quality URLs
if (urlQuality.lowQuality.length > 0 || urlQuality.category.length > 0) {
  console.log('\n📋 Pattern Analysis for Refinement:\n');
  
  const badUrls = [...urlQuality.lowQuality, ...urlQuality.category].map(u => u.url);
  const hostPatterns = {};
  
  badUrls.forEach(url => {
    try {
      const host = new URL(url).hostname.replace('www.', '');
      const path = new URL(url).pathname.toLowerCase();
      
      if (!hostPatterns[host]) {
        hostPatterns[host] = { paths: [], count: 0 };
      }
      hostPatterns[host].paths.push(path);
      hostPatterns[host].count++;
    } catch {}
  });
  
  Object.entries(hostPatterns)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 10)
    .forEach(([host, data]) => {
      console.log(`  ${host}: ${data.count} problematic URLs`);
      
      // Find common path patterns
      const pathSegments = {};
      data.paths.forEach(path => {
        const segments = path.split('/').filter(s => s.length > 2);
        segments.forEach(seg => {
          pathSegments[seg] = (pathSegments[seg] || 0) + 1;
        });
      });
      
      const commonSegments = Object.entries(pathSegments)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([seg, count]) => `/${seg}/`).join(', ');
      
      if (commonSegments) {
        console.log(`    Common patterns: ${commonSegments}`);
        console.log(`    💡 Suggestion: Add exclusion pattern: ${host} - ${commonSegments}`);
      }
    });
}

console.log('\n💡 Pattern Refinement Strategy:');
console.log('  1. Review category pages → add exclusion patterns to isProgramDetailPage()');
console.log('  2. Review low-quality URLs → improve extraction patterns or add exclusions');
console.log('  3. Update institutionConfig.ts exclusionKeywords for common patterns');
console.log('  4. Re-learn patterns from verified good URLs only');
console.log('\n' + '='.repeat(80));
console.log('\n✅ Analysis Complete!\n');


