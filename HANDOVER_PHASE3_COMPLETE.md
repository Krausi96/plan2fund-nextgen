# Handover: Blueprint Removal Complete (Phase 3)

## What Was Done

### ✅ Phase 3 Complete - Blueprint System Deleted
- Removed `handleGenerateBlueprint()` function (~240 lines)
- Deleted `prompts/blueprint.ts` file
- Removed blueprint cache
- Cleaned up blueprint API references
- Removed unused imports (parseBlueprintResponse, LLMTruncatedJsonError, BlueprintRequestSchema)

### ✅ Phase 2 Complete - Blueprint API Disabled  
- Commented out blueprint API call in ProgramSelection.tsx (lines 135-175)
- System still functional without blueprint generation

### ✅ Phase 1 Complete - Requirement Enrichment Added
- Added `enrichAllSectionRequirementsAtOnce()` function (generator.ts)
- Added deterministic fallback requirements (3 per section)
- Feature flag: `ENABLE_REQUIREMENT_ENRICHMENT` (default: true)
- Cache implemented (1 LLM call per program, TTL 1 hour)

---

## What Needs To Be Done

### 🔴 CRITICAL: TypeScript Errors (Build Breaks)

**10 TypeScript errors** from old code still referencing global `requirements` field (now section-level only):

Files to fix:
1. `platform/analysis/internal/document-flows/document-flows/common/documentProcessingUtils.ts:65` - Remove `requirements: []`
2. `platform/analysis/internal/document-flows/document-flows/normalization/normalizeDocumentStructure.ts:53, 88, 159` - Remove `requirements: normalizedStructure.requirements` lines
3. `platform/analysis/internal/document-flows/document-flows/processing/structure/rawTextToSections.ts:117` - Remove `requirements: []`
4. `platform/analysis/internal/document-flows/document-flows/processing/structure/splitDocument.ts:41` - Remove `requirements: originalStructure.requirements || []`
5. `platform/generation/structure/structureBuilder.ts:77` - Remove `requirements: extractRequirementsFromProgram(program)`
6. `platform/generation/utils/normalization.ts:103` - Remove `requirements: []`

**Fix strategy:** Delete any lines containing `requirements:` in DocumentStructure object literals (requirements moved to section level).

---

## Current Architecture

```
Reco API
  ↓
Recommendation (full FundingProgram with applicationRequirements)
  ↓
ProgramSelection (processProgramData)
  ↓
normalizeFundingProgram()
  ↓
generateDocumentStructureFromProfile() [NOW ASYNC]
  ├─ Builds deterministic structure from templates + program.applicationRequirements
  └─ enrichAllSectionRequirementsAtOnce()  
     ├─ Calls LLM ONCE per program (cached)
     ├─ Returns requirements keyed by section.id
     └─ Maps to section.requirements (3 fallback if LLM fails)
  ↓
DocumentStructure (sections with populated requirements)
  ↓
Editor (SectionEditor → AI assistant receives section.requirements)
```

---

## Testing Checklist

After fixing TypeScript errors, test:
- [ ] `npm run build` completes without errors
- [ ] Select program in editor → no console errors
- [ ] Open SectionEditor → requirements appear in AI prompt
- [ ] Generate section text → output is funding-focused (not generic)
- [ ] Select same program twice → "[enrichRequirements] Cache HIT" in console (no LLM call)
- [ ] Switch programs → new LLM call for different program ID

---

## Key Files Modified

**Deleted:**
- `platform/ai/prompts/blueprint.ts`

**Disabled (commented):**
- `features/editor/components/Navigation/CurrentSelection/ProgramSelection/ProgramSelection.tsx` (lines 135-175)

**Modified:**
- `platform/ai/orchestrator.ts` - Removed blueprint function + cache
- `platform/analysis/program-flow/generator.ts` - Added enrichment, made async
- `features/editor/components/Navigation/CurrentSelection/ProgramSelection/components/options/ProgramOption.tsx` - Removed blueprint handling
- `platform/generation/plan/instantiation.ts` - Removed blueprint metadata fields

---

## Next Steps (For Colleague)

1. **Fix TypeScript errors** (10 total) - Delete `requirements:` lines from DocumentStructure objects
2. **Run `npm run build`** - Should complete without errors
3. **Smoke test** - Follow testing checklist above
4. **If everything passes** - Merge to main, PR ready

---

## Emergency Rollback

If critical issues found:
- Set `ENABLE_REQUIREMENT_ENRICHMENT = false` in `platform/analysis/program-flow/generator.ts` line 16
- System falls back to deterministic requirements (3 generic fallback per section)
- No need to restore blueprint - enrichment has fallback

---

**Status:** Ready for TypeScript fixes + testing
**Branch:** `refactor/core-centralization`  
**Date:** Feb 12, 2026

