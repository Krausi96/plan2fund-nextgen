# Simplification Plan - Before UI Work

## 1. Strategy Product - More Sections Needed

### Current Problem:
- Strategy has only 6 sections
- But it's for "core documents" - should have MORE sections
- Questions need to be smarter and easier

### Solution Needed:
- Add more sections to Strategy product
- Make questions smarter (easier to answer)
- Consider: Is question-based the best approach?

## 2. ALL Products - Is Question-Based Best?

### Current Problem:
- User sees prompts/questions
- User might get annoyed answering many questions
- How to speed this up?

### Options to Consider:
1. **Keep questions but make them optional** - User can skip and write directly
2. **Progressive disclosure** - Show questions only when needed
3. **Smart defaults** - Pre-fill based on previous answers
4. **Quick fill** - One-click to generate from minimal input
5. **Hybrid** - Questions OR free-form writing

### User Behavior:
- Some users want guidance (questions)
- Some users want to write freely
- Need to support both

## 3. Enhancement Flow - Too Complex

### Current Problem:
- Too many sources (master + template + expertise + program)
- Runs simultaneously? No - need step-by-step
- Need to think about user behavior

### Simplified Flow Needed:

```
STEP 1: User sees simple prompt
  "Who are your target customers?"
  ↓
STEP 2: User writes OR clicks "Generate"
  ↓
STEP 3: IF "Generate":
  - AI gets: Master prompt + Template guidance + Expertise
  - AI generates: Enhanced content
  - User sees: Generated content (can edit)
  ↓
STEP 4: User edits/approves
  ↓
STEP 5: Requirements checker validates
```

### Where Data Comes From:
- **Master prompts:** `sections.ts` (what user sees)
- **Template guidance:** `templateKnowledge.ts` (what AI uses)
- **Business expertise:** AI's built-in knowledge
- **Program requirements:** API (optional, if program selected)

## 4. Requirements Checker - How It Extracts Content

### Current Problem:
- How does it get the content?
- How does it check it?

### How It Works:
1. **Gets content from:** `section.content` (stored in state/localStorage)
2. **Extracts text:** Removes HTML tags, gets plain text
3. **Checks:**
   - Basic: Word count, required fields
   - Semantic: Sends to AI, AI reads and understands meaning

### Code Flow:
```typescript
// RequirementsModal.tsx
const section = sections.find(s => s.key === 'market_analysis');
const content = section.content; // Gets from state

// Extract plain text
const textContent = content.replace(/<[^>]*>/g, '').trim();

// Send to AI for semantic check
const validation = await callAI(`
  Check this content: ${textContent}
  Does it use Porter Five Forces properly?
`);
```

## 5. How AI Gets Data to Be Expert

### Current Problem:
- How does AI have expertise?
- Where does knowledge come from?

### How It Works:
1. **AI Model (GPT-4/Claude):** Pre-trained on vast business knowledge
2. **Template Knowledge:** Our German template (one source)
3. **System Prompt:** Tells AI it's a business expert
4. **Context:** Current content, user answers, program requirements

### Data Sources:
- **AI's training:** Built-in business knowledge (Porter, SWOT, etc.)
- **Template knowledge:** Our German template guidance
- **System prompt:** "You are a business consultant..."
- **User context:** Current content, answers, program

## Simplification Needed

### 1. Simplify Enhancement Flow
- Clear step-by-step (not simultaneous)
- Show where data comes from
- Think about user behavior

### 2. Simplify Questions
- Make them optional
- Support free-form writing
- Speed up the process

### 3. Simplify Requirements Checker
- Clear how it gets content
- Clear how it checks
- Make it faster

### 4. Clarify AI Expertise
- AI has built-in knowledge
- Template is one source
- System prompt sets role

## Next Steps

1. **Draw interface flow** - Step by step, user behavior
2. **Simplify enhancement** - Clear data sources
3. **Simplify questions** - Optional, faster
4. **Clarify checker** - How it works
5. **Then focus on UI**

