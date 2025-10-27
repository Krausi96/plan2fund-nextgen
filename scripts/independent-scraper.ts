/**
 * Independent Scraper - Runs without server
 * This directly imports and runs the WebScraperService
 */

import { WebScraperService } from '../src/lib/webScraperService';
import * as fs from 'fs';
import * as path from 'path';

async function runIndependentScraper() {
  console.log('🔄 Starting independent scraper (no server required)...');
  
  try {
    const scraper = new WebScraperService();
    const programs = await scraper.scrapeAllPrograms();
    
    console.log(`✅ Scraping completed!`);
    console.log(`📊 Total programs: ${programs.length}`);
    
    // Check for deep requirements
    const programsWithRequirements = programs.filter(p => 
      (p as any).categorized_requirements && 
      Object.keys((p as any).categorized_requirements).length > 0
    );
    
    console.log(`📋 Programs with categorized requirements: ${programsWithRequirements.length}`);
    
    if (programsWithRequirements.length > 0) {
      console.log('✅ Deep requirements extracted!');
      console.log('Sample categorized_requirements:', JSON.stringify((programsWithRequirements[0] as any).categorized_requirements, null, 2));
      
      // Check what questions will be generated
      const allReqTypes = new Set<string>();
      programsWithRequirements.forEach(p => {
        Object.keys((p as any).categorized_requirements).forEach(key => {
          allReqTypes.add(key);
        });
      });
      
      console.log(`📝 Requirement types found: ${Array.from(allReqTypes).join(', ')}`);
      console.log(`✨ QuestionEngine will auto-generate questions for all these types!`);
    } else {
      console.log('⚠️ No deep requirements found in scraped data');
    }
    
    // Check if file exists
    const latestFile = path.join(process.cwd(), 'data', 'scraped-programs-latest.json');
    if (fs.existsSync(latestFile)) {
      console.log('✅ scraped-programs-latest.json exists');
      console.log('✅ SmartWizard will now use this data and generate dynamic questions!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Scraper error:', error);
    process.exit(1);
  }
}

runIndependentScraper();

