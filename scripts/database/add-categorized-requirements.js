const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addCategorizedRequirementsColumn() {
  console.log('🔍 DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable not found');
    console.log('Please make sure .env.local exists with DATABASE_URL');
    process.exit(1);
  }
  
  // Use the same connection string as the API
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: false
  });

  try {
    console.log('🚀 Adding categorized_requirements column to programs table...');
    
    // Check if column already exists
    const checkColumn = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'programs' 
      AND column_name = 'categorized_requirements'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ categorized_requirements column already exists');
      return;
    }
    
    // Add the column
    await pool.query(`
      ALTER TABLE programs 
      ADD COLUMN categorized_requirements JSONB
    `);
    
    console.log('✅ Added categorized_requirements column');
    
    // Add GIN index for performance
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_programs_categorized_requirements 
      ON programs USING gin (categorized_requirements)
    `);
    
    console.log('✅ Added GIN index for categorized_requirements');
    
    // Add indexes for other JSONB fields
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_programs_eligibility_criteria 
      ON programs USING gin (eligibility_criteria)
    `);
    
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_programs_requirements 
      ON programs USING gin (requirements)
    `);
    
    console.log('✅ Added GIN indexes for JSONB fields');
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

addCategorizedRequirementsColumn();
