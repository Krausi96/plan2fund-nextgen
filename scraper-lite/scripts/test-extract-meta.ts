#!/usr/bin/env ts-node
/**
 * Test extractMeta function directly
 */

import * as fs from 'fs';
import * as path from 'path';
import { extractMeta } from '../src/extract';

const rawDir = path.join(__dirname, '..', 'data', 'lite', 'raw');
const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.html')).slice(0, 3);

console.log('\n🧪 TESTING EXTRACTMETA() DIRECTLY\n');
console.log('='.repeat(70));

files.forEach((file, idx) => {
  console.log(`\n📄 Test ${idx + 1}: ${file.substring(0, 40)}...`);
  console.log('-'.repeat(70));
  
  try {
    const html = fs.readFileSync(path.join(rawDir, file), 'utf8');
    const url = 'https://example.com/test';
    const result = extractMeta(html, url);
    
    console.log(`Title: ${result.title?.substring(0, 50) || 'NULL'}`);
    console.log(`Funding min: ${result.funding_amount_min || 'NULL'}`);
    console.log(`Funding max: ${result.funding_amount_max || 'NULL'}`);
    console.log(`Deadline: ${result.deadline || (result.open_deadline ? 'OPEN' : 'NULL')}`);
    console.log(`Email: ${result.contact_email || 'NULL'}`);
    console.log(`Phone: ${result.contact_phone || 'NULL'}`);
    
    const hasMetadata = result.funding_amount_min || result.funding_amount_max || 
                       result.deadline || result.contact_email || result.contact_phone;
    console.log(`\n${hasMetadata ? '✅' : '❌'} Metadata extraction: ${hasMetadata ? 'SUCCESS' : 'FAILED'}`);
    
  } catch (e: any) {
    console.log(`❌ ERROR: ${e.message}`);
    console.log(e.stack);
  }
});

console.log('\n' + '='.repeat(70));




