#!/usr/bin/env node
// Enhanced pattern learning: Learn URL patterns from successfully scraped pages
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, '..', 'data', 'lite', 'state.json');
const patternsPath = path.join(__dirname, '..', 'data', 'lite', 'url-patterns.json');

function extractPatternFromUrl(url) {
  try {
    const u = new URL(url);
    const pathname = u.pathname.toLowerCase();
    const segments = pathname.split('/').filter(s => s.length > 0);
    
    if (segments.length === 0) return [];
    
    const patterns = [];
    
    // Full path pattern (most specific)
    if (segments.length >= 2) {
      const lastSegment = segments[segments.length - 1];
      // Pattern: /category/{specific-name} or /category/{id}
      const categoryPattern = `/${segments[0]}/[^/]+`;
      patterns.push(categoryPattern);
      
      // If last segment looks like an ID or slug
      if (lastSegment.match(/^[\w-]+$/) && !lastSegment.match(/^(en|de|at)$/)) {
        patterns.push(`/${segments[0]}/[^/]+$`);
      }
    }
    
    // Segment-based patterns
    if (segments.length >= 1) {
      // Pattern based on first segment
      patterns.push(`/${segments[0]}/.+`);
      patterns.push(`/${segments[0]}/[^/]+$`);
    }
    
    // Common patterns
    if (pathname.includes('/ausschreibung/')) {
      patterns.push('/ausschreibung/[^/]+');
      patterns.push('/ausschreibung/[^/]+$');
    }
    if (pathname.includes('/programm/') || pathname.includes('/programme/')) {
      patterns.push('/programm[e]?/[^/]+');
      patterns.push('/programm[e]?/[^/]+$');
    }
    if (pathname.includes('/foerderung') || pathname.includes('/funding')) {
      patterns.push('/foerderung[s]?/[^/]+');
      patterns.push('/funding[s]?/[^/]+');
    }
    
    return [...new Set(patterns)];
  } catch {
    return [];
  }
}

function extractExclusionPatterns(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    const exclusions = [];
    
    // Category/taxonomy pages
    if (pathname.includes('/category/') || pathname.includes('/taxonomy/') || pathname.includes('/tag/')) {
      exclusions.push('/category/|/taxonomy/|/tag/');
    }
    
    // Event pages
    if (pathname.includes('/events/') || pathname.includes('/veranstaltungen/') || pathname.includes('/event/')) {
      exclusions.push('/events?/|/veranstaltungen/');
    }
    
    // Search/listing pages
    if (pathname.includes('/search/') || pathname.includes('/suche/') || pathname.includes('/listing/')) {
      exclusions.push('/search/|/suche/|/listing/');
    }
    
    // Contact/about pages
    if (pathname.includes('/contact/') || pathname.includes('/kontakt/') || pathname.includes('/about/') || pathname.includes('/ueber/')) {
      exclusions.push('/contact/|/kontakt/|/about/|/ueber/');
    }
    
    // News/blog pages
    if (pathname.includes('/news/') || pathname.includes('/blog/') || pathname.includes('/nachrichten/')) {
      exclusions.push('/news/|/blog/|/nachrichten/');
    }
    
    return exclusions;
  } catch {
    return [];
  }
}

function main() {
  console.log('\n🧠 Enhanced Pattern Learning from Scraped Pages\n');
  console.log('='.repeat(60));
  
  // Load state
  if (!fs.existsSync(statePath)) {
    console.log('❌ State file not found');
    return;
  }
  
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  const pages = state.pages || [];
  
  if (pages.length === 0) {
    console.log('❌ No pages found in state');
    return;
  }
  
  console.log(`\n📊 Analyzing ${pages.length} scraped pages...\n`);
  
  // Load existing patterns
  let learnedPatterns = {};
  if (fs.existsSync(patternsPath)) {
    try {
      learnedPatterns = JSON.parse(fs.readFileSync(patternsPath, 'utf8'));
    } catch (e) {
      console.log('⚠️  Could not load existing patterns, starting fresh');
    }
  }
  
  // Categorize pages by host
  const pagesByHost = {};
  
  pages.forEach(page => {
    try {
      const host = new URL(page.url).hostname.replace('www.', '');
      if (!pagesByHost[host]) {
        pagesByHost[host] = {
          good: [],      // Pages with critical categories or metadata
          bad: [],       // Pages without critical categories and no metadata
          total: 0
        };
      }
      pagesByHost[host].total++;
      
      // Determine if page is "good" (has value)
      const reqs = page.categorized_requirements || {};
      const totalRequirements = Object.values(reqs).flat().filter(Array.isArray).reduce((sum, items) => sum + items.length, 0);
      
      const criticalCategories = ['eligibility', 'financial', 'documents', 'project', 'timeline'];
      const hasCriticalCategory = criticalCategories.some(cat => {
        const items = reqs[cat] || [];
        return Array.isArray(items) && items.length > 0;
      });
      
      const hasMetadata = !!(page.funding_amount_min || page.funding_amount_max || page.deadline || 
                            page.contact_email || page.contact_phone);
      const hasTitleDesc = !!(page.title && page.title.trim().length > 10 && 
                            page.description && page.description.trim().length > 20);
      
      if (hasCriticalCategory || hasMetadata || (hasTitleDesc && totalRequirements > 0)) {
        pagesByHost[host].good.push(page.url);
      } else {
        pagesByHost[host].bad.push(page.url);
      }
    } catch (e) {
      // Skip invalid URLs
    }
  });
  
  // Learn patterns from good pages
  console.log('🔍 Learning patterns from successful pages...\n');
  
  Object.entries(pagesByHost).forEach(([host, data]) => {
    const goodPages = data.good;
    const badPages = data.bad;
    const goodRate = goodPages.length / data.total;
    
    console.log(`${host}:`);
    console.log(`  Total: ${data.total} pages`);
    console.log(`  ✅ Good: ${goodPages.length} (${Math.round(goodRate * 100)}%)`);
    console.log(`  ❌ Bad: ${badPages.length} (${Math.round((1 - goodRate) * 100)}%)`);
    
    if (!learnedPatterns[host]) {
      learnedPatterns[host] = {
        institution: host,
        patterns: {
          include: [],
          exclude: []
        },
        stats: {
          totalPages: 0,
          goodPages: 0,
          badPages: 0
        }
      };
    }
    
    // Extract include patterns from good pages
    const includePatterns = new Set(learnedPatterns[host].patterns.include || []);
    goodPages.forEach(url => {
      const patterns = extractPatternFromUrl(url);
      patterns.forEach(p => includePatterns.add(p));
    });
    
    // Extract exclude patterns from bad pages
    const excludePatterns = new Set(learnedPatterns[host].patterns.exclude || []);
    badPages.forEach(url => {
      const exclusions = extractExclusionPatterns(url);
      exclusions.forEach(e => excludePatterns.add(e));
    });
    
    // Also extract patterns from URL structure analysis
    goodPages.slice(0, 50).forEach(url => {
      try {
        const pathname = new URL(url).pathname.toLowerCase();
        const segments = pathname.split('/').filter(s => s.length > 0);
        
        if (segments.length >= 2) {
          // Pattern: /category/program-name
          const pattern = `/${segments[0]}/[^/]+$`;
          includePatterns.add(pattern);
        }
        
        // Check for common program indicators
        if (pathname.includes('/ausschreibung/') || pathname.includes('/programm/') || 
            pathname.includes('/foerderung/') || pathname.includes('/funding/') ||
            pathname.includes('/call/') || pathname.includes('/ausschreibung')) {
          const basePattern = pathname.split('/').slice(0, 2).join('/') + '/[^/]+';
          includePatterns.add(basePattern);
        }
      } catch {}
    });
    
    learnedPatterns[host].patterns = {
      include: Array.from(includePatterns),
      exclude: Array.from(excludePatterns)
    };
    
    learnedPatterns[host].stats = {
      totalPages: data.total,
      goodPages: goodPages.length,
      badPages: badPages.length,
      goodRate: Math.round(goodRate * 100),
      lastUpdated: new Date().toISOString()
    };
    
    console.log(`  📝 Learned ${includePatterns.size} include patterns, ${excludePatterns.size} exclude patterns\n`);
  });
  
  // Save patterns
  const outputDir = path.dirname(patternsPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(patternsPath, JSON.stringify(learnedPatterns, null, 2));
  
  console.log('='.repeat(60));
  console.log(`\n✅ Enhanced patterns learned and saved!`);
  console.log(`📁 ${patternsPath}`);
  console.log(`\nThese patterns are now used automatically by isProgramDetailPage()\n`);
}

main();


