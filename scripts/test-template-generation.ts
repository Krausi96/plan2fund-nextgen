/**
 * Test script for LLM template generation
 * Tests templateGenerator.ts with a real program from database
 */

import { generateTemplatesFromRequirements } from '../shared/lib/templateGenerator';
import { loadProgramSections } from '../shared/lib/templates/program-overrides';

async function testTemplateGeneration() {
  console.log('🧪 Testing LLM Template Generation\n');
  
  // Check if API key is available
  if (!process.env.OPENAI_API_KEY) {
    console.warn('⚠️  OPENAI_API_KEY not set - LLM generation will be disabled');
    console.log('   Set OPENAI_API_KEY in .env to test LLM generation\n');
  }
  
  // Test 1: Direct LLM generation with mock data
  console.log('Test 1: Direct LLM generation with mock requirements');
  try {
    const mockRequirements = {
      programId: 'test_program_1',
      programName: 'Test Sustainability Grant',
      categorized_requirements: {
        eligibility_criteria: [
          { value: 'Companies must focus on environmental sustainability', type: 'eligibility' },
          { value: 'Minimum 2 years in operation', type: 'eligibility' }
        ],
        environmental_impact: [
          { value: 'Must demonstrate significant CO2 reduction', type: 'impact' },
          { value: 'Environmental benefits must be measurable', type: 'impact' }
        ],
        innovation_focus: [
          { value: 'Green technology solutions', type: 'innovation' },
          { value: 'Renewable energy projects', type: 'innovation' }
        ],
        funding_amount_max: [
          { value: 'Up to €500,000', type: 'financial' }
        ]
      },
      metadata: {
        funding_types: ['grants'],
        program_focus: ['sustainability', 'environment'],
        region: 'Austria'
      }
    };
    
    const generated = await generateTemplatesFromRequirements(mockRequirements);
    
    if (generated.length > 0) {
      console.log(`✅ Generated ${generated.length} templates`);
      console.log('\nSample template:');
      const sample = generated[0];
      console.log(`  - ID: ${sample.id}`);
      console.log(`  - Title: ${sample.title}`);
      console.log(`  - Description: ${sample.description.substring(0, 100)}...`);
      console.log(`  - Prompts: ${sample.prompts.length} prompts`);
      console.log(`  - Source: ${sample.source?.version || 'N/A'}`);
      console.log(`  - Word count: ${sample.wordCountMin}-${sample.wordCountMax}`);
    } else {
      console.log('⚠️  No templates generated (check API key and LLM response)');
    }
  } catch (error: any) {
    console.error('❌ Test 1 failed:', error?.message || String(error));
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Test 2: Integration with loadProgramSections (requires database)
  console.log('Test 2: Integration with loadProgramSections');
  console.log('Note: This requires a valid program ID from database\n');
  
  // Try to get a program ID from environment or use a test one
  const testProgramId = process.env.TEST_PROGRAM_ID || '1';
  
  try {
    console.log(`Attempting to load sections for program ID: ${testProgramId}`);
    const sections = await loadProgramSections(testProgramId);
    
    if (sections.length > 0) {
      console.log(`✅ Loaded ${sections.length} sections`);
      
      // Check if any are LLM-generated
      const llmGenerated = sections.filter(s => s.source?.version?.includes('llm-generated'));
      const ruleBased = sections.filter(s => !s.source?.version?.includes('llm-generated'));
      
      console.log(`  - LLM-generated: ${llmGenerated.length}`);
      console.log(`  - Rule-based: ${ruleBased.length}`);
      
      if (llmGenerated.length > 0) {
        console.log('\n✅ LLM generation is working!');
        const sample = llmGenerated[0];
        console.log(`\nSample LLM template:`);
        console.log(`  - ID: ${sample.id}`);
        console.log(`  - Title: ${sample.title}`);
        console.log(`  - Prompts: ${sample.prompts.slice(0, 2).join(', ')}...`);
      } else {
        console.log('\n⚠️  No LLM-generated templates (falling back to rule-based)');
        console.log('   This is normal if:');
        console.log('   - OPENAI_API_KEY is not set');
        console.log('   - LLM generation failed');
        console.log('   - Program has no requirements in database');
      }
    } else {
      console.log('⚠️  No sections loaded (program may not exist in database)');
    }
  } catch (error: any) {
    console.error('❌ Test 2 failed:', error?.message || String(error));
    console.log('   This is expected if database is not accessible');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
  console.log('✅ Testing complete!\n');
}

// Run tests
testTemplateGeneration().catch(console.error);

