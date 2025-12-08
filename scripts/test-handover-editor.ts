/**
 * Test Script: Editor Program Connection
 * 
 * Tests the Editor's ability to connect programs:
 * - localStorage functionality
 * - URL/ID parsing (normalizeProgramInput)
 * - Program loading from localStorage
 * - Error handling
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';

// Mock localStorage for Node.js environment
class LocalStorageMock {
  private store: Record<string, string> = {};
  
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  
  removeItem(key: string): void {
    delete this.store[key];
  }
  
  clear(): void {
    this.store = {};
  }
  
  get length(): number {
    return Object.keys(this.store).length;
  }
  
  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }
}

// Set up global localStorage mock
(global as any).localStorage = new LocalStorageMock();
(global as any).window = { localStorage: (global as any).localStorage };

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

// Import normalizeProgramInput function logic
function normalizeProgramInput(rawInput: string): string | null {
  if (!rawInput) return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('page_')) return trimmed;
  const match = trimmed.match(/(\d{2,})/);
  if (match) {
    return `page_${match[1]}`;
  }
  return null;
}

// Mock planStore functions
function getSessionId(): string {
  return 'test_session';
}

function getStorageKey(key: string): string {
  return `pf_${key}_${getSessionId()}`;
}

function saveSelectedProgram(program: any): void {
  try {
    const key = getStorageKey('selectedProgram');
    (global as any).localStorage.setItem(key, JSON.stringify(program));
  } catch (error) {
    console.error('Failed to save program:', error);
  }
}

function loadSelectedProgram(): any | null {
  try {
    const key = getStorageKey('selectedProgram');
    const raw = (global as any).localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function clearSelectedProgram(): void {
  try {
    const key = getStorageKey('selectedProgram');
    (global as any).localStorage.removeItem(key);
  } catch (error) {
    // Ignore
  }
}

async function testNormalizeProgramInput() {
  log('\n=== Test 1: Program Input Normalization ===', 'info');
  
  const testCases = [
    { input: 'page_123', expected: 'page_123', description: 'Direct page ID' },
    { input: 'https://www.aws.at/funding/aws-preseed/page_123', expected: 'page_123', description: 'AWS URL with page ID' },
    { input: 'https://www.ffg.at/calls/page_456', expected: 'page_456', description: 'FFG URL with page ID' },
    { input: 'https://example.com/program/12345', expected: 'page_12345', description: 'URL with numeric ID' },
    { input: '12345', expected: 'page_12345', description: 'Numeric ID only' },
    { input: 'invalid', expected: null, description: 'Invalid input' },
    { input: '', expected: null, description: 'Empty input' },
    { input: 'https://example.com/no-id', expected: null, description: 'URL without ID' }
  ];
  
  let allPassed = true;
  const failures: string[] = [];
  
  for (const testCase of testCases) {
    const result = normalizeProgramInput(testCase.input);
    if (result !== testCase.expected) {
      allPassed = false;
      failures.push(`${testCase.description}: expected "${testCase.expected}", got "${result}"`);
    }
  }
  
  if (allPassed) {
    addResult('Program Input Normalization', true, undefined, {
      testCases: testCases.length,
      allPassed: true
    });
  } else {
    addResult('Program Input Normalization', false, 'Some test cases failed', {
      failures
    });
  }
  
  return allPassed;
}

async function testLocalStorageSave() {
  log('\n=== Test 2: localStorage Save Functionality ===', 'info');
  
  clearSelectedProgram();
  
  const testProgram = {
    id: 'page_123',
    name: 'Test Program',
    type: 'grant',
    categorized_requirements: {
      sections: ['section1', 'section2']
    },
    funding_amount_min: 10000,
    funding_amount_max: 50000,
    currency: 'EUR',
    region: 'Austria'
  };
  
  try {
    saveSelectedProgram(testProgram);
    
    const saved = loadSelectedProgram();
    
    if (!saved) {
      addResult('localStorage Save', false, 'Program not saved');
      return false;
    }
    
    if (saved.id !== testProgram.id) {
      addResult('localStorage Save', false, 'Program ID mismatch', {
        expected: testProgram.id,
        got: saved.id
      });
      return false;
    }
    
    if (saved.name !== testProgram.name) {
      addResult('localStorage Save', false, 'Program name mismatch', {
        expected: testProgram.name,
        got: saved.name
      });
      return false;
    }
    
    addResult('localStorage Save', true, undefined, {
      savedProgram: {
        id: saved.id,
        name: saved.name,
        hasRequirements: !!saved.categorized_requirements
      }
    });
    return true;
  } catch (error: any) {
    addResult('localStorage Save', false, error.message);
    return false;
  }
}

async function testLocalStorageLoad() {
  log('\n=== Test 3: localStorage Load Functionality ===', 'info');
  
  clearSelectedProgram();
  
  const testProgram = {
    id: 'page_456',
    name: 'Load Test Program',
    type: 'grant'
  };
  
  try {
    // First save
    saveSelectedProgram(testProgram);
    
    // Then load
    const loaded = loadSelectedProgram();
    
    if (!loaded) {
      addResult('localStorage Load', false, 'Program not loaded');
      return false;
    }
    
    if (loaded.id !== testProgram.id) {
      addResult('localStorage Load', false, 'Loaded program ID mismatch', {
        expected: testProgram.id,
        got: loaded.id
      });
      return false;
    }
    
    addResult('localStorage Load', true, undefined, {
      loadedProgram: {
        id: loaded.id,
        name: loaded.name
      }
    });
    return true;
  } catch (error: any) {
    addResult('localStorage Load', false, error.message);
    return false;
  }
}

async function testLocalStorageClear() {
  log('\n=== Test 4: localStorage Clear Functionality ===', 'info');
  
  const testProgram = {
    id: 'page_789',
    name: 'Clear Test Program',
    type: 'grant'
  };
  
  try {
    // Save first
    saveSelectedProgram(testProgram);
    
    // Verify it's saved
    const beforeClear = loadSelectedProgram();
    if (!beforeClear) {
      addResult('localStorage Clear', false, 'Program not saved before clear');
      return false;
    }
    
    // Clear
    clearSelectedProgram();
    
    // Verify it's cleared
    const afterClear = loadSelectedProgram();
    if (afterClear) {
      addResult('localStorage Clear', false, 'Program still exists after clear');
      return false;
    }
    
    addResult('localStorage Clear', true);
    return true;
  } catch (error: any) {
    addResult('localStorage Clear', false, error.message);
    return false;
  }
}

async function testProgramNotFound() {
  log('\n=== Test 5: Program Not Found Handling ===', 'info');
  
  clearSelectedProgram();
  
  try {
    const loaded = loadSelectedProgram();
    
    if (loaded !== null) {
      addResult('Program Not Found Handling', false, 'Expected null for non-existent program', {
        got: loaded
      });
      return false;
    }
    
    addResult('Program Not Found Handling', true);
    return true;
  } catch (error: any) {
    addResult('Program Not Found Handling', false, error.message);
    return false;
  }
}

async function testProgramDataStructure() {
  log('\n=== Test 6: Program Data Structure ===', 'info');
  
  clearSelectedProgram();
  
  // Test with full program structure (as saved by ProgramFinder)
  const fullProgram = {
    id: 'page_999',
    name: 'Full Program Structure Test',
    categorized_requirements: {
      sections: [
        { id: 'section1', title: 'Section 1' },
        { id: 'section2', title: 'Section 2' }
      ],
      documents: [
        { id: 'doc1', name: 'Document 1' }
      ]
    },
    type: 'grant',
    url: 'https://example.com/program',
    description: 'Test program description',
    funding_amount_min: 10000,
    funding_amount_max: 50000,
    currency: 'EUR',
    region: 'Austria',
    deadline: '2024-12-31',
    open_deadline: false,
    use_of_funds: ['R&D', 'Marketing'],
    impact_focus: ['Innovation'],
    program_focus: ['Technology'],
    funding_types: ['grant']
  };
  
  try {
    saveSelectedProgram(fullProgram);
    const loaded = loadSelectedProgram();
    
    if (!loaded) {
      addResult('Program Data Structure', false, 'Program not loaded');
      return false;
    }
    
    // Check critical fields
    const hasId = !!loaded.id;
    const hasName = !!loaded.name;
    const hasRequirements = !!loaded.categorized_requirements;
    const hasType = !!loaded.type;
    
    if (!hasId || !hasName || !hasType) {
      addResult('Program Data Structure', false, 'Missing critical fields', {
        hasId,
        hasName,
        hasType,
        hasRequirements
      });
      return false;
    }
    
    addResult('Program Data Structure', true, undefined, {
      hasId,
      hasName,
      hasType,
      hasRequirements,
      hasUrl: !!loaded.url,
      hasDescription: !!loaded.description,
      hasFundingRange: !!(loaded.funding_amount_min && loaded.funding_amount_max)
    });
    return true;
  } catch (error: any) {
    addResult('Program Data Structure', false, error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🧪 Editor Program Connection Test Suite\n');
  
  await testNormalizeProgramInput();
  await testLocalStorageSave();
  await testLocalStorageLoad();
  await testLocalStorageClear();
  await testProgramNotFound();
  await testProgramDataStructure();
  
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

