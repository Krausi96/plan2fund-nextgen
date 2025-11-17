# Editor Entry Flow Analysis

**Date:** 2025-01-XX  
**Issue:** User gets error when clicking CTA from landing page

---

## Entry Flow from Landing Page CTA

### Step 1: Landing Page CTA Click
**File:** `shared/components/common/Hero.tsx` (Line 284)
```tsx
<a href="/editor">  // Direct link, no query params
  {heroSecondaryButton}
</a>
```

**What happens:**
- User clicks CTA button
- Browser navigates to `/editor` (no query parameters)
- Full page reload (not client-side navigation)

---

### Step 2: Editor Page Loads
**File:** `pages/editor.tsx`

**Flow:**
1. `EditorPage` component mounts
2. `useRouter()` hook initializes
3. Checks `router.isReady` - shows loading spinner if not ready
4. Extracts `product` from `router.query` → **undefined** (no query params)
5. Defaults to `'submission'`: `const selectedProduct = (product as string) || 'submission'`
6. Renders `<Editor product="submission" />` wrapped in `ErrorBoundary`

**Key Point:** Product defaults to `'submission'` when no query param provided ✅

---

### Step 3: Editor Component Initializes
**File:** `features/editor/components/Editor.tsx`

**Initial State:**
```typescript
const [isLoading, setIsLoading] = useState(true);  // Starts as loading
const [sections, setSections] = useState<PlanSection[]>([]);  // Empty
const [error, setError] = useState<string | null>(null);  // No error
```

**useEffect Triggers:**
```typescript
useEffect(() => {
  if (typeof window !== 'undefined') {
    loadSections();  // Called immediately on mount
  }
}, [loadSections]);
```

---

### Step 4: loadSections() Function Executes
**File:** `features/editor/components/Editor.tsx` (Line 36-157)

**What it does:**
1. Sets `isLoading = true`
2. Sets `error = null`
3. **Calls `getSections('grants', 'submission', undefined, baseUrl)`**
4. Waits for template sections
5. Converts templates to `PlanSection[]`
6. Initializes tables for financial sections
7. Creates `PlanDocument`
8. Loads program data from localStorage (if exists)
9. Sets state and `isLoading = false`

**Critical Call:**
```typescript
templateSections = await getSections(fundingType, product, undefined, baseUrl);
// fundingType = 'grants'
// product = 'submission'
// baseUrl = window.location.origin
```

---

### Step 5: getSections() Function
**File:** `features/editor/templates/index.ts` (Line 51-61)

**Implementation:**
```typescript
export async function getSections(
  fundingType: string,        // 'grants'
  productType: string = 'submission',  // 'submission'
  _programId?: string,        // undefined
  _baseUrl?: string           // window.location.origin
): Promise<SectionTemplate[]> {
  return MASTER_SECTIONS[fundingType]?.[productType] || 
         MASTER_SECTIONS.grants.submission;
}
```

**What it returns:**
- `MASTER_SECTIONS.grants.submission` (array of SectionTemplate)
- Falls back to same if first lookup fails

**Note:** This is **synchronous** despite being `async` - no actual async operation

---

### Step 6: Template Data Structure
**File:** `features/editor/templates/sections.ts`

**Structure:**
```typescript
MASTER_SECTIONS: {
  grants: {
    submission: SectionTemplate[],
    strategy: SectionTemplate[],
    review: SectionTemplate[]
  },
  bankLoans: { ... },
  equity: { ... },
  visa: { ... }
}
```

**Expected:** `MASTER_SECTIONS.grants.submission` should be an array of section templates

---

## Potential Failure Points

### ❌ Issue 1: MASTER_SECTIONS Not Loaded
**Symptom:** `getSections()` returns `undefined` or empty array

**Possible Causes:**
- Import error in `features/editor/templates/index.ts`
- `MASTER_SECTIONS` not properly exported from `data.ts`
- Build/bundling issue with large data file

**Check:**
```typescript
// In browser console:
import { MASTER_SECTIONS } from '@templates';
console.log(MASTER_SECTIONS?.grants?.submission);
```

---

### ❌ Issue 2: Template Structure Invalid
**Symptom:** Templates load but have wrong structure

**Possible Causes:**
- Missing required fields in SectionTemplate
- Type mismatch
- Data corruption

**Check:**
```typescript
const sections = await getSections('grants', 'submission');
console.log(sections[0]); // Check first section structure
```

---

### ❌ Issue 3: Component Render Error
**Symptom:** Templates load but component crashes during render

**Possible Causes:**
- `SectionContentRenderer` accessing undefined data
- `recharts` not loaded (for charts)
- Missing dependencies

**Check:** Browser console for specific error

---

### ❌ Issue 4: Async Timing Issue
**Symptom:** Component tries to render before data loads

**Possible Causes:**
- `useEffect` dependency issue
- Race condition with router
- Server-side rendering mismatch

**Current Protection:**
- `isLoading` state prevents render until data loaded ✅
- Error boundary catches render errors ✅

---

## Current Error Handling

### Error Boundary
**File:** `pages/editor.tsx` (Line 9-57)

**What it catches:**
- React render errors
- Component lifecycle errors
- Unhandled exceptions in children

**What it shows:**
- Error message
- Stack trace (in details)
- Reload button

---

### Internal Error Handling
**File:** `features/editor/components/Editor.tsx` (Line 148-156)

**What it catches:**
- `getSections()` failures
- Template loading errors
- Data validation errors

**What it shows:**
- Error message in UI
- "Try Again" button
- Prevents infinite loading

---

## Debugging Steps

### 1. Check Browser Console
**What to look for:**
- Error messages
- Stack traces
- Network requests to `/api/...`
- Console logs from `loadSections()`

### 2. Check Network Tab
**What to look for:**
- Failed requests
- 404s for template data
- CORS errors

### 3. Check Application State
**In browser console:**
```javascript
// Check if templates are loaded
localStorage.getItem('planSections');

// Check router state
console.log(window.location.pathname);
console.log(window.location.search);
```

### 4. Check Error Boundary
**If error boundary shows:**
- Click "Error Details" to see stack trace
- Copy error message
- Check which component failed

---

## Expected Behavior

### ✅ Success Flow:
1. User clicks CTA → navigates to `/editor`
2. Page loads → shows loading spinner
3. `getSections()` called → returns templates
4. Editor renders with sections
5. User can start editing

### ❌ Failure Flow (Current):
1. User clicks CTA → navigates to `/editor`
2. Page loads → shows loading spinner
3. `getSections()` called → **ERROR**
4. Error boundary catches error
5. Shows error message

---

## Next Steps to Fix

1. **Check actual error message** from error boundary
2. **Verify MASTER_SECTIONS is loaded:**
   ```typescript
   import { MASTER_SECTIONS } from '@templates';
   console.log(MASTER_SECTIONS);
   ```
3. **Check if getSections returns data:**
   ```typescript
   const sections = await getSections('grants', 'submission');
   console.log(sections);
   ```
4. **Check browser console** for specific error
5. **Check network tab** for failed requests

---

## Summary

**Entry Point:** Landing page CTA → `/editor` (no query params)  
**Default Product:** `'submission'`  
**Template Source:** `MASTER_SECTIONS.grants.submission`  
**Error Handling:** Error boundary + internal error state  
**Current Issue:** Unknown - need error message from error boundary

**The error boundary should now show the exact error message. Check the browser to see what's failing!**

