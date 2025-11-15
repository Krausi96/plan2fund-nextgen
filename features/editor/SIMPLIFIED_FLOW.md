# Simplified Flow - Step by Step

## 1. Strategy Product - Needs More Sections

### Current Problem:
- Strategy has only 6 sections
- But it's for "core documents" - should have MORE
- Questions need to be smarter and easier

### Solution:
- Add more sections to Strategy (match Review/Submission structure)
- Make questions optional (user can skip and write freely)
- Support both: Questions OR free-form writing

## 2. Is Question-Based Best? How to Speed Up?

### Current Flow:
```
User sees: "Who are your target customers?"
User types answer
User clicks "Next Question"
User sees: "How large is the market?"
User types answer
... (repeats for each question)
```

### Problems:
- Too slow
- User might get annoyed
- Not flexible

### Better Approach:
```
Option 1: Questions (Optional)
  - User can answer questions OR skip
  - Questions are guidance, not required
  
Option 2: Free-Form Writing
  - User writes directly
  - Questions shown as hints (collapsible)
  
Option 3: Quick Generate
  - User clicks "Generate" with minimal input
  - AI asks clarifying questions if needed
```

## 3. Enhancement Flow - Simplified

### Visual Flow:

```
┌─────────────────────────────────────────┐
│ STEP 1: User Interface                  │
│                                         │
│ User sees:                             │
│ "💡 Who are your target customers?"    │
│                                         │
│ [Text Editor]                           │
│ [✨ Generate] [Skip Questions]         │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ STEP 2: User Action                     │
│                                         │
│ User clicks "✨ Generate"               │
│ OR                                      │
│ User writes directly                    │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ STEP 3: IF "Generate" - Data Sources    │
│                                         │
│ AI gets:                                │
│ 1. Master prompt: "Who are customers?"  │
│    (from sections.ts)                  │
│                                         │
│ 2. Template guidance: "Use Porter..."  │
│    (from templateKnowledge.ts)          │
│                                         │
│ 3. Business expertise: General knowledge│
│    (from AI's training)                 │
│                                         │
│ 4. Program requirements: (optional)    │
│    (from API if program selected)       │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ STEP 4: AI Generates                    │
│                                         │
│ AI combines all sources:                │
│ - Answers the prompt                    │
│ - Uses Porter framework (from template) │
│ - Applies business best practices       │
│ - Meets program requirements            │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ STEP 5: User Sees Enhanced Content       │
│                                         │
│ Generated content appears in editor      │
│ User can:                               │
│ - Edit it                               │
│ - Accept it                             │
│ - Regenerate                            │
└─────────────────────────────────────────┘
```

### Where Data Comes From:

```
┌─────────────────────────────────────────┐
│ DATA SOURCES                            │
│                                         │
│ 1. Master Prompts                      │
│    File: sections.ts                   │
│    Example: "Who are customers?"       │
│                                         │
│ 2. Template Knowledge                  │
│    File: templateKnowledge.ts           │
│    Example: "Use Porter Five Forces"   │
│                                         │
│ 3. Business Expertise                  │
│    Source: AI's training                │
│    Example: Knows how to apply Porter  │
│                                         │
│ 4. Program Requirements                │
│    Source: API (optional)               │
│    Example: "Emphasize innovation"     │
└─────────────────────────────────────────┘
```

### Step-by-Step (NOT Simultaneous):

```
1. User clicks "Generate"
   ↓
2. System gets master prompt (sections.ts)
   ↓
3. System gets template knowledge (templateKnowledge.ts)
   ↓
4. System gets program requirements (API, if available)
   ↓
5. System builds prompt with all sources
   ↓
6. System calls AI
   ↓
7. AI generates content
   ↓
8. System shows content to user
```

## 4. Requirements Checker - How It Extracts Content

### Simple Process:

```
┌─────────────────────────────────────────┐
│ STEP 1: Get Content                     │
│                                         │
│ From: section.content                   │
│ Location: React state (sections array)  │
│                                         │
│ Example:                                │
│ section.content = "Our market is big..."│
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ STEP 2: Extract Text                     │
│                                         │
│ Remove HTML tags                        │
│ Get plain text                          │
│                                         │
│ Code:                                   │
│ const text = content.replace(/<[^>]*>/g, '')│
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ STEP 3: Basic Check (Fast)              │
│                                         │
│ - Word count: 150/300 ✓                 │
│ - Required fields: ✓/✗                  │
│ - Format: ✓/✗                           │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│ STEP 4: Semantic Check (AI)             │
│                                         │
│ Send to AI:                             │
│ "Check this content: [text]             │
│  Does it use Porter Five Forces?        │
│  Is market size calculated?"            │
│                                         │
│ AI returns:                             │
│ - Quality score: 7/10                   │
│ - Issues: ["Missing Porter analysis"]  │
│ - Recommendations: ["Use Porter..."]   │
└─────────────────────────────────────────┘
```

### Code Flow:

```typescript
// RequirementsModal.tsx

// Step 1: Get content from state
const section = sections.find(s => s.key === 'market_analysis');
const content = section.content; // "Our market is big..."

// Step 2: Extract plain text
const textContent = content.replace(/<[^>]*>/g, '').trim();

// Step 3: Basic check
if (textContent.length < 50) {
  // Basic validation only
  return validateBasic(section, template);
}

// Step 4: Semantic check (AI)
const validation = await callAI(`
  Check this content: ${textContent}
  Does it use Porter Five Forces properly?
  Is market size calculated?
`);
```

## 5. How AI Gets Data to Be Expert

### Simple Explanation:

```
┌─────────────────────────────────────────┐
│ AI EXPERTISE SOURCES                    │
│                                         │
│ 1. AI Model Training                   │
│    - GPT-4/Claude trained on vast data │
│    - Knows Porter, SWOT, TAM/SAM/SOM   │
│    - Knows business best practices     │
│    - This is BUILT-IN                   │
│                                         │
│ 2. System Prompt                        │
│    - "You are a business consultant"   │
│    - Sets the role                      │
│    - Tells AI how to behave             │
│                                         │
│ 3. Template Knowledge (Our Addition)   │
│    - German template guidance           │
│    - Section-specific frameworks        │
│    - This ENHANCES built-in knowledge   │
│                                         │
│ 4. Context (Current Session)           │
│    - User's current content             │
│    - User's answers                     │
│    - Program requirements               │
└─────────────────────────────────────────┘
```

### How It Works:

```typescript
// aiHelper.ts

// System prompt (sets role)
const systemPrompt = `
You are a senior business consultant with 20+ years experience.
You have expertise in:
- Market analysis (Porter, TAM/SAM/SOM)
- Financial planning
- Grant applications
- Startup consulting
`;

// Template knowledge (our addition)
const templateKnowledge = getTemplateKnowledge('market_analysis');
// {
//   guidance: "Use Porter Five Forces...",
//   frameworks: ["Porter Five Forces"]
// }

// Build prompt
const prompt = `
${systemPrompt}

Template guidance: ${templateKnowledge.guidance}
Frameworks: ${templateKnowledge.frameworks.join(', ')}

User's question: "Who are your target customers?"
Current content: ${currentContent}

Generate expert content.
`;

// AI uses:
// 1. Built-in knowledge (from training)
// 2. System prompt (role setting)
// 3. Template knowledge (our guidance)
// 4. Context (user's content)
```

## Summary

### 1. Strategy Product:
- Needs MORE sections (it's core documents)
- Questions should be optional
- Support both: Questions OR free-form

### 2. Enhancement Flow:
- Step-by-step (NOT simultaneous)
- Clear data sources
- Visual flow shown above

### 3. Requirements Checker:
- Gets content from: `section.content` (React state)
- Extracts text: Remove HTML
- Checks: Basic (fast) + Semantic (AI)

### 4. AI Expertise:
- Built-in knowledge (from training)
- System prompt (sets role)
- Template knowledge (our addition)
- Context (current session)

