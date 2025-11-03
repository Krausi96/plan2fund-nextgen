# 🔌 Complete Wiring Analysis - Unused Objects & Missing Connections

**Date:** 2025-01-03  
**Purpose:** Identify unused API endpoints, unwired components, and missing connections

---

## ✅ **API ENDPOINTS STATUS**

### **WIRED & ACTIVE** ✅

| Endpoint | Used By | Status | Database |
|----------|----------|--------|----------|
| `/api/programs` | SmartWizard, AdvancedSearch, ProgramSelector, EditorValidation | ✅ Active | ✅ Database |
| `/api/programmes/[id]/requirements` | Editor, Library, EnhancedAIChat, RequirementsChecker, doctorDiagnostic, aiHelper | ✅ Active | ✅ Database |
| `/api/programs-ai` | dataSource, prefill | ✅ Active | ✅ Database |

### **UNUSED OR MINIMAL USE** ⚠️

| Endpoint | Used By | Status | Recommendation |
|----------|----------|--------|----------------|
| `/api/health` | HealthFooter (dashboard) | ⚠️ Minimal | Keep for monitoring |
| `/api/notifications` | None found | ❌ Unused | Consider removing or wire to dashboard |
| `/api/pipeline/status` | None found | ❌ Unused | Consider removing or wire to admin panel |
| `/api/recommend` | Unknown | ❓ Check | Verify usage |
| `/api/intake/parse` | Unknown | ❓ Check | Verify usage |
| `/api/intake/plan` | Unknown | ❓ Check | Verify usage |
| `/api/scraper/` | Empty folder | ❌ Empty | Remove folder |

---

## 🎨 **FRONTEND COMPONENTS STATUS**

### **WIRED & ACTIVE** ✅

| Component | API Endpoint | Status |
|-----------|--------------|--------|
| `SmartWizard` | `/api/programs?enhanced=true` | ✅ Wired |
| `QuestionEngine` | Receives from SmartWizard | ✅ Wired |
| `EnhancedRecoEngine` | `/api/programs?enhanced=true` | ✅ Wired |
| `AdvancedSearch` | `/api/programs?enhanced=true` | ✅ Wired |
| `ProgramSelector` | `/api/programs?enhanced=true` | ✅ Wired |
| `Library` | `/api/programs` → `/api/programmes/[id]/requirements` | ✅ Wired |
| `EditorDataProvider` | `/api/programmes/[id]/requirements` | ✅ Wired |
| `RequirementsChecker` | `/api/programmes/[id]/requirements` | ✅ Wired |
| `EnhancedAIChat` | `/api/programmes/[id]/requirements` | ✅ Wired |
| `UnifiedEditor` | `/api/programmes/[id]/requirements` | ✅ Wired |
| `ProgramDetails` | `/api/programmes/[id]/requirements` | ✅ Wired |
| `dataSource` | `/api/programs-ai?action=...` | ✅ Wired |
| `prefill` | `/api/programs-ai?action=programs` | ✅ Wired |
| `EditorValidation` | `/api/programs?enhanced=true` | ✅ Wired |
| `doctorDiagnostic` | `/api/programmes/[id]/requirements` | ✅ Wired |
| `aiHelper` | `/api/programmes/[id]/requirements` | ✅ Wired |

### **COMPONENTS - ACTUAL USAGE** ✅/⚠️

| Component | Used By | Status | Notes |
|-----------|---------|--------|-------|
| `RecommendationContext` | `pages/results.tsx`, `pages/advanced-search.tsx`, `pages/_app.tsx` | ✅ **USED** | Wired to pages |
| `ProgramDetailsModal` | `SmartWizard.tsx` | ✅ **USED** | Used within SmartWizard |
| `Phase4Integration` | `UnifiedEditor.tsx` | ✅ **USED** | Used as sub-component of UnifiedEditor |
| `EntryPointsManager` | `Phase4Integration.tsx` | ✅ **USED** | Used within Phase4Integration |
| `DocumentCustomizationPanel` | `Phase4Integration.tsx` | ✅ **USED** | Used within Phase4Integration |
| `RichTextEditor` | `Phase4Integration.tsx` | ✅ **USED** | Used within Phase4Integration |
| `ExportSettings` | Unknown | ⚠️ **CHECK** | May be used in export flow |

### **CORRECTION: These components ARE wired, just not directly imported in main pages**

---

## 🔧 **API ENDPOINT ISSUES**

### **Issue 1: POST /api/programmes/[id]/requirements** ⚠️

**Status:** Not wired - throws error  
**Location:** `pages/api/programmes/[id]/requirements.ts`  
**Problem:** `updateProgramRequirements()` function throws error (not migrated to new schema)

```typescript
async function updateProgramRequirements() {
  throw new Error('updateProgramRequirements is not yet migrated to pages/requirements schema');
}
```

**Recommendation:**
- Remove POST handler if not needed
- Or migrate to pages/requirements schema
- Or wire to a component that needs it

---

### **Issue 2: Empty Scraper API Folder** ❌

**Location:** `pages/api/scraper/`  
**Status:** Empty folder  
**Recommendation:** Remove folder

---

### **Issue 3: Unused Endpoints** ⚠️

**Endpoints:**
- `/api/notifications` - Not called from any component
- `/api/pipeline/status` - Not called from any component

**Recommendation:**
- Remove if not needed for monitoring
- Or wire to dashboard/admin panel
- Or keep for future admin features

---

## 📋 **COMPONENT WIRING CHECKLIST**

### **Pages (Route Components)**

| Page | Components Used | API Wired | Status |
|------|----------------|-----------|--------|
| `pages/index.tsx` | ? | ? | ❓ Needs check |
| `pages/reco.tsx` | SmartWizard | `/api/programs` | ✅ Wired |
| `pages/editor.tsx` | UnifiedEditor | `/api/programmes/[id]/requirements` | ✅ Wired |
| `pages/library.tsx` | ProgramDetails | `/api/programs` → `/api/programmes/[id]/requirements` | ✅ Wired |
| `pages/advanced-search.tsx` | AdvancedSearch | `/api/programs` | ✅ Wired |
| `pages/results.tsx` | ? | ? | ❓ Needs check |
| `pages/preview.tsx` | ? | `/api/programmes/[id]/requirements` | ✅ Wired |
| `pages/export.tsx` | ? | `/api/programmes/[id]/requirements` | ✅ Wired |
| `pages/dashboard.tsx` | HealthFooter | `/api/health` | ⚠️ Minimal |

---

## 🎯 **ACTION ITEMS**

### **High Priority**

1. **Remove Empty Folder**
   - Delete `pages/api/scraper/` folder

2. **Fix POST /api/programmes/[id]/requirements**
   - Remove POST handler if not needed
   - Or migrate to pages/requirements schema
   - Or implement properly

3. **Verify Unused Components**
   - Check if `RecommendationContext`, `ProgramDetailsModal`, `Phase4Integration`, etc. are needed
   - Remove if not used
   - Wire if needed

### **Medium Priority**

4. **Wire or Remove Unused APIs**
   - `/api/notifications` - Wire to dashboard or remove
   - `/api/pipeline/status` - Wire to admin panel or remove

5. **Complete Page Wiring**
   - Check `pages/index.tsx` wiring
   - Check `pages/results.tsx` wiring
   - Ensure all pages use database-backed APIs

### **Low Priority**

6. **Documentation**
   - Document all wired components
   - Document API endpoint usage
   - Create component dependency graph

---

## ✅ **SUMMARY**

**Wired Components:** 16/22 (73%)  
**Wired APIs:** 3/10+ (30%)  
**Database Connections:** ✅ All main endpoints use database  

**Main Issues:**
- ⚠️ Unused components (6 components not imported)
- ⚠️ Unused API endpoints (3 endpoints not called)
- ⚠️ POST handler not implemented
- ✅ Core functionality fully wired

**Overall Status:** **Good** - Core application is wired. Cleanup needed for unused code.

