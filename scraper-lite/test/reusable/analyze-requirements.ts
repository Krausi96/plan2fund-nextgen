#!/usr/bin/env ts-node

/**
 * Analyze Requirements Extraction Quality
 * 
 * Checks:
 * - Completeness (how many requirements per page)
 * - Meaningfulness (confidence scores, quality)
 * - Category coverage
 * - LLM vs Pattern extraction
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
const envPath = path.resolve(process.cwd(), '.env.local');
if (require('fs').existsSync(envPath)) {
  dotenv.config({ path: envPath });
}
dotenv.config();

import { getPool } from '../../db/db';

async function analyzeRequirements(): Promise<void> {
  const pool = getPool();
  console.log('📋 Requirements Quality Analysis\n');
  console.log('='.repeat(60));
  
  // 1. Overall statistics
  const overall = await pool.query(`
    SELECT 
      COUNT(*) as total_reqs,
      COUNT(DISTINCT page_id) as pages_with_reqs,
      COUNT(DISTINCT category) as unique_categories,
      AVG(confidence) as avg_confidence,
      MIN(confidence) as min_confidence,
      MAX(confidence) as max_confidence,
      COUNT(*) FILTER (WHERE extraction_method = 'llm') as llm_count,
      COUNT(*) FILTER (WHERE extraction_method = 'pattern') as pattern_count,
      COUNT(*) FILTER (WHERE extraction_method = 'hybrid') as hybrid_count
    FROM requirements
  `);
  
  console.log('\n📊 Overall Statistics:');
  console.log(`   Total requirements: ${overall.rows[0].total_reqs}`);
  console.log(`   Pages with requirements: ${overall.rows[0].pages_with_reqs}`);
  console.log(`   Unique categories: ${overall.rows[0].unique_categories}`);
  console.log(`   Avg confidence: ${parseFloat(overall.rows[0].avg_confidence || '0').toFixed(2)}`);
  console.log(`   Min confidence: ${parseFloat(overall.rows[0].min_confidence || '0').toFixed(2)}`);
  console.log(`   Max confidence: ${parseFloat(overall.rows[0].max_confidence || '0').toFixed(2)}`);
  console.log(`   LLM: ${overall.rows[0].llm_count} (${overall.rows[0].total_reqs > 0 ? ((overall.rows[0].llm_count / overall.rows[0].total_reqs) * 100).toFixed(1) : 0}%)`);
  console.log(`   Pattern: ${overall.rows[0].pattern_count} (${overall.rows[0].total_reqs > 0 ? ((overall.rows[0].pattern_count / overall.rows[0].total_reqs) * 100).toFixed(1) : 0}%)`);
  console.log(`   Hybrid: ${overall.rows[0].hybrid_count} (${overall.rows[0].total_reqs > 0 ? ((overall.rows[0].hybrid_count / overall.rows[0].total_reqs) * 100).toFixed(1) : 0}%)`);
  
  // 2. Completeness (requirements per page)
  const completeness = await pool.query(`
    SELECT 
      p.id,
      p.url,
      p.title,
      COUNT(r.id) as req_count,
      COUNT(DISTINCT r.category) as category_count,
      AVG(r.confidence) as avg_conf,
      COUNT(*) FILTER (WHERE r.extraction_method = 'llm') as llm_count
    FROM pages p
    LEFT JOIN requirements r ON r.page_id = p.id
    GROUP BY p.id, p.url, p.title
    ORDER BY req_count DESC
  `);
  
  console.log('\n📄 Completeness (Requirements per Page):');
  console.log(`   Pages analyzed: ${completeness.rows.length}`);
  const avgReqs = completeness.rows.reduce((sum, r) => sum + parseInt(r.req_count || '0'), 0) / completeness.rows.length;
  console.log(`   Avg requirements per page: ${avgReqs.toFixed(1)}`);
  console.log(`   Pages with 0 requirements: ${completeness.rows.filter(r => parseInt(r.req_count || '0') === 0).length}`);
  console.log(`   Pages with 1-5 requirements: ${completeness.rows.filter(r => {
    const count = parseInt(r.req_count || '0');
    return count >= 1 && count <= 5;
  }).length}`);
  console.log(`   Pages with 6-10 requirements: ${completeness.rows.filter(r => {
    const count = parseInt(r.req_count || '0');
    return count >= 6 && count <= 10;
  }).length}`);
  console.log(`   Pages with 11+ requirements: ${completeness.rows.filter(r => parseInt(r.req_count || '0') >= 11).length}`);
  
  console.log('\n   Top pages by requirement count:');
  completeness.rows.slice(0, 5).forEach((row: any, i: number) => {
    console.log(`   ${i + 1}. ${(row.title || row.url || 'Untitled').substring(0, 50)}`);
    console.log(`      Requirements: ${row.req_count}, Categories: ${row.category_count}, LLM: ${row.llm_count}, Avg conf: ${parseFloat(row.avg_conf || '0').toFixed(2)}`);
  });
  
  // 3. Category coverage
  const categories = await pool.query(`
    SELECT 
      category,
      COUNT(*) as count,
      AVG(confidence) as avg_conf,
      COUNT(*) FILTER (WHERE extraction_method = 'llm') as llm_count,
      COUNT(*) FILTER (WHERE extraction_method = 'pattern') as pattern_count,
      COUNT(*) FILTER (WHERE confidence >= 0.8) as high_conf_count
    FROM requirements
    GROUP BY category
    ORDER BY count DESC
  `);
  
  console.log('\n📂 Category Coverage:');
  categories.rows.forEach((row: any) => {
    const llmPct = row.count > 0 ? ((row.llm_count / row.count) * 100).toFixed(1) : '0';
    const highConfPct = row.count > 0 ? ((row.high_conf_count / row.count) * 100).toFixed(1) : '0';
    console.log(`   ${row.category}: ${row.count} reqs (LLM: ${llmPct}%, High conf: ${highConfPct}%, Avg: ${parseFloat(row.avg_conf || '0').toFixed(2)})`);
  });
  
  // 4. Meaningfulness (confidence distribution)
  const meaningfulness = await pool.query(`
    SELECT 
      COUNT(*) FILTER (WHERE confidence >= 0.9) as very_high,
      COUNT(*) FILTER (WHERE confidence >= 0.8 AND confidence < 0.9) as high,
      COUNT(*) FILTER (WHERE confidence >= 0.5 AND confidence < 0.8) as medium,
      COUNT(*) FILTER (WHERE confidence < 0.5) as low,
      COUNT(*) FILTER (WHERE confidence IS NULL) as null_conf
    FROM requirements
  `);
  
  const total = overall.rows[0].total_reqs;
  console.log('\n🎯 Meaningfulness (Confidence Distribution):');
  console.log(`   Very high (≥0.9): ${meaningfulness.rows[0].very_high} (${total > 0 ? ((meaningfulness.rows[0].very_high / total) * 100).toFixed(1) : 0}%)`);
  console.log(`   High (0.8-0.9): ${meaningfulness.rows[0].high} (${total > 0 ? ((meaningfulness.rows[0].high / total) * 100).toFixed(1) : 0}%)`);
  console.log(`   Medium (0.5-0.8): ${meaningfulness.rows[0].medium} (${total > 0 ? ((meaningfulness.rows[0].medium / total) * 100).toFixed(1) : 0}%)`);
  console.log(`   Low (<0.5): ${meaningfulness.rows[0].low} (${total > 0 ? ((meaningfulness.rows[0].low / total) * 100).toFixed(1) : 0}%)`);
  console.log(`   Null confidence: ${meaningfulness.rows[0].null_conf} (${total > 0 ? ((meaningfulness.rows[0].null_conf / total) * 100).toFixed(1) : 0}%)`);
  
  // 5. LLM vs Pattern quality comparison
  const qualityComparison = await pool.query(`
    SELECT 
      extraction_method,
      COUNT(*) as count,
      AVG(confidence) as avg_conf,
      COUNT(*) FILTER (WHERE confidence >= 0.8) as high_conf_count,
      COUNT(DISTINCT category) as unique_categories
    FROM requirements
    WHERE extraction_method IS NOT NULL
    GROUP BY extraction_method
    ORDER BY avg_conf DESC
  `);
  
  console.log('\n⚖️  Extraction Method Quality:');
  qualityComparison.rows.forEach((row: any) => {
    const highConfPct = row.count > 0 ? ((row.high_conf_count / row.count) * 100).toFixed(1) : '0';
    console.log(`   ${row.extraction_method}: ${row.count} reqs, Avg conf: ${parseFloat(row.avg_conf || '0').toFixed(2)}, High conf: ${highConfPct}%, Categories: ${row.unique_categories}`);
  });
  
  // 6. Pattern learning effectiveness
  const patterns = await pool.query(`
    SELECT 
      COUNT(*) as total_patterns,
      COUNT(DISTINCT host) as unique_hosts,
      AVG(confidence) as avg_conf,
      AVG(success_rate) as avg_success_rate,
      SUM(usage_count) as total_usage
    FROM extraction_patterns
  `);
  
  console.log('\n🧠 Pattern Learning:');
  console.log(`   Total patterns: ${patterns.rows[0].total_patterns}`);
  console.log(`   Unique hosts: ${patterns.rows[0].unique_hosts}`);
  console.log(`   Avg confidence: ${parseFloat(patterns.rows[0].avg_conf || '0').toFixed(2)}`);
  console.log(`   Avg success rate: ${parseFloat(patterns.rows[0].avg_success_rate || '0').toFixed(1)}%`);
  console.log(`   Total usage: ${patterns.rows[0].total_usage}`);
  
  process.exit(0);
}

analyzeRequirements().catch(err => {
  console.error('❌ Analysis failed:', err);
  process.exit(1);
});

