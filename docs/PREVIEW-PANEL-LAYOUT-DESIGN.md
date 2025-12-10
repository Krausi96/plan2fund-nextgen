# Preview & Panel Layout Design Solution

**Date:** December 2024  
**Status:** 📐 **DESIGN PROPOSAL**  
**Goal:** Create a balanced, responsive layout that works across all screen sizes

---

## 🎯 Design Principles

1. **Visual Balance** - Preview and panel should feel balanced, not competing
2. **Readability** - Preview pages must be clearly visible and readable
3. **Accessibility** - Panel must be easily accessible without covering content
4. **Responsive** - Must work on screens from 1200px to 2560px+
5. **A4 Proportions** - Consider A4 page dimensions (210mm × 297mm ≈ 793px × 1123px)

---

## 📐 Current State Analysis

**Current Layout:**
- Sidebar: 320px (left)
- Preview: Remaining space (center)
- Panel: 380px (right, floating)
- **Issue:** Pages left-aligned, panel right-aligned - feels unbalanced

**A4 Page Dimensions:**
- Width: ~793px (at 100% zoom)
- Height: ~1123px (at 100% zoom)
- Aspect ratio: ~0.71 (portrait)

---

## 🎨 Recommended Solution: Adaptive Layout

### Strategy: **Responsive Side-by-Side with Smart Spacing**

#### **Wide Screens (> 1600px) - Optimal Layout**
```
┌─────────┬──────────────────────────────┬──────────┐
│ Sidebar │ Preview (centered)            │ Panel    │
│ 320px   │                               │ 400px    │
│         │      [A4 Page]                │          │
│         │      [A4 Page]                │          │
│         │                               │          │
└─────────┴──────────────────────────────┴──────────┘
```
- **Preview:** Centered in available space (feels balanced)
- **Panel:** Fixed right edge, 400px wide
- **Spacing:** Equal margins on both sides of preview

#### **Medium Screens (1200-1600px) - Current Target**
```
┌─────────┬──────────────────────┬────────┐
│ Sidebar │ Preview (left-aligned)│ Panel │
│ 320px   │ [A4 Page]            │ 380px  │
│         │ [A4 Page]            │        │
│         │                      │        │
└─────────┴──────────────────────┴────────┘
```
- **Preview:** Left-aligned with padding (40px left, 20px right)
- **Panel:** Right edge, 380px wide
- **Spacing:** More space on right for panel, less on left

#### **Small Screens (1000-1200px) - Compact**
```
┌─────────┬──────────────────┬──────┐
│ Sidebar │ Preview           │Panel │
│ 280px   │ [A4 Page]         │350px │
│         │ [A4 Page]         │      │
└─────────┴──────────────────┴──────┘
```
- **Sidebar:** Reduced to 280px
- **Preview:** Left-aligned, minimal padding
- **Panel:** 350px wide, right edge

#### **Very Wide Screens (> 2000px) - Maximum Comfort**
```
┌─────────┬──────────────────────────────────────┬──────────┐
│ Sidebar │ Preview (centered, max-width)         │ Panel    │
│ 320px   │                                       │ 420px    │
│         │         [A4 Page]                     │          │
│         │         [A4 Page]                     │          │
│         │                                       │          │
└─────────┴──────────────────────────────────────┴──────────┘
```
- **Preview:** Centered with max-width constraint (prevents pages from being too far apart)
- **Panel:** 420px wide (more comfortable)

---

## 🔧 Implementation Strategy

### 1. **Preview Positioning Logic**

**For screens > 1600px:**
- Center pages in available space
- Equal margins on both sides
- Max-width: 900px (to keep pages together)

**For screens 1200-1600px:**
- Left-align pages
- Left padding: 40px
- Right padding: 20px (space for panel)

**For screens < 1200px:**
- Left-align pages
- Minimal padding: 20px left, 10px right

### 2. **Panel Positioning**

**Always:**
- Right edge of viewport (not relative to preview)
- Fixed width based on screen size
- Vertical: Center-bottom or align with active section

**Widths:**
- > 2000px: 420px
- 1600-2000px: 400px
- 1200-1600px: 380px
- 1000-1200px: 350px
- < 1000px: Responsive (max 90vw)

### 3. **Spacing Calculation**

```typescript
const calculatePreviewPadding = (screenWidth: number) => {
  if (screenWidth > 1600) {
    // Center with equal margins
    return { left: 'auto', right: 'auto', maxWidth: '900px' };
  } else if (screenWidth > 1200) {
    // Left-align with spacing
    return { left: '40px', right: '20px' };
  } else {
    // Compact
    return { left: '20px', right: '10px' };
  }
};
```

---

## 📊 Visual Balance Analysis

### **Option A: Left-Aligned Preview (Current)**
```
[Sidebar] [Page]                    [Panel]
```
- ✅ More space for preview
- ✅ Clear separation
- ❌ Feels left-heavy
- ❌ Wasted space on right

### **Option B: Centered Preview (Recommended for Wide)**
```
[Sidebar]      [Page]      [Panel]
```
- ✅ Balanced, professional
- ✅ Natural reading flow
- ✅ Works well on wide screens
- ❌ Less space on narrow screens

### **Option C: Adaptive (Best Solution)**
```
Wide:   [Sidebar]      [Page]      [Panel]
Medium: [Sidebar] [Page]            [Panel]
Narrow: [Sidebar] [Page]     [Panel]
```
- ✅ Adapts to screen size
- ✅ Optimal for each breakpoint
- ✅ Best user experience
- ✅ Professional appearance

---

## 🎯 Recommended Implementation

### **Primary Approach: Adaptive Centering**

1. **Calculate available space:**
   ```
   Available width = Viewport width - Sidebar width - Panel width - Gaps
   ```

2. **For wide screens (> 1600px):**
   - Center preview in available space
   - Max-width: 900px (keeps pages together)
   - Equal margins

3. **For medium screens (1200-1600px):**
   - Left-align preview
   - Left padding: 40px
   - Right padding: 20px

4. **For narrow screens (< 1200px):**
   - Left-align preview
   - Minimal padding: 20px left

### **Panel Always:**
- Right edge of viewport
- Responsive width (350-420px)
- Vertical: Smart positioning (align with section or center-bottom)

---

## ✅ Benefits of This Approach

1. **Visual Balance** - Centered on wide screens feels professional
2. **Space Efficiency** - Left-aligned on medium screens maximizes space
3. **Responsive** - Adapts to all screen sizes
4. **A4 Optimized** - Considers page proportions
5. **User Experience** - Natural reading flow, clear separation

---

## 📝 Implementation Checklist

- [ ] Add responsive preview padding calculation
- [ ] Implement centered layout for wide screens (> 1600px)
- [ ] Keep left-aligned for medium screens (1200-1600px)
- [ ] Update panel positioning to always use right edge
- [ ] Test on various screen sizes (1200px, 1600px, 1920px, 2560px)
- [ ] Verify A4 pages are readable at all sizes
- [ ] Ensure panel doesn't overlap preview

---

**Recommendation:** Implement **Adaptive Centering** - centered on wide screens, left-aligned on medium/narrow screens. This provides the best balance of visual appeal and space efficiency.




