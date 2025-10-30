// Direct scraper test - bypasses API
const { WebScraperService } = require('../src/lib/webScraperService');

async function testScraper() {
  console.log('🚀 Testing scraper directly (CYCLE MODE, INCREMENTAL)...');
  console.log('⏰ Started at:', new Date().toISOString());
  
  const scraper = new WebScraperService();
  
  try {
    // Test with cycle mode and incremental discovery
    const programs = await scraper.scrapeAllPrograms(true, 'incremental');
    
    console.log('\n✅ Scraper completed!');
    console.log('\n📊 Results:');
    console.log(`   Total Programs: ${programs.length}`);
    
    // Show new programs
    const newPrograms = programs.slice(-10);
    if (newPrograms.length > 0) {
      console.log(`\n   Sample Programs:`);
      newPrograms.forEach((p, i) => {
        console.log(`   ${i+1}. ${p.name} (${p.institution})`);
      });
    }
    
    console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
  } catch (error) {
    console.error('❌ Scraper error:', error);
  }
}

testScraper().catch(console.error);

