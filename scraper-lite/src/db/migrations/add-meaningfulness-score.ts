#!/usr/bin/env node
/**
 * Migration: Add meaningfulfulness_score column to requirements table
 */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env.local') });

const { getPool } = require('../neon-client');

async function addMeaningfulnessScoreColumn() {
  const pool = getPool();
  
  try {
    console.log('🔧 Adding meaningfulness_score column to requirements table...');
    
    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'requirements' AND column_name = 'meaningfulness_score'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Column meaningfulness_score already exists');
      return;
    }
    
    // Add column
    await pool.query(`
      ALTER TABLE requirements 
      ADD COLUMN IF NOT EXISTS meaningfulness_score INTEGER
    `);
    
    console.log('✅ Added meaningfulness_score column');
    
    // Update existing requirements with meaningfulness scores
    console.log('📊 Calculating meaningfulness scores for existing requirements...');
    
    const { calculateMeaningfulnessScore } = require('../../extract');
    const allRequirements = await pool.query('SELECT id, value FROM requirements WHERE meaningfulness_score IS NULL LIMIT 10000');
    
    let updated = 0;
    for (const req of allRequirements.rows) {
      try {
        const score = calculateMeaningfulnessScore(req.value);
        await pool.query(
          'UPDATE requirements SET meaningfulness_score = $1 WHERE id = $2',
          [score, req.id]
        );
        updated++;
        if (updated % 100 === 0) {
          console.log(`   Updated ${updated} requirements...`);
        }
      } catch (e) {
        // Skip if calculation fails
        continue;
      }
    }
    
    console.log(`✅ Updated ${updated} requirements with meaningfulness scores`);
    console.log('✅ Migration complete!');
    
  } catch (error) {
    const errorMsg = (error && typeof error === 'object' && 'message' in error) ? error.message : String(error);
    console.error('❌ Migration failed:', errorMsg);
    throw error;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  addMeaningfulnessScoreColumn().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { addMeaningfulnessScoreColumn };
}

