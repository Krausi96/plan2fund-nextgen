#!/usr/bin/env node
// Evaluate unseen URLs and decide whether to keep (queue) or blacklist them
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const fs = require('fs');
const path = require('path');
const { isProgramDetailPage, isQueryListing, isOverviewPage } = require('../src/utils.ts');
const { findInstitutionByUrl } = require('../src/config.ts');
const { autoDiscoveryPatterns } = require('../src/config.ts');

const statePath = path.join(__dirname, '..', 'data', 'lite', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

// Get all processed URLs
const processedUrls = new Set([
  ...state.pages.map(p => p.url),
  ...state.jobs.map(j => j.url)
]);

// Find unseen URLs
const seenUrls = Object.keys(state.seen || {});
const unseen = seenUrls.filter(url => !processedUrls.has(url));

console.log(`\n🔍 Evaluating ${unseen.length} unseen URLs...\n`);

let queued = 0;
let blacklisted = 0;
const blacklistReasons = {
  notDetailPage: 0,
  queryListing: 0,
  exclusionPattern: 0,
  noInstitutionMatch: 0,
  overviewPage: 0
};

const badPatterns = [
  /landwirtschaft|forstwirtschaft|bauen-wohnen|wohnbau|wohnbeihilfe|verkehrsinfrastruktur/i,
  /agriculture|forestry|housing|construction|traffic|bahninfrastruktur/i,
  /privatkunden|private|consumer|endkunde/i,
  /raumplanung|bauordnung|baurecht|bauprojekt|immobilie/i
];

unseen.forEach(url => {
  try {
    const urlLower = url.toLowerCase();
    
    // Check exclusion patterns
    if (badPatterns.some(pattern => pattern.test(urlLower))) {
      blacklisted++;
      blacklistReasons.exclusionPattern++;
      return;
    }
    
    // Check if it's a query listing
    if (isQueryListing(url)) {
      blacklisted++;
      blacklistReasons.queryListing++;
      return;
    }
    
    // Check if it's an overview page (keep it - discovery will handle it)
    // Overview pages are useful for discovery, so we don't blacklist them
    // But we don't queue them as scrape jobs either
    
    // Check if it's a program detail page
    if (!isProgramDetailPage(url)) {
      blacklisted++;
      blacklistReasons.notDetailPage++;
      return;
    }
    
    // Check institution match
    const institution = findInstitutionByUrl(url);
    if (!institution) {
      blacklisted++;
      blacklistReasons.noInstitutionMatch++;
      return;
    }
    
    // Check exclusion keywords
    const pathLower = new URL(url).pathname.toLowerCase();
    const hasExclusionKeyword = autoDiscoveryPatterns.exclusionKeywords.some(k => 
      urlLower.includes(k.toLowerCase()) || pathLower.includes(k.toLowerCase())
    );
    if (hasExclusionKeyword) {
      blacklisted++;
      blacklistReasons.exclusionPattern++;
      return;
    }
    
    // If we get here, it's a valid program detail page - queue it
    const seed = institution.seedUrls && institution.seedUrls.length > 0 ? institution.seedUrls[0] : url;
    if (!state.jobs.find(j => j.url === url)) {
      state.jobs.push({ url, status: 'queued', depth: 1, seed });
      queued++;
    }
  } catch (e) {
    // Invalid URL or other error - blacklist
    blacklisted++;
  }
});

// Save updated state
fs.writeFileSync(statePath, JSON.stringify(state, null, 2));

console.log('✅ Evaluation complete:\n');
console.log(`  📋 Queued for scraping: ${queued}`);
console.log(`  🚫 Blacklisted: ${blacklisted}`);
console.log(`\nBlacklist reasons:`);
console.log(`  - Not a detail page: ${blacklistReasons.notDetailPage}`);
console.log(`  - Query listing: ${blacklistReasons.queryListing}`);
console.log(`  - Exclusion pattern: ${blacklistReasons.exclusionPattern}`);
console.log(`  - No institution match: ${blacklistReasons.noInstitutionMatch}`);
console.log(`\nTotal jobs in queue: ${state.jobs.filter(j => j.status === 'queued').length}\n`);


