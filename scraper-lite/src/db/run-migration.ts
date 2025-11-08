#!/usr/bin/env tsx

/**
 * Run database migration
 * Usage: npm run lite:migrate
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { getPool } from '../../db/db';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

async function runMigration() {
  const pool = getPool();
  
  console.log('🔄 Running migrations...\n');
  
  try {
    // Migration 1: Add quality_score
    console.log('1. Adding quality_score to scraping_jobs...');
    await pool.query(`
      ALTER TABLE scraping_jobs 
      ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 50;

      CREATE INDEX IF NOT EXISTS idx_scraping_jobs_quality ON scraping_jobs(quality_score DESC);

      CREATE INDEX IF NOT EXISTS idx_scraping_jobs_status_quality ON scraping_jobs(status, quality_score DESC);
    `);
    console.log('   ✅ Quality score added\n');
    
    // Migration 2: Add classification_feedback table
    console.log('2. Creating classification_feedback table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classification_feedback (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL UNIQUE,
        predicted_is_program VARCHAR(10) NOT NULL,
        predicted_quality INTEGER,
        actual_is_program BOOLEAN,
        actual_quality INTEGER,
        was_correct BOOLEAN,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_classification_feedback_correct ON classification_feedback(was_correct);
      CREATE INDEX IF NOT EXISTS idx_classification_feedback_created ON classification_feedback(created_at DESC);
    `);
    console.log('   ✅ Feedback table created\n');
    
    // Migration 3: Add quality_rules table
    console.log('3. Creating quality_rules table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS quality_rules (
        id SERIAL PRIMARY KEY,
        funding_type VARCHAR(50) NOT NULL,
        required_fields JSONB,
        optional_fields JSONB,
        typical_values JSONB,
        completeness_threshold INTEGER,
        learned_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(funding_type)
      );
    `);
    console.log('   ✅ Quality rules table created\n');
    
    console.log('✅ All migrations completed successfully!\n');
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

