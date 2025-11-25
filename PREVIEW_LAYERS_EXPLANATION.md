# Preview Background & Page Structure

## Layer Structure (Outer → Inner)

```
┌─────────────────────────────────────────────────────────┐
│ LAYER 1: PreviewWorkspace Container                     │
│ bg-slate-950/40 (dark blue, 40% opacity)                │
│ Location: PreviewWorkspace.tsx:334                       │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ LAYER 2: White Container (bg-white/95)                  │
│ Location: PreviewWorkspace.tsx:387                       │
│ This creates a white background around everything        │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ LAYER 3: Inner White Container (bg-white)               │
│ Location: PreviewWorkspace.tsx:389                       │
│ Padding: p-6 (1.5rem = 24px)                            │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│ LAYER 4: .export-preview (DARK BACKGROUND)              │
│ background: rgb(2 6 23) ← THIS IS THE DARK BLUE         │
│ padding: 1rem 0.5rem ← THIS CREATES SPACE              │
│ Location: globals.css:510-519                            │
│                                                          │
│   ┌──────────────────────────────────────────┐         │
│   │ .export-preview-page (WHITE PAGE)         │         │
│   │ background: white                        │         │
│   │ Location: globals.css:463-485            │         │
│   └──────────────────────────────────────────┘         │
│                                                          │
│   ┌──────────────────────────────────────────┐         │
│   │ .export-preview-page (WHITE PAGE)         │         │
│   │ background: white                        │         │
│   └──────────────────────────────────────────┘         │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## What is 1rem?

**rem** = "root em" - a CSS unit based on the root font size

- **Default browser font size**: 16px
- **1rem = 16px** (by default)
- **0.5rem = 8px**
- **2rem = 32px**

You can use pixels instead:
- `1rem` = `16px`
- `0.5rem` = `8px`
- `0.25rem` = `4px`

## Current Spacing Values

### In `.export-preview` (globals.css:513):
```css
padding: 1rem 0.5rem;
```
- **1rem** = 16px (top and bottom spacing)
- **0.5rem** = 8px (left and right spacing)

### To reduce spacing, change to:
```css
padding: 0.5rem 0.25rem;  /* 8px top/bottom, 4px left/right */
padding: 0.25rem 0.125rem; /* 4px top/bottom, 2px left/right */
padding: 0;                /* No spacing at all */
```

## What You See

- **WHITE PAGES**: `.export-preview-page` (globals.css:469) - `background: white`
- **DARK BACKGROUND**: `.export-preview` (globals.css:512) - `background: rgb(2 6 23)`
- **SPACING**: The `padding` in `.export-preview` creates space around pages

## The Problem

The dark background (`.export-preview`) is INSIDE white containers (PreviewWorkspace.tsx:387, 389), so you might see white showing through around the edges.


