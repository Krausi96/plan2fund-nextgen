#!/usr/bin/env node
/**
 * Debug why discovery isn't finding URLs
 */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const { getAllSeedUrls, institutions } = require('../../src/config.ts');
const { loadState } = require('../../src/scraper.ts');

console.log('\n🔍 DISCOVERY DEBUG\n');
console.log('='.repeat(70));

console.log('\n📋 Institutions with autoDiscovery:');
console.log(`  Total: ${institutions.length}`);
institutions.forEach(inst => {
  console.log(`  ✅ ${inst.name}: ${inst.seedUrls.length} seed URLs`);
});

console.log('\n📋 Total seed URLs:');
const seeds = getAllSeedUrls();
console.log(`  ${seeds.length} URLs`);
if (seeds.length === 0) {
  console.log('  ❌ NO SEED URLS! Check institutionConfig.ts');
  process.exit(1);
}

console.log('\n📋 Sample seed URLs (first 5):');
seeds.slice(0, 5).forEach(url => console.log(`  ${url}`));

console.log('\n📋 Current state:');
const state = loadState();
console.log(`  URLs seen: ${Object.keys(state.seen || {}).length}`);
console.log(`  Jobs queued: ${state.jobs.filter(j => j.status === 'queued').length}`);
console.log(`  Jobs done: ${state.jobs.filter(j => j.status === 'done').length}`);
console.log(`  Pages scraped: ${state.pages.length}`);

console.log('\n✅ Discovery should work if:');
console.log('  1. Institutions have autoDiscovery: true');
console.log('  2. Seed URLs are valid and accessible');
console.log('  3. URLs pass isProgramDetailPage() check');
console.log('  4. maxPages > 0 and maxDepth > 0');
console.log('\n');


