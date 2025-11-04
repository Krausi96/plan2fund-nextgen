# Business Plan Editor - Restructured Layout Diagram

## Current Issues
- Too many components visible at once
- Document customization hidden/collapsible in sidebar
- Sections navigation takes up valuable space
- AI Assistant is fixed but not well integrated
- Top bar is cluttered with many controls

## New Structure

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TOP BAR (Simplified)                                                   │
│  [Logo] Business Plan Editor  [Progress] [Save] [Preview] [⚙️ Settings] │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────┬──────────────────────────────────────────────────────────────┐
│          │                                                               │
│          │  SECTION CONTENT EDITOR                                        │
│          │  ┌─────────────────────────────────────────────────────┐     │
│          │  │ Section Header + Navigation                         │     │
│          │  │ [← Previous] [Jump to Section] [Next →]            │     │
│          │  └─────────────────────────────────────────────────────┘     │
│  SECTIONS│                                                               │
│  NAV      │  Rich Text Editor Area                                       │
│  (Collapsible)                                                           │
│          │  [Full editor with formatting toolbar]                       │
│          │                                                               │
│  [Hide]  │  ┌─────────────────────────────────────────────────────┐     │
│          │  │ Requirements Progress | Word Count                  │     │
│          │  └─────────────────────────────────────────────────────┘     │
│          │                                                               │
│          │  [Guidance Box]                                               │
│          │  [What to include]                                           │
│          │                                                               │
└──────────┴──────────────────────────────────────────────────────────────┘
     │
     │  Can collapse to icon-only mode
     │
     │  When expanded: Shows all sections with status indicators
     │
     │  When collapsed: Shows only icon + section number indicator

┌─────────────────────────────────────────────────────────────────────────┐
│  FLOATING PANELS (Accessible via top bar buttons)                       │
│                                                                          │
│  ┌─────────────────────────────┐  ┌─────────────────────────────┐      │
│  │ DOCUMENT CUSTOMIZATION      │  │ AI ASSISTANT                │      │
│  │ (Drawer/Slide-out Panel)    │  │ (Can be minimized to icon)  │      │
│  │                             │  │                             │      │
│  │ • Tone & Language           │  │ • Suggestions               │      │
│  │ • Formatting                │  │ • Chat Interface            │      │
│  │ • Advanced Settings         │  │ • Content Generation        │      │
│  │ • Export Options            │  │                             │      │
│  │                             │  │                             │      │
│  │ [Close] [Apply]             │  │ [Minimize]                  │      │
│  └─────────────────────────────┘  └─────────────────────────────┘      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

## Navigation Improvements

### 1. Collapsible Sidebar
- **Expanded**: Full section list with preview text
- **Collapsed**: Icon-only with section numbers
- **Icon Mode**: Vertical strip showing section numbers with status dots
- Toggle button always visible

### 2. Document Customization
- **Access**: Dedicated button in top bar (⚙️ Settings)
- **Display**: Slide-out drawer from right side
- **Always accessible**: Not hidden in collapsible sidebar
- **Quick access**: Keyboard shortcut (Ctrl+,)

### 3. AI Assistant
- **Default**: Minimized icon in bottom-right
- **Expanded**: Slide-out panel from right
- **Can dock**: Option to dock alongside editor
- **Quick toggle**: Click icon to expand/collapse

### 4. Top Bar Optimization
- **Left**: Logo, title, progress indicator
- **Center**: Quick actions (if space allows)
- **Right**: Save, Preview, Settings, Focus Mode
- **Reduced clutter**: Move less-used controls to menus

## Key Features

### Collapsible Sections Panel
```
Expanded View:
┌─────────────────┐
│ Sections   [⏷] │
├─────────────────┤
│ 01 Executive ✓  │
│ 02 Project   ⚠  │
│ 03 Innovation • │
│ ...             │
└─────────────────┘

Collapsed View:
┌───┐
│01 │ ✓
│02 │ ⚠
│03 │ •
│...│
│[⏵]│
└───┘
```

### Document Customization Drawer
- Opens from right side
- Overlays content (doesn't push editor)
- Can be resized
- Remembers last tab
- Quick apply button

### AI Assistant Panel
- Minimized: Floating button
- Expanded: Slide-out panel
- Can be moved/docked
- Context-aware suggestions

## Responsive Behavior

### Desktop (>1024px)
- Sidebar: Collapsible, defaults to expanded
- Editor: Full width when sidebar collapsed
- Customization: Drawer overlay
- AI: Floating panel

### Tablet (768-1024px)
- Sidebar: Defaults to collapsed
- Editor: Full width
- Customization: Modal overlay
- AI: Floating button, expands to modal

### Mobile (<768px)
- Sidebar: Hidden by default, accessible via hamburger menu
- Editor: Full width
- Customization: Full-screen modal
- AI: Full-screen modal when opened
