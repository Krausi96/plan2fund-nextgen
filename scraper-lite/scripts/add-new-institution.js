#!/usr/bin/env node
/**
 * Helper script to add new institutions to institutionConfig.ts
 * Usage: node scripts/add-new-institution.js
 * 
 * This script provides a template for adding new institutions.
 * Copy and modify as needed.
 */

const fs = require('fs');
const path = require('path');

console.log('\n📋 New Institution Template:\n');
console.log(`{
  id: 'institution_[name]',
  name: '[Full Institution Name]',
  baseUrl: 'https://example.com',
  programUrls: [
    'https://example.com/program-1',
    'https://example.com/program-2'
  ],
  selectors: {
    name: ['h1', '.program-title', '.foerderung-title'],
    description: ['.program-description', '.foerderung-description', 'p'],
    eligibility: ['.eligibility', '.voraussetzungen', '.requirements'],
    requirements: ['.requirements', '.dokumente', '.unterlagen'],
    contact: ['.contact', '.ansprechpartner', '.kontakt']
  },
  fundingTypes: ['grant', 'loan', 'equity'], // Choose from: grant, loan, equity, bank_loan, leasing, crowdfunding, subsidy, guarantee
  region: 'Austria',
  autoDiscovery: true,
  keywords: ['keyword1', 'keyword2', 'keyword3']
}\n`);

console.log('📝 Steps to add new institution:');
console.log('  1. Add the institution block above to legacy/institutionConfig.ts');
console.log('  2. Run: node scripts/learn-patterns-from-config.js');
console.log('  3. Test discovery: LITE_MAX_URLS=20 node run-lite.js discover');
console.log('  4. Test scraping: LITE_MAX_URLS=10 node run-lite.js scrape\n');




