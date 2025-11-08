#!/usr/bin/env tsx

/**
 * Blacklist Management Script
 * 
 * Usage:
 *   npm run blacklist:add -- --pattern="/news/" --host="example.com"
 *   npm run blacklist:remove -- --pattern="/news/" --host="example.com"
 *   npm run blacklist:list -- --host="example.com"
 *   npm run blacklist:clean -- --min-confidence=0.5
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

import { getPool } from '../db/db';
import { 
  getAllBlacklistPatterns, 
  updatePatternConfidence,
  addManualExclusion,
  removeExclusionPattern
} from '../src/utils/blacklist';

async function addExclusion(pattern: string, host: string, reason?: string) {
  const pool = getPool();
  
  try {
    await pool.query(`
      INSERT INTO url_patterns (host, pattern_type, pattern, learned_from_url, confidence, usage_count, success_rate)
      VALUES ($1, 'exclude', $2, $3, 0.8, 1, 0)
      ON CONFLICT (host, pattern_type, pattern) DO UPDATE
        SET confidence = GREATEST(url_patterns.confidence, 0.8),
            usage_count = url_patterns.usage_count + 1
    `, [host, pattern, reason || 'Manual exclusion']);
    
    console.log(`✅ Added exclusion: ${host} - ${pattern}`);
  } catch (error: any) {
    console.error(`❌ Failed to add exclusion: ${error.message}`);
  }
}

async function removeExclusion(pattern: string, host: string) {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      DELETE FROM url_patterns
      WHERE host = $1 AND pattern_type = 'exclude' AND pattern = $2
    `, [host, pattern]);
    
    if (result.rowCount && result.rowCount > 0) {
      console.log(`✅ Removed exclusion: ${host} - ${pattern}`);
    } else {
      console.log(`⚠️  Exclusion not found: ${host} - ${pattern}`);
    }
  } catch (error: any) {
    console.error(`❌ Failed to remove exclusion: ${error.message}`);
  }
}

async function listExclusions(host?: string) {
  const pool = getPool();
  
  try {
    const query = host
      ? `SELECT * FROM url_patterns WHERE host = $1 AND pattern_type = 'exclude' ORDER BY confidence DESC, usage_count DESC`
      : `SELECT * FROM url_patterns WHERE pattern_type = 'exclude' ORDER BY host, confidence DESC, usage_count DESC`;
    
    const result = await pool.query(query, host ? [host] : []);
    
    if (result.rows.length === 0) {
      console.log('📋 No exclusions found');
      return;
    }
    
    console.log(`📋 Found ${result.rows.length} exclusions:\n`);
    result.rows.forEach((row: any) => {
      console.log(`  ${row.host} - ${row.pattern}`);
      console.log(`    Confidence: ${row.confidence}, Usage: ${row.usage_count}, Source: ${row.learned_from_url}\n`);
    });
  } catch (error: any) {
    console.error(`❌ Failed to list exclusions: ${error.message}`);
  }
}

async function cleanExclusions(minConfidence: number = 0.5) {
  const pool = getPool();
  
  try {
    const result = await pool.query(`
      DELETE FROM url_patterns
      WHERE pattern_type = 'exclude' AND confidence < $1
    `, [minConfidence]);
    
    console.log(`✅ Removed ${result.rowCount || 0} low-confidence exclusions (confidence < ${minConfidence})`);
  } catch (error: any) {
    console.error(`❌ Failed to clean exclusions: ${error.message}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0]; // First argument is the command
  
  if (!command || !['add', 'remove', 'list', 'clean'].includes(command)) {
    console.log('Usage:');
    console.log('  npm run blacklist:add -- --pattern="/news/" --host="example.com" [--reason="Manual exclusion"]');
    console.log('  npm run blacklist:remove -- --pattern="/news/" --host="example.com"');
    console.log('  npm run blacklist:list [--host="example.com"]');
    console.log('  npm run blacklist:clean [--min-confidence=0.5]');
    process.exit(1);
  }
  
  const getArg = (name: string): string | undefined => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    if (arg) {
      // Handle quoted values
      const value = arg.split('=').slice(1).join('=');
      return value.replace(/^["']|["']$/g, ''); // Remove quotes
    }
    return undefined;
  };
  
  switch (command) {
    case 'add':
      const pattern = getArg('pattern');
      const host = getArg('host');
      const reason = getArg('reason');
      if (!pattern || !host) {
        console.error('❌ Required: --pattern and --host');
        process.exit(1);
      }
      await addExclusion(pattern, host, reason);
      break;
      
    case 'remove':
      const removePattern = getArg('pattern');
      const removeHost = getArg('host');
      if (!removePattern || !removeHost) {
        console.error('❌ Required: --pattern and --host');
        process.exit(1);
      }
      await removeExclusion(removePattern, removeHost);
      break;
      
    case 'list':
      const listHost = getArg('host');
      await listExclusions(listHost);
      break;
      
    case 'clean':
      const minConf = parseFloat(getArg('min-confidence') || '0.5');
      await cleanExclusions(minConf);
      break;
  }
  
  process.exit(0);
}

main().catch(console.error);

