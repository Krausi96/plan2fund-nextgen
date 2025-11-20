#!/usr/bin/env node

/**
 * Quick Benchmark: 10 tests for fast iteration
 * Same as full benchmark but with fewer tests
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Modify the main script to use 10 tests instead of 100
const mainScript = path.join(__dirname, 'benchmark-vs-chatgpt.mjs');

console.log('🚀 Running QUICK benchmark (10 tests)...\n');
console.log('💡 For full benchmark (100 tests), run: node scripts/benchmark-vs-chatgpt.mjs\n');

// Read and modify the script temporarily
import fs from 'fs';
const scriptContent = fs.readFileSync(mainScript, 'utf-8');
const modifiedContent = scriptContent.replace(
  /generateDiverseAnswers\(100\)/g,
  'generateDiverseAnswers(10)'
);

// Write temporary script
const tempScript = path.join(__dirname, 'benchmark-temp.mjs');
fs.writeFileSync(tempScript, modifiedContent);

// Run it
const child = spawn('node', [tempScript], {
  stdio: 'inherit',
  shell: true,
});

child.on('close', (code) => {
  // Clean up
  fs.unlinkSync(tempScript);
  process.exit(code || 0);
});




