#!/usr/bin/env node
/**
 * Self-Improving Extraction System
 * 
 * Analyzes successful extractions and improves patterns based on:
 * - Which patterns extract meaningful data
 * - Which sites have good metadata extraction rates
 * - Common structures in successful pages
 * 
 * This creates a feedback loop to continuously improve extraction quality.
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, '..', 'data', 'lite', 'state.json');
const extractionInsightsPath = path.join(__dirname, '..', 'data', 'lite', 'extraction-insights.json');

function analyzeExtractionQuality() {
  console.log('\n🔬 Analyzing Extraction Quality for Self-Improvement\n');
  console.log('='.repeat(70));
  
  if (!fs.existsSync(statePath)) {
    console.log('❌ State file not found');
    return;
  }
  
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const pages = state.pages || [];
  
  if (pages.length === 0) {
    console.log('❌ No pages to analyze');
    return;
  }
  
  console.log(`\n📊 Analyzing ${pages.length} pages...\n`);
  
  const insights = {
    eligibility: {
      successfulPatterns: {},
      sitesWithGoodExtraction: {},
      avgItemsPerPage: 0,
      meaningfulnessRate: 0
    },
    financial: {
      successfulPatterns: {},
      sitesWithGoodExtraction: {},
      avgItemsPerPage: 0,
      meaningfulnessRate: 0
    },
    metadata: {
      sitesWithGoodExtraction: {},
      fundingExtractionRate: 0,
      deadlineExtractionRate: 0,
      contactExtractionRate: 0
    },
    lastUpdated: new Date().toISOString()
  };
  
  // Analyze by host/site
  const byHost = {};
  
  pages.forEach(page => {
    try {
      const host = new URL(page.url).hostname.replace('www.', '');
      if (!byHost[host]) {
        byHost[host] = {
          pages: [],
          eligibility: { total: 0, meaningful: 0 },
          financial: { total: 0, meaningful: 0 },
          metadata: { funding: 0, deadline: 0, contact: 0 }
        };
      }
      
      byHost[host].pages.push(page);
      
      // Eligibility analysis
      const eligibility = (page.categorized_requirements || {}).eligibility || [];
      if (Array.isArray(eligibility) && eligibility.length > 0) {
        byHost[host].eligibility.total += eligibility.length;
        const meaningful = eligibility.filter((item) => {
          const val = (item.value || '').toLowerCase();
          return val.length >= 20 && 
                 !val.includes('specified') && 
                 !val.includes('available') &&
                 !val.includes('see below');
        }).length;
        byHost[host].eligibility.meaningful += meaningful;
        
        // Track which sources work best
        eligibility.forEach((item) => {
          const source = item.source || 'unknown';
          if (!insights.eligibility.successfulPatterns[source]) {
            insights.eligibility.successfulPatterns[source] = { count: 0, meaningful: 0 };
          }
          insights.eligibility.successfulPatterns[source].count++;
          const val = (item.value || '').toLowerCase();
          if (val.length >= 20 && !val.includes('specified')) {
            insights.eligibility.successfulPatterns[source].meaningful++;
          }
        });
      }
      
      // Financial analysis
      const financial = (page.categorized_requirements || {}).financial || [];
      if (Array.isArray(financial) && financial.length > 0) {
        byHost[host].financial.total += financial.length;
        const meaningful = financial.filter((item) => {
          const val = (item.value || '').toLowerCase();
          return val.length >= 20;
        }).length;
        byHost[host].financial.meaningful += meaningful;
      }
      
      // Metadata analysis
      if (page.funding_amount_min || page.funding_amount_max) {
        byHost[host].metadata.funding++;
      }
      if (page.deadline || page.open_deadline) {
        byHost[host].metadata.deadline++;
      }
      if (page.contact_email || page.contact_phone) {
        byHost[host].metadata.contact++;
      }
    } catch (e) {
      // Skip invalid URLs
    }
  });
  
  // Calculate insights
  let totalEligibility = 0;
  let totalEligibilityMeaningful = 0;
  let totalFinancial = 0;
  let totalFinancialMeaningful = 0;
  let totalFundingMetadata = 0;
  let totalDeadlineMetadata = 0;
  let totalContactMetadata = 0;
  
  Object.entries(byHost).forEach(([host, data]) => {
    const pageCount = data.pages.length;
    
    // Eligibility
    if (data.eligibility.total > 0) {
      const rate = data.eligibility.meaningful / data.eligibility.total;
      if (rate >= 0.7) { // 70%+ meaningfulness
        insights.eligibility.sitesWithGoodExtraction[host] = {
          rate: Math.round(rate * 100),
          avgItems: (data.eligibility.total / pageCount).toFixed(2),
          pages: pageCount
        };
      }
      totalEligibility += data.eligibility.total;
      totalEligibilityMeaningful += data.eligibility.meaningful;
    }
    
    // Financial
    if (data.financial.total > 0) {
      const rate = data.financial.meaningful / data.financial.total;
      if (rate >= 0.75) { // 75%+ meaningfulness
        insights.financial.sitesWithGoodExtraction[host] = {
          rate: Math.round(rate * 100),
          avgItems: (data.financial.total / pageCount).toFixed(2),
          pages: pageCount
        };
      }
      totalFinancial += data.financial.total;
      totalFinancialMeaningful += data.financial.meaningful;
    }
    
    // Metadata
    const fundingRate = data.metadata.funding / pageCount;
    const deadlineRate = data.metadata.deadline / pageCount;
    const contactRate = data.metadata.contact / pageCount;
    
    if (fundingRate >= 0.3 || deadlineRate >= 0.3 || contactRate >= 0.3) {
      insights.metadata.sitesWithGoodExtraction[host] = {
        funding: Math.round(fundingRate * 100),
        deadline: Math.round(deadlineRate * 100),
        contact: Math.round(contactRate * 100),
        pages: pageCount
      };
    }
    
    totalFundingMetadata += data.metadata.funding;
    totalDeadlineMetadata += data.metadata.deadline;
    totalContactMetadata += data.metadata.contact;
  });
  
  insights.eligibility.avgItemsPerPage = totalEligibility > 0 ? (totalEligibility / pages.length).toFixed(2) : '0';
  insights.eligibility.meaningfulnessRate = totalEligibility > 0 ? Math.round((totalEligibilityMeaningful / totalEligibility) * 100) : 0;
  
  insights.financial.avgItemsPerPage = totalFinancial > 0 ? (totalFinancial / pages.length).toFixed(2) : '0';
  insights.financial.meaningfulnessRate = totalFinancial > 0 ? Math.round((totalFinancialMeaningful / totalFinancial) * 100) : 0;
  
  insights.metadata.fundingExtractionRate = Math.round((totalFundingMetadata / pages.length) * 100);
  insights.metadata.deadlineExtractionRate = Math.round((totalDeadlineMetadata / pages.length) * 100);
  insights.metadata.contactExtractionRate = Math.round((totalContactMetadata / pages.length) * 100);
  
  // Save insights
  const outputDir = path.dirname(extractionInsightsPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(extractionInsightsPath, JSON.stringify(insights, null, 2));
  
  // Print summary
  console.log('📊 Extraction Insights:\n');
  console.log(`Eligibility:`);
  console.log(`  Meaningfulness: ${insights.eligibility.meaningfulnessRate}%`);
  console.log(`  Avg items/page: ${insights.eligibility.avgItemsPerPage}`);
  console.log(`  Sites with good extraction: ${Object.keys(insights.eligibility.sitesWithGoodExtraction).length}`);
  
  console.log(`\nFinancial:`);
  console.log(`  Meaningfulness: ${insights.financial.meaningfulnessRate}%`);
  console.log(`  Avg items/page: ${insights.financial.avgItemsPerPage}`);
  console.log(`  Sites with good extraction: ${Object.keys(insights.financial.sitesWithGoodExtraction).length}`);
  
  console.log(`\nMetadata:`);
  console.log(`  Funding: ${insights.metadata.fundingExtractionRate}%`);
  console.log(`  Deadline: ${insights.metadata.deadlineExtractionRate}%`);
  console.log(`  Contact: ${insights.metadata.contactExtractionRate}%`);
  console.log(`  Sites with good extraction: ${Object.keys(insights.metadata.sitesWithGoodExtraction).length}`);
  
  console.log(`\n✅ Insights saved to: ${extractionInsightsPath}\n`);
  
  return insights;
}

// Run if called directly
if (require.main === module) {
  analyzeExtractionQuality();
}

module.exports = { analyzeExtractionQuality };

