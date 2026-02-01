/**
 * Debug script to test canonical ordering functionality
 */

// Mock translation function
const mockTranslate = (key: string) => {
  const translations: Record<string, string> = {
    'editor.section.metadata': 'Title Page',
    'editor.section.ancillary': 'Table of Contents',
    'editor.section.references': 'References',
    'editor.section.appendices': 'Appendices',
    'editor.section.tablesData': 'Tables and Data',
    'editor.section.figuresImages': 'Figures and Images',
  };
  
  return translations[key] || key;
};

// Import the function we want to test
import { mergeUploadedContentWithSpecialSections } from './features/editor/lib';

async function runDebugTest() {
  console.log('=== DEBUG: Canonical Ordering Test ===');
  
  // Simulate content that should demonstrate canonical ordering
  const mockContentWithSpecialSections = {
    title: 'Test Business Plan',
    sections: [
      { title: 'Financial Plan', content: 'Financial details...', type: 'financial_plan' },
      { title: 'Market Analysis', content: 'Market research...', type: 'market_analysis' },
      { title: 'Executive Summary', content: 'Executive summary...', type: 'executive_summary' },
      { title: 'Company Overview', content: 'About the company...', type: 'company_description' },
      { title: 'References', content: 'Sources and citations...', type: 'references' },
      { title: 'Appendices', content: 'Additional supporting materials...', type: 'appendices' },
      { title: 'Tables and Data', content: 'Detailed tables...', type: 'tables_data' },
      { title: 'Figures and Images', content: 'Charts and diagrams...', type: 'figures_images' },
      { title: 'Team Structure', content: 'Team member details...', type: 'team_qualifications' },
      { title: 'Title Page', content: 'Document title page...', type: 'metadata' },
      { title: 'Table of Contents', content: 'Table of contents...', type: 'ancillary' },
      { title: '   ', content: 'Empty section with whitespace...', type: 'empty' }, // Whitespace-only title
      { title: '', content: 'Empty section with no title...', type: 'empty' } // No title
    ],
    hasTitlePage: true,
    hasTOC: true,
    totalPages: 30,
    wordCount: 8000
  };

  console.log('\nOriginal section order:');
  mockContentWithSpecialSections.sections.forEach((section, index) => {
    console.log(`  ${index}: "${section.title}" (${section.type})`);
  });

  try {
    // Apply the unified merge function
    const processedStructure = mergeUploadedContentWithSpecialSections(
      mockContentWithSpecialSections, 
      null, 
      mockTranslate
    );

    console.log('\nFinal section order after mergeUploadedContentWithSpecialSections:');
    processedStructure.sections.forEach((section: any, index: number) => {
      console.log(`  ${index}: "${section.title}" (id: ${section.id}, type: ${section.type || section.sectionType})`);
    });

    // Analyze the canonical ordering
    console.log('\nSection order analysis:');
    const canonicalOrder = [
      'metadata',      // Title Page
      'ancillary',     // Table of Contents
      'references',    // References
      'tables_data',   // Tables/Data
      'figures_images',// Figures/Images
      'appendices'     // Appendices
    ];

    processedStructure.sections.forEach((section: any, index: number) => {
      const canonicalPosition = canonicalOrder.indexOf(section.id);
      const position = canonicalPosition !== -1 ? canonicalPosition : 999;
      console.log(`  ${index}: "${section.title}" (id: ${section.id}) - canonical pos: ${position}`);
    });

    console.log('\n=== TEST COMPLETED ===');
    console.log(`Total sections: ${processedStructure.sections.length}`);
    console.log(`Confidence score: ${processedStructure.confidenceScore}`);
    console.log(`Warnings: ${processedStructure.warnings.length}`);

  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
runDebugTest().catch(console.error);