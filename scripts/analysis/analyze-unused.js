#!/usr/bin/env node
/**
 * Unused Code Detection Script
 * ============================
 * 
 * Finds unused exports, imports, and dependencies
 * Safe to run - only analyzes, doesn't delete anything
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class UnusedCodeAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      unusedExports: [],
      unusedDependencies: [],
      deadImports: [],
      recommendations: []
    };
  }

  async analyze() {
    console.log('🗑️  Analyzing unused code...\n');

    await this.findUnusedExports();
    await this.findUnusedDependencies();
    await this.findDeadImports();
    this.generateRecommendations();
    this.saveResults();
    this.printSummary();
  }

  async findUnusedExports() {
    console.log('🔍 Finding unused exports...');
    
    try {
      // Check if ts-unused-exports is available
      try {
        require.resolve('ts-unused-exports');
      } catch (error) {
        console.log('📦 Installing ts-unused-exports...');
        execSync('npm install --save-dev ts-unused-exports', { stdio: 'pipe' });
      }

      const result = execSync('npx ts-unused-exports tsconfig.json --json', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const data = JSON.parse(result);
      this.results.unusedExports = data.unusedExports || [];
      
    } catch (error) {
      console.log('⚠️  ts-unused-exports failed, using fallback method...');
      this.results.unusedExports = await this.findUnusedExportsFallback();
    }
  }

  async findUnusedExportsFallback() {
    // Simple fallback - look for exports that might be unused
    const unusedExports = [];
    const allFiles = this.getAllTsFiles();
    
    for (const file of allFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.includes('export ') && !line.includes('export default')) {
            const exportMatch = line.match(/export\s+(?:const|function|class|interface|type)\s+(\w+)/);
            if (exportMatch) {
              const exportName = exportMatch[1];
              // Simple check - see if this export is imported elsewhere
              const isUsed = this.isExportUsed(exportName, file, allFiles);
              if (!isUsed) {
                unusedExports.push({
                  file,
                  line: index + 1,
                  export: exportName,
                  confidence: 'LOW' // Fallback method has low confidence
                });
              }
            }
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    return unusedExports;
  }

  isExportUsed(exportName, sourceFile, allFiles) {
    for (const file of allFiles) {
      if (file === sourceFile) continue;
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        // Check for import statements
        if (content.includes(`import { ${exportName}`) || 
            content.includes(`import ${exportName}`) ||
            content.includes(`from '${sourceFile.replace('.ts', '').replace('.tsx', '')}'`)) {
          return true;
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
    return false;
  }

  async findUnusedDependencies() {
    console.log('🔍 Finding unused dependencies...');
    
    try {
      // Check if depcheck is available
      try {
        require.resolve('depcheck');
      } catch (error) {
        console.log('📦 Installing depcheck...');
        execSync('npm install --save-dev depcheck', { stdio: 'pipe' });
      }

      const result = execSync('npx depcheck --json', { 
        stdio: 'pipe',
        encoding: 'utf8'
      });
      
      const data = JSON.parse(result);
      this.results.unusedDependencies = data.dependencies || [];
      
    } catch (error) {
      console.log('⚠️  depcheck failed:', error.message);
      this.results.unusedDependencies = [];
    }
  }

  async findDeadImports() {
    console.log('🔍 Finding dead imports...');
    
    const deadImports = [];
    const allFiles = this.getAllTsFiles();
    
    for (const file of allFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.includes('import ') && line.includes('from ')) {
            const importMatch = line.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/);
            if (importMatch) {
              const importPath = importMatch[1];
              const importedNames = this.extractImportedNames(line);
              
              // Check if imported names are actually used
              const restOfFile = content.substring(content.indexOf(line) + line.length);
              const unusedNames = importedNames.filter(name => 
                !restOfFile.includes(name) && name !== 'default'
              );
              
              if (unusedNames.length > 0) {
                deadImports.push({
                  file,
                  line: index + 1,
                  import: line.trim(),
                  unusedNames,
                  confidence: 'MEDIUM'
                });
              }
            }
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    this.results.deadImports = deadImports;
  }

  extractImportedNames(importLine) {
    const names = [];
    
    // Handle different import patterns
    if (importLine.includes('{')) {
      // Named imports: import { a, b, c } from 'module'
      const namedMatch = importLine.match(/\{([^}]+)\}/);
      if (namedMatch) {
        names.push(...namedMatch[1].split(',').map(name => name.trim()));
      }
    } else if (importLine.includes('import ')) {
      // Default import: import something from 'module'
      const defaultMatch = importLine.match(/import\s+(\w+)/);
      if (defaultMatch) {
        names.push(defaultMatch[1]);
      }
    }
    
    return names;
  }

  getAllTsFiles() {
    const files = [];
    
    const scanDir = (dir) => {
      try {
        const items = fs.readdirSync(dir);
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.next')) {
            scanDir(fullPath);
          } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
            files.push(fullPath);
          }
        });
      } catch (error) {
        // Skip directories that can't be read
      }
    };
    
    scanDir('./src');
    scanDir('./pages');
    return files;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.results.unusedExports.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: `${this.results.unusedExports.length} unused exports found`,
        action: 'Review and remove unused exports to reduce bundle size',
        details: this.results.unusedExports.slice(0, 5).map(exp => `${exp.file}:${exp.line} - ${exp.export}`)
      });
    }
    
    if (this.results.unusedDependencies.length > 0) {
      recommendations.push({
        priority: 'LOW',
        issue: `${this.results.unusedDependencies.length} unused dependencies found`,
        action: 'Consider removing unused dependencies',
        details: this.results.unusedDependencies
      });
    }
    
    if (this.results.deadImports.length > 0) {
      recommendations.push({
        priority: 'LOW',
        issue: `${this.results.deadImports.length} potentially dead imports found`,
        action: 'Review and remove unused imports',
        details: this.results.deadImports.slice(0, 5).map(imp => `${imp.file}:${imp.line}`)
      });
    }
    
    this.results.recommendations = recommendations;
  }

  saveResults() {
    const outputFile = 'unused-code-analysis.json';
    fs.writeFileSync(outputFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Results saved to: ${outputFile}`);
  }

  printSummary() {
    console.log('\n📊 UNUSED CODE ANALYSIS SUMMARY');
    console.log('================================');
    console.log(`Unused Exports: ${this.results.unusedExports.length}`);
    console.log(`Unused Dependencies: ${this.results.unusedDependencies.length}`);
    console.log(`Dead Imports: ${this.results.deadImports.length}`);
    
    console.log('\n💡 Recommendations:');
    this.results.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`     Action: ${rec.action}`);
    });
  }
}

// Run analysis
const analyzer = new UnusedCodeAnalyzer();
analyzer.analyze().catch(console.error);
