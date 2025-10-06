// Test script for scraper API
const http = require('http');

function testScraperAPI() {
  console.log('🧪 Testing Scraper API...\n');

  // Test 1: Test action
  console.log('1️⃣ Testing "test" action...');
  const testData = JSON.stringify({ action: 'test' });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/scraper/run',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(testData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Test action response:');
      try {
        const result = JSON.parse(data);
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success && result.data && result.data.length > 0) {
          console.log(`\n✅ SUCCESS: Generated ${result.count} test programs`);
          console.log(`📋 Program ID: ${result.data[0].id}`);
          console.log(`📋 Program Name: ${result.data[0].name}`);
        } else {
          console.log('❌ FAILED: No data returned');
        }
      } catch (error) {
        console.log('❌ FAILED: Invalid JSON response');
        console.log('Raw response:', data);
      }
      
      // Test 2: Save action
      console.log('\n2️⃣ Testing "save" action...');
      testSaveAction();
    });
  });

  req.on('error', (error) => {
    console.log('❌ FAILED: Network error');
    console.log('Error:', error.message);
    console.log('\n💡 Make sure the dev server is running on localhost:3000');
  });

  req.write(testData);
  req.end();
}

function testSaveAction() {
  const saveData = JSON.stringify({ action: 'save' });
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/scraper/run',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(saveData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Save action response:');
      try {
        const result = JSON.parse(data);
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success) {
          console.log(`\n✅ SUCCESS: Saved program to database`);
          console.log(`📋 Program ID: ${result.data.id}`);
          
          // Test 3: Check if data appears in programs API
          console.log('\n3️⃣ Checking if data appears in programs API...');
          testProgramsAPI();
        } else {
          console.log('❌ FAILED: Save action failed');
          console.log('Error:', result.message);
        }
      } catch (error) {
        console.log('❌ FAILED: Invalid JSON response');
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ FAILED: Network error');
    console.log('Error:', error.message);
  });

  req.write(saveData);
  req.end();
}

function testProgramsAPI() {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/programs-ai?action=programs',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('✅ Programs API response:');
      try {
        const result = JSON.parse(data);
        console.log(`📊 Total programs: ${result.count}`);
        
        if (result.data && result.data.length > 0) {
          console.log('📋 Program IDs:');
          result.data.forEach((program, index) => {
            console.log(`  ${index + 1}. ${program.id} - ${program.name}`);
          });
          
          // Check if our new program is there
          const hasNewProgram = result.data.some(p => p.id === 'aws_preseed_live');
          if (hasNewProgram) {
            console.log('\n🎉 SUCCESS: New program found in database!');
          } else {
            console.log('\n⚠️  WARNING: New program not found in database');
          }
        }
      } catch (error) {
        console.log('❌ FAILED: Invalid JSON response');
        console.log('Raw response:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.log('❌ FAILED: Network error');
    console.log('Error:', error.message);
  });

  req.end();
}

// Run the tests
testScraperAPI();
