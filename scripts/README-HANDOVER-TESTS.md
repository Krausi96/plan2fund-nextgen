# Handover Test Scripts

This directory contains test scripts to verify the functionality described in `docs/HANDOVER-TESTING-RECO-AND-EDITOR.md`.

## Test Scripts

### 1. ProgramFinder Recommendations (`test-handover-reco.ts`)

Tests the `/api/programs/recommend` endpoint to identify issues with:
- LLM configuration (OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT)
- API endpoint availability
- Required fields validation
- Program generation
- Error handling

**Usage:**
```bash
npm run test:handover:reco
```

**Requirements:**
- Development server running (`npm run dev`) OR
- Set `NEXT_PUBLIC_BASE_URL` environment variable to point to your server
- LLM configuration (OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT) in `.env.local`

### 2. Editor Program Connection (`test-handover-editor.ts`)

Tests the Editor's ability to connect programs:
- Program input normalization (URL/ID parsing)
- localStorage save/load functionality
- Program data structure validation
- Error handling for missing programs

**Usage:**
```bash
npm run test:handover:editor
```

**Note:** This test uses a mock localStorage implementation and doesn't require a running server.

### 3. Template Extraction (`test-handover-templates.ts`)

Tests template extraction from uploaded files:
- Markdown file parsing
- Text file parsing
- File size validation
- PDF rejection (requires server-side processing)
- Error handling for invalid files

**Usage:**
```bash
npm run test:handover:templates
```

**Note:** This test uses mock file objects and doesn't require actual file uploads.

### 4. Run All Tests (`test-handover-all.ts`)

Runs all test suites sequentially.

**Usage:**
```bash
npm run test:handover:all
```

## Running Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables** (for reco tests):
   Create `.env.local` with:
   ```bash
   OPENAI_API_KEY=your_key_here
   # OR
   CUSTOM_LLM_ENDPOINT=your_endpoint_here
   ```

3. **Start development server** (for reco tests):
   ```bash
   npm run dev
   ```

### Running Individual Tests

```bash
# Test ProgramFinder recommendations
npm run test:handover:reco

# Test Editor program connection
npm run test:handover:editor

# Test template extraction
npm run test:handover:templates
```

### Running All Tests

```bash
npm run test:handover:all
```

## Test Output

Each test script provides:
- ✅ **Passed tests** - Green checkmarks
- ❌ **Failed tests** - Red X marks with error details
- 📊 **Summary** - Total tests, passed/failed counts, and details

## Troubleshooting

### Reco Tests Fail

1. **Check environment variables:**
   ```bash
   echo $OPENAI_API_KEY
   echo $CUSTOM_LLM_ENDPOINT
   ```

2. **Verify server is running:**
   - Check `http://localhost:3000` is accessible
   - Or set `NEXT_PUBLIC_BASE_URL` environment variable

3. **Check server logs:**
   - Look for `[reco][recommend]` prefixed messages
   - Check for LLM errors or API timeouts

### Editor Tests Fail

- These tests use mock localStorage, so failures indicate code issues
- Check the error messages for specific problems
- Verify `normalizeProgramInput` function logic

### Template Tests Fail

- These tests use mock files, so failures indicate parsing logic issues
- Check error messages for specific parsing problems
- Verify file size limits and format validation

## Interpreting Results

### Successful Test Run
```
✅ Environment Variables: PASSED
✅ API Endpoint Available: PASSED
✅ Required Fields Validation: PASSED
✅ Program Generation: PASSED
✅ Error Handling: PASSED

📊 Test Summary
Total Tests: 5
✅ Passed: 5
❌ Failed: 0
```

### Failed Test Run
```
❌ Program Generation: FAILED - LLM error occurred
   Details: {
     "llmError": "No LLM configured",
     "fallbackUsed": true
   }

📊 Test Summary
Total Tests: 5
✅ Passed: 4
❌ Failed: 1
```

## Next Steps

After running tests:

1. **Document Findings:**
   - List all failures with steps to reproduce
   - Include error messages and details
   - Note browser console logs and server logs

2. **Categorize Issues:**
   - Configuration issues (missing env vars)
   - API/LLM issues (timeouts, rate limits)
   - Data format issues (parsing, structure)
   - UI/UX issues (error messages)

3. **Priority Fixes:**
   - Critical: Blocks core functionality
   - High: Affects user experience significantly
   - Medium: Minor issues, workarounds available
   - Low: Cosmetic or edge cases

## Related Documentation

- `docs/HANDOVER-TESTING-RECO-AND-EDITOR.md` - Full testing procedures
- `features/reco/components/ProgramFinder.tsx` - ProgramFinder component
- `features/editor/components/Editor.tsx` - Editor component
- `pages/api/programs/recommend.ts` - Recommendation API


