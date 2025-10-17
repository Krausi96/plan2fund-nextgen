#!/usr/bin/env node
/**
 * Master Analysis Script
 * ======================
 * 
 * Runs all analysis scripts in the correct order
 * Safe to run - only analyzes, doesn't modify anything
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class MasterAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      scripts: [],
      summary: {},
      recommendations: []
    };
    this.scriptOrder = [
      { name: 'Health Check', file: 'analyze-health.js', critical: true },
      { name: 'File Size Analysis', file: 'analyze-filesize.js', critical: false },
      { name: 'Bundle Analysis', file: 'analyze-bundle.js', critical: false },
      { name: 'Unused Code Detection', file: 'analyze-unused.js', critical: false },
      { name: 'Duplicate Detection', file: 'analyze-duplicates.js', critical: false }
    ];
  }

  async runAll() {
    console.log('🚀 Starting comprehensive codebase analysis...\n');
    console.log('This will run 5 analysis scripts in the optimal order.\n');

    let allPassed = true;
    let criticalFailures = 0;

    for (let i = 0; i < this.scriptOrder.length; i++) {
      const script = this.scriptOrder[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📊 ${i + 1}/5 - ${script.name}`);
      console.log(`${'='.repeat(60)}`);

      try {
        const startTime = Date.now();
        execSync(`node scripts/analysis/${script.file}`, { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        const duration = Date.now() - startTime;

        this.results.scripts.push({
          name: script.name,
          file: script.file,
          status: 'SUCCESS',
          duration: `${duration}ms`,
          critical: script.critical
        });

        console.log(`✅ ${script.name} completed successfully (${duration}ms)`);

      } catch (error) {
        const duration = Date.now() - Date.now();
        this.results.scripts.push({
          name: script.name,
          file: script.file,
          status: 'FAILED',
          error: error.message,
          duration: `${duration}ms`,
          critical: script.critical
        });

        console.log(`❌ ${script.name} failed: ${error.message}`);

        if (script.critical) {
          criticalFailures++;
          allPassed = false;
          console.log(`⚠️  CRITICAL: ${script.name} failed. Stopping analysis.`);
          break;
        } else {
          console.log(`⚠️  Non-critical failure. Continuing with next script...`);
        }
      }
    }

    this.generateSummary();
    this.saveResults();
    this.printFinalSummary(allPassed, criticalFailures);
  }

  generateSummary() {
    const successful = this.results.scripts.filter(s => s.status === 'SUCCESS');
    const failed = this.results.scripts.filter(s => s.status === 'FAILED');
    const critical = this.results.scripts.filter(s => s.critical);

    this.results.summary = {
      totalScripts: this.results.scripts.length,
      successful: successful.length,
      failed: failed.length,
      criticalFailures: critical.filter(s => s.status === 'FAILED').length,
      successRate: Math.round((successful.length / this.results.scripts.length) * 100)
    };

    // Generate overall recommendations
    this.results.recommendations = this.generateOverallRecommendations();
  }

  generateOverallRecommendations() {
    const recommendations = [];
    const failed = this.results.scripts.filter(s => s.status === 'FAILED');

    if (failed.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Analysis',
        issue: `${failed.length} analysis scripts failed`,
        action: 'Fix failed scripts before proceeding with optimization',
        impact: 'Analysis completeness'
      });
    }

    recommendations.push({
      priority: 'MEDIUM',
      category: 'Next Steps',
      issue: 'Analysis complete',
      action: 'Review individual JSON reports for detailed findings',
      impact: 'Optimization planning',
      details: [
        'Check health-analysis.json for critical issues',
        'Review filesize-analysis.json for large files',
        'Examine bundle-analysis.json for bundle optimization',
        'Look at unused-code-analysis.json for safe deletions',
        'Study duplicate-analysis.json for consolidation opportunities'
      ]
    });

    return recommendations;
  }

  saveResults() {
    const outputFile = 'master-analysis.json';
    fs.writeFileSync(outputFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Master results saved to: ${outputFile}`);
  }

  printFinalSummary(allPassed, criticalFailures) {
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 MASTER ANALYSIS SUMMARY');
    console.log(`${'='.repeat(60)}`);

    console.log(`\n📈 Overall Results:`);
    console.log(`  Total Scripts: ${this.results.summary.totalScripts}`);
    console.log(`  Successful: ${this.results.summary.successful}`);
    console.log(`  Failed: ${this.results.summary.failed}`);
    console.log(`  Success Rate: ${this.results.summary.successRate}%`);

    if (criticalFailures > 0) {
      console.log(`\n❌ CRITICAL FAILURES: ${criticalFailures}`);
      console.log('   Fix critical issues before proceeding with optimization!');
    }

    console.log(`\n📋 Script Results:`);
    this.results.scripts.forEach((script, index) => {
      const status = script.status === 'SUCCESS' ? '✅' : '❌';
      const critical = script.critical ? ' (CRITICAL)' : '';
      console.log(`  ${index + 1}. ${status} ${script.name}${critical} - ${script.duration}`);
    });

    console.log(`\n📄 Generated Reports:`);
    const reportFiles = [
      'health-analysis.json',
      'filesize-analysis.json', 
      'bundle-analysis.json',
      'unused-code-analysis.json',
      'duplicate-analysis.json',
      'master-analysis.json'
    ];

    reportFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`  ✅ ${file}`);
      } else {
        console.log(`  ❌ ${file} (not generated)`);
      }
    });

    console.log(`\n💡 Next Steps:`);
    this.results.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`     Action: ${rec.action}`);
    });

    if (allPassed) {
      console.log(`\n🎉 All analyses completed successfully!`);
      console.log(`   Review the JSON reports to plan your optimization strategy.`);
    } else {
      console.log(`\n⚠️  Some analyses failed. Fix critical issues first.`);
    }
  }
}

// Run all analyses
const analyzer = new MasterAnalyzer();
analyzer.runAll().catch(console.error);
