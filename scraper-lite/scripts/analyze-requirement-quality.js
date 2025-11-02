#!/usr/bin/env node
/**
 * Analyze Requirement Quality Issues
 * Diagnoses why some requirements have low quality percentages
 */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, '..', 'data', 'lite', 'state.json');

function analyzeQuality() {
  console.log('\n🔍 Analyzing Requirement Quality Issues\n');
  console.log('='.repeat(70));
  
  if (!fs.existsSync(statePath)) {
    console.log('❌ State file not found');
    return;
  }
  
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const pages = state.pages || [];
  
  console.log(`\n📊 Analyzing ${pages.length} pages...\n`);
  
  // Analyze by category
  const categoryStats = {};
  const lowQualityItems = [];
  
  pages.forEach(page => {
    const reqs = page.categorized_requirements || {};
    
    Object.entries(reqs).forEach(([category, items]) => {
      if (!Array.isArray(items)) return;
      
      if (!categoryStats[category]) {
        categoryStats[category] = {
          total: 0,
          meaningful: 0,
          generic: 0,
          tooShort: 0,
          tooLong: 0,
          placeholder: 0,
          samples: []
        };
      }
      
      items.forEach(item => {
        const value = item.value || '';
        const len = value.length;
        const stats = categoryStats[category];
        
        stats.total++;
        
        // Check if meaningful
        const isGeneric = new RegExp('(?:required|erforderlich|specified|n/a|not available|to be determined)', 'i').test(value);
        const isPlaceholder = new RegExp('(?:placeholder|example|sample|test)', 'i').test(value);
        const isTooShort = len < 10;
        const isTooLong = len > 500;
        const isMeaningful = !isGeneric && !isPlaceholder && len >= 10 && len <= 500;
        
        if (isGeneric) stats.generic++;
        if (isPlaceholder) stats.placeholder++;
        if (isTooShort) stats.tooShort++;
        if (isTooLong) stats.tooLong++;
        if (isMeaningful) stats.meaningful++;
        
        // Collect low quality samples
        if (!isMeaningful && stats.samples.length < 5) {
          stats.samples.push({
            value: value.substring(0, 100),
            reason: isGeneric ? 'generic' : (isPlaceholder ? 'placeholder' : (isTooShort ? 'too_short' : 'too_long'))
          });
          
          lowQualityItems.push({
            category,
            value: value.substring(0, 100),
            reason: isGeneric ? 'generic' : (isPlaceholder ? 'placeholder' : (isTooShort ? 'too_short' : 'too_long')),
            source: item.source || 'unknown'
          });
        }
      });
    });
  });
  
  // Report by category
  console.log('📋 Quality by Category:\n');
  const sortedCategories = Object.entries(categoryStats)
    .map(([cat, stats]) => ({
      category: cat,
      ...stats,
      meaningfulPercent: (stats.meaningful / stats.total * 100).toFixed(1)
    }))
    .sort((a, b) => parseFloat(a.meaningfulPercent) - parseFloat(b.meaningfulPercent));
  
  sortedCategories.forEach(cat => {
    console.log(`${cat.category.padEnd(20)}: ${cat.meaningfulPercent}% meaningful`);
    console.log(`  Total: ${cat.total}, Meaningful: ${cat.meaningful}, Generic: ${cat.generic}, Too Short: ${cat.tooShort}`);
    
    if (cat.samples.length > 0) {
      console.log('  Low Quality Samples:');
      cat.samples.forEach((sample, i) => {
        console.log(`    ${i + 1}. [${sample.reason}] ${sample.value}...`);
      });
    }
    console.log('');
  });
  
  // Identify low quality categories
  const lowQualityCategories = sortedCategories.filter(c => parseFloat(c.meaningfulPercent) < 70);
  
  if (lowQualityCategories.length > 0) {
    console.log('\n⚠️  Categories Needing Improvement:');
    lowQualityCategories.forEach(cat => {
      console.log(`\n${cat.category} (${cat.meaningfulPercent}% meaningful):`);
      console.log(`  Problems:`);
      if (cat.generic > 0) console.log(`    - ${cat.generic} generic items (${((cat.generic/cat.total)*100).toFixed(1)}%)`);
      if (cat.tooShort > 0) console.log(`    - ${cat.tooShort} too short items (${((cat.tooShort/cat.total)*100).toFixed(1)}%)`);
      if (cat.placeholder > 0) console.log(`    - ${cat.placeholder} placeholder items (${((cat.placeholder/cat.total)*100).toFixed(1)}%)`);
      
      console.log(`  Recommendations:`);
      if (cat.generic > 0) {
        console.log(`    - Better pattern matching to avoid generic text`);
        console.log(`    - Filter out common generic phrases`);
      }
      if (cat.tooShort > 0) {
        console.log(`    - Extract more context around short matches`);
        console.log(`    - Combine related short items`);
      }
      if (cat.placeholder > 0) {
        console.log(`    - Remove placeholder text from extraction`);
      }
    });
  }
  
  // Analyze by source
  console.log('\n📊 Quality by Extraction Source:');
  const sourceStats = {};
  lowQualityItems.forEach(item => {
    const source = item.source || 'unknown';
    if (!sourceStats[source]) {
      sourceStats[source] = { total: 0, categories: {} };
    }
    sourceStats[source].total++;
    if (!sourceStats[source].categories[item.category]) {
      sourceStats[source].categories[item.category] = 0;
    }
    sourceStats[source].categories[item.category]++;
  });
  
  Object.entries(sourceStats)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 10)
    .forEach(([source, stats]) => {
      console.log(`  ${source}: ${stats.total} low quality items`);
    });
  
  console.log('\n✅ Analysis complete!\n');
}

analyzeQuality();

