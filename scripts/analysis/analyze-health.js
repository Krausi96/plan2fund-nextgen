#!/usr/bin/env node
/**
 * Health Check Script
 * ===================
 * 
 * Performs comprehensive health checks on the codebase
 * Safe to run - only analyzes, doesn't modify anything
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class HealthAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      typescript: {},
      build: {},
      linting: {},
      tests: {},
      dependencies: {},
      fileStructure: {},
      recommendations: []
    };
  }

  async analyze() {
    console.log('🏥 Running health checks...\n');

    await this.checkTypeScript();
    await this.checkBuild();
    await this.checkLinting();
    await this.checkTests();
    await this.checkDependencies();
    await this.checkFileStructure();
    this.generateRecommendations();
    this.saveResults();
    this.printSummary();
  }

  async checkTypeScript() {
    console.log('🔍 Checking TypeScript compilation...');
    
    try {
      const output = execSync('npx tsc --noEmit', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      this.results.typescript = {
        status: 'PASS',
        errors: 0,
        warnings: 0,
        message: 'TypeScript compilation successful'
      };
      
    } catch (error) {
      const errorOutput = error.stdout.toString();
      const errorLines = errorOutput.split('\n').filter(line => line.includes('error'));
      const warningLines = errorOutput.split('\n').filter(line => line.includes('warning'));
      
      this.results.typescript = {
        status: 'FAIL',
        errors: errorLines.length,
        warnings: warningLines.length,
        message: 'TypeScript compilation failed',
        details: errorLines.slice(0, 10) // First 10 errors
      };
    }
  }

  async checkBuild() {
    console.log('🔍 Checking build process...');
    
    try {
      const output = execSync('npm run build', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      // Extract build size information
      const sizeMatch = output.match(/First Load JS shared by all[^\d]*(\d+\.?\d*)\s*kB/);
      const buildSize = sizeMatch ? parseFloat(sizeMatch[1]) : null;
      
      this.results.build = {
        status: 'PASS',
        buildSize: buildSize,
        message: 'Build successful'
      };
      
    } catch (error) {
      this.results.build = {
        status: 'FAIL',
        error: error.message,
        message: 'Build failed'
      };
    }
  }

  async checkLinting() {
    console.log('🔍 Checking code linting...');
    
    try {
      const output = execSync('npm run lint', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      this.results.linting = {
        status: 'PASS',
        errors: 0,
        warnings: 0,
        message: 'Linting passed'
      };
      
    } catch (error) {
      const errorOutput = error.stdout.toString();
      const errorLines = errorOutput.split('\n').filter(line => line.includes('error'));
      const warningLines = errorOutput.split('\n').filter(line => line.includes('warning'));
      
      this.results.linting = {
        status: 'FAIL',
        errors: errorLines.length,
        warnings: warningLines.length,
        message: 'Linting failed',
        details: errorLines.slice(0, 10) // First 10 errors
      };
    }
  }

  async checkTests() {
    console.log('🔍 Checking tests...');
    
    try {
      const output = execSync('npm test', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      // Extract test results
      const testMatch = output.match(/(\d+)\s+passing|(\d+)\s+failing/);
      const coverageMatch = output.match(/All files[^\d]*(\d+\.?\d*)%/);
      
      this.results.tests = {
        status: 'PASS',
        message: 'Tests passed',
        coverage: coverageMatch ? parseFloat(coverageMatch[1]) : null
      };
      
    } catch (error) {
      this.results.tests = {
        status: 'FAIL',
        error: error.message,
        message: 'Tests failed'
      };
    }
  }

  async checkDependencies() {
    console.log('🔍 Checking dependencies...');
    
    try {
      // Check for outdated packages
      const output = execSync('npm outdated --json', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const outdated = JSON.parse(output);
      const outdatedCount = Object.keys(outdated).length;
      
      this.results.dependencies = {
        status: outdatedCount === 0 ? 'PASS' : 'WARNING',
        outdatedCount: outdatedCount,
        message: outdatedCount === 0 ? 'All dependencies up to date' : `${outdatedCount} outdated dependencies`,
        outdated: Object.keys(outdated).slice(0, 10) // First 10 outdated packages
      };
      
    } catch (error) {
      this.results.dependencies = {
        status: 'ERROR',
        error: error.message,
        message: 'Could not check dependencies'
      };
    }
  }

  async checkFileStructure() {
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
      hasPackageJson: fs.existsSync('./package.json')
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

  generateRecommendations() {
    const recommendations = [];
    
    // TypeScript recommendations
    if (this.results.typescript.status === 'FAIL') {
      recommendations.push({
        priority: 'HIGH',
        category: 'TypeScript',
        issue: `${this.results.typescript.errors} TypeScript errors`,
        action: 'Fix TypeScript compilation errors before optimization',
        impact: 'Code quality and type safety'
      });
    }
    
    // Build recommendations
    if (this.results.build.status === 'FAIL') {
      recommendations.push({
        priority: 'HIGH',
        category: 'Build',
        issue: 'Build process failing',
        action: 'Fix build errors before optimization',
        impact: 'Deployment and development'
      });
    } else if (this.results.build.buildSize && this.results.build.buildSize > 200) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Performance',
        issue: `Large build size: ${this.results.build.buildSize}kB`,
        action: 'Consider code splitting and optimization',
        impact: 'Loading performance'
      });
    }
    
    // Linting recommendations
    if (this.results.linting.status === 'FAIL') {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Code Quality',
        issue: `${this.results.linting.errors} linting errors`,
        action: 'Fix linting errors for better code quality',
        impact: 'Code maintainability'
      });
    }
    
    // Test recommendations
    if (this.results.tests.status === 'FAIL') {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Testing',
        issue: 'Tests failing',
        action: 'Fix failing tests before optimization',
        impact: 'Code reliability'
      });
    } else if (this.results.tests.coverage && this.results.tests.coverage < 80) {
      recommendations.push({
        priority: 'LOW',
        category: 'Testing',
        issue: `Low test coverage: ${this.results.tests.coverage}%`,
        action: 'Increase test coverage',
        impact: 'Code reliability'
      });
    }
    
    // Dependencies recommendations
    if (this.results.dependencies.outdatedCount > 0) {
      recommendations.push({
        priority: 'LOW',
        category: 'Dependencies',
        issue: `${this.results.dependencies.outdatedCount} outdated dependencies`,
        action: 'Update outdated dependencies',
        impact: 'Security and performance'
      });
    }
    
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
    
    this.results.recommendations = recommendations;
  }

  saveResults() {
    const outputFile = 'health-analysis.json';
    fs.writeFileSync(outputFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Results saved to: ${outputFile}`);
  }

  printSummary() {
    console.log('\n📊 HEALTH CHECK SUMMARY');
    console.log('=======================');
    
    console.log(`\n🔍 TypeScript: ${this.results.typescript.status}`);
    if (this.results.typescript.errors > 0) {
      console.log(`  Errors: ${this.results.typescript.errors}`);
    }
    
    console.log(`\n🔨 Build: ${this.results.build.status}`);
    if (this.results.build.buildSize) {
      console.log(`  Size: ${this.results.build.buildSize}kB`);
    }
    
    console.log(`\n🧹 Linting: ${this.results.linting.status}`);
    if (this.results.linting.errors > 0) {
      console.log(`  Errors: ${this.results.linting.errors}`);
    }
    
    console.log(`\n🧪 Tests: ${this.results.tests.status}`);
    if (this.results.tests.coverage) {
      console.log(`  Coverage: ${this.results.tests.coverage}%`);
    }
    
    console.log(`\n📦 Dependencies: ${this.results.dependencies.status}`);
    if (this.results.dependencies.outdatedCount > 0) {
      console.log(`  Outdated: ${this.results.dependencies.outdatedCount}`);
    }
    
    console.log(`\n📁 Structure: ${this.results.fileStructure.status}`);
    
    console.log(`\n💡 Recommendations: ${this.results.recommendations.length}`);
    this.results.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`     Action: ${rec.action}`);
    });
  }
}

// Run analysis
const analyzer = new HealthAnalyzer();
analyzer.analyze().catch(console.error);
