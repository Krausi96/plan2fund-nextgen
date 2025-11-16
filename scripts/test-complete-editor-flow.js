/**
 * Complete Editor Flow Test Script
 * 
 * Run this in browser console to test the complete editor flow:
 * 1. Open /editor in browser
 * 2. Open console (F12)
 * 3. Copy and paste this entire script
 * 4. Run: testCompleteEditorFlow()
 * 
 * This will test:
 * - Template loading
 * - Section creation
 * - Content writing
 * - Table creation
 * - Chart generation
 * - Preview rendering
 */

async function testCompleteEditorFlow() {
  console.log('🧪 COMPLETE EDITOR FLOW TEST');
  console.log('='.repeat(60));
  const results = [];

  // Test 1: Check Editor Loaded
  try {
    console.log('\n1️⃣ Testing Editor Components...');
    const editor = document.querySelector('main') || document.body;
    const unifiedBox = document.querySelector('[class*="rounded-xl"]');
    const questionsCard = document.querySelector('[class*="blue-50"]');
    const textEditor = document.querySelector('textarea');
    const addTableBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent?.includes('Add Table') || b.textContent?.includes('➕')
    );

    const checks = {
      'Editor Container': !!editor,
      'Unified Box': !!unifiedBox,
      'Questions Card': !!questionsCard,
      'Text Editor': !!textEditor,
      'Add Table Button': !!addTableBtn
    };

    const allFound = Object.values(checks).every(v => v);
    results.push({
      test: 'Editor Components',
      status: allFound ? '✅' : '⚠️',
      message: allFound ? 'All components found' : 'Some components missing',
      data: checks
    });

    Object.entries(checks).forEach(([name, found]) => {
      console.log(`   ${found ? '✅' : '❌'} ${name}`);
    });
  } catch (error) {
    results.push({ test: 'Editor Components', status: '❌', message: error.message });
  }

  // Test 2: Check localStorage Data
  try {
    console.log('\n2️⃣ Testing localStorage Data...');
    const planSections = localStorage.getItem('planSections');
    const selectedProgram = localStorage.getItem('selectedProgram');

    if (planSections) {
      const sections = JSON.parse(planSections);
      const sectionsWithContent = sections.filter(s => s.content && s.content.trim().length > 0);
      const sectionsWithTables = sections.filter(s => s.tables && Object.keys(s.tables).length > 0);
      const sectionsWithCharts = sections.filter(s => s.chartTypes && Object.keys(s.chartTypes).length > 0);

      results.push({
        test: 'localStorage Data',
        status: '✅',
        message: `Found ${sections.length} sections`,
        data: {
          total: sections.length,
          withContent: sectionsWithContent.length,
          withTables: sectionsWithTables.length,
          withCharts: sectionsWithCharts.length
        }
      });

      console.log(`   ✅ ${sections.length} sections`);
      console.log(`   ✅ ${sectionsWithContent.length} with content`);
      console.log(`   ✅ ${sectionsWithTables.length} with tables`);
      console.log(`   ✅ ${sectionsWithCharts.length} with charts`);
    } else {
      results.push({ test: 'localStorage Data', status: '⚠️', message: 'No plan data found' });
      console.log('   ⚠️ No plan data - create a plan first');
    }

    if (selectedProgram) {
      const program = JSON.parse(selectedProgram);
      console.log(`   ✅ Program: ${program.name || program.id}`);
    }
  } catch (error) {
    results.push({ test: 'localStorage Data', status: '❌', message: error.message });
  }

  // Test 3: Test Table Creation Flow
  try {
    console.log('\n3️⃣ Testing Table Creation...');
    const addTableBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent?.includes('Add Table') || b.textContent?.includes('➕')
    );

    if (addTableBtn) {
      console.log('   ✅ Add Table button found');
      console.log('   💡 Click the button to test inline creator');
      
      results.push({
        test: 'Table Creation UI',
        status: '✅',
        message: 'Add Table button available'
      });
    } else {
      results.push({
        test: 'Table Creation UI',
        status: '❌',
        message: 'Add Table button not found'
      });
    }
  } catch (error) {
    results.push({ test: 'Table Creation', status: '❌', message: error.message });
  }

  // Test 4: Check Preview Data
  try {
    console.log('\n4️⃣ Testing Preview Data Structure...');
    const planSections = localStorage.getItem('planSections');
    
    if (planSections) {
      const sections = JSON.parse(planSections);
      const sectionsWithTables = sections.filter(s => s.tables && Object.keys(s.tables).length > 0);
      
      if (sectionsWithTables.length > 0) {
        const testSection = sectionsWithTables[0];
        const hasTables = testSection.tables && Object.keys(testSection.tables).length > 0;
        const hasChartTypes = testSection.chartTypes && Object.keys(testSection.chartTypes).length > 0;
        const hasContent = testSection.content && testSection.content.trim().length > 0;

        const previewReady = hasContent && hasTables && hasChartTypes;

        results.push({
          test: 'Preview Data Structure',
          status: previewReady ? '✅' : '⚠️',
          message: previewReady 
            ? 'Section has content, tables, and charts - ready for preview'
            : `Missing: content=${!hasContent}, tables=${!hasTables}, charts=${!hasChartTypes}`,
          data: {
            section: testSection.title || testSection.key,
            hasContent,
            hasTables,
            hasChartTypes,
            tableKeys: hasTables ? Object.keys(testSection.tables) : [],
            chartKeys: hasChartTypes ? Object.keys(testSection.chartTypes) : []
          }
        });

        console.log(`   ${previewReady ? '✅' : '⚠️'} Preview readiness:`, {
          content: hasContent,
          tables: hasTables,
          charts: hasChartTypes
        });
      } else {
        results.push({
          test: 'Preview Data Structure',
          status: '⚠️',
          message: 'No sections with tables found - create tables first'
        });
        console.log('   ⚠️ No tables found - create tables to test preview');
      }
    }
  } catch (error) {
    results.push({ test: 'Preview Data', status: '❌', message: error.message });
  }

  // Test 5: Simulate Complete Plan
  try {
    console.log('\n5️⃣ Testing Complete Plan Structure...');
    const planSections = localStorage.getItem('planSections');
    
    if (planSections) {
      const sections = JSON.parse(planSections);
      
      const completePlan = {
        totalSections: sections.length,
        sectionsWithContent: sections.filter(s => s.content && s.content.trim().length > 0).length,
        sectionsWithTables: sections.filter(s => s.tables && Object.keys(s.tables || {}).length > 0).length,
        sectionsWithCharts: sections.filter(s => s.chartTypes && Object.keys(s.chartTypes || {}).length > 0).length,
        totalTables: sections.reduce((sum, s) => sum + Object.keys(s.tables || {}).length, 0),
        totalCharts: sections.reduce((sum, s) => sum + Object.keys(s.chartTypes || {}).length, 0)
      };

      const isComplete = completePlan.sectionsWithContent > 0 && 
                        completePlan.sectionsWithTables > 0 &&
                        completePlan.sectionsWithCharts > 0;

      results.push({
        test: 'Complete Plan Structure',
        status: isComplete ? '✅' : '⚠️',
        message: isComplete
          ? 'Plan has content, tables, and charts'
          : 'Plan missing some components',
        data: completePlan
      });

      console.log('   Plan Structure:', completePlan);
      console.log(`   ${isComplete ? '✅' : '⚠️'} Complete: ${isComplete}`);
    }
  } catch (error) {
    results.push({ test: 'Complete Plan', status: '❌', message: error.message });
  }

  // Test 6: Check Preview Page Compatibility
  try {
    console.log('\n6️⃣ Testing Preview Compatibility...');
    const planSections = localStorage.getItem('planSections');
    
    if (planSections) {
      const sections = JSON.parse(planSections);
      
      // Check if data structure matches what preview expects
      const previewCompatible = sections.every(s => {
        const hasId = s.id || s.key;
        const hasTitle = s.title;
        const hasTables = s.tables !== undefined;
        const hasChartTypes = s.chartTypes !== undefined;
        return hasId && hasTitle && hasTables && hasChartTypes;
      });

      results.push({
        test: 'Preview Compatibility',
        status: previewCompatible ? '✅' : '⚠️',
        message: previewCompatible
          ? 'Data structure compatible with preview'
          : 'Data structure may not be compatible',
        data: {
          compatible: previewCompatible,
          sampleSection: sections[0] ? {
            hasId: !!(sections[0].id || sections[0].key),
            hasTitle: !!sections[0].title,
            hasTables: sections[0].tables !== undefined,
            hasChartTypes: sections[0].chartTypes !== undefined
          } : null
        }
      });

      console.log(`   ${previewCompatible ? '✅' : '⚠️'} Preview compatible: ${previewCompatible}`);
    }
  } catch (error) {
    results.push({ test: 'Preview Compatibility', status: '❌', message: error.message });
  }

  // Summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.status} ${r.test}: ${r.message}`);
    if (r.data) {
      console.log(`   Data:`, r.data);
    }
  });

  const passed = results.filter(r => r.status === '✅').length;
  const warnings = results.filter(r => r.status === '⚠️').length;
  const failed = results.filter(r => r.status === '❌').length;

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${results.length} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️ Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}`);

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (failed > 0) {
    console.log('   ❌ Fix failed tests first');
  }
  if (warnings > 0) {
    console.log('   ⚠️ Review warnings - may need user action');
  }
  console.log('   📋 Next: Test preview page with tables/charts');
  console.log('   🔍 Verify ExportRenderer shows tables/charts');

  return {
    success: failed === 0,
    results,
    summary: { total: results.length, passed, warnings, failed }
  };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.testCompleteEditorFlow = testCompleteEditorFlow;
  console.log('✅ Complete test script loaded!');
  console.log('📋 Run: testCompleteEditorFlow()');
}

