const fs = require('fs');

const state = JSON.parse(fs.readFileSync('data/discovery-state.json', 'utf8'));
const programs = JSON.parse(fs.readFileSync('data/scraped-programs-latest.json', 'utf8'));

console.log('\n🔍 DISCOVERY ANALYSIS\n');
console.log('='.repeat(60));

const institutions = Object.keys(state);
console.log(`Institutions with discovery state: ${institutions.length}\n`);

institutions.forEach(inst => {
  const instState = state[inst];
  const knownUrls = instState.knownUrls || [];
  const unscrapedUrls = instState.unscrapedUrls || [];
  const exploredSections = instState.exploredSections || [];
  
  // Count programs for this institution
  const instPrograms = programs.programs.filter(p => p.institution === inst);
  
  console.log(`📊 ${inst}:`);
  console.log(`   Programs scraped: ${instPrograms.length}`);
  console.log(`   Known URLs: ${knownUrls.length}`);
  console.log(`   Unscraped URLs: ${unscrapedUrls.length}`);
  console.log(`   Explored sections: ${exploredSections.length}`);
  
  if (exploredSections.length > 0) {
    const section = exploredSections[0];
    console.log(`   Depth reached: ${section.depth}`);
    console.log(`   URLs found in section: ${section.discoveredUrls.length}`);
  }
  
  // Show sample unscraped URLs
  if (unscrapedUrls.length > 0) {
    console.log(`   Sample unscraped URLs:`);
    unscrapedUrls.slice(0, 3).forEach(url => {
      console.log(`     - ${url.substring(0, 70)}...`);
    });
  }
  
  console.log('');
});

// Check if we're hitting limits
console.log('\n⚙️  DISCOVERY LIMITS:\n');
console.log(`   Max URLs to discover: 100 per institution`);
console.log(`   Max depth: 2 levels`);
console.log(`   Status: ${institutions.some(inst => state[inst].knownUrls.length >= 90) ? '⚠️  Near limit' : '✅ Under limit'}`);

