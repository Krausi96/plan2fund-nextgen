import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.DATA_EXPORT_BASE_URL || 'http://localhost:3000';
const OUTPUT_DIR = process.env.DATA_EXPORT_DIR || 'data/exports';

const DATASETS = ['plans', 'templates', 'scraper', 'feedback', 'consent'];

async function fetchDataset(dataset) {
  const url = `${BASE_URL}/api/data-collection/export?dataset=${dataset}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) ${response.statusText}`);
  }
  return response.json();
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

(async () => {
  try {
    ensureDir(OUTPUT_DIR);
    console.log(` Exporting datasets from ${BASE_URL}`);

    for (const dataset of DATASETS) {
      console.log(` Fetching ${dataset} `);
      try {
        const data = await fetchDataset(dataset);
        const records = data.count ?? (Array.isArray(data.data) ? data.data.length : 0);
        const filePath = path.join(OUTPUT_DIR, `${dataset}.json`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`   Saved ${dataset}: ${records} records  ${filePath}`);
      } catch (error) {
        console.error(`   Failed to export ${dataset}:`, error.message || error);
      }
    }

    console.log('\n Export complete. Update DATA_COLLECTION_EXPORT etc. before running scripts/fine-tune-model.ts');
  } catch (error) {
    console.error('Export failed:', error);
    process.exit(1);
  }
})();
