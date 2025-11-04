// Test API endpoint to verify database connection
// This simulates what Next.js API route does
// Run with: node scripts/test-api-connection.js

const http = require('http');

async function testAPIEndpoint() {
  console.log('🔍 Testing API endpoint /api/programs?enhanced=true...\n');
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/programs?enhanced=true',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          console.log(`📊 Response Status: ${res.statusCode}`);
          console.log(`📊 Response Source: ${response.source || 'unknown'}`);
          console.log(`📊 Programs Count: ${response.count || response.programs?.length || 0}`);
          
          if (response.source === 'database') {
            console.log('✅ SUCCESS: Database connection working!');
            console.log(`   Loaded ${response.count} programs from database`);
            if (response.programs && response.programs.length > 0) {
              const sample = response.programs[0];
              console.log(`   Sample program: ${sample.name || sample.id}`);
              console.log(`   Has categorized_requirements: ${!!sample.categorized_requirements}`);
            }
          } else if (response.source === 'fallback') {
            console.log('⚠️ WARNING: Using JSON fallback (database connection failed)');
            console.log(`   Loaded ${response.count} programs from JSON`);
            console.log('   Check server logs for error details');
          } else {
            console.log('❓ UNKNOWN: Response source not specified');
          }
          
          resolve(response);
        } catch (e) {
          console.error('❌ Failed to parse response:', e.message);
          console.log('Raw response:', data.substring(0, 500));
          reject(e);
        }
      });
    });

    req.on('error', (error) => {
      if (error.code === 'ECONNREFUSED') {
        console.error('❌ Connection refused - Is Next.js dev server running?');
        console.error('   Start it with: npm run dev');
      } else {
        console.error('❌ Request failed:', error.message);
      }
      reject(error);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.error('❌ Request timeout - Server might be slow or unresponsive');
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function main() {
  try {
    await testAPIEndpoint();
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();

