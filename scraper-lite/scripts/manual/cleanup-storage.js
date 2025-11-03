#!/usr/bin/env node
/**
 * Cleanup Storage Script
 * Removes unnecessary files to optimize storage
 */
const fs = require('fs');
const path = require('path');

const SCRAPER_DATA_DIR = path.join(__dirname, '..', 'data');

async function cleanup() {
  console.log('\n🧹 Starting Storage Cleanup...\n');
  
  let totalSizeFreed = 0;
  let filesDeleted = 0;
  
  // 1. Clean old raw HTML files (keep last 100 for debugging)
  const rawDir = path.join(SCRAPER_DATA_DIR, 'lite', 'raw');
  if (fs.existsSync(rawDir)) {
    const htmlFiles = fs.readdirSync(rawDir)
      .filter(f => f.endsWith('.html'))
      .map(f => ({
        name: f,
        path: path.join(rawDir, f),
        stats: fs.statSync(path.join(rawDir, f))
      }))
      .sort((a, b) => b.stats.mtimeMs - a.stats.mtimeMs); // Newest first
    
    if (htmlFiles.length > 100) {
      const toDelete = htmlFiles.slice(100); // Keep last 100
      console.log(`📁 Raw HTML: ${htmlFiles.length} files, keeping 100, deleting ${toDelete.length}...`);
      
      for (const file of toDelete) {
        totalSizeFreed += file.stats.size;
        fs.unlinkSync(file.path);
        filesDeleted++;
      }
      
      console.log(`   ✅ Deleted ${filesDeleted} old HTML files (${(totalSizeFreed / 1024 / 1024).toFixed(2)} MB)\n`);
    } else {
      console.log(`📁 Raw HTML: ${htmlFiles.length} files (no cleanup needed)\n`);
    }
  }
  
  // 2. Archive old legacy JSON files (keep only latest)
  const legacyDir = path.join(SCRAPER_DATA_DIR, 'legacy');
  if (fs.existsSync(legacyDir)) {
    const jsonFiles = fs.readdirSync(legacyDir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(legacyDir, f),
        stats: fs.statSync(path.join(legacyDir, f))
      }));
    
    // Files to keep: latest scraped-programs and migrated-programs
    const keepFiles = ['scraped-programs-latest.json', 'migrated-programs.json'];
    const toArchive = jsonFiles.filter(f => {
      // Keep if it's in the keep list
      if (keepFiles.includes(f.name)) return false;
      // Keep if it's not an old scraped-programs file
      if (f.name.startsWith('scraped-programs-') && f.name !== 'scraped-programs-latest.json') {
        // Check if it's old (older than 7 days)
        const daysOld = (Date.now() - f.stats.mtimeMs) / (1000 * 60 * 60 * 24);
        return daysOld > 7;
      }
      // Keep other analysis files
      if (f.name.includes('analysis') || f.name.includes('discovery') || f.name.includes('learned')) {
        return false;
      }
      return false; // Keep everything else for now
    });
    
    if (toArchive.length > 0) {
      console.log(`📦 Legacy JSON: Found ${toArchive.length} files to archive...`);
      // For now, just log what would be archived
      toArchive.forEach(f => {
        const sizeMB = (f.stats.size / 1024 / 1024).toFixed(2);
        console.log(`   - ${f.name} (${sizeMB} MB, ${new Date(f.stats.mtimeMs).toLocaleDateString()})`);
      });
      console.log('   ⚠️  Not deleting - review manually if needed\n');
    } else {
      console.log('📦 Legacy JSON: No files to archive\n');
    }
  }
  
  // 3. Summary
  console.log('📊 Cleanup Summary:');
  console.log(`   Files deleted: ${filesDeleted}`);
  console.log(`   Space freed: ${(totalSizeFreed / 1024 / 1024).toFixed(2)} MB`);
  console.log('\n✅ Cleanup complete!\n');
}

cleanup().catch(err => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});

