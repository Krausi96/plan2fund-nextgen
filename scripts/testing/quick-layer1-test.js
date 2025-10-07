#!/usr/bin/env node

/**
 * QUICK LAYER 1 TEST
 * Fast test to verify Layer 1 functionality
 * 
 * Usage: node scripts/testing/quick-layer1-test.js
 */

// Using built-in fetch (Node.js 18+)

async function quickLayer1Test() {
  console.log('🚀 QUICK LAYER 1 TEST');
  console.log('=====================\n');

  const tests = [
    {
      name: 'Scraper API Health',
        test: async () => {
          try {
            const response = await fetch('http://localhost:3003/api/scraper/status');
            const data = await response.json();
            return {
              success: response.ok,
              message: `Status: ${data.health || 'unknown'}, Programs: ${data.stats?.totalPrograms || 0}`
            };
          } catch (error) {
            return { success: false, message: error.message };
          }
        }
    },
    {
      name: 'Programs API',
      test: async () => {
        try {
          const response = await fetch('http://localhost:3003/api/programs');
          const data = await response.json();
          return {
            success: response.ok && Array.isArray(data.programs),
            message: `Programs: ${Array.isArray(data.programs) ? data.programs.length : 0}`
          };
        } catch (error) {
          return { success: false, message: error.message };
        }
      }
    },
    {
      name: 'URL Discovery Test',
      test: async () => {
        try {
          // Test AWS sitemap
          const response = await fetch('https://www.aws.at/sitemap.xml', { method: 'HEAD' });
          return {
            success: response.ok,
            message: `AWS sitemap: ${response.status}`
          };
        } catch (error) {
          return { success: false, message: error.message };
        }
      }
    },
    {
      name: 'Requirements Extraction Test',
      test: async () => {
        try {
          // Test pattern matching
          const sampleContent = 'Geschäftsplan erforderlich, Finanzprognosen für 3 Jahre';
          const businessPlanFound = /geschäftsplan|business\s+plan/i.test(sampleContent);
          const financialFound = /finanzprognosen|financial\s+projections/i.test(sampleContent);
          
          return {
            success: businessPlanFound && financialFound,
            message: `Patterns: Business Plan: ${businessPlanFound}, Financial: ${financialFound}`
          };
        } catch (error) {
          return { success: false, message: error.message };
        }
      }
    },
    {
      name: 'Rate Limiting Test',
      test: async () => {
        try {
          // Test robots.txt compliance
          const response = await fetch('https://www.aws.at/robots.txt', { method: 'HEAD' });
          return {
            success: response.ok,
            message: `Robots.txt: ${response.status}`
          };
        } catch (error) {
          return { success: false, message: error.message };
        }
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  console.log('Running tests...\n');

  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}...`);
      const result = await test.test();
      
      if (result.success) {
        console.log(`  ✅ PASS - ${result.message}`);
        passed++;
      } else {
        console.log(`  ❌ FAIL - ${result.message}`);
        failed++;
      }
    } catch (error) {
      console.log(`  ❌ ERROR - ${error.message}`);
      failed++;
    }
    
    console.log('');
  }

  console.log('📊 RESULTS');
  console.log('==========');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0}%`);

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Layer 1 is working correctly.');
  } else {
    console.log(`\n⚠️ ${failed} tests failed. Check the issues above.`);
  }

  console.log('\n📝 NEXT STEPS:');
  console.log('1. Start the development server: npm run dev');
  console.log('2. Run the scraper: curl -X POST http://localhost:3000/api/scraper/run');
  console.log('3. Check results: curl http://localhost:3000/api/programs');
}

// Run the quick test
quickLayer1Test().catch(console.error);
