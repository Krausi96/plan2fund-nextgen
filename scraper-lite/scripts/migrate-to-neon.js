#!/usr/bin/env node
/**
 * Migration Script: JSON → NEON Database
 * Migrates existing JSON data to NEON Postgres database
 */
// Load environment variables from .env.local if available
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });
require('dotenv').config(); // Also try .env in current dir

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const fs = require('fs');
const path = require('path');
const { getPool, testConnection } = require('../src/db/neon-client.ts');
const { savePage, saveRequirements } = require('../src/db/page-repository.ts');

const statePath = path.join(__dirname, '..', 'data', 'lite', 'state.json');

async function migrate() {
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔄 MIGRATING JSON → NEON DATABASE');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Test connection
  console.log('🔌 Testing database connection...');
  const connected = await testConnection();
  if (!connected) {
    console.error('❌ Database connection failed. Check DATABASE_URL environment variable.');
    process.exit(1);
  }
  console.log('✅ Database connected!\n');

  // Load JSON data
  console.log('📂 Loading JSON data...');
  if (!fs.existsSync(statePath)) {
    console.error(`❌ State file not found: ${statePath}`);
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const pages = state.pages || [];
  
  console.log(`📊 Found ${pages.length} pages to migrate\n`);

  // Migrate pages
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    
    try {
      // Check if page already exists
      const pool = getPool();
      const existing = await pool.query('SELECT id FROM pages WHERE url = $1', [page.url]);
      
      if (existing.rows.length > 0) {
        console.log(`⏭️  [${i + 1}/${pages.length}] Skipping (already exists): ${page.url.substring(0, 60)}...`);
        skippedCount++;
        continue;
      }

      // Save page
      const pageId = await savePage(page);
      
      // Save requirements
      if (page.categorized_requirements && Object.keys(page.categorized_requirements).length > 0) {
        await saveRequirements(pageId, page.categorized_requirements);
      }
      
      successCount++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`✅ [${i + 1}/${pages.length}] Migrated ${successCount} pages...`);
      }
    } catch (e) {
      errorCount++;
      console.error(`❌ [${i + 1}/${pages.length}] Error migrating ${page.url.substring(0, 60)}...: ${e.message}`);
      
      // Continue with next page
      if (errorCount > 10) {
        console.error('\n⚠️  Too many errors. Stopping migration.');
        break;
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ MIGRATION COMPLETE');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log(`✅ Successfully migrated: ${successCount} pages`);
  console.log(`⏭️  Skipped (already exists): ${skippedCount} pages`);
  console.log(`❌ Errors: ${errorCount} pages`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Verify data: SELECT COUNT(*) FROM pages;`);
  console.log(`   2. Update scraper to use database (dual-write mode)`);
  console.log(`   3. Once verified, switch to database-only mode`);
  console.log(`\n`);
}

if (require.main === module) {
  migrate().catch(console.error);
}

