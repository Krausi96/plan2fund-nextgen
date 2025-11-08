#!/usr/bin/env tsx

/**
 * Fix Category Name Case Sensitivity
 * Normalizes all category names to lowercase
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

async function main() {
  console.log('🔧 Fixing Category Name Case Sensitivity\n');
  
  const pool = getPool();
  
  // Get all unique categories with case variations
  const categories = await pool.query(`
    SELECT DISTINCT category, COUNT(*) as count
    FROM requirements
    GROUP BY category
    ORDER BY category
  `);
  
  console.log('Current Categories:');
  categories.rows.forEach((r: any) => {
    console.log(`  ${r.category}: ${r.count} requirements`);
  });
  console.log('');
  
  // Map of case variations to lowercase
  const categoryMap: Record<string, string> = {
    'Eligibility': 'eligibility',
    'Geographic': 'geographic',
    'Financial': 'financial',
    'Documents': 'documents',
    'Project': 'project',
    'Impact': 'impact',
    'Timeline': 'timeline',
    'Compliance': 'compliance',
    'Legal': 'legal',
    'Technical': 'technical',
    'Team': 'team',
    'Other': 'other', // Fix capital O
  };
  
  // Update each category
  let totalUpdated = 0;
  for (const [oldCategory, newCategory] of Object.entries(categoryMap)) {
    const result = await pool.query(`
      UPDATE requirements
      SET category = $1
      WHERE category = $2
    `, [newCategory, oldCategory]);
    
    if (result.rowCount && result.rowCount > 0) {
      console.log(`✅ Updated ${result.rowCount} requirements: "${oldCategory}" -> "${newCategory}"`);
      totalUpdated += result.rowCount;
    }
  }
  
  console.log(`\n✅ Total updated: ${totalUpdated} requirements`);
  
  // Verify
  const after = await pool.query(`
    SELECT DISTINCT category, COUNT(*) as count
    FROM requirements
    GROUP BY category
    ORDER BY category
  `);
  
  console.log('\nCategories after fix:');
  after.rows.forEach((r: any) => {
    console.log(`  ${r.category}: ${r.count} requirements`);
  });
  
  console.log('\n✅ Category normalization complete!\n');
}

main().catch(console.error);

