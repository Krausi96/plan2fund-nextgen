#!/usr/bin/env node
// Analyze institutionConfig.ts statistics
const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'legacy', 'institutionConfig.ts');
const content = fs.readFileSync(configPath, 'utf8');

// Extract institutions
const institutionBlocks = content.split(/^\s*\{/m).filter(block => block.includes('name:'));
const institutions = [];

institutionBlocks.forEach(block => {
  const nameMatch = block.match(/name:\s*['"]([^'"]+)['"]/);
  if (!nameMatch) return;
  
  const name = nameMatch[1];
  
  // Extract funding types
  const fundingTypesMatch = block.match(/fundingTypes:\s*\[([^\]]+)\]/);
  const fundingTypes = fundingTypesMatch 
    ? fundingTypesMatch[1].split(',').map(t => t.trim().replace(/['"]/g, ''))
    : [];
  
  // Count program URLs
  const urlMatches = block.match(/programUrls:\s*\[/);
  if (urlMatches) {
    const urlsStart = block.indexOf('programUrls:') + 'programUrls:'.length;
    const urlsSection = block.substring(urlsStart, urlsStart + 2000);
    const urlCount = (urlsSection.match(/https?:\/\//g) || []).length;
    
    institutions.push({ name, fundingTypes, urlCount });
  }
});

console.log('\n📊 Institution Config Statistics\n');
console.log('='.repeat(80));
console.log('\nTotal Institutions:', institutions.length);

// URLs by funding type
const fundingTypeStats = {};
institutions.forEach(inst => {
  inst.fundingTypes.forEach(type => {
    if (!fundingTypeStats[type]) {
      fundingTypeStats[type] = { urls: 0, institutions: [] };
    }
    fundingTypeStats[type].urls += inst.urlCount;
    if (!fundingTypeStats[type].institutions.includes(inst.name)) {
      fundingTypeStats[type].institutions.push(inst.name);
    }
  });
});

console.log('\n📋 URLs by Funding Category:\n');
Object.entries(fundingTypeStats)
  .sort((a, b) => b[1].urls - a[1].urls)
  .forEach(([type, stats]) => {
    console.log(`  ${type.padEnd(25)}: ${stats.urls.toString().padStart(4)} URLs (${stats.institutions.length} institutions)`);
  });

// Institutions by funding type
console.log('\n📋 Institutions by Funding Type:\n');
Object.entries(fundingTypeStats)
  .sort((a, b) => b[1].institutions.length - a[1].institutions.length)
  .forEach(([type, stats]) => {
    console.log(`  ${type}:`);
    stats.institutions.slice(0, 10).forEach(inst => {
      const instData = institutions.find(i => i.name === inst);
      console.log(`    - ${inst} (${instData.urlCount} URLs)`);
    });
    if (stats.institutions.length > 10) {
      console.log(`    ... and ${stats.institutions.length - 10} more`);
    }
  });

console.log('\n' + '='.repeat(80));


