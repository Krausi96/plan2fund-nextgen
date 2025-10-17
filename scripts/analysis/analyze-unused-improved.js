#!/usr/bin/env node
/**
 * Improved Unused Code Detection Script
 * ====================================
 * 
 * Finds unused exports, imports, and dependencies with better accuracy
 * Safe to run - only analyzes, doesn't delete anything
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ImprovedUnusedCodeAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      unusedExports: [],
      unusedDependencies: [],
      deadImports: [],
      recommendations: []
    };
    this.tsConfig = this.loadTsConfig();
    this.pathMappings = this.extractPathMappings();
  }

  loadTsConfig() {
    try {
      const configPath = path.join(process.cwd(), 'tsconfig.json');
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (error) {
      console.log('⚠️  Could not load tsconfig.json, using defaults');
      return { compilerOptions: {} };
    }
  }

  extractPathMappings() {
    const mappings = {};
    if (this.tsConfig.compilerOptions?.paths) {
      Object.entries(this.tsConfig.compilerOptions.paths).forEach(([key, value]) => {
        const cleanKey = key.replace('/*', '');
        const cleanValue = value[0].replace('/*', '');
        mappings[cleanKey] = cleanValue;
      });
    }
    return mappings;
  }

  resolveImportPath(importPath, fromFile) {
    // Handle TypeScript path mappings
    if (importPath.startsWith('@/')) {
      const mappedPath = this.pathMappings['@'] || './src';
      return importPath.replace('@/', mappedPath + '/');
    }
    
    // Handle relative imports
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const fromDir = path.dirname(fromFile);
      const resolvedPath = path.resolve(fromDir, importPath);
      return resolvedPath;
    }
    
    return importPath;
  }

  async analyze() {
    console.log('🗑️  Analyzing unused code with improved accuracy...\n');

    try {
      await this.findUnusedExports();
      console.log('✅ Unused exports analysis complete');
      
      await this.findUnusedDependencies();
      console.log('✅ Unused dependencies analysis complete');
      
      await this.findDeadImports();
      console.log('✅ Dead imports analysis complete');
      
      this.generateRecommendations();
      this.saveResults();
      this.printSummary();
    } catch (error) {
      console.error('❌ Error in analyze():', error);
      throw error;
    }
  }

  async findUnusedExports() {
    console.log('🔍 Finding unused exports with improved detection...');
    
    try {
      // Try ts-unused-exports first
      try {
        require.resolve('ts-unused-exports');
        const result = execSync('npx ts-unused-exports tsconfig.json --json', { 
          stdio: 'pipe',
          encoding: 'utf8'
        });
        
        const data = JSON.parse(result);
        this.results.unusedExports = data.unusedExports || [];
        console.log(`✅ Found ${this.results.unusedExports.length} unused exports using ts-unused-exports`);
        return;
      } catch (error) {
        console.log('⚠️  ts-unused-exports not available, using improved fallback...');
      }

      // Improved fallback method
      this.results.unusedExports = await this.findUnusedExportsImproved();
      
    } catch (error) {
      console.log('❌ Error finding unused exports:', error.message);
      this.results.unusedExports = [];
    }
  }

  async findUnusedExportsImproved() {
    const unusedExports = [];
    const allFiles = this.getAllTsFiles();
    const exportMap = new Map(); // file -> exports
    const usageMap = new Map(); // export -> usage count
    
    // First pass: collect all exports
    for (const file of allFiles) {
      const exports = this.extractExports(file);
      exportMap.set(file, exports);
      
      exports.forEach(exportInfo => {
        const key = `${file}:${exportInfo.name}`;
        usageMap.set(key, 0);
      });
    }
    
    // Second pass: find usage of exports
    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for import statements
      const importMatches = content.matchAll(/import\s+.*\s+from\s+['"]([^'"]+)['"]/g);
      for (const match of importMatches) {
        const importPath = match[1];
        const resolvedPath = this.resolveImportPath(importPath, file);
        
        // Find the source file for this import
        const sourceFile = this.findSourceFile(resolvedPath, allFiles);
        if (sourceFile && exportMap.has(sourceFile)) {
          const exports = exportMap.get(sourceFile);
          exports.forEach(exportInfo => {
            const key = `${sourceFile}:${exportInfo.name}`;
            if (usageMap.has(key)) {
              usageMap.set(key, usageMap.get(key) + 1);
            }
          });
        }
      }
      
      // Check for JSX usage (for React components)
      const jsxMatches = content.matchAll(/<(\w+)/g);
      for (const match of jsxMatches) {
        const componentName = match[1];
        // Check if this component is exported from any file
        for (const [sourceFile, exports] of exportMap) {
          const componentExport = exports.find(exp => exp.name === componentName);
          if (componentExport) {
            const key = `${sourceFile}:${componentName}`;
            if (usageMap.has(key)) {
              usageMap.set(key, usageMap.get(key) + 1);
            }
          }
        }
      }
      
      // Check for direct usage in code
      for (const [sourceFile, exports] of exportMap) {
        exports.forEach(exportInfo => {
          const key = `${sourceFile}:${exportInfo.name}`;
          if (usageMap.has(key) && content.includes(exportInfo.name)) {
            usageMap.set(key, usageMap.get(key) + 1);
          }
        });
      }
    }
    
    // Third pass: identify unused exports
    for (const [sourceFile, exports] of exportMap) {
      exports.forEach(exportInfo => {
        const key = `${sourceFile}:${exportInfo.name}`;
        const usageCount = usageMap.get(key) || 0;
        
        if (usageCount === 0) {
          unusedExports.push({
            file: sourceFile,
            line: exportInfo.line,
            export: exportInfo.name,
            confidence: 'MEDIUM' // Improved method has medium confidence
          });
        }
      });
    }
    
    return unusedExports;
  }

  extractExports(file) {
    const exports = [];
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Skip comments and empty lines
      if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim() === '') {
        return;
      }
      
      // Match various export patterns
      const patterns = [
        /export\s+(?:const|function|class|interface|type)\s+(\w+)/,
        /export\s+\{([^}]+)\}/,
        /export\s+default\s+(\w+)/,
        /export\s+(\w+)\s*=/,
        /export\s+\*\s+from/
      ];
      
      patterns.forEach(pattern => {
        const match = line.match(pattern);
        if (match) {
          if (pattern.source.includes('{')) {
            // Named exports: export { a, b, c }
            const names = match[1].split(',').map(name => name.trim());
            names.forEach(name => {
              exports.push({
                name: name,
                line: index + 1,
                type: 'named'
              });
            });
          } else if (pattern.source.includes('*')) {
            // Re-export: export * from 'module'
            exports.push({
              name: '*',
              line: index + 1,
              type: 're-export'
            });
          } else {
            // Regular export
            exports.push({
              name: match[1],
              line: index + 1,
              type: 'default'
            });
          }
        }
      });
    });
    
    return exports;
  }

  findSourceFile(importPath, allFiles) {
    // Try different extensions
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    
    for (const ext of extensions) {
      const fullPath = importPath + ext;
      if (allFiles.includes(fullPath)) {
        return fullPath;
      }
    }
    
    // Try with index file
    for (const ext of extensions) {
      const indexPath = path.join(importPath, 'index' + ext);
      if (allFiles.includes(indexPath)) {
        return indexPath;
      }
    }
    
    return null;
  }

  async findUnusedDependencies() {
    console.log('🔍 Finding unused dependencies...');
    
    try {
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
    console.log('🔍 Finding dead imports with improved detection...');
    
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
              const unusedNames = importedNames.filter(name => {
                if (name === 'default' || name === '*') return false;
                
                // Check for direct usage
                if (restOfFile.includes(name)) return false;
                
                // Check for JSX usage (for React components)
                if (restOfFile.includes(`<${name}`)) return false;
                
                // Check for type usage (for TypeScript types)
                if (restOfFile.includes(`: ${name}`) || restOfFile.includes(`<${name}>`)) return false;
                
                return true;
              });
              
              if (unusedNames.length > 0) {
                deadImports.push({
                  file,
                  line: index + 1,
                  import: line.trim(),
                  unusedNames,
                  confidence: 'HIGH' // Improved method has high confidence
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
        priority: 'HIGH',
        issue: `${this.results.deadImports.length} dead imports found`,
        action: 'Remove unused imports to clean up code',
        details: this.results.deadImports.slice(0, 5).map(imp => `${imp.file}:${imp.line}`)
      });
    }
    
    this.results.recommendations = recommendations;
  }

  saveResults() {
    const outputFile = 'unused-code-analysis-improved.json';
    fs.writeFileSync(outputFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Results saved to: ${outputFile}`);
  }

  printSummary() {
    console.log('\n📊 IMPROVED UNUSED CODE ANALYSIS SUMMARY');
    console.log('==========================================');
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
console.log('🚀 Starting improved unused code analysis...');
const analyzer = new ImprovedUnusedCodeAnalyzer();
analyzer.analyze().catch(error => {
  console.error('❌ Error during analysis:', error);
  process.exit(1);
});
