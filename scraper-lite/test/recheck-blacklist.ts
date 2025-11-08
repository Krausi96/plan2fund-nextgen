#!/usr/bin/env tsx

/**
 * Blacklist Re-Check Script
 * 
 * Re-checks low-confidence exclusions to find false positives
 * 
 * Usage:
 *   npm run blacklist:recheck [--host="example.com"] [--max=10] [--auto-remove]
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

import { runRecheckCycle } from '../src/utils-blacklist-recheck';

async function main() {
  const args = process.argv.slice(2);
  
  const getArg = (name: string): string | undefined => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    if (arg) {
      const value = arg.split('=').slice(1).join('=');
      return value.replace(/^["']|["']$/g, '');
    }
    return undefined;
  };
  
  const host = getArg('host');
  const maxRechecks = parseInt(getArg('max') || '10', 10);
  const autoRemove = args.includes('--auto-remove');
  
  if (host) {
    console.log(`🎯 Re-checking exclusions for host: ${host}\n`);
  } else {
    console.log(`🎯 Re-checking exclusions for all hosts\n`);
  }
  
  if (autoRemove) {
    console.log(`⚠️  AUTO-REMOVE enabled - false positives will be removed automatically\n`);
  } else {
    console.log(`ℹ️  AUTO-REMOVE disabled - use --auto-remove to apply changes\n`);
  }
  
  const result = await runRecheckCycle(host, maxRechecks, autoRemove);
  
  console.log(`\n📊 Summary:`);
  console.log(`   Checked: ${result.checked} exclusions`);
  console.log(`   Removed: ${result.removed} false positives`);
  
  if (result.removed > 0) {
    console.log(`\n✅ Blacklist updated!`);
  } else if (result.checked > 0) {
    console.log(`\n✅ All checked exclusions are still valid.`);
  } else {
    console.log(`\nℹ️  No low-confidence exclusions found to re-check.`);
  }
}

main().catch(console.error);

