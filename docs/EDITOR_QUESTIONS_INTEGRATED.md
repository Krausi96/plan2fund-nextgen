# Editor: Integrated Questions Design (Simplified)

**Date:** 2025-01-XX  
**Status:** Final Simplified Design  
**Approach:** Questions on Top, Answer Below, Toggleable

---

## The Simple Solution

### Core Concept
- **Questions integrated** - shown at top of editor area (inside unified box)
- **Answer below** - user writes answer in editor area below questions
- **Toggle on/off** - user can show/hide questions
- **Natural Q&A flow** - questions guide, answer area for writing

---

## Visual Design

```
┌─────────────────────────────────────────────────────────┐
│ UNIFIED EDITOR BOX                                       │
│                                                          │
│ ┌─ Section Navigation ─────────────────────────────────┐ │
│ │ [← Prev]  Market Opportunity  [Next →]              │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ Questions Card (Toggleable) ──────────────────────┐ │
│ │ 💡 Questions                    [Toggle: ● ON]      │ │
│ │                                                     │ │
│ │ • Who is the target market?                        │ │
│ │ • How large is the market?                          │ │
│ │ • What trends support your opportunity?            │ │
│ │ • What unmet needs exist?                           │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ Answer Area (Editor) ──────────────────────────────┐ │
│ │                                                     │ │
│ │  [Clean, spacious text area]                       │ │
│ │  Write your answer here...                         │ │
│ │                                                     │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ Action Bar ───────────────────────────────────────┐ │
│ │ [✨ Generate] [💾 Save] [⏭️ Next]                  │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌─ Quick Actions (Right Side) ───────────────────────┐ │
│ │ [✨ Generate with AI]                              │ │
│ │ [📊 Add Table]                                     │ │
│ │ [📈 Add Chart]                                     │ │
│ │ [📷 Add Image]                                     │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Questions Card (Top of Editor)

**Visual:**
- Blue background: `bg-blue-50 border border-blue-200 rounded-lg p-4`
- Positioned at top of editor area
- Margin bottom: `mb-4` (spacing before editor)

**Content:**
- Header: "💡 Questions" with toggle switch
- All prompts shown as bullet list
- Clean, readable format

**Toggle:**
- Switch in top right corner
- ON: Questions visible
- OFF: Questions hidden, editor expands

### 2. Answer Area (Editor Below Questions)

**Visual:**
- Clean, spacious text area
- Canva/ChatGPT style
- Subtle border/shadow
- Full width below questions

**Behavior:**
- Free text editing
- Auto-saves on change
- Questions above guide what to write

### 3. Toggle Functionality

**When ON:**
- Questions card visible at top
- Editor area below questions
- Natural Q&A flow

**When OFF:**
- Questions card hidden
- Editor area expands to full height
- Full focus on writing

---

## User Flow

### Scenario 1: User Wants Guidance
1. Questions card visible (toggle ON)
2. Sees all questions at top:
   - "Who is the target market?"
   - "How large is the market?"
   - etc.
3. Writes answer in editor below
4. Questions guide what to write

### Scenario 2: User Wants Full Focus
1. User toggles questions OFF
2. Questions card disappears
3. Editor expands to full height
4. User writes freely without questions

### Scenario 3: User Toggles Back
1. User toggles questions ON again
2. Questions card reappears at top
3. Editor area adjusts below questions
4. Natural Q&A flow restored

---

## Benefits

### ✅ Simpler
- All in one unified box
- Questions on top, answer below
- No sidebar, no navigation complexity

### ✅ Natural Flow
- Q&A format - questions guide, answer below
- Like a form but free text
- Intuitive layout

### ✅ Beautiful Integration
- Questions integrated in main editor area
- Not separate sidebar
- Cohesive design

### ✅ Flexible
- Toggle to show/hide questions
- Can work with or without questions
- User controls visibility

---

## Implementation Details

### State Management
```typescript
const [showQuestions, setShowQuestions] = useState(true); // Toggle state
const prompts = sectionTemplate?.prompts || []; // Questions array
```

### Toggle Function
```typescript
const toggleQuestions = () => {
  setShowQuestions(!showQuestions);
};
```

### Render Logic
```typescript
<div className="unified-editor-box">
  {/* Section Navigation */}
  <SectionNavigation />
  
  {/* Questions Card (Toggleable) */}
  {showQuestions && prompts.length > 0 && (
    <QuestionsCard
      prompts={prompts}
      onToggle={toggleQuestions}
      isVisible={showQuestions}
    />
  )}
  
  {/* Answer Area (Editor) */}
  <EditorArea
    content={currentSection.content}
    onChange={handleContentChange}
  />
  
  {/* Action Bar */}
  <ActionBar />
  
  {/* Quick Actions */}
  <QuickActions />
</div>
```

### Questions Card Component
```typescript
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-semibold">💡 Questions</h3>
    <ToggleSwitch
      checked={showQuestions}
      onChange={toggleQuestions}
    />
  </div>
  <ul className="space-y-2">
    {prompts.map((prompt, index) => (
      <li key={index} className="text-sm text-gray-700">
        • {prompt}
      </li>
    ))}
  </ul>
</div>
```

---

## Edge Cases

### No Questions
- If section has no prompts, don't show questions card
- Editor area starts immediately after navigation
- No toggle shown

### Single Question
- Still show as bullet list
- Same format, just one item

### Empty Prompts Array
- Don't render questions card
- Editor area full height

---

## Visual States

### Questions ON
- Questions card visible at top
- Blue background, clear visibility
- Editor area below questions
- Natural Q&A flow

### Questions OFF
- Questions card hidden
- Editor area expands to full height
- Full focus on writing
- Toggle still accessible (maybe in action bar?)

---

## Summary

**Simple, integrated, natural:**
- ✅ Questions on top, answer below
- ✅ All in one unified box
- ✅ Toggle to show/hide
- ✅ Natural Q&A flow
- ✅ Beautiful integration

**No complexity:**
- ❌ No sidebar navigation
- ❌ No question-by-question navigation
- ❌ No insertion buttons
- ❌ Just toggle + integrated questions

---

**End of Integrated Questions Design**

