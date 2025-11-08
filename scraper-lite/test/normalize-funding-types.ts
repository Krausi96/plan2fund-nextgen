#!/usr/bin/env tsx

/**
 * Normalize Funding Types in Database
 * 
 * Migrates existing funding types to canonical forms:
 * - Merges duplicates (grants → grant)
 * - Removes invalid types (services, coaching, etc.)
 * - Infers types for "unknown" entries
 * 
 * Usage:
 *   npm run normalize:funding-types [--dry-run]
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

import { getPool } from '../db/db';
import { normalizeFundingTypes, inferFundingType } from '../src/utils-funding-types';

async function normalizeAllFundingTypes(dryRun: boolean = false) {
  const pool = getPool();
  
  console.log('🔄 Normalizing funding types in database...\n');
  if (dryRun) {
    console.log('⚠️  DRY RUN MODE - No changes will be made\n');
  }
  
  // Get all pages with funding types
  const pages = await pool.query(`
    SELECT id, url, funding_types, metadata_json
    FROM pages
    WHERE funding_types IS NOT NULL AND array_length(funding_types, 1) > 0
  `);
  
  console.log(`📊 Found ${pages.rows.length} pages with funding types\n`);
  
  let updated = 0;
  let removed = 0;
  let inferred = 0;
  
  for (const page of pages.rows) {
    const oldTypes = page.funding_types || [];
    const normalized = normalizeFundingTypes(oldTypes);
    
    // If normalized is empty, try to infer
    let finalTypes = normalized;
    if (normalized.length === 0 && oldTypes.includes('unknown')) {
      const inferredTypes = inferFundingType(page.url, [], page.metadata_json?.title || '');
      if (inferredTypes.length > 0) {
        finalTypes = inferredTypes;
        inferred++;
      }
    }
    
    // Check if changed
    const oldSet = new Set(oldTypes.sort());
    const newSet = new Set(finalTypes.sort());
    const changed = oldSet.size !== newSet.size || 
                    !Array.from(oldSet).every(t => newSet.has(t));
    
    if (changed) {
      if (finalTypes.length === 0) {
        removed++;
        console.log(`   ❌ ${page.url.substring(0, 60)}...`);
        console.log(`      Old: [${oldTypes.join(', ')}] → Removed (all invalid)`);
      } else {
        updated++;
        console.log(`   ✅ ${page.url.substring(0, 60)}...`);
        console.log(`      Old: [${oldTypes.join(', ')}] → New: [${finalTypes.join(', ')}]`);
      }
      
      if (!dryRun) {
        await pool.query(
          `UPDATE pages SET funding_types = $1 WHERE id = $2`,
          [finalTypes, page.id]
        );
      }
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Updated: ${updated} pages`);
  console.log(`   Removed invalid: ${removed} pages`);
  console.log(`   Inferred: ${inferred} pages`);
  
  if (dryRun) {
    console.log(`\n⚠️  DRY RUN - No changes made. Run without --dry-run to apply.`);
  } else {
    console.log(`\n✅ Normalization complete!`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  
  await normalizeAllFundingTypes(dryRun);
  process.exit(0);
}

main().catch(console.error);

