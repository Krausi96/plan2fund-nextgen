# Recommender System Simplification Proposal

## Goal
Simplify the recommender system while maintaining **truly unbiased**, high-quality results. **No additional files** - modify existing components only.

---

## Current State Analysis

### What Works Well
- ✅ Structured wizard captures all critical fields (location, company_type, funding_amount, company_stage)
- ✅ LLM generates programs when database lacks matches
- ✅ Scoring engine ranks programs objectively
- ✅ Minimum 4 questions required ensures quality matches

### Critical Bias Issues
- ❌ **Hardcoded questions are inherently biased** - They force users into predefined categories
- ❌ **Dropdown options limit thinking** - Users pick from options rather than describe naturally
- ❌ **Question order influences answers** - Earlier questions frame later ones
- ❌ **Structured forms feel like a test** - Users try to "pass" rather than describe honestly

---

## Recommended Approach: **Conversational Guidance (Unbiased)**

### Core Principle
**Guide through examples, not questions. Extract through conversation, not forms.**

### Why This is Unbiased
1. **No leading questions** - Users describe in their own words
2. **No predefined categories** - LLM understands natural language
3. **Contextual follow-ups** - LLM asks only what's missing, conversationally
4. **User verification** - Show extracted info for transparency
5. **Same matching engine** - Consistent, objective scoring

### Implementation (No New Files)

#### Option A: **Conversational Guidance (Recommended - Truly Unbiased)**
**Replace wizard with conversational LLM-driven flow**

1. **Single textarea with helpful examples** (not questions)
   ```
   "Tell us about your project and funding needs...
   
   For example, you might mention:
   - What your company does and where it's based
   - What stage you're at (idea, just started, growing, etc.)
   - How much funding you need and what for
   - Whether you can provide co-financing
   - Your industry or focus areas
   
   Don't worry about being complete - we'll ask if we need more info."
   ```

2. **LLM extracts + asks follow-ups conversationally**
   - Extract: location, company_type, company_stage, funding_amount, co_financing, industry_focus
   - If critical info missing → LLM asks natural follow-up questions (not structured)
   - Example: "I see you're working on a tech project. Where is your company based?" (not a dropdown)

3. **Show extracted info for verification**
   - Display extracted attributes in a simple list
   - User can edit any field (free text, not dropdowns)
   - "Is this correct?" confirmation

4. **Generate recommendations**
   - Once all critical fields captured → generate recommendations
   - Same matching engine (no changes)

**Benefits:**
- ✅ **Truly unbiased** - No leading questions or categories
- ✅ **Natural conversation** - Feels like talking to a consultant
- ✅ **Complete data** - LLM ensures all critical fields captured
- ✅ **User control** - Can verify/edit everything
- ✅ **Simple UI** - One textarea + conversational follow-ups
- ✅ **No new files** - Modify `ProgramFinder.tsx` + add one API route

---

#### Option B: **Guided Examples (Simpler Alternative)**
**Single textarea with smart examples, no follow-ups**

1. **Textarea with contextual examples**
   - Show different example prompts based on what user types
   - Examples guide without forcing categories
   - "You might want to mention..." hints

2. **One-shot extraction**
   - LLM extracts everything from single input
   - If critical info missing → show simple "We need a bit more info" message
   - User adds more text → re-extract

3. **Show extracted info**
   - Display extracted attributes
   - User can edit (free text fields)
   - Generate recommendations

**Benefits:**
- ✅ Simpler implementation
- ✅ Still unbiased (no structured questions)
- ⚠️ May require multiple iterations if info missing
- ⚠️ Less conversational

---

## Recommendation: **Option A (Conversational Guidance)**

### Why This Approach?

1. **Truly Unbiased**
   - No hardcoded questions = no leading
   - No dropdowns = no category bias
   - Natural conversation = honest answers
   - Examples guide without forcing

2. **Complete Data Capture**
   - LLM ensures all critical fields extracted
   - Conversational follow-ups fill gaps naturally
   - User verification prevents errors

3. **Simple Implementation**
   - Modify `ProgramFinder.tsx` (replace wizard with textarea + conversation)
   - Add `/api/reco/extract-attributes.ts` (reuse LLM code)
   - Add `/api/reco/conversational-followup.ts` (simple LLM chat)
   - No new components, just API routes

4. **Better User Experience**
   - Feels like talking to a helpful consultant
   - Not like filling out a form
   - Progressive disclosure (only ask what's needed)

---

## Implementation Plan

### Step 1: Add Extraction API (Reuse Existing Code)
**File: `pages/api/reco/extract-attributes.ts`** (new, but simple)

```typescript
// Extract structured answers from free text
// Reuse LLM calling logic from recommend.ts
// Return: { location, company_type, company_stage, funding_amount, ... }
```

### Step 2: Modify ProgramFinder
**File: `features/reco/components/ProgramFinder.tsx`**

1. Add textarea at top (before wizard)
2. Add "Extract from description" button
3. Call extraction API on button click
4. Pre-populate `answers` state with extracted values
5. Show extraction status (which fields were extracted)
6. User can edit/complete wizard as normal

### Step 3: No Changes Needed
- ✅ Matching engine (`enhancedRecoEngine.ts`) - works as-is
- ✅ Recommend API (`recommend.ts`) - works as-is
- ✅ Scoring logic - unchanged

---

## Comparison: Which Gets Best Unbiased Results?

| Approach | Unbiased Input | Complete Data | User Control | Implementation |
|----------|---------------|---------------|--------------|----------------|
| **Option A: Conversational** | ✅✅✅ Natural, no leading | ✅ LLM ensures all | ✅ User verifies | Medium |
| **Option B: Guided Examples** | ✅✅ Natural, examples only | ⚠️ May need iterations | ✅ User edits | Easy |
| **Old Wizard** | ❌ Structured questions | ✅ All fields | ✅ Direct control | Done |

**Winner: Option A** - Truly unbiased (no questions), complete data (conversational follow-ups), and good UX.

---

## Decision Matrix

### Choose **Option A (Conversational)** if:
- ✅ You want **truly unbiased** results (no hardcoded questions)
- ✅ You want complete data (LLM ensures all critical fields)
- ✅ You want natural UX (feels like conversation, not form)
- ✅ You want user control (can verify/edit everything)

### Choose **Option B (Guided Examples)** if:
- ✅ You want simpler implementation (no conversational follow-ups)
- ✅ You're okay with users potentially needing multiple iterations
- ✅ You want fastest initial experience

### Keep **Current Wizard** if:
- ⚠️ You're okay with structured questions (inherently biased)
- ⚠️ You want fastest implementation (already done)
- ⚠️ You prefer form-based UX

---

## Recommendation Summary

**Implement Option A (Conversational Guidance):**

1. **Replace wizard with conversational flow** in `ProgramFinder.tsx`
   - Single textarea with helpful examples (not questions)
   - Show extracted info for verification
   - LLM asks follow-up questions conversationally if needed

2. **Add extraction API** `/api/reco/extract-attributes.ts`
   - Extract all critical fields from free text
   - Return structured data + missing fields list

3. **Add conversational follow-up API** `/api/reco/conversational-followup.ts`
   - LLM asks natural follow-up questions (not structured)
   - Example: "I see you're in tech. Where is your company based?" (not dropdown)

4. **User verification step**
   - Show extracted attributes in simple list
   - User can edit any field (free text, not dropdowns)
   - "Is this correct?" confirmation

5. **Same matching engine**
   - Once all critical fields captured → generate recommendations
   - No changes to scoring logic

**Result:**
- **Truly unbiased** (no hardcoded questions) ✅✅✅
- Complete data (conversational follow-ups ensure all fields) ✅
- Natural UX (feels like talking to consultant) ✅
- Simple implementation (modify existing files only) ✅
- User transparency (can verify/edit everything) ✅

---

## Implementation Details

### API Endpoint: `/api/reco/extract-attributes.ts`

```typescript
// Extract structured answers from free text
// Input: { text: "I'm a startup in Vienna..." }
// Output: { 
//   extracted: { location: "austria", company_type: "startup", ... },
//   missing: ["funding_amount"], // Critical fields still needed
//   confidence: { location: 0.95, company_type: 0.9, ... }
// }
```

### API Endpoint: `/api/reco/conversational-followup.ts`

```typescript
// LLM asks natural follow-up questions
// Input: { 
//   currentText: "I'm a startup in Vienna...",
//   extracted: { location: "austria", company_type: "startup" },
//   missing: ["funding_amount"]
// }
// Output: { 
//   question: "I see you're a startup in Vienna. How much funding are you looking for?",
//   context: "Asking about funding_amount"
// }
```

### UI Flow in `ProgramFinder.tsx`

1. **Initial state**: Textarea with examples
2. **User types** → Extract on button click or auto-extract after pause
3. **Show extracted info** → User verifies/edits
4. **If missing critical fields** → Show conversational follow-up question
5. **User answers follow-up** → Re-extract, repeat until complete
6. **All critical fields present** → Generate recommendations

### Key Differences from Current Wizard

| Current Wizard | New Conversational |
|----------------|-------------------|
| Hardcoded questions | Natural conversation |
| Dropdown options | Free text everywhere |
| Fixed question order | Contextual follow-ups |
| Form-like | Consultant-like |
| "What type of company?" | "Tell me about your company..." |

---

## Concrete Example: How It Works

### Current Wizard (Biased)
```
Q1: "What type of company are you?"
   [Dropdown: Pre-founder, Startup, SME, Research, Other]
   → Forces user into predefined categories

Q2: "Where is your company based?"
   [Dropdown: Austria, Germany, EU, International]
   → Limits thinking to these options

Q3: "What stage is your company at?"
   [Dropdown: Idea, Pre-company, <6 months, 6-36 months, 36+ months]
   → Arbitrary time buckets may not match user's reality
```

### New Conversational (Unbiased)
```
User types: "I'm working on a climate tech startup in Vienna. 
We've been incorporated for about 8 months and need around 
€150k to build our MVP and hire our first engineer. We can 
put in about 30% ourselves."

LLM extracts:
- location: "austria" (from "Vienna")
- company_type: "startup" (from "startup")
- company_stage: "inc_6_36m" (from "8 months" → maps to 6-36m)
- funding_amount: 150000 (from "€150k")
- co_financing: "co_yes" (from "30% ourselves")
- industry_focus: ["environmental"] (from "climate tech")

If missing funding_amount, LLM asks conversationally:
"I see you're working on a climate tech startup in Vienna. 
How much funding are you looking for, and what will you 
use it for?"

Not: "What is your funding amount?" [Dropdown: €0-50k, €50k-100k...]
```

### Key Difference
- **Wizard**: "What type of company?" → Forces category selection
- **Conversational**: "Tell me about your company..." → User describes naturally, LLM understands

---

## Next Steps

1. **Decide on approach** (Option A - Conversational, or Option B - Guided Examples)
2. **If Option A**: I'll implement conversational flow (textarea + extraction + follow-ups)
3. **If Option B**: I'll implement guided examples (textarea + one-shot extraction)

**Which approach do you prefer?**

