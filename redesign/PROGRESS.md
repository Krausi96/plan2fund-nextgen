# 🎯 Plan2Fund Redesign Progress Tracker

**Source of Truth:** `plan2fund_report.md` (from Downloads)

**Last Updated:** 2025-01-XX

---

## 📊 Overall Status

**Completion: ~78%** (up from 70%)
- Area 1 (Scraper-Lite): 100% ✅ (LLM integration complete)
- Area 2 (Reco/SmartWizard): 100% ✅ (Fully wired - unified UI + semantic search + results page)
- Area 3 (Editor Entry): 80% ✅ (LLM generation + versioning complete, dynamic mapping optional)
- Area 4 (Editor): 75% ⚠️ (Image upload + react-pdf done, needs freemium + additional docs)

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

## Area 3: Editor Entry ✅ 80% (NEARLY COMPLETE)

### Medium Priority (from report):
- [x] LLM-based template generation from requirements - **DONE**
- [ ] Dynamic section mapping using LLM/ML - **PARTIAL** (suggestSectionForCategory created, not integrated)
- [x] Template versioning with metadata - **DONE**

### Status:
- ✅ Static master templates exist (`shared/lib/templates/sections.ts`)
- ✅ Program-specific overrides exist (`shared/lib/templates/program-overrides.ts`)
- ✅ **LLM template generator created** (`shared/lib/templateGenerator.ts`)
- ✅ **Integrated into loadProgramSections** (tries LLM first, falls back to rule-based)
- ✅ **LLM summarization of requirements into prompts** (working)
- ✅ **Template versioning implemented** (`templateVersioning.ts` + database schema)
- ✅ **Templates saved to database** with metadata (version, model, hash)
- ✅ **Change detection** (checks if requirements changed, regenerates if needed)
- ⚠️ Dynamic section mapping (function exists but not integrated into categoryConverters)
- ⚠️ Admin editing interface (not yet implemented)

### What's Working:
- LLM generates program-specific section templates from requirements
- Templates adapt to program requirements (e.g., sustainability → environmental impact prompts)
- Automatic fallback to rule-based if LLM fails or no API key
- Templates saved to database with full versioning
- Change detection: templates regenerated when requirements change
- Version metadata tracked (model version, prompt version, requirements hash)

### Database Schema:
- `template_versions` table stores all template versions
- `template_requirements_hash` table tracks requirements changes
- Automatic version numbering and active/inactive management

### Next Steps (Optional Enhancements):
1. **Admin editing interface** (LOW)
   - UI to edit stored templates
   - Mark templates as verified
   - Add edit notes
   
2. **Integrate LLM suggestions into categoryConverters** (LOW)
   - Use `suggestSectionForCategory` when mapping is unclear
   - Reduce manual rule creation
   
3. **Test with real programs** (HIGH - for validation)
   - Verify LLM templates are better than rule-based
   - Check prompt quality and relevance

---

## Area 4: Editor ⚠️ 75% (IN PROGRESS)

### High Priority (from report):

#### ✅ DONE:
- [x] UI Redesign - UnifiedEditorLayout (Canva-style)
- [x] SectionTree (navigation with icons)
- [x] ComplianceAIHelper (merged compliance + AI)
- [x] Financial Tables (FinancialTable.tsx)
- [x] Charts (ChartGenerator.tsx with Recharts)
- [x] Executive Summary auto-generation
- [x] Merge Requirements Checker and AI Assistant
- [x] **Image upload component** (ImageUpload.tsx) - **DONE**
- [x] **Live preview with react-pdf** - **DONE** (replaced HTML preview)

#### ❌ NOT DONE:
- [ ] Freemium gating (feature flags)
- [ ] Additional documents (pitch deck, forms)
- [ ] Chapter-specific expert advice

### What's Working:
- Image upload with caption/description support
- Images stored in `/public/uploads/images/`
- Image insertion into rich text editor
- Real-time PDF preview using @react-pdf/renderer
- PDF export functionality
- HTML preview fallback

### Next Steps:
1. Create `shared/lib/featureFlags.ts`
2. Add premium checks and upgrade modals
3. Create `AdditionalDocumentsEditor.tsx`
4. Add chapter-specific expert advice to AI assistant

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

