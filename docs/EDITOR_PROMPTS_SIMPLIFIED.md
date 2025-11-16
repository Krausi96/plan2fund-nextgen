# Editor Prompts - Simplified Design

**Date:** 2025-01-XX  
**Status:** Final Simplified Design  
**Approach:** Toggleable, One Prompt at a Time with Navigation

---

## The Simple Solution

### Core Concept
- **One prompt at a time** - focus on one question, less overwhelming
- **Toggle on/off** - user controls visibility
- **Question navigation** - Prev/Next to move through prompts
- **Free text editor** - prompts guide but don't interfere

---

## Visual Design

```
┌─────────────────────────────────────────────────────────┐
│ UNIFIED EDITOR BOX                                       │
│                                                          │
│ ┌──────────────────────┐  ┌──────────────────────────┐  │
│ │ LEFT: Free Text      │  │ RIGHT: Prompt Card        │  │
│ │ Editor               │  │                           │  │
│ │                      │  │ ┌─────────────────────┐  │  │
│ │ [User writes here]  │  │ │ 💡 Writing Prompt    │  │  │
│ │                      │  │ │ [Toggle: ● ON]      │  │  │
│ │                      │  │ │                     │  │  │
│ │                      │  │ │ Who is the target  │  │  │
│ │                      │  │ │ market?            │  │  │
│ │                      │  │ │                     │  │  │
│ │                      │  │ │ [← Prev] [1/4]      │  │  │
│ │                      │  │ │ [Next →]            │  │  │
│ │                      │  │ └─────────────────────┘  │  │
│ │                      │  │                           │  │
│ │                      │  │ [Quick Actions below]    │  │
│ └──────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Toggle Switch
- **Location:** Top right of prompt card
- **Function:** Show/hide prompts entirely
- **States:** ON (shows prompt) / OFF (hides prompt card)
- **Default:** ON (if section has prompts)

### 2. Current Prompt Display
- **Size:** Large, readable text
- **Content:** One question at a time
- **Style:** `text-base font-medium text-gray-900`
- **Background:** `bg-blue-50` for visibility

### 3. Navigation Controls
- **Prev Button:** [← Prev] - goes to previous prompt
  - Disabled on first prompt
- **Counter:** [1/4] - shows current position
  - Format: "current / total"
- **Next Button:** [Next →] - goes to next prompt
  - Disabled on last prompt

### 4. When Toggled Off
- Prompt card collapses/hides
- Only Quick Actions visible in right sidebar
- User has full focus on editor

---

## User Flow

### Scenario 1: User Wants Guidance
1. Prompt card visible (toggle ON)
2. Sees first prompt: "Who is the target market?"
3. Writes in editor addressing the question
4. Clicks [Next →] to see next prompt
5. Continues writing, navigating through prompts

### Scenario 2: User Wants Full Focus
1. User toggles prompts OFF
2. Prompt card disappears
3. Only editor and Quick Actions visible
4. User writes freely without prompts

### Scenario 3: User Navigates Prompts
1. Starts at prompt 1/4
2. Clicks [Next →] → sees prompt 2/4
3. Clicks [Next →] → sees prompt 3/4
4. Clicks [← Prev] → goes back to prompt 2/4
5. Can navigate freely through all prompts

---

## Benefits

### ✅ Simpler
- One prompt at a time - less overwhelming
- Clear navigation - easy to understand
- Toggle control - user decides

### ✅ Focused
- Focus on one question
- Less visual clutter
- Can hide if needed

### ✅ Flexible
- Navigate through prompts in any order
- Can skip prompts by navigating
- Can hide prompts entirely

### ✅ Clear
- No confusion about modes
- Simple toggle on/off
- Clear navigation controls

---

## Implementation Details

### State Management
```typescript
const [showPrompts, setShowPrompts] = useState(true); // Toggle state
const [currentPromptIndex, setCurrentPromptIndex] = useState(0); // Navigation
const prompts = sectionTemplate?.prompts || []; // Prompt array
```

### Toggle Function
```typescript
const togglePrompts = () => {
  setShowPrompts(!showPrompts);
};
```

### Navigation Functions
```typescript
const goToNextPrompt = () => {
  if (currentPromptIndex < prompts.length - 1) {
    setCurrentPromptIndex(currentPromptIndex + 1);
  }
};

const goToPrevPrompt = () => {
  if (currentPromptIndex > 0) {
    setCurrentPromptIndex(currentPromptIndex - 1);
  }
};
```

### Render Logic
```typescript
{showPrompts && prompts.length > 0 && (
  <PromptCard
    prompt={prompts[currentPromptIndex]}
    currentIndex={currentPromptIndex}
    totalPrompts={prompts.length}
    onNext={goToNextPrompt}
    onPrev={goToPrevPrompt}
    onToggle={togglePrompts}
  />
)}
```

---

## Edge Cases

### No Prompts
- If section has no prompts, don't show prompt card
- Show only Quick Actions in right sidebar

### Single Prompt
- Still show navigation (1/1)
- Prev/Next buttons disabled

### Empty Prompts Array
- Don't render prompt card
- Show only Quick Actions

---

## Visual States

### Prompt Card (ON)
- Visible with blue background
- Current prompt displayed
- Navigation controls active

### Prompt Card (OFF)
- Hidden/collapsed
- Only Quick Actions visible

### Navigation States
- **First Prompt:** Prev button disabled
- **Last Prompt:** Next button disabled
- **Middle Prompts:** Both buttons enabled

---

## Summary

**Simple, focused, flexible:**
- ✅ One prompt at a time
- ✅ Toggle on/off
- ✅ Question navigation
- ✅ Free text editor
- ✅ User controls everything

**No confusion:**
- ❌ No modes to switch
- ❌ No insertion buttons
- ❌ No complex interactions
- ❌ Just simple toggle + navigation

---

**End of Simplified Design**

