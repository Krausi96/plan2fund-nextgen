# Testing Guide: Reco → Editor Transition

## 🎯 Quick Answer

**Yes, `recommend.ts` exists and IS connected to custom LLM endpoint!**

- ✅ `recommend.ts` exists at `pages/api/programs/recommend.ts`
- ✅ Uses `isCustomLLMEnabled()` to check for custom LLM
- ✅ Uses `callCustomLLM()` if `CUSTOM_LLM_ENDPOINT` is set
- ✅ Falls back to OpenAI if custom LLM not enabled
- ✅ `extractWithLLM()` also uses custom LLM (same pattern)

---

## 🔧 Setup for Testing

### Environment Variables

**For Custom LLM:**
```bash
CUSTOM_LLM_ENDPOINT=https://your-custom-llm-endpoint.com/v1/chat/completions
CUSTOM_LLM_API_KEY=your-api-key  # Optional
CUSTOM_LLM_MODEL=your-model-name  # Optional
CUSTOM_LLM_TIMEOUT=40000  # Optional, default 40s
```

**For OpenAI (Fallback):**
```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # Optional
```

**Priority:**
1. If `CUSTOM_LLM_ENDPOINT` is set → Uses custom LLM
2. If not set → Uses OpenAI (if `OPENAI_API_KEY` is set)
3. If neither → Error

---

## 🧪 Test 1: Reco Flow (ProgramFinder)

### Step 1: Start Application
```bash
npm run dev
```

### Step 2: Navigate to ProgramFinder
- Go to `/reco` or wherever ProgramFinder is mounted
- You should see Q&A form

### Step 3: Answer Questions
Answer at least 6 questions:
- Location: "Austria"
- Company Type: "startup"
- Funding Amount: 50000
- Industry Focus: "digital"
- Company Stage: "early_stage"
- Co-financing: "Yes"

### Step 4: Click "Generate"
- Click "Generate" button
- Should show loading state
- Check browser console for logs

### Step 5: Check Console Logs

**Expected Logs:**
```
📥 Received request with answers: [...]
🤖 Generating programs with LLM (unrestricted, like ChatGPT)...
🔑 Checking LLM availability... { hasOpenAI: true/false, hasCustomLLM: true/false }
📤 Calling generateProgramsWithLLM with answers and maxPrograms: 40
🤖 Calling LLM to generate programs (using extractWithLLM pattern)...
📝 User profile: Location: Austria...
```

**If Custom LLM:**
```
🔗 Calling Custom LLM: https://..., model: ...
✅ Custom LLM response received (model-name)
```

**If OpenAI:**
```
✅ OpenAI response received (gpt-4o-mini)
```

**Then for each program:**
```
✅ Extracted detailed requirements for [program name]
```

### Step 6: Verify Results
- Should see 5 programs displayed
- Each should have:
  - Program name
  - Match score (badge)
  - Funding amount
  - Matches (green section)
  - Gaps (yellow section)
  - "View Details" button

### Step 7: Check Network Tab
- Open browser DevTools → Network tab
- Look for `POST /api/programs/recommend`
- Check response:
  ```json
  {
    "success": true,
    "programs": [
      {
        "id": "llm_...",
        "name": "...",
        "categorized_requirements": {
          "geographic": [...],
          "eligibility": [...],
          // ... 15 categories
        }
      }
    ],
    "count": 5,
    "source": "llm_generated"
  }
  ```

### Step 8: Verify localStorage
- Open browser DevTools → Application → Local Storage
- Check `recoResults` - should have scored programs
- Check `userAnswers` - should have your answers

---

## 🧪 Test 2: Program Selection → Editor Transition

### Step 1: Select a Program
- Click "View Details" or click on a program card
- Should navigate to `/editor?product=submission`

### Step 2: Check localStorage After Selection
- Open DevTools → Application → Local Storage
- Check `selectedProgram`:
  ```json
  {
    "id": "llm_...",
    "name": "...",
    "categorized_requirements": {
      "geographic": [...],
      "eligibility": [...],
      // ... 15 categories
    },
    "type": "grant",
    "url": "...",
    "selectedAt": "2024-01-15T10:30:00.000Z",
    "metadata": {
      "funding_amount_min": 50000,
      "funding_amount_max": 500000,
      "currency": "EUR"
    }
  }
  ```

### Step 3: Verify Editor Loads Program
- Editor should load
- Check editor header - should show program name
- Check console for:
  ```
  ✅ Loaded categorized_requirements from localStorage: 15 categories
  ```

### Step 4: Test RequirementsModal
- Click "Requirements" button (if available)
- Should open RequirementsModal
- Should show program-specific requirements
- Check for: "🎯 Program-Specific Requirements ([program name])"
- Should list requirements for each section

### Step 5: Test aiHelper
- Open a section in editor (e.g., "Financial Plan")
- Click "Generate" or "AI Assist"
- Check console for:
  ```
  ✅ Loaded categorized_requirements from localStorage: 15 categories
  ```
- AI should generate content
- Content should reflect program requirements

### Step 6: Verify AI Prompt Includes Requirements
- Check network tab for OpenAI/Custom LLM call
- Or add console.log in aiHelper.ts to see prompt
- Prompt should include:
  ```
  === PROGRAM-SPECIFIC REQUIREMENTS FOR FINANCIAL_PLAN ===
  - Minimum 20% own contribution required
  - Up to 80% of eligible costs
  ```

---

## 🔍 Debugging Checklist

### If Reco Doesn't Work:

**Check 1: LLM Configuration**
```bash
# Check environment variables
echo $CUSTOM_LLM_ENDPOINT
echo $OPENAI_API_KEY
```

**Check 2: API Endpoint**
- Verify `/api/programs/recommend` exists
- Check server logs for errors

**Check 3: Console Errors**
- Open browser console
- Look for error messages
- Check network tab for failed requests

**Check 4: LLM Response**
- Check server logs for LLM responses
- Verify JSON parsing works
- Check if programs array is populated

### If Editor Doesn't Load Program:

**Check 1: localStorage**
- Verify `selectedProgram` exists
- Check timestamp (must be < 1 hour old)
- Verify JSON is valid

**Check 2: Editor Console**
- Look for: "✅ Loaded categorized_requirements from localStorage"
- Check for errors parsing program data

**Check 3: RequirementsModal**
- Verify `programData` prop is passed
- Check if `categorized_requirements` exists
- Verify category mapping works

**Check 4: aiHelper**
- Verify reads from localStorage
- Check if `getRequirementsForSection()` works
- Verify requirements included in prompt

---

## 📊 Expected Data Flow

### Reco → localStorage:
```typescript
localStorage.setItem('selectedProgram', JSON.stringify({
  id: "llm_...",
  name: "...",
  categorized_requirements: {
    geographic: [...],
    eligibility: [...],
    financial: [...],
    // ... 15 categories
  },
  type: "grant",
  url: "...",
  selectedAt: "2024-01-15T10:30:00.000Z",
  metadata: {...}
}));
```

### Editor Reads:
```typescript
const stored = localStorage.getItem('selectedProgram');
const programData = JSON.parse(stored);
// programData.categorized_requirements = { 15 categories }
```

### RequirementsModal Uses:
```typescript
// Gets via props
programData.categorized_requirements

// Maps section → category
getProgramRequirementsForSection(
  categorized_requirements,
  'financial'  // section category
)

// Returns: ["Minimum 20% own contribution required", ...]
```

### aiHelper Uses:
```typescript
// Reads from localStorage
const stored = localStorage.getItem('selectedProgram');
const categorized = JSON.parse(stored).categorized_requirements;

// Maps section → category
getRequirementsForSection('financial_plan', categorized)

// Includes in prompt
=== PROGRAM-SPECIFIC REQUIREMENTS FOR FINANCIAL_PLAN ===
- Minimum 20% own contribution required
```

---

## ✅ Success Criteria

### Reco Works If:
- ✅ Generates 5 programs when user answers 6+ questions
- ✅ Programs have `categorized_requirements` with 15 categories
- ✅ Programs are scored and sorted by relevance
- ✅ User can select a program
- ✅ Console shows LLM calls (custom or OpenAI)

### Editor Transition Works If:
- ✅ Selected program stored in localStorage
- ✅ Editor loads program name in header
- ✅ `categorized_requirements` loaded (15 categories)
- ✅ RequirementsModal shows program requirements
- ✅ aiHelper includes requirements in AI prompts
- ✅ AI generates content reflecting requirements

---

## 🐛 Common Issues

### Issue 1: No Programs Generated
**Symptoms:** Empty results, error message
**Check:**
- LLM API key configured?
- Custom LLM endpoint accessible?
- Check server logs for LLM errors
- Verify network connectivity

### Issue 2: Programs Have No Requirements
**Symptoms:** Programs displayed but no `categorized_requirements`
**Check:**
- `extractWithLLM()` called?
- Check console for extraction logs
- Verify LLM extraction response
- Check fallback requirements used

### Issue 3: Editor Doesn't Show Program
**Symptoms:** Editor loads but no program name
**Check:**
- `selectedProgram` in localStorage?
- Timestamp valid (< 1 hour)?
- Editor console errors?
- Check `programData` state

### Issue 4: Requirements Not in AI Prompt
**Symptoms:** AI generates but doesn't reflect requirements
**Check:**
- `categorized_requirements` loaded?
- `getRequirementsForSection()` returns values?
- Check prompt in console/logs
- Verify section → category mapping

---

## 📝 Testing Checklist

### Reco Testing:
- [ ] Q&A form displays correctly
- [ ] Can answer 6+ questions
- [ ] "Generate" button works
- [ ] API call succeeds
- [ ] LLM generates programs (check logs)
- [ ] Programs extracted with requirements (check logs)
- [ ] 5 programs displayed
- [ ] Programs have scores
- [ ] Can select a program

### Editor Transition Testing:
- [ ] Program stored in localStorage after selection
- [ ] Editor loads program name
- [ ] `categorized_requirements` loaded (15 categories)
- [ ] RequirementsModal shows requirements
- [ ] aiHelper reads from localStorage
- [ ] AI prompt includes requirements
- [ ] AI generates content with requirements

---

## 🔗 Custom LLM Connection Details

### How recommend.ts Uses Custom LLM:

**1. Program Generation:**
```typescript
// Line 534-597
if (isCustomLLMEnabled()) {
  customResponse = await callCustomLLM({
    messages,
    responseFormat: 'json',
    temperature: 0.3,
    maxTokens: 4000,
  });
  responseText = customResponse.output;
}
```

**2. Requirement Extraction:**
```typescript
// extractWithLLM() also uses custom LLM
// Line 227-298 in llmExtract.ts
if (isCustomLLMEnabled()) {
  customResponse = await callCustomLLM({
    messages,
    responseFormat: 'json',
    temperature: 0.3,
    maxTokens: 4000,
  });
}
```

**Both use the same pattern!** ✅

---

## 🚀 Quick Test Commands

### Check if recommend.ts exists:
```bash
ls pages/api/programs/recommend.ts
```

### Check custom LLM connection:
```bash
# In recommend.ts, look for:
grep -n "isCustomLLMEnabled\|callCustomLLM" pages/api/programs/recommend.ts
```

### Check environment variables:
```bash
# In .env or .env.local
cat .env.local | grep CUSTOM_LLM
cat .env.local | grep OPENAI
```

### Test API directly:
```bash
curl -X POST http://localhost:3000/api/programs/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "location": "austria",
      "company_type": "startup",
      "funding_amount": 50000
    },
    "max_results": 5
  }'
```

---

**Last Updated:** 2024-01-XX
**Status:** Ready for testing

