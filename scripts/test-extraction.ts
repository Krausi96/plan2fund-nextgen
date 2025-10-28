// Diagnostic test to see what's being extracted
import { WebScraperService } from '../src/lib/webScraperService';
import * as fs from 'fs';
import * as path from 'path';

async function testSingleUrl() {
  console.log('🧪 Testing single URL extraction...');
  
  const scraper = new WebScraperService();
  await scraper.init();
  
  // Test with AWS.at to see what we get
  const testUrl = 'https://aws.at';
  const institutionId = 'aws';
  
  console.log(`🔍 Testing URL: ${testUrl}`);
  const result = await scraper.scrapeProgramFromUrl(testUrl, institutionId);
  
  if (result) {
    console.log('✅ Successfully extracted:');
    console.log(JSON.stringify(result, null, 2));
    
    // Save to temp file
    const tempFile = path.join(__dirname, '../data/test-extraction.json');
    fs.writeFileSync(tempFile, JSON.stringify(result, null, 2));
    console.log(`💾 Saved to: ${tempFile}`);
  } else {
    console.log('❌ No data extracted');
  }
  
  await scraper.close();
}

testSingleUrl().catch(console.error);
