# Cleanup Plan - What Can We Dump Now

## ✅ What's Wired (Working)

1. **API Endpoint** (`pages/api/programmes/[id]/requirements.ts`)
   - ✅ Uses unified templates via `getSections()` and `getDocuments()`
   - ⚠️ Still has legacy `buildAdditionalDocuments()` for backward compatibility

2. **Export** (`pages/export.tsx`)
   - ✅ Uses unified templates via `getDocument()` with full template support
   - ⚠️ Still has legacy `getDocumentBundle()` for preview/listing

3. **categoryConverters** (`features/editor/engine/categoryConverters.ts`)
   - ✅ Uses `getStandardSections()` - this is OK, it's internal logic
   - This is the ENHANCEMENT layer, not replacement

## ❌ What Needs Wiring

1. **Preview** (`pages/preview.tsx`)
   - ❌ Still uses legacy `getDocumentBundle()` + `getDocumentById()`
   - Should use unified `getDocuments()`

2. **Editor Components**
   - ⚠️ `EditorEngine` still uses `PRODUCT_SECTION_TEMPLATES` (but has empty sections)
   - Should use unified `getSections()`

## 🗑️ What Can Be Removed (Eventually)

### Safe to Remove Now:
1. **Documentation Files** (outdated):
   - `docs/TEMPLATE_DATA_SOURCE_EXPLAINED.md` (outdated)
   - `docs/ADDITIONAL_DOCUMENTS_COMPLETE_ANALYSIS.md` (outdated)
   - `docs/TEMPLATE_AND_NO_PROGRAM_FLOW.md` (outdated)
   - `docs/DATA_FLOW_AND_CONNECTIONS.md` (outdated)

### Keep For Now (Still Used as Bridges):
1. **`shared/lib/standardSectionTemplates.ts`**
   - ✅ Used by unified system (`sections.ts` imports it)
   - ✅ Used by `categoryConverters` for enhancement logic
   - Keep until full migration

2. **`features/editor/templates/additionalDocuments.ts`**
   - ✅ Used by unified system (`documents.ts` imports it)
   - Keep until full migration

3. **`shared/data/documentBundles.ts` + `documentDescriptions.ts`**
   - ⚠️ Still used by preview/export for listing (legacy)
   - Can be removed after updating preview/export

4. **`features/editor/templates/productSectionTemplates.ts`**
   - ⚠️ Has empty sections arrays
   - Used for workflow steps
   - Can populate sections or deprecate

## 🔌 Wiring Status

### ✅ Fully Wired:
- API endpoint → Unified templates
- Export → Unified templates (with full template support)
- Program-specific parsing → Working

### ⚠️ Partially Wired:
- Preview → Still uses legacy bundles
- EditorEngine → Still uses empty productSectionTemplates

### ❌ Not Wired:
- Nothing critical

## 📋 Action Plan

### Phase 1: Wire Remaining (Quick)
1. Update `preview.tsx` to use unified `getDocuments()`
2. Update `EditorEngine` to use unified `getSections()` instead of empty templates

### Phase 2: Cleanup (After Wiring)
1. Remove outdated docs
2. Deprecate `documentBundles` (keep as fallback)
3. Optionally migrate templates to unified location

### Phase 3: Full Migration (Optional)
1. Move template content from old files to unified location
2. Remove old files entirely

## Recommendation

**NOW:**
- Wire preview.tsx (5 min)
- Wire EditorEngine (10 min)
- Remove outdated docs (2 min)

**LATER:**
- Full template migration (if needed)
- Remove old files (after testing)

