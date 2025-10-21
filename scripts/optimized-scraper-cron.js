#!/usr/bin/env node
/**
 * Optimized Scraper Cron Job
 * Smart data management to prevent accumulation
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Data retention policies
  retention: {
    latest: 'always',           // Keep latest data forever
    historical: 7,              // Keep historical data for 7 days (not 30!)
    learning: 30,               // Keep learning data for 30 days
    fallback: 'always'          // Keep fallback data forever
  },
  
  // Scraping schedule
  schedule: {
    quick: 'every 6 hours',     // Quick updates every 6 hours
    full: 'daily at 2 AM',      // Full update once daily
    cleanup: 'daily at 3 AM'    // Cleanup after full update
  },
  
  // Data limits
  limits: {
    maxHistoricalFiles: 7,      // Max 7 historical files
    maxLearningSize: '10MB',    // Max 10MB learning data
    maxProgramsPerFile: 1000    // Max 1000 programs per file
  }
};

class OptimizedScraperCron {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.ensureDataDir();
  }

  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Run quick scraping (every 6 hours)
   */
  async runQuickScrape() {
    console.log('🚀 Running quick scrape...');
    
    try {
      const response = await fetch('http://localhost:3000/api/enhanced-scraper-test-quick');
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Quick scrape completed: ${data.totalPrograms} programs`);
        
        // Save with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `scraped-programs-${timestamp}.json`;
        const filepath = path.join(this.dataDir, filename);
        
        // Only save if we have new programs
        if (data.totalPrograms > 0) {
          fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
          console.log(`💾 Saved to ${filename}`);
        }
        
        return data;
      } else {
        console.error('❌ Quick scrape failed:', data.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Quick scrape error:', error.message);
      return null;
    }
  }

  /**
   * Run full scraping (daily)
   */
  async runFullScrape() {
    console.log('🚀 Running full scrape...');
    
    try {
      const response = await fetch('http://localhost:3000/api/enhanced-scraper-test');
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Full scrape completed: ${data.totalPrograms} programs`);
        
        // Save with timestamp
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `scraped-programs-${timestamp}.json`;
        const filepath = path.join(this.dataDir, filename);
        
        // Save full data
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        
        // Update latest
        const latestPath = path.join(this.dataDir, 'scraped-programs-latest.json');
        fs.writeFileSync(latestPath, JSON.stringify(data, null, 2));
        
        console.log(`💾 Saved to ${filename} and updated latest`);
        return data;
      } else {
        console.error('❌ Full scrape failed:', data.error);
        return null;
      }
    } catch (error) {
      console.error('❌ Full scrape error:', error.message);
      return null;
    }
  }

  /**
   * Clean up old data files
   */
  async cleanupOldData() {
    console.log('🧹 Cleaning up old data...');
    
    try {
      const files = fs.readdirSync(this.dataDir);
      const historicalFiles = files
        .filter(file => file.startsWith('scraped-programs-') && file.endsWith('.json'))
        .filter(file => file !== 'scraped-programs-latest.json')
        .sort()
        .reverse(); // Most recent first
      
      // Keep only the most recent N files
      const filesToDelete = historicalFiles.slice(CONFIG.limits.maxHistoricalFiles);
      
      filesToDelete.forEach(file => {
        const filepath = path.join(this.dataDir, file);
        fs.unlinkSync(filepath);
        console.log(`🗑️ Deleted old file: ${file}`);
      });
      
      // Clean up learning data if too large
      await this.cleanupLearningData();
      
      console.log(`✅ Cleanup completed. Kept ${historicalFiles.length - filesToDelete.length} historical files`);
    } catch (error) {
      console.error('❌ Cleanup error:', error.message);
    }
  }

  /**
   * Clean up learning data if too large
   */
  async cleanupLearningData() {
    const learningPath = path.join(this.dataDir, 'scraper-learning.json');
    
    if (fs.existsSync(learningPath)) {
      const stats = fs.statSync(learningPath);
      const sizeInMB = stats.size / (1024 * 1024);
      
      if (sizeInMB > 10) { // 10MB limit
        console.log(`🧹 Learning data is ${sizeInMB.toFixed(2)}MB, cleaning up...`);
        
        try {
          const learningData = JSON.parse(fs.readFileSync(learningPath, 'utf8'));
          
          // Remove old patterns (older than 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          
          if (learningData.patterns) {
            const oldPatterns = Object.keys(learningData.patterns).filter(id => {
              const pattern = learningData.patterns[id];
              return new Date(pattern.last_used) < thirtyDaysAgo;
            });
            
            oldPatterns.forEach(id => delete learningData.patterns[id]);
            console.log(`🗑️ Removed ${oldPatterns.length} old patterns`);
          }
          
          // Remove low-performing patterns
          if (learningData.urlPatterns) {
            const lowPerforming = Object.keys(learningData.urlPatterns).filter(id => {
              const pattern = learningData.urlPatterns[id];
              return pattern.successRate < 0.3; // Less than 30% success rate
            });
            
            lowPerforming.forEach(id => delete learningData.urlPatterns[id]);
            console.log(`🗑️ Removed ${lowPerforming.length} low-performing patterns`);
          }
          
          fs.writeFileSync(learningPath, JSON.stringify(learningData, null, 2));
          console.log(`✅ Learning data cleaned up`);
        } catch (error) {
          console.error('❌ Learning data cleanup error:', error.message);
        }
      }
    }
  }

  /**
   * Get data statistics
   */
  getDataStats() {
    const files = fs.readdirSync(this.dataDir);
    const historicalFiles = files.filter(file => 
      file.startsWith('scraped-programs-') && 
      file.endsWith('.json') && 
      file !== 'scraped-programs-latest.json'
    );
    
    const totalSize = historicalFiles.reduce((total, file) => {
      const filepath = path.join(this.dataDir, file);
      const stats = fs.statSync(filepath);
      return total + stats.size;
    }, 0);
    
    return {
      historicalFiles: historicalFiles.length,
      totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
      files: historicalFiles.sort().reverse()
    };
  }

  /**
   * Main execution
   */
  async run() {
    const args = process.argv.slice(2);
    const command = args[0] || 'quick';
    
    console.log(`🕐 Starting optimized scraper cron: ${command}`);
    console.log(`📊 Current data stats:`, this.getDataStats());
    
    switch (command) {
      case 'quick':
        await this.runQuickScrape();
        break;
        
      case 'full':
        await this.runFullScrape();
        break;
        
      case 'cleanup':
        await this.cleanupOldData();
        break;
        
      case 'stats':
        console.log('📊 Data Statistics:');
        console.log(JSON.stringify(this.getDataStats(), null, 2));
        break;
        
      default:
        console.log('Usage: node optimized-scraper-cron.js [quick|full|cleanup|stats]');
        break;
    }
    
    console.log(`📊 Final data stats:`, this.getDataStats());
  }
}

// Run if called directly
if (require.main === module) {
  const cron = new OptimizedScraperCron();
  cron.run().catch(console.error);
}

module.exports = OptimizedScraperCron;
