// Test script for on-demand recommendation API
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

async function testRecommend() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  // Test case 1: Austrian startup looking for grant
  console.log('\n🧪 Test 1: Austrian startup looking for grant\n');
  const test1 = {
    answers: {
      location: 'Austria',
      company_type: 'startup',
      company_stage: 'early',
      funding_amount: '50000',
    },
    max_results: 5,
  };

  try {
    const response = await fetch(`${baseUrl}/api/programs/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test1),
    });

    const result = await response.json();
    console.log('✅ Response received');
    console.log(`   Programs found: ${result.count}`);
    console.log(`   Seeds checked: ${result.seeds_checked}`);
    console.log('\n📊 Extraction Results:');
    result.extraction_results?.forEach((r: any, i: number) => {
      console.log(`   ${i + 1}. ${r.institution}`);
      console.log(`      URL: ${r.seed_url}`);
      if (r.extracted_fields) {
        console.log(`      Extracted: ${r.extracted_fields.join(', ')}`);
      }
      if (r.error) {
        console.log(`      ❌ Error: ${r.error}`);
      }
    });

    console.log('\n📋 Question Mapping:');
    Object.entries(result.question_mapping || {}).forEach(([question, mapping]: [string, any]) => {
      console.log(`   ${question}:`);
      console.log(`      Extracts: ${mapping.extracts.join(', ')}`);
      console.log(`      Description: ${mapping.description}`);
    });

    console.log('\n🎯 Sample Program:');
    if (result.programs && result.programs.length > 0) {
      const sample = result.programs[0];
      console.log(`   Name: ${sample.name}`);
      console.log(`   URL: ${sample.url}`);
      console.log(`   Funding Types: ${sample.funding_types?.join(', ') || 'N/A'}`);
      console.log(`   Metadata:`, JSON.stringify(sample.metadata, null, 2));
      console.log(`   Requirements Categories: ${Object.keys(sample.categorized_requirements || {}).join(', ')}`);
    }
  } catch (error: any) {
    console.error('❌ Test 1 failed:', error.message);
  }

  // Test case 2: EU company looking for loan
  console.log('\n\n🧪 Test 2: EU company looking for loan\n');
  const test2 = {
    answers: {
      location: 'EU',
      company_type: 'SME',
      funding_amount: '200000',
    },
    max_results: 3,
  };

  try {
    const response = await fetch(`${baseUrl}/api/programs/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test2),
    });

    const result = await response.json();
    console.log('✅ Response received');
    console.log(`   Programs found: ${result.count}`);
    console.log(`   Seeds checked: ${result.seeds_checked}`);
  } catch (error: any) {
    console.error('❌ Test 2 failed:', error.message);
  }

  // Test case 3: Extract all (no filtering)
  console.log('\n\n🧪 Test 3: Extract all programs (no filtering)\n');
  const test3 = {
    answers: {},
    max_results: 3,
    extract_all: true,
  };

  try {
    const response = await fetch(`${baseUrl}/api/programs/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(test3),
    });

    const result = await response.json();
    console.log('✅ Response received');
    console.log(`   Programs found: ${result.count}`);
    console.log(`   Seeds checked: ${result.seeds_checked}`);
  } catch (error: any) {
    console.error('❌ Test 3 failed:', error.message);
  }
}

if (require.main === module) {
  testRecommend().catch(console.error);
}

