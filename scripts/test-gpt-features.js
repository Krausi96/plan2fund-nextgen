// Automated GPT Features Testing Script
const https = require('https');

const BASE_URL = 'https://plan2fund-nextgen-jr92z1cby-krausi96s-projects.vercel.app/api/gpt-enhanced';

async function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testGPTFeatures() {
  console.log('🧪 Testing GPT-Enhanced Features...\n');
  
  const tests = [
    {
      name: 'GPT-Enhanced Programs',
      url: `${BASE_URL}?action=programs`,
      expectedFields: ['target_personas', 'tags', 'decision_tree_questions', 'editor_sections', 'readiness_criteria', 'ai_guidance']
    },
    {
      name: 'Decision Tree Questions',
      url: `${BASE_URL}?action=questions&programId=aws_preseed_sample`,
      expectedFields: ['id', 'question', 'type', 'options']
    },
    {
      name: 'Editor Sections',
      url: `${BASE_URL}?action=sections&programId=aws_preseed_sample`,
      expectedFields: ['id', 'title', 'required', 'template', 'guidance']
    },
    {
      name: 'Readiness Criteria',
      url: `${BASE_URL}?action=criteria&programId=aws_preseed_sample`,
      expectedFields: ['id', 'title', 'description', 'checkType', 'weight']
    },
    {
      name: 'AI Guidance',
      url: `${BASE_URL}?action=guidance&programId=aws_preseed_sample`,
      expectedFields: ['context', 'tone', 'key_points', 'prompts']
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🔍 Testing: ${test.name}`);
      const result = await fetchJSON(test.url);
      
      if (result.success) {
        console.log(`✅ ${test.name}: SUCCESS`);
        console.log(`   Count: ${result.count || 'N/A'}`);
        console.log(`   Message: ${result.message}`);
        
        if (result.data && result.data.length > 0) {
          console.log(`   Sample data keys: ${Object.keys(result.data[0]).join(', ')}`);
          
          // Check for expected fields
          const missingFields = test.expectedFields.filter(field => 
            !result.data[0].hasOwnProperty(field)
          );
          
          if (missingFields.length > 0) {
            console.log(`   ⚠️  Missing fields: ${missingFields.join(', ')}`);
          } else {
            console.log(`   ✅ All expected fields present`);
          }
        } else {
          console.log(`   ⚠️  No data returned`);
        }
      } else {
        console.log(`❌ ${test.name}: FAILED`);
        console.log(`   Error: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ERROR`);
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('');
  }
  
  console.log('🏁 Testing complete!');
}

// Run the tests
testGPTFeatures().catch(console.error);
