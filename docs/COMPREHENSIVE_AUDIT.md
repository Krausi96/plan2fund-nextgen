# 🔍 COMPREHENSIVE APPLICATION AUDIT

**Date:** 2025-01-03  
**Purpose:** Identify ALL broken flows, unwired components, missing connections, and what users CANNOT do yet

---

## ❌ **CRITICAL: USER CANNOT COMPLETE ANY FLOW**

### **Problem: No Clear User Journey**

**Users don't know:**
1. How to start (home page routes to `/reco` but what then?)
2. How to get to editor (no clear path)
3. How to export (export page exists but how do they get there?)
4. What happens after wizard (no clear next step)

---

## 🔴 **BROKEN API ENDPOINTS**

### **1. POST /api/programmes/[id]/requirements** ❌ **BROKEN**

**Location:** `pages/api/programmes/[id]/requirements.ts`  
**Status:** Throws error - `updateProgramRequirements()` not implemented

```typescript
async function updateProgramRequirements(programId: string, requirements: any) {
  throw new Error('updateProgramRequirements is not yet migrated to pages/requirements schema');
}
```

**Impact:** Any component trying to POST requirements will fail  
**Fix:** Either remove POST handler OR implement it properly

---

### **2. Empty Scraper Folder** ❌

**Location:** `pages/api/scraper/`  
**Status:** Empty folder  
**Action:** DELETE folder

---

### **3. Unused Endpoints** ⚠️

| Endpoint | Status | Used By | Action |
|----------|--------|---------|--------|
| `/api/notifications` | ❌ Not called | None | Remove or wire |
| `/api/pipeline/status` | ❌ Not called | None | Remove or wire |
| `/api/recommend` | ❓ Unknown | Check | Verify |
| `/api/intake/parse` | ❓ Unknown | Check | Verify |
| `/api/intake/plan` | ❓ Unknown | Check | Verify |

---

## 🟡 **BROKEN USER FLOWS**

### **Flow 1: Home → Program Selection → Editor** ⚠️ **UNCLEAR**

**Current:**
1. User visits `/` (home)
2. Clicks "Start Plan" → Goes to `/editor` (but no program selected!)
3. Editor shows `ProgramSelector` component
4. User selects program → Editor loads
5. ✅ This works BUT: User could skip step 2 and go directly to `/editor`

**Issues:**
- No clear indication user should select program first
- Home page routes directly to `/editor` but also to `/reco`
- Confusing which path to take

**Fix Needed:**
- Make home → `/reco` (wizard) the primary flow
- OR make home → `/editor` show program selector clearly
- Add clear CTAs with paths

---

### **Flow 2: Wizard (reco) → Editor** ⚠️ **MISSING LINK**

**Current:**
1. User goes to `/reco`
2. Completes `SmartWizard` questions
3. Gets recommendations
4. **BUT:** How do they go to editor? No clear button!

**Missing:**
- Button/link to go to editor with selected program
- Route from wizard results to editor

**Fix Needed:**
- Add "Start Writing" button in wizard results
- Route to `/editor?programId=X`

---

### **Flow 3: Editor → Export** ⚠️ **MISSING LINK**

**Current:**
1. User writes in editor (`/editor`)
2. Saves content to localStorage
3. **BUT:** How do they export? No export button visible!

**Missing:**
- Export button in editor
- Clear path from editor to export page

**Fix Needed:**
- Add "Export" button in Phase4Integration
- Route to `/export?programId=X`

---

### **Flow 4: Export → Download** ⚠️ **NEEDS VERIFICATION**

**Current:**
1. User goes to `/export`
2. Sees export options
3. Clicks export
4. **NEEDS TEST:** Does it actually generate PDF/DOCX?

**Status:** Unknown - needs verification

---

## 🟠 **UNWIRED COMPONENTS**

### **Components NOT Used Anywhere:**

| Component | Location | Status | Action |
|-----------|----------|--------|--------|
| `ExportSettings` | `features/editor/components/ExportSettings.tsx` | ❓ Check if used | Verify or remove |
| (Check for others...) | | | |

---

### **Components Using Wrong Data Source:**

| Component | Current | Should Use | Fix Needed |
|-----------|---------|------------|------------|
| `RequirementsChecker` | ✅ **FIXED** - Now uses scraper-lite | `/api/programmes/[id]/requirements` | ✅ Done |
| (Others to check...) | | | |

---

## 🔵 **MISSING CONNECTIONS**

### **1. Wizard Results → Editor** ❌

**Missing:** Button/link to go from wizard recommendations to editor

**Files:**
- `features/reco/components/wizard/SmartWizard.tsx` - Check if it routes to editor

**Fix:**
```typescript
// After wizard completes, add:
<Button onClick={() => router.push(`/editor?programId=${selectedProgramId}`)}>
  Start Writing Business Plan
</Button>
```

---

### **2. Editor → Export** ❌

**Missing:** Export button in editor UI

**Files:**
- `features/editor/components/Phase4Integration.tsx` - Add export button

**Fix:**
```typescript
// Add export button in Phase4Integration
<Button onClick={() => router.push(`/export?programId=${programProfile.programId}`)}>
  Export Plan
</Button>
```

---

### **3. Results Page** ❓

**Location:** `pages/results.tsx`  
**Status:** Unknown - needs check  
**Question:** What is this page for? Is it used?

---

## 📋 **PAGES AUDIT**

| Page | Status | Issues | Action |
|------|--------|--------|--------|
| `/` (home) | ✅ Works | Routes unclear | Add clear CTAs |
| `/reco` (wizard) | ✅ Works | No route to editor | Add "Start Writing" button |
| `/editor` | ✅ Works | No export button | Add export button |
| `/export` | ⚠️ Needs test | Unknown if works | Test export functionality |
| `/library` | ❓ Unknown | Check if used | Verify or remove |
| `/preview` | ❓ Unknown | Check if used | Verify or remove |
| `/results` | ❓ Unknown | Check if used | Verify or remove |
| `/advanced-search` | ✅ Works | None | Keep |

---

## 🔧 **WHAT TO FIX - PRIORITY ORDER**

### **Priority 1: Make User Journey Work** 🔴

1. **Fix Wizard → Editor Flow**
   - Add "Start Writing" button in SmartWizard after completion
   - Route to `/editor?programId=X`

2. **Fix Editor → Export Flow**
   - Add "Export" button in Phase4Integration
   - Route to `/export?programId=X`

3. **Fix Home Page CTAs**
   - Make it clear: Home → Wizard → Editor → Export
   - Update all buttons/links

---

### **Priority 2: Fix Broken APIs** 🟡

1. **Remove or Fix POST /api/programmes/[id]/requirements**
   - Either remove POST handler
   - OR implement `updateProgramRequirements()` properly

2. **Remove Empty Folders**
   - Delete `pages/api/scraper/`

3. **Check Unused Endpoints**
   - Remove `/api/notifications` if not needed
   - Remove `/api/pipeline/status` if not needed

---

### **Priority 3: Clean Up Unused Pages** 🟢

1. **Check These Pages:**
   - `/library` - Is it used?
   - `/preview` - Is it used?
   - `/results` - Is it used?

2. **Remove if not used**
   - OR wire them properly

---

### **Priority 4: Test End-to-End** 🔵

1. **Test Full Flow:**
   - Home → Wizard → Select Program → Editor → Write → Export → Download
   - Verify each step works
   - Document what breaks

---

## ✅ **WHAT WORKS**

1. ✅ Scraper-lite → Database (all 18 categories)
2. ✅ Database → API (all endpoints query database)
3. ✅ API → Editor components (RequirementsChecker now fixed)
4. ✅ Individual pages load (but connections missing)

---

## 📝 **SUMMARY**

**Current State:** Components work individually BUT **user cannot complete any flow**

**Main Problems:**
1. ❌ No clear path from wizard to editor
2. ❌ No export button in editor
3. ❌ Broken POST API endpoint
4. ❌ Missing navigation between pages
5. ❓ Unknown pages (results, library, preview)

**Action:** Fix navigation first, then test end-to-end flow

