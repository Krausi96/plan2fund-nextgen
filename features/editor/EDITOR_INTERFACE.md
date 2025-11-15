# Editor Interface - Current State

## Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: Business Plan                    [⚙️ Settings] [👁️ Preview] │
├─────────────────────────────────────────────────────────────────┤
│ Section Navigation (Horizontal Tabs)                           │
│ [✓ 01 Executive Summary] [⚠ 02 Market] [○ 03 Financial] ...    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Editor Content Area                                             │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Section: Executive Summary                                 │  │
│ │                                                             │  │
│ │ 💡 What's your story in a nutshell?                        │  │
│ │ [Text Editor - Google Docs Style]                          │  │
│ │                                                             │  │
│ │ 💡 What problem are you solving and for whom?              │  │
│ │ [Text Editor]                                               │  │
│ │                                                             │  │
│ │ 💡 How much funding do you need and what for?              │  │
│ │ [Text Editor]                                               │  │
│ │                                                             │  │
│ │ [✨ Generate Answer] [← Previous Question] [Next Question →] │  │
│ │                                                             │  │
│ │ [Tables/Charts if section needs them]                       │  │
│ │                                                             │  │
│ │ Progress: 152/150-300 words • 60%                          │  │
│ │ [← Previous] [Next →]                                      │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
│                                                                 │
│ Floating Action Buttons (Bottom Right)                          │
│   [💬 AI] [✓ Requirements] [⚙️ Settings]                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Requirements Modal (When Opened)

```
┌─────────────────────────────────────────────────────────────────┐
│ Requirements Checker                                    [✕ Close] │
├─────────────────────────────────────────────────────────────────┤
│ Overall Plan Progress: 45%                                      │
│ [████████░░░░░░░░░░░░] 3 of 10 sections completed              │
├─────────────────────────────────────────────────────────────────┤
│ All Sections                                                     │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ 01 Executive Summary                    [⚠ In Progress]    │  │
│ │ Progress: 60% • 2 issue(s)                                  │  │
│ │ Missing:                                                    │  │
│ │   • Content too short (120/150 words)                       │  │
│ │   • Missing: impact mentioned                               │  │
│ │                                                             │  │
│ │ 🎯 Program-Specific Requirements (Horizon Europe):          │  │
│ │   • Emphasize EU-based company status                       │  │
│ │   • Highlight innovation aspects                            │  │
│ │                                                             │  │
│ │ [Go to Section] [Generate]                                 │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ [Similar cards for other sections...]                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Structure

### Editor.tsx (Main Component)
- Manages state: sections, templates, activeSection, programData
- Loads sections from master templates
- Loads program data from API
- Handles section navigation
- Handles content changes
- Handles AI generation

### SimpleTextEditor.tsx
- Google Docs-style text editor
- Rich text editing
- Auto-saves on change

### RequirementsModal.tsx
- Validates sections
- Shows missing requirements
- Shows program-specific requirements
- Allows navigation to sections
- Allows AI generation for missing content

### SectionContentRenderer.tsx
- Renders tables (financial, risk, competitors, etc.)
- Renders charts
- Renders structured fields (TAM/SAM/SOM, etc.)

### ProgramSelector.tsx
- Shows when no programId
- Allows program selection

## Data Flow

```
User Action → Editor.tsx → State Update → Auto-save → localStorage
                ↓
         RequirementsModal (validates)
                ↓
         AI Helper (generates)
                ↓
         SectionContentRenderer (displays tables/charts)
```

