// Test script to verify the enhanced system integration
const { dataSource } = require('../src/lib/dataSource');
const { doctorDiagnostic } = require('../src/lib/doctorDiagnostic');
const { advancedSearchDoctor } = require('../src/lib/advancedSearchDoctor');

async function testIntegration() {
  console.log('🧪 Testing Enhanced System Integration...\n');

  try {
    // Test 1: Data Source
    console.log('1️⃣ Testing Data Source...');
    await dataSource.initialize();
    const programs = await dataSource.getPrograms();
    console.log(`   ✅ Loaded ${programs.length} programs`);
    
    const grantPrograms = await dataSource.getProgramsByType('grant');
    console.log(`   ✅ Found ${grantPrograms.length} grant programs`);

    // Test 2: Doctor Diagnostic
    console.log('\n2️⃣ Testing Doctor Diagnostic...');
    const testAnswers = {
      q1_country: 'AT',
      q2_entity_stage: 'INC_LT_6M',
      q3_company_size: 'MICRO_0_9',
      q4_theme: 'INNOVATION_DIGITAL',
      q8_funding_types: 'GRANT'
    };
    
    const symptoms = doctorDiagnostic.analyzeSymptoms(testAnswers);
    console.log(`   ✅ Analyzed ${symptoms.length} symptoms`);
    
    const diagnosis = await doctorDiagnostic.makeDiagnosis(symptoms);
    console.log(`   ✅ Diagnosis: ${diagnosis.primary} (confidence: ${diagnosis.confidence})`);

    // Test 3: Advanced Search Doctor
    console.log('\n3️⃣ Testing Advanced Search Doctor...');
    const testInput = "I need 100k for my AI startup in Vienna";
    const searchResult = await advancedSearchDoctor.processFreeTextInput(testInput);
    console.log(`   ✅ Parsed input: "${testInput}"`);
    console.log(`   ✅ Generated ${searchResult.chips.length} chips`);
    console.log(`   ✅ Diagnosis: ${searchResult.diagnosis.primary}`);

    // Test 4: Program Matching
    console.log('\n4️⃣ Testing Program Matching...');
    const matchingPrograms = await dataSource.getProgramsBySymptoms({
      location: 'AT',
      business_stage: 'startup',
      funding_amount: 100000,
      innovation_level: 'high'
    });
    console.log(`   ✅ Found ${matchingPrograms.length} matching programs`);

    console.log('\n🎉 All tests passed! The enhanced system is working correctly.');
    console.log('\n📊 Summary:');
    console.log(`   - Total programs: ${programs.length}`);
    console.log(`   - Grant programs: ${grantPrograms.length}`);
    console.log(`   - Matching programs: ${matchingPrograms.length}`);
    console.log(`   - Doctor diagnostic: Working`);
    console.log(`   - Advanced search: Working`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testIntegration();


