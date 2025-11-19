#!/usr/bin/env node

/**
 * View Benchmark Results
 * Displays benchmark results in a readable format
 */

import fs from 'fs/promises';
import path from 'path';

async function viewResults() {
  const resultsDir = path.join(process.cwd(), 'benchmark-results');
  
  try {
    const files = await fs.readdir(resultsDir);
    const jsonFiles = files.filter(f => f.endsWith('.json')).sort().reverse();
    
    if (jsonFiles.length === 0) {
      console.log('❌ No benchmark results found. Run benchmark-vs-chatgpt.mjs first.');
      return;
    }
    
    // Use most recent file
    const latestFile = jsonFiles[0];
    const filePath = path.join(resultsDir, latestFile);
    const data = JSON.parse(await fs.readFile(filePath, 'utf-8'));
    
    console.log('\n' + '='.repeat(80));
    console.log(`📊 BENCHMARK RESULTS: ${latestFile}`);
    console.log('='.repeat(80));
    
    // Summary
    console.log('\n🎯 OVERALL RESULTS:');
    console.log(`   Total Tests: ${data.summary.totalTests}`);
    console.log(`   Our System Wins: ${data.summary.ourWins} (${data.summary.ourWinRate.toFixed(1)}%)`);
    console.log(`   ChatGPT Wins: ${data.summary.chatgptWins} (${data.summary.chatgptWinRate.toFixed(1)}%)`);
    console.log(`   Ties: ${data.summary.ties} (${data.summary.tieRate.toFixed(1)}%)`);
    
    // Metrics
    console.log('\n📈 METRICS:');
    console.log(`\n   Our System:`);
    console.log(`      Success Rate: ${data.metrics.ourSystem.successRate.toFixed(1)}%`);
    console.log(`      Avg Duration: ${data.metrics.ourSystem.avgDuration.toFixed(0)}ms`);
    console.log(`      Avg Programs: ${data.metrics.ourSystem.avgProgramCount.toFixed(1)}`);
    console.log(`      Fallback Rate: ${data.metrics.ourSystem.fallbackRate.toFixed(1)}%`);
    
    console.log(`\n   ChatGPT:`);
    console.log(`      Success Rate: ${data.metrics.chatgpt.successRate.toFixed(1)}%`);
    console.log(`      Avg Duration: ${data.metrics.chatgpt.avgDuration.toFixed(0)}ms`);
    
    // Top wins/losses
    console.log('\n🏆 DETAILED BREAKDOWN:');
    const ourWins = data.results.filter(r => r.comparison.winner === 'ours');
    const chatgptWins = data.results.filter(r => r.comparison.winner === 'chatgpt');
    const failures = data.results.filter(r => !r.comparison.ourSystem.success && !r.comparison.chatgpt.success);
    
    if (ourWins.length > 0) {
      console.log(`\n   ✅ Our System Wins (${ourWins.length}):`);
      ourWins.slice(0, 5).forEach(r => {
        console.log(`      Test ${r.testId}: ${r.comparison.notes.join(', ')}`);
        console.log(`         Programs: ${r.ourSystem.programCount} vs ${r.chatgpt.estimatedProgramCount}`);
      });
      if (ourWins.length > 5) {
        console.log(`      ... and ${ourWins.length - 5} more`);
      }
    }
    
    if (chatgptWins.length > 0) {
      console.log(`\n   ❌ ChatGPT Wins (${chatgptWins.length}):`);
      chatgptWins.slice(0, 5).forEach(r => {
        console.log(`      Test ${r.testId}: ${r.comparison.notes.join(', ')}`);
        console.log(`         Programs: ${r.ourSystem.programCount} vs ${r.chatgpt.estimatedProgramCount}`);
      });
      if (chatgptWins.length > 5) {
        console.log(`      ... and ${chatgptWins.length - 5} more`);
      }
    }
    
    if (failures.length > 0) {
      console.log(`\n   ⚠️  Both Failed (${failures.length}):`);
      failures.slice(0, 3).forEach(r => {
        console.log(`      Test ${r.testId}: ${r.comparison.notes.join(', ')}`);
      });
    }
    
    // Sample outputs
    console.log('\n📋 SAMPLE OUTPUTS:');
    const sampleWin = ourWins[0];
    if (sampleWin) {
      console.log(`\n   Test ${sampleWin.testId} (Our Win):`);
      console.log(`   Answers: ${JSON.stringify(sampleWin.answers, null, 2).substring(0, 200)}...`);
      console.log(`   Our Programs:`);
      sampleWin.ourPrograms.forEach((p, i) => {
        console.log(`      ${i + 1}. ${p.name} [${p.funding_types?.join(', ') || 'N/A'}] - ${p.organization || 'N/A'}`);
      });
      console.log(`   ChatGPT Preview: ${sampleWin.chatgptPreview?.substring(0, 200)}...`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`💾 Full results: ${filePath}`);
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('❌ Error reading results:', error.message);
  }
}

viewResults().catch(console.error);

