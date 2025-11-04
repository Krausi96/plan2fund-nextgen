/**
 * Test Database Connection Directly
 * Uses ts-node to load TypeScript modules (same as API does)
 */

require('dotenv').config({ path: '.env.local' });

async function testDatabase() {
  console.log('🔍 Testing database connection directly...\n');
  
  // Check environment variable
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment variables');
    return;
  }
  
  console.log('✅ DATABASE_URL found');
  console.log(`   Connection string: ${process.env.DATABASE_URL.substring(0, 50)}...\n`);
  
  try {
    // Register ts-node to handle TypeScript imports
    require('ts-node').register({
      transpileOnly: true,
      compilerOptions: {
        module: 'commonjs',
        target: 'ES2020',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
        moduleResolution: 'node'
      }
    });
    
    // Now import TypeScript modules (same pattern as API)
    const neonClient = require('../scraper-lite/src/db/neon-client');
    const pageRepo = require('../scraper-lite/src/db/page-repository');
    
    console.log('✅ TypeScript modules loaded successfully\n');
    
    // Test connection
    console.log('🔌 Testing database connection...');
    const { getPool } = neonClient;
    const pool = getPool();
    
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Connection successful!');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].pg_version.substring(0, 50)}...\n`);
    
    // Test pages
    console.log('📄 Testing pages table...');
    const pagesResult = await pool.query('SELECT COUNT(*) as count FROM pages');
    console.log(`   ✅ Pages table: ${pagesResult.rows[0].count} pages\n`);
    
    // Test requirements
    console.log('📋 Testing requirements table...');
    const reqResult = await pool.query('SELECT COUNT(*) as count FROM requirements');
    console.log(`   ✅ Requirements table: ${reqResult.rows[0].count} requirements\n`);
    
    // Test page repository
    console.log('📚 Testing page repository...');
    const { getAllPages } = pageRepo;
    const pages = await getAllPages(10);
    console.log(`   ✅ Page repository: ${pages.length} pages loaded\n`);
    
    // Test full data loading (like API does)
    console.log('🔄 Testing full data loading (like API endpoint)...');
    const allPages = await getAllPages(1000);
    console.log(`   ✅ Loaded ${allPages.length} pages from database\n`);
    
    if (allPages.length > 0) {
      // Test loading requirements for first page
      const firstPage = allPages[0];
      const reqQuery = await pool.query(
        'SELECT category, type, value, required, source FROM requirements WHERE page_id = $1',
        [firstPage.id]
      );
      console.log(`   ✅ Loaded ${reqQuery.rows.length} requirements for first page`);
      console.log(`   ✅ Database is FULLY FUNCTIONAL!\n`);
      
      console.log('📊 SUMMARY:');
      console.log(`   ✅ Database connection: WORKING`);
      console.log(`   ✅ Pages: ${allPages.length} available`);
      console.log(`   ✅ Requirements: ${reqResult.rows[0].count} available`);
      console.log(`   ✅ API endpoint should use DATABASE (not fallback)\n`);
    }
    
    await pool.end();
    
  } catch (error) {
    console.error('\n❌ Database test failed:');
    console.error(`   Error: ${error.message}`);
    if (error.stack) {
      console.error(`   Stack: ${error.stack.split('\n').slice(0, 5).join('\n')}`);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check DATABASE_URL in .env.local');
    console.log('2. Install ts-node: npm install -D ts-node');
    console.log('3. Verify database is accessible');
    process.exit(1);
  }
}

testDatabase().catch(console.error);

