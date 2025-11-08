#!/usr/bin/env tsx

/**
 * Analyze Extracted Data Quality
 * Shows what data we're actually extracting and if it's correct
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
}
dotenv.config({ override: false });

import { getPool } from '../../db/db';

async function main() {
  console.log('📊 Extracted Data Quality Analysis\n');
  
  const pool = getPool();
  
  // 1. Overall statistics
  const statsResult = await pool.query(`
    SELECT 
      COUNT(*) as total_pages,
      COUNT(DISTINCT metadata_json->>'institution') as total_institutions,
      COUNT(*) FILTER (WHERE funding_amount_min IS NOT NULL OR funding_amount_max IS NOT NULL) as has_amount,
      COUNT(*) FILTER (WHERE deadline IS NOT NULL OR open_deadline = true) as has_deadline,
      COUNT(*) FILTER (WHERE contact_email IS NOT NULL) as has_email,
      COUNT(*) FILTER (WHERE contact_phone IS NOT NULL) as has_phone,
      AVG(array_length(funding_types, 1)) as avg_funding_types,
      COUNT(*) FILTER (WHERE array_length(funding_types, 1) > 0) as has_funding_types
    FROM pages
    WHERE fetched_at > NOW() - INTERVAL '7 days'
  `);
  
  const stats = statsResult.rows[0];
  
  console.log('📈 Overall Statistics (Last 7 Days):');
  console.log(`   Total Pages: ${stats.total_pages}`);
  console.log(`   Institutions: ${stats.total_institutions}`);
  console.log(`   Has Funding Amount: ${stats.has_amount} (${((stats.has_amount / stats.total_pages) * 100).toFixed(1)}%)`);
  console.log(`   Has Deadline: ${stats.has_deadline} (${((stats.has_deadline / stats.total_pages) * 100).toFixed(1)}%)`);
  console.log(`   Has Contact Email: ${stats.has_email} (${((stats.has_email / stats.total_pages) * 100).toFixed(1)}%)`);
  console.log(`   Has Contact Phone: ${stats.has_phone} (${((stats.has_phone / stats.total_pages) * 100).toFixed(1)}%)`);
  console.log(`   Has Funding Types: ${stats.has_funding_types} (${((stats.has_funding_types / stats.total_pages) * 100).toFixed(1)}%)`);
  console.log(`   Avg Funding Types per Page: ${parseFloat(stats.avg_funding_types || 0).toFixed(1)}\n`);
  
  // 2. Requirements extraction quality
  const reqResult = await pool.query(`
    SELECT 
      p.id,
      p.url,
      p.title,
      COUNT(r.id) as requirement_count,
      COUNT(DISTINCT r.category) as category_count,
      AVG(r.confidence) as avg_confidence,
      AVG(r.meaningfulness_score) as avg_meaningfulness
    FROM pages p
    LEFT JOIN requirements r ON p.id = r.page_id
    WHERE p.fetched_at > NOW() - INTERVAL '7 days'
    GROUP BY p.id, p.url, p.title
    ORDER BY requirement_count DESC
    LIMIT 10
  `);
  
  console.log('🔍 Top 10 Pages by Requirements Extracted:');
  reqResult.rows.forEach((row: any, idx: number) => {
    console.log(`\n   ${idx + 1}. ${row.title || row.url.substring(0, 60)}...`);
    console.log(`      URL: ${row.url.substring(0, 80)}`);
    console.log(`      Requirements: ${row.requirement_count}`);
    console.log(`      Categories: ${row.category_count}`);
    console.log(`      Avg Confidence: ${(parseFloat(row.avg_confidence || 0) * 100).toFixed(1)}%`);
    console.log(`      Avg Meaningfulness: ${parseFloat(row.avg_meaningfulness || 0).toFixed(1)}/100`);
  });
  
  // 3. Requirements by category
  const categoryResult = await pool.query(`
    SELECT 
      r.category,
      COUNT(*) as count,
      AVG(r.confidence) as avg_confidence,
      AVG(r.meaningfulness_score) as avg_meaningfulness
    FROM requirements r
    JOIN pages p ON r.page_id = p.id
    WHERE p.fetched_at > NOW() - INTERVAL '7 days'
    GROUP BY r.category
    ORDER BY count DESC
  `);
  
  console.log('\n📋 Requirements by Category:');
  categoryResult.rows.forEach((row: any) => {
    console.log(`   ${row.category}: ${row.count} requirements`);
    console.log(`      Confidence: ${(parseFloat(row.avg_confidence || 0) * 100).toFixed(1)}%`);
    console.log(`      Meaningfulness: ${parseFloat(row.avg_meaningfulness || 0).toFixed(1)}/100`);
  });
  
  // 4. Sample extracted requirements
  const sampleResult = await pool.query(`
    SELECT 
      p.title,
      p.url,
      r.category,
      r.type,
      r.value,
      r.confidence,
      r.meaningfulness_score
    FROM requirements r
    JOIN pages p ON r.page_id = p.id
    WHERE p.fetched_at > NOW() - INTERVAL '7 days'
      AND r.meaningfulness_score >= 50
    ORDER BY r.meaningfulness_score DESC
    LIMIT 15
  `);
  
  console.log('\n✨ Sample High-Quality Requirements (Top 15):');
  sampleResult.rows.forEach((row: any, idx: number) => {
    const valueStr = typeof row.value === 'string' 
      ? row.value.substring(0, 100) 
      : JSON.stringify(row.value).substring(0, 100);
    console.log(`\n   ${idx + 1}. [${row.category}] ${row.type}`);
    console.log(`      Page: ${row.title || row.url.substring(0, 60)}`);
    console.log(`      Value: ${valueStr}${valueStr.length >= 100 ? '...' : ''}`);
    console.log(`      Confidence: ${(parseFloat(row.confidence || 0) * 100).toFixed(1)}%`);
    console.log(`      Meaningfulness: ${row.meaningfulness_score}/100`);
  });
  
  // 5. Funding amounts analysis
  const amountResult = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE funding_amount_min IS NOT NULL) as has_min,
      COUNT(*) FILTER (WHERE funding_amount_max IS NOT NULL) as has_max,
      COUNT(*) FILTER (WHERE funding_amount_min IS NOT NULL AND funding_amount_max IS NOT NULL) as has_range,
      MIN(funding_amount_min) as min_amount,
      MAX(funding_amount_max) as max_amount,
      AVG(funding_amount_min) as avg_min,
      AVG(funding_amount_max) as avg_max
    FROM pages
    WHERE fetched_at > NOW() - INTERVAL '7 days'
      AND (funding_amount_min IS NOT NULL OR funding_amount_max IS NOT NULL)
  `);
  
  const amounts = amountResult.rows[0];
  if (amounts.total > 0) {
    console.log('\n💰 Funding Amounts Analysis:');
    console.log(`   Pages with Amounts: ${amounts.total}`);
    console.log(`   Has Min Amount: ${amounts.has_min}`);
    console.log(`   Has Max Amount: ${amounts.has_max}`);
    console.log(`   Has Range: ${amounts.has_range}`);
    console.log(`   Min Amount: ${amounts.min_amount ? parseFloat(amounts.min_amount).toLocaleString() : 'N/A'} EUR`);
    console.log(`   Max Amount: ${amounts.max_amount ? parseFloat(amounts.max_amount).toLocaleString() : 'N/A'} EUR`);
    console.log(`   Avg Min: ${amounts.avg_min ? parseFloat(amounts.avg_min).toLocaleString() : 'N/A'} EUR`);
    console.log(`   Avg Max: ${amounts.avg_max ? parseFloat(amounts.avg_max).toLocaleString() : 'N/A'} EUR`);
  }
  
  // 6. Quality issues
  const issuesResult = await pool.query(`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE title IS NULL OR title = '') as missing_title,
      COUNT(*) FILTER (WHERE description IS NULL OR description = '') as missing_description,
      COUNT(*) FILTER (WHERE funding_amount_min IS NULL AND funding_amount_max IS NULL) as missing_amount,
      COUNT(*) FILTER (WHERE deadline IS NULL AND open_deadline = false) as missing_deadline,
      COUNT(*) FILTER (WHERE array_length(funding_types, 1) = 0 OR funding_types IS NULL) as missing_funding_types
    FROM pages
    WHERE fetched_at > NOW() - INTERVAL '7 days'
  `);
  
  const issues = issuesResult.rows[0];
  console.log('\n⚠️  Data Completeness Issues:');
  console.log(`   Missing Title: ${issues.missing_title} (${((issues.missing_title / issues.total) * 100).toFixed(1)}%)`);
  console.log(`   Missing Description: ${issues.missing_description} (${((issues.missing_description / issues.total) * 100).toFixed(1)}%)`);
  console.log(`   Missing Amount: ${issues.missing_amount} (${((issues.missing_amount / issues.total) * 100).toFixed(1)}%)`);
  console.log(`   Missing Deadline: ${issues.missing_deadline} (${((issues.missing_deadline / issues.total) * 100).toFixed(1)}%)`);
  console.log(`   Missing Funding Types: ${issues.missing_funding_types} (${((issues.missing_funding_types / issues.total) * 100).toFixed(1)}%)`);
  
  // 7. What we're learning
  console.log('\n🧠 What We\'re Learning:');
  
  const learningResult = await pool.query(`
    SELECT 
      (SELECT COUNT(*) FROM classification_feedback) as feedback_count,
      (SELECT COUNT(*) FROM url_patterns) as url_patterns,
      (SELECT COUNT(*) FROM quality_rules) as quality_rules,
      (SELECT AVG(was_correct::int) * 100 FROM classification_feedback) as accuracy
  `);
  
  const learning = learningResult.rows[0];
  console.log(`   Classification Feedback: ${learning.feedback_count} records`);
  console.log(`   URL Patterns Learned: ${learning.url_patterns}`);
  console.log(`   Quality Rules Learned: ${learning.quality_rules}`);
  console.log(`   Classification Accuracy: ${parseFloat(learning.accuracy || 0).toFixed(1)}%`);
  
  console.log('\n✅ Analysis Complete!\n');
}

main().catch(console.error);

