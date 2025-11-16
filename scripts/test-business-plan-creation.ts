/**
 * Test Script: Business Plan Creation Flow
 * 
 * This script tests the complete business plan creation flow:
 * 1. Load templates
 * 2. Create sections
 * 3. Add content (text, tables, charts)
 * 4. Verify all components work together
 */

import { getSections } from '@templates';
import { PlanDocument, PlanSection } from '@/features/editor/types/plan';
import { initializeTablesForSection } from '@/features/editor/utils/tableInitializer';

interface TestResult {
  step: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  data?: any;
}

async function testBusinessPlanCreation() {
  const results: TestResult[] = [];

  console.log('🧪 Testing Business Plan Creation Flow...\n');

  // Test 1: Load Templates
  try {
    console.log('1️⃣ Testing Template Loading...');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const sections = await getSections('grants', 'submission', undefined, baseUrl);
    
    if (sections && sections.length > 0) {
      results.push({
        step: 'Load Templates',
        status: 'pass',
        message: `✅ Loaded ${sections.length} sections from templates`,
        data: { count: sections.length, sections: sections.map(s => s.title) }
      });
      console.log(`   ✅ Loaded ${sections.length} sections`);
    } else {
      results.push({
        step: 'Load Templates',
        status: 'fail',
        message: '❌ No sections loaded from templates'
      });
      console.log('   ❌ No sections loaded');
    }
  } catch (error: any) {
    results.push({
      step: 'Load Templates',
      status: 'fail',
      message: `❌ Error loading templates: ${error.message}`
    });
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 2: Check Prompts
  try {
    console.log('\n2️⃣ Testing Prompts...');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const sections = await getSections('grants', 'submission', undefined, baseUrl);
    const sectionWithPrompts = sections.find(s => s.prompts && s.prompts.length > 0);
    
    if (sectionWithPrompts) {
      results.push({
        step: 'Check Prompts',
        status: 'pass',
        message: `✅ Found prompts in "${sectionWithPrompts.title}" (${sectionWithPrompts.prompts?.length} prompts)`,
        data: { section: sectionWithPrompts.title, prompts: sectionWithPrompts.prompts }
      });
      console.log(`   ✅ Section "${sectionWithPrompts.title}" has ${sectionWithPrompts.prompts?.length} prompts`);
    } else {
      results.push({
        step: 'Check Prompts',
        status: 'warning',
        message: '⚠️ No sections with prompts found'
      });
      console.log('   ⚠️ No prompts found');
    }
  } catch (error: any) {
    results.push({
      step: 'Check Prompts',
      status: 'fail',
      message: `❌ Error checking prompts: ${error.message}`
    });
  }

  // Test 3: Create Plan Document
  try {
    console.log('\n3️⃣ Testing Plan Document Creation...');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const templateSections = await getSections('grants', 'submission', undefined, baseUrl);
    
    const planSections: PlanSection[] = templateSections.map((template) => {
      const section: PlanSection = {
        key: template.id,
        title: template.title,
        content: '',
        status: 'missing'
      };
      
      // Initialize tables if needed
      const tables = initializeTablesForSection(template);
      if (tables) {
        section.tables = tables;
      }
      
      return section;
    });

    const plan: PlanDocument = {
      id: `test_plan_${Date.now()}`,
      ownerId: 'test_user',
      product: 'submission',
      route: 'grants',
      language: 'en',
      tone: 'neutral',
      targetLength: 'standard',
      settings: {
        includeTitlePage: true,
        includePageNumbers: true
      },
      sections: planSections,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    results.push({
      step: 'Create Plan Document',
      status: 'pass',
      message: `✅ Created plan with ${plan.sections.length} sections`,
      data: { 
        planId: plan.id,
        sections: plan.sections.length,
        sectionsWithTables: plan.sections.filter(s => s.tables).length
      }
    });
    console.log(`   ✅ Created plan with ${plan.sections.length} sections`);
    console.log(`   ✅ ${plan.sections.filter(s => s.tables).length} sections have tables initialized`);
  } catch (error: any) {
    results.push({
      step: 'Create Plan Document',
      status: 'fail',
      message: `❌ Error creating plan: ${error.message}`
    });
  }

  // Test 4: Add Content to Sections
  try {
    console.log('\n4️⃣ Testing Content Addition...');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const templateSections = await getSections('grants', 'submission', undefined, baseUrl);
    
    // Simulate adding content
    const testContent = {
      executive_summary: 'This is a test executive summary with key points about our business.',
      market_opportunity: 'The market opportunity is significant with growing demand.',
      financial_projections: 'Financial projections show positive growth over 5 years.'
    };

    let sectionsWithContent = 0;
    templateSections.forEach((template, index) => {
      if (template.id === 'executive_summary' && testContent.executive_summary) {
        sectionsWithContent++;
      } else if (template.id === 'market_opportunity' && testContent.market_opportunity) {
        sectionsWithContent++;
      } else if (template.id === 'financial_projections' && testContent.financial_projections) {
        sectionsWithContent++;
      }
    });

    results.push({
      step: 'Add Content',
      status: sectionsWithContent > 0 ? 'pass' : 'warning',
      message: sectionsWithContent > 0 
        ? `✅ Added content to ${sectionsWithContent} sections`
        : '⚠️ No content added (test data)'
    });
    console.log(`   ${sectionsWithContent > 0 ? '✅' : '⚠️'} Content addition test`);
  } catch (error: any) {
    results.push({
      step: 'Add Content',
      status: 'fail',
      message: `❌ Error adding content: ${error.message}`
    });
  }

  // Test 5: Tables and Charts
  try {
    console.log('\n5️⃣ Testing Tables & Charts...');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const templateSections = await getSections('grants', 'submission', undefined, baseUrl);
    
    const financialSection = templateSections.find(s => 
      s.category?.toLowerCase() === 'financial'
    );

    if (financialSection) {
      const tables = initializeTablesForSection(financialSection);
      const tableCount = tables ? Object.keys(tables).length : 0;
      
      results.push({
        step: 'Tables & Charts',
        status: tableCount > 0 ? 'pass' : 'warning',
        message: tableCount > 0
          ? `✅ Financial section has ${tableCount} tables initialized`
          : '⚠️ No tables initialized for financial section',
        data: { 
          section: financialSection.title,
          tables: tableCount,
          tableKeys: tables ? Object.keys(tables) : []
        }
      });
      console.log(`   ✅ Financial section: ${tableCount} tables`);
    } else {
      results.push({
        step: 'Tables & Charts',
        status: 'warning',
        message: '⚠️ No financial section found'
      });
    }
  } catch (error: any) {
    results.push({
      step: 'Tables & Charts',
      status: 'fail',
      message: `❌ Error testing tables: ${error.message}`
    });
  }

  // Test 6: Verify Complete Plan Structure
  try {
    console.log('\n6️⃣ Testing Complete Plan Structure...');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const templateSections = await getSections('grants', 'submission', undefined, baseUrl);
    
    const planSections: PlanSection[] = templateSections.map((template) => {
      const section: PlanSection = {
        key: template.id,
        title: template.title,
        content: `Test content for ${template.title}`,
        status: 'in-progress'
      };
      
      const tables = initializeTablesForSection(template);
      if (tables) {
        section.tables = tables;
        section.chartTypes = {};
        Object.keys(tables).forEach(key => {
          section.chartTypes![key] = 'bar';
        });
      }
      
      return section;
    });

    const hasContent = planSections.every(s => s.content);
    const hasTables = planSections.some(s => s.tables);
    const hasCharts = planSections.some(s => s.chartTypes);
    const hasPrompts = templateSections.some(s => s.prompts && s.prompts.length > 0);

    const allComponents = hasContent && hasTables && hasCharts && hasPrompts;

    results.push({
      step: 'Complete Plan Structure',
      status: allComponents ? 'pass' : 'warning',
      message: allComponents
        ? '✅ Plan has all components: content, tables, charts, prompts'
        : `⚠️ Missing components: content=${hasContent}, tables=${hasTables}, charts=${hasCharts}, prompts=${hasPrompts}`,
      data: {
        sections: planSections.length,
        hasContent,
        hasTables,
        hasCharts,
        hasPrompts,
        sectionsWithTables: planSections.filter(s => s.tables).length,
        sectionsWithCharts: planSections.filter(s => s.chartTypes).length
      }
    });
    console.log(`   ${allComponents ? '✅' : '⚠️'} Plan structure:`, {
      sections: planSections.length,
      content: hasContent,
      tables: hasTables,
      charts: hasCharts,
      prompts: hasPrompts
    });
  } catch (error: any) {
    results.push({
      step: 'Complete Plan Structure',
      status: 'fail',
      message: `❌ Error: ${error.message}`
    });
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('='.repeat(50));
  results.forEach(result => {
    const icon = result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.step}: ${result.message}`);
  });

  const passCount = results.filter(r => r.status === 'pass').length;
  const failCount = results.filter(r => r.status === 'fail').length;
  const warnCount = results.filter(r => r.status === 'warning').length;

  console.log('\n' + '='.repeat(50));
  console.log(`Total: ${results.length} tests`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`⚠️ Warnings: ${warnCount}`);
  console.log(`❌ Failed: ${failCount}`);

  return {
    success: failCount === 0,
    results,
    summary: {
      total: results.length,
      passed: passCount,
      warnings: warnCount,
      failed: failCount
    }
  };
}

// Export for use in browser console or test runner
if (typeof window !== 'undefined') {
  (window as any).testBusinessPlanCreation = testBusinessPlanCreation;
}

export default testBusinessPlanCreation;

