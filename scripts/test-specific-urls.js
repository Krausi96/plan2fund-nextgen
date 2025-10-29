// Test specific unscraped URLs to see why they're not being scraped
const puppeteer = require('puppeteer');
const fs = require('fs');

const state = JSON.parse(fs.readFileSync('data/discovery-state.json', 'utf8'));
const programs = JSON.parse(fs.readFileSync('data/scraped-programs-latest.json', 'utf8'));

async function testUrl(url) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  try {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 });
    const status = resp ? resp.status() : null;
    const title = await page.title();
    const content = await page.content();
    const lower = content.toLowerCase();
    
    // Check if it's a detail page
    const path = new URL(url).pathname.toLowerCase();
    const isCategoryPage = [
      '/foerderungen', '/foerderung', '/programme', '/programs', '/program',
      '/spezialprogramme', '/wettbewerbe', '/competitions', '/universitaeten', '/universities'
    ].some(indicator => path.endsWith(indicator) || path.endsWith(indicator + '/'));
    
    // Check program signals
    const signals = [
      'foerderung', 'grant', 'subsid', 'beihilfe', 'kredit', 'darlehen',
      'eligibility', 'voraussetzungen', 'requirements', 'deadline'
    ];
    const foundSignals = signals.filter(s => lower.includes(s));
    
    // Check depth
    const pathSegments = path.split('/').filter(s => s.length > 0);
    const hasDepth = pathSegments.length >= 3;
    
    await browser.close();
    
    return {
      url,
      status,
      title: title.substring(0, 60),
      contentLength: content.length,
      isCategoryPage,
      signalCount: foundSignals.length,
      hasDepth,
      pathSegments: pathSegments.length,
      wouldPassDetailPageCheck: !isCategoryPage && (hasDepth || path.match(/\/([a-z0-9\-]{10,}|[a-z]{3,}\-[a-z]{3,})/)),
      wouldPassValidation: status === 200 && content.length > 1000 && foundSignals.length >= 2
    };
  } catch (e) {
    await browser.close();
    return { url, error: e.message };
  }
}

(async () => {
  console.log('\n🧪 TESTING UNSCRAPED URLs\n');
  console.log('='.repeat(60));
  
  // Test AWS unscraped URLs
  const awsUrls = state['Austria Wirtschaftsservice (AWS)']?.unscrapedUrls.slice(0, 5) || [];
  const existingUrls = new Set(programs.programs.map(p => p.source_url));
  
  console.log(`Testing ${awsUrls.length} AWS unscraped URLs:\n`);
  
  for (const url of awsUrls) {
    if (existingUrls.has(url)) {
      console.log(`⏭️  ${url.substring(0, 60)}...`);
      console.log(`   Status: Already in database\n`);
      continue;
    }
    
    const result = await testUrl(url);
    
    if (result.error) {
      console.log(`❌ ${url.substring(0, 60)}...`);
      console.log(`   Error: ${result.error}\n`);
    } else {
      const status = result.wouldPassDetailPageCheck && result.wouldPassValidation ? '✅' : '❌';
      console.log(`${status} ${url.substring(0, 60)}...`);
      console.log(`   Status: ${result.status}, Content: ${result.contentLength}, Signals: ${result.signalCount}`);
      console.log(`   Category: ${result.isCategoryPage}, Depth: ${result.pathSegments} levels`);
      console.log(`   Detail page check: ${result.wouldPassDetailPageCheck ? 'PASS' : 'FAIL'}`);
      console.log(`   Validation: ${result.wouldPassValidation ? 'PASS' : 'FAIL'}\n`);
    }
  }
})();

