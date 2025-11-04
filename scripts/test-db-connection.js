// Test database connection from Next.js API route context
// Run with: node scripts/test-db-connection.js

async function testConnection() {
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  // Load environment variables
  require('dotenv').config({ path: '.env.local' });
  console.log('🔍 Testing database connection...\n');
  
  // Check environment variable
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('\n📝 Please add DATABASE_URL to .env.local:');
    console.log('DATABASE_URL=postgresql://user:pass@host.neon.tech/dbname?sslmode=require');
    return;
  }
  
  console.log('✅ DATABASE_URL found');
  console.log(`   Connection string: ${process.env.DATABASE_URL.substring(0, 50)}...`);
  
  try {
    // Use dynamic import for TypeScript modules (same as API)
    console.log('\n🔌 Attempting connection...');
    const neonClient = await import('../scraper-lite/src/db/neon-client.ts');
    const { getPool } = neonClient;
    const pool = getPool();
    
    // Test query
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Connection successful!');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].pg_version.substring(0, 50)}...`);
    
    // Test pages table
    try {
      const pagesResult = await pool.query('SELECT COUNT(*) as count FROM pages');
      console.log(`\n✅ Pages table accessible: ${pagesResult.rows[0].count} pages`);
    } catch (e) {
      console.warn(`⚠️ Pages table query failed: ${e.message}`);
    }
    
    // Test requirements table
    try {
      const reqResult = await pool.query('SELECT COUNT(*) as count FROM requirements');
      console.log(`✅ Requirements table accessible: ${reqResult.rows[0].count} requirements`);
    } catch (e) {
      console.warn(`⚠️ Requirements table query failed: ${e.message}`);
    }
    
    // Test page-repository
    try {
      const pageRepo = await import('../scraper-lite/src/db/page-repository.ts');
      const { getAllPages } = pageRepo;
      const pages = await getAllPages(10);
      console.log(`\n✅ Page repository working: ${pages.length} pages loaded`);
    } catch (e) {
      console.warn(`⚠️ Page repository failed: ${e.message}`);
      console.error('   Error details:', e);
    }
    
    await pool.end();
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:');
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n').slice(0, 5).join('\n')}`);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check DATABASE_URL in .env.local');
    console.log('2. Verify database is accessible from your network');
    console.log('3. Check SSL settings (neon.tech requires SSL)');
    console.log('4. Verify database credentials are correct');
  }
}

testConnection().catch(console.error);

