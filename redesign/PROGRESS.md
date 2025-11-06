# 🎯 Plan2Fund Redesign Progress Tracker

**Source of Truth:** `plan2fund_report.md` (from Downloads)

**Last Updated:** 2025-01-XX

---

## 📊 Overall Status

**Completion: ~20%**
- Area 1 (Scraper-Lite): 0% ❌
- Area 2 (Reco/SmartWizard): 0% ❌
- Area 3 (Editor Entry): 0% ❌
- Area 4 (Editor): 60% ⚠️

---

## Area 1: Scraper-Lite ❌ 0%

### High Priority (from report):
- [ ] Integrate LLM extraction into scraper pipeline
- [ ] Add caching for LLM calls (llmCache.ts)
- [ ] Store confidence scores and extraction method in DB
- [ ] Implement incremental updates with hash-based change detection

### Status:
- Pattern-based extraction only (35% coverage)
- ✅ LLM extraction files restored from git commit e066250
- No hybrid approach yet
- No caching yet
- No confidence scoring yet

### Next Steps:
1. ✅ Restore `llm-extract.ts` and `scraper-llm.ts` from git - **DONE**
2. [ ] Integrate into `scraper.ts` pipeline
3. [ ] Create `llmCache.ts` module
4. [ ] Update database schema (add method, confidence fields)

---

## Area 2: Reco/SmartWizard & Advanced Search ❌ 0%

### High Priority (from report):
- [ ] Unify SmartWizard and Advanced Search into ProgramFinder
- [ ] Add semantic search with embeddings (pgvector/Pinecone)
- [ ] ML-based scoring from historical data
- [ ] Show explanations for rankings in UI

### Status:
- Separate SmartWizard and Advanced Search components
- Rule-based matching only
- No semantic understanding
- No vector database

### Next Steps:
1. Create `features/reco/components/ProgramFinder.tsx`
2. Merge SmartWizard + Advanced Search UIs
3. Set up embeddings store (pgvector)
4. Create `/api/programmes/search.ts` endpoint
5. Expose EnhancedReco explanations in UI

---

## Area 3: Editor Entry ❌ 0%

### Medium Priority (from report):
- [ ] LLM-based template generation from requirements
- [ ] Dynamic section mapping using LLM/ML
- [ ] Template versioning with metadata

### Status:
- Static master templates only
- Rule-based categoryConverters
- No LLM summarization

### Next Steps:
1. Create LLM template generator function
2. Enhance categoryConverters with LLM
3. Add template versioning system

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

## 📝 Notes

- **Scraper-lite is CRITICAL** - Don't delete, restore and fix
- **LLM extraction exists in git** - Can restore from commit e066250
- **Editor UI is 60% done** - Good foundation, needs completion
- **Backend features are 0% done** - All LLM/ML features missing

