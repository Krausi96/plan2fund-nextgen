# How to Disable Seed URLs (Test LLM Fallback)

## Overview

You can now disable seed URLs to test the **Tier 3 LLM fallback** (like ChatGPT). This allows you to test how the system works without live URL extraction.

---

## Method 1: API Parameter (Recommended for Testing)

### In Frontend

**Option A: Via Environment Variable**
```typescript
// In ProgramFinder.tsx, seeds are disabled if:
const useSeeds = !process.env.NEXT_PUBLIC_DISABLE_SEEDS;
```

**Set in `.env.local`**:
```bash
NEXT_PUBLIC_DISABLE_SEEDS=true
```

**Option B: Direct API Call**
```typescript
const response = await fetch('/api/programs/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    answers,
    max_results: 20,
    use_seeds: false, // Disable seeds
  }),
});
```

### Direct API Call (curl)

```bash
curl -X POST http://localhost:3000/api/programs/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "location": "austria",
      "company_type": "startup",
      "funding_amount": "100kto500k"
    },
    "max_results": 10,
    "use_seeds": false
  }'
```

---

## Method 2: Environment Variable (Server-Side)

**Set in Vercel Environment Variables**:
```
DISABLE_SEED_URLS=true
```

**Or in `.env.local`**:
```bash
DISABLE_SEED_URLS=true
```

**Note**: This disables seeds globally for all requests.

---

## How It Works

### When Seeds Are Disabled

1. **Tier 1 (URL Extraction)**: Skipped
2. **Tier 3 (LLM Fallback)**: Activated automatically
3. **LLM generates programs** based on user profile (like ChatGPT)
4. **Programs are structured** into our 35-category format
5. **Programs are scored** using our scoring algorithm
6. **Programs are ranked** (Top 5)

### What You Get

**Response includes**:
```json
{
  "success": true,
  "programs": [...],
  "source": "llm_fallback",
  "fallback_used": true,
  "message": "Generated X programs using LLM fallback (like ChatGPT)"
}
```

**Programs have**:
- `source: "llm_generated"` - Identifies LLM-generated programs
- Structured `categorized_requirements` - Same format as URL-extracted programs
- Scored and ranked - Just like URL-extracted programs

---

## Comparison: With vs Without Seeds

### With Seeds (Tier 1)
- ✅ **Real, current data** from live web pages
- ✅ **Always up-to-date**
- ✅ **Actual program details** from official sources
- ❌ **Requires seed URLs** to be available
- ❌ **Slower** (needs to fetch HTML)

### Without Seeds (Tier 3 - LLM Fallback)
- ✅ **Works without URLs** (like ChatGPT)
- ✅ **Fast** (no HTML fetching)
- ✅ **Structured output** (35 categories)
- ✅ **Scored and ranked** (ChatGPT can't do this!)
- ⚠️ **May be outdated** (LLM training data)
- ⚠️ **May be less accurate** (no live verification)

---

## Testing

### Test Script

```typescript
// Test LLM fallback
const response = await fetch('/api/programs/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    answers: {
      location: 'austria',
      company_type: 'startup',
      funding_amount: '100kto500k',
      industry_focus: ['digital']
    },
    max_results: 10,
    use_seeds: false // Disable seeds
  }),
});

const data = await response.json();
console.log('Source:', data.source); // Should be "llm_fallback"
console.log('Fallback used:', data.fallback_used); // Should be true
console.log('Programs:', data.programs);
```

### Expected Output

```json
{
  "success": true,
  "programs": [
    {
      "id": "llm_ffg_general_programme",
      "name": "FFG General Programme",
      "source": "llm_generated",
      "categorized_requirements": {
        "geographic": [{"type": "location", "value": "Austria", "confidence": 0.8}],
        "eligibility": [{"type": "company_type", "value": "startup", "confidence": 0.8}],
        ...
      },
      ...
    }
  ],
  "source": "llm_fallback",
  "fallback_used": true
}
```

---

## Requirements

**LLM must be configured**:
- `OPENAI_API_KEY` (for OpenAI)
- OR `CUSTOM_LLM_ENDPOINT` (for custom LLM)

**If LLM is not available**:
- System returns empty programs array
- Error logged: `❌ LLM fallback failed`

---

## Use Cases

### 1. Testing LLM Fallback
- Test how system works without seed URLs
- Compare with ChatGPT behavior
- Validate LLM-generated programs

### 2. Development
- Test without needing seed URLs
- Faster iteration (no HTML fetching)
- Test scoring/ranking with LLM programs

### 3. Production Fallback
- If seed URLs fail, system automatically uses LLM fallback
- Ensures system always works (like ChatGPT)

---

## Notes

- **LLM programs are still scored and ranked** - This is our advantage over ChatGPT!
- **Same format as URL-extracted programs** - Works with existing scoring engine
- **Fallback is automatic** - If seeds fail, LLM fallback activates
- **Can be combined** - You can use both (seeds first, LLM as backup)

---

## Troubleshooting

### Issue: No programs returned

**Check**:
1. LLM API key is set (`OPENAI_API_KEY` or `CUSTOM_LLM_ENDPOINT`)
2. LLM is responding (check logs)
3. User answers are provided

**Logs to check**:
```
⚠️ No programs from URL extraction, using LLM fallback (Tier 3)
❌ LLM fallback failed: [error]
```

### Issue: Invalid JSON response

**Check**:
- LLM response format
- JSON parsing logic
- Response structure

**Fix**: LLM should return JSON array or object with `programs` array

---

## Summary

**To disable seeds**:
1. Set `use_seeds: false` in API request, OR
2. Set `DISABLE_SEED_URLS=true` environment variable, OR
3. Set `NEXT_PUBLIC_DISABLE_SEEDS=true` (frontend)

**What happens**:
- Tier 1 (URL extraction) skipped
- Tier 3 (LLM fallback) activated
- Programs generated by LLM (like ChatGPT)
- Programs structured, scored, and ranked (our advantage!)

**Result**:
- System works without seed URLs ✅
- Like ChatGPT, but with structured output ✅
- Scored and ranked (ChatGPT can't do this!) ✅

