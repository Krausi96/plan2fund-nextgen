#!/usr/bin/env node
// Reset or clean state.json
const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, '..', 'data', 'lite', 'state.json');

const args = process.argv.slice(2);
const command = args[0] || 'help';

function main() {
  if (command === 'reset' || command === 'clear') {
    // Full reset
    const backup = STATE_FILE + '.backup.' + Date.now();
    if (fs.existsSync(STATE_FILE)) {
      fs.copyFileSync(STATE_FILE, backup);
      console.log(`📦 Backed up to: ${backup}`);
    }
    
    const empty = { jobs: [], pages: [], seen: {} };
    fs.writeFileSync(STATE_FILE, JSON.stringify(empty, null, 2));
    console.log('✅ State reset (all data cleared)');
    
  } else if (command === 'clean-jobs') {
    // Keep pages, remove old/failed jobs
    if (!fs.existsSync(STATE_FILE)) {
      console.log('❌ No state.json found');
      return;
    }
    
    const backup = STATE_FILE + '.backup.' + Date.now();
    fs.copyFileSync(STATE_FILE, backup);
    console.log(`📦 Backed up to: ${backup}`);
    
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const before = state.jobs.length;
    
    // Keep only queued jobs, remove done/failed
    state.jobs = state.jobs.filter(j => j.status === 'queued');
    
    const after = state.jobs.length;
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`✅ Cleaned jobs: ${before} → ${after} (kept ${after} queued, removed ${before - after} done/failed)`);
    console.log(`   Pages preserved: ${state.pages.length}`);
    console.log(`   Seen URLs preserved: ${Object.keys(state.seen).length}`);
    
  } else if (command === 'clean-seen') {
    // Reset seen URLs but keep jobs/pages
    if (!fs.existsSync(STATE_FILE)) {
      console.log('❌ No state.json found');
      return;
    }
    
    const backup = STATE_FILE + '.backup.' + Date.now();
    fs.copyFileSync(STATE_FILE, backup);
    console.log(`📦 Backed up to: ${backup}`);
    
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const before = Object.keys(state.seen).length;
    state.seen = {};
    
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(`✅ Cleared seen URLs: ${before} → 0`);
    console.log(`   Jobs preserved: ${state.jobs.length}`);
    console.log(`   Pages preserved: ${state.pages.length}`);
    
  } else if (command === 'stats') {
    // Show current stats
    if (!fs.existsSync(STATE_FILE)) {
      console.log('❌ No state.json found');
      return;
    }
    
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    const jobs = state.jobs || [];
    const pages = state.pages || [];
    const seen = state.seen || {};
    
    console.log('📊 State.json Stats:\n');
    console.log(`   Pages (scraped): ${pages.length}`);
    console.log(`   Jobs (discovered URLs):`);
    console.log(`      Total: ${jobs.length}`);
    console.log(`      Queued: ${jobs.filter(j => j.status === 'queued').length}`);
    console.log(`      Done: ${jobs.filter(j => j.status === 'done').length}`);
    console.log(`      Failed: ${jobs.filter(j => j.status === 'failed').length}`);
    console.log(`   Seen URLs: ${Object.keys(seen).length}`);
    console.log(`\n   File size: ${(fs.statSync(STATE_FILE).size / 1024 / 1024).toFixed(2)} MB`);
    
  } else {
    console.log(`
Usage: node scripts/reset-state.js <command>

Commands:
  reset       - Full reset (backup + clear everything)
  clean-jobs  - Keep pages, remove done/failed jobs (keeps queued)
  clean-seen  - Clear seen URLs, keep jobs/pages
  stats       - Show current state statistics

Examples:
  node scripts/reset-state.js stats
  node scripts/reset-state.js clean-jobs
  node scripts/reset-state.js reset
`);
  }
}

main();




