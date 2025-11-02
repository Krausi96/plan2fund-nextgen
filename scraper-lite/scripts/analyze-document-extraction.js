#!/usr/bin/env node
/**
 * Analyze Document Extraction Depth
 * Checks how deep we extract document information (structure, format, requirements)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const { getPool } = require('../src/db/neon-client.ts');

async function analyzeDocuments() {
  console.log('\n📄 Analyzing Document Extraction Depth\n');
  console.log('='.repeat(70));
  
  const pool = getPool();
  
  try {
    // Get document requirements
    const docReqs = await pool.query(`
      SELECT 
        r.page_id,
        r.type,
        r.value,
        r.description,
        r.format,
        r.source,
        p.url,
        p.title
      FROM requirements r
      JOIN pages p ON r.page_id = p.id
      WHERE r.category = 'documents'
      ORDER BY r.page_id, r.id
    `);
    
    console.log(`\n📊 Total Document Requirements: ${docReqs.rows.length}`);
    
    // Analyze extraction depth
    let withStructure = 0;  // Has description (structure/requirements)
    let withFormat = 0;     // Has format requirement
    let withType = 0;       // Has specific type
    let simpleList = 0;     // Just value, no additional info
    
    const sampleDocuments = [];
    
    docReqs.rows.forEach(row => {
      if (row.description) withStructure++;
      if (row.format) withFormat++;
      if (row.type && row.type !== 'documents_required') withType++;
      if (!row.description && !row.format) simpleList++;
      
      // Collect samples
      if (sampleDocuments.length < 10) {
        sampleDocuments.push(row);
      }
    });
    
    console.log('\n📋 Extraction Depth Analysis:');
    console.log(`   Documents with structure/description: ${withStructure} (${((withStructure/docReqs.rows.length)*100).toFixed(1)}%)`);
    console.log(`   Documents with format: ${withFormat} (${((withFormat/docReqs.rows.length)*100).toFixed(1)}%)`);
    console.log(`   Documents with specific type: ${withType} (${((withType/docReqs.rows.length)*100).toFixed(1)}%)`);
    console.log(`   Simple list items: ${simpleList} (${((simpleList/docReqs.rows.length)*100).toFixed(1)}%)`);
    
    // Show samples
    console.log('\n🔍 Sample Documents (First 10):');
    sampleDocuments.forEach((doc, i) => {
      console.log(`\n   ${i + 1}. ${doc.title || doc.url}`);
      console.log(`      Type: ${doc.type}`);
      console.log(`      Value: ${doc.value?.substring(0, 80) || 'N/A'}...`);
      if (doc.description) {
        console.log(`      Structure: ${doc.description.substring(0, 100)}...`);
      }
      if (doc.format) {
        console.log(`      Format: ${doc.format}`);
      }
      console.log(`      Source: ${doc.source}`);
    });
    
    // Check if we're using full structure
    console.log('\n💡 Extraction Depth Assessment:');
    const avgDepth = ((withStructure + withFormat) / docReqs.rows.length) * 100;
    if (avgDepth > 50) {
      console.log('   ✅ Good depth - extracting structure and format');
    } else if (avgDepth > 25) {
      console.log('   ⚠️  Moderate depth - some structure extracted');
      console.log('   💡 Can improve: Extract more document structure/requirements');
    } else {
      console.log('   ⚠️  Low depth - mostly simple list items');
      console.log('   💡 Should improve: Extract document structure, format, nested requirements');
    }
    
    console.log('\n✅ Document analysis complete!\n');
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
    process.exit(1);
  }
}

analyzeDocuments();

