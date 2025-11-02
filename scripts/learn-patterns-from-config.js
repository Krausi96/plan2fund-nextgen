#!/usr/bin/env node
// Learn patterns from programUrls in institutionConfig.ts
// This is the ONLY script you need - learns patterns from URLs you add to config
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const { institutions } = require('../src/config.ts');
const fs = require('fs');
const path = require('path');

const PATTERNS_FILE = path.join(__dirname, '..', 'data', 'lite', 'url-patterns.json');

function extractPatternFromUrl(url) {
  try {
    const u = new URL(url);
    const pathname = u.pathname.toLowerCase();
    const segs = pathname.split('/').filter(s => s.length > 0);
    
    const patterns = [];
    
    if (segs.length >= 2) {
      // Pattern: /{segment1}/{segment2}/
      patterns.push(`/${segs[0]}/[^/]+`);
      
      // Specific patterns
      if (segs[0] === 'ausschreibung') {
        patterns.push('/ausschreibung/[^/]+');
      }
      if (segs[0] === 'programm') {
        patterns.push('/programm/[^/]+');
      }
      if (segs[0] === 'spezialprogramme') {
        patterns.push('/spezialprogramme/[^/]+');
      }
      if (segs[0] === 'node' && /^\d+$/.test(segs[1])) {
        patterns.push('/node/\\d+');
      }
      if (segs[0] === 'call' || segs[0] === 'calls') {
        patterns.push('/(call|calls)/[^/]+');
      }
      if (pathname.match(/\/europa\/ausschreibungen\//)) {
        patterns.push('/europa/ausschreibungen/[^/]+');
      }
      if (pathname.match(/\/europa\/heu\/calls\//)) {
        patterns.push('/europa/heu/calls/[^/]+');
      }
      if (pathname.match(/\/europa\/heu\/cluster\d+\/call\d+/)) {
        patterns.push('/europa/heu/cluster\\d+/call\\d+');
      }
    }
    
    if (segs.length === 1 && segs[0].length > 15) {
      patterns.push('/[a-z0-9\\-]{15,}');
    }
    
    return [...new Set(patterns)];
  } catch {
    return [];
  }
}

function main() {
  console.log('Learning patterns from institutionConfig programUrls...\n');
  
  const learnedPatterns = {};
  
  institutions.forEach(inst => {
    if (!inst.seedUrls || inst.seedUrls.length === 0) return;
    
    let host;
    try {
      host = new URL(inst.baseUrl).hostname.replace('www.', '');
    } catch {
      return;
    }
    
    // Extract patterns from programUrls
    const includePatterns = new Set();
    const excludePatterns = new Set();
    
    inst.seedUrls.forEach(url => {
      const patterns = extractPatternFromUrl(url);
      patterns.forEach(p => includePatterns.add(p));
      
      // Also check if URL matches exclusion patterns
      try {
        const pathname = new URL(url).pathname.toLowerCase();
        if (pathname.includes('/category/') || pathname.includes('/taxonomy/')) {
          excludePatterns.add('/category/|/taxonomy/');
        }
        if (pathname.includes('/events/') || pathname.includes('/veranstaltungen/')) {
          excludePatterns.add('/events/|/veranstaltungen/');
        }
      } catch {}
    });
    
    learnedPatterns[host] = {
      institution: inst.name,
      baseUrl: inst.baseUrl,
      patterns: {
        include: Array.from(includePatterns),
        exclude: Array.from(excludePatterns)
      },
      exampleUrls: inst.seedUrls.slice(0, 10),
      stats: {
        totalProgramUrls: inst.seedUrls.length
      }
    };
    
    console.log(`${inst.name}:`);
    console.log(`  ${inst.seedUrls.length} program URLs → ${includePatterns.size} patterns\n`);
  });
  
  // Save patterns
  const outputDir = path.dirname(PATTERNS_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(PATTERNS_FILE, JSON.stringify(learnedPatterns, null, 2));
  
  console.log(`✅ Patterns learned and saved!`);
  console.log(`📁 ${PATTERNS_FILE}`);
  console.log(`\nThese patterns are now used automatically by isProgramDetailPage().`);
  console.log(`\nTo update: Just add more URLs to institutionConfig.ts and run this again.`);
}

main();


