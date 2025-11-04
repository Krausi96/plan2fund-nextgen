# Advanced Search AI Integration

## ✅ Yes, Advanced Search Uses OpenAI!

**Location**: `shared/lib/advancedSearchDoctor.ts`

### How It Works:

1. **User enters free text** in advanced search
2. **`performEnhancedTextAnalysis()`** is called (line 142)
3. **Calls OpenAI API** at `/api/ai/openai` (line 155)
4. **AI analyzes** the text for complex requirements:
   - Partnerships, consortiums
   - Technologies (AI, health, etc.)
   - Geographic preferences
   - Funding amounts
   - Industry specializations
5. **Falls back** to basic analysis if API fails (line 185)

### Code Flow:

```typescript
// Line 28: Called when processing user input
const enhancedAnalysis = await this.performEnhancedTextAnalysis(input);

// Line 155: Calls OpenAI API
const response = await fetch('/api/ai/openai', {
  method: 'POST',
  body: JSON.stringify({
    message: `Analyze this funding request for complex requirements: "${input}"`,
    context: {
      sectionId: 'advanced_search_analysis',
      sectionTitle: 'Advanced Search Analysis',
      // ... guidance for AI
    },
    action: 'generate'
  })
});

// Line 178: Parses AI response
return this.parseAIEnhancedAnalysis(aiResponse.content, input);

// Line 185: Fallback if API fails
return this.performBasicTextAnalysis(input);
```

### What AI Does:

1. **Extracts complex requirements** from free text
2. **Identifies** partnerships, technologies, locations
3. **Creates chips** with confidence scores
4. **Generates clarifications** for missing info
5. **Enhances recommendations** with AI insights

### Current Status:

- ✅ **Connected**: Uses `/api/ai/openai` endpoint
- ✅ **Fallback**: Works without API key (basic analysis)
- ✅ **Same endpoint**: Uses the same OpenAI setup as editor

### With API Key:

- **Real AI analysis** of complex requirements
- **Better requirement extraction**
- **Smarter program matching**

### Without API Key:

- **Falls back** to `performBasicTextAnalysis()`
- **Still works** but less sophisticated
- **Uses pattern matching** instead of AI

## 🎯 Summary

**Advanced Search IS using OpenAI!** 

- Same API endpoint as editor (`/api/ai/openai`)
- Falls back gracefully if API unavailable
- Same setup - just add `OPENAI_API_KEY` to `.env.local`

**All AI features use the same integration:**
1. ✅ Editor Generate buttons → `/api/ai/openai`
2. ✅ Advanced Search → `/api/ai/openai`
3. ✅ AI Chat Assistant → `/api/ai/openai`

One API key enables all features! 🚀

