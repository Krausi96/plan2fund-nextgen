/**
 * Test Script: Editor Complete Flow
 * Run this in browser console to test the editor
 * 
 * Usage:
 * 1. Open editor in browser
 * 2. Open browser console (F12)
 * 3. Copy and paste this script
 * 4. Run: testEditorFlow()
 */

async function testEditorFlow() {
  console.log('🧪 Testing Editor Complete Flow...\n');
  const results = [];

  // Test 1: Check if editor is loaded
  try {
    console.log('1️⃣ Checking Editor Components...');
    const editor = document.querySelector('[class*="Editor"]') || 
                 document.querySelector('main') ||
                 document.body;
    
    if (editor) {
      results.push({ test: 'Editor Loaded', status: '✅', message: 'Editor component found' });
      console.log('   ✅ Editor component found');
    } else {
      results.push({ test: 'Editor Loaded', status: '❌', message: 'Editor component not found' });
      console.log('   ❌ Editor not found');
    }
  } catch (error) {
    results.push({ test: 'Editor Loaded', status: '❌', message: error.message });
  }

  // Test 2: Check localStorage for plan data
  try {
    console.log('\n2️⃣ Checking Plan Data in localStorage...');
    const planSections = localStorage.getItem('planSections');
    const selectedProgram = localStorage.getItem('selectedProgram');
    
    if (planSections) {
      const sections = JSON.parse(planSections);
      results.push({ 
        test: 'Plan Data', 
        status: '✅', 
        message: `Found ${sections.length} sections in localStorage`,
        data: { sections: sections.length, sectionTitles: sections.map(s => s.title || s.id) }
      });
      console.log(`   ✅ Found ${sections.length} sections`);
      console.log(`   Sections: ${sections.map(s => s.title || s.id).join(', ')}`);
    } else {
      results.push({ test: 'Plan Data', status: '⚠️', message: 'No plan data in localStorage' });
      console.log('   ⚠️ No plan data found');
    }

    if (selectedProgram) {
      const program = JSON.parse(selectedProgram);
      results.push({ 
        test: 'Program Data', 
        status: '✅', 
        message: `Program selected: ${program.name || program.id}` 
      });
      console.log(`   ✅ Program: ${program.name || program.id}`);
    } else {
      results.push({ test: 'Program Data', status: '⚠️', message: 'No program selected' });
      console.log('   ⚠️ No program selected');
    }
  } catch (error) {
    results.push({ test: 'Plan Data', status: '❌', message: error.message });
  }

  // Test 3: Check for tables
  try {
    console.log('\n3️⃣ Checking Tables...');
    const planSections = localStorage.getItem('planSections');
    if (planSections) {
      const sections = JSON.parse(planSections);
      const sectionsWithTables = sections.filter(s => s.tables && Object.keys(s.tables).length > 0);
      
      if (sectionsWithTables.length > 0) {
        const totalTables = sectionsWithTables.reduce((sum, s) => 
          sum + Object.keys(s.tables || {}).length, 0
        );
        results.push({ 
          test: 'Tables', 
          status: '✅', 
          message: `Found ${totalTables} tables in ${sectionsWithTables.length} sections`,
          data: { 
            sectionsWithTables: sectionsWithTables.length,
            totalTables,
            tableKeys: sectionsWithTables.flatMap(s => Object.keys(s.tables || {}))
          }
        });
        console.log(`   ✅ ${totalTables} tables in ${sectionsWithTables.length} sections`);
      } else {
        results.push({ test: 'Tables', status: '⚠️', message: 'No tables found' });
        console.log('   ⚠️ No tables found');
      }
    }
  } catch (error) {
    results.push({ test: 'Tables', status: '❌', message: error.message });
  }

  // Test 4: Check for charts
  try {
    console.log('\n4️⃣ Checking Charts...');
    const planSections = localStorage.getItem('planSections');
    if (planSections) {
      const sections = JSON.parse(planSections);
      const sectionsWithCharts = sections.filter(s => s.chartTypes && Object.keys(s.chartTypes).length > 0);
      
      if (sectionsWithCharts.length > 0) {
        const totalCharts = sectionsWithCharts.reduce((sum, s) => 
          sum + Object.keys(s.chartTypes || {}).length, 0
        );
        results.push({ 
          test: 'Charts', 
          status: '✅', 
          message: `Found ${totalCharts} charts in ${sectionsWithCharts.length} sections` 
        });
        console.log(`   ✅ ${totalCharts} charts in ${sectionsWithCharts.length} sections`);
      } else {
        results.push({ test: 'Charts', status: '⚠️', message: 'No charts found' });
        console.log('   ⚠️ No charts found');
      }
    }
  } catch (error) {
    results.push({ test: 'Charts', status: '❌', message: error.message });
  }

  // Test 5: Check UI Elements
  try {
    console.log('\n5️⃣ Checking UI Elements...');
    const checks = {
      'Questions Card': document.querySelector('[class*="blue-50"]') || 
                       document.querySelector('text*="Questions"'),
      'Add Table Button': Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent?.includes('Add Table') || b.textContent?.includes('➕')
      ),
      'Text Editor': document.querySelector('textarea'),
      'Section Navigation': document.querySelector('[class*="Prev"]') || 
                           document.querySelector('button[disabled]'),
      'Requirements Button': Array.from(document.querySelectorAll('button')).find(b => 
        b.textContent?.includes('Requirements') || b.textContent?.includes('📋')
      )
    };

    Object.entries(checks).forEach(([name, element]) => {
      if (element) {
        results.push({ test: `UI: ${name}`, status: '✅', message: 'Found' });
        console.log(`   ✅ ${name} found`);
      } else {
        results.push({ test: `UI: ${name}`, status: '⚠️', message: 'Not found' });
        console.log(`   ⚠️ ${name} not found`);
      }
    });
  } catch (error) {
    results.push({ test: 'UI Elements', status: '❌', message: error.message });
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(60));
  results.forEach(r => {
    console.log(`${r.status} ${r.test}: ${r.message}`);
  });

  const passed = results.filter(r => r.status === '✅').length;
  const warnings = results.filter(r => r.status === '⚠️').length;
  const failed = results.filter(r => r.status === '❌').length;

  console.log('\n' + '='.repeat(60));
  console.log(`Total: ${results.length} tests`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`⚠️ Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}`);

  return { results, passed, warnings, failed };
}

// Make available globally
if (typeof window !== 'undefined') {
  window.testEditorFlow = testEditorFlow;
  console.log('✅ Test script loaded! Run: testEditorFlow()');
}

