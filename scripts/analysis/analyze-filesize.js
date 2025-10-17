#!/usr/bin/env node
/**
 * File Size Analysis Script
 * =========================
 * 
 * Analyzes file sizes and identifies large files that need optimization
 * Safe to run - only analyzes, doesn't modify anything
 */

const fs = require('fs');
const path = require('path');

class FileSizeAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      fileStats: {
        total: 0,
        byType: {},
        bySize: { small: 0, medium: 0, large: 0, xlarge: 0 },
        byDirectory: {}
      },
      largeFiles: [],
      recommendations: []
    };
  }

  async analyze() {
    console.log('📏 Analyzing file sizes...\n');

    this.analyzeFileSizes();
    this.findLargeFiles();
    this.analyzeDirectorySizes();
    this.generateRecommendations();
    this.saveResults();
    this.printSummary();
  }

  analyzeFileSizes() {
    console.log('🔍 Analyzing file size distribution...');
    
    const scanDir = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !this.shouldSkipDirectory(file)) {
            scanDir(filePath);
          } else if (stat.isFile()) {
            this.results.fileStats.total++;
            
            const ext = path.extname(file);
            this.results.fileStats.byType[ext] = (this.results.fileStats.byType[ext] || 0) + 1;
            
            const size = stat.size;
            const sizeKB = Math.round(size / 1024);
            
            // Categorize by size
            if (size < 1000) {
              this.results.fileStats.bySize.small++;
            } else if (size < 10000) {
              this.results.fileStats.bySize.medium++;
            } else if (size < 50000) {
              this.results.fileStats.bySize.large++;
            } else {
              this.results.fileStats.bySize.xlarge++;
            }
            
            // Track by directory
            const dir = path.dirname(filePath);
            this.results.fileStats.byDirectory[dir] = (this.results.fileStats.byDirectory[dir] || 0) + 1;
          }
        });
      } catch (error) {
        // Skip directories that can't be read
      }
    };
    
    scanDir('./src');
    scanDir('./pages');
  }

  shouldSkipDirectory(dirName) {
    const skipDirs = ['node_modules', '.next', '.git', 'dist', 'build'];
    return skipDirs.some(skip => dirName.includes(skip));
  }

  findLargeFiles() {
    console.log('🔍 Finding large files...');
    
    const largeFiles = [];
    const thresholds = {
      warning: 10000,  // 10KB
      critical: 50000  // 50KB
    };
    
    const scanDir = (dir) => {
      try {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          
          if (stat.isDirectory() && !this.shouldSkipDirectory(file)) {
            scanDir(filePath);
          } else if (stat.isFile()) {
            const size = stat.size;
            const sizeKB = Math.round(size / 1024);
            
            if (size > thresholds.warning) {
              const priority = size > thresholds.critical ? 'CRITICAL' : 'WARNING';
              
              largeFiles.push({
                path: filePath,
                size: size,
                sizeKB: sizeKB,
                priority: priority,
                type: path.extname(file),
                directory: path.dirname(filePath),
                lines: this.countLines(filePath),
                lastModified: stat.mtime
              });
            }
          }
        });
      } catch (error) {
        // Skip directories that can't be read
      }
    };
    
    scanDir('./src');
    scanDir('./pages');
    
    this.results.largeFiles = largeFiles.sort((a, b) => b.size - a.size);
  }

  countLines(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return content.split('\n').length;
    } catch (error) {
      return 0;
    }
  }

  analyzeDirectorySizes() {
    console.log('🔍 Analyzing directory sizes...');
    
    const directorySizes = {};
    
    this.results.largeFiles.forEach(file => {
      const dir = file.directory;
      if (!directorySizes[dir]) {
        directorySizes[dir] = {
          totalSize: 0,
          fileCount: 0,
          largeFiles: 0
        };
      }
      
      directorySizes[dir].totalSize += file.size;
      directorySizes[dir].fileCount++;
      if (file.priority === 'CRITICAL' || file.priority === 'WARNING') {
        directorySizes[dir].largeFiles++;
      }
    });
    
    // Convert to array and sort by total size
    this.results.directorySizes = Object.entries(directorySizes)
      .map(([dir, stats]) => ({
        directory: dir,
        totalSizeKB: Math.round(stats.totalSize / 1024),
        fileCount: stats.fileCount,
        largeFiles: stats.largeFiles,
        avgSizeKB: Math.round(stats.totalSize / stats.fileCount / 1024)
      }))
      .sort((a, b) => b.totalSizeKB - a.totalSizeKB);
  }

  generateRecommendations() {
    const recommendations = [];
    
    // Large files recommendations
    const criticalFiles = this.results.largeFiles.filter(f => f.priority === 'CRITICAL');
    const warningFiles = this.results.largeFiles.filter(f => f.priority === 'WARNING');
    
    if (criticalFiles.length > 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: `${criticalFiles.length} critical large files (>50KB)`,
        action: 'Optimize or split these files immediately',
        impact: 'Bundle size and performance',
        files: criticalFiles.slice(0, 5).map(f => `${f.path} (${f.sizeKB}KB)`)
      });
    }
    
    if (warningFiles.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: `${warningFiles.length} large files (>10KB)`,
        action: 'Consider optimizing these files',
        impact: 'Bundle size',
        files: warningFiles.slice(0, 5).map(f => `${f.path} (${f.sizeKB}KB)`)
      });
    }
    
    // File type recommendations
    const tsxFiles = this.results.largeFiles.filter(f => f.type === '.tsx');
    const tsFiles = this.results.largeFiles.filter(f => f.type === '.ts');
    
    if (tsxFiles.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        issue: `${tsxFiles.length} large React components`,
        action: 'Consider splitting components or using code splitting',
        impact: 'Bundle size and loading performance'
      });
    }
    
    if (tsFiles.length > 0) {
      recommendations.push({
        priority: 'LOW',
        issue: `${tsFiles.length} large TypeScript files`,
        action: 'Consider splitting utility files or using tree shaking',
        impact: 'Bundle size'
      });
    }
    
    // Directory recommendations
    const largeDirs = this.results.directorySizes.filter(d => d.totalSizeKB > 100);
    if (largeDirs.length > 0) {
      recommendations.push({
        priority: 'LOW',
        issue: `${largeDirs.length} directories with high total size`,
        action: 'Review directory structure and file organization',
        impact: 'Code organization and maintainability',
        directories: largeDirs.slice(0, 3).map(d => `${d.directory} (${d.totalSizeKB}KB)`)
      });
    }
    
    this.results.recommendations = recommendations;
  }

  saveResults() {
    const outputFile = 'filesize-analysis.json';
    fs.writeFileSync(outputFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Results saved to: ${outputFile}`);
  }

  printSummary() {
    console.log('\n📊 FILE SIZE ANALYSIS SUMMARY');
    console.log('==============================');
    
    console.log(`\n📁 File Statistics:`);
    console.log(`  Total Files: ${this.results.fileStats.total}`);
    console.log(`  Small (<1KB): ${this.results.fileStats.bySize.small}`);
    console.log(`  Medium (1-10KB): ${this.results.fileStats.bySize.medium}`);
    console.log(`  Large (10-50KB): ${this.results.fileStats.bySize.large}`);
    console.log(`  XLarge (>50KB): ${this.results.fileStats.bySize.xlarge}`);
    
    console.log(`\n📏 Large Files:`);
    const critical = this.results.largeFiles.filter(f => f.priority === 'CRITICAL');
    const warning = this.results.largeFiles.filter(f => f.priority === 'WARNING');
    console.log(`  Critical (>50KB): ${critical.length}`);
    console.log(`  Warning (>10KB): ${warning.length}`);
    
    if (this.results.largeFiles.length > 0) {
      console.log(`\n🔍 Top 5 Largest Files:`);
      this.results.largeFiles.slice(0, 5).forEach((file, index) => {
        console.log(`  ${index + 1}. ${file.path} - ${file.sizeKB}KB (${file.priority})`);
      });
    }
    
    console.log(`\n💡 Recommendations: ${this.results.recommendations.length}`);
    this.results.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. [${rec.priority}] ${rec.issue}`);
      console.log(`     Action: ${rec.action}`);
    });
  }
}

// Run analysis
const analyzer = new FileSizeAnalyzer();
analyzer.analyze().catch(console.error);
