// Quick diagnostic: Check discovery status and what URLs are actually scrapable
const fs = require('fs');
const path = require('path');

const discoveryStatePath = path.join(__dirname, '..', 'data', 'discovery-state.json');
const scrapedPath = path.join(__dirname, '..', 'data', 'scraped-programs-latest.json');

console.log('🔍 DISCOVERY STATUS DIAGNOSTIC');
console.log('='.repeat(60));

if (!fs.existsSync(discoveryStatePath)) {
  console.log('❌ discovery-state.json not found - run discovery first!');
  process.exit(1);
}

const state = JSON.parse(fs.readFileSync(discoveryStatePath, 'utf8'));
let scrapedCount = 0;
if (fs.existsSync(scrapedPath)) {
  const scraped = JSON.parse(fs.readFileSync(scrapedPath, 'utf8'));
  scrapedCount = scraped.programs?.length || 0;
}

console.log(`📊 Currently Scraped Programs: ${scrapedCount}\n`);

let totalKnown = 0;
let totalUnscraped = 0;
let totalDetailPages = 0;
let totalCategoryPages = 0;

console.log('INSTITUTION STATUS:');
console.log('='.repeat(60));

Object.entries(state).forEach(([name, instState]) => {
  const known = instState.knownUrls?.length || 0;
  const unscraped = instState.unscrapedUrls?.length || 0;
  
  // Analyze what's in unscrapedUrls
  let detailPages = 0;
  let categoryPages = 0;
  let queryPages = 0;
  
  if (instState.unscrapedUrls) {
    instState.unscrapedUrls.forEach(url => {
      if (url.includes('?') && (url.includes('field_') || url.includes('filter'))) {
        queryPages++;
      } else if (url.match(/\/foerderungen$|\/programme$|\/spezialprogramme\/[^/]+\/$/i)) {
        categoryPages++;
      } else {
        detailPages++;
      }
    });
  }
  
  totalKnown += known;
  totalUnscraped += unscraped;
  totalDetailPages += detailPages;
  totalCategoryPages += (categoryPages + queryPages);
  
  if (unscraped > 0) {
    console.log(`\n${name}:`);
    console.log(`  📊 Known URLs: ${known}`);
    console.log(`  📊 Unscraped URLs: ${unscraped}`);
    console.log(`     ✅ Detail pages: ${detailPages}`);
    console.log(`     ❌ Category pages: ${categoryPages}`);
    console.log(`     ❌ Query/filter pages: ${queryPages}`);
    
    // Show sample URLs
    if (unscraped > 0) {
      const samples = instState.unscrapedUrls.slice(0, 3);
      console.log(`     📝 Sample URLs:`);
      samples.forEach(url => {
        const type = url.includes('?') ? 'QUERY' : 
                    url.match(/\/foerderungen$|\/programme$/i) ? 'CATEGORY' : 'DETAIL';
        console.log(`        [${type}] ${url.substring(0, 70)}${url.length > 70 ? '...' : ''}`);
      });
    }
  }
});

console.log('\n' + '='.repeat(60));
console.log('SUMMARY:');
console.log('='.repeat(60));
console.log(`📊 Total Known URLs: ${totalKnown}`);
console.log(`📊 Total Unscraped URLs: ${totalUnscraped}`);
console.log(`   ✅ Detail Pages (scrapable): ${totalDetailPages}`);
console.log(`   ❌ Category/Query Pages (NOT scrapable): ${totalCategoryPages}`);
console.log(`📊 Currently Scraped: ${scrapedCount}`);

const scrapableRatio = totalUnscraped > 0 ? ((totalDetailPages / totalUnscraped) * 100).toFixed(1) : 0;
console.log(`\n✅ Scrapable Ratio: ${scrapableRatio}% (${totalDetailPages} of ${totalUnscraped} are actual detail pages)`);

if (totalCategoryPages > 0) {
  console.log(`\n⚠️  WARNING: ${totalCategoryPages} category/query pages in unscrapedUrls!`);
  console.log(`   These will be skipped by scraper. Run discovery again to clean them out.`);
}

if (totalDetailPages === 0 && totalUnscraped > 0) {
  console.log(`\n❌ PROBLEM: No detail pages found! All unscraped URLs are category/query pages.`);
  console.log(`   The discovery filter may not be working, or sites have no detail pages.`);
}

console.log('\n' + '='.repeat(60));


