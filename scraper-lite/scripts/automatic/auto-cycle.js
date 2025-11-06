#!/usr/bin/env node
/**
 * Fully Automated Self-Running Scraper Cycle
 * 
 * Runs: Discovery → Scraping → Pattern Learning → Analysis → Self-Improvement
 * 
 * Features:
 * - Automatic retry of failed jobs
 * - Pattern learning after each scrape
 * - Extraction improvement based on feedback
 * - Continuous cycle until no new URLs found
 * - Quality monitoring and reporting
 */

// MEMORY: Increase Node.js heap size to prevent out-of-memory errors
// Default is ~2GB, increase to 4GB for large page processing
if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
  const v8 = require('v8');
  v8.setFlagsFromString('--max-old-space-size=4096');
}

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

// Load environment variables from .env.local
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { discover, scrape, loadState, saveState } = require('../../src/scraper.ts');
const { getAllSeedUrls, institutions } = require('../../src/config.ts');
const fs = require('fs');

const MAX_CYCLES = process.env.MAX_CYCLES ? parseInt(process.env.MAX_CYCLES) : 10;
const MIN_NEW_URLS = process.env.MIN_NEW_URLS ? parseInt(process.env.MIN_NEW_URLS) : 5;
// PERFORMANCE: Smaller default batch size to avoid timeouts and improve reliability
const SCRAPE_BATCH_SIZE = process.env.SCRAPE_BATCH_SIZE ? parseInt(process.env.SCRAPE_BATCH_SIZE) : 20;

async function runPatternLearning() {
  console.log('\n🧠 Learning patterns from scraped pages...');
  try {
    require('./learn-patterns-from-scraped.js');
    console.log('✅ Pattern learning complete');
  } catch (e) {
    console.log(`⚠️  Pattern learning error: ${e.message}`);
  }
}

async function retryFailedJobs(maxRetries = 3) {
  const state = loadState();
  const failed = state.jobs.filter(j => j.status === 'failed' && (j.attempts || 0) < maxRetries);
  
  if (failed.length === 0) return 0;
  
  console.log(`\n🔄 Retrying ${failed.length} failed jobs...`);
  failed.forEach(job => {
    job.status = 'queued';
    job.attempts = (job.attempts || 0) + 1;
  });
  saveState(state);
  
  // Scrape retries
  await scrape(failed.length, []);
  return failed.length;
}

async function autoRescrapeLowQualityPages() {
  // Check database for pages with missing critical categories
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });
  require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });
  
  const { getPool } = require(path.join(__dirname, '../../src/db/neon-client.ts'));
  const pool = getPool();
  
  try {
    // Find pages missing critical categories (eligibility, financial, documents, timeline, project)
    const result = await pool.query(`
      WITH page_categories AS (
        SELECT 
          p.id,
          p.url,
          COUNT(DISTINCT CASE WHEN r.category = 'eligibility' THEN 1 END) as has_eligibility,
          COUNT(DISTINCT CASE WHEN r.category = 'financial' THEN 1 END) as has_financial,
          COUNT(DISTINCT CASE WHEN r.category = 'documents' THEN 1 END) as has_documents,
          COUNT(DISTINCT CASE WHEN r.category = 'timeline' THEN 1 END) as has_timeline,
          COUNT(DISTINCT CASE WHEN r.category = 'project' THEN 1 END) as has_project
        FROM pages p
        LEFT JOIN requirements r ON p.id = r.page_id
        GROUP BY p.id, p.url
      )
      SELECT url
      FROM page_categories
      WHERE (has_eligibility = 0 OR has_financial = 0 OR has_documents = 0 OR has_timeline = 0 OR has_project = 0)
      LIMIT 50
    `);
    
    if (result.rows.length > 0) {
      console.log(`  🔍 Found ${result.rows.length} pages with missing critical categories`);
      
      // Add to queue for rescraping
      const state = loadState();
      const urlsToRescrape = result.rows.map(r => r.url);
      let addedCount = 0;
      
      urlsToRescrape.forEach(url => {
        // Only add if not already in queue or done
        const exists = state.jobs.find(j => j.url === url && (j.status === 'queued' || j.status === 'running' || j.status === 'done'));
        const inPages = state.pages.find(p => p.url === url);
        
        if (!exists && !inPages) {
          state.jobs.push({
            url: url,
            status: 'queued',
            depth: 0,
            seed: url,
            attempts: 0
          });
          addedCount++;
        }
      });
      
      if (addedCount > 0) {
        saveState(state);
        console.log(`  ✅ Added ${addedCount} low-quality pages to queue for rescraping`);
      } else {
        console.log(`  ℹ️  All low-quality pages already in queue or processed`);
      }
    } else {
      console.log(`  ✅ All pages have critical categories - no rescraping needed`);
    }
    
    // CRITICAL FIX: Don't close singleton pool - it's shared across the application
  } catch (e) {
    console.log(`  ⚠️  Could not check for low-quality pages: ${e.message}`);
  }
}

async function autoCycle() {
  console.log('\n' + '='.repeat(70));
  console.log('🤖 FULLY AUTOMATED SCRAPER CYCLE');
  console.log('='.repeat(70));
  
  let cyclesRun = 0;
  let totalPagesScraped = 0;
  let totalUrlsDiscovered = 0;
  
  // Load initial state
  let state = loadState();
  const initialPageCount = state.pages.length;
  const initialSeenCount = Object.keys(state.seen || {}).length;
  
  // Auto-load seeds if not provided
  let seeds = (process.env.LITE_SEEDS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (seeds.length === 0) {
    console.log('\n📋 Auto-loading seed URLs from institution config...');
    
    // CRITICAL: Use ALL institutions by default (not just first 3)
    // This provides better diversity and less AWS-heavy scraping
    if (process.env.LITE_LIMIT_INSTITUTIONS) {
      const limit = parseInt(process.env.LITE_LIMIT_INSTITUTIONS) || 3;
      const limitedSeeds = institutions.slice(0, limit).flatMap(inst => inst.seedUrls);
      console.log(`⚠️  Limiting to first ${limit} institutions (${limitedSeeds.length} seeds).`);
      console.log(`   💡 Remove LITE_LIMIT_INSTITUTIONS to use ALL ${institutions.length} institutions`);
      seeds = limitedSeeds;
    } else {
      // DEFAULT: Use ALL institutions
      seeds = getAllSeedUrls();
      console.log(`✅ Using ALL ${institutions.length} institutions (${seeds.length} seed URLs)`);
      console.log(`   💡 Set LITE_LIMIT_INSTITUTIONS=3 to use only first 3 (old behavior)`);
    }
  }
  
  while (cyclesRun < MAX_CYCLES) {
    cyclesRun++;
    console.log(`\n${'='.repeat(70)}`);
    console.log(`🔄 CYCLE ${cyclesRun}/${MAX_CYCLES}`);
    console.log('='.repeat(70));
    
    // STEP 1: Discovery
    console.log('\n📡 STEP 1: URL DISCOVERY');
    const stateBeforeDiscovery = loadState();
    const urlsBeforeDiscovery = Object.keys(stateBeforeDiscovery.seen || {}).length;
    const jobsBeforeDiscovery = stateBeforeDiscovery.jobs.filter(j => j.status === 'queued').length;
    
    // CRITICAL: Reduce discovery pages for faster cycles (was 200, now 20)
    // Only discover new URLs, not re-process existing ones
    const maxDiscoveryPages = process.env.LITE_MAX_DISCOVERY_PAGES ? parseInt(process.env.LITE_MAX_DISCOVERY_PAGES) : 20;
    // CRITICAL: Reduce depth to 1 (was 3) - only go 1 level deep to prevent long discovery
    const discoveryDepth = 1;
    await discover(seeds, discoveryDepth, maxDiscoveryPages);
    
    const stateAfterDiscovery = loadState();
    const urlsAfterDiscovery = Object.keys(stateAfterDiscovery.seen || {}).length;
    const jobsAfterDiscovery = stateAfterDiscovery.jobs.filter(j => j.status === 'queued').length;
    
    const newUrls = urlsAfterDiscovery - urlsBeforeDiscovery;
    const newJobs = jobsAfterDiscovery - jobsBeforeDiscovery;
    
    console.log(`  ✅ Discovered ${newUrls} new URLs`);
    console.log(`  ✅ Queued ${newJobs} new jobs`);
    totalUrlsDiscovered += newUrls;
    
    if (newJobs < MIN_NEW_URLS && cyclesRun > 1) {
      console.log(`\n⚠️  Only ${newJobs} new jobs found (minimum: ${MIN_NEW_URLS}). Cycle may be complete.`);
    }
    
    // STEP 2: Scraping (in batches)
    console.log('\n📥 STEP 2: SCRAPING');
    const stateBeforeScraping = loadState();
    const queuedJobsBefore = stateBeforeScraping.jobs.filter(j => j.status === 'queued');
    console.log(`  📊 Found ${queuedJobsBefore.length} queued jobs before scraping`);
    
    if (queuedJobsBefore.length === 0) {
      console.log(`  ℹ️  No jobs to scrape - all already processed`);
    } else {
      let batchNum = 1;
      let hasMoreJobs = true;
      
      while (hasMoreJobs) {
        const state = loadState();
        const queuedJobs = state.jobs.filter(j => j.status === 'queued');
        
        if (queuedJobs.length === 0) {
          console.log(`  ✅ No more queued jobs`);
          hasMoreJobs = false;
          break;
        }
        
        const batchSize = Math.min(SCRAPE_BATCH_SIZE, queuedJobs.length);
        console.log(`\n  📦 Batch ${batchNum}: Scraping ${batchSize} jobs (${queuedJobs.length} total queued)...`);
        
        // PERFORMANCE: Track pages before/after using database count if available
        const pagesBefore = process.env.DATABASE_URL ? 
          (await (async () => {
            try {
              const { getPool } = require('../../src/db/neon-client.ts');
              const pool = getPool();
              const result = await pool.query('SELECT COUNT(*) as count FROM pages');
              return parseInt(result.rows[0]?.count || '0');
            } catch {
              return state.pages.length;
            }
          })()) : 
          state.pages.length;
        
        const startTime = Date.now();
        
        try {
          // CRITICAL FIX: Wrap scrape() in timeout to prevent infinite hanging
          // Smaller timeout for smaller batches
          const BATCH_TIMEOUT_MS = Math.min(10 * 60 * 1000, batchSize * 30 * 1000); // Max 30s per job, or 10min total
          // FIX: Pass batchSize to scrape() to ensure it only processes that many jobs
          const scrapePromise = scrape(batchSize, []);
          const batchTimeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error(`Batch ${batchNum} timeout after ${BATCH_TIMEOUT_MS / 1000}s`)), BATCH_TIMEOUT_MS)
          );
          
          await Promise.race([scrapePromise, batchTimeoutPromise]);
          
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          
          // PERFORMANCE: Get pages after using database count if available
          const pagesAfter = process.env.DATABASE_URL ?
            (await (async () => {
              try {
                const { getPool } = require('../../src/db/neon-client.ts');
                const pool = getPool();
                const result = await pool.query('SELECT COUNT(*) as count FROM pages');
                return parseInt(result.rows[0]?.count || '0');
              } catch {
                const stateAfter = loadState();
                return stateAfter.pages.length;
              }
            })()) :
            (() => {
              const stateAfter = loadState();
              return stateAfter.pages.length;
            })();
          
          const pagesInBatch = pagesAfter - pagesBefore;
          
          totalPagesScraped += pagesInBatch;
          console.log(`  ✅ Batch ${batchNum} complete: Scraped ${pagesInBatch} pages in ${elapsed}s (${pagesAfter} total)`);
          
          // Small delay between batches to avoid overwhelming the system
          if (batchNum < 5 && queuedJobs.length > batchSize) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (scrapeError) {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
          if (scrapeError.message && scrapeError.message.includes('timeout')) {
            console.error(`  ⏱️  Batch ${batchNum} timeout after ${elapsed}s - skipping remaining batches`);
            break; // Stop processing more batches if timeout
          } else {
            console.error(`  ❌ Batch ${batchNum} error (${elapsed}s): ${scrapeError.message || String(scrapeError)}`);
            if (scrapeError.stack) {
              console.error(`  Stack: ${scrapeError.stack}`);
            }
            // Continue to next batch for non-timeout errors, but reduce batch size
            if (batchSize > 10) {
              console.log(`  ⚠️  Reducing batch size for next attempt...`);
            }
          }
        }
        
        batchNum++;
        
        // Limit batches per cycle to prevent infinite loops
        // FIX: Increased from 10 to 20 to process more jobs per cycle (with 15k+ queued jobs)
        const MAX_BATCHES_PER_CYCLE = 20;
        if (batchNum > MAX_BATCHES_PER_CYCLE) {
          const remainingJobs = state.jobs.filter(j => j.status === 'queued').length;
          console.log(`  ⚠️  Max batches per cycle reached (${MAX_BATCHES_PER_CYCLE}), continuing to next cycle...`);
          console.log(`  ℹ️  ${remainingJobs} jobs still queued - will be processed in next cycle`);
          break;
        }
      }
    }
    
    // STEP 3: Pattern Learning (after scraping) - ALWAYS RUN to learn from every scrape
    console.log('\n🧠 STEP 3: PATTERN LEARNING');
    await runPatternLearning();
    
    // STEP 3c: Learn Institution-Specific Patterns (URL patterns and exclusion keywords)
    console.log('\n🏛️  STEP 3c: INSTITUTION PATTERN LEARNING');
    try {
      const { learnInstitutionPatterns } = require('./learn-institution-patterns.js');
      await learnInstitutionPatterns();
      console.log('✅ Institution pattern learning complete');
    } catch (e) {
      console.log(`⚠️  Institution pattern learning error: ${e.message}`);
    }
    
    // STEP 4: COMPLETE ANALYSIS (Completeness, Quality, Funding Patterns)
    console.log('\n📊 STEP 4: COMPLETE ANALYSIS');
    try {
      const { analyzeCompletenessAndQuality, analyzeFundingTypePatterns } = require('./analyze-completeness-quality.js');
      await analyzeCompletenessAndQuality();
      await analyzeFundingTypePatterns();
      console.log('✅ Analysis complete');
    } catch (e) {
      console.log(`⚠️  Analysis error: ${e.message}`);
    }
    
    // STEP 3a: Auto-blacklist bad URLs (mark as processed so they won't be rediscovered)
    console.log('\n🚫 STEP 3a: AUTO-BLACKLISTING BAD URLS');
    try {
      const { autoBlacklistBadUrls } = require('./auto-blacklist-bad-urls.js');
      await autoBlacklistBadUrls();
      console.log('✅ Auto-blacklisting complete');
    } catch (e) {
      console.log(`⚠️  Auto-blacklisting error: ${e.message}`);
    }
    
    // STEP 3b: AUTONOMOUS Quality Improvement (re-scrape poor pages) - ALWAYS RUN
    console.log('\n🔄 STEP 3b: AUTONOMOUS QUALITY IMPROVEMENT');
    try {
      const { getPool } = require('../../src/db/neon-client.ts');
      const { calculatePageQuality } = require('../../src/scraper.ts');
      const { extractMeta } = require('../../src/extract.ts');
      const { normalizeMetadata } = require('../../src/extract.ts');
      const { fetchHtml } = require('../../src/utils.ts');
      const { savePageWithRequirements } = require('../../src/db/page-repository.ts');
      
      const pool = getPool();
      
      // Find pages with < 3 critical categories (need improvement)
      const result = await pool.query(`
        SELECT p.id, p.url, p.title,
          (SELECT COUNT(DISTINCT r.category) FROM requirements r 
           WHERE r.page_id = p.id 
           AND r.category IN ('geographic', 'eligibility', 'financial', 'use_of_funds', 'team', 'impact', 'timeline')) as critical_categories,
          p.funding_amount_min, p.funding_amount_max
        FROM pages p
        WHERE (SELECT COUNT(DISTINCT r.category) FROM requirements r 
               WHERE r.page_id = p.id 
               AND r.category IN ('geographic', 'eligibility', 'financial', 'use_of_funds', 'team', 'impact', 'timeline')) < 3
        ORDER BY 
          (SELECT COUNT(DISTINCT r.category) FROM requirements r 
           WHERE r.page_id = p.id 
           AND r.category IN ('geographic', 'eligibility', 'financial', 'use_of_funds', 'team', 'impact', 'timeline')) ASC
        LIMIT 50
      `);
      
      if (result.rows.length > 0) {
        console.log(`  📥 Auto-improving ${result.rows.length} low-quality pages...`);
        let improved = 0;
        
        for (const page of result.rows) {
          try {
            const fetchResult = await fetchHtml(page.url);
            const meta = extractMeta(fetchResult.html, page.url);
            const normalized = normalizeMetadata(meta);
            
            const criticalAfter = ['geographic', 'eligibility', 'financial', 'use_of_funds', 'team', 'impact', 'timeline'].filter(
              cat => (normalized.categorized_requirements?.[cat] || []).length > 0
            ).length;
            
            const qualityData = {
              reqCount: Object.values(normalized.categorized_requirements || {}).flat().length,
              criticalCategories: criticalAfter,
              hasAmount: !!(normalized.funding_amount_min || normalized.funding_amount_max),
              hasDeadline: !!(normalized.deadline || normalized.open_deadline),
              hasContact: !!(normalized.contact_email || normalized.contact_phone),
              totalCategories: Object.keys(normalized.categorized_requirements || {}).length,
              poorQualityAttempts: 0
            };
            
            const quality = calculatePageQuality(qualityData);
            
            if (quality.shouldSave && criticalAfter > parseInt(page.critical_categories || 0)) {
              normalized.url = page.url;
              await savePageWithRequirements(normalized);
              improved++;
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (e) {
            // Skip errors
          }
        }
        
        if (improved > 0) {
          console.log(`  ✅ Auto-improved ${improved} pages`);
        }
      }
      
      // CRITICAL FIX: Don't close singleton pool
    } catch (e) {
      console.log(`⚠️  Auto-quality improvement error: ${e.message}`);
    }
    
    // STEP 4: Quality Analysis & Testing - ALWAYS RUN after scraping
    console.log('\n📊 STEP 4: QUALITY ANALYSIS & TESTING');
    try {
      console.log('  📈 Running quality pattern analysis...');
      require('../manual/analyze-quality-patterns.js');
      console.log('  ✅ Quality analysis complete');
    } catch (e) {
      console.log(`  ⚠️  Quality analysis error: ${e.message}`);
    }
    
    // STEP 4b: Database Quality Check & Component Data Verification - ALWAYS RUN
    console.log('\n✅ STEP 4b: DATABASE QUALITY CHECK');
    try {
      require('../manual/verify-database-quality.js');
    } catch (e) {
      console.log(`  ⚠️  Quality check error: ${e.message}`);
    }
    
    // Verify component data format
    console.log('\n✅ STEP 4c: COMPONENT DATA VERIFICATION');
    try {
      require('../manual/test-question-engine-data.js');
    } catch (e) {
      console.log(`  ⚠️  Component verification error: ${e.message}`);
    }
    
    // STEP 5: Auto-Rescrape Pages with Missing Critical Categories - AUTONOMOUS (every cycle now for faster improvement)
    // OPTIMIZATION: Run every cycle instead of every 2 cycles for faster quality improvement
    if (cyclesRun > 1) {
      console.log('\n🔄 STEP 5: AUTO-RESCRAPE LOW QUALITY PAGES');
      try {
        await autoRescrapeLowQualityPages();
      } catch (e) {
        console.log(`⚠️  Auto-rescrape error: ${e.message}`);
      }
    }
    
    // STEP 5b: Process PDFs (if any in queue) - AUTONOMOUS (every cycle after first)
    if (cyclesRun > 1) {
      console.log('\n📄 STEP 5b: PROCESSING PDFS');
      try {
        const state = loadState();
        const pdfJobs = state.jobs.filter(j => 
          j.status === 'queued' && 
          (j.url.toLowerCase().includes('.pdf') || j.url.toLowerCase().includes('/pdf/'))
        );
        
        if (pdfJobs.length > 0) {
          console.log(`  📄 Found ${pdfJobs.length} PDFs in queue`);
          const { processPdfs } = require('../manual/process-pdfs.js');
          // Process up to 10 PDFs per cycle (PDFs are slower)
          // Set limit via process.argv since processPdfs reads from argv
          const originalArgv = process.argv.slice();
          process.argv.push('--limit=10');
          await processPdfs();
          process.argv = originalArgv;
        } else {
          console.log(`  ℹ️  No PDFs in queue`);
        }
      } catch (e) {
        console.log(`⚠️  PDF processing error: ${e.message}`);
        if (e.stack) console.log(`  Stack: ${e.stack}`);
      }
    }
    
    // STEP 6: Retry Failed Jobs
    await retryFailedJobs(3);
    
    // STEP 7: Analysis & Status
    console.log('\n📊 STEP 7: ANALYSIS & STATUS');
    const finalState = loadState();
    const finalPageCount = finalState.pages.length;
    const finalQueuedJobs = finalState.jobs.filter(j => j.status === 'queued').length;
    const finalFailedJobs = finalState.jobs.filter(j => j.status === 'failed').length;
    
    console.log(`  📄 Total pages: ${finalPageCount} (${finalPageCount - initialPageCount} new this session)`);
    console.log(`  ⏳ Queued jobs: ${finalQueuedJobs}`);
    console.log(`  ❌ Failed jobs: ${finalFailedJobs}`);
    
    // Run monitoring scripts for detailed analysis - ALWAYS RUN after each cycle
    console.log('\n📈 STEP 7b: DETAILED IMPROVEMENT MONITORING');
    try {
      require('./monitor-improvements.js');
    } catch (e) {
      console.log(`⚠️  Could not run monitoring: ${e.message}`);
    }
    
    // Check if we should continue
    if (newJobs < MIN_NEW_URLS && cyclesRun > 1) {
      console.log(`\n✅ Cycle complete: No significant new URLs discovered.`);
      break;
    }
    
    // Small delay between cycles to be respectful
    if (cyclesRun < MAX_CYCLES) {
      console.log('\n⏸️  Waiting 2 seconds before next cycle...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Final Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL SUMMARY');
  console.log('='.repeat(70));
  
  const finalState = loadState();
  const finalPageCount = finalState.pages.length;
  const finalUrlsDiscovered = Object.keys(finalState.seen || {}).length;
  
  console.log(`\n✅ Completed ${cyclesRun} cycles`);
  console.log(`📄 Total pages scraped: ${finalPageCount} (+${finalPageCount - initialPageCount})`);
  console.log(`🔍 Total URLs discovered: ${finalUrlsDiscovered} (+${finalUrlsDiscovered - initialSeenCount})`);
  console.log(`📥 Pages scraped this session: ${totalPagesScraped}`);
  console.log(`🔎 URLs discovered this session: ${totalUrlsDiscovered}`);
  
  const queued = finalState.jobs.filter(j => j.status === 'queued').length;
  const failed = finalState.jobs.filter(j => j.status === 'failed').length;
  
  if (queued > 0) {
    console.log(`\n⏳ ${queued} jobs still queued (run again to process)`);
  }
  if (failed > 0) {
    console.log(`❌ ${failed} jobs failed after retries`);
  }
  
  console.log('\n✅ Automated cycle complete!\n');
}

// Run if called directly
if (require.main === module) {
  autoCycle().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { autoCycle };

