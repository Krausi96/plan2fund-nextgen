// Focused scraper - processes ALL unscraped URLs from high-potential institutions
const { WebScraperService } = require('../src/lib/webScraperService');
const fs = require('fs');
const path = require('path');

async function scrapeFocused() {
  console.log('🚀 FOCUSED SCRAPER - High-Potential Institutions Only\n');
  console.log('⏰ Started at:', new Date().toISOString());
  
  const scraper = new WebScraperService();
  
  try {
    // Load discovery state to find high-potential institutions
    const statePath = path.join(__dirname, '..', 'data', 'discovery-state.json');
    const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
    
    // Find institutions with most unscraped URLs
    const institutions = Object.entries(state)
      .map(([name, data]) => ({
        name,
        unscraped: data.unscrapedUrls?.length || 0
      }))
      .filter(inst => inst.unscraped > 0)
      .sort((a, b) => b.unscraped - a.unscraped);
    
    console.log('\n📊 Top institutions by unscraped URLs:');
    institutions.slice(0, 5).forEach((inst, i) => {
      console.log(`   ${i+1}. ${inst.name}: ${inst.unscraped} unscraped URLs`);
    });
    
    console.log('\n🎯 Processing top 3 institutions with most unscraped URLs...\n');
    
    // This will process ALL unscraped URLs (up to 200 per institution)
    // The optimized code now handles this automatically
    const programs = await scraper.scrapeAllPrograms(true, 'incremental');
    
    console.log('\n✅ Focused scraper completed!');
    console.log('\n📊 Results:');
    console.log(`   Total Programs: ${programs.length}`);
    
    // Show new programs
    const newPrograms = programs.slice(-10);
    if (newPrograms.length > 0) {
      console.log(`\n   Latest Programs:`);
      newPrograms.forEach((p, i) => {
        console.log(`   ${i+1}. ${p.name} (${p.institution})`);
      });
    }
    
    console.log(`\n⏰ Completed at: ${new Date().toISOString()}`);
  } catch (error) {
    console.error('❌ Scraper error:', error);
  }
}

scrapeFocused().catch(console.error);

