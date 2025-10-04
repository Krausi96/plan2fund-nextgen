// Quick test to show what the scraper collected
const fs = require('fs').promises;
const path = require('path');

async function showScrapedData() {
  try {
    console.log('🔍 Checking scraped data...\n');
    
    // Read scraped data
    const dataPath = path.join(__dirname, 'scraped-data', 'scraped_programs.json');
    const rawData = await fs.readFile(dataPath, 'utf8');
    const programs = JSON.parse(rawData);
    
    console.log(`📊 Total programs scraped: ${programs.length}`);
    console.log(`📅 Last updated: ${new Date().toLocaleString()}\n`);
    
    // Show sample programs
    console.log('🎯 Sample Programs:');
    programs.slice(0, 3).forEach((program, index) => {
      console.log(`\n${index + 1}. ${program.programName}`);
      console.log(`   Type: ${program.programType}`);
      console.log(`   Source: ${program.source}`);
      console.log(`   Funding: ${program.fundingAmount.min}-${program.fundingAmount.max} ${program.fundingAmount.currency}`);
      console.log(`   Target: ${program.targetPersonas.join(', ')}`);
      console.log(`   URL: ${program.sourceUrl}`);
    });
    
    // Show data quality
    console.log('\n📈 Data Quality:');
    const withFunding = programs.filter(p => p.fundingAmount.max > 0).length;
    const withDeadlines = programs.filter(p => p.deadlines.submission).length;
    const withRequirements = programs.filter(p => p.requirements && p.requirements.length > 0).length;
    
    console.log(`   Programs with funding info: ${withFunding}/${programs.length} (${Math.round(withFunding/programs.length*100)}%)`);
    console.log(`   Programs with deadlines: ${withDeadlines}/${programs.length} (${Math.round(withDeadlines/programs.length*100)}%)`);
    console.log(`   Programs with requirements: ${withRequirements}/${programs.length} (${Math.round(withRequirements/programs.length*100)}%)`);
    
    // Show program types
    const types = {};
    programs.forEach(p => {
      types[p.programType] = (types[p.programType] || 0) + 1;
    });
    
    console.log('\n🏷️  Program Types:');
    Object.entries(types).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} programs`);
    });
    
  } catch (error) {
    console.error('❌ Error reading scraped data:', error.message);
  }
}

showScrapedData();


