# Editor Simplified Flow

**Date:** After simplification  
**Status:** ✅ Routes removed, simplified to product selection only

---

## 🎯 Simplified Approach

### What Was Removed
- ❌ **Funding Routes** (grants, bankLoans, equity, visa) - Removed for simplicity
- ❌ **Route selection** - No longer needed
- ✅ **Product selection** - Only thing users need to choose
- ✅ **Program selection** - Optional, can be added via URL

---

## 📍 Entry Points - Simplified

### Entry Point 1: `/editor` (No Parameters)
**What Happens:**
1. `ProductSelectionModal` appears automatically
2. User selects product (Strategy/Review/Submission)
3. Clicks "Start Editing"
4. Navigates to `/editor?product=strategy` (or review/submission)
5. Editor loads with selected product

**Components:**
- `ProductSelectionModal.tsx` - Shows modal for product selection
- `Editor.tsx` - Main editor component

### Entry Point 2: `/editor?product=strategy`
**What Happens:**
1. Editor loads immediately with strategy sections
2. No modal appears (product already selected)
3. `ProgramSelector` shows in header (optional to use)

### Entry Point 3: `/editor?product=submission&programId=ffg_basisprogramm`
**What Happens:**
1. Editor loads with submission sections
2. Program is automatically loaded (from URL parameter)
3. `ProgramSelector` shows selected program in header

---

## 🎨 How Components Work

### 1. ProductSelectionModal.tsx
**Purpose:** Entry point modal - appears when no product is selected

**What It Does:**
- Shows when user enters `/editor` without `product` parameter
- User selects: Strategy, Review, or Submission
- Navigates to `/editor?product=X` after selection
- **NOT related to reco** - Just product selection

**When It Appears:**
- `/editor` (no params) → Modal shows
- `/editor?product=X` → Modal hidden, editor loads

### 2. ProgramSelector.tsx
**Purpose:** Header dropdown - appears in editor header

**What It Does:**
- Shows in editor header (always visible)
- Allows changing product (Strategy/Review/Submission)
- Allows selecting optional program (if available)
- **NOT an entry point** - Just a control in the editor

**When It Appears:**
- Always visible in editor header
- Shows current product and program (if selected)

---

## 🔗 How Program Selection Works

### Option 1: Via URL Parameter (Simplest)
```
/editor?product=submission&programId=ffg_basisprogramm
```
- User can add `programId` directly to URL
- No need to go through reco
- ProgramSelector automatically picks it up

### Option 2: Via ProgramSelector in Header
- User clicks ProgramSelector dropdown in header
- Selects a program from the list
- URL updates automatically

### Option 3: Via Recommendation Flow (Optional)
- User goes through `/reco` flow
- Selects a program
- Clicks "Open in Editor"
- Navigates with `programId` pre-filled

**All three options work!** Users can choose whichever is easiest.

---

## 📊 Current Flow Diagram

```
User enters /editor
    ↓
ProductSelectionModal appears
    ↓
User selects: Strategy / Review / Submission
    ↓
Navigates to /editor?product=strategy
    ↓
Editor loads with sections
    ↓
ProgramSelector shows in header
    ↓
User can:
  - Start editing immediately ✅
  - Change product in header ✅
  - Add program via URL ✅
  - Add program via dropdown ✅
  - Add program via reco (optional) ✅
```

---

## ✅ What's Simplified

1. **No Route Selection** - Removed entirely
2. **Product Only** - Just Strategy/Review/Submission
3. **Program Optional** - Can be added anytime via URL or dropdown
4. **Clear Entry Point** - Modal appears when needed
5. **Simple URL Structure** - Just `?product=X` and optionally `&programId=Y`

---

## 🎯 Summary

**ProductSelectionModal:**
- Entry point modal
- Appears when no product selected
- User selects product → starts editing

**ProgramSelector:**
- Header control in editor
- Allows changing product
- Allows selecting program (optional)
- Not an entry point

**Program Selection:**
- Can be added via URL: `?programId=X`
- Can be added via dropdown in header
- Can be added via reco flow (optional)
- All methods work!

---

**The flow is now much simpler!** 🚀

