#!/usr/bin/env node
/**
 * Process PDF documents from queue
 * Extracts text from PDFs and runs same extraction patterns as HTML pages
 * 
 * Usage:
 *   node scripts/manual/process-pdfs.js              # Process all PDFs in queue
 *   node scripts/manual/process-pdfs.js --limit=10  # Process first 10 PDFs
 *   node scripts/manual/process-pdfs.js --test      # Test with 1 PDF first
 */
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const pdfParse = require('pdf-parse');
const { getPool } = require('../../src/db/neon-client.ts');
const { extractMeta } = require('../../src/extract.ts');
const { normalizeMetadata } = require('../../src/extract.ts');
const { savePageWithRequirements } = require('../../src/db/page-repository.ts');
const { loadState, saveState } = require('../../src/scraper.ts');

async function fetchPdf(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'plan2fund-lite/1.0 (+https://plan2fund.local)'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Check if it's actually a PDF
    if (buffer.length === 0) {
      throw new Error('Empty PDF file');
    }
    
    // Check PDF header
    const header = buffer.slice(0, 4).toString();
    if (header !== '%PDF') {
      throw new Error('Not a valid PDF file');
    }
    
    return buffer;
  } catch (error) {
    throw new Error(`Failed to fetch PDF: ${error.message}`);
  }
}

async function extractTextFromPdf(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text || '';
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error.message}`);
  }
}

async function processPdfs() {
  console.log('\n' + '='.repeat(70));
  console.log('📄 PROCESSING PDF DOCUMENTS');
  console.log('='.repeat(70));
  
  const isTest = process.argv.includes('--test');
  const limitArg = process.argv.find(arg => arg.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : (isTest ? 1 : null);
  
  const state = loadState();
  const pool = getPool();
  
  try {
    // Get PDFs from queue
    let pdfJobs = state.jobs.filter(j => 
      j.status === 'queued' && 
      (j.url.toLowerCase().includes('.pdf') || j.url.toLowerCase().includes('/pdf/'))
    );
    
    // Sort: Process smaller PDFs first (based on URL patterns - avoid large report PDFs)
    pdfJobs.sort((a, b) => {
      const aUrl = a.url.toLowerCase();
      const bUrl = b.url.toLowerCase();
      // Prefer smaller documents (avoid "irglobal", "impres", "report" patterns)
      const aIsLarge = aUrl.includes('irglobal') || aUrl.includes('impres') || aUrl.includes('report');
      const bIsLarge = bUrl.includes('irglobal') || bUrl.includes('impres') || bUrl.includes('report');
      if (aIsLarge && !bIsLarge) return 1;
      if (!aIsLarge && bIsLarge) return -1;
      return 0;
    });
    
    if (limit) {
      pdfJobs = pdfJobs.slice(0, limit);
    }
    
    console.log(`\n📊 Found ${pdfJobs.length} PDFs to process\n`);
    
    if (pdfJobs.length === 0) {
      console.log('✅ No PDFs in queue to process!');
      return;
    }
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let totalExtracted = 0;
    let totalRequirements = 0;
    
    for (let i = 0; i < pdfJobs.length; i++) {
      const job = pdfJobs[i];
      const progress = `[${i + 1}/${pdfJobs.length}]`;
      
      console.log(`\n${progress} Processing: ${job.url.slice(0, 70)}...`);
      
      try {
        // Check if PDF is too large (skip if > 50MB to avoid memory issues)
        // Note: Most PDFs are < 10MB, but some program documents can be larger
        const headResponse = await fetch(job.url, { method: 'HEAD' });
        const contentLength = headResponse.headers.get('content-length');
        const maxSize = 50 * 1024 * 1024; // 50MB limit
        if (contentLength && parseInt(contentLength) > maxSize) {
          console.log(`  ⚠️  Skipping: PDF too large (${(parseInt(contentLength) / 1024 / 1024).toFixed(1)}MB > ${maxSize / 1024 / 1024}MB)`);
          job.status = 'failed';
          job.lastError = `PDF too large (>${maxSize / 1024 / 1024}MB)`;
          skippedCount++;
          continue;
        } else if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
          console.log(`  ⚠️  Warning: Large PDF (${(parseInt(contentLength) / 1024 / 1024).toFixed(1)}MB) - processing may be slow`);
        }
        
        // Fetch PDF
        console.log(`  📥 Fetching PDF...`);
        const pdfBuffer = await fetchPdf(job.url);
        console.log(`  ✅ Fetched: ${(pdfBuffer.length / 1024).toFixed(1)}KB`);
        
        // Extract text
        console.log(`  📝 Extracting text...`);
        const pdfText = await extractTextFromPdf(pdfBuffer);
        
        if (!pdfText || pdfText.trim().length < 50) {
          console.log(`  ⚠️  Skipping: PDF has no extractable text (${pdfText?.length || 0} chars)`);
          job.status = 'failed';
          job.lastError = 'No extractable text';
          skippedCount++;
          continue;
        }
        
        console.log(`  ✅ Extracted: ${pdfText.length} characters`);
        totalExtracted += pdfText.length;
        
        // Generate title and description from PDF text
        const firstLine = pdfText.split('\n').find(line => line.trim().length > 10) || '';
        const title = firstLine.trim().slice(0, 200) || 'PDF Document';
        const description = pdfText.slice(0, 500).replace(/\s+/g, ' ').trim() || 
                          `Document extracted from PDF (${pdfText.length} characters)`;
        
        // Run extraction patterns on text (treat as HTML-like content)
        // We'll create a minimal HTML structure for the extractor
        const fakeHtml = `
          <html>
            <head>
              <title>${title}</title>
              <meta name="description" content="${description.slice(0, 200)}">
            </head>
            <body>
              <h1>${title}</h1>
              <p>${description}</p>
              <div>${pdfText.replace(/\n/g, '<br>').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
            </body>
          </html>
        `;
        
        console.log(`  🔍 Running extraction patterns...`);
        const meta = extractMeta(fakeHtml, job.url);
        
        // Ensure title and description are set (use extracted or generated)
        if (!meta.title || meta.title.trim().length < 10) {
          meta.title = title;
        }
        if (!meta.description || meta.description.trim().length < 20) {
          meta.description = description;
        }
        
        // Count requirements extracted
        const reqCount = Object.values(meta.categorized_requirements || {})
          .filter(Array.isArray)
          .reduce((sum, items) => sum + items.length, 0);
        
        console.log(`  ✅ Extracted: ${Object.keys(meta.categorized_requirements || {}).length} categories, ${reqCount} requirements`);
        
        if (reqCount === 0 && !meta.title && !meta.description) {
          console.log(`  ⚠️  Skipping: No extractable data from PDF`);
          job.status = 'failed';
          job.lastError = 'No extractable data';
          skippedCount++;
          continue;
        }
        
        // Normalize and save
        // Preserve funding_amount_status if present (from extractMeta)
        const normalized = normalizeMetadata({
          ...meta,
          url: job.url,
          fetched_at: new Date().toISOString(),
          metadata_json: {
            ...(meta.metadata_json || {}),
            source: 'pdf',
            pdf_text_length: pdfText.length,
            extracted_from: 'pdf_document',
            // Preserve funding_amount_status if detected (varies, unknown, contact_required)
            funding_amount_status: (meta.metadata_json || {}).funding_amount_status || null
          }
        });
        
        // Save to database
        const pageId = await savePageWithRequirements(normalized);
        job.status = 'done';
        successCount++;
        totalRequirements += reqCount;
        
        console.log(`  ✅ Saved to DB (ID: ${pageId}): ${reqCount} requirements`);
        
        // Small delay between PDFs (more conservative than HTML)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Force garbage collection hint (if available)
        if (global.gc) {
          global.gc();
        }
        
      } catch (error) {
        errorCount++;
        const errorMsg = error && typeof error === 'object' && 'message' in error ? error.message : String(error);
        console.error(`  ❌ Error: ${errorMsg.slice(0, 100)}`);
        job.status = 'failed';
        job.lastError = errorMsg.slice(0, 100);
        
        // If memory error, stop processing
        if (errorMsg.includes('memory') || errorMsg.includes('heap') || errorMsg.includes('allocation')) {
          console.error(`  ⚠️  Memory error detected - stopping PDF processing`);
          break;
        }
      }
    }
    
    // Save state
    saveState(state);
    
    // Final summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ PDF PROCESSING COMPLETE');
    console.log('='.repeat(70));
    console.log(`📊 Results:`);
    console.log(`   Total PDFs: ${pdfJobs.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total text extracted: ${(totalExtracted / 1024).toFixed(1)}KB`);
    console.log(`   Total requirements: ${totalRequirements}`);
    console.log(`   Avg requirements/PDF: ${successCount > 0 ? (totalRequirements / successCount).toFixed(1) : 0}`);
    console.log('='.repeat(70));
    
    if (successCount > 0) {
      console.log(`\n✅ Successfully processed ${successCount} PDFs!`);
      console.log(`   Check database for results`);
    } else {
      console.log(`\n⚠️  No PDFs were successfully processed`);
      console.log(`   Check errors above for details`);
    }
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  processPdfs().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { processPdfs };

