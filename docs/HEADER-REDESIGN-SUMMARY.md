# Header Redesign Summary

**Date:** December 2024  
**Status:** 🎨 **DESIGN UPDATED**  
**Component:** `InlineSectionEditor.tsx` Header Section

---

## 🎯 Changes Requested

1. **Section Guidance** - Move inline next to section title (e.g., "Executive Summary [📋 Guidance ▼]")
2. **Question Navigation** - Center on second row, make slightly bigger

---

## 📐 Visual Comparison

### Current Header Structure
```
┌──────────────────────────────────────────────────────────┐
│ [≡] Executive Summary  Q1 Q2 Q3 Q4                [✕] │
├──────────────────────────────────────────────────────────┤
│ 📋 Section Guidance ▼                                   │
│    (expandable details section below header)             │
└──────────────────────────────────────────────────────────┘
```

### New Header Structure
```
┌──────────────────────────────────────────────────────────┐
│ [≡] Executive Summary [📋 Guidance ▼]              [✕] │ ← Row 1
│              Q1  Q2  Q3  Q4                              │ ← Row 2 (centered, larger)
└──────────────────────────────────────────────────────────┘
```

---

## 🔧 Implementation Changes

### Current Code (Lines 1197-1249)

```typescript
<div className="flex items-center justify-between mb-2 gap-2">
  <div className="flex items-center gap-3 flex-1 min-w-0">
    <h2 className="text-sm font-semibold text-white truncate">
      {section?.title || 'Section'}
    </h2>
    {/* Question Navigation - Currently inline with title */}
    {!isSpecialSection && section && section.questions.length > 1 && (
      <div className="flex items-center gap-1.5 overflow-x-auto border-l border-white/20 pl-3">
        {/* Navigation buttons - text-xs, px-2 py-0.5 */}
      </div>
    )}
  </div>
  <Button onClick={onClose}>✕</Button>
</div>
{/* Section Guidance - Currently below header */}
{section?.description && (
  <details className="mt-2 pt-2 border-t border-white/10">
    {/* Guidance content */}
  </details>
)}
```

### New Code (Updated)

```typescript
{/* Row 1: Title + Guidance + Close */}
<div className="flex items-center justify-between mb-2 gap-2">
  <div className="flex items-center gap-2 flex-1 min-w-0">
    <h2 className="text-sm font-semibold text-white truncate">
      {section?.title || 'Section'}
    </h2>
    {/* Section Guidance - Inline next to title */}
    {section?.description && (
      <details className="flex-shrink-0">
        <summary className="cursor-pointer text-xs text-white/70 hover:text-white/90 flex items-center gap-1.5 list-none">
          <span>📋</span>
          <span>Guidance</span>
          <span className="text-white/50 text-xs">▼</span>
        </summary>
        <div className="absolute z-50 mt-1 p-2 bg-slate-800 border border-white/20 rounded shadow-lg max-w-xs">
          <p className="text-xs text-white/70 leading-relaxed">
            {section.description}
          </p>
        </div>
      </details>
    )}
  </div>
  <Button onClick={onClose}>✕</Button>
</div>

{/* Row 2: Centered Question Navigation - Larger */}
{!isSpecialSection && section && section.questions.length > 1 && (
  <div className="flex items-center justify-center gap-2">
    {section.questions.map((q, index) => {
      const isActive = q.id === activeQuestionId;
      const status = q.status;
      return (
        <button
          key={q.id}
          onClick={() => onSelectQuestion(q.id)}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium transition-all ${
            isActive
              ? 'border-blue-500 bg-blue-500 text-white shadow-md'
              : 'border-white/20 bg-slate-700/50 text-white/80 hover:border-blue-400 hover:bg-slate-700'
          }`}
        >
          <span>{index + 1}</span>
          {status === 'complete' && <span className="text-xs">✅</span>}
          {status === 'unknown' && <span className="text-xs">❓</span>}
        </button>
      );
    })}
  </div>
)}
```

---

## 📝 Key Changes

### 1. Section Guidance
- **Before:** Separate expandable section below header
- **After:** Inline button next to title
- **Classes:** `text-xs`, `flex items-center gap-1.5`, `list-none` for summary
- **Popup:** Absolute positioned dropdown when expanded

### 2. Question Navigation
- **Before:** Inline with title, `text-xs`, `px-2 py-0.5`
- **After:** Centered on second row, `text-sm`, `px-3 py-1`
- **Layout:** `justify-center` instead of `border-l` separator
- **Size:** Larger buttons for better visibility

### 3. Header Structure
- **Before:** Single row with everything inline
- **After:** Two rows (title+guidance+close on top, navigation centered below)

---

## ✅ Benefits

1. **Saves Vertical Space** - Guidance inline, not separate section
2. **Better Visual Hierarchy** - Navigation gets its own prominent row
3. **More Prominent Navigation** - Centered and larger, easier to see
4. **Cleaner Design** - Less cluttered header
5. **Better UX** - Guidance easily accessible but not intrusive

---

## 🎯 Implementation Checklist

- [ ] Move section guidance inline next to title
- [ ] Remove guidance from separate section below header
- [ ] Move question navigation to centered second row
- [ ] Increase navigation button size (`text-sm`, `px-3 py-1`)
- [ ] Update header to two-row layout
- [ ] Test guidance dropdown positioning
- [ ] Test navigation centering
- [ ] Test responsive behavior
- [ ] Verify visual hierarchy

---

**Last Updated:** December 2024  
**Status:** 🎨 **READY FOR IMPLEMENTATION**

