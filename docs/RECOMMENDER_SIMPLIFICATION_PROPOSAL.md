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

## Recommended Approach: **Guided Prompt Template with Single Extraction (Simplest & Best Balance)**

### Core Principle
**Show users what information matters (guidance), let them describe naturally (freedom), extract everything in one LLM call (simple).**

### Why This is Unbiased
1. **Guidance on variables** - Shows WHAT information matters (not HOW to answer)
2. **Natural answers** - User describes in free text (not dropdowns)
3. **Single extraction** - One LLM call extracts everything at once (fast, cheap)
4. **No hardcoded questions** - User fills in template naturally
5. **User verification** - Show extracted info for transparency
6. **Same matching engine** - Consistent, objective scoring

### Implementation (No New Files)

#### Option A: **Smart Template with Contextual Hints (Recommended - Creative Hybrid)**
**Template with adaptive hints that appear as user types**

1. **Show template with variable sections** (guides WHAT to include)
   ```
   "Tell us about your project and funding situation:
   
   📍 Location: [Where is your company based?]
   💡 Hint: e.g., "Vienna, Austria" or "Berlin, Germany"
   
   🏢 Company: [What kind of company are you?]
   💡 Hint: e.g., "Startup", "SME", "Research institution"
   
   💰 Funding: [How much funding do you need?]
   💡 Hint: e.g., "€150,000 for MVP development"
   
   📅 Stage: [How far along is your company?]
   💡 Hint: e.g., "Just incorporated 3 months ago" or "Idea stage"
   
   💵 Co-financing: [Can you provide matching funds?]
   💡 Hint: e.g., "Yes, 30%" or "No, we need 100% grant"
   
   🏭 Industry: [What industry are you in?] (optional)
   💡 Hint: e.g., "Climate tech", "Healthcare", "AI/ML"
   ```

2. **Smart contextual hints** (appear as user types, adapt to what they've written)
   - User types "Vienna" in Location → Hints update for other sections:
     - Company hint: "Austrian startup" or "SME in Austria"
     - Funding hint: "Consider Austrian programs like FFG or AWS"
   - User types "startup" in Company → Hints update:
     - Stage hint: "How long since incorporation?" or "Pre-company?"
     - Funding hint: "Typical startup funding: €50k-€500k"
   - User types "€150k" in Funding → Hints update:
     - Co-financing hint: "Many programs require 20-30% co-financing"
   
   **Hints are contextual, not hardcoded** - They adapt based on what user writes

3. **User fills in template naturally** (free text, with helpful hints)
   ```
   Location: Vienna, Austria
   Company: Climate tech startup
   Funding: Around €150k for MVP and hiring
   Stage: Incorporated 8 months ago
   Co-financing: Yes, we can provide 30%
   Industry: Environmental tech, clean energy
   ```

4. **Single LLM extraction** (one call, extracts everything)
   - Extract from all sections at once
   - Map to structured variables (same as before)
   - Show extracted values + missing variables

5. **Generate recommendations**
   - Once all critical variables captured → generate recommendations

**Benefits:**
- ✅✅✅ **Guidance** - Template shows what information matters
- ✅✅✅ **Hints** - Contextual examples help users understand what to write
- ✅✅ **Freedom** - User describes naturally (free text, not dropdowns)
- ✅✅ **Simple** - Single LLM call (fast, cheap)
- ✅ **Unbiased** - Hints adapt to user's input (not hardcoded)
- ✅ **Complete data** - LLM ensures all variables extracted
- ✅ **User control** - Can edit any section, re-extract

---

#### Option B: **Template with Example Answers (Alternative)**
**Template with diverse example answers shown upfront**

1. **Template with example answers visible** (user can use as reference)
   ```
   "Tell us about your project and funding situation:
   
   📍 Location: [Where is your company based?]
   Example: "Vienna, Austria" or "Berlin, Germany" or "EU-wide"
   
   🏢 Company: [What kind of company are you?]
   Example: "Tech startup" or "SME in manufacturing" or "Research institution"
   
   💰 Funding: [How much funding do you need?]
   Example: "€150,000 for product development" or "€50k-€100k range"
   
   📅 Stage: [How far along is your company?]
   Example: "Incorporated 6 months ago" or "Idea stage, not yet incorporated"
   
   💵 Co-financing: [Can you provide matching funds?]
   Example: "Yes, we can provide 30%" or "No, we need 100% grant funding"
   
   🏭 Industry: [What industry are you in?] (optional)
   Example: "Climate tech" or "Healthcare AI" or "Sustainable manufacturing"
   ```

2. **User fills in naturally** (can reference examples, but writes freely)
3. **Single LLM extraction** (same as Option A)

**Benefits:**
- ✅ Clear examples (users see what good answers look like)
- ✅ Still natural (user writes freely, examples are just reference)
- ✅ Single extraction (fast)
- ⚠️ Examples are static (not contextual)

3. **LLM extraction with variable mapping**
   - Extract from free text → map to structured variables:
     - `location`: "Vienna" → "austria", "Berlin" → "germany"
     - `company_type`: "startup" → "startup", "small business" → "sme"
     - `funding_amount`: "€150k" → 150000, "around 50 thousand" → 50000
     - `company_stage`: "8 months old" → "inc_6_36m", "just started" → "inc_lt_6m"
     - `co_financing`: "30% ourselves" → {co_financing: "co_yes", percentage: 30}
     - `industry_focus`: "climate tech" → ["environmental"]

4. **Show extracted variables for verification**
   - Display: "We extracted: Location: Austria, Company: Startup, Funding: €150,000..."
   - User can edit any field (free text, LLM re-extracts)
   - If critical variable missing → show: "We still need: [funding_amount]"

5. **Generate recommendations**
   - Once all critical variables captured → generate recommendations
   - Same matching engine (no changes)

**Benefits:**
- ✅ **Guided but unbiased** - Shows variables needed, not how to answer
- ✅ **Natural input** - Users describe in their own words
- ✅ **Complete data** - LLM maps natural language to structured variables
- ✅ **User control** - Can verify/edit extracted variables
- ✅ **Simple UI** - One textarea + extraction + verification
- ✅ **No new files** - Modify `ProgramFinder.tsx` + add extraction API

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

## Recommendation: **Option A (Smart Template with Contextual Hints)**

### Why This Approach?

1. **Guidance + Hints + Freedom + Simple**
   - **Guidance**: Template shows what variables matter (WHAT to include)
   - **Hints**: Contextual examples help users understand what to write
   - **Freedom**: User describes naturally in each section (HOW to answer)
   - **Simple**: Single LLM call extracts everything at once (fast, cheap)
   - **Best balance**: Gets all four benefits without complexity

2. **User Gets Helpful Guidance**
   - Template clearly shows: Location, Company, Funding, Stage, Co-financing, Industry
   - Hints provide examples (e.g., "Vienna, Austria" or "€150,000 for MVP")
   - Hints adapt as user types (contextual, not static)
   - User doesn't have to guess what information matters or how to format it

3. **Contextual Hints (Smart & Adaptive)**
   - User types "Vienna" → Hints update: "Austrian startup" or "Consider FFG/AWS programs"
   - User types "startup" → Hints update: "How long since incorporation?" or "Typical funding: €50k-€500k"
   - Hints are generated client-side (simple rules) or via lightweight API
   - Not hardcoded - adapts to user's input

4. **Single Extraction (Fast & Cheap)**
   - One LLM call extracts from all sections at once
   - No multiple round-trips
   - Fast response time
   - Lower cost

5. **Complete Data Capture**
   - LLM extracts from all sections
   - Maps natural language to structured variables
   - Shows what's missing (not as questions, just indication)
   - User can edit any section → Re-extract

6. **Simple Implementation**
   - Modify `ProgramFinder.tsx` (replace wizard with template form)
   - Add hint logic (client-side rules or lightweight API)
   - Add `/api/reco/extract-attributes.ts` (single extraction from all sections)
   - Show extracted variables for verification
   - No chat interface, no multiple LLM calls
   - Simple form with free text fields + adaptive hints

### How It Works
1. User sees template with variable sections (Location, Company, Funding, etc.)
2. User starts typing in a section → Hints appear/update based on what they've written
3. User fills in each section naturally (free text, with helpful hints)
4. User clicks "Extract" → Single LLM call extracts everything
5. Show extracted variables + missing (if any)
6. User can edit sections → Re-extract
7. Once complete → Generate recommendations

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

## Comparison: Which Gets Best Balance?

| Approach | Guidance | Hints | Freedom | Unbiased | Simple | Complete Data |
|----------|----------|-------|---------|----------|--------|---------------|
| **Option A: Smart Template** | ✅✅ Template | ✅✅✅ Contextual hints | ✅✅ Natural free text | ✅✅ No hardcoded questions | ✅✅ Single extraction | ✅ All variables |
| **Option B: Template + Examples** | ✅✅ Template | ✅✅ Static examples | ✅✅ Natural free text | ✅✅ No hardcoded questions | ✅✅ Single extraction | ✅ All variables |
| **Old Wizard** | ✅✅ Clear questions | ❌ None | ❌ Dropdowns | ❌ Hardcoded | ✅✅ Simple | ✅ All fields |

**Winner: Option A** - Best balance: Guidance (template) + Hints (contextual examples) + Freedom (natural answers) + Simple (single extraction) + Unbiased (no hardcoded questions).

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

**Implement Option A (Smart Template with Contextual Hints):**

1. **Replace wizard with smart template form** in `ProgramFinder.tsx`
   - Show template with variable sections:
     - Location: [free text field] + 💡 Hint (updates as user types)
     - Company: [free text field] + 💡 Hint (updates as user types)
     - Funding: [free text field] + 💡 Hint (updates as user types)
     - Stage: [free text field] + 💡 Hint (updates as user types)
     - Co-financing: [free text field] + 💡 Hint (updates as user types)
     - Industry: [free text field] + 💡 Hint (updates as user types) (optional)
   - User fills in each section naturally (free text, not dropdowns)
   - Hints update contextually based on what user has written in other sections
   - "Extract" button triggers single LLM call

2. **Add hint logic** (client-side or lightweight API)
   - Simple rules: If user types "Vienna" → Update Company hint to "Austrian startup"
   - Or lightweight API: `/api/reco/contextual-hints` (fast, no LLM needed)
   - Hints are contextual, not hardcoded

3. **Add extraction API** `/api/reco/extract-attributes.ts`
   - Input: All sections as one object
   - Extract from all sections at once → Map to structured variables
   - location: "Vienna, Austria" → "austria"
   - company_type: "Climate tech startup" → "startup"
   - funding_amount: "Around €150k" → 150000
   - company_stage: "Incorporated 8 months ago" → "inc_6_36m"
   - co_financing: "Yes, 30%" → {co_financing: "co_yes", percentage: 30}
   - Return: extracted variables + missing list + confidence scores

4. **Show extracted variables + missing**
   - Display: "We extracted: Location: Austria ✓, Company: Startup ✓..."
   - If missing: "We still need: [funding_amount]" (not a question, just indication)
   - User can edit any section → Click "Extract" again

5. **Generate recommendations**
   - Once all critical variables captured → generate recommendations
   - Same matching engine (no changes to scoring logic)

**Result:**
- **Guidance** (template shows what variables matter) ✅✅
- **Hints** (contextual examples help users understand) ✅✅✅
- **Freedom** (natural free text in each section, not dropdowns) ✅✅
- **Simple** (single LLM extraction, fast & cheap) ✅✅
- **Unbiased** (no hardcoded questions, hints adapt to user) ✅✅
- Complete data (LLM ensures all variables extracted) ✅
- Simple implementation (modify existing files + 1-2 API routes) ✅

---

## Implementation Details

### API Endpoint: `/api/reco/extract-attributes.ts`

```typescript
// Extract structured variables from all template sections (single call)
// Input: { 
//   location: "Vienna, Austria",
//   company: "Climate tech startup",
//   funding: "Around €150k for MVP and hiring",
//   stage: "Incorporated 8 months ago",
//   co_financing: "Yes, we can provide 30%",
//   industry: "Environmental tech, clean energy"
// }
// Output: { 
//   extracted: { 
//     location: "austria",           // Mapped from "Vienna, Austria"
//     company_type: "startup",        // Mapped from "Climate tech startup"
//     funding_amount: 150000,         // Extracted from "Around €150k"
//     company_stage: "inc_6_36m",     // Mapped from "Incorporated 8 months ago"
//     co_financing: "co_yes",         // Extracted from "Yes, we can provide 30%"
//     co_financing_percentage: 30,    // Extracted from "30%"
//     industry_focus: ["environmental"] // Mapped from "Environmental tech"
//   },
//   missing: [],                      // Critical variables still needed (if any)
//   confidence: { 
//     location: 0.95, 
//     company_type: 0.9, 
//     funding_amount: 0.85,
//     company_stage: 0.9,
//     co_financing: 0.95
//   }
// }
```

**LLM Prompt for Extraction:**
```typescript
const EXTRACTION_PROMPT = `
Extract structured variables from user's template responses:

Location: "${location}"
Company: "${company}"
Funding: "${funding}"
Stage: "${stage}"
Co-financing: "${co_financing}"
Industry: "${industry}"

Map to these structured values:
1. location → "austria", "germany", "eu", "international"
2. company_type → "prefounder", "startup", "sme", "research", "other"
3. company_stage → "idea", "pre_company", "inc_lt_6m", "inc_6_36m", "inc_gt_36m", "research_org"
4. funding_amount → Extract number (EUR)
5. co_financing → "co_yes", "co_no", "co_uncertain" + percentage if yes
6. industry_focus → Array of: ["digital", "environmental", "social", etc.]

Return JSON with extracted values and confidence scores.
`;
```

### UI Flow in `ProgramFinder.tsx`

1. **Show template form** with variable sections (Location, Company, Funding, Stage, Co-financing, Industry)
2. **User starts typing in a section** → Hints update contextually based on what they've written
3. **User fills in each section** naturally (free text fields, with helpful hints)
4. **User clicks "Extract"** → Single LLM call extracts from all sections
5. **Show extracted variables** → Display mapped values + missing (if any)
6. **User can edit sections** → Click "Extract" again → Re-extract
7. **Once all critical variables captured** → Show "Generate Recommendations" button
8. **Generate recommendations** → Same matching engine

### UI Components Needed

```typescript
// Template form with:
- TemplateSection (label + free text input + contextual hint for each variable)
  - Location: [textarea] + 💡 Hint (updates as user types)
  - Company: [textarea] + 💡 Hint (updates as user types)
  - Funding: [textarea] + 💡 Hint (updates as user types)
  - Stage: [textarea] + 💡 Hint (updates as user types)
  - Co-financing: [textarea] + 💡 Hint (updates as user types)
  - Industry: [textarea] + 💡 Hint (updates as user types) (optional)
- HintLogic (client-side rules or lightweight API call)
- ExtractButton (triggers single LLM call)
- ExtractedVariablesPanel (shows mapped values)
- MissingVariablesIndicator (shows what's still needed)
- EditButton (user can edit sections and re-extract)
- GenerateButton (when all variables captured)
```

### Hint Logic (Simple Client-Side Rules)

```typescript
// Example hint rules (can be client-side, no API needed)
const getContextualHint = (section: string, otherSections: Record<string, string>) => {
  if (section === 'company' && otherSections.location?.includes('Vienna')) {
    return '💡 e.g., "Austrian startup" or "SME in Austria"';
  }
  if (section === 'funding' && otherSections.company?.includes('startup')) {
    return '💡 Typical startup funding: €50k-€500k';
  }
  if (section === 'stage' && otherSections.company?.includes('startup')) {
    return '💡 e.g., "Just incorporated 3 months ago" or "Pre-company stage"';
  }
  // Default hints
  return getDefaultHint(section);
};
```

### Key Differences from Current Wizard

| Current Wizard | New Guided Template |
|----------------|---------------------|
| Hardcoded questions | Template shows variables (WHAT to include) |
| Same questions for everyone | Same template, but user describes naturally |
| "What type of company?" [Dropdown] | "Company: [free text]" → User describes naturally |
| Forces category selection | LLM maps natural language to categories |
| Fixed question order | User fills in any order |
| Form-like (one question at a time) | Template form (all sections visible) |
| Structured answers required | Natural free text in each section |
| User picks from options | User writes freely, LLM understands |
| Multiple steps | Single extraction |

### The Perfect Balance

**Guidance (Q&A):**
- ✅ LLM asks questions to help users know what to answer
- ✅ Questions provide context and guidance
- ✅ Users don't have to guess what to include

**Freedom (Natural Answers):**
- ✅ Users answer in free text (not dropdowns)
- ✅ No structured options to choose from
- ✅ Users describe in their own words

**Unbiased (Adaptive Questions):**
- ✅ Questions adapt to what user already said
- ✅ Not hardcoded - each conversation is unique
- ✅ Questions are contextual and relevant
- ✅ No bias from fixed question structure

**LLM Handles Everything:**
- ✅ Extracts from natural language answers
- ✅ Maps to structured variables (location, company_type, funding_amount, etc.)
- ✅ Generates adaptive follow-up questions
- ✅ Ensures all critical variables captured

**User Verification:**
- ✅ See conversation history
- ✅ See extracted variables (updates as conversation progresses)
- ✅ Edit extracted values if needed (free text, re-extracts)
- ✅ Control over final values

**Result:**
- Guidance (Q&A) + Freedom (natural answers) + Unbiased (adaptive questions)
- LLM ensures complete data (all variables extracted)
- User has control (can verify/edit)
- Natural conversation (feels like consultant, not form)

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

### New Smart Template with Contextual Hints (Creative Hybrid)
```
TEMPLATE WITH CONTEXTUAL HINTS (shown to user):
"Tell us about your project and funding situation:

📍 Location: [Where is your company based?]
💡 Hint: e.g., "Vienna, Austria" or "Berlin, Germany"

🏢 Company: [What kind of company are you?]
💡 Hint: e.g., "Startup", "SME", "Research institution"

💰 Funding: [How much funding do you need?]
💡 Hint: e.g., "€150,000 for MVP development"

📅 Stage: [How far along is your company?]
💡 Hint: e.g., "Just incorporated 3 months ago"

💵 Co-financing: [Can you provide matching funds?]
💡 Hint: e.g., "Yes, 30%" or "No, we need 100% grant"

🏭 Industry: [What industry are you in?] (optional)
💡 Hint: e.g., "Climate tech", "Healthcare", "AI/ML"

USER TYPES "Vienna" IN LOCATION → HINTS UPDATE:
💡 Company hint changes to: "Austrian startup" or "SME in Austria"
💡 Funding hint changes to: "Consider Austrian programs (FFG, AWS) typically €50k-€500k"

USER TYPES "startup" IN COMPANY → HINTS UPDATE:
💡 Stage hint changes to: "How long since incorporation?" or "Pre-company stage?"
💡 Funding hint changes to: "Typical startup funding: €50k-€500k"

USER FILLS IN ALL SECTIONS:
Location: Vienna, Austria
Company: Climate tech startup
Funding: Around €150k for MVP and hiring
Stage: Incorporated 8 months ago
Co-financing: Yes, we can provide 30%
Industry: Environmental tech

SINGLE LLM EXTRACTION (one call):
- location: "Vienna, Austria" → "austria" ✓
- company_type: "Climate tech startup" → "startup" ✓
- funding_amount: "Around €150k" → 150000 ✓
- company_stage: "Incorporated 8 months ago" → "inc_6_36m" ✓
- co_financing: "Yes, we can provide 30%" → {co_financing: "co_yes", percentage: 30} ✓
- industry_focus: "Environmental tech" → ["environmental"] ✓

VERIFICATION (shown to user):
"We extracted:
- Location: Austria ✓
- Company: Startup ✓
- Funding: €150,000 ✓
- Stage: Growing (6-36 months) ✓
- Co-financing: Yes, 30% ✓
- Industry: Environmental/Climate ✓

Is this correct? [Edit] [Continue]"
```

### Key Differences
- **Wizard**: Hardcoded questions + dropdowns → Forces categories → Biased
- **Guided Template**: Shows variables (WHAT) → User describes naturally (HOW) → Unbiased
- **Smart Template**: Shows variables + Contextual hints → Hints adapt as user types → Best of both worlds
- **Single Extraction**: One LLM call → Fast, cheap, simple
- **Result**: Guidance (template) + Hints (contextual examples) + Freedom (natural answers) + Simple (one extraction)

---

## Next Steps

1. **Decide on approach** (Option A - Smart Template with Contextual Hints, or Option B - Template with Static Examples)
2. **If Option A**: I'll implement smart template with contextual hints (sections + adaptive hints + single extraction)
3. **If Option B**: I'll implement template with static examples (sections + fixed examples + single extraction)

**Implementation will include:**
- Template form in `ProgramFinder.tsx` (replace wizard)
- Hint logic (client-side rules or lightweight API)
- `/api/reco/extract-attributes.ts` (single extraction from all sections)
- Extracted variables panel (shows mapped values)
- Missing variables indicator (if any)
- User can edit and re-extract

**Which approach do you prefer?**

