# Sidebar Section Change Flow

## 🔄 How Sidebar Section Selection Works

### Flow Diagram

```
User clicks section in Sidebar
  ↓
Sidebar.handleClick(sectionId)  [Sidebar.tsx:363]
  ↓
onSelectSection(sectionId)      [Sidebar.tsx:367]
  ↓
Editor.handleSectionSelect(sectionId, 'user')  [Editor.tsx:819]
  ↓
setActiveSection(sectionId)      [Editor.tsx:389]
  ↓
activeSectionId changes          [useEditorStore]
  ↓
useEffect triggers               [Editor.tsx:393]
  ↓
setEditingSectionId(activeSectionId)  [Editor.tsx:414]
  ↓
effectiveEditingSectionId updates [Editor.tsx:335]
  ↓
InlineSectionEditor renders      [Editor.tsx:927]
```

---

## 📍 Code Locations

### 1. Sidebar Component - Click Handler

**File:** `features/editor/components/layout/Workspace/Navigation/Sidebar.tsx`

**Location:** Lines 363-369

```typescript
const handleClick = (sectionId: string) => {
  if (sectionId === ANCILLARY_SECTION_ID) {
    onSelectSection(METADATA_SECTION_ID);
  } else {
    onSelectSection(sectionId);  // ← Calls parent's onSelectSection
  }
};
```

**Where it's used:**
- Line 385: Collapsed sidebar button click
- Line 446: Expanded sidebar card click  
- Line 625: Expanded sidebar list item click

---

### 2. Editor Component - Section Selection Handler

**File:** `features/editor/components/Editor.tsx`

**Location:** Lines 386-390

```typescript
// Wrapper for setActiveSection that tracks the source
const handleSectionSelect = useCallback((sectionId: string, source: 'user' | 'scroll' | 'preview' = 'user') => {
  sectionChangeSourceRef.current = source;  // Track if from sidebar, scroll, or preview click
  setActiveSection(sectionId);  // ← Updates activeSectionId in store
}, [setActiveSection]);
```

**Where it's connected:**
- Line 819: Sidebar `onSelectSection` prop
  ```typescript
  <Sidebar
    onSelectSection={(sectionId) => handleSectionSelect(sectionId, 'user')}
    ...
  />
  ```

---

### 3. Auto-Open Editor Effect

**File:** `features/editor/components/Editor.tsx`

**Location:** Lines 392-424

```typescript
// Auto-activate editor when plan loads or activeSectionId changes
useEffect(() => {
  if (!plan) return;
  
  // If no active section, set one
  if (!activeSectionId) {
    if (plan.sections && plan.sections.length > 0) {
      setActiveSection(plan.sections[0].id);
    } else {
      setActiveSection(METADATA_SECTION_ID);
    }
    return;
  }
  
  // Auto-open editor for active section
  const isMetadataSection = activeSectionId === METADATA_SECTION_ID || 
                            activeSectionId === ANCILLARY_SECTION_ID || 
                            activeSectionId === REFERENCES_SECTION_ID || 
                            activeSectionId === APPENDICES_SECTION_ID;
  
  // Always set editingSectionId to show editor
  if (!editingSectionId || editingSectionId !== activeSectionId) {
    setEditingSectionId(activeSectionId);  // ← This triggers editor to show
  }
  
  // For regular sections, set first question as active if not already set
  if (!isMetadataSection) {
    const section = plan.sections.find(s => s.id === activeSectionId);
    if (section && !activeQuestionId) {
      setActiveQuestion(section.questions[0]?.id ?? null);
    }
  }
  
  // Scroll to section if change was from user interaction
  if (sectionChangeSourceRef.current === 'user' || sectionChangeSourceRef.current === 'preview') {
    // ... scroll logic
  }
}, [activeSectionId, plan, activeQuestionId, editingSectionId, setActiveSection, setActiveQuestion, setEditingSectionId]);
```

**Key Point:** This effect automatically sets `editingSectionId` when `activeSectionId` changes, which should trigger the editor to show.

---

### 4. Effective Editing Section ID

**File:** `features/editor/components/Editor.tsx`

**Location:** Lines 334-367

```typescript
// Always show editor for active section - UNIVERSAL DESIGN/MANAGEMENT PANEL for ALL sections
const effectiveEditingSectionId = useMemo(() => {
  // If editingSectionId is explicitly set, use it (works for ALL sections including ANCILLARY)
  if (editingSectionId) {
    return editingSectionId;
  }
  // Otherwise, show editor for active section (works for ALL sections)
  if (activeSectionId) {
    return activeSectionId;
  }
  // If no active section, default to first section (if available)
  if (plan?.sections && plan.sections.length > 0) {
    const firstSection = plan.sections[0];
    if (firstSection) {
      return firstSection.id;
    }
  }
  // For special sections, show if they're available
  if (plan) {
    // Default to METADATA if available (title page)
    if (plan.titlePage) {
      return METADATA_SECTION_ID;
    }
    // Default to ANCILLARY if available (TOC, lists management)
    if (plan.ancillary) {
      return ANCILLARY_SECTION_ID;
    }
    // Default to REFERENCES if available
    if (plan.references && plan.references.length > 0) {
      return REFERENCES_SECTION_ID;
    }
  }
  // Last resort: return null (editor won't show, but this should rarely happen)
  return null;
}, [editingSectionId, activeSectionId, plan]);
```

**Key Point:** This determines which section the editor should show. It defaults to `activeSectionId` if `editingSectionId` is not set.

---

### 5. Editor Render Condition

**File:** `features/editor/components/Editor.tsx`

**Location:** Lines 927-943

```typescript
{(() => {
  const shouldRender = !!effectiveEditingSectionId;
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('[Editor] InlineSectionEditor render check:', {
      shouldRender,
      effectiveEditingSectionId,
      activeSectionId,
      editingSectionId,
      hasActiveSection: !!activeSection,
      activeQuestionId,
      hasPlan: !!plan,
      planSectionsCount: plan?.sections?.length || 0
    });
  }
  return shouldRender;
})() && (
  <InlineSectionEditor
    sectionId={effectiveEditingSectionId}
    ...
  />
)}
```

**Key Point:** Editor only renders if `effectiveEditingSectionId` is truthy.

---

## 🔍 Debugging the Flow

### Check These Values in Console:

1. **After clicking sidebar section:**
   ```javascript
   // Should see in console:
   [Editor] InlineSectionEditor render check: {
     shouldRender: true,  // ← Should be TRUE
     effectiveEditingSectionId: "section_id_here",  // ← Should have value
     activeSectionId: "section_id_here",  // ← Should match
     editingSectionId: "section_id_here",  // ← Should be set by useEffect
     ...
   }
   ```

2. **Check if useEffect is running:**
   - Add console.log in useEffect at line 393
   - Should log when `activeSectionId` changes

3. **Check if setEditingSectionId is being called:**
   - Add console.log before `setEditingSectionId(activeSectionId)` at line 414
   - Should log when section changes

---

## 🐛 Potential Issues

### Issue 1: useEffect Not Running
**Symptom:** `editingSectionId` doesn't update when clicking sidebar
**Check:**
- Is `plan` loaded? (useEffect returns early if `!plan`)
- Is `activeSectionId` actually changing? (check in console)
- Are dependencies correct? (useEffect deps at line 508)

### Issue 2: effectiveEditingSectionId is null
**Symptom:** Editor doesn't render even though `activeSectionId` is set
**Check:**
- Is `plan` loaded when `effectiveEditingSectionId` is calculated?
- Does `plan.sections` exist and have items?
- Check the fallback logic in `useMemo`

### Issue 3: Editor Renders But Not Visible
**Symptom:** `shouldRender` is true but editor not visible
**Check:**
- Position calculation (see `InlineSectionEditor.tsx` line 188)
- CSS visibility/display styles
- Z-index conflicts
- Parent container overflow

---

## ✅ Expected Behavior

When user clicks a section in sidebar:

1. ✅ `handleClick` is called with section ID
2. ✅ `onSelectSection` is called
3. ✅ `handleSectionSelect` is called with source='user'
4. ✅ `setActiveSection` updates `activeSectionId` in store
5. ✅ `useEffect` detects `activeSectionId` change
6. ✅ `setEditingSectionId(activeSectionId)` is called
7. ✅ `effectiveEditingSectionId` updates to match `activeSectionId`
8. ✅ `shouldRender` becomes `true`
9. ✅ `InlineSectionEditor` component renders
10. ✅ Editor appears on right side of preview

---

## 📝 Summary

**Sidebar Section Change Location:**
- **Click Handler:** `Sidebar.tsx` line 363 (`handleClick`)
- **Selection Handler:** `Editor.tsx` line 387 (`handleSectionSelect`)
- **Connection:** `Editor.tsx` line 819 (`onSelectSection` prop)
- **Auto-Open Logic:** `Editor.tsx` line 393 (useEffect)
- **Render Condition:** `Editor.tsx` line 927 (`effectiveEditingSectionId`)

**Key Flow:**
```
Sidebar Click → handleSectionSelect → setActiveSection → 
activeSectionId changes → useEffect → setEditingSectionId → 
effectiveEditingSectionId updates → Editor renders
```

