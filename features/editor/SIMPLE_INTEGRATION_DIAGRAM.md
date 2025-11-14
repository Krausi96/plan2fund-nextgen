# Simple Context Memory Integration - Diagram

## How It Works (Simple Flow)

```
┌─────────────────────────────────────────────────────────┐
│  User clicks 💬 button                                   │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Editor.tsx                                              │
│  - Load conversation history (from planStore)           │
│  - Show modal with chat UI                              │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  User types: "What should I include?"                    │
│  Clicks Send                                             │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  Editor.tsx: handleAISend()                             │
│                                                          │
│  1. Build context (all in Editor.tsx):                  │
│     ├─ Load conversation history                        │
│     ├─ Get previous answers (this section)              │
│     ├─ Get other sections (titles + snippets)           │
│     ├─ Get user answers (from wizard)                  │
│     └─ Get program requirements                         │
│                                                          │
│  2. Call aiHelper.generateSectionContent()                │
│     └─ Pass: context + conversation history             │
│                                                          │
│  3. aiHelper.ts includes history in API call            │
│     └─ OpenAI gets: system prompt + history + new msg   │
│                                                          │
│  4. Save response to conversation history                │
│     └─ planStore.savePlanConversations()                │
│                                                          │
│  5. Update chat UI                                        │
│     └─ Show new message                                  │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│  AI Response (with full context)                         │
│  - Uses conversation history (remembers previous Q&A)  │
│  - Uses previous answers (maintains consistency)        │
│  - Uses other sections (cross-section awareness)        │
│  - Uses program requirements (program-specific)        │
│  - Uses user answers (real data, no hallucinations)    │
└─────────────────────────────────────────────────────────┘
```

## Files to Modify (4 files, 0 new files)

### 1. `shared/types/plan.ts`
**Add:**
```typescript
export type ConversationMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};
```

### 2. `shared/user/storage/planStore.ts`
**Add:**
```typescript
export function savePlanConversations(sectionId: string, messages: ConversationMessage[]): void
export function loadPlanConversations(): Record<string, ConversationMessage[]>
```

### 3. `features/editor/engine/aiHelper.ts`
**Modify existing `generateSectionContent()`:**
- Add optional `conversationHistory` parameter
- Include history in API call
- Build prompt with history

### 4. `features/editor/components/Editor.tsx`
**Add:**
- State: `aiMessages`, `aiInput`
- Function: `buildAIContext()` - builds context (all in Editor.tsx)
- Function: `handleAISend()` - sends message, saves history
- UI: Replace placeholder modal with chat interface

## Context Building (All in Editor.tsx)

```typescript
// In Editor.tsx - no new file needed
const buildAIContext = () => {
  // 1. Previous answers (this section)
  const previousAnswers = Object.values(currentSection.fields?.answers || {})
    .filter(Boolean)
    .join('\n\n');
  
  // 2. Other sections (cross-section memory)
  const otherSections = sections
    .filter(s => s.key !== currentSection.key && s.content)
    .map(s => `${s.title}: ${s.content.substring(0, 200)}...`)
    .join('\n\n');
  
  // 3. User answers (from wizard)
  const userAnswers = loadUserAnswers();
  
  // 4. Program requirements
  const requirements = sectionTemplate?.validationRules?.requiredFields || [];
  
  return `
Current Section: ${currentSection.title}

${previousAnswers ? `Previous Answers:\n${previousAnswers}\n\n` : ''}
${otherSections ? `Other Sections:\n${otherSections}\n\n` : ''}
User Information: ${JSON.stringify(userAnswers)}
Program Requirements: ${requirements.join(', ')}
Program: ${programId}
`;
};
```

## Chat UI (All in Editor.tsx)

```typescript
// In Editor.tsx - replace placeholder modal
{showAIModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg w-full max-w-3xl h-[80vh] mx-4 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b flex justify-between">
        <h2>AI Assistant - {currentSection?.title}</h2>
        <button onClick={() => setShowAIModal(false)}>✕</button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {aiMessages.map(msg => (
          <div key={msg.id} className={msg.role === 'user' ? 'text-right' : 'text-left'}>
            <div className={`inline-block p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>
      
      {/* Input */}
      <div className="px-6 py-4 border-t flex gap-2">
        <input
          value={aiInput}
          onChange={(e) => setAiInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAISend()}
          placeholder="Ask a question..."
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <button onClick={handleAISend} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Send
        </button>
      </div>
    </div>
  </div>
)}
```

## Data Flow Diagram

```
┌──────────────┐
│  Editor.tsx   │
│              │
│  State:      │
│  - aiMessages│
│  - aiInput   │
│              │
│  Functions:  │
│  - buildAI-  │
│    Context()  │ ← Builds context (no new file)
│  - handleAI- │
│    Send()    │ ← Sends message
└──────┬───────┘
       │
       ├─→ planStore.loadPlanConversations()
       │   └─→ localStorage
       │
       ├─→ buildAIContext()
       │   ├─→ Get previous answers
       │   ├─→ Get other sections
       │   ├─→ Get user answers
       │   └─→ Get program requirements
       │
       ├─→ aiHelper.generateSectionContent(context, history)
       │   └─→ /api/ai/openai (with conversation history)
       │
       └─→ planStore.savePlanConversations()
           └─→ localStorage
```

## Simple Architecture

```
Editor.tsx (All logic here - no new files!)
├── State
│   ├── aiMessages: ConversationMessage[]
│   └── aiInput: string
│
├── Functions (all in Editor.tsx)
│   ├── buildAIContext() - Builds context
│   └── handleAISend() - Sends message
│
├── UI (all in Editor.tsx)
│   └── Modal with chat interface
│
└── Uses
    ├── planStore.ts - Save/load conversations
    ├── aiHelper.ts - Generate with history
    └── plan.ts - ConversationMessage type
```

## What Gets Passed to AI

```
System Prompt:
"You are an AI assistant for [Program Name]..."

Conversation History:
- User: "What should I include?"
- Assistant: "You should include..."
- User: "What about market size?"
- Assistant: "Market size should..."

Current Question:
"What about competitors?"

Context:
- Previous answers: [Q1 answer, Q2 answer]
- Other sections: [Executive Summary: ..., Business Model: ...]
- User info: { companyName: "...", fundingAmount: "..." }
- Program: { id: "...", requirements: [...] }
```

## Summary

**4 Files Modified:**
1. `plan.ts` - Add ConversationMessage type
2. `planStore.ts` - Add save/load functions
3. `aiHelper.ts` - Enhance existing method with history
4. `Editor.tsx` - Add chat UI + context building

**0 New Files!**

**All logic in Editor.tsx:**
- Context building (no separate file)
- Chat UI (no separate component)
- Simple and clean!

