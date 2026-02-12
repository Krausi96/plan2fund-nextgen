# Phase 1 Validation Checklist

## ✅ Requirements ALWAYS populated (verification complete)

**Code verification:**

1. **Generator.ts lines 306-324:**
   - ✅ Non-placeholder sections: use fallback if LLM returns nothing
   - ✅ Placeholder sections: also receive fallback (updated)
   - ✅ Result: `section.requirements` is NEVER empty/undefined/null

2. **Fallback Requirements (lines 107-131):**
   - ✅ Always returns 3 requirements:
     - Clear Objectives & Scope
     - Feasibility & Realistic Approach
     - Key Metrics & Evidence

3. **AI Assistant integration:**
   - ✅ sectionAiClient.ts line 153: `requirements: requirements || []` passed to LLM
   - ✅ section.ts lines 18-24: Requirements injected into prompt as "MANDATORY REQUIREMENTS"

---

## ✅ Only ONE LLM call per program (verification complete)

**Code verification:**

1. **enrichAllSectionRequirementsAtOnce() (lines 34-39):**
   ```typescript
   const cacheKey = program.id || `program_${Date.now()}`;
   if (requirementCache.has(cacheKey)) {
     console.log(`[enrichRequirements] Cache HIT for program: ${program.name}`);
     return requirementCache.get(cacheKey) || {};
   }
   ```
   - ✅ Cache checked FIRST before any LLM call
   - ✅ Cache stored after LLM call (line 93)
   - ✅ Result: Same program ID = instant cache return

2. **Console logging (lines 37, 52, 93):**
   - ✅ "Cache HIT" logged when cached
   - ✅ "Calling LLM" logged only on miss
   - ✅ Result: Verify in console which happened

---

## ✅ AI Assistant receives requirements (verification complete)

**Code flow verification:**

1. **Generator.ts → SectionEditor:**
   - ✅ Line 411: `sections` array passed to DocumentStructure
   - ✅ Each section includes `requirements: [...]`

2. **SectionEditor → sectionAiClient.ts:**
   - ✅ Line 132: `requirements` extracted from section
   - ✅ Line 138: `requirementsCount` logged for debugging
   - ✅ Line 153: `requirements: requirements || []` in context

3. **sectionAiClient → orchestrator → Gemini:**
   - ✅ section.ts line 18-24: Requirements added to prompt
   - ✅ Prompt text: "MANDATORY REQUIREMENTS:" section
   - ✅ Result: Gemini sees requirements in system message

---

## ❌ Blueprint system still active (DO NOT DELETE YET)

**Reason:** Need to validate enrichment works under all conditions:
- [ ] Multiple program selections
- [ ] Editor reload
- [ ] Project reopen
- [ ] Section text regeneration

---

## 📋 Testing procedure

### Step 1: Console validation
```bash
npm run dev
```

In Chrome DevTools Console, look for:
```
[enrichRequirements] Starting requirement enrichment for program: AWS Preseed
[enrichRequirements] Calling LLM for program: AWS Preseed
[enrichRequirements] Executive Summary: assigned 3 requirements (from LLM)
[enrichRequirements] Innovation: assigned 4 requirements (from LLM)
[VALIDATION] Document structure generated:
  - Executive Summary: 3 requirements
  - Innovation: 4 requirements
```

### Step 2: Second selection (cache validation)
```
[enrichRequirements] Cache HIT for program: AWS Preseed
```
- Should be INSTANT (no "Calling LLM")

### Step 3: Different program (new LLM call)
```
[enrichRequirements] Calling LLM for program: FFG Basisprogramm
```
- Should see LLM call again (different program ID)

### Step 4: SectionEditor AI test
1. Open any section
2. Click "Generate with AI"
3. Check response includes:
   - ✅ Mentions feasibility
   - ✅ Mentions metrics/evidence
   - ✅ References clarity
   - ✅ Funding-focused language

If output is generic/vague → requirements not injected

### Step 5: Quality gate
Run at least 3 different programs:
- AWS Preseed
- FFG Basisprogramm
- EIC Accelerator

For each:
- [ ] Console shows requirements count > 0
- [ ] SectionEditor shows requirements in prompt
- [ ] AI assistant response is funding-focused (not generic)

---

## 🚦 Decision gate

**After testing all 5 points above:**

- ✅ If all pass → Reply "OK" to proceed to Phase 2
- ❌ If any fail → Investigate and fix before Phase 2

**Critical: Do NOT proceed to Phase 2 until:**
1. No section has empty requirements
2. Cache works (second selection is instant)
3. AI assistant output quality is high (mentions requirements)
4. All 3 programs tested successfully

---

## Final state before Phase 2

```
program selection
  ↓
deterministic structure (template + overlay)
  ↓
requirement enrichment (1 LLM call, cached)
  ↓
DocumentStructure with populated requirements
  ↓
SectionEditor → AI writing
  ↓
Output: funding-focused content (not generic)
```

✅ This is the STABLE, LEAN architecture.

Blueprint system still exists but is not used.
(Phase 2 removes it, Phase 3 deletes it)

---

## Emergency fallback

If anything breaks:
```typescript
// In generator.ts line 16
const ENABLE_REQUIREMENT_ENRICHMENT = false;
```

Sets entire system to fallback mode instantly.
