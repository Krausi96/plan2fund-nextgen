#!/usr/bin/env node
/**
 * Monitor metadata extraction quality (funding amounts, deadlines, contacts)
 * 
 * Usage:
 *   node scripts/monitor-metadata.js
 */

const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, '..', 'data', 'lite', 'state.json');

if (!fs.existsSync(statePath)) {
  console.error('❌ state.json not found. Run scraper first.');
  process.exit(1);
}

const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
const pages = state.pages || [];

console.log('\n💰 Metadata Extraction Monitor\n');
console.log('='.repeat(80));

// Count pages with various metadata fields
const withFundingAmount = pages.filter(p => p.funding_amount_min || p.funding_amount_max).length;
const withDeadline = pages.filter(p => p.deadline || p.open_deadline).length;
const withContact = pages.filter(p => p.contact_email || p.contact_phone).length;
const withAnyMetadata = pages.filter(p => 
  (p.funding_amount_min || p.funding_amount_max) || 
  (p.deadline || p.open_deadline) || 
  (p.contact_email || p.contact_phone)
).length;

// Funding amount statistics
const pagesWithAmounts = pages.filter(p => p.funding_amount_min || p.funding_amount_max);
const amounts = pagesWithAmounts.map(p => ({
  min: p.funding_amount_min,
  max: p.funding_amount_max,
  url: p.url
}));

// Deadline statistics
const pagesWithDeadlines = pages.filter(p => p.deadline || p.open_deadline);
const deadlines = {
  specific: pages.filter(p => p.deadline).length,
  open: pages.filter(p => p.open_deadline && !p.deadline).length
};

// Contact statistics
const emails = pages.filter(p => p.contact_email).length;
const phones = pages.filter(p => p.contact_phone).length;

console.log(`📊 Overall Statistics:`);
console.log(`   Total pages: ${pages.length}`);
console.log(`   Pages with any metadata: ${withAnyMetadata} (${Math.round(withAnyMetadata / pages.length * 100)}%)`);
console.log(`\n💰 Funding Amounts:`);
console.log(`   Pages with funding amounts: ${withFundingAmount} (${Math.round(withFundingAmount / pages.length * 100)}%)`);
if (amounts.length > 0) {
  const validMins = amounts.filter(a => a.min).map(a => a.min);
  const validMaxs = amounts.filter(a => a.max).map(a => a.max);
  if (validMins.length > 0) {
    console.log(`   Min amount range: ${Math.min(...validMins).toLocaleString()} - ${Math.max(...validMins).toLocaleString()} EUR`);
  }
  if (validMaxs.length > 0) {
    console.log(`   Max amount range: ${Math.min(...validMaxs).toLocaleString()} - ${Math.max(...validMaxs).toLocaleString()} EUR`);
  }
}

console.log(`\n📅 Deadlines:`);
console.log(`   Pages with deadlines: ${withDeadline} (${Math.round(withDeadline / pages.length * 100)}%)`);
console.log(`   Specific deadlines: ${deadlines.specific}`);
console.log(`   Open/rolling deadlines: ${deadlines.open}`);

console.log(`\n📧 Contacts:`);
console.log(`   Pages with contact info: ${withContact} (${Math.round(withContact / pages.length * 100)}%)`);
console.log(`   Email addresses: ${emails}`);
console.log(`   Phone numbers: ${phones}`);

// Breakdown by metadata field
console.log(`\n📈 Metadata Field Breakdown:`);
console.log(`   funding_amount_min: ${pages.filter(p => p.funding_amount_min).length} pages`);
console.log(`   funding_amount_max: ${pages.filter(p => p.funding_amount_max).length} pages`);
console.log(`   deadline: ${pages.filter(p => p.deadline).length} pages`);
console.log(`   open_deadline: ${pages.filter(p => p.open_deadline).length} pages`);
console.log(`   contact_email: ${emails} pages`);
console.log(`   contact_phone: ${phones} pages`);

// Sample pages with metadata
const pagesWithMetadata = pages.filter(p => 
  (p.funding_amount_min || p.funding_amount_max) || 
  (p.deadline || p.open_deadline) || 
  (p.contact_email || p.contact_phone)
);

console.log(`\n📄 Sample Pages with Metadata (first 5):`);
pagesWithMetadata.slice(0, 5).forEach((p, i) => {
  console.log(`\n${i + 1}. ${p.url}`);
  if (p.funding_amount_min || p.funding_amount_max) {
    console.log(`   💰 Amount: ${p.funding_amount_min || 'N/A'} - ${p.funding_amount_max || 'N/A'} ${p.currency || 'EUR'}`);
  }
  if (p.deadline || p.open_deadline) {
    console.log(`   📅 Deadline: ${p.deadline || 'Open/Rolling'}`);
  }
  if (p.contact_email || p.contact_phone) {
    console.log(`   📧 Contact: ${p.contact_email || 'N/A'} / ${p.contact_phone || 'N/A'}`);
  }
});

if (pagesWithMetadata.length === 0) {
  console.log(`\n⚠️  No pages with metadata found. This may indicate:`);
  console.log(`   1. Metadata extraction is not working (check extractMeta() and normalizeMetadata())`);
  console.log(`   2. Pages were scraped before the metadata fix was applied`);
  console.log(`   3. Pages don't contain extractable metadata`);
  console.log(`\n💡 Next steps:`);
  console.log(`   - Run: node scripts/rescrape-pages.js --missing-only`);
  console.log(`   - Then: LITE_MAX_URLS=100 node run-lite.js scrape`);
}

console.log('\n' + '='.repeat(80));


