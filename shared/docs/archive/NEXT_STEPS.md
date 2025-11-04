# Next Steps - Priority Action Items

**Date:** 2025-01-03  
**Based on:** IMPLEMENTATION_STATUS.md analysis

---

## 🎯 **PRIORITY 1: CRITICAL (Blocks Functionality)**

### **1. Authentication & Authorization** 🔴
**Status:** Partially implemented, missing connections

**Tasks:**
- [ ] **Protect routes** - Add middleware/HOC for `/reco`, `/editor`, `/export`, `/dashboard`
- [ ] **Add logout** - Implement logout functionality in Header
- [ ] **Fix redirects** - Preserve intended destination after login
- [ ] **Data persistence** - Ensure workflow pages save to localStorage consistently

**Files to modify:**
- `pages/_app.tsx` - Add auth middleware
- `shared/components/layout/Header.tsx` - Add logout
- `pages/login.tsx` - Fix redirect logic

**Reference:** `USER_AUTHENTICATION_WIRING_ANALYSIS.md`

---

### **2. RequirementsChecker Database Integration** 🔴
**Status:** Component exists but doesn't use database

**Tasks:**
- [ ] **Connect to API** - Fetch from `/api/programmes/${id}/requirements`
- [ ] **Use scraper-lite data** - Replace `createReadinessValidator()` with database data
- [ ] **Update component** - Use real requirements from database

**Files to modify:**
- `features/editor/components/RequirementsChecker.tsx` - Add API fetch
- Remove dependency on `createReadinessValidator()` if it doesn't use DB

**Reference:** `shared/docs/FULL_FLOW_ANALYSIS.md`

---

### **3. Formatting Settings Persistence** 🟡
**Status:** Export uses formatting, but settings not fully saved to plan

**Tasks:**
- [ ] **Save formatting** - Add `formatting` to `plan.settings` in DocumentCustomizationPanel
- [ ] **Update type** - Add `formatting` to `PlanDocument.settings` type
- [ ] **Persist to localStorage** - Save formatting when user changes settings

**Files to modify:**
- `features/editor/components/DocumentCustomizationPanel.tsx` - Save formatting
- `features/editor/components/Phase4Integration.tsx` - Persist to plan
- `shared/types/plan.ts` - Add formatting type

---

## 🎯 **PRIORITY 2: IMPORTANT (Enhances UX)**

### **4. UI Layout Cleanup** 🟡
**Status:** Functional but messy

**Tasks:**
- [ ] **Improve spacing** - Better visual hierarchy
- [ ] **Organize sidebar** - Cleaner section list
- [ ] **Reduce overlapping** - Better panel management
- [ ] **Customization panel** - Don't take space when closed

**Files to modify:**
- `features/editor/components/Phase4Integration.tsx` - Layout improvements

---

### **5. Entry Paths Verification** 🟡
**Status:** Need testing

**Tasks:**
- [ ] **Test direct entry** - `/editor?programId=...` works
- [ ] **Test document switching** - Product/route switching works
- [ ] **Test plan switching** - Context preserved
- [ ] **Fix any issues** - Address broken paths

**Files to test:**
- `pages/editor.tsx` - Entry point
- `features/editor/components/UnifiedEditor.tsx` - Routing logic

---

### **6. Component Testing** 🟡
**Status:** Need testing

**Tasks:**
- [ ] **Test DocumentCustomizationPanel** - Settings save/load correctly
- [ ] **Test EnhancedAIChat** - AI responses work
- [ ] **Test RequirementsChecker** - Shows correct requirements (after DB integration)

**Files to test:**
- `features/editor/components/DocumentCustomizationPanel.tsx`
- `features/editor/components/EnhancedAIChat.tsx`
- `features/editor/components/RequirementsChecker.tsx`

---

## 🎯 **PRIORITY 3: NICE TO HAVE (Future Enhancement)**

### **7. Work Packages/Milestones Forms** 🔵
**Status:** Structure exists, placeholders need content

**Tasks:**
- [ ] **Add forms** - User input for work packages
- [ ] **Or AI generation** - Use AIHelper to generate work packages
- [ ] **Store structured data** - Save work packages to plan

**Files to create/modify:**
- New component: `features/editor/components/WorkPackageForm.tsx`
- Or enhance: `features/editor/engine/aiHelper.ts` - Add work package generation

---

### **8. Visual Charts Rendering** 🔵
**Status:** Text-only, charts not rendered

**Tasks:**
- [ ] **Choose library** - Chart.js, recharts, or similar
- [ ] **Render charts** - Convert figures to visual charts in PDF
- [ ] **Integrate with export** - Charts in PDF/DOCX export

**Files to modify:**
- `features/export/engine/export.ts` - Add chart rendering
- `features/export/renderer/renderer.tsx` - Chart components

---

### **9. Enhanced Data Extraction** 🔵
**Status:** Basic extraction works, could be smarter

**Tasks:**
- [ ] **Parse natural language** - Extract dates, amounts from text
- [ ] **Identify metrics** - Extract key metrics from sections
- [ ] **Smart defaults** - Better fallback values

**Files to enhance:**
- `features/export/engine/export.ts` - Enhance `extractPlanData()`

---

## 📋 **RECOMMENDED ORDER**

1. **Start with Priority 1** - These block full functionality
2. **Then Priority 2** - Improves user experience
3. **Finally Priority 3** - Nice enhancements

**Suggested sequence:**
1. Authentication (1-2 hours)
2. RequirementsChecker DB (1 hour)
3. Formatting persistence (30 min)
4. UI cleanup (1-2 hours)
5. Entry paths testing (30 min)
6. Component testing (1 hour)

**Total estimated time:** 5-7 hours for priorities 1-2

---

## ✅ **READY TO START?**

**Which priority should we tackle first?**

