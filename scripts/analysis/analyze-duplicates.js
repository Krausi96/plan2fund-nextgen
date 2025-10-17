#!/usr/bin/env node
/**
 * Duplicate Code Detection Script
 * ===============================
 * 
 * Finds duplicate components, utilities, and code patterns
 * Safe to run - only analyzes, doesn't modify anything
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class DuplicateAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      duplicateFiles: [],
      similarComponents: [],
      duplicateUtilities: [],
      repeatedPatterns: [],
      recommendations: []
    };
  }

  async analyze() {
    console.log('🔄 Analyzing duplicates...\n');

    await this.findDuplicateFiles();
    await this.findSimilarComponents();
    await this.findDuplicateUtilities();
    await this.findRepeatedPatterns();
    this.generateRecommendations();
    this.saveResults();
    this.printSummary();
  }

  async findDuplicateFiles() {
    console.log('🔍 Finding duplicate files...');
    
    const fileHashes = new Map();
    const duplicates = [];
    
    const allFiles = this.getAllTsFiles();
    
    for (const file of allFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const hash = crypto.createHash('md5').update(content).digest('hex');
        
        if (fileHashes.has(hash)) {
          duplicates.push({
            hash,
            files: [fileHashes.get(hash), file],
            size: content.length
          });
        } else {
          fileHashes.set(hash, file);
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
    
    this.results.duplicateFiles = duplicates;
  }

  async findSimilarComponents() {
    console.log('🔍 Finding similar components...');
    
    const components = [];
    const componentDir = './src/components';
    
    if (!fs.existsSync(componentDir)) {
      this.results.similarComponents = [];
      return;
    }
    
    const scanDir = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            scanDir(filePath);
          } else if (file.endsWith('.tsx')) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              const componentInfo = this.analyzeComponent(filePath, content);
              components.push(componentInfo);
            } catch (error) {
              // Skip files that can't be read
            }
          }
        });
      } catch (error) {
        // Skip directories that can't be read
      }
    };
    
    scanDir(componentDir);
    
    // Find similar components based on structure
    const similar = this.findSimilarByStructure(components);
    this.results.similarComponents = similar;
  }

  analyzeComponent(filePath, content) {
    const lines = content.split('\n');
    const componentName = path.basename(filePath, '.tsx');
    
    return {
      name: componentName,
      path: filePath,
      lines: lines.length,
      hasProps: content.includes('interface') || content.includes('type'),
      hasState: content.includes('useState') || content.includes('useReducer'),
      hasEffects: content.includes('useEffect'),
      hasContext: content.includes('useContext'),
      exports: content.includes('export default') ? 'default' : 'named',
      hooks: this.extractHooks(content),
      imports: this.extractImports(content),
      structure: this.extractStructure(content)
    };
  }

  extractHooks(content) {
    const hooks = [];
    const hookPatterns = [
      'useState', 'useEffect', 'useContext', 'useReducer', 
      'useMemo', 'useCallback', 'useRef', 'useImperativeHandle'
    ];
    
    hookPatterns.forEach(hook => {
      const matches = content.match(new RegExp(hook, 'g'));
      if (matches) {
        hooks.push({ name: hook, count: matches.length });
      }
    });
    
    return hooks;
  }

  extractImports(content) {
    const imports = [];
    const lines = content.split('\n');
    
    lines.forEach(line => {
      if (line.includes('import ') && line.includes('from ')) {
        const match = line.match(/import.*from\s+['"]([^'"]+)['"]/);
        if (match) {
          imports.push(match[1]);
        }
      }
    });
    
    return imports;
  }

  extractStructure(content) {
    // Extract basic structure patterns
    const structure = {
      hasJSX: content.includes('<') && content.includes('>'),
      hasReturn: content.includes('return'),
      hasConditional: content.includes('if') || content.includes('?'),
      hasLoops: content.includes('map(') || content.includes('forEach'),
      hasAsync: content.includes('async') || content.includes('await')
    };
    
    return structure;
  }

  findSimilarByStructure(components) {
    const similar = [];
    
    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < components.length; j++) {
        const comp1 = components[i];
        const comp2 = components[j];
        
        const similarity = this.calculateSimilarity(comp1, comp2);
        
        if (similarity > 0.7) { // 70% similarity threshold
          similar.push({
            component1: comp1,
            component2: comp2,
            similarity: Math.round(similarity * 100),
            reasons: this.getSimilarityReasons(comp1, comp2)
          });
        }
      }
    }
    
    return similar.sort((a, b) => b.similarity - a.similarity);
  }

  calculateSimilarity(comp1, comp2) {
    let score = 0;
    let total = 0;
    
    // Compare hooks
    const hooks1 = comp1.hooks.map(h => h.name);
    const hooks2 = comp2.hooks.map(h => h.name);
    const commonHooks = hooks1.filter(h => hooks2.includes(h));
    score += (commonHooks.length / Math.max(hooks1.length, hooks2.length)) * 0.3;
    total += 0.3;
    
    // Compare structure
    const structure1 = comp1.structure;
    const structure2 = comp2.structure;
    const structureKeys = Object.keys(structure1);
    const commonStructure = structureKeys.filter(key => structure1[key] === structure2[key]);
    score += (commonStructure.length / structureKeys.length) * 0.3;
    total += 0.3;
    
    // Compare size (similar line counts)
    const sizeDiff = Math.abs(comp1.lines - comp2.lines);
    const avgSize = (comp1.lines + comp2.lines) / 2;
    const sizeSimilarity = Math.max(0, 1 - (sizeDiff / avgSize));
    score += sizeSimilarity * 0.2;
    total += 0.2;
    
    // Compare imports
    const imports1 = comp1.imports;
    const imports2 = comp2.imports;
    const commonImports = imports1.filter(imp => imports2.includes(imp));
    score += (commonImports.length / Math.max(imports1.length, imports2.length)) * 0.2;
    total += 0.2;
    
    return total > 0 ? score / total : 0;
  }

  getSimilarityReasons(comp1, comp2) {
    const reasons = [];
    
    // Check hooks
    const hooks1 = comp1.hooks.map(h => h.name);
    const hooks2 = comp2.hooks.map(h => h.name);
    const commonHooks = hooks1.filter(h => hooks2.includes(h));
    if (commonHooks.length > 0) {
      reasons.push(`Common hooks: ${commonHooks.join(', ')}`);
    }
    
    // Check structure
    const structure1 = comp1.structure;
    const structure2 = comp2.structure;
    const commonStructure = Object.keys(structure1).filter(key => 
      structure1[key] === structure2[key] && structure1[key]
    );
    if (commonStructure.length > 0) {
      reasons.push(`Common patterns: ${commonStructure.join(', ')}`);
    }
    
    // Check size similarity
    const sizeDiff = Math.abs(comp1.lines - comp2.lines);
    if (sizeDiff < 20) {
      reasons.push(`Similar size: ${comp1.lines} vs ${comp2.lines} lines`);
    }
    
    return reasons;
  }

  async findDuplicateUtilities() {
    console.log('🔍 Finding duplicate utilities...');
    
    const utilities = [];
    const libDir = './src/lib';
    
    if (!fs.existsSync(libDir)) {
      this.results.duplicateUtilities = [];
      return;
    }
    
    const scanDir = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory()) {
            scanDir(filePath);
          } else if (file.endsWith('.ts')) {
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              const utilityInfo = this.analyzeUtility(filePath, content);
              utilities.push(utilityInfo);
            } catch (error) {
              // Skip files that can't be read
            }
          }
        });
      } catch (error) {
        // Skip directories that can't be read
      }
    };
    
    scanDir(libDir);
    
    // Find similar utilities
    const similar = this.findSimilarUtilities(utilities);
    this.results.duplicateUtilities = similar;
  }

  analyzeUtility(filePath, content) {
    const lines = content.split('\n');
    const functionMatches = content.match(/function\s+\w+|const\s+\w+\s*=\s*\(/g) || [];
    const exportMatches = content.match(/export\s+(?:const|function|class|interface|type)/g) || [];
    
    return {
      name: path.basename(filePath, '.ts'),
      path: filePath,
      lines: lines.length,
      functions: functionMatches.length,
      exports: exportMatches.length,
      hasTypes: content.includes('interface') || content.includes('type'),
      hasClasses: content.includes('class '),
      hasAsync: content.includes('async') || content.includes('await')
    };
  }

  findSimilarUtilities(utilities) {
    const similar = [];
    
    for (let i = 0; i < utilities.length; i++) {
      for (let j = i + 1; j < utilities.length; j++) {
        const util1 = utilities[i];
        const util2 = utilities[j];
        
        // Simple similarity based on function count and size
        const functionDiff = Math.abs(util1.functions - util2.functions);
        const sizeDiff = Math.abs(util1.lines - util2.lines);
        
        if (functionDiff <= 2 && sizeDiff < 50) {
          similar.push({
            utility1: util1,
            utility2: util2,
            similarity: 'MEDIUM',
            reasons: [
              `Similar function count: ${util1.functions} vs ${util2.functions}`,
              `Similar size: ${util1.lines} vs ${util2.lines} lines`
            ]
          });
        }
      }
    }
    
    return similar;
  }

  async findRepeatedPatterns() {
    console.log('🔍 Finding repeated patterns...');
    
    const patterns = new Map();
    const allFiles = this.getAllTsFiles();
    
    // Common patterns to look for
    const commonPatterns = [
      'useState',
      'useEffect',
      'className=',
      'onClick=',
      'const handle',
      'export default',
      'interface ',
      'type ',
      'const [',
      'setState',
      'useCallback',
      'useMemo'
    ];
    
    commonPatterns.forEach(pattern => {
      let count = 0;
      const files = [];
      
      allFiles.forEach(file => {
        try {
          const content = fs.readFileSync(file, 'utf8');
          const matches = content.match(new RegExp(pattern, 'g'));
          if (matches) {
            count += matches.length;
            files.push({ file, count: matches.length });
          }
        } catch (error) {
          // Skip files that can't be read
        }
      });
      
      if (count > 10) {
        patterns.set(pattern, {
          count,
          files: files.slice(0, 10), // Limit to first 10 files
          suggestion: count > 50 ? 'Consider creating a custom hook or utility' : 'Monitor for potential abstraction'
        });
      }
    });
    
    this.results.repeatedPatterns = Array.from(patterns.entries()).map(([pattern, data]) => ({
      pattern,
      ...data
    }));
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
    
    if (this.results.duplicateFiles.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: `${this.results.duplicateFiles.length} duplicate files found`,
        action: 'Remove duplicate files and consolidate functionality',
        impact: 'Bundle size and maintainability'
      });
    }
    
    if (this.results.similarComponents.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: `${this.results.similarComponents.length} similar components found`,
        action: 'Consider creating shared components or hooks',
        impact: 'Code maintainability and reusability'
      });
    }
    
    if (this.results.duplicateUtilities.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: `${this.results.duplicateUtilities.length} similar utilities found`,
        action: 'Consolidate similar utility functions',
        impact: 'Code maintainability'
      });
    }
    
    if (this.results.repeatedPatterns.length > 0) {
      const highPatterns = this.results.repeatedPatterns.filter(p => p.count > 50);
      if (highPatterns.length > 0) {
        recommendations.push({
          priority: 'LOW',
          issue: `${highPatterns.length} highly repeated patterns found`,
          action: 'Consider creating abstractions for common patterns',
          impact: 'Code maintainability'
        });
      }
    }
    
    this.results.recommendations = recommendations;
  }

  saveResults() {
    const outputFile = 'duplicate-analysis.json';
    fs.writeFileSync(outputFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Results saved to: ${outputFile}`);
  }

  printSummary() {
    console.log('\n📊 DUPLICATE ANALYSIS SUMMARY');
    console.log('=============================');
    console.log(`Duplicate Files: ${this.results.duplicateFiles.length}`);
    console.log(`Similar Components: ${this.results.similarComponents.length}`);
    console.log(`Duplicate Utilities: ${this.results.duplicateUtilities.length}`);
    console.log(`Repeated Patterns: ${this.results.repeatedPatterns.length}`);
    
    console.log('\n💡 Recommendations:');
    this.results.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`     Action: ${rec.action}`);
    });
  }
}

// Run analysis
const analyzer = new DuplicateAnalyzer();
analyzer.analyze().catch(console.error);
