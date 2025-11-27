# Checkbox Toggle Issue - Handover Document

## Problem Description
Checkboxes in both Column 2 (Documents) and Column 3 (Sections) are not working properly:
- Users cannot check/uncheck checkboxes
- Counts do not update when checkboxes are toggled
- Both document and section checkboxes are affected

## Current Implementation

### Checkbox Component Location
- **File**: `features/editor/components/layout/Desktop/DesktopTemplateColumns.tsx`
- **Document checkboxes**: Lines ~283-298
- **Section checkboxes**: Lines ~510-525

### Current Checkbox Implementation
```tsx
<input
  type="checkbox"
  checked={!isDisabled}
  onChange={(e) => {
    e.stopPropagation();
    onToggleDocument(doc.id); // or onToggleSection(section.id)
  }}
  onMouseDown={(e) => {
    e.stopPropagation();
  }}
  className="..."
/>
```

### Toggle Functions Location
- **File**: `features/editor/components/layout/Desktop/Desktop.tsx`
- **toggleDocument**: Lines ~303-320
- **toggleSection**: Lines ~267-285

### Current Toggle Implementation
```tsx
const toggleDocument = useCallback((documentId: string) => {
  // Check if document is required first
  const allDocumentsCurrent = [...documents, ...customDocuments];
  const document = allDocumentsCurrent.find(d => d.id === documentId);
  if (document?.required) {
    return; // Required documents cannot be disabled
  }
  
  // Use functional update
  setDisabledDocuments(prev => {
    const next = new Set(prev);
    if (next.has(documentId)) {
      next.delete(documentId); // Enable
    } else {
      next.add(documentId); // Disable
    }
    return next;
  });
}, [documents, customDocuments]);
```

## What We've Tried

### 1. Removed Lock Mechanism
- **Attempt**: Removed `toggleInProgress` ref that was preventing double-toggling
- **Result**: Still not working
- **Status**: ✅ Removed (no longer in code)

### 2. Changed Event Handlers
- **Attempt**: Changed `onClick` to `onMouseDown` to prevent interference with `onChange`
- **Result**: Still not working
- **Status**: ✅ Applied (currently using `onMouseDown`)

### 3. Removed preventDefault
- **Attempt**: Removed `e.preventDefault()` from `onChange` handlers
- **Result**: Still not working
- **Status**: ✅ Removed (not in current code)

### 4. Functional State Updates
- **Attempt**: Using functional updates `setDisabledDocuments(prev => ...)` to prevent stale closures
- **Result**: Logic appears correct but checkboxes still don't toggle
- **Status**: ✅ Applied (current implementation)

### 5. Event Propagation
- **Attempt**: Using `e.stopPropagation()` to prevent card click handlers from interfering
- **Result**: Still not working
- **Status**: ✅ Applied (currently in code)

## State Management

### Disabled State
- **Documents**: `disabledDocuments` - `Set<string>` containing IDs of disabled documents
- **Sections**: `disabledSections` - `Set<string>` containing IDs of disabled sections
- **Initialization**: Both initialized as `new Set()` with functional initialization to prevent hydration issues

### Count Calculation
- **Documents**: `enabledDocumentsCount = visibleDocuments.length + 1` (includes core product)
- **Sections**: `enabledSectionsCount = visibleSections.length`
- **Location**: `Desktop.tsx` lines ~592-596

### Visible Items
- **Documents**: `visibleDocuments = allDocuments.filter(d => !disabledDocuments.has(d.id))`
- **Sections**: `visibleSections = allSections.filter(s => !disabledSections.has(s.id))`

## Potential Issues to Investigate

### 1. React State Batching
- React 18+ batches state updates, which might cause issues
- **Check**: Are state updates being batched incorrectly?
- **Solution**: Try using `flushSync` from `react-dom` if needed

### 2. Controlled Component Issue
- Checkbox is controlled (`checked={!isDisabled}`) but state might not be updating
- **Check**: Is `isDisabled` value correct when checkbox is clicked?
- **Debug**: Add `console.log` in `onChange` to verify function is called

### 3. Event Handler Interference
- Card click handler might be preventing checkbox interaction
- **Check**: Is the card's `onClick` handler interfering?
- **Location**: Card click handler at line ~214 in `DesktopTemplateColumns.tsx`

### 4. State Update Not Triggering Re-render
- State might be updating but component not re-rendering
- **Check**: Is `disabledDocuments`/`disabledSections` state actually changing?
- **Debug**: Add `useEffect` to log state changes

### 5. Required Items Logic
- Required items cannot be toggled, but logic might be blocking all items
- **Check**: Are non-required items being blocked incorrectly?
- **Debug**: Verify `document?.required` check is working correctly

### 6. Card Click Handler Blocking
- The card's `onClick` handler checks for checkboxes but might still interfere
- **Check**: Is the card click handler preventing checkbox clicks?
- **Location**: Lines ~214-232 in `DesktopTemplateColumns.tsx`

## Debugging Steps

1. **Add console.logs**:
   ```tsx
   onChange={(e) => {
     console.log('Checkbox onChange fired', doc.id, isDisabled);
     e.stopPropagation();
     onToggleDocument(doc.id);
   }}
   ```

2. **Add state change logging**:
   ```tsx
   useEffect(() => {
     console.log('disabledDocuments changed:', Array.from(disabledDocuments));
   }, [disabledDocuments]);
   ```

3. **Check if toggle function is called**:
   ```tsx
   const toggleDocument = useCallback((documentId: string) => {
     console.log('toggleDocument called', documentId);
     // ... rest of function
   }, [documents, customDocuments]);
   ```

4. **Verify checkbox state**:
   ```tsx
   console.log('Checkbox state:', {
     docId: doc.id,
     isDisabled,
     checked: !isDisabled,
     inDisabledSet: disabledDocuments.has(doc.id)
   });
   ```

## Files to Check

1. **DesktopTemplateColumns.tsx**
   - Checkbox components (lines ~283-298, ~510-525)
   - Card click handlers (lines ~214-232, ~450-480)

2. **Desktop.tsx**
   - Toggle functions (lines ~267-285, ~303-320)
   - State initialization (lines ~90-95)
   - Count calculations (lines ~592-596)

3. **State flow**:
   - User clicks checkbox → `onChange` fires → `onToggleDocument/Section` called → `setDisabledDocuments/Sections` updates → Component re-renders → Count updates

## Expected Behavior

1. User clicks checkbox
2. `onChange` handler fires
3. `onToggleDocument` or `onToggleSection` is called
4. State updates via `setDisabledDocuments` or `setDisabledSections`
5. Component re-renders with new state
6. Checkbox visual state updates (`checked={!isDisabled}`)
7. Count updates in header

## Additional Notes

- The checkbox uses controlled component pattern (`checked={!isDisabled}`)
- `isDisabled` is calculated from `disabledDocuments.has(doc.id)` or `disabledSections.has(section.id)`
- Required items should not be toggleable (this is working correctly)
- Core product is always enabled (not in the toggleable documents list)

## Next Steps

1. Add debugging logs to identify where the flow breaks
2. Check if React DevTools shows state updates
3. Verify event handlers are not being prevented
4. Test with a simple uncontrolled checkbox to isolate the issue
5. Check for any global event listeners that might interfere

## Contact

If you need more context or have questions, check the git history for recent changes related to checkbox functionality.

