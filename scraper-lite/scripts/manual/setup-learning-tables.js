require('ts-node').register({ transpileOnly: true });
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');

async function setupTables() {
  const pool = getPool();
  
  try {
    console.log('\n📊 Setting up learning tables...\n');
    
    // Create extraction_patterns table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS extraction_patterns (
        id SERIAL PRIMARY KEY,
        pattern_type VARCHAR(50) NOT NULL,
        pattern_text TEXT NOT NULL,
        pattern_regex TEXT,
        host TEXT,
        confidence DECIMAL(3,2) DEFAULT 0.5,
        usage_count INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        failure_count INTEGER DEFAULT 0,
        success_rate DECIMAL(5,2) DEFAULT 0.0,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(pattern_type, pattern_text, host)
      )
    `);
    console.log('✅ Created extraction_patterns table');
    
    // Create extraction_metrics table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS extraction_metrics (
        id SERIAL PRIMARY KEY,
        page_id INTEGER REFERENCES pages(id) ON DELETE CASCADE,
        host TEXT NOT NULL,
        field_name VARCHAR(50) NOT NULL,
        extracted BOOLEAN NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(page_id, field_name)
      )
    `);
    console.log('✅ Created extraction_metrics table');
    
    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_extraction_patterns_type ON extraction_patterns(pattern_type);
      CREATE INDEX IF NOT EXISTS idx_extraction_patterns_confidence ON extraction_patterns(confidence DESC);
      CREATE INDEX IF NOT EXISTS idx_extraction_patterns_host ON extraction_patterns(host);
      CREATE INDEX IF NOT EXISTS idx_extraction_metrics_field ON extraction_metrics(field_name);
      CREATE INDEX IF NOT EXISTS idx_extraction_metrics_host ON extraction_metrics(host);
    `);
    console.log('✅ Created indexes');
    
    console.log('\n✅ Learning tables ready!');
    console.log('   Learning will now happen automatically during scraping.\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

setupTables().catch(console.error);

