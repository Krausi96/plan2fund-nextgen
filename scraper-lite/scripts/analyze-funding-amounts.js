#!/usr/bin/env node
/**
 * Analyze Funding Amount Extraction Issues
 * Identifies weird amounts (like 222€) and learns where funding amounts don't exist
 */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, '..', 'data', 'lite', 'state.json');

function analyzeFundingAmounts() {
  console.log('\n💰 Analyzing Funding Amount Extraction\n');
  console.log('='.repeat(70));
  
  if (!fs.existsSync(statePath)) {
    console.log('❌ State file not found');
    return;
  }
  
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const pages = state.pages || [];
  
  console.log(`\n📊 Analyzing ${pages.length} pages...\n`);
  
  // Analyze funding amounts
  const withAmounts = [];
  const weirdAmounts = [];
  const noAmounts = [];
  const amountRanges = {
    verySmall: [], // < 1,000
    small: [],      // 1,000 - 100,000
    medium: [],     // 100,000 - 1,000,000
    large: [],      // 1,000,000 - 10,000,000
    veryLarge: []   // > 10,000,000
  };
  
  pages.forEach(page => {
    const min = page.funding_amount_min;
    const max = page.funding_amount_max;
    const url = page.url || '';
    const title = page.title || '';
    
    if (min || max) {
      withAmounts.push({ page, min, max });
      
      const amount = min || max;
      
      // Check for weird amounts (like 202, 222, etc.)
      if (amount && amount < 1000 && amount % 10 === amount % 100 && amount > 10) {
        weirdAmounts.push({
          url,
          title: title.substring(0, 60),
          min,
          max,
          amount
        });
      }
      
      // Categorize by size
      const maxAmount = Math.max(min || 0, max || 0);
      if (maxAmount < 1000) amountRanges.verySmall.push({ url, title, min, max });
      else if (maxAmount < 100000) amountRanges.small.push({ url, title, min, max });
      else if (maxAmount < 1000000) amountRanges.medium.push({ url, title, min, max });
      else if (maxAmount < 10000000) amountRanges.large.push({ url, title, min, max });
      else amountRanges.veryLarge.push({ url, title, min, max });
    } else {
      noAmounts.push({ url, title: title.substring(0, 60) });
    }
  });
  
  // Report findings
  console.log('📊 Funding Amount Statistics:');
  console.log(`   Pages with amounts: ${withAmounts.length} (${((withAmounts.length/pages.length)*100).toFixed(1)}%)`);
  console.log(`   Pages without amounts: ${noAmounts.length} (${((noAmounts.length/pages.length)*100).toFixed(1)}%)`);
  
  console.log('\n💰 Amount Distribution:');
  console.log(`   Very Small (<1K): ${amountRanges.verySmall.length}`);
  console.log(`   Small (1K-100K): ${amountRanges.small.length}`);
  console.log(`   Medium (100K-1M): ${amountRanges.medium.length}`);
  console.log(`   Large (1M-10M): ${amountRanges.large.length}`);
  console.log(`   Very Large (>10M): ${amountRanges.veryLarge.length}`);
  
  // Weird amounts
  console.log('\n⚠️  Weird Amounts Found:');
  if (weirdAmounts.length > 0) {
    console.log(`   Found ${weirdAmounts.length} potentially incorrect amounts:`);
    weirdAmounts.slice(0, 20).forEach((item, i) => {
      console.log(`   ${i + 1}. ${item.title}`);
      console.log(`      Amount: ${item.min || item.max} EUR`);
      console.log(`      URL: ${item.url.substring(0, 60)}...`);
    });
    console.log('\n   💡 These might be:');
    console.log('      - Page numbers or IDs mistaken as amounts');
    console.log('      - Year numbers (e.g., 2023) mistaken as amounts');
    console.log('      - Other numeric data parsed incorrectly');
  } else {
    console.log('   ✅ No obviously weird amounts found');
  }
  
  // Analyze pages without amounts by institution
  console.log('\n📋 Pages Without Amounts (by Institution):');
  const noAmountsByHost = {};
  noAmounts.forEach(item => {
    try {
      const host = new URL(item.url).hostname.replace('www.', '');
      if (!noAmountsByHost[host]) noAmountsByHost[host] = [];
      noAmountsByHost[host].push(item);
    } catch {}
  });
  
  const sortedHosts = Object.entries(noAmountsByHost)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
  
  sortedHosts.forEach(([host, items]) => {
    console.log(`   ${host}: ${items.length} pages`);
  });
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('   1. Filter out amounts < 1,000 EUR (likely incorrect)');
  console.log('   2. Filter out amounts that match year patterns (2020-2030)');
  console.log('   3. Filter out round numbers < 10,000 that might be page numbers');
  console.log('   4. Learn which institutions/sites don\'t have funding amounts');
  console.log('   5. Add context validation (check surrounding text)');
  
  console.log('\n✅ Analysis complete!\n');
}

analyzeFundingAmounts();

