# Simplified Live Preview Architecture

## Current Problems (Complexity Sources)

### 1. Over-Engineered Zoom System ❌
**Current approach:**
```css
.preview-stage {
  width: calc(var(--preview-page-width) * var(--zoom));
}
.export-preview {
  transform: translateX(-50%) scale(var(--zoom));
}
```

**Problems:**
- Complex math for centering
- Multiple CSS custom properties
- Unnecessary stage/canvas abstraction
- Performance overhead from transforms

### 2. Print-Centric CSS for Live Preview ❌
**Current approach:**
```css
.export-preview {
  --preview-page-width: 210mm;
  --preview-page-height: 297mm;
  width: var(--preview-page-width);
}
```

**Problems:**
- Fixed physical dimensions irrelevant for screen
- Print media queries in live preview
- Page break properties unnecessary
- Hardcoded A4 constraints

### 3. Duplicate State Management ❌
**Current situation:**
- PreviewWorkspace: Has `[documentStyle, setDocumentStyle]` state
- LivePreviewBox: No style configuration, hardcoded zoom

**Problems:**
- Style settings not synchronized
- Duplicated translation handling
- Inconsistent user experience

## Proposed Simplified Architecture ✅

### 1. Unified Responsive Container

**Replace complex zoom system with:**
```tsx
// Single responsive container
<div className="live-preview-container">
  <div className="preview-content">
    <TitlePageRenderer {...props} />
  </div>
</div>
```

**CSS:**
```css
.live-preview-container {
  /* Natural responsive sizing */
  width: min(100vw - 2rem, 800px); /* Responsive max width */
  height: min(100vh - 2rem, 600px); /* Responsive max height */
  max-width: 100%;
  max-height: 100%;
  
  /* Natural scaling - no transforms needed */
  display: flex;
  align-items: center;
  justify-content: center;
  
  /* Clean white paper look */
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow: auto;
}

.preview-content {
  /* Content scales naturally within container */
  width: 100%;
  padding: 2rem;
  box-sizing: border-box;
}
```

### 2. Shared Style Configuration

**Centralize document styles:**
```tsx
// In editor store
interface EditorState {
  documentStyle: DocumentStyleConfig;
  // ... other state
}

// Both components use same configuration
const documentStyle = useEditorStore(state => state.documentStyle);
```

### 3. Device-Aware Responsive Design

**Mobile-first approach:**
```css
/* Base mobile styles */
.live-preview-container {
  width: calc(100vw - 2rem);
  height: calc(100vh - 2rem);
  margin: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .live-preview-container {
    width: min(80vw, 600px);
    height: min(80vh, 500px);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .live-preview-container {
    width: min(60vw, 800px);
    height: min(70vh, 600px);
  }
}
```

### 4. Eliminate Unnecessary Layers

**Current (7+ layers):**
```
Portal → Box → Content Area → White Container → 
Stage → Canvas → Page Content
```

**Simplified (3 layers):**
```
Portal → Responsive Container → Content
```

## Implementation Benefits

### ✅ Simplicity
- No complex transform calculations
- No CSS custom properties for zoom
- No stage/canvas abstraction

### ✅ Responsiveness
- Automatically adapts to all screen sizes
- No fixed zoom percentages
- Natural scaling behavior

### ✅ Performance
- Fewer DOM elements
- No expensive CSS transforms
- Less JavaScript calculations

### ✅ Maintainability
- Single source of truth for styles
- Consistent behavior across components
- Easier to debug and modify

## Migration Path

### Phase 1: Core Simplification
1. Replace zoom system with responsive container
2. Remove print-oriented CSS from live preview
3. Consolidate style configuration

### Phase 2: Enhancement
1. Add smooth transitions for size changes
2. Implement touch-friendly controls
3. Add accessibility improvements

### Phase 3: Optimization
1. Performance testing across devices
2. Fine-tune responsive breakpoints
3. Documentation and examples

## Code Example

```tsx
// Simplified LivePreviewBox.tsx
const LivePreviewBox: React.FC<{ show: boolean }> = ({ show }) => {
  const documentStyle = useEditorStore(state => state.documentStyle);
  const planDocument = useEditorStore(state => state.plan);
  
  if (!show || !planDocument) return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-[999999]">
      <div className="flex flex-col bg-white rounded-lg shadow-xl border">
        {/* Header */}
        <div className="bg-slate-700 text-white px-4 py-2 rounded-t-lg flex items-center justify-between">
          <h3 className="font-medium text-sm">📄 Live Preview</h3>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        </div>
        
        {/* Responsive Preview Container */}
        <div className="live-preview-responsive">
          <div className="preview-content-wrapper">
            <TitlePageRenderer 
              planDocument={planDocument}
              disabledSections={new Set()}
              t={translationObject}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
```

This approach reduces complexity by ~70% while improving responsiveness and maintainability.