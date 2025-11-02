#!/usr/bin/env node
/**
 * Debug script to test metadata extraction on real HTML files
 * Usage: node scripts/debug-extraction.js
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const rawDir = path.join(__dirname, '..', 'data', 'lite', 'raw');
const files = fs.readdirSync(rawDir).filter(f => f.endsWith('.html')).slice(0, 5);

console.log('\n🔍 DEBUGGING METADATA EXTRACTION\n');
console.log('='.repeat(70));

files.forEach((file, idx) => {
  console.log(`\n📄 File ${idx + 1}: ${file.substring(0, 50)}...`);
  console.log('-'.repeat(70));
  
  try {
    const html = fs.readFileSync(path.join(rawDir, file), 'utf8');
    const $ = cheerio.load(html);
    
    // Check text extraction (same as extract.ts)
    const text = $('body').clone().find('script,style,noscript').remove().end().text();
    const lower = text.toLowerCase();
    console.log(`✓ Text extracted: ${text.length} characters`);
    
    // Check for funding indicators
    const hasEuro = text.includes('€') || text.includes('EUR') || text.includes('euro');
    const hasNumbers = /\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/.test(text);
    const hasMillion = /\b(million|millionen|mio)\b/i.test(text);
    const hasAmountKeywords = /\b(bis zu|maximal|förderbetrag|förderhöhe|fördersumme|betrag|amount|up to|max|förderung|funding)\b/i.test(text);
    
    console.log(`✓ Has €/EUR/euro: ${hasEuro}`);
    console.log(`✓ Has number patterns: ${hasNumbers}`);
    console.log(`✓ Has million keywords: ${hasMillion}`);
    console.log(`✓ Has amount keywords: ${hasAmountKeywords}`);
    
    // Test patterns (same as extract.ts)
    const euroRe = /€\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/gi;
    const euroAfterRe = /(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)\s*€/gi;
    const millionRe = /(\d{1,3}(?:[.,]\d{3})?|\d(?:[.,]\d)?)\s*(million|millionen|mio\.?|Mio\.?)/gi;
    const nearRe = /(bis zu|maximal|förderbetrag|förderhöhe|fördersumme|betrag|amount|up to|max\.?)\s*[:\s]*€?\s*(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d{2})?)/gi;
    
    const euroMatches = Array.from(text.matchAll(euroRe));
    const euroAfterMatches = Array.from(text.matchAll(euroAfterRe));
    const millionMatches = Array.from(text.matchAll(millionRe));
    const nearMatches = Array.from(text.matchAll(nearRe));
    
    console.log(`\n📊 Pattern Matches:`);
    console.log(`  € before: ${euroMatches.length}`);
    console.log(`  € after: ${euroAfterMatches.length}`);
    console.log(`  Million: ${millionMatches.length}`);
    console.log(`  Near keywords: ${nearMatches.length}`);
    
    if (euroMatches.length > 0) {
      console.log(`  Sample € before: ${euroMatches[0][0].substring(0, 50)}`);
    }
    if (euroAfterMatches.length > 0) {
      console.log(`  Sample € after: ${euroAfterMatches[0][0].substring(0, 50)}`);
    }
    if (millionMatches.length > 0) {
      console.log(`  Sample million: ${millionMatches[0][0].substring(0, 50)}`);
    }
    if (nearMatches.length > 0) {
      console.log(`  Sample near: ${nearMatches[0][0].substring(0, 50)}`);
    }
    
    // Test parsing logic
    const amounts = [];
    const pushParsed = (raw, ctx) => {
      let s = raw.replace(/[^\d.,\s]/g, '').replace(/\s+/g, '');
      const lastComma = s.lastIndexOf(',');
      const lastDot = s.lastIndexOf('.');
      if (lastComma > lastDot) { 
        s = s.replace(/\./g, '').replace(/,(\d{1,2})$/, '.$1'); 
      } else { 
        s = s.replace(/,/g, ''); 
      }
      const n = parseFloat(s);
      if (!isNaN(n)) {
        if (/\b(million|millionen|mio)\b/i.test(ctx)) {
          amounts.push(Math.round(n * 1_000_000));
        } else {
          amounts.push(Math.round(n));
        }
      }
    };
    
    for (const m of euroMatches) pushParsed(m[1], m[0]);
    for (const m of euroAfterMatches) pushParsed(m[1], m[0]);
    for (const m of millionMatches) pushParsed(m[1], m[0]);
    for (const m of nearMatches) pushParsed(m[2], m[0]);
    
    console.log(`\n💰 Parsed Amounts: ${amounts.length > 0 ? amounts.join(', ') : 'NONE'}`);
    if (amounts.length > 0) {
      console.log(`  Min: ${Math.min(...amounts)}`);
      console.log(`  Max: ${Math.max(...amounts)}`);
    }
    
    // Check for dates/deadlines
    const datePatterns = [
      text.match(/(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})/),
      text.match(/(\d{2,4})[.\/-](\d{1,2})[.\/-](\d{1,2})/),
    ];
    const deadlineKeywords = /(deadline|frist|einreichfrist|bewerbungsfrist|einsendefrist|antragsfrist)/i.test(text);
    console.log(`\n📅 Deadline Check:`);
    console.log(`  Has date patterns: ${datePatterns.filter(Boolean).length > 0}`);
    console.log(`  Has deadline keywords: ${deadlineKeywords}`);
    
    // Check for contact info
    const emailMatches = Array.from(text.matchAll(/[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}/g));
    const phonePatterns = [
      /(?:\+43|0043|0)\s*(?:\(0\))?\s*(\d{1,4})[\s\/-]?(\d{3,4})[\s\/-]?(\d{3,8})/,
      /(?:\+\d{1,3}[\s-]?)?(?:\(?\d{2,4}\)?[\s-]?)?\d{3,4}[\s-]?\d{3,8}/
    ];
    let hasPhone = false;
    for (const pattern of phonePatterns) {
      if (pattern.test(text)) {
        hasPhone = true;
        break;
      }
    }
    
    console.log(`\n📧 Contact Check:`);
    console.log(`  Emails found: ${emailMatches.length}`);
    if (emailMatches.length > 0) {
      console.log(`  Sample: ${emailMatches[0][0]}`);
    }
    console.log(`  Phones found: ${hasPhone}`);
    
    // Summary
    const hasAnyMetadata = amounts.length > 0 || deadlineKeywords || emailMatches.length > 0 || hasPhone;
    if (!hasAnyMetadata && (hasEuro || hasMillion || hasAmountKeywords)) {
      console.log(`\n⚠️  ISSUE: Indicators found but extraction failed!`);
      console.log(`  This suggests patterns need adjustment.`);
    } else if (hasAnyMetadata) {
      console.log(`\n✅ Metadata found!`);
    } else {
      console.log(`\n⚠️  No metadata indicators found in this page.`);
    }
    
  } catch (e) {
    console.log(`❌ ERROR: ${e.message}`);
  }
});

console.log('\n' + '='.repeat(70));
