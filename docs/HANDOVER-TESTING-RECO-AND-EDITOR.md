# Handover: Testing ProgramFinder & Editor - Reco and Program Connection Issues

## Overview
This document outlines testing procedures to identify why:
1. **ProgramFinder recommendations (reco) are failing**
2. **Connecting programs/templates in the Editor is failing**

## Recent Changes Made
- ✅ Fixed translation keys (de/en) for all error messages
- ✅ Replaced developer error messages with user-friendly messages
- ✅ Technical details now only shown in development mode

## Testing Environment Setup

### Prerequisites
1. **Environment Variables** (check `.env.local`):
   ```bash
   OPENAI_API_KEY=your_key_here
   # OR
   CUSTOM_LLM_ENDPOINT=your_endpoint_here
   ```

2. **Development Mode**:
   - Run `npm run dev`
   - Ensure `NODE_ENV=development` for detailed error logs

## Test 1: ProgramFinder Recommendations (Reco)

### Test Steps
1. Navigate to ProgramFinder (`/reco` or via navigation)
2. Answer the required questions:
   - Funding intent
   - Organisation stage
   - Revenue status
   - Location
   - Funding amount
   - Industry focus
   - Co-financing
3. Click "Generate Funding Programs"
4. Observe the behavior

### Expected Behavior
- ✅ Programs are generated and displayed
- ✅ User sees friendly error messages (not technical details)
- ✅ Loading state shows "Generating Programs..."

### What to Check if It Fails

#### A. Check Browser Console
Look for:
- `❌ API Error Response:` - Shows API error details
- `❌ CRITICAL: No programs returned from API` - Indicates API returned empty
- `❌ Error generating programs:` - Shows error details

#### B. Check Network Tab
1. Open DevTools → Network tab
2. Look for request to `/api/programs/recommend`
3. Check:
   - **Status Code**: Should be 200 (not 400, 500, etc.)
   - **Response Body**: Should contain `{ success: true, programs: [...] }`
   - **Request Payload**: Verify `answers` object is properly formatted

#### C. Check Server Logs
Look for:
- `[reco][recommend] LLM returned X programs`
- `generateProgramsWithLLM failed:` - Indicates LLM error
- `LLM extraction required: Set OPENAI_API_KEY or CUSTOM_LLM_ENDPOINT` - Missing config

#### D. Common Failure Scenarios

**Scenario 1: Missing LLM Configuration**
- **Symptom**: Error message about LLM configuration
- **Check**: Verify `OPENAI_API_KEY` or `CUSTOM_LLM_ENDPOINT` is set
- **Fix**: Add to `.env.local` and restart dev server

**Scenario 2: API Returns Empty Programs**
- **Symptom**: "No programs found" message
- **Check**: Server logs for `LLM returned 0 programs`
- **Possible Causes**:
  - LLM response parsing failed
  - LLM returned invalid JSON
  - All programs filtered out by matching logic

**Scenario 3: Network/API Error**
- **Symptom**: Network error or 500 status
- **Check**: Server logs for stack traces
- **Possible Causes**:
  - Database connection issues
  - LLM API timeout
  - Rate limiting (429 errors)

### Debugging Commands
```bash
# Check if environment variables are set
echo $OPENAI_API_KEY
echo $CUSTOM_LLM_ENDPOINT

# Check server logs in terminal where `npm run dev` is running
# Look for [reco][recommend] prefixed messages
```

## Test 2: Editor - Connecting Programs

### Test Steps
1. Navigate to Editor (`/editor`)
2. Open the Configuration panel (right sidebar)
3. Try to connect a program using one of these methods:

   **Method A: From ProgramFinder**
   - Go to ProgramFinder
   - Generate programs
   - Click "Use this program" on a program
   - Should navigate to Editor with program connected

   **Method B: Paste Program Link**
   - In Editor Configuration, click "Connect Program"
   - Paste a program URL (e.g., AWS, FFG, EU program page)
   - Should extract and connect the program

   **Method C: Program ID**
   - Enter a program ID like `page_123`
   - Should load program from localStorage

### Expected Behavior
- ✅ Program loads successfully
- ✅ Program name appears in Configuration panel
- ✅ Sections and documents are loaded based on program requirements
- ✅ User sees friendly error messages if connection fails

### What to Check if It Fails

#### A. Check Browser Console
Look for:
- `Program not found in localStorage` - Program not saved from ProgramFinder
- `Failed to load program from localStorage` - localStorage issue
- `Invalid input` - URL/ID parsing failed

#### B. Check localStorage
1. Open DevTools → Application → Local Storage
2. Look for key: `selectedProgram`
3. Verify it contains:
   ```json
   {
     "id": "page_123",
     "name": "Program Name",
     "type": "grant"
   }
   ```

#### C. Check Network Tab
1. Look for requests to `/api/programs/[id]` or `/api/programs/index`
2. Check response for program data

#### D. Common Failure Scenarios

**Scenario 1: Program Not in localStorage**
- **Symptom**: "Program not found in localStorage"
- **Cause**: Program wasn't saved when selected from ProgramFinder
- **Check**: `features/reco/components/ProgramFinder.tsx` - `saveSelectedProgram()` function
- **Fix**: Ensure program is saved when "Use this program" is clicked

**Scenario 2: Invalid URL/ID Format**
- **Symptom**: "Invalid input" or "Enter a valid program ID"
- **Cause**: URL parsing failed
- **Check**: `normalizeProgramInput()` function in Editor
- **Fix**: Verify URL format matches expected patterns

**Scenario 3: Program Extraction Failed**
- **Symptom**: Program loads but no sections/documents appear
- **Cause**: `categorized_requirements` not extracted or empty
- **Check**: Program data structure in localStorage
- **Fix**: Verify LLM extraction is working (see Test 1)

## Test 3: Editor - Template Extraction

### Test Steps
1. Navigate to Editor Configuration
2. Click "Upload Template" or similar option
3. Upload a file (TXT, MD, or PDF)
4. Observe extraction result

### Expected Behavior
- ✅ File is processed
- ✅ Sections and documents are extracted
- ✅ Preview shows extracted content
- ✅ User can apply extracted templates

### What to Check if It Fails

#### A. Check Browser Console
Look for:
- `Failed to extract template` - Extraction error
- File reading errors
- Parsing errors

#### B. Check File Format
- **Supported**: TXT, MD, PDF (PDF requires server-side processing)
- **Size Limit**: 5MB for TXT/MD, 10MB for PDF
- **Format**: Should contain structured content (sections, documents)

#### C. Common Failure Scenarios

**Scenario 1: File Too Large**
- **Symptom**: "File too large" error
- **Fix**: Reduce file size or split into smaller files

**Scenario 2: PDF Parsing**
- **Symptom**: "PDF parsing requires server-side processing"
- **Cause**: PDF parsing not implemented client-side
- **Fix**: Use TXT or MD files, or implement server-side PDF parsing

**Scenario 3: Invalid File Format**
- **Symptom**: Parsing errors
- **Cause**: File doesn't match expected structure
- **Fix**: Check file format matches template structure

## Debugging Checklist

### For Reco Failures
- [ ] Check `OPENAI_API_KEY` or `CUSTOM_LLM_ENDPOINT` is set
- [ ] Verify LLM API is accessible (test with curl/Postman)
- [ ] Check server logs for LLM errors
- [ ] Verify API endpoint `/api/programs/recommend` is working
- [ ] Check network tab for failed requests
- [ ] Verify user answers are properly formatted in request

### For Editor Connection Failures
- [ ] Check localStorage for `selectedProgram` key
- [ ] Verify program was saved from ProgramFinder
- [ ] Check URL/ID format matches expected patterns
- [ ] Verify program exists in database/API
- [ ] Check network tab for failed API requests
- [ ] Verify `categorized_requirements` are present in program data

### For Template Extraction Failures
- [ ] Check file format (TXT, MD, PDF)
- [ ] Verify file size is within limits
- [ ] Check file content structure
- [ ] Verify extraction function is called correctly
- [ ] Check browser console for parsing errors

## Error Message Reference

### User-Friendly Messages (Production)
- "We could not generate programs right now. Please try again shortly."
- "No programs found. Please check server logs for details."
- "Program not found. Please select a program from ProgramFinder or paste a valid program link."
- "Failed to extract template from file. Please check the file format and try again."

### Technical Details (Development Only)
- Technical details are appended in development mode: `(error message)`
- Check browser console for full error stack traces
- Check server logs for detailed error information

## Files to Review

### ProgramFinder
- `features/reco/components/ProgramFinder.tsx` - Main component
- `pages/api/programs/recommend.ts` - Recommendation API
- `features/reco/engine/extraction.ts` - LLM extraction logic
- `features/reco/prompts/programRecommendation.ts` - LLM prompt

### Editor
- `features/editor/components/Editor.tsx` - Main editor component
- `features/editor/components/layout/Workspace/Navigation/Configuration/CurrentSelection.tsx` - Configuration panel
- `features/editor/lib/templates/api.ts` - Template extraction

### Shared
- `shared/i18n/translations/en.json` - English translations
- `shared/i18n/translations/de.json` - German translations

## Next Steps After Testing

1. **Document Findings**: Create a list of all failures with:
   - Steps to reproduce
   - Error messages (user and technical)
   - Browser console logs
   - Server logs
   - Network request/response details

2. **Categorize Issues**:
   - Configuration issues (missing env vars)
   - API/LLM issues (timeouts, rate limits)
   - Data format issues (parsing, structure)
   - UI/UX issues (error messages, user experience)

3. **Priority Fixes**:
   - Critical: Blocks core functionality
   - High: Affects user experience significantly
   - Medium: Minor issues, workarounds available
   - Low: Cosmetic or edge cases

## Contact
If you need clarification on any of these tests or find issues not covered here, please document them and we can investigate further.


