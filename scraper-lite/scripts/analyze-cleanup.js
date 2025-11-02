#!/usr/bin/env node
/**
 * Analyze what files are safe to delete vs what to keep
 */
const fs = require('fs');
const path = require('path');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🔍 CLEANUP ANALYSIS');
console.log('═══════════════════════════════════════════════════════════\n');

const analysis = {
  safeToDelete: [],
  keepAsBackup: [],
  keepActive: [],
  checkBeforeDeleting: []
};

// Check data files
const dataLiteDir = path.join(__dirname, '..', 'data', 'lite');
if (fs.existsSync(dataLiteDir)) {
  const files = fs.readdirSync(dataLiteDir);
  
  files.forEach(file => {
    const fullPath = path.join(dataLiteDir, file);
    const stat = fs.statSync(fullPath);
    
    if (file === 'state.json') {
      analysis.keepAsBackup.push({
        path: fullPath,
        reason: 'Still used as fallback in scraper.ts, but data now in NEON',
        size: (stat.size / 1024 / 1024).toFixed(2) + ' MB'
      });
    } else if (file === 'state.json.backup.' || file.match(/\.backup\./)) {
      analysis.safeToDelete.push({
        path: fullPath,
        reason: 'Old backup file, data now in NEON',
        size: (stat.size / 1024 / 1024).toFixed(2) + ' MB'
      });
    } else if (file.endsWith('.html') && file.includes('raw/')) {
      // Keep raw HTML for now - might be useful for debugging
      analysis.keepAsBackup.push({
        path: file,
        reason: 'Raw HTML files - keep for debugging/verification',
        size: 'many files'
      });
    }
  });
}

// Check legacy directory
const legacyDir = path.join(__dirname, '..', '..', 'legacy');
if (fs.existsSync(legacyDir)) {
  const files = fs.readdirSync(legacyDir);
  files.forEach(file => {
    analysis.keepAsBackup.push({
      path: path.join(legacyDir, file),
      reason: 'Legacy code - keep for reference',
      size: 'small'
    });
  });
}

// Check old data files
const dataDir = path.join(__dirname, '..', '..', 'data');
if (fs.existsSync(dataDir)) {
  const files = fs.readdirSync(dataDir);
  files.forEach(file => {
    if (file.includes('scraped-programs') && file !== 'scraped-programs-latest.json') {
      analysis.checkBeforeDeleting.push({
        path: path.join(dataDir, file),
        reason: 'Old scraped data - verify not needed before deleting',
        size: 'check size'
      });
    } else if (file === 'scraped-programs-latest.json') {
      analysis.keepAsBackup.push({
        path: path.join(dataDir, file),
        reason: 'Fallback data for API if database fails',
        size: 'check size'
      });
    }
  });
}

console.log('✅ SAFE TO DELETE:');
analysis.safeToDelete.forEach(item => {
  console.log(`   📁 ${item.path}`);
  console.log(`      Reason: ${item.reason}`);
  console.log(`      Size: ${item.size}\n`);
});

console.log('\n📦 KEEP AS BACKUP (but not critical):');
analysis.keepAsBackup.forEach(item => {
  console.log(`   📁 ${item.path}`);
  console.log(`      Reason: ${item.reason}\n`);
});

console.log('\n⚠️  CHECK BEFORE DELETING:');
analysis.checkBeforeDeleting.forEach(item => {
  console.log(`   📁 ${item.path}`);
  console.log(`      Reason: ${item.reason}\n`);
});

console.log('\n═══════════════════════════════════════════════════════════');
console.log('💡 RECOMMENDATIONS');
console.log('═══════════════════════════════════════════════════════════\n');
console.log('1. ✅ Safe to delete: Backup .json files (data now in NEON)');
console.log('2. 📦 Keep as backup: state.json, raw HTML files (for debugging)');
console.log('3. 📦 Keep: scraped-programs-latest.json (API fallback)');
console.log('4. 📦 Keep: legacy/ directory (reference code)');
console.log('5. ⚠️  Check: Old scraped-programs-*.json files (may contain unique data)');
console.log('\n');

