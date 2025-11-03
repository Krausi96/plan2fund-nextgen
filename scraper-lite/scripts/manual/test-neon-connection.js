#!/usr/bin/env node
/**
 * Test NEON Database Connection
 */
// Load environment variables from .env.local if available
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });
require('dotenv').config(); // Also try .env in current dir

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const { testConnection, getPool } = require('../src/db/neon-client.ts');

async function test() {
  console.log('\n🔌 Testing NEON Database Connection...\n');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL environment variable is not set.');
    console.error('   Set it to your NEON connection string:');
    console.error('   export DATABASE_URL="postgresql://user:pass@host.neon.tech/dbname"\n');
    process.exit(1);
  }
  
  console.log(`📍 Connection string: ${process.env.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}\n`);
  
  try {
    const connected = await testConnection();
    
    if (connected) {
      console.log('✅ Connection successful!\n');
      
      // Test query
      const pool = getPool();
      const result = await pool.query('SELECT COUNT(*) as count FROM pages');
      console.log(`📊 Pages in database: ${result.rows[0].count}`);
      
      const reqResult = await pool.query('SELECT COUNT(*) as count FROM requirements');
      console.log(`📋 Requirements in database: ${reqResult.rows[0].count}\n`);
      
      console.log('✅ Database is ready to use!\n');
      process.exit(0);
    } else {
      console.error('❌ Connection failed.\n');
      process.exit(1);
    }
  } catch (e) {
    console.error(`❌ Error: ${e.message}\n`);
    console.error('Check your connection string and database permissions.\n');
    process.exit(1);
  }
}

test();

