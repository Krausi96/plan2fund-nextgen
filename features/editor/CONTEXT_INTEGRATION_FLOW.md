# Context Memory Integration - Simple Flow Diagram

## How It Works (Using Existing Files Only)

```
┌─────────────────────────────────────────────────────────────┐
│  User clicks 💬 button                                       │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  Editor.tsx                                                  │
│  - setShowAIModal(true)                                      │
│  - Load conversation history:                                │
│    planStore.loadPlanConversations()[sectionId]              │
│  - Show modal with chat UI (all in Editor.tsx)              │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  User types: "What should I include?"                        │
│  Clicks Send                                                 │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  Editor.tsx: handleAISend()                                 │
│                                                              │
│  1. Save user message to state                              │
│     aiMessages.push({ role: 'user', content: input })      │
│                                                              │
│  2. Build context (all in Editor.tsx, no new file):        │
│     const context = buildAIContext()                        │
│     ├─ Previous answers (this section)                      │
│     ├─ Other sections (cross-section memory)                │
│     ├─ User answers (from wizard)                          │
│     └─ Program requirements                                 │
│                                                              │
│  3. Call aiHelper.generateSectionContent()                    │
│     aiHelper.generateSectionContent(                         │
│       section,                                               │
│       context,                                               │
│       program,                                               │
│       aiMessages  ← Pass conversation history                │
│     )                                                        │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  aiHelper.ts: generateSectionContent()                      │
│                                                              │
│  - Receives: section, context, program, conversationHistory │
│  - Builds prompt with context                               │
│  - Calls: callAIWithContext(prompt, context, history)      │
│  - Sends to: /api/ai/openai                                 │
│    {                                                         │
│      message: prompt,                                        │
│      context: {...},                                         │
│      conversationHistory: [...],  ← Include history         │
│      action: 'generate'                                      │
│    }                                                         │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  /api/ai/openai.ts: generateAIResponse()                    │
│                                                              │
│  - Receives: message, context, conversationHistory          │
│  - Builds messages array:                                   │
│    [                                                        │
│      { role: 'system', content: systemPrompt },             │
│      ...conversationHistory,  ← Include history             │
│      { role: 'user', content: userPrompt }                  │
│    ]                                                        │
│  - Calls OpenAI API with full conversation                 │
│  - Returns: { content: "..." }                              │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│  Editor.tsx: Receives response                              │
│                                                              │
│  1. Save assistant message to state                        │
│     aiMessages.push({ role: 'assistant', content: ... })    │
│                                                              │
│  2. Save to storage                                         │
│     planStore.savePlanConversations(sectionId, aiMessages)  │
│                                                              │
│  3. Update UI                                               │
│     - Show new message in chat                              │
│     - Clear input                                           │
└─────────────────────────────────────────────────────────────┘
```

## Files to Modify (4 files, 0 new files)

### 1. `shared/types/plan.ts`
**Add type:**
```typescript
export type ConversationMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};
```

### 2. `shared/user/storage/planStore.ts`
**Add functions:**
```typescript
export function savePlanConversations(
  sectionId: string,
  messages: ConversationMessage[]
): void {
  try {
    const key = getStorageKey('plan_conversations');
    const existing = loadPlanConversations();
    const updated = { ...existing, [sectionId]: messages };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {}
}

export function loadPlanConversations(): Record<string, ConversationMessage[]> {
  try {
    const key = getStorageKey('plan_conversations');
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
```

### 3. `features/editor/engine/aiHelper.ts`
**Modify `generateSectionContent()`:**
```typescript
async generateSectionContent(
  section: string,
  context: string,
  program: Program,
  conversationHistory?: ConversationMessage[]  // ADD THIS
): Promise<AIResponse> {
  // ... existing code ...
  
  const response = await this.callAIWithContext(prompt, {
    sectionId: section,
    sectionTitle: section,
    currentContent: context,
    programType: program.type,
    programName: program.name,
    sectionGuidance: sectionGuidance,
    hints: this.config.programHints?.[program.type]?.reviewer_tips || [],
    conversationHistory: conversationHistory || []  // ADD THIS
  });
  
  // ... rest of code ...
}
```

**Modify `callAIWithContext()`:**
```typescript
private async callAIWithContext(
  prompt: string,
  context: {
    // ... existing fields ...
    conversationHistory?: ConversationMessage[];  // ADD THIS
  }
): Promise<{ content: string; suggestions?: string[]; citations?: string[] }> {
  const response = await fetch('/api/ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: prompt,
      context: context,
      conversationHistory: context.conversationHistory || [],  // ADD THIS
      action: 'generate'
    })
  });
  // ... rest of code ...
}
```

### 4. `pages/api/ai/openai.ts`
**Modify `generateAIResponse()`:**
```typescript
async function generateAIResponse(
  message: string,
  context: AIRequest['context'],
  action: string,
  conversationHistory?: ConversationMessage[]  // ADD THIS
): Promise<AIResponse> {
  const systemPrompt = createSystemPrompt(action, context);
  const userPrompt = createUserPrompt(message, context);

  // Build messages array with conversation history
  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...(conversationHistory || []).map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    })),
    { role: "user" as const, content: userPrompt }
  ];

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: messages,  // Use messages array with history
    max_tokens: 1000,
    temperature: 0.7,
  });
  // ... rest of code ...
}
```

**Update handler:**
```typescript
const conversationHistory = req.body.conversationHistory || [];
const aiResponse = await generateAIResponse(
  message,
  context,
  action,
  conversationHistory  // Pass to function
);
```

### 5. `features/editor/components/Editor.tsx`
**Add state:**
```typescript
const [aiMessages, setAiMessages] = useState<ConversationMessage[]>([]);
const [aiInput, setAiInput] = useState('');
```

**Add function to build context (all in Editor.tsx):**
```typescript
const buildAIContext = () => {
  if (!currentSection) return '';
  
  const previousAnswers = Object.values(currentSection.fields?.answers || {})
    .filter(Boolean)
    .join('\n\n');
  
  const otherSections = sections
    .filter(s => s.key !== currentSection.key && s.content)
    .map(s => `${s.title}: ${s.content.substring(0, 200)}...`)
    .join('\n\n');
  
  const userAnswers = loadUserAnswers();
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

**Add function to handle send:**
```typescript
const handleAISend = async () => {
  if (!aiInput.trim() || !currentSection) return;
  
  const userMessage: ConversationMessage = {
    id: `msg_${Date.now()}`,
    role: 'user',
    content: aiInput,
    timestamp: new Date().toISOString()
  };
  
  const updatedMessages = [...aiMessages, userMessage];
  setAiMessages(updatedMessages);
  setAiInput('');
  
  const context = buildAIContext();
  const aiHelper = createAIHelper({...});
  const response = await aiHelper.generateSectionContent(
    currentSection.title,
    context,
    programForAI,
    updatedMessages  // Pass conversation history
  );
  
  const assistantMessage: ConversationMessage = {
    id: `msg_${Date.now() + 1}`,
    role: 'assistant',
    content: response.content,
    timestamp: new Date().toISOString()
  };
  
  const finalMessages = [...updatedMessages, assistantMessage];
  setAiMessages(finalMessages);
  savePlanConversations(currentSection.key, finalMessages);
};
```

**Replace placeholder modal with chat UI:**
```typescript
{showAIModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAIModal(false)}>
    <div className="bg-white rounded-lg w-full max-w-3xl h-[80vh] mx-4 flex flex-col" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="px-6 py-4 border-b flex justify-between">
        <div>
          <h2 className="text-xl font-semibold">AI Assistant</h2>
          <p className="text-sm text-gray-500">{currentSection?.title}</p>
        </div>
        <button onClick={() => setShowAIModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {aiMessages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>Ask me anything about this section!</p>
            <p className="text-xs mt-2">I'll use your previous answers and other sections to help you.</p>
          </div>
        )}
        {aiMessages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
            }`}>
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Input */}
      <div className="px-6 py-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAISend()}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAISend}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
)}
```

**Load conversation history when modal opens:**
```typescript
useEffect(() => {
  if (showAIModal && currentSection) {
    const conversations = loadPlanConversations();
    setAiMessages(conversations[currentSection.key] || []);
  }
}, [showAIModal, currentSection]);
```

## Summary

**5 Files Modified (0 new files):**
1. `shared/types/plan.ts` - Add ConversationMessage type
2. `shared/user/storage/planStore.ts` - Add save/load functions
3. `features/editor/engine/aiHelper.ts` - Add history parameter
4. `pages/api/ai/openai.ts` - Include history in API call
5. `features/editor/components/Editor.tsx` - Add chat UI + context building

**All logic in Editor.tsx:**
- Context building (no separate file)
- Chat UI (no separate component)
- Simple and clean!

