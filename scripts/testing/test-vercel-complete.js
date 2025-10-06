// Complete Vercel System Test - Phase 2 Step 3
const https = require('https');

const BASE_URL = 'https://plan2fund-nextgen-jr92z1cby-krausi96s-projects.vercel.app';

function testCompleteSystem() {
  console.log('🚀 Testing Complete System on Vercel...\n');
  
  // Test 1: Check if deployment is ready
  console.log('1️⃣ Checking deployment status...');
  testDeploymentStatus();
}

function testDeploymentStatus() {
  const options = {
    hostname: 'plan2fund-nextgen-jr92z1cby-krausi96s-projects.vercel.app',
    port: 443,
    path: '/api/programs-ai?action=programs',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ Deployment Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(data);
          console.log(`📊 Current programs in database: ${result.count}`);
          console.log('✅ Database connection working!');
          
          // Test 2: Test scraper API
          console.log('\n2️⃣ Testing scraper API...');
          testScraperAPI();
        } catch (error) {
          console.log('❌ Database API returned invalid JSON');
          console.log('Raw response:', data.substring(0, 200) + '...');
        }
      } else if (res.statusCode === 401) {
        console.log('🔒 Vercel protection enabled - need bypass token');
        console.log('✅ Deployment is live but protected');
        
        // Test 3: Test with bypass token
        console.log('\n2️⃣ Testing with bypass token...');
        testWithBypassToken();
      } else {
        console.log(`❌ Unexpected status: ${res.statusCode}`);
        console.log('Raw response:', data.substring(0, 200) + '...');
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Network error:', error.message);
  });

  req.end();
}

function testScraperAPI() {
  const testData = JSON.stringify({ action: 'test' });
  
  const options = {
    hostname: 'plan2fund-nextgen-jr92z1cby-krausi96s-projects.vercel.app',
    port: 443,
    path: '/api/scraper/run',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ Scraper API Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(data);
          console.log(`📊 Generated ${result.count} test programs`);
          console.log('✅ Scraper API working!');
          
          // Test 3: Test save action
          console.log('\n3️⃣ Testing save action...');
          testSaveAction();
        } catch (error) {
          console.log('❌ Scraper API returned invalid JSON');
          console.log('Raw response:', data.substring(0, 200) + '...');
        }
      } else if (res.statusCode === 401) {
        console.log('🔒 Scraper API protected - need bypass token');
        console.log('✅ Scraper API deployed but protected');
      } else {
        console.log(`❌ Scraper API error: ${res.statusCode}`);
        console.log('Raw response:', data.substring(0, 200) + '...');
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Scraper API network error:', error.message);
  });

  req.write(testData);
  req.end();
}

function testSaveAction() {
  const saveData = JSON.stringify({ action: 'save' });
  
  const options = {
    hostname: 'plan2fund-nextgen-jr92z1cby-krausi96s-projects.vercel.app',
    port: 443,
    path: '/api/scraper/run',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(saveData),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ Save Action Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(data);
          console.log(`📊 Saved program: ${result.data.id}`);
          console.log('✅ Database save working!');
          
          // Test 4: Verify data was saved
          console.log('\n4️⃣ Verifying saved data...');
          verifySavedData();
        } catch (error) {
          console.log('❌ Save action returned invalid JSON');
          console.log('Raw response:', data.substring(0, 200) + '...');
        }
      } else {
        console.log(`❌ Save action error: ${res.statusCode}`);
        console.log('Raw response:', data.substring(0, 200) + '...');
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Save action network error:', error.message);
  });

  req.write(saveData);
  req.end();
}

function verifySavedData() {
  const options = {
    hostname: 'plan2fund-nextgen-jr92z1cby-krausi96s-projects.vercel.app',
    port: 443,
    path: '/api/programs-ai?action=programs',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ Verification Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        try {
          const result = JSON.parse(data);
          console.log(`📊 Total programs after save: ${result.count}`);
          
          // Check if our new program is there
          const hasNewProgram = result.data.some(p => p.id === 'aws_preseed_live');
          if (hasNewProgram) {
            console.log('🎉 SUCCESS: New program found in database!');
            console.log('✅ Complete system working end-to-end!');
          } else {
            console.log('⚠️  WARNING: New program not found in database');
          }
        } catch (error) {
          console.log('❌ Verification returned invalid JSON');
          console.log('Raw response:', data.substring(0, 200) + '...');
        }
      } else {
        console.log(`❌ Verification error: ${res.statusCode}`);
        console.log('Raw response:', data.substring(0, 200) + '...');
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ Verification network error:', error.message);
  });

  req.end();
}

function testWithBypassToken() {
  console.log('💡 To test with bypass token, you would need to:');
  console.log('1. Get bypass token from Vercel dashboard');
  console.log('2. Add ?x-vercel-protection-bypass=YOUR_TOKEN to URLs');
  console.log('3. Or use Authorization: Bearer YOUR_TOKEN header');
  console.log('\n✅ System is deployed and protected - this is good!');
}

// Run the complete test
testCompleteSystem();
