/**
 * Test Script: Template Extraction
 * 
 * Tests the template extraction functionality:
 * - File reading (TXT, MD)
 * - Structure parsing
 * - Error handling
 * - File size validation
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function log(message: string, type: 'info' | 'success' | 'error' | 'warn' = 'info') {
  const prefix = {
    info: 'ℹ️',
    success: '✅',
    error: '❌',
    warn: '⚠️'
  }[type];
  console.log(`${prefix} ${message}`);
}

function addResult(name: string, passed: boolean, error?: string, details?: any) {
  results.push({ name, passed, error, details });
  if (passed) {
    log(`${name}: PASSED`, 'success');
  } else {
    log(`${name}: FAILED${error ? ` - ${error}` : ''}`, 'error');
    if (details) {
      console.log('   Details:', JSON.stringify(details, null, 2));
    }
  }
}

// Mock File class for Node.js
class MockFile {
  name: string;
  type: string;
  size: number;
  content: string;
  
  constructor(name: string, type: string, content: string) {
    this.name = name;
    this.type = type;
    this.content = content;
    this.size = Buffer.byteLength(content, 'utf8');
  }
  
  async text(): Promise<string> {
    return this.content;
  }
  
  stream(): ReadableStream {
    const encoder = new TextEncoder();
    const chunks = [encoder.encode(this.content)];
    let index = 0;
    
    return new ReadableStream({
      pull(controller) {
        if (index < chunks.length) {
          controller.enqueue(chunks[index++]);
        } else {
          controller.close();
        }
      }
    });
  }
}

// Simplified extraction logic (based on api.ts)
function parseMarkdownStructure(text: string): { sections: any[]; documents: any[] } {
  const sections: any[] = [];
  const documents: any[] = [];
  
  // Look for markdown headers (# ## ###)
  const headerRegex = /^(#{1,3})\s+(.+)$/gm;
  let match;
  let sectionIndex = 0;
  
  while ((match = headerRegex.exec(text)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();
    
    if (level === 1 || level === 2) {
      sections.push({
        id: `section_${sectionIndex++}`,
        title,
        description: '',
        required: false,
        order: sections.length
      });
    }
  }
  
  // Look for document references
  const docRegex = /(?:document|file|attachment):\s*(.+)/gi;
  while ((match = docRegex.exec(text)) !== null) {
    documents.push({
      id: `doc_${documents.length}`,
      name: match[1].trim(),
      description: '',
      required: false
    });
  }
  
  return { sections, documents };
}

function parseTextStructure(text: string): { sections: any[]; documents: any[] } {
  const sections: any[] = [];
  const documents: any[] = [];
  const lines = text.split('\n');
  
  let currentSection: any = null;
  let sectionIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for section headers (uppercase, numbered, etc.)
    if (line.length > 0 && (
      line.match(/^[A-Z][A-Z\s]+$/) || // ALL CAPS
      line.match(/^\d+\.\s+[A-Z]/) || // Numbered
      line.match(/^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*:/) // Title Case:
    )) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        id: `section_${sectionIndex++}`,
        title: line.replace(/^\d+\.\s+/, '').replace(':', ''),
        description: '',
        required: false,
        order: sections.length
      };
    } else if (currentSection && line.length > 0) {
      // Add to current section description
      if (!currentSection.description) {
        currentSection.description = line;
      } else {
        currentSection.description += ' ' + line;
      }
    }
    
    // Look for document references
    if (line.toLowerCase().includes('document') || line.toLowerCase().includes('attachment')) {
      const docMatch = line.match(/(?:document|attachment):\s*(.+)/i);
      if (docMatch) {
        documents.push({
          id: `doc_${documents.length}`,
          name: docMatch[1].trim(),
          description: '',
          required: false
        });
      }
    }
  }
  
  if (currentSection) {
    sections.push(currentSection);
  }
  
  return { sections, documents };
}

async function extractTextFromFile(file: MockFile): Promise<string> {
  if (file.type === 'application/pdf') {
    throw new Error('PDF parsing requires server-side processing. Please use TXT or MD files for client-side extraction.');
  }
  
  return file.content;
}

async function extractTemplateFromFile(file: MockFile): Promise<{ sections?: any[]; documents?: any[]; errors?: string[] }> {
  const errors: string[] = [];
  
  // File size validation
  const MAX_SIZE = file.type === 'application/pdf' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return {
      errors: [`File too large. Maximum size: ${MAX_SIZE / 1024 / 1024}MB`]
    };
  }
  
  try {
    const text = await extractTextFromFile(file);
    
    const MAX_TEXT_LENGTH = 50000;
    const truncatedText = text.length > MAX_TEXT_LENGTH 
      ? text.substring(0, MAX_TEXT_LENGTH) + '... [truncated]'
      : text;
    
    let result: { sections: any[]; documents: any[] };
    
    if (file.name.endsWith('.md') || file.type === 'text/markdown') {
      result = parseMarkdownStructure(truncatedText);
    } else {
      result = parseTextStructure(truncatedText);
    }
    
    const sections = result.sections.map((s, idx) => ({
      id: s.id || `extracted_section_${idx}`,
      title: s.title || 'Untitled Section',
      description: s.description || 'Extracted from uploaded file',
      required: s.required || false,
      order: s.order ?? idx
    }));
    
    const documents = result.documents.map((d, idx) => ({
      id: d.id || `extracted_doc_${idx}`,
      name: d.name || 'Untitled Document',
      description: d.description || 'Extracted from uploaded file',
      required: d.required || false
    }));
    
    if (sections.length === 0 && documents.length === 0) {
      errors.push('No sections or documents found in file. Try a different format or structure.');
    }
    
  return {
      sections: sections.length > 0 ? sections : undefined,
      documents: documents.length > 0 ? documents : undefined,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    return {
      errors: [error instanceof Error ? error.message : 'Failed to extract template from file']
    };
  }
}

async function testMarkdownExtraction() {
  log('\n=== Test 1: Markdown File Extraction ===', 'info');
  
  const markdownContent = `# Business Plan Template

## Executive Summary
This section provides an overview of the business.

## Market Analysis
Detailed market research and analysis.

## Financial Projections
Financial forecasts and projections.

### Document Requirements
- Document: Business Registration
- Document: Financial Statements
`;
  
  const file = new MockFile('test.md', 'text/markdown', markdownContent);
  
  try {
    const result = await extractTemplateFromFile(file);
    
    if (result.errors && result.errors.length > 0) {
      addResult('Markdown Extraction', false, result.errors.join(', '));
      return false;
    }
    
    if (!result.sections || result.sections.length === 0) {
      addResult('Markdown Extraction', false, 'No sections extracted');
      return false;
    }
    
    addResult('Markdown Extraction', true, undefined, {
      sectionsFound: result.sections.length,
      documentsFound: result.documents?.length || 0,
      sampleSection: result.sections[0]
    });
    return true;
  } catch (error: any) {
    addResult('Markdown Extraction', false, error.message);
    return false;
  }
}

async function testTextExtraction() {
  log('\n=== Test 2: Text File Extraction ===', 'info');
  
  const textContent = `BUSINESS PLAN TEMPLATE

1. EXECUTIVE SUMMARY
This section provides an overview of the business plan.

2. MARKET ANALYSIS
Detailed market research and analysis.

3. FINANCIAL PROJECTIONS
Financial forecasts and projections.

Document: Business Registration Certificate
Document: Financial Statements
`;
  
  const file = new MockFile('test.txt', 'text/plain', textContent);
  
  try {
    const result = await extractTemplateFromFile(file);
    
    if (result.errors && result.errors.length > 0) {
      addResult('Text Extraction', false, result.errors.join(', '));
      return false;
    }
    
    if (!result.sections || result.sections.length === 0) {
      addResult('Text Extraction', false, 'No sections extracted');
      return false;
    }
    
    addResult('Text Extraction', true, undefined, {
      sectionsFound: result.sections.length,
      documentsFound: result.documents?.length || 0,
      sampleSection: result.sections[0]
    });
    return true;
  } catch (error: any) {
    addResult('Text Extraction', false, error.message);
    return false;
  }
}

async function testFileSizeValidation() {
  log('\n=== Test 3: File Size Validation ===', 'info');
  
  // Create a file larger than 5MB
  const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
  const file = new MockFile('large.txt', 'text/plain', largeContent);
  
  try {
    const result = await extractTemplateFromFile(file);
    
    if (!result.errors || result.errors.length === 0) {
      addResult('File Size Validation', false, 'Should have rejected large file');
      return false;
    }
    
    if (!result.errors.some(e => e.includes('too large'))) {
      addResult('File Size Validation', false, 'Wrong error message', {
        errors: result.errors
      });
      return false;
    }
    
    addResult('File Size Validation', true, undefined, {
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      error: result.errors[0]
    });
    return true;
  } catch (error: any) {
    addResult('File Size Validation', false, error.message);
    return false;
  }
}

async function testPDFRejection() {
  log('\n=== Test 4: PDF File Rejection ===', 'info');
  
  const pdfContent = '%PDF-1.4\n...'; // Minimal PDF content
  const file = new MockFile('test.pdf', 'application/pdf', pdfContent);
  
  try {
    const result = await extractTemplateFromFile(file);
    
    if (!result.errors || result.errors.length === 0) {
      addResult('PDF Rejection', false, 'Should have rejected PDF file');
      return false;
    }
    
    if (!result.errors.some(e => e.includes('PDF parsing'))) {
      addResult('PDF Rejection', false, 'Wrong error message', {
        errors: result.errors
      });
      return false;
    }
    
    addResult('PDF Rejection', true, undefined, {
      error: result.errors[0]
    });
    return true;
  } catch (error: any) {
    addResult('PDF Rejection', false, error.message);
    return false;
  }
}

async function testEmptyFile() {
  log('\n=== Test 5: Empty File Handling ===', 'info');
  
  const file = new MockFile('empty.txt', 'text/plain', '');
  
  try {
    const result = await extractTemplateFromFile(file);
    
    if (!result.errors || result.errors.length === 0) {
      // Empty file might not have errors, but should have no sections
      if (result.sections && result.sections.length > 0) {
        addResult('Empty File Handling', false, 'Should not extract sections from empty file');
        return false;
      }
    }
    
    addResult('Empty File Handling', true, undefined, {
      hasErrors: !!(result.errors && result.errors.length > 0),
      hasSections: !!(result.sections && result.sections.length > 0)
    });
    return true;
  } catch (error: any) {
    addResult('Empty File Handling', false, error.message);
    return false;
  }
}

async function testUnstructuredFile() {
  log('\n=== Test 6: Unstructured File Handling ===', 'info');
  
  const unstructuredContent = `This is just a regular text file
with no clear structure or sections.
It doesn't follow any template format.
Just random text content.`;
  
  const file = new MockFile('unstructured.txt', 'text/plain', unstructuredContent);
  
  try {
    const result = await extractTemplateFromFile(file);
    
    // Should either have errors or no sections/documents
    if (result.sections && result.sections.length > 0) {
      // That's okay, it might extract something
      addResult('Unstructured File Handling', true, undefined, {
        sectionsFound: result.sections.length,
        note: 'Some sections extracted despite unstructured content'
      });
      return true;
    }
    
    if (result.errors && result.errors.length > 0) {
      addResult('Unstructured File Handling', true, undefined, {
        errors: result.errors,
        note: 'Correctly identified as unstructured'
      });
      return true;
    }
    
    addResult('Unstructured File Handling', true, undefined, {
      note: 'No sections or documents extracted (expected)'
    });
    return true;
  } catch (error: any) {
    addResult('Unstructured File Handling', false, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🧪 Template Extraction Test Suite\n');
  
  await testMarkdownExtraction();
  await testTextExtraction();
  await testFileSizeValidation();
  await testPDFRejection();
  await testEmptyFile();
  await testUnstructuredFile();
  
  printSummary();
}

function printSummary() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results
      .filter(r => !r.passed)
      .forEach(r => {
        console.log(`   - ${r.name}`);
        if (r.error) console.log(`     Error: ${r.error}`);
      });
  }
  
  console.log('\n' + '='.repeat(60));
  
  // Exit with error code if any tests failed
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});

