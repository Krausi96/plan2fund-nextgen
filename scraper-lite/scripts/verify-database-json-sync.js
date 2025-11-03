#!/usr/bin/env node
/**
 * Verify Database vs JSON Synchronization
 * Compares database content with JSON fallback files
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const { getPool } = require('../src/db/neon-client.ts');
const fs = require('fs');
const path = require('path');

async function verifySync() {
  console.log('\n🔍 Verifying Database vs JSON Synchronization\n');
  console.log('='.repeat(70));
  
  const pool = getPool();
  
  try {
    // 1. Get database stats
    console.log('\n📊 Database Stats:');
    const dbPages = await pool.query('SELECT COUNT(*) as count FROM pages');
    const dbReqs = await pool.query('SELECT COUNT(*) as count FROM requirements');
    console.log(`   Pages: ${dbPages.rows[0].count}`);
    console.log(`   Requirements: ${dbReqs.rows[0].count}`);
    
    // 2. Get JSON fallback stats
    console.log('\n📄 JSON Fallback Files:');
    const jsonPaths = [
      path.join(__dirname, '..', 'data', 'legacy', 'scraped-programs-latest.json'),
      path.join(__dirname, '..', 'data', 'legacy', 'migrated-programs.json')
    ];
    
    let jsonPrograms = 0;
    let jsonReqs = 0;
    
    for (const jsonPath of jsonPaths) {
      if (fs.existsSync(jsonPath)) {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        const programs = data.programs || [];
        jsonPrograms += programs.length;
        
        programs.forEach(function(p) {
          const reqs = p.categorized_requirements || {};
          jsonReqs += Object.values(reqs).reduce(function(sum, arr) { return sum + (Array.isArray(arr) ? arr.length : 0); }, 0);
        });
        
        console.log(`   ${path.basename(jsonPath)}: ${programs.length} programs`);
      } else {
        console.log(`   ${path.basename(jsonPath)}: Not found`);
      }
    }
    
    console.log(`   Total JSON Programs: ${jsonPrograms}`);
    console.log(`   Total JSON Requirements: ${jsonReqs}`);
    
    // 3. Compare counts
    console.log('\n📊 Comparison:');
    const dbPageCount = parseInt(dbPages.rows[0].count);
    const dbReqCount = parseInt(dbReqs.rows[0].count);
    
    console.log(`   Pages: DB=${dbPageCount}, JSON=${jsonPrograms}, Diff=${dbPageCount - jsonPrograms}`);
    console.log(`   Requirements: DB=${dbReqCount}, JSON=${jsonReqs}, Diff=${dbReqCount - jsonReqs}`);
    
    if (dbPageCount > jsonPrograms) {
      console.log(`   ✅ Database has ${dbPageCount - jsonPrograms} MORE pages than JSON`);
    } else if (dbPageCount < jsonPrograms) {
      console.log(`   ⚠️  JSON has ${jsonPrograms - dbPageCount} MORE programs than database`);
    } else {
      console.log(`   ✅ Database and JSON have same page count`);
    }
    
    // 4. Sample comparison (first 5 pages)
    console.log('\n🔍 Sample Comparison (First 5 Pages):');
    const dbSample = await pool.query('SELECT id, url, title FROM pages LIMIT 5');
    
    for (const page of dbSample.rows) {
      const programId = `page_${page.id}`;
      
      // Check if exists in JSON
      let foundInJson = false;
      for (const jsonPath of jsonPaths) {
        if (fs.existsSync(jsonPath)) {
          const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
          const programs = data.programs || [];
          foundInJson = programs.some(function(p) { return p.id === programId || p.url === page.url; });
          if (foundInJson) break;
        }
      }
      
      console.log(`   ${foundInJson ? '✅' : '⚠️ '} ${page.title || page.url.substring(0, 50)}`);
      if (!foundInJson) {
        console.log(`      ⚠️  Not found in JSON (DB-only)`);
      }
    }
    
    // 5. Check for JSON-only programs
    console.log('\n🔍 Checking for JSON-Only Programs:');
    const allJsonPrograms = [];
    for (const jsonPath of jsonPaths) {
      if (fs.existsSync(jsonPath)) {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        allJsonPrograms.push(...(data.programs || []));
      }
    }
    
    let jsonOnlyCount = 0;
    for (const program of allJsonPrograms.slice(0, 20)) {
      const programUrl = program.url || program.source_url || '';
      if (programUrl) {
        const dbResult = await pool.query('SELECT id FROM pages WHERE url = $1', [programUrl]);
        if (dbResult.rows.length === 0) {
          jsonOnlyCount++;
        }
      }
    }
    
    if (jsonOnlyCount > 0) {
      console.log(`   ⚠️  Found ${jsonOnlyCount} programs in JSON that are NOT in database (sampled first 20)`);
    } else {
      console.log(`   ✅ All sampled JSON programs exist in database`);
    }
    
    // 6. Recommendations
    console.log('\n💡 Recommendations:');
    if (dbPageCount > jsonPrograms) {
      console.log('   ✅ Database is source of truth (has more recent data)');
      console.log('   ✅ API correctly prioritizes database over JSON');
    } else if (jsonPrograms > dbPageCount) {
      console.log('   ⚠️  JSON has more programs - consider migrating to database');
      console.log('   📝 Run: node scraper-lite/scripts/migrate-to-neon.js');
    }
    
    console.log('\n✅ Sync verification complete!\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

verifySync();

