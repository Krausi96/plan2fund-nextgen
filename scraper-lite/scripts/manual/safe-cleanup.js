#!/usr/bin/env node
/**
 * Safe Cleanup Script
 * Only deletes files that are confirmed safe
 */
const fs = require('fs');
const path = require('path');

console.log('\n═══════════════════════════════════════════════════════════');
console.log('🧹 SAFE CLEANUP');
console.log('═══════════════════════════════════════════════════════════\n');

const cleanupActions = {
  deleted: [],
  skipped: [],
  errors: []
};

// 1. Delete backup files
const dataLiteDir = path.join(__dirname, '..', 'data', 'lite');
if (fs.existsSync(dataLiteDir)) {
  const files = fs.readdirSync(dataLiteDir);
  
  files.forEach(file => {
    if (file.includes('.backup.') || file.match(/backup\.\d+$/)) {
      const fullPath = path.join(dataLiteDir, file);
      try {
        const stat = fs.statSync(fullPath);
        fs.unlinkSync(fullPath);
        cleanupActions.deleted.push({
          file: file,
          size: (stat.size / 1024 / 1024).toFixed(2) + ' MB'
        });
      } catch (e) {
        cleanupActions.errors.push({ file: file, error: e.message });
      }
    }
  });
}

console.log('✅ DELETED (Safe to remove):\n');
cleanupActions.deleted.forEach(item => {
  console.log(`   🗑️  ${item.file} (${item.size})`);
});

if (cleanupActions.deleted.length === 0) {
  console.log('   (No backup files found)\n');
}

console.log('\n📦 KEPT (Still needed or backup):');
console.log('   • state.json (fallback for scraper)');
console.log('   • raw/*.html (useful for debugging)');
console.log('   • All active scripts and code\n');

if (cleanupActions.errors.length > 0) {
  console.log('\n⚠️  ERRORS:');
  cleanupActions.errors.forEach(item => {
    console.log(`   ❌ ${item.file}: ${item.error}`);
  });
}

const totalSize = cleanupActions.deleted.reduce((sum, item) => {
  const mb = parseFloat(item.size);
  return sum + (isNaN(mb) ? 0 : mb);
}, 0);

console.log('\n═══════════════════════════════════════════════════════════');
console.log(`✅ Cleanup complete: ${cleanupActions.deleted.length} files deleted, ${totalSize.toFixed(2)} MB freed`);
console.log('═══════════════════════════════════════════════════════════\n');

