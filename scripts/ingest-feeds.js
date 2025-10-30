// Lane-1 feed ingestor: fetch simple sitemaps/RSS/HTML link lists for AT business institutions
// Merges discovered detail URLs into data/discovery-state.json without running the crawler

const fs = require('fs');
const path = require('path');

async function safeFetch(url, timeoutMs = 8000) {
  try {
    const ctrl = AbortSignal.timeout(timeoutMs);
    const res = await fetch(url, { signal: ctrl, headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!res.ok) return null;
    return await res.text();
  } catch (_) {
    return null;
  }
}

function loadDiscovery() {
  const p = path.join(__dirname, '..', 'data', 'discovery-state.json');
  if (!fs.existsSync(p)) return {};
  return JSON.parse(fs.readFileSync(p, 'utf8')) || {};
}

function saveDiscovery(state) {
  const p = path.join(__dirname, '..', 'data', 'discovery-state.json');
  fs.writeFileSync(p, JSON.stringify(state, null, 2));
}

function mergeUrls(state, instName, urls) {
  state[instName] = state[instName] || { lastFullScan: null, exploredSections: [], knownUrls: [], unscrapedUrls: [] };
  const s = state[instName];
  const setKnown = new Set(s.knownUrls || []);
  const setUnscraped = new Set(s.unscrapedUrls || []);
  let added = 0;
  for (const u of urls) {
    if (!u) continue;
    if (u.match(/\.(pdf|docx?|xlsx?|ppt)$/i)) continue;
    if (setKnown.has(u)) continue;
    setKnown.add(u);
    setUnscraped.add(u);
    added++;
  }
  s.knownUrls = Array.from(setKnown);
  s.unscrapedUrls = Array.from(setUnscraped);
  return added;
}

function extractLinksFromHtml(html, base) {
  const links = [];
  const re = /href\s*=\s*"([^"]+)"/gi;
  let m;
  while ((m = re.exec(html))) {
    let url = m[1];
    if (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')) continue;
    if (url.startsWith('/')) {
      try {
        const b = new URL(base);
        url = b.origin + url;
      } catch (_) {}
    }
    links.push(url);
  }
  return links;
}

function filterBusinessLinks(urls) {
  const deny = ['wohn','miete','privat','familie','schule','student','/awards','/preis','/news','/events','/press','/fileadmin','/downloads'];
  const allow = ['foerder','förder','grant','funding','programm','programme','support','unternehmen','kmu','sme','startup','apply','antrag'];
  return urls.filter(u => {
    const x = u.toLowerCase();
    if (deny.some(f => x.includes(f))) return false;
    return allow.some(f => x.includes(f));
  });
}

async function main() {
  const sources = [
    { name: 'Austria Wirtschaftsservice (AWS)', urls: ['https://www.aws.at/de/foerderungen'] },
    { name: 'Austrian Research Promotion Agency (FFG)', urls: ['https://www.ffg.at/foerderungen/unternehmen'] },
    { name: 'Wirtschaftskammer Österreich (WKO)', urls: ['https://www.wko.at/service/foerderungen.html'] },
    { name: 'Austrian Federal Ministry of Digital and Economic Affairs (BMDW)', urls: ['https://www.bmdw.gv.at/Services/Foerderungen.html'] },
    { name: 'Oesterreichische Kontrollbank (OeKB)', urls: ['https://www.oekb.at/en/export-services/financing.html'] }
  ];

  const state = loadDiscovery();
  let totalAdded = 0;

  for (const src of sources) {
    for (const u of src.urls) {
      const html = await safeFetch(u, 8000);
      if (!html) continue;
      const links = extractLinksFromHtml(html, u);
      const filtered = filterBusinessLinks(links);
      const added = mergeUrls(state, src.name, filtered);
      totalAdded += added;
      console.log(`✅ ${src.name}: +${added} URLs merged from ${u}`);
    }
  }

  saveDiscovery(state);
  console.log(`\n💾 Merged total: +${totalAdded} URLs into discovery-state.json`);
}

main().catch(err => { console.error(err); process.exit(1); });


