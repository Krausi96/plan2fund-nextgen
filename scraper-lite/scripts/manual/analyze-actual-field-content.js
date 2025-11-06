#!/usr/bin/env node
/**
 * Analyze Actual Field Content
 * 
 * Shows actual content of all fields for all pages
 * Identifies garbage, what can be improved, missing data
 */

require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs', moduleResolution: 'node', esModuleInterop: true } });

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env.local') });

const { getPool } = require('../../src/db/neon-client.ts');

async function analyzeActualContent() {
  console.log('\n🔍 ANALYZING ACTUAL FIELD CONTENT\n');
  console.log('='.repeat(80));
  
  const pool = getPool();
  
  try {
    // Get all pages with their requirements
    const pages = await pool.query(`
      SELECT 
        p.id,
        p.url,
        p.title,
        p.description,
        p.funding_amount_min,
        p.funding_amount_max,
        p.currency,
        p.deadline,
        p.open_deadline,
        p.contact_email,
        p.contact_phone,
        p.funding_types,
        json_agg(
          json_build_object(
            'category', r.category,
            'type', r.type,
            'value', r.value,
            'source', r.source
          )
        ) FILTER (WHERE r.id IS NOT NULL) as requirements
      FROM pages p
      LEFT JOIN requirements r ON p.id = r.page_id
      GROUP BY p.id, p.url, p.title, p.description, p.funding_amount_min, 
               p.funding_amount_max, p.currency, p.deadline, p.open_deadline, 
               p.contact_email, p.contact_phone, p.funding_types
      ORDER BY p.id DESC
    `);
    
    if (pages.rows.length === 0) {
      console.log('\n⚠️  No pages in database.\n');
      return;
    }
    
    console.log(`\n📄 ANALYZING ${pages.rows.length} PAGES\n`);
    
    // Critical categories
    const criticalCategories = ['eligibility', 'financial', 'documents', 'timeline', 'geographic', 'project', 'team'];
    const nonCriticalCategories = ['impact', 'consortium', 'technical', 'legal', 'use_of_funds', 'capex_opex', 'revenue_model', 'market_size', 'trl_level', 'co_financing', 'diversity'];
    
    // Critical metadata
    const criticalMetadata = ['funding_amount_min', 'funding_amount_max', 'deadline', 'open_deadline', 'contact_email', 'contact_phone'];
    const nonCriticalMetadata = ['currency', 'funding_types'];
    
    const analysis = {
      criticalCategories: {},
      nonCriticalCategories: {},
      criticalMetadata: {},
      nonCriticalMetadata: {},
      garbage: [],
      missing: [],
      improvements: []
    };
    
    pages.rows.forEach((page, idx) => {
      console.log('\n' + '='.repeat(80));
      console.log(`\n📄 PAGE ${idx + 1}: ${page.url}`);
      console.log(`   Title: ${(page.title || 'NO TITLE').substring(0, 70)}`);
      console.log(`   Funding Type: ${page.funding_types || 'UNKNOWN'}`);
      
      const reqs = page.requirements || [];
      const byCategory = {};
      reqs.forEach(req => {
        if (!byCategory[req.category]) {
          byCategory[req.category] = [];
        }
        byCategory[req.category].push(req);
      });
      
      // Analyze metadata
      console.log(`\n   📋 METADATA:`);
      console.log(`      Funding: ${page.funding_amount_min || 'NULL'} - ${page.funding_amount_max || 'NULL'} ${page.currency || ''}`);
      console.log(`      Deadline: ${page.deadline || 'NULL'} (Open: ${page.open_deadline ? 'YES' : 'NO'})`);
      console.log(`      Contact: ${page.contact_email || 'NULL'} / ${page.contact_phone || 'NULL'}`);
      
      // Check for missing critical metadata
      if (!page.funding_amount_min && !page.funding_amount_max) {
        analysis.missing.push({ page: page.url, type: 'metadata', field: 'funding_amount' });
      }
      if (!page.deadline && !page.open_deadline) {
        analysis.missing.push({ page: page.url, type: 'metadata', field: 'deadline' });
      }
      if (!page.contact_email && !page.contact_phone) {
        analysis.missing.push({ page: page.url, type: 'metadata', field: 'contact' });
      }
      
      // Check geographic from URL
      const urlObj = new URL(page.url);
      const host = urlObj.hostname;
      const hasGeographic = byCategory.geographic && byCategory.geographic.length > 0;
      if (!hasGeographic) {
        if (host.endsWith('.at')) {
          analysis.improvements.push({ 
            page: page.url, 
            issue: 'Missing geographic (should be Austria from .at domain)',
            fix: 'Add URL-based geographic extraction'
          });
        } else if (host.endsWith('.de')) {
          analysis.improvements.push({ 
            page: page.url, 
            issue: 'Missing geographic (should be Germany from .de domain)',
            fix: 'Add URL-based geographic extraction'
          });
        }
      }
      
      // Analyze requirements by category
      console.log(`\n   📝 REQUIREMENTS:`);
      
      [...criticalCategories, ...nonCriticalCategories].forEach(category => {
        const items = byCategory[category] || [];
        const isCritical = criticalCategories.includes(category);
        
        if (items.length > 0) {
          console.log(`      ✅ ${category.toUpperCase()} (${items.length} items):`);
          items.slice(0, 3).forEach((item, i) => {
            const value = String(item.value || '').trim();
            const display = value.length > 60 ? value.substring(0, 60) + '...' : value;
            const source = item.source || 'unknown';
            
            // Check for garbage
            const isGarbage = value.length < 5 || 
                             value.toLowerCase().includes('required') ||
                             value.toLowerCase().includes('specified') ||
                             value.toLowerCase().includes('available') ||
                             value.includes('</') || // HTML tags
                             value.match(/^[A-Z\s]+$/) && value.length < 20; // All caps short
            
            if (isGarbage) {
              analysis.garbage.push({ page: page.url, category, value, source });
              console.log(`         ⚠️  [GARBAGE] ${display} (source: ${source})`);
            } else {
              console.log(`         - ${display} (source: ${source})`);
            }
            
            if (!analysis[isCritical ? 'criticalCategories' : 'nonCriticalCategories'][category]) {
              analysis[isCritical ? 'criticalCategories' : 'nonCriticalCategories'][category] = [];
            }
            analysis[isCritical ? 'criticalCategories' : 'nonCriticalCategories'][category].push({
              page: page.url,
              value,
              source
            });
          });
        } else {
          console.log(`      ❌ ${category.toUpperCase()}: EMPTY`);
          if (isCritical) {
            analysis.missing.push({ page: page.url, type: 'category', category });
          }
        }
      });
    });
    
    // Overall Analysis
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 OVERALL ANALYSIS\n');
    
    const totalPages = pages.rows.length;
    
    // Critical categories coverage
    console.log('\n🎯 CRITICAL CATEGORIES COVERAGE:');
    criticalCategories.forEach(category => {
      const pagesWithCategory = pages.rows.filter(p => {
        const reqs = p.requirements || [];
        return reqs.some(r => r.category === category);
      }).length;
      const coverage = Math.round((pagesWithCategory / totalPages) * 100);
      const items = analysis.criticalCategories[category] || [];
      const avgItems = items.length / totalPages;
      
      console.log(`   ${category}: ${pagesWithCategory}/${totalPages} (${coverage}%) - Avg ${avgItems.toFixed(1)} items/page`);
    });
    
    // Non-critical categories coverage
    console.log('\n📋 NON-CRITICAL CATEGORIES COVERAGE:');
    nonCriticalCategories.forEach(category => {
      const pagesWithCategory = pages.rows.filter(p => {
        const reqs = p.requirements || [];
        return reqs.some(r => r.category === category);
      }).length;
      const coverage = Math.round((pagesWithCategory / totalPages) * 100);
      const items = analysis.nonCriticalCategories[category] || [];
      const avgItems = items.length / totalPages;
      
      console.log(`   ${category}: ${pagesWithCategory}/${totalPages} (${coverage}%) - Avg ${avgItems.toFixed(1)} items/page`);
    });
    
    // Critical metadata coverage
    console.log('\n💰 CRITICAL METADATA COVERAGE:');
    criticalMetadata.forEach(field => {
      const pagesWithField = pages.rows.filter(p => {
        if (field === 'funding_amount_min' || field === 'funding_amount_max') {
          return p.funding_amount_min || p.funding_amount_max;
        } else if (field === 'deadline') {
          return p.deadline || p.open_deadline;
        } else if (field === 'contact_email' || field === 'contact_phone') {
          return p.contact_email || p.contact_phone;
        }
        return p[field];
      }).length;
      const coverage = Math.round((pagesWithField / totalPages) * 100);
      console.log(`   ${field}: ${pagesWithField}/${totalPages} (${coverage}%)`);
    });
    
    // Garbage analysis
    console.log('\n🗑️  GARBAGE ANALYSIS:');
    if (analysis.garbage.length > 0) {
      console.log(`   Found ${analysis.garbage.length} garbage items:`);
      const byCategory = {};
      analysis.garbage.forEach(g => {
        if (!byCategory[g.category]) {
          byCategory[g.category] = [];
        }
        byCategory[g.category].push(g);
      });
      
      Object.keys(byCategory).forEach(cat => {
        console.log(`   ${cat}: ${byCategory[cat].length} items`);
        byCategory[cat].slice(0, 3).forEach(g => {
          console.log(`      - ${g.value.substring(0, 50)}... (source: ${g.source})`);
        });
      });
    } else {
      console.log('   ✅ No garbage found');
    }
    
    // Missing data analysis
    console.log('\n❌ MISSING DATA ANALYSIS:');
    const missingByType = {};
    analysis.missing.forEach(m => {
      const key = m.type === 'category' ? m.category : m.field;
      if (!missingByType[key]) {
        missingByType[key] = [];
      }
      missingByType[key].push(m);
    });
    
    Object.keys(missingByType).forEach(key => {
      console.log(`   ${key}: ${missingByType[key].length} pages missing`);
    });
    
    // Improvements
    console.log('\n💡 IMPROVEMENTS NEEDED:');
    if (analysis.improvements.length > 0) {
      analysis.improvements.forEach(imp => {
        console.log(`   - ${imp.issue}`);
        console.log(`     Fix: ${imp.fix}`);
      });
    } else {
      console.log('   ✅ No improvements identified');
    }
    
    // Patterns
    console.log('\n🔍 PATTERNS RECOGNIZED:');
    console.log('   URL Discovery:');
    console.log('     - Seed URLs are actual program pages (good)');
    console.log('     - Discovery finds overview pages (need filtering)');
    console.log('     - Need keyword-based discovery on other websites');
    console.log('   Requirements:');
    console.log('     - Geographic missing but can be inferred from URL (.at, .de, .it)');
    console.log('     - Timeline often missing but can detect "open deadline"');
    console.log('     - Documents often in lists but not extracted');
    
    console.log('\n' + '='.repeat(80));
    console.log('✅ Analysis complete!\n');
    
  } catch (e) {
    console.error('❌ Error:', e.message);
    if (e.stack) console.error('Stack:', e.stack);
    throw e;
  }
}

if (require.main === module) {
  analyzeActualContent().catch(e => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  });
}

module.exports = { analyzeActualContent };

