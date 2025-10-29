const fs = require('fs');
const path = require('path');

const programsPath = path.join(__dirname, '..', 'data', 'scraped-programs-latest.json');
const statePath = path.join(__dirname, '..', 'data', 'discovery-state.json');

console.log('\n📊 Scraper Run Comparison\n');
console.log('═══════════════════════════════════════════════════════════════\n');

// Load programs
const programs = JSON.parse(fs.readFileSync(programsPath, 'utf8'));
console.log('PROGRAMS DATA:');
console.log(`  Timestamp: ${programs.timestamp}`);
console.log(`  Total Programs: ${programs.totalPrograms}`);

// Group by scrape date
const byDate = {};
programs.programs.forEach(p => {
  const date = new Date(p.scraped_at).toISOString().split('T')[0];
  if (!byDate[date]) byDate[date] = [];
  byDate[date].push(p);
});

console.log('\n  Programs by Scrape Date:');
Object.keys(byDate).sort().forEach(date => {
  console.log(`    ${date}: ${byDate[date].length} programs`);
});

// Count today's programs
const today = new Date().toISOString().split('T')[0];
const todayPrograms = byDate[today] || [];
console.log(`\n  ⭐ Today (${today}): ${todayPrograms.length} newly scraped programs`);

if (todayPrograms.length > 0) {
  console.log('\n  New programs found today:');
  todayPrograms.slice(0, 10).forEach((p, i) => {
    console.log(`    ${i + 1}. ${p.name}`);
    console.log(`       ${p.source_url}`);
  });
}

// Load discovery state
if (fs.existsSync(statePath)) {
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const institutions = Object.keys(state);
  
  console.log('\n═══════════════════════════════════════════════════════════════\n');
  console.log('DISCOVERY STATE:');
  console.log(`  Institutions tracked: ${institutions.length}`);
  
  let totalKnown = 0;
  let totalUnscraped = 0;
  
  institutions.slice(0, 5).forEach(inst => {
    const instState = state[inst];
    totalKnown += instState.knownUrls.length;
    totalUnscraped += instState.unscrapedUrls.length;
    
    console.log(`\n  ${inst}:`);
    console.log(`    Explored sections: ${instState.exploredSections.length}`);
    console.log(`    Known URLs: ${instState.knownUrls.length}`);
    console.log(`    Unscraped URLs: ${instState.unscrapedUrls.length}`);
    if (instState.exploredSections.length > 0) {
      const section = instState.exploredSections[0];
      console.log(`    Last explored: ${section.lastExplored}`);
      console.log(`    URLs from first section: ${section.discoveredUrls.length}`);
    }
  });
  
  console.log(`\n  SUMMARY:`);
  console.log(`    Total known URLs across institutions: ${totalKnown}`);
  console.log(`    Total unscraped URLs: ${totalUnscraped}`);
  console.log(`    Potential new programs available: ${totalUnscraped}`);
}

console.log('\n═══════════════════════════════════════════════════════════════\n');

