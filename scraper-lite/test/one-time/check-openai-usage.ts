#!/usr/bin/env ts-node

/**
 * Check OpenAI API usage and quota
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) dotenv.config({ path: envPath });
dotenv.config();

import OpenAI from 'openai';

async function checkUsage() {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY not set\n');
    return;
  }
  
  console.log('🔍 Checking OpenAI API status...\n');
  
  const openai = new OpenAI({ apiKey });
  
  try {
    // Try a simple test call
    console.log('📞 Testing API with a small request...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "test"' }],
      max_tokens: 5
    });
    
    console.log('✅ API is working!\n');
    console.log('Response:', response.choices[0]?.message?.content || 'No content');
    console.log('\nModel used:', response.model);
    console.log('Tokens used:', response.usage?.total_tokens || 'N/A');
    
  } catch (error: any) {
    if (error?.status === 429) {
      console.log('❌ Rate limit / Quota exceeded\n');
      console.log('Error:', error.message);
      console.log('\n💡 Solutions:');
      console.log('   1. Check your OpenAI dashboard: https://platform.openai.com/usage');
      console.log('   2. Add payment method: https://platform.openai.com/account/billing');
      console.log('   3. Wait for quota reset (usually monthly)');
      console.log('   4. Use DISABLE_LLM=true for pattern-only scraping');
    } else if (error?.status === 401) {
      console.log('❌ Invalid API key\n');
      console.log('Check your OPENAI_API_KEY in .env.local');
    } else {
      console.log('❌ Error:', error.message);
      console.log('Status:', error?.status);
    }
  }
}

checkUsage();

