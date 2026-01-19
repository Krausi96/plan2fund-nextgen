# Live Preview Alignment Handover

## Overview
This document outlines the investigation findings and next steps for aligning LivePreviewBox (floating preview) with PreviewWorkspace (main preview area) in terms of constants, types, and design synchronization.

## Current Status

### ✅ Completed
- LivePreviewBox padding structure cleaned and aligned with PreviewWorkspace
- Git committed and pushed latest changes
- Visual debugging removed, clean production-ready implementation

### ⚠️ Issues to Investigate

## 1. Constants & Types Alignment

### Shared Resources Already in Use
Both components utilize the same core types and constants:

**From `shared/components/editor/DocumentStyles.tsx`:**
- `DocumentStyleConfig` interface
- `DEFAULT_DOCUMENT_STYLE` constant

**From `features/editor/lib/`:**
- `ProductType` type
- `getTranslation` function from `renderers.ts`

### Investigation Points

#### A. Style Configuration Sync
**Files to examine:**
- `PreviewWorkspace.tsx` (lines 38-39): Uses `DEFAULT_DOCUMENT_STYLE`
- `LivePreviewBox.tsx`: Currently has no style configuration

**Current mismatch:**
- PreviewWorkspace has `[documentStyle, setDocumentStyle]` state
- LivePreviewBox has no equivalent style state management

#### B. Data Flow Analysis
**PreviewWorkspace data flow:**
```typescript
const [documentStyle, setDocumentStyle] = useState<DocumentStyleConfig>(DEFAULT_DOCUMENT_STYLE);
// Used in DocumentSettings component
<DocumentSettings config={documentStyle} onChange={setDocumentStyle} />
```

**LivePreviewBox data flow:**
```typescript
// Currently only receives formData and productType props
// No style configuration or updates
```

## 2. Design Settings Application

### Current Capabilities (PreviewWorkspace)
The styling tab in PreviewWorkspace allows configuring:

**Global Appearance:**
- Theme (default/professional/modern/minimal/corporate)
- Color scheme (light/dark/blue/green/warm)
- Font family (sans/serif/mono/system)
- Font size (small/normal/large)

**Layout Settings:**
- Page margins (narrow/normal/wide)
- Line height (compact/normal/relaxed)
- Text alignment (left/justify)

**Section Controls:**
- Page numbers (show/hide)
- Section numbers (show/hide)
- Section spacing (compact/normal/spacious)

**Headers & Footers:**
- Header style (minimal/detailed/none)
- Footer style (minimal/detailed/none)
- Document title visibility

### Missing in LivePreviewBox
LivePreviewBox currently:
- ✗ Has no access to document style configuration
- ✗ Doesn't receive style updates from PreviewWorkspace
- ✗ Uses hardcoded styling instead of configurable options
- ✗ Cannot reflect real-time style changes

## 3. Title Page Synchronization Issue

### Problem Statement
PreviewWorkspace title page is not updating when changes are made, suggesting:
- Store/state synchronization issues
- Missing reactivity in title page rendering
- Potential memoization preventing updates

### Investigation Areas

#### A. State Management
Check how title page data flows:
- `useEditorStore` selectors in both components
- Plan document updates and re-rendering
- FormData synchronization between components

#### B. Component Dependencies
```typescript
// PreviewWorkspace uses:
const planDocument = useMemo<PlanDocument | null>(() => plan ? plan as PlanDocument : null, [plan]);

// LivePreviewBox receives:
formData: { title, subtitle, companyName, legalForm, contactInfo }
```

Potential mismatch in data sources and update mechanisms.

## 4. Recommended Investigation Steps

### Phase 1: Constants Alignment Audit
1. Compare padding/margin values between components
2. Check border styles and colors
3. Verify font sizing consistency
4. Audit shared component usage

### Phase 2: Data Flow Analysis
1. Trace formData propagation from store to both previews
2. Identify where style configuration diverges
3. Map update triggers and re-render conditions
4. Check for memoization blocking updates

### Phase 3: Implementation Planning
1. Design shared style state management
2. Plan real-time synchronization mechanism
3. Define update propagation strategy
4. Create unified configuration interface

## 5. Key Files for Reference

### Core Components
- `features/editor/components/Navigation/CurrentSelection/MyProject/LivePreviewBox.tsx`
- `features/editor/components/Preview/PreviewWorkspace.tsx`
- `shared/components/editor/DocumentSettings.tsx`
- `shared/components/editor/DocumentStyles.tsx`

### Store & Types
- `features/editor/lib/store/editorStore.ts`
- `features/editor/lib/types/types.ts`
- `features/editor/lib/constants.ts`
- `features/editor/lib/renderers.ts`

## 6. Questions for Further Clarification

1. Should LivePreviewBox have its own style controls, or mirror PreviewWorkspace settings?
2. What level of real-time synchronization is required between previews?
3. Are there performance considerations for frequent style updates?
4. Should the floating preview be a lightweight version or full-featured replica?

## 7. Next Steps

### Immediate Actions
- [ ] Audit current style configuration usage in both components
- [ ] Map data flow differences between preview implementations
- [ ] Identify synchronization gaps in title page updates
- [ ] Document current user workflow expectations

### Short-term Goals
- [ ] Implement shared style state management
- [ ] Create unified configuration interface
- [ ] Establish real-time update propagation
- [ ] Test synchronization scenarios

---

**Prepared by:** Kevin  
**Date:** January 16, 2026  
**Status:** Ready for investigation - no code execution required