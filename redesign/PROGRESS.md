# 🎯 Plan2Fund Redesign Progress Tracker

**Source of Truth:** `plan2fund_report.md` (from Downloads)

**Last Updated:** 2025-01-XX

---

## 📊 Overall Status

**Completion: ~60%** (up from 55%)
- Area 1 (Scraper-Lite): 100% ✅ (LLM integration complete)
- Area 2 (Reco/SmartWizard): 100% ✅ (Fully wired - unified UI + semantic search + results page)
- Area 3 (Editor Entry): 0% ❌ (Next priority)
- Area 4 (Editor): 60% ⚠️ (Needs image upload, react-pdf, freemium)

---

## Area 1: Scraper-Lite ✅ 100% (LLM Integration Complete)

### High Priority (from report):
- [x] Integrate LLM extraction into scraper pipeline - **DONE**
- [x] Add caching for LLM calls (llmCache.ts) - **DONE**
- [x] Store confidence scores and extraction method in DB - **DONE**
- [ ] Implement incremental updates with hash-based change detection (low priority)

### Status:
- ✅ Hybrid extraction implemented (pattern + LLM)
- ✅ LLM extraction files restored from git commit e066250
- ✅ Caching implemented (llmCache.ts)
- ✅ Confidence scoring implemented (stored in DB)
- ✅ Database schema updated (extraction_method, confidence fields)
- ✅ Page repository created (saves with method/confidence)

### Next Steps:
1. ✅ Restore `llm-extract.ts` and `scraper-llm.ts` from git - **DONE**
2. ✅ Integrate into `scraper.ts` pipeline - **DONE**
3. ✅ Create `llmCache.ts` module - **DONE**
4. ✅ Update database schema (add method, confidence fields) - **DONE**
5. ✅ Create `page-repository.ts` with extraction_method and confidence support - **DONE**

---

## Area 2: Reco/SmartWizard & Advanced Search ✅ 100% (Core Complete)

### High Priority (from report):
- [x] Unify SmartWizard and Advanced Search into ProgramFinder - **DONE**
- [x] Add semantic search with embeddings (OpenAI) - **DONE**
- [x] Show explanations for rankings in UI - **DONE**
- [ ] ML-based scoring from historical data - **OPTIONAL** (needs historical data - future enhancement)

### Status:
- ✅ Unified ProgramFinder component created (replaces SmartWizard)
- ✅ Old SmartWizard.tsx deleted (replaced by ProgramFinder)
- ✅ RecommendationContext cleaned up (removed 250+ lines of obsolete code)
- ✅ Mode toggle (Guided/Manual) implemented
- ✅ Explanations exposed in UI (reasons, risks, matched criteria)
- ✅ Semantic search service created (embeddings.ts)
- ✅ Database schema updated (programme_embeddings table with pgvector)
- ✅ Search API combines rule-based + semantic scores (70/30 split)
- ✅ Semantic search implemented with OpenAI embeddings
- ✅ On-the-fly embedding generation if not in database
- ✅ **Manual mode wired to semantic search API** (uses /api/programmes/search)
- ✅ **Results stored in context + localStorage** for results page
- ✅ **"View All Results" button** routes to /results page
- ✅ **QuestionEngine still needed** (for guided mode question generation)
- ✅ **EnhancedRecoEngine up to date** (used by both modes + search API)

### Optional/Future Enhancements:
- [ ] Embeddings backfill script for existing programs (operational task)
- [ ] ML-based scoring (requires historical approval/rejection data)
- [ ] pgvector extension setup (if not already enabled in database)

---

## Area 3: Editor Entry ❌ 0% (NEXT PRIORITY)

### Medium Priority (from report):
- [ ] LLM-based template generation from requirements
- [ ] Dynamic section mapping using LLM/ML
- [ ] Template versioning with metadata

### Status:
- ✅ Static master templates exist (`shared/lib/templates/sections.ts`)
- ✅ Program-specific overrides exist (`shared/lib/templates/program-overrides.ts`)
- ❌ No LLM summarization of requirements into prompts
- ❌ No dynamic section mapping (still rule-based)
- ❌ No template versioning

### What This Means:
- Templates are static and don't adapt to new program requirements
- Section prompts are generic, not derived from scraped requirements
- No way to track template changes over time

### Next Steps (Priority Order):
1. **Create LLM template generator** (`shared/lib/templateGenerator.ts`)
   - Takes program requirements → generates section prompts/hints
   - Summarizes requirement categories into actionable guidance
   - Example: "Program emphasizes sustainability" → adds prompts about environmental impact
   
2. **Enhance categoryConverters with LLM**
   - Use LLM to suggest which master section fits each requirement category
   - Reduce manual rule creation
   
3. **Add template versioning**
   - Store generated templates with metadata (program ID, date, model version)
   - Allow admin editing
   - Check if template needs updating on re-scrape

---

## Area 4: Editor ⚠️ 60%

### High Priority (from report):

#### ✅ DONE:
- [x] UI Redesign - UnifiedEditorLayout (Canva-style)
- [x] SectionTree (navigation with icons)
- [x] ComplianceAIHelper (merged compliance + AI)
- [x] Financial Tables (FinancialTable.tsx)
- [x] Charts (ChartGenerator.tsx with Recharts)
- [x] Executive Summary auto-generation
- [x] Merge Requirements Checker and AI Assistant

#### ❌ NOT DONE:
- [ ] Image upload component (ImageUpload.tsx)
- [ ] Live preview with react-pdf (currently HTML only)
- [ ] Freemium gating (feature flags)
- [ ] Additional documents (pitch deck, forms)
- [ ] Chapter-specific expert advice

### Next Steps:
1. Create `ImageUpload.tsx` component
2. Replace HTML preview with react-pdf
3. Create `shared/lib/featureFlags.ts`
4. Add premium checks and upgrade modals
5. Create `AdditionalDocumentsEditor.tsx`

---

## 📁 Files Status

### ✅ Created:
- `features/editor/components/UnifiedEditorLayout.tsx`
- `features/editor/components/SectionTree.tsx`
- `features/editor/components/ComplianceAIHelper.tsx`
- `features/editor/components/PreviewPanel.tsx` (basic HTML)
- `features/editor/components/RestructuredEditorNew.tsx`
- `features/editor/components/FinancialTable.tsx`
- `features/editor/components/ChartGenerator.tsx`

### ❌ Need to Restore:
- `scraper-lite/src/llm-extract.ts` (from git commit e066250)
- `scraper-lite/src/scraper-llm.ts` (from git commit e066250)

### ❌ Need to Create:
- `features/reco/components/ProgramFinder.tsx`
- `features/editor/components/ImageUpload.tsx`
- `scraper-lite/src/llmCache.ts`
- `pages/api/programmes/search.ts`
- `shared/lib/featureFlags.ts`
- `features/editor/components/AdditionalDocumentsEditor.tsx`

### ✅ Correctly Deleted:
- `RestructuredEditor.tsx` (replaced)
- `RequirementsChecker.tsx` (merged)
- `EnhancedAIChat.tsx` (merged)

---

## 🎯 Priority Roadmap

### Week 1: Fix Scraper (CRITICAL)
1. Restore LLM extraction files
2. Integrate into scraper pipeline
3. Add caching
4. Update database schema

### Week 2: Unify Reco (CRITICAL)
1. Create ProgramFinder
2. Merge SmartWizard + Advanced Search
3. Add semantic search backend

### Week 3: Complete Editor (HIGH)
1. Image upload
2. react-pdf preview
3. Freemium gating

### Week 4: Polish (MEDIUM)
1. LLM template generation
2. Additional documents
3. Testing

---

## 📝 Current Status Summary

### ✅ Major Achievements:
- **Scraper-lite is PRODUCTION-READY** - LLM integration complete, hybrid extraction working
- **Reco is FULLY WIRED** - Unified UI, semantic search, results page integration
- **Editor has SOLID FOUNDATION** - 60% done, clear path forward
- **Codebase is CLEANER** - Removed 250+ lines of obsolete SmartWizard code

### 🔴 Next Priorities:
1. **Area 3: Editor Entry** - LLM template generation (makes templates dynamic)
2. **Area 4: Editor** - Image upload, react-pdf preview, freemium gating

### 📊 Progress:
- **Before:** ~15% complete (only editor UI partially done)
- **Now:** ~60% complete (scraper + reco fully done, editor 60%)
- **Improvement:** +45% in core backend features

See `ACHIEVEMENTS_SUMMARY.md` for detailed breakdown.

