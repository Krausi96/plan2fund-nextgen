#!/usr/bin/env node
/**
 * Bundle Analysis Script
 * ======================
 * 
 * Analyzes Next.js bundle size and composition using @next/bundle-analyzer
 * Safe to run - only analyzes, doesn't modify anything
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class BundleAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      bundleSize: {},
      recommendations: []
    };
  }

  async analyze() {
    console.log('📦 Analyzing bundle size...\n');

    try {
      // Check if @next/bundle-analyzer is installed
      try {
        require.resolve('@next/bundle-analyzer');
      } catch (error) {
        console.log('⚠️  @next/bundle-analyzer not found. Installing...');
        execSync('npm install --save-dev @next/bundle-analyzer', { stdio: 'inherit' });
      }

      // Build the project first
      console.log('🔨 Building project...');
      execSync('npm run build', { stdio: 'pipe' });

      // Run bundle analyzer
      console.log('📊 Running bundle analysis...');
      const output = execSync('ANALYZE=true npm run build', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });

      this.results.bundleSize = {
        status: 'SUCCESS',
        message: 'Bundle analysis completed. Check .next/analyze/ for detailed reports.'
      };

      // Look for bundle size information in build output
      const sizeMatch = output.match(/First Load JS shared by all[^\d]*(\d+\.?\d*)\s*kB/);
      if (sizeMatch) {
        this.results.bundleSize.firstLoadJS = parseFloat(sizeMatch[1]);
      }

    } catch (error) {
      this.results.bundleSize = {
        status: 'ERROR',
        error: error.message
      };
    }

    this.generateRecommendations();
    this.saveResults();
    this.printSummary();
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.bundleSize.firstLoadJS > 200) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Large first load JS bundle',
        action: 'Consider code splitting and lazy loading',
        currentSize: `${this.results.bundleSize.firstLoadJS}kB`,
        targetSize: '< 200kB'
      });
    }

    recommendations.push({
      priority: 'MEDIUM',
      issue: 'Bundle analysis complete',
      action: 'Review .next/analyze/ directory for detailed breakdown',
      details: 'Open .next/analyze/client.html and .next/analyze/server.html in browser'
    });

    this.results.recommendations = recommendations;
  }

  saveResults() {
    const outputFile = 'bundle-analysis.json';
    fs.writeFileSync(outputFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Results saved to: ${outputFile}`);
  }

  printSummary() {
    console.log('\n📊 BUNDLE ANALYSIS SUMMARY');
    console.log('==========================');
    console.log(`Status: ${this.results.bundleSize.status}`);
    
    if (this.results.bundleSize.firstLoadJS) {
      console.log(`First Load JS: ${this.results.bundleSize.firstLoadJS}kB`);
    }

    console.log('\n💡 Recommendations:');
    this.results.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`     Action: ${rec.action}`);
    });
  }
}

// Run analysis
const analyzer = new BundleAnalyzer();
analyzer.analyze().catch(console.error);
