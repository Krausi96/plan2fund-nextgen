# Editor Entry Points - Current State

**Last Updated:** After simplification changes  
**Status:** ✅ Editor works without program selection

---

## 🎯 Overview

The editor now supports **multiple entry points** and works **immediately** without requiring program selection. Users can start editing with default templates and optionally select a program later.

---

## 📍 Entry Points

### 1. **Direct URL Access (No Parameters)**
```
/editor
```
**Behavior:**
- ✅ Loads immediately with default sections
- ✅ Uses default route: `grant` and product: `submission`
- ✅ Shows ProgramSelector in header (optional - can be ignored)
- ✅ Editor is fully functional without program selection
- ✅ Uses default templates based on route/product

**Code:** `pages/editor.tsx` → `Editor` component loads sections immediately

---

### 2. **Direct URL with Product/Route**
```
/editor?product=strategy&route=grants
/editor?product=submission&route=bankLoans
/editor?product=review&route=equity
```
**Behavior:**
- ✅ Loads immediately with sections for specified product/route
- ✅ No programId required
- ✅ Uses default templates for that combination
- ✅ ProgramSelector shows in header (optional)

**Used by:**
- Homepage CTA: `/editor` (line 87 in `pages/index.tsx`)
- Dashboard: `/editor?product=submission&route=grant` (line 404 in `pages/dashboard.tsx`)
- Pricing page: `/editor?product=${product.id}` (line 506 in `pages/pricing.tsx`)

---

### 3. **Direct URL with Program (From Recommendation)**
```
/editor?programId=ffg_basisprogramm&route=grants&product=submission
```
**Behavior:**
- ✅ Loads with program-specific sections (if available)
- ✅ Falls back to default templates if program not found
- ✅ Loads program requirements for Requirements modal
- ✅ ProgramSelector shows selected program in header

**Used by:**
- **Recommendation Flow:** When user clicks "Open in Editor" on a recommended program
  - Code: `features/reco/components/ProgramFinder.tsx` line 481
  - Navigates: `/editor?programId=${program.id}&route=${programRoute}`
- **Library Page:** When user clicks "Open in Editor" on saved program
  - Code: `pages/main/library.tsx` line 147
  - Navigates: `/editor?programId=${program.id}&route=${program.type}&product=submission`

---

### 4. **From Recommendation Page (Reco Flow)**
```
/reco → [User answers questions] → [Selects program] → /editor?programId=X&route=Y
```
**Behavior:**
- User goes through recommendation flow
- Answers questions about their business
- Gets program recommendations
- Clicks "Open in Editor" on a program
- Navigates to editor with `programId` pre-filled

**Code:** `features/reco/components/ProgramFinder.tsx` line 481

**Note:** This is the **only flow that requires going through reco first** - but it's optional! Users can skip this and go directly to `/editor`.

---

## 🔄 How Each Entry Point is Handled

### Editor Component Logic (`features/editor/components/Editor.tsx`)

```typescript
// Entry point: ANY URL with /editor
function Editor({ programId, product = 'submission', route = 'grant' }) {
  
  // ✅ ALWAYS loads sections (programId is optional)
  useEffect(() => {
    loadSections(); // Runs on mount and when product/route/programId changes
  }, [product, route, programId]);

  const loadSections = async () => {
    // ✅ Works without programId - uses default templates
    const templateSections = await getSections(
      fundingType, 
      product, 
      programId || undefined, // Optional!
      baseUrl
    );
    
    // ✅ Loads program data only if programId provided
    if (programId) {
      // Try to load program-specific requirements
      // Falls back gracefully if not available
    }
  };
}
```

### Key Changes Made:
1. ✅ **Removed blocking ProgramSelector** - No longer shows full-screen selector
2. ✅ **Sections load immediately** - Even without programId
3. ✅ **ProgramSelector in header** - Always visible, optional to use
4. ✅ **Graceful fallbacks** - Works even if program API fails
5. ✅ **Default templates** - Always available based on route/product

---

## 📊 Entry Point Comparison

| Entry Point | programId | product | route | Behavior |
|------------|-----------|---------|-------|----------|
| `/editor` | ❌ None | `submission` (default) | `grant` (default) | ✅ Loads default templates immediately |
| `/editor?product=strategy` | ❌ None | `strategy` | `grant` (default) | ✅ Loads strategy templates |
| `/editor?product=X&route=Y` | ❌ None | `X` | `Y` | ✅ Loads templates for X/Y combo |
| `/editor?programId=X&route=Y` | ✅ `X` | `submission` (default) | `Y` | ✅ Loads program-specific if available, else defaults |
| From Reco | ✅ Pre-filled | `submission` | From program | ✅ Loads with program context |

---

## 🎨 UI Flow for Each Entry Point

### Entry Point 1-3: No Program Selected
```
User enters /editor
    ↓
Editor loads immediately
    ↓
Header shows:
  - Business Plan Editor title
  - Requirements, AI Assistant, Preview buttons
  - ProgramSelector card (Product, Route, Program dropdowns)
    ↓
Section Navigation shows default sections
    ↓
Main Editor Area shows first section
    ↓
User can:
  - Start editing immediately ✅
  - Change product/route in header ✅
  - Optionally select a program ✅
  - Use AI generation ✅
```

### Entry Point 4: With Program (From Reco)
```
User clicks "Open in Editor" on recommended program
    ↓
Navigates to /editor?programId=X&route=Y
    ↓
Editor loads with:
  - Program-specific sections (if available)
  - Program requirements loaded
  - ProgramSelector shows selected program
    ↓
User can:
  - Edit with program-specific guidance ✅
  - See program requirements in Requirements modal ✅
  - Change program if needed ✅
```

---

## 🔗 All Navigation Points to Editor

### From Homepage (`pages/index.tsx`)
- **Line 87:** CTA button → `/editor`
- **Line 49-64:** Step clicks → `/reco` (then to editor)

### From Dashboard (`pages/dashboard.tsx`)
- **Line 404:** "Create New Plan" → `/editor?product=submission&route=grant`
- **Line 433:** "View All Plans" → `/editor`

### From Pricing (`pages/pricing.tsx`)
- **Line 506:** Product card → `/editor?product=${product.id}`
- **Line 580:** CTA button → `/editor`

### From Recommendation (`features/reco/components/ProgramFinder.tsx`)
- **Line 481:** "Open in Editor" → `/editor?programId=${program.id}&route=${programRoute}`

### From Library (`pages/main/library.tsx`)
- **Line 147:** "Open in Editor" → `/editor?programId=${program.id}&route=${program.type}&product=submission`

### From Preview (`pages/preview.tsx`)
- **Line 452:** "Edit" link → `/editor?restore=true`

### From Editor Itself (`features/editor/components/Editor.tsx`)
- **Line 186:** "Select Program" button → `/editor`
- **Line 352:** ProgramSelector change → `/editor?programId=${prog}&product=${prod}&route=${rte}`

---

## ✅ Current Status

### What Works:
- ✅ All entry points load immediately
- ✅ No blocking screens or required flows
- ✅ Default templates always available
- ✅ Program selection is optional
- ✅ Editor works without API calls
- ✅ Graceful fallbacks if APIs fail

### What's Optional:
- ⚠️ Program selection (for program-specific templates)
- ⚠️ Recommendation flow (for personalized programs)
- ⚠️ Program requirements (only if programId provided)

### What Still Goes Through Reco:
- 🔄 **Only if user wants personalized program recommendations**
- 🔄 User can skip reco and go directly to `/editor`

---

## 🚀 Simplification Summary

**Before:**
- ❌ Editor required programId
- ❌ ProgramSelector was blocking screen
- ❌ Had to go through reco to get programs
- ❌ API failures blocked editor

**After:**
- ✅ Editor works immediately
- ✅ ProgramSelector is optional in header
- ✅ Can skip reco entirely
- ✅ Graceful fallbacks everywhere

---

## 📝 Notes

1. **Recommendation flow is still available** - Users who want personalized recommendations can still use it
2. **Program selection is optional** - Editor works great with default templates
3. **All entry points are simplified** - No blocking screens, immediate access
4. **Backward compatible** - Old URLs with programId still work

---

**Last Updated:** After simplification changes (removed login requirement + made program selection optional)

