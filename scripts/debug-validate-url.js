const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const state = JSON.parse(fs.readFileSync('data/discovery-state.json', 'utf8'));
  const urls = (state['Austria Wirtschaftsservice (AWS)']?.unscrapedUrls || []).slice(0, 6);
  if (urls.length === 0) {
    console.log('No AWS unscraped URLs found in discovery-state.json');
    process.exit(0);
  }

  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });

  const programSignals = [
    'foerderung', 'foerderhoehe', 'foerder', 'grant', 'subsid', 'beihilfe',
    'kredit', 'darlehen', 'leasing', 'beteiligung', 'equity',
    'garantie', 'buergschaft', 'investment', 'steuer', 'incentive',
    'eligibility', 'voraussetzungen', 'requirements', 'bedingungen',
    'einreichung', 'bewerbung', 'application', 'antrag',
    'deadline', 'antragsfrist', 'frist', 'bewerbungsfrist',
    '€', 'euro', 'eur', 'betrag', 'summe', 'hohe'
  ];

  for (const url of urls) {
    const page = await browser.newPage();
    try {
      const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
      const status = resp ? resp.status() : null;
      const title = await page.title();
      const content = await page.content();
      const lower = content.toLowerCase();
      const found = programSignals.filter(s => lower.includes(s));

      console.log(`\nURL: ${url}`);
      console.log(`  Status: ${status}`);
      console.log(`  Title: ${title.substring(0, 80)}${title.length > 80 ? '...' : ''}`);
      console.log(`  Content length: ${content.length}`);
      console.log(`  Signals found: ${found.length} (${found.slice(0, 8).join(', ')}${found.length > 8 ? '...' : ''})`);
    } catch (e) {
      console.log(`\nURL: ${url}`);
      console.log(`  ERROR: ${e.message}`);
    } finally {
      try { await page.close(); } catch {}
    }
  }

  await browser.close();
})();
