#!/usr/bin/env node
/**
 * Simple Health Check Script
 * ==========================
 * 
 * Performs basic health checks without running heavy commands
 * Safe to run - only analyzes, doesn't modify anything
 */

const fs = require('fs');
const path = require('path');

class SimpleHealthAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      fileStructure: {},
      packageJson: {},
      configFiles: {},
      recommendations: []
    };
  }

  async analyze() {
    console.log('🏥 Running simple health checks...\n');

    this.checkFileStructure();
    this.checkPackageJson();
    this.checkConfigFiles();
    this.generateRecommendations();
    this.saveResults();
    this.printSummary();
  }

  checkFileStructure() {
    console.log('🔍 Checking file structure...');
    
    const structure = {
      hasSrc: fs.existsSync('./src'),
      hasPages: fs.existsSync('./pages'),
      hasComponents: fs.existsSync('./src/components'),
      hasLib: fs.existsSync('./src/lib'),
      hasTypes: fs.existsSync('./src/types'),
      hasTests: fs.existsSync('./tests') || fs.existsSync('./__tests__'),
      hasConfig: fs.existsSync('./next.config.js'),
      hasTsConfig: fs.existsSync('./tsconfig.json'),
      hasPackageJson: fs.existsSync('./package.json'),
      hasEslintConfig: fs.existsSync('./eslint.config.js')
    };
    
    const missing = Object.entries(structure)
      .filter(([key, exists]) => !exists)
      .map(([key]) => key);
    
    this.results.fileStructure = {
      status: missing.length === 0 ? 'PASS' : 'WARNING',
      structure: structure,
      missing: missing,
      message: missing.length === 0 ? 'File structure looks good' : `Missing: ${missing.join(', ')}`
    };
  }

  checkPackageJson() {
    console.log('🔍 Checking package.json...');
    
    try {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
      
      this.results.packageJson = {
        status: 'PASS',
        name: packageJson.name,
        version: packageJson.version,
        hasScripts: !!packageJson.scripts,
        hasDependencies: !!packageJson.dependencies,
        hasDevDependencies: !!packageJson.devDependencies,
        scripts: Object.keys(packageJson.scripts || {}),
        dependencyCount: Object.keys(packageJson.dependencies || {}).length,
        devDependencyCount: Object.keys(packageJson.devDependencies || {}).length
      };
    } catch (error) {
      this.results.packageJson = {
        status: 'ERROR',
        error: error.message
      };
    }
  }

  checkConfigFiles() {
    console.log('🔍 Checking config files...');
    
    const configs = {
      nextConfig: fs.existsSync('./next.config.js'),
      tsConfig: fs.existsSync('./tsconfig.json'),
      eslintConfig: fs.existsSync('./eslint.config.js'),
      tailwindConfig: fs.existsSync('./tailwind.config.js'),
      postcssConfig: fs.existsSync('./postcss.config.js')
    };
    
    const present = Object.values(configs).filter(Boolean).length;
    const total = Object.keys(configs).length;
    
    this.results.configFiles = {
      status: present === total ? 'PASS' : 'WARNING',
      configs: configs,
      present: present,
      total: total,
      message: `${present}/${total} config files present`
    };
  }

  generateRecommendations() {
    const recommendations = [];
    
    // File structure recommendations
    if (this.results.fileStructure.missing.length > 0) {
      recommendations.push({
        priority: 'LOW',
        category: 'Structure',
        issue: `Missing files/directories: ${this.results.fileStructure.missing.join(', ')}`,
        action: 'Review project structure',
        impact: 'Code organization'
      });
    }
    
    // Package.json recommendations
    if (this.results.packageJson.status === 'ERROR') {
      recommendations.push({
        priority: 'HIGH',
        category: 'Configuration',
        issue: 'package.json has errors',
        action: 'Fix package.json syntax errors',
        impact: 'Project functionality'
      });
    }
    
    // Config recommendations
    if (this.results.configFiles.present < this.results.configFiles.total) {
      recommendations.push({
        priority: 'LOW',
        category: 'Configuration',
        issue: `Missing config files: ${this.results.configFiles.total - this.results.configFiles.present}`,
        action: 'Add missing configuration files',
        impact: 'Project setup'
      });
    }
    
    this.results.recommendations = recommendations;
  }

  saveResults() {
    const outputFile = 'scripts/analysis/health-analysis.json';
    fs.writeFileSync(outputFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Results saved to: ${outputFile}`);
  }

  printSummary() {
    console.log('\n📊 SIMPLE HEALTH CHECK SUMMARY');
    console.log('===============================');
    
    console.log(`\n📁 File Structure: ${this.results.fileStructure.status}`);
    if (this.results.fileStructure.missing.length > 0) {
      console.log(`  Missing: ${this.results.fileStructure.missing.join(', ')}`);
    }
    
    console.log(`\n📦 Package.json: ${this.results.packageJson.status}`);
    if (this.results.packageJson.name) {
      console.log(`  Name: ${this.results.packageJson.name}`);
      console.log(`  Version: ${this.results.packageJson.version}`);
      console.log(`  Dependencies: ${this.results.packageJson.dependencyCount}`);
      console.log(`  Dev Dependencies: ${this.results.packageJson.devDependencyCount}`);
    }
    
    console.log(`\n⚙️  Config Files: ${this.results.configFiles.status}`);
    console.log(`  Present: ${this.results.configFiles.present}/${this.results.configFiles.total}`);
    
    console.log(`\n💡 Recommendations: ${this.results.recommendations.length}`);
    this.results.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`     Action: ${rec.action}`);
    });
  }
}

// Run analysis
const analyzer = new SimpleHealthAnalyzer();
analyzer.analyze().catch(console.error);
