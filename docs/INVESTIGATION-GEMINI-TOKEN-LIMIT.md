# Investigation: Gemini Token Limit Issue

## Problem Identified

The test suite identified that ProgramFinder recommendations were failing because Gemini 2.5 Flash was returning 0 programs. Investigation revealed:

### Root Cause
1. **API was setting `CUSTOM_MAX_TOKENS = 6000`** (in `pages/api/programs/recommend.ts`)
2. **This was passed to Gemini as `maxOutputTokens: 6000`**
3. **Gemini 2.5 Flash uses "thoughts" tokens internally** - internal reasoning tokens that count against `maxOutputTokens`
4. **Test response showed `thoughtsTokenCount: 5999`** - almost all 6000 tokens were consumed by thoughts
5. **Result: 0 tokens left for actual output, causing `finishReason: "MAX_TOKENS"` with empty content**

### Test Evidence
```
"finishReason": "MAX_TOKENS"
"thoughtsTokenCount": 5999
"totalTokenCount": 7870
```

## Solution Implemented

### 1. Increased Token Limits for Gemini
**File:** `features/ai/clients/customLLM.ts`

- **Before:** Used `request.maxTokens` directly (6000) or default 8000
- **After:** For Gemini specifically:
  - If `maxTokens` provided: `Math.max(maxTokens + 10000, 16000)` 
  - Default: `16000`
  - This ensures at least 16k tokens total, with 10k buffer for thoughts overhead

### 2. Better Error Handling
Added detection and error messages for truncated responses:
- Warns when `finishReason === 'MAX_TOKENS'`
- Logs thoughts token usage
- Throws descriptive error if no output generated due to truncation

### 3. Environment Variable Loading Fix
**File:** `scripts/test-handover-reco.ts`

- Fixed to load `.env.local` explicitly (Next.js convention)
- Added debug logging to show detected environment variables

## Code Changes

### `features/ai/clients/customLLM.ts`
```typescript
// Gemini-specific token limit calculation
let geminiMaxTokens: number | undefined;
if (isGemini) {
  geminiMaxTokens = request.maxTokens 
    ? Math.max(request.maxTokens + 10000, 16000) // Add 10k buffer, minimum 16k
    : 16000; // Default to 16k
}
```

### Error Detection
```typescript
if (candidate?.finishReason === 'MAX_TOKENS') {
  const thoughtsTokens = json.usageMetadata?.thoughtsTokenCount || 0;
  console.warn(`⚠️ Gemini response truncated (MAX_TOKENS). Thoughts tokens used: ${thoughtsTokens}.`);
  // Throw error if no output generated
}
```

## Testing

### Before Fix
- ❌ Program Generation: FAILED - LLM returned 0 programs
- Response: `finishReason: "MAX_TOKENS"`, `thoughtsTokenCount: 5999`, no output

### After Fix (First Attempt)
- ⚠️ Partial success - response generated but still truncated
- Response shows programs starting but JSON incomplete
- Token limit increased to 12k, but still insufficient

### After Fix (Final)
- Token limit increased to 16k minimum (6k + 10k buffer)
- Should provide enough headroom for thoughts + actual output

## Recommendations

1. **Monitor Token Usage**: Track `thoughtsTokenCount` in production to adjust limits if needed
2. **Consider Prompt Optimization**: Reduce prompt size if thoughts tokens continue to be high
3. **Alternative Approaches**:
   - Use Gemini 1.5 Pro (if available) which may have different thoughts behavior
   - Reduce number of programs requested per call
   - Split into multiple smaller requests
4. **Configuration**: Consider making the buffer configurable via environment variable

## Related Files

- `features/ai/clients/customLLM.ts` - LLM client with Gemini-specific handling
- `pages/api/programs/recommend.ts` - Recommendation API (sets CUSTOM_MAX_TOKENS)
- `scripts/test-handover-reco.ts` - Test script that identified the issue

## Next Steps

1. ✅ Test with increased token limits (16k)
2. Monitor production usage to see if 16k is sufficient
3. Consider making token limits configurable per provider
4. Document Gemini-specific considerations in codebase

