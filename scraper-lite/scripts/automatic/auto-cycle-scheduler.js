#!/usr/bin/env node
/**
 * Scheduler wrapper for auto-cycle.js
 * Can run as background daemon with PM2 or Windows Task Scheduler
 * 
 * Usage:
 *   node scripts/automatic/auto-cycle-scheduler.js
 *   
 * Or with PM2:
 *   pm2 start scripts/automatic/auto-cycle-scheduler.js --name scraper-hourly --cron "0 * * * *"
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const { autoCycle } = require('./auto-cycle.js');

// Load environment variables
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

async function scheduledRun() {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🕐 Scheduled Run: ${new Date().toISOString()}`);
  console.log('='.repeat(70));
  
  try {
    await autoCycle();
    console.log(`\n✅ Scheduled run completed at ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`\n❌ Scheduled run failed: ${error.message}`);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run immediately if called directly
if (require.main === module) {
  scheduledRun().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { scheduledRun };



