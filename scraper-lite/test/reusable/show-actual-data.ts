#!/usr/bin/env tsx

/**
 * Show Actual Requirements and Metadata
 * What are we actually extracting?
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
  console.log('📋 Actual Requirements & Metadata Analysis\n');
  
  const pool = getPool();
  
  // 1. Show actual metadata fields
  const metadataResult = await pool.query(`
    SELECT 
      p.id,
      p.url,
      p.title,
      p.funding_amount_min,
      p.funding_amount_max,
      p.currency,
      p.deadline,
      p.open_deadline,
      p.contact_email,
      p.contact_phone,
      p.funding_types,
      p.program_focus,
      p.region,
      p.metadata_json
    FROM pages p
    WHERE p.fetched_at > NOW() - INTERVAL '7 days'
    ORDER BY p.id DESC
    LIMIT 5
  `);
  
  console.log('📄 Sample Pages - Metadata Fields:\n');
  metadataResult.rows.forEach((page: any, idx: number) => {
    console.log(`${idx + 1}. ${page.title || page.url.substring(0, 60)}`);
    console.log(`   URL: ${page.url}`);
    console.log(`   Funding Amount: ${page.funding_amount_min || 'N/A'} - ${page.funding_amount_max || 'N/A'} ${page.currency || 'EUR'}`);
    console.log(`   Deadline: ${page.deadline || (page.open_deadline ? 'Rolling' : 'N/A')}`);
    console.log(`   Contact: ${page.contact_email || 'N/A'} / ${page.contact_phone || 'N/A'}`);
    console.log(`   Funding Types: ${(page.funding_types || []).join(', ') || 'NONE'}`);
    console.log(`   Program Focus: ${(page.program_focus || []).join(', ') || 'NONE'}`);
    console.log(`   Region: ${page.region || 'N/A'}`);
    console.log(`   Metadata JSON Keys: ${Object.keys(page.metadata_json || {}).join(', ') || 'NONE'}`);
    console.log('');
  });
  
  // 2. Show actual requirement categories and types
  const reqCategoriesResult = await pool.query(`
    SELECT 
      r.category,
      r.type,
      COUNT(*) as count,
      AVG(r.meaningfulness_score) as avg_meaningfulness,
      AVG(r.confidence) as avg_confidence
    FROM requirements r
    JOIN pages p ON r.page_id = p.id
    WHERE p.fetched_at > NOW() - INTERVAL '7 days'
    GROUP BY r.category, r.type
    ORDER BY count DESC
    LIMIT 30
  `);
  
  console.log('🔍 Requirement Categories & Types (Top 30):\n');
  reqCategoriesResult.rows.forEach((row: any, idx: number) => {
    console.log(`${idx + 1}. [${row.category}] ${row.type || 'N/A'}`);
    console.log(`   Count: ${row.count}, Meaningfulness: ${parseFloat(row.avg_meaningfulness || 0).toFixed(1)}/100, Confidence: ${(parseFloat(row.avg_confidence || 0) * 100).toFixed(1)}%`);
  });
  
  // 3. Show sample requirement values
  const sampleReqsResult = await pool.query(`
    SELECT 
      p.title,
      r.category,
      r.type,
      r.value,
      r.meaningfulness_score,
      r.confidence
    FROM requirements r
    JOIN pages p ON r.page_id = p.id
    WHERE p.fetched_at > NOW() - INTERVAL '7 days'
      AND r.meaningfulness_score >= 50
    ORDER BY r.meaningfulness_score DESC
    LIMIT 20
  `);
  
  console.log('\n✨ Sample High-Quality Requirements (Meaningfulness >= 50):\n');
  sampleReqsResult.rows.forEach((row: any, idx: number) => {
    const valueStr = typeof row.value === 'string' 
      ? row.value.substring(0, 150) 
      : JSON.stringify(row.value).substring(0, 150);
    console.log(`${idx + 1}. [${row.category}] ${row.type}`);
    console.log(`   Page: ${row.title || 'N/A'}`);
    console.log(`   Value: ${valueStr}${valueStr.length >= 150 ? '...' : ''}`);
    console.log(`   Meaningfulness: ${row.meaningfulness_score}/100, Confidence: ${(parseFloat(row.confidence || 0) * 100).toFixed(1)}%`);
    console.log('');
  });
  
  // 4. Show low-quality requirements (to understand what's wrong)
  const lowQualityResult = await pool.query(`
    SELECT 
      r.category,
      r.type,
      r.value,
      r.meaningfulness_score
    FROM requirements r
    JOIN pages p ON r.page_id = p.id
    WHERE p.fetched_at > NOW() - INTERVAL '7 days'
      AND r.meaningfulness_score < 30
    ORDER BY r.meaningfulness_score ASC
    LIMIT 15
  `);
  
  console.log('⚠️  Sample Low-Quality Requirements (Meaningfulness < 30):\n');
  lowQualityResult.rows.forEach((row: any, idx: number) => {
    const valueStr = typeof row.value === 'string' 
      ? row.value.substring(0, 100) 
      : JSON.stringify(row.value).substring(0, 100);
    console.log(`${idx + 1}. [${row.category}] ${row.type || 'N/A'}`);
    console.log(`   Value: ${valueStr}${valueStr.length >= 100 ? '...' : ''}`);
    console.log(`   Meaningfulness: ${row.meaningfulness_score}/100 (WHY SO LOW?)`);
    console.log('');
  });
  
  // 5. Check for overview pages
  const overviewResult = await pool.query(`
    SELECT 
      p.url,
      p.title,
      p.metadata_json->>'is_overview_page' as is_overview,
      COUNT(r.id) as requirement_count
    FROM pages p
    LEFT JOIN requirements r ON p.id = r.page_id
    WHERE p.fetched_at > NOW() - INTERVAL '7 days'
    GROUP BY p.id, p.url, p.title, p.metadata_json
    HAVING p.metadata_json->>'is_overview_page' = 'true'
    LIMIT 10
  `);
  
  console.log('📋 Overview Pages Detected:\n');
  if (overviewResult.rows.length > 0) {
    overviewResult.rows.forEach((row: any, idx: number) => {
      console.log(`${idx + 1}. ${row.title || row.url.substring(0, 60)}`);
      console.log(`   URL: ${row.url}`);
      console.log(`   Requirements: ${row.requirement_count}`);
      console.log('');
    });
  } else {
    console.log('   No overview pages detected in metadata\n');
  }
  
  // 6. Check for login pages
  const loginResult = await pool.query(`
    SELECT 
      p.url,
      p.title,
      p.metadata_json->>'requires_login' as requires_login,
      COUNT(r.id) as requirement_count
    FROM pages p
    LEFT JOIN requirements r ON p.id = r.page_id
    WHERE p.fetched_at > NOW() - INTERVAL '7 days'
      AND (p.metadata_json->>'requires_login' = 'true' 
           OR p.url ILIKE '%login%' 
           OR p.url ILIKE '%anmeldung%'
           OR p.title ILIKE '%login%')
    GROUP BY p.id, p.url, p.title, p.metadata_json
    LIMIT 10
  `);
  
  console.log('🔐 Potential Login Pages:\n');
  if (loginResult.rows.length > 0) {
    loginResult.rows.forEach((row: any, idx: number) => {
      console.log(`${idx + 1}. ${row.title || row.url.substring(0, 60)}`);
      console.log(`   URL: ${row.url}`);
      console.log(`   Requires Login: ${row.requires_login || 'Not marked'}`);
      console.log(`   Requirements: ${row.requirement_count}`);
      console.log('');
    });
  } else {
    console.log('   No login pages detected\n');
  }
  
  console.log('✅ Analysis Complete!\n');
}

main().catch(console.error);

