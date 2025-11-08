#!/usr/bin/env tsx

/**
 * Analyze Actual Requirement Values
 * What are we actually extracting? What should we extract?
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
  console.log('📊 Requirement Values Analysis\n');
  
  const pool = getPool();
  
  // 1. Get all categories with sample values
  const categoriesResult = await pool.query(`
    SELECT 
      r.category,
      r.type,
      COUNT(*) as count,
      AVG(r.meaningfulness_score) as avg_meaningfulness,
      STRING_AGG(DISTINCT LEFT(r.value, 100), ' | ') as sample_values
    FROM requirements r
    JOIN pages p ON r.page_id = p.id
    WHERE p.fetched_at > NOW() - INTERVAL '7 days'
    GROUP BY r.category, r.type
    ORDER BY r.category, count DESC
  `);
  
  console.log('📋 All Categories & Types with Sample Values:\n');
  
  let currentCategory = '';
  categoriesResult.rows.forEach((row: any) => {
    if (row.category !== currentCategory) {
      currentCategory = row.category;
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📁 ${currentCategory.toUpperCase()} (${row.count} requirements, avg meaningfulness: ${parseFloat(row.avg_meaningfulness || 0).toFixed(1)}/100)`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
    }
    
    const samples = row.sample_values.split(' | ').slice(0, 5);
    console.log(`  • ${row.type || 'N/A'}: ${row.count} requirements`);
    console.log(`    Avg Meaningfulness: ${parseFloat(row.avg_meaningfulness || 0).toFixed(1)}/100`);
    console.log(`    Sample Values:`);
    samples.forEach((sample: string, idx: number) => {
      const truncated = sample.length > 80 ? sample.substring(0, 80) + '...' : sample;
      console.log(`      ${idx + 1}. ${truncated}`);
    });
    console.log('');
  });
  
  // 2. Analyze "other" category in detail
  const otherResult = await pool.query(`
    SELECT 
      r.type,
      r.value,
      r.meaningfulness_score,
      p.title
    FROM requirements r
    JOIN pages p ON r.page_id = p.id
    WHERE r.category = 'other' 
      AND p.fetched_at > NOW() - INTERVAL '7 days'
    ORDER BY r.meaningfulness_score DESC
    LIMIT 30
  `);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 "OTHER" Category Analysis (Top 30 by Meaningfulness):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  const otherByType: Record<string, number> = {};
  otherResult.rows.forEach((row: any) => {
    const type = row.type || 'unknown';
    otherByType[type] = (otherByType[type] || 0) + 1;
    
    const valueStr = typeof row.value === 'string' 
      ? row.value.substring(0, 120) 
      : JSON.stringify(row.value).substring(0, 120);
    console.log(`[${type}] (${row.meaningfulness_score}/100)`);
    console.log(`  Value: ${valueStr}${valueStr.length >= 120 ? '...' : ''}`);
    console.log(`  Page: ${row.title || 'N/A'}`);
    console.log('');
  });
  
  console.log('\n📊 "OTHER" Category Breakdown by Type:');
  Object.entries(otherByType)
    .sort((a, b) => b[1] - a[1])
    .forEach(([type, count]) => {
      console.log(`  • ${type}: ${count} requirements`);
    });
  
  // 3. Check if eligibility, project, impact are properly split
  const splitCheck = await pool.query(`
    SELECT 
      r.category,
      COUNT(DISTINCT r.type) as type_count,
      COUNT(*) as total_count,
      STRING_AGG(DISTINCT r.type, ', ') as types
    FROM requirements r
    JOIN pages p ON r.page_id = p.id
    WHERE p.fetched_at > NOW() - INTERVAL '7 days'
      AND r.category IN ('eligibility', 'project', 'impact')
    GROUP BY r.category
    ORDER BY r.category
  `);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Are Eligibility, Project, Impact Properly Split?');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  splitCheck.rows.forEach((row: any) => {
    console.log(`📁 ${row.category.toUpperCase()}:`);
    console.log(`   Total Requirements: ${row.total_count}`);
    console.log(`   Types: ${row.type_count}`);
    console.log(`   Type List: ${row.types}`);
    console.log('');
  });
  
  // 4. Find requirements that might be in wrong category
  const misclassified = await pool.query(`
    SELECT 
      r.category,
      r.type,
      r.value,
      r.meaningfulness_score
    FROM requirements r
    JOIN pages p ON r.page_id = p.id
    WHERE p.fetched_at > NOW() - INTERVAL '7 days'
      AND (
        (r.category = 'other' AND r.type IN ('application_process', 'evaluation_criteria', 'restrictions'))
        OR (r.category = 'eligibility' AND r.type IN ('target_group', 'industry'))
        OR (r.category = 'financial' AND r.type IN ('funding_type'))
      )
    ORDER BY r.meaningfulness_score DESC
    LIMIT 20
  `);
  
  if (misclassified.rows.length > 0) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  Potentially Misclassified Requirements:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    misclassified.rows.forEach((row: any, idx: number) => {
      const valueStr = typeof row.value === 'string' 
        ? row.value.substring(0, 100) 
        : JSON.stringify(row.value).substring(0, 100);
      console.log(`${idx + 1}. [${row.category}] ${row.type}`);
      console.log(`   Value: ${valueStr}${valueStr.length >= 100 ? '...' : ''}`);
      console.log(`   Meaningfulness: ${row.meaningfulness_score}/100`);
      console.log(`   ⚠️  Should this be in a different category?`);
      console.log('');
    });
  }
  
  // 5. Geographic requirements analysis
  const geoResult = await pool.query(`
    SELECT 
      r.value,
      r.meaningfulness_score,
      p.title
    FROM requirements r
    JOIN pages p ON r.page_id = p.id
    WHERE r.category = 'geographic'
      AND p.fetched_at > NOW() - INTERVAL '7 days'
    ORDER BY r.meaningfulness_score DESC
    LIMIT 20
  `);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🌍 Geographic Requirements Analysis:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  geoResult.rows.forEach((row: any, idx: number) => {
    const valueStr = typeof row.value === 'string' ? row.value : JSON.stringify(row.value);
    console.log(`${idx + 1}. (${row.meaningfulness_score}/100) ${valueStr}`);
    console.log(`   Page: ${row.title || 'N/A'}`);
    console.log('');
  });
  
  console.log('✅ Analysis Complete!\n');
}

main().catch(console.error);

