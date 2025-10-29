const http = require('http');

// Get cycleOnly and discoveryMode parameters from command line
const cycleOnly = process.argv[2] === 'cycle';
const discoveryMode = process.argv[3] === 'deep' ? 'deep' : 'incremental';

const postData = JSON.stringify({ cycleOnly, discoveryMode });
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/scraper',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  },
      timeout: 300000 // 5 minutes
};

console.log(`🚀 Triggering WebScraperService (${cycleOnly ? 'CYCLE MODE' : 'FULL MODE'}, ${discoveryMode.toUpperCase()})...`);
console.log('⏰ Started at:', new Date().toISOString());
console.log('📊 Mode:', cycleOnly ? 'Cycle - One institution at a time (faster)' : 'Full - All institutions (slower)');
console.log('📊 Discovery:', discoveryMode === 'deep' ? 'Deep - Full re-exploration' : 'Incremental - Skip explored sections');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
    process.stdout.write('.'); // Progress indicator
  });
  
  res.on('end', () => {
    console.log('\n\n✅ Scraper completed!');
    try {
      const result = JSON.parse(data);
      console.log('\n📊 Results:');
      console.log(`   Total Programs: ${result.totalPrograms}`);
      console.log(`   Categories: ${result.categoriesExtracted}`);
      console.log(`   Sample Programs:`);
      result.programs.forEach((p, i) => {
        console.log(`   ${i+1}. ${p.name} (${p.institution})`);
      });
      console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
    } catch (error) {
      console.error('Parse error:', error);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.on('timeout', () => {
  console.error('❌ Request timeout');
  req.destroy();
});

req.write(postData);
req.end();
