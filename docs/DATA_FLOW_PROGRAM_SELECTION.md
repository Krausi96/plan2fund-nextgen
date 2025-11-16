# Data Flow: Program Selection → Editor Components

## 🔄 Complete Data Flow After User Selects Program

### Step 1: User Selects Program in ProgramFinder

**Location:** `features/reco/components/ProgramFinder.tsx` (line 504-532)

**What Happens:**
```typescript
handleProgramSelect(program: EnhancedProgramResult) {
  const programData = {
    id: program.id,
    name: program.name,
    categorized_requirements: program.categorized_requirements || {},  // ⭐ 15 categories
    type: program.type || 'grant',
    url: program.url,
    selectedAt: new Date().toISOString(),
    metadata: {
      funding_amount_min: program.amount?.min,
      funding_amount_max: program.amount?.max,
      currency: 'EUR',
    }
  };
  
  localStorage.setItem('selectedProgram', JSON.stringify(programData));  // ⭐ Stored here
  router.push('/editor?product=submission');
}
```

**Data Stored:**
```json
{
  "id": "llm_ffg_general_programme",
  "name": "FFG General Programme",
  "categorized_requirements": {
    "geographic": [{ "type": "location", "value": "Austria", "confidence": 0.9 }],
    "eligibility": [{ "type": "company_type", "value": "startup", "confidence": 0.85 }],
    "financial": [{ "type": "co_financing", "value": "20% required", "confidence": 0.8 }],
    // ... 12 more categories
  },
  "type": "grant",
  "url": "https://www.ffg.at",
  "selectedAt": "2024-01-15T10:30:00.000Z",
  "metadata": { ... }
}
```

---

### Step 2: Editor Loads and Reads from localStorage

**Location:** `features/editor/components/Editor.tsx` (line 113-146)

**What Happens:**
```typescript
// In loadSections() function
if (typeof window !== 'undefined') {
  const storedProgram = localStorage.getItem('selectedProgram');  // ⭐ Read from localStorage
  if (storedProgram) {
    const programData = JSON.parse(storedProgram);
    const selectedAt = programData.selectedAt ? new Date(programData.selectedAt) : null;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Only use if selected recently (within 1 hour)
    if (selectedAt && selectedAt > oneHourAgo) {
      setProgramData({  // ⭐ Set component state
        categorized_requirements: programData.categorized_requirements || {},
        program_name: programData.name || programData.id || 'Selected Program'
      });
    } else {
      localStorage.removeItem('selectedProgram');  // Expired - clear it
      setProgramData(null);
    }
  }
}
```

**State Set:**
```typescript
const [programData, setProgramData] = useState<{
  categorized_requirements?: any;  // ⭐ 15 categories
  program_name?: string;
} | null>(null);
```

---

### Step 3: How Components Use the Data

#### A. RequirementsModal.tsx (Gets Data via Props)

**Location:** `features/editor/components/Editor.tsx` (line 776-783)

**How Data is Passed:**
```typescript
<RequirementsModal
  isOpen={showRequirementsModal}
  onClose={() => setShowRequirementsModal(false)}
  sections={sections}
  sectionTemplates={sectionTemplates}
  onNavigateToSection={(index) => setActiveSection(index)}
  programId={programData ? 'selected' : undefined}
  programData={programData || undefined}  // ⭐ Passed as prop
  onGenerateMissingContent={async (sectionKey) => { ... }}
/>
```

**How RequirementsModal Uses It:**
```typescript
// In RequirementsModal.tsx (line 61-70)
export default function RequirementsModal({
  isOpen,
  onClose,
  sections,
  sectionTemplates,
  onNavigateToSection,
  onGenerateMissingContent,
  programId: _programId,
  programData  // ⭐ Received as prop
}: RequirementsModalProps) {
  
  // Uses programData.categorized_requirements directly
  const programReqs = getProgramRequirementsForSection(
    programData?.categorized_requirements,  // ⭐ Uses prop
    template.category
  );
  
  // Displays in UI
  return (
    <div>
      {programData?.categorized_requirements && template.category && (
        <div>
          🎯 Program-Specific Requirements ({programData.program_name})
          {programReqs.map(req => <li>{req}</li>)}
        </div>
      )}
    </div>
  );
}
```

**Data Flow:**
```
localStorage → Editor state (programData) → RequirementsModal prop → Display
```

---

#### B. aiHelper.ts (Reads Directly from localStorage)

**Location:** `features/editor/engine/aiHelper.ts` (line 80-108)

**How Data is Accessed:**
```typescript
// In generateSectionContent() method
async generateSectionContent(
  section: string,
  context: string,
  program: Program,  // ⭐ Program object passed in
  conversationHistory?: ConversationMessage[]
): Promise<AIResponse> {
  
  let categorizedRequirements: any = null;
  
  if (program.id !== 'default' && typeof window !== 'undefined') {
    // ⭐ Reads directly from localStorage (not from props)
    const storedProgram = localStorage.getItem('selectedProgram');
    if (storedProgram) {
      const programData = JSON.parse(storedProgram);
      if (programData.categorized_requirements) {
        categorizedRequirements = programData.categorized_requirements;  // ⭐ 15 categories
        console.log('✅ Loaded categorized_requirements from localStorage');
      }
    }
  }
  
  // Use categorizedRequirements to build prompt
  const prompt = this.buildSectionPromptWithStructured(
    section, 
    context, 
    program, 
    categorizedRequirements  // ⭐ Used here
  );
  
  // Extract requirements for section
  const programRequirements = this.getRequirementsForSection(
    section, 
    categorizedRequirements  // ⭐ Used here
  );
  
  // Include in AI prompt
  === PROGRAM-SPECIFIC REQUIREMENTS FOR ${section} ===
  ${programRequirements.map(req => `- ${req}`).join('\n')}
}
```

**How aiHelper is Called:**
```typescript
// In Editor.tsx (line 273-336)
const aiHelper = createAIHelper({ ... });

// Get program from localStorage
const storedProgram = typeof window !== 'undefined' 
  ? JSON.parse(localStorage.getItem('selectedProgram') || 'null')
  : null;

const programForAI = storedProgram ? {
  id: storedProgram.id || 'default',
  name: storedProgram.name || 'Selected Program',
  type: storedProgram.type || 'grant',
  // ...
} : {
  id: 'default',
  name: 'Default Template',
  // ...
};

// Call aiHelper
const response = await aiHelper.generateSectionContent(
  currentSection.key,  // Section name
  context,              // Current content
  programForAI,         // ⭐ Program object (but aiHelper reads localStorage anyway)
  []
);
```

**Data Flow:**
```
localStorage → aiHelper reads directly → Extracts for section → Includes in AI prompt
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ProgramFinder: User Selects Program                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ localStorage.setItem('selectedProgram', {                   │
│   categorized_requirements: { 15 categories },           │
│   name, type, metadata, ...                                 │
│ })                                                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Editor.tsx: loadSections()                               │
│    - Reads from localStorage                                │
│    - Validates timestamp (1 hour expiry)                    │
│    - Sets programData state                                 │
└───────┬───────────────────────────────┬─────────────────────┘
        │                               │
        │                               │
        ▼                               ▼
┌───────────────────────┐   ┌──────────────────────────────┐
│ 3A. RequirementsModal │   │ 3B. aiHelper                  │
│                       │   │                               │
│ Gets via Props:       │   │ Reads from localStorage:      │
│ programData = {       │   │ localStorage.getItem(         │
│   categorized_        │   │   'selectedProgram'           │
│   requirements,       │   │ )                             │
│   program_name        │   │                               │
│ }                     │   │ Then extracts:                │
│                       │   │ - Maps section → category     │
│ Uses:                 │   │ - Gets requirements            │
│ getProgramRequirements│   │ - Includes in AI prompt       │
│ ForSection(           │   │                               │
│   categorized_        │   │ Result:                       │
│   requirements,       │   │ AI prompt includes program     │
│   sectionCategory     │   │ requirements                  │
│ )                     │   │                               │
│                       │   │                               │
│ Displays in UI        │   │ Generates content with        │
│                       │   │ program-specific guidance      │
└───────────────────────┘   └──────────────────────────────┘
```

---

## 🔍 Key Points

### 1. Data Storage
- **Single source of truth:** `localStorage.getItem('selectedProgram')`
- **Format:** JSON with `categorized_requirements` (15 categories)
- **Expiry:** 1 hour (validated in Editor.tsx)

### 2. Data Access Patterns

**RequirementsModal:**
- ✅ Gets data via **props** from Editor state
- ✅ Editor reads from localStorage and sets state
- ✅ Clean React pattern (props down)

**aiHelper:**
- ⚠️ Reads **directly from localStorage**
- ⚠️ Doesn't use props (reads independently)
- ⚠️ Works but less React-idiomatic

### 3. Why Two Different Patterns?

**RequirementsModal (Props):**
- Component receives data as prop
- React best practice
- Data flows through component tree

**aiHelper (Direct localStorage):**
- Utility class, not a React component
- Can't receive props
- Reads localStorage directly
- Works independently of component tree

---

## 💡 How It Works in Practice

### RequirementsModal Usage:

```typescript
// Editor.tsx passes programData
<RequirementsModal programData={programData} />

// RequirementsModal receives it
function RequirementsModal({ programData }) {
  // Extract requirements for section
  const reqs = getProgramRequirementsForSection(
    programData?.categorized_requirements,  // From prop
    'financial'  // Section category
  );
  
  // Display: "20% co-financing required", "Minimum €50,000", etc.
  return <ul>{reqs.map(req => <li>{req}</li>)}</ul>;
}
```

### aiHelper Usage:

```typescript
// Editor.tsx calls aiHelper
const aiHelper = createAIHelper({ ... });
const response = await aiHelper.generateSectionContent(
  'financial_plan',
  currentContent,
  programObject
);

// aiHelper internally:
async generateSectionContent(...) {
  // Reads localStorage directly
  const stored = localStorage.getItem('selectedProgram');
  const categorized = JSON.parse(stored).categorized_requirements;
  
  // Extracts for section
  const reqs = this.getRequirementsForSection('financial_plan', categorized);
  // Returns: ["20% co-financing required", "Minimum €50,000", ...]
  
  // Includes in prompt
  const prompt = `
    ...
    === PROGRAM-SPECIFIC REQUIREMENTS FOR FINANCIAL_PLAN ===
    - 20% co-financing required
    - Minimum €50,000
    ...
  `;
  
  // AI generates content that addresses these requirements
}
```

---

## ✅ Summary

**Data Flow:**
1. **ProgramFinder** → Stores in `localStorage` with 15 categories
2. **Editor** → Reads from `localStorage`, sets state
3. **RequirementsModal** → Gets data via props, displays requirements
4. **aiHelper** → Reads directly from `localStorage`, includes in AI prompts

**Both components use the same data:**
- ✅ Same source: `localStorage.getItem('selectedProgram')`
- ✅ Same format: `categorized_requirements` (15 categories)
- ✅ Same extraction: Maps section → category → requirements

**The data flows correctly to both components!** ✅

---

**Last Updated:** 2024-01-XX
**Status:** Complete data flow documented

