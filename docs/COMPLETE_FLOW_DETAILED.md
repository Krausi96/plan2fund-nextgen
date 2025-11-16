# Complete Flow: Q&A → Display → Selection → Editor Components

## 🎯 Fully Detailed Flow from Start to Finish

This document traces the **complete flow** from user answering Q&A questions to how aiHelper and RequirementsModal use the data.

---

## 📝 Step 1: User Answers Q&A Questions

### Location: `features/reco/components/ProgramFinder.tsx`

### What Happens:

**User fills out form:**
```typescript
// User answers questions like:
answers = {
  location: "austria",
  company_type: "startup",
  funding_amount: 50000,
  industry_focus: ["digital", "sustainability"],
  company_stage: "early_stage",
  co_financing: "co_yes",
  // ... more answers
}
```

**State Management:**
```typescript
// Line 279
const [answers, setAnswers] = useState<Record<string, any>>({});

// Line 499
const handleAnswer = (questionId: string, value: any) => {
  const newAnswers = { ...answers, [questionId]: value };
  setAnswers(newAnswers);
};
```

**Minimum Requirements:**
```typescript
// Line 341-343
const MIN_QUESTIONS_FOR_RESULTS = 6;
const answeredCount = Object.keys(answers).filter(key => 
  answers[key] !== undefined && answers[key] !== null && answers[key] !== ''
).length;
const hasEnoughAnswers = answeredCount >= MIN_QUESTIONS_FOR_RESULTS;
```

**User Clicks "Generate":**
```typescript
// Line 663
<button onClick={() => {
  setShowResults(true);
  updateGuidedResults();  // ⭐ Triggers API call
}}>
  Generate
</button>
```

---

## 🔄 Step 2: Q&A Answers Processed - API Call

### Location: `features/reco/components/ProgramFinder.tsx` (line 345-491)

### What Happens:

**API Request:**
```typescript
// Line 366-375
const response = await fetch('/api/programs/recommend', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    answers,              // ⭐ User's Q&A answers
    max_results: 20,
    extract_all: false,
    use_seeds: false,
  }),
});
```

**Request Payload Example:**
```json
{
  "answers": {
    "location": "austria",
    "company_type": "startup",
    "funding_amount": 50000,
    "industry_focus": ["digital", "sustainability"],
    "company_stage": "early_stage",
    "co_financing": "co_yes",
    "team_size": 5,
    "project_duration": 12,
    "deadline_urgency": 6,
    "use_of_funds": ["rd", "personnel"],
    "impact": ["economic", "environmental"]
  },
  "max_results": 20,
  "extract_all": false,
  "use_seeds": false
}
```

---

## 🤖 Step 3: API Processes Request - recommend.ts

### Location: `pages/api/programs/recommend.ts` (line 882-1044)

### What Happens:

**3.1: API Receives Request**
```typescript
// Line 888
const answers: UserAnswers = req.body.answers || {};
const { max_results = 10, extract_all = false, use_seeds = true } = req.body;
```

**3.2: Calls generateProgramsWithLLM()**
```typescript
// Line 917-918
console.log('📤 Calling generateProgramsWithLLM with answers and maxPrograms:', max_results * 2);
programs = await generateProgramsWithLLM(answers, max_results * 2);
```

---

## 🎨 Step 4: LLM Generates Basic Programs

### Location: `pages/api/programs/recommend.ts` (line 313-861)

### What Happens:

**4.1: Build User Profile**
```typescript
// Line 318-475
const profileParts: string[] = [];

if (answers.location) {
  profileParts.push(`Location: ${answers.location}`);
}
if (answers.company_type) {
  profileParts.push(`Company Type: ${answers.company_type}`);
}
if (answers.funding_amount) {
  profileParts.push(`Funding Amount: €${answers.funding_amount.toLocaleString()}`);
}
// ... builds complete profile

const userProfile = profileParts.join('\n');
```

**User Profile Example:**
```
Location: Austria
Company Type: startup
Company Stage: early_stage
Funding Amount: €50,000
Industry Focus: digital (AI, FinTech), sustainability (GreenTech, CleanTech)
Impact: economic (Create 50 jobs, increase regional GDP), environmental (Reduce CO2 by 30%)
Use of Funds: Research & Development, Personnel/Hiring
Project Duration: 12 months
Team Size: 5 people
Co-financing: Yes (20%)
```

**4.2: Create LLM Prompt**
```typescript
// Line 477-517
const prompt = `You are an expert on European funding programs (grants, loans, subsidies).

Based on this user profile, suggest ${maxPrograms} relevant funding programs:

${userProfile}

For each program, provide a JSON object with:
- name: Program name
- institution: Institution/organization name
- funding_amount_min: Minimum funding amount (number)
- funding_amount_max: Maximum funding amount (number)
- currency: Currency code (default: EUR)
- location: Geographic eligibility (e.g., "Austria", "Germany", "EU")
- company_type: Eligible company types (e.g., "startup", "sme", "research")
- industry_focus: Industry/sector focus (array of strings)
- deadline: Application deadline if known (YYYY-MM-DD format, or null)
- open_deadline: Boolean indicating if deadline is open/rolling
- website: Program website URL if known (or null)
- description: Brief program description

Return a JSON object with a "programs" array containing the program objects.`;
```

**4.3: Call LLM**
```typescript
// Line 526-644
const messages = [
  { role: 'system', content: 'You are an expert on European funding programs...' },
  { role: 'user', content: prompt }
];

// Calls OpenAI or Custom LLM
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages,
  response_format: { type: "json_object" },
  max_tokens: 4000,
  temperature: 0.3,
});

const responseText = completion.choices[0]?.message?.content || '{}';
```

**4.4: Parse LLM Response**
```typescript
// Line 654-772
const sanitized = sanitizeLLMResponse(responseText);
const parsed = JSON.parse(sanitized);
const programs = parsed.programs || [];
```

**LLM Response Example:**
```json
{
  "programs": [
    {
      "name": "FFG General Programme",
      "institution": "Austrian Research Promotion Agency",
      "funding_amount_min": 50000,
      "funding_amount_max": 500000,
      "currency": "EUR",
      "location": "Austria",
      "company_type": "startup",
      "industry_focus": ["digital", "technology"],
      "deadline": null,
      "open_deadline": true,
      "website": "https://www.ffg.at",
      "description": "Supports research and innovation projects for startups and SMEs"
    },
    // ... more programs
  ]
}
```

**Result:** Array of basic program objects (name, institution, funding amounts, etc.)

---

## 🔍 Step 5: Deep Extraction - extractWithLLM()

### Location: `pages/api/programs/recommend.ts` (line 775-853)

### What Happens:

**5.1: For Each Program, Create Text Description**
```typescript
// Line 775-787
const programsWithRequirements = await Promise.all(programs.map(async (p: any, index: number) => {
  // Create a text description for extraction
  const programText = `
Program Name: ${p.name || `Program ${index + 1}`}
Institution: ${p.institution || 'Unknown'}
Description: ${p.description || ''}
Location: ${p.location || answers.location || ''}
Company Type: ${p.company_type || answers.company_type || ''}
Industry Focus: ${Array.isArray(p.industry_focus) ? p.industry_focus.join(', ') : (p.industry_focus || '')}
Funding Amount: ${p.funding_amount_min || 0} - ${p.funding_amount_max || 0} ${p.currency || 'EUR'}
Deadline: ${p.deadline || (p.open_deadline ? 'Open deadline' : 'Not specified')}
Website: ${p.website || 'Not available'}
  `.trim();
```

**Program Text Example:**
```
Program Name: FFG General Programme
Institution: Austrian Research Promotion Agency
Description: Supports research and innovation projects for startups and SMEs
Location: Austria
Company Type: startup
Industry Focus: digital, technology
Funding Amount: 50000 - 500000 EUR
Deadline: Open deadline
Website: https://www.ffg.at
```

**5.2: Call extractWithLLM()**
```typescript
// Line 793-798
extractedRequirements = await extractWithLLM({
  text: programText,  // ⭐ Program description text
  url: p.website || `llm://${p.name}`,
  title: p.name || `Program ${index + 1}`,
  description: p.description || '',
});
```

---

## 🧠 Step 6: extractWithLLM() Extracts 15 Categories

### Location: `features/reco/engine/llmExtract.ts` (line 167-511)

### What Happens:

**6.1: Prepare Content**
```typescript
// Line 182-199
if (text) {
  contentText = text;  // Use text mode (no HTML parsing)
} else if (html) {
  // HTML mode (for web scraping)
  const $ = cheerio.load(html);
  // ... parse HTML
  contentText = mainContent.text();
}
```

**6.2: Create Extraction Prompt**
```typescript
// Line 207-216
const systemPrompt = createSystemPrompt();  // Detailed prompt with 15 categories
const userPrompt = createUserPrompt({
  url,
  title: title || 'Unknown',
  description: description || '',
  content: truncatedContent,
  isTextMode: true
});
```

**System Prompt (Simplified):**
```
Extract ALL requirements from this funding program.

Extract 15 categories:
1. Geographic eligibility
2. Eligibility (company type, stage, age)
3. Financial (funding amounts, co-financing, revenue)
4. Team (size, composition)
5. Project (industry focus, sector, TRL)
6. Timeline (deadlines, duration)
7. Documents (required documents)
8. Technical (technical requirements)
9. Legal (legal/compliance)
10. Impact (environmental, social, economic)
11. Application (application process)
12. Funding Details (use of funds)
13. Restrictions (eligibility restrictions)
14. Terms (terms and conditions)
15. Compliance (compliance requirements)

Return JSON with categorized_requirements and metadata.
```

**6.3: Call LLM for Extraction**
```typescript
// Line 223-350
const messages = [
  { role: "system", content: systemPrompt },
  { role: "user", content: userPrompt }
];

// Calls OpenAI or Custom LLM
const completion = await openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages,
  response_format: { type: "json_object" },
  max_tokens: 4000,
  temperature: 0.3,
});
```

**6.4: Parse Extraction Response**
```typescript
// Line 351-510
const responseText = completion.choices[0]?.message?.content || '{}';
const sanitized = sanitizeLLMResponse(responseText);
const parsed = JSON.parse(sanitized);

// Extract categorized_requirements
const categorized_requirements = parsed.requirements || {};
const metadata = parsed.metadata || {};
```

**Extraction Response Example:**
```json
{
  "metadata": {
    "funding_amount_min": 50000,
    "funding_amount_max": 500000,
    "currency": "EUR",
    "deadline": null,
    "open_deadline": true,
    "funding_types": ["grant"],
    "region": "Austria"
  },
  "requirements": {
    "geographic": [
      {
        "type": "location",
        "value": "Companies must be based in Austria or EU member states",
        "confidence": 0.9
      }
    ],
    "eligibility": [
      {
        "type": "company_type",
        "value": "Startups and small to medium-sized enterprises (SMEs)",
        "confidence": 0.85
      },
      {
        "type": "company_stage",
        "value": "Early-stage companies less than 3 years old",
        "confidence": 0.8
      }
    ],
    "financial": [
      {
        "type": "co_financing",
        "value": "Minimum 20% own contribution required",
        "confidence": 0.8
      },
      {
        "type": "funding_rate",
        "value": "Up to 80% of eligible costs",
        "confidence": 0.75
      }
    ],
    "project": [
      {
        "type": "innovation_focus",
        "value": "Digital transformation, Industry 4.0, AI and machine learning",
        "confidence": 0.85
      }
    ],
    "team": [
      {
        "type": "team_size",
        "value": "Minimum 2 people",
        "confidence": 0.7
      }
    ],
    "timeline": [
      {
        "type": "duration",
        "value": "Project duration: 12-24 months",
        "confidence": 0.8
      }
    ],
    "documents": [
      {
        "type": "required_documents",
        "value": "Business plan, CV, project description, financial statements",
        "confidence": 0.9
      }
    ],
    "technical": [
      {
        "type": "technical_requirement",
        "value": "TRL level 4-6 required",
        "confidence": 0.75
      }
    ],
    "legal": [
      {
        "type": "legal_requirement",
        "value": "Must be registered in Austria",
        "confidence": 0.9
      }
    ],
    "impact": [
      {
        "type": "economic_impact",
        "value": "Job creation, regional growth",
        "confidence": 0.8
      }
    ],
    "application": [
      {
        "type": "application_process",
        "value": "Online application via FFG portal",
        "confidence": 0.9
      }
    ],
    "funding_details": [
      {
        "type": "use_of_funds",
        "value": "Personnel costs, equipment, R&D infrastructure",
        "confidence": 0.85
      }
    ],
    "restrictions": [
      {
        "type": "restrictions",
        "value": "No funding for pure marketing projects",
        "confidence": 0.8
      }
    ],
    "terms": [
      {
        "type": "terms",
        "value": "Reporting required every 6 months",
        "confidence": 0.75
      }
    ],
    "compliance": [
      {
        "type": "compliance_requirement",
        "value": "EU state aid rules apply",
        "confidence": 0.9
      }
    ]
  }
}
```

**6.5: Return Extracted Data**
```typescript
// Line 511
return {
  categorized_requirements: categorized_requirements,  // ⭐ 15 categories
  metadata: metadata
};
```

---

## 🔗 Step 7: Combine Basic Program + Extracted Requirements

### Location: `pages/api/programs/recommend.ts` (line 805-852)

### What Happens:

**7.1: Use Extracted or Fallback**
```typescript
// Line 805-828
const categorized_requirements = extractedRequirements?.categorized_requirements || {
  // Fallback if extraction failed
  geographic: [{ type: 'location', value: p.location, confidence: 0.8 }],
  eligibility: [{ type: 'company_type', value: p.company_type, confidence: 0.8 }],
  project: [...]
};

const metadata = extractedRequirements?.metadata || {
  funding_amount_min: p.funding_amount_min || 0,
  funding_amount_max: p.funding_amount_max || 0,
  // ... basic metadata
};
```

**7.2: Create Complete Program Object**
```typescript
// Line 841-852
return {
  id: `llm_${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
  name: p.name,
  url: p.website || null,
  institution_id: `llm_${p.institution.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
  funding_types: metadata.funding_types || ['grant'],
  metadata,                                    // ⭐ Metadata
  categorized_requirements,                   // ⭐ 15 categories
  eligibility_criteria: {},
  extracted_at: new Date().toISOString(),
  source: 'llm_generated',
};
```

**Complete Program Object:**
```typescript
{
  id: "llm_ffg_general_programme",
  name: "FFG General Programme",
  url: "https://www.ffg.at",
  institution_id: "llm_austrian_research_promotion_agency",
  funding_types: ["grant"],
  metadata: {
    funding_amount_min: 50000,
    funding_amount_max: 500000,
    currency: "EUR",
    deadline: null,
    open_deadline: true,
    description: "Supports research and innovation...",
    region: "Austria"
  },
  categorized_requirements: {
    geographic: [...],
    eligibility: [...],
    financial: [...],
    // ... 12 more categories
  },
  extracted_at: "2024-01-15T10:30:00.000Z",
  source: "llm_generated"
}
```

---

## 📤 Step 8: API Returns to Frontend

### Location: `pages/api/programs/recommend.ts` (line 1034-1044)

### What Happens:

**API Response:**
```typescript
// Line 1034-1044
return res.status(200).json({
  success: true,
  programs: programs,  // ⭐ Array of complete programs with 15 categories
  count: programs.length,
  extraction_results: extractionResults,
  question_mapping: QUESTION_TO_EXTRACTION_MAP,
  answers_provided: answers,
  source: 'llm_generated',
  llm_generated: true,
  message: `Generated ${programs.length} programs using LLM`
});
```

**Response Example:**
```json
{
  "success": true,
  "programs": [
    {
      "id": "llm_ffg_general_programme",
      "name": "FFG General Programme",
      "categorized_requirements": {
        "geographic": [...],
        "eligibility": [...],
        "financial": [...],
        // ... 15 categories total
      },
      "metadata": {...}
    },
    // ... more programs
  ],
  "count": 5,
  "source": "llm_generated"
}
```

---

## 🎨 Step 9: Frontend Processes and Displays Results

### Location: `features/reco/components/ProgramFinder.tsx` (line 382-491)

### What Happens:

**9.1: Receive API Response**
```typescript
// Line 382-383
const data = await response.json();
const extractedPrograms = data.programs || [];
```

**9.2: Convert to Program Format**
```typescript
// Line 414-434
const programsForScoring = extractedPrograms.map((p: any) => ({
  id: p.id,
  name: p.name,
  type: p.funding_types?.[0] || 'grant',
  description: p.metadata?.description || '',
  funding_amount_max: p.metadata?.funding_amount_max || 0,
  funding_amount_min: p.metadata?.funding_amount_min || 0,
  currency: p.metadata?.currency || 'EUR',
  url: p.url,
  deadline: p.metadata?.deadline,
  open_deadline: p.metadata?.open_deadline || false,
  categorized_requirements: p.categorized_requirements || {},  // ⭐ Kept here
  // ... more fields
}));
```

**9.3: Score Programs**
```typescript
// Line 437-438
const scored = await scoreProgramsEnhanced(answers, 'strict', programsForScoring);
```

**9.4: Filter and Sort**
```typescript
// Line 446-447
const validPrograms = scored.filter(p => p.score > 0);
const top5 = validPrograms.sort((a, b) => b.score - a.score).slice(0, 5);
```

**9.5: Set Results State**
```typescript
// Line 463
setResults(top5);  // ⭐ Top 5 scored programs
```

**9.6: Display in UI**
```typescript
// Line 1448-1654
{results.slice(0, 5).map((program) => (
  <Card>
    <h3>{program.name}</h3>
    <Badge>{Math.round(program.score)}% match</Badge>
    <p>€{program.amount.min} - €{program.amount.max}</p>
    
    {/* Matches Section */}
    {program.matches && (
      <div>
        <span>Matches ({program.matches.length})</span>
        {program.matches.map(match => <li>✓ {match}</li>)}
      </div>
    )}
    
    {/* Gaps Section */}
    {program.gaps && (
      <div>
        <span>Considerations ({program.gaps.length})</span>
        {program.gaps.map(gap => <li>ℹ {gap}</li>)}
      </div>
    )}
    
    <Button onClick={() => handleProgramSelect(program)}>
      View Details
    </Button>
  </Card>
))}
```

**Display Shows:**
- Program name
- Match score (e.g., "85% match")
- Funding amount range
- Matches (green) - What aligns with user answers
- Gaps (yellow) - What to consider
- "Why This Fits" explanation
- "View Details" button

---

## ✅ Step 10: User Selects Program

### Location: `features/reco/components/ProgramFinder.tsx` (line 504-532)

### What Happens:

**10.1: handleProgramSelect() Called**
```typescript
// Line 504
const handleProgramSelect = (program: EnhancedProgramResult) => {
```

**10.2: Extract Program Data**
```typescript
// Line 509-522
const programData = {
  id: program.id,                                    // "llm_ffg_general_programme"
  name: program.name || program.id,                   // "FFG General Programme"
  categorized_requirements: program.categorized_requirements || {},  // ⭐ 15 categories
  type: program.type || 'grant',                      // "grant"
  url: program.url || program.source_url,             // "https://www.ffg.at"
  selectedAt: new Date().toISOString(),               // "2024-01-15T10:30:00.000Z"
  metadata: {
    funding_amount_min: program.amount?.min,          // 50000
    funding_amount_max: program.amount?.max,          // 500000
    currency: program.amount?.currency || 'EUR',      // "EUR"
  }
};
```

**10.3: Store in localStorage**
```typescript
// Line 523
localStorage.setItem('selectedProgram', JSON.stringify(programData));
```

**Stored Data Structure:**
```json
{
  "id": "llm_ffg_general_programme",
  "name": "FFG General Programme",
  "categorized_requirements": {
    "geographic": [
      {
        "type": "location",
        "value": "Companies must be based in Austria or EU member states",
        "confidence": 0.9
      }
    ],
    "eligibility": [
      {
        "type": "company_type",
        "value": "Startups and small to medium-sized enterprises (SMEs)",
        "confidence": 0.85
      },
      {
        "type": "company_stage",
        "value": "Early-stage companies less than 3 years old",
        "confidence": 0.8
      }
    ],
    "financial": [
      {
        "type": "co_financing",
        "value": "Minimum 20% own contribution required",
        "confidence": 0.8
      },
      {
        "type": "funding_rate",
        "value": "Up to 80% of eligible costs",
        "confidence": 0.75
      }
    ],
    "project": [
      {
        "type": "innovation_focus",
        "value": "Digital transformation, Industry 4.0, AI and machine learning",
        "confidence": 0.85
      }
    ],
    "team": [
      {
        "type": "team_size",
        "value": "Minimum 2 people",
        "confidence": 0.7
      }
    ],
    "timeline": [
      {
        "type": "duration",
        "value": "Project duration: 12-24 months",
        "confidence": 0.8
      }
    ],
    "documents": [
      {
        "type": "required_documents",
        "value": "Business plan, CV, project description, financial statements",
        "confidence": 0.9
      }
    ],
    "technical": [
      {
        "type": "technical_requirement",
        "value": "TRL level 4-6 required",
        "confidence": 0.75
      }
    ],
    "legal": [
      {
        "type": "legal_requirement",
        "value": "Must be registered in Austria",
        "confidence": 0.9
      }
    ],
    "impact": [
      {
        "type": "economic_impact",
        "value": "Job creation, regional growth",
        "confidence": 0.8
      }
    ],
    "application": [
      {
        "type": "application_process",
        "value": "Online application via FFG portal",
        "confidence": 0.9
      }
    ],
    "funding_details": [
      {
        "type": "use_of_funds",
        "value": "Personnel costs, equipment, R&D infrastructure",
        "confidence": 0.85
      }
    ],
    "restrictions": [
      {
        "type": "restrictions",
        "value": "No funding for pure marketing projects",
        "confidence": 0.8
      }
    ],
    "terms": [
      {
        "type": "terms",
        "value": "Reporting required every 6 months",
        "confidence": 0.75
      }
    ],
    "compliance": [
      {
        "type": "compliance_requirement",
        "value": "EU state aid rules apply",
        "confidence": 0.9
      }
    ]
  },
  "type": "grant",
  "url": "https://www.ffg.at",
  "selectedAt": "2024-01-15T10:30:00.000Z",
  "metadata": {
    "funding_amount_min": 50000,
    "funding_amount_max": 500000,
    "currency": "EUR"
  }
}
```

**10.4: Navigate to Editor**
```typescript
// Line 530
router.push(`/editor?product=submission`);
```

---

## 📥 Step 11: Editor Loads Program Data

### Location: `features/editor/components/Editor.tsx` (line 113-146)

### What Happens:

**11.1: Read from localStorage**
```typescript
// Line 118-120
const storedProgram = localStorage.getItem('selectedProgram');
if (storedProgram) {
  const programData = JSON.parse(storedProgram);
```

**11.2: Validate Timestamp**
```typescript
// Line 121-135
const selectedAt = programData.selectedAt ? new Date(programData.selectedAt) : null;
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

if (selectedAt && selectedAt > oneHourAgo) {
  // Valid - use it
  setProgramData({
    categorized_requirements: programData.categorized_requirements || {},  // ⭐ 15 categories
    program_name: programData.name || programData.id || 'Selected Program'
  });
} else {
  // Expired - clear it
  localStorage.removeItem('selectedProgram');
  setProgramData(null);
}
```

**11.3: Set Component State**
```typescript
// Line 29-32
const [programData, setProgramData] = useState<{
  categorized_requirements?: any;  // ⭐ 15 categories
  program_name?: string;
} | null>(null);
```

**State After Loading:**
```typescript
programData = {
  categorized_requirements: {
    geographic: [...],
    eligibility: [...],
    financial: [...],
    // ... 15 categories
  },
  program_name: "FFG General Programme"
}
```

---

## 🎯 Step 12: RequirementsModal Uses the Data

### Location: `features/editor/components/Editor.tsx` (line 776-783) → `RequirementsModal.tsx`

### What Happens:

**12.1: Editor Passes Data as Prop**
```typescript
// Line 776-783
<RequirementsModal
  isOpen={showRequirementsModal}
  onClose={() => setShowRequirementsModal(false)}
  sections={sections}
  sectionTemplates={sectionTemplates}
  onNavigateToSection={(index) => setActiveSection(index)}
  programId={programData ? 'selected' : undefined}
  programData={programData || undefined}  // ⭐ Passed here
  onGenerateMissingContent={async (sectionKey) => { ... }}
/>
```

**12.2: RequirementsModal Receives Data**
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
```

**12.3: Extract Requirements for Section**
```typescript
// In RequirementsModal.tsx (line 663-677)
{programData?.categorized_requirements && template.category && (
  <div>
    🎯 Program-Specific Requirements ({programData.program_name})
    {(() => {
      // ⭐ Call helper function
      const programReqs = getProgramRequirementsForSection(
        programData.categorized_requirements,  // ⭐ 15 categories
        template.category                       // e.g., "financial"
      );
      
      if (programReqs.length === 0) {
        return <div>No program-specific requirements for this section</div>;
      }
      
      return (
        <ul>
          {programReqs.map((req, i) => (
            <li key={i}>{req}</li>  // ⭐ Displays: "Minimum 20% own contribution required"
          ))}
        </ul>
      );
    })()}
  </div>
)}
```

**12.4: Helper Function Maps Section → Category**
```typescript
// In RequirementsModal.tsx (line 14-45)
function getProgramRequirementsForSection(
  categorizedRequirements: any,  // ⭐ 15 categories
  sectionCategory: string         // e.g., "financial"
): string[] {
  // Map section category to program requirement category
  const categoryMapping: Record<string, string> = {
    'financial': 'financial',      // "financial" section → "financial" category
    'market': 'market_size',
    'risk': 'compliance',
    'team': 'team',
    'project': 'project',
    'technical': 'technical',
    'impact': 'impact',
    'general': 'eligibility'
  };
  
  const reqCategory = categoryMapping[sectionCategory] || 'eligibility';
  const requirements = categorizedRequirements[reqCategory] || [];  // ⭐ Get category
  
  // Extract values as strings
  return requirements
    .map((req: any) => {
      if (!req.value) return null;
      const value = Array.isArray(req.value) ? req.value.join(', ') : String(req.value);
      return value.length < 200 ? value : null;
    })
    .filter(Boolean) as string[];
}
```

**Example for "financial" section:**
```typescript
// Input:
sectionCategory = "financial"
categorizedRequirements = {
  financial: [
    { type: "co_financing", value: "Minimum 20% own contribution required" },
    { type: "funding_rate", value: "Up to 80% of eligible costs" }
  ]
}

// Process:
reqCategory = "financial"  // From mapping
requirements = categorizedRequirements["financial"]  // Gets array
// Extract values:
["Minimum 20% own contribution required", "Up to 80% of eligible costs"]

// Display:
🎯 Program-Specific Requirements (FFG General Programme)
- Minimum 20% own contribution required
- Up to 80% of eligible costs
```

---

## 🤖 Step 13: aiHelper Uses the Data

### Location: `features/editor/engine/aiHelper.ts` (line 68-137)

### What Happens:

**13.1: aiHelper Called**
```typescript
// In Editor.tsx (line 336)
const response = await aiHelper.generateSectionContent(
  currentSection.key,  // e.g., "financial_plan"
  context,              // Current section content
  programForAI,         // Program object
  []
);
```

**13.2: aiHelper Reads from localStorage**
```typescript
// In aiHelper.ts (line 80-108)
async generateSectionContent(
  section: string,      // e.g., "financial_plan"
  context: string,
  program: Program,
  conversationHistory?: ConversationMessage[]
): Promise<AIResponse> {
  
  let categorizedRequirements: any = null;
  
  if (program.id !== 'default' && typeof window !== 'undefined') {
    // ⭐ Read directly from localStorage
    const storedProgram = localStorage.getItem('selectedProgram');
    if (storedProgram) {
      const programData = JSON.parse(storedProgram);
      if (programData.categorized_requirements) {
        categorizedRequirements = programData.categorized_requirements;  // ⭐ 15 categories
        console.log('✅ Loaded categorized_requirements from localStorage:', 
          Object.keys(categorizedRequirements).length, 'categories');
      }
    }
  }
```

**13.3: Extract Requirements for Section**
```typescript
// In aiHelper.ts (line 234)
const programRequirements = this.getRequirementsForSection(section, categorizedRequirements);
```

**13.4: getRequirementsForSection() Maps Section → Category**
```typescript
// In aiHelper.ts (line 345-396)
private getRequirementsForSection(
  section: string,                    // e.g., "financial_plan"
  categorizedRequirements: any         // ⭐ 15 categories
): string[] {
  // Map section name to category
  const categoryMapping: Record<string, string> = {
    'financial': 'financial',         // "financial_plan" contains "financial" → "financial" category
    'market': 'market_size',
    'risk': 'compliance',
    'team': 'team',
    'project': 'project',
    // ... etc
  };
  
  // Try to match section name to category
  const sectionLower = section.toLowerCase();  // "financial_plan"
  let reqCategory = 'eligibility'; // default
  
  // Check direct mapping
  for (const [key, value] of Object.entries(categoryMapping)) {
    if (sectionLower.includes(key)) {  // "financial_plan" includes "financial"
      reqCategory = value;              // → "financial"
      break;
    }
  }
  
  const requirements = categorizedRequirements[reqCategory] || [];  // ⭐ Get "financial" category
  
  // Extract values as strings
  return requirements
    .map((req: any) => {
      if (!req.value) return null;
      const value = Array.isArray(req.value) ? req.value.join(', ') : String(req.value);
      return value.length < 500 ? value : null;
    })
    .filter(Boolean) as string[];
}
```

**Example for "financial_plan" section:**
```typescript
// Input:
section = "financial_plan"
categorizedRequirements = {
  financial: [
    { type: "co_financing", value: "Minimum 20% own contribution required" },
    { type: "funding_rate", value: "Up to 80% of eligible costs" }
  ]
}

// Process:
sectionLower = "financial_plan"
// Matches "financial" in mapping → reqCategory = "financial"
requirements = categorizedRequirements["financial"]
// Extract values:
["Minimum 20% own contribution required", "Up to 80% of eligible costs"]

// Result:
programRequirements = [
  "Minimum 20% own contribution required",
  "Up to 80% of eligible costs"
]
```

**13.5: Include in AI Prompt**
```typescript
// In aiHelper.ts (line 236-242)
let programRequirementsSection = '';
if (programRequirements && programRequirements.length > 0) {
  programRequirementsSection = `
=== PROGRAM-SPECIFIC REQUIREMENTS FOR ${section.toUpperCase()} ===
${programRequirements.map((req: string) => `- ${req}`).join('\n')}
`;
}
```

**13.6: Build Complete Prompt**
```typescript
// In aiHelper.ts (line 260-336)
return `
You are a senior business consultant with 20+ years of experience...

=== CURRENT CONTENT ===
${context || '(No content yet)'}

=== SECTION: ${section} ===
${templateKnowledgeSection}

${programRequirementsSection}  // ⭐ Includes program requirements here

=== PROGRAM INFORMATION ===
Program: ${program.name} (${program.type})

=== YOUR TASK ===
1. ANALYZE the current content...
2. PROVIDE CONSULTING ADVICE...
3. GENERATE improved content that:
   - Meets program requirements  // ⭐ AI knows about requirements
   - Follows best practices...
4. EXPLAIN your recommendations...
`;
```

**Final AI Prompt Example:**
```
You are a senior business consultant...

=== CURRENT CONTENT ===
[User's current financial plan content]

=== SECTION: financial_plan ===
[Template guidance...]

=== PROGRAM-SPECIFIC REQUIREMENTS FOR FINANCIAL_PLAN ===
- Minimum 20% own contribution required
- Up to 80% of eligible costs

=== PROGRAM INFORMATION ===
Program: FFG General Programme (grant)

=== YOUR TASK ===
1. ANALYZE the current content...
2. PROVIDE CONSULTING ADVICE...
3. GENERATE improved content that:
   - Meets program requirements (20% co-financing, 80% funding rate)
   - Follows best practices...
```

**13.7: AI Generates Content**
- AI receives prompt with program requirements
- Generates content that addresses:
  - "Minimum 20% own contribution required"
  - "Up to 80% of eligible costs"
- Content reflects program-specific requirements

---

## 📊 Complete Data Flow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│ STEP 1: User Answers Q&A                                        │
│ answers = { location: "austria", company_type: "startup", ... } │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 2: Frontend Calls API                                      │
│ POST /api/programs/recommend { answers, max_results: 20 }      │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 3: recommend.ts Receives Request                           │
│ const answers = req.body.answers                                │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 4: generateProgramsWithLLM()                                │
│ - Builds user profile from answers                              │
│ - Calls LLM to generate basic programs                          │
│ - Returns: [{ name, institution, funding_amount, ... }]          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 5: For Each Program: extractWithLLM()                      │
│ - Creates program text description                               │
│ - Calls LLM to extract 15 categories                            │
│ - Returns: { categorized_requirements: { 15 categories } }       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 6: Combine Basic Program + Extracted Requirements          │
│ {                                                               │
│   id, name, url,                                                │
│   metadata: { funding_amount_min, funding_amount_max, ... },    │
│   categorized_requirements: { 15 categories }                    │
│ }                                                               │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 7: API Returns to Frontend                                │
│ { success: true, programs: [{ ... with 15 categories }] }     │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 8: Frontend Processes Results                              │
│ - Converts to Program format                                    │
│ - Scores programs (scoreProgramsEnhanced)                        │
│ - Filters (score > 0), sorts, takes top 5                       │
│ - Sets results state                                            │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 9: Display Results in UI                                   │
│ - Shows program name, score, funding amount                     │
│ - Shows matches (green), gaps (yellow)                          │
│ - Shows "View Details" button                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 10: User Selects Program                                   │
│ handleProgramSelect(program)                                    │
│ - Extracts: { id, name, categorized_requirements, ... }         │
│ - Stores in localStorage.setItem('selectedProgram', ...)         │
│ - Navigates to /editor?product=submission                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ STEP 11: Editor Loads from localStorage                         │
│ - Reads localStorage.getItem('selectedProgram')                 │
│ - Validates timestamp (1 hour expiry)                           │
│ - Sets programData state: { categorized_requirements, ... }     │
└───────┬───────────────────────────────┬──────────────────────────┘
        │                               │
        │                               │
        ▼                               ▼
┌───────────────────────┐   ┌──────────────────────────────┐
│ STEP 12:              │   │ STEP 13:                      │
│ RequirementsModal     │   │ aiHelper                       │
│                       │   │                                │
│ Gets via Props:       │   │ Reads from localStorage:      │
│ programData = {       │   │ localStorage.getItem(         │
│   categorized_        │   │   'selectedProgram'           │
│   requirements        │   │ )                             │
│ }                     │   │                                │
│                       │   │ Then:                         │
│ Uses:                 │   │ - Maps section → category     │
│ getProgramRequirements│   │ - Extracts requirements       │
│ ForSection(           │   │ - Includes in AI prompt       │
│   categorized_         │   │                                │
│   requirements,       │   │ Result:                       │
│   sectionCategory     │   │ AI prompt includes program     │
│ )                     │   │ requirements                  │
│                       │   │                                │
│ Displays in UI:       │   │ AI generates content with     │
│ - "20% co-financing"  │   │ program-specific guidance     │
│ - "Up to 80%"         │   │                                │
└───────────────────────┘   └──────────────────────────────┘
```

---

## 🎯 What Data Do aiHelper and RequirementsModal Get?

### Both Get the Same Data:

**Source:** `localStorage.getItem('selectedProgram')`

**Data Structure:**
```typescript
{
  id: "llm_ffg_general_programme",
  name: "FFG General Programme",
  categorized_requirements: {
    geographic: [
      { type: "location", value: "Companies must be based in Austria...", confidence: 0.9 }
    ],
    eligibility: [
      { type: "company_type", value: "Startups and SMEs", confidence: 0.85 },
      { type: "company_stage", value: "Early-stage companies less than 3 years old", confidence: 0.8 }
    ],
    financial: [
      { type: "co_financing", value: "Minimum 20% own contribution required", confidence: 0.8 },
      { type: "funding_rate", value: "Up to 80% of eligible costs", confidence: 0.75 }
    ],
    project: [
      { type: "innovation_focus", value: "Digital transformation, Industry 4.0, AI", confidence: 0.85 }
    ],
    team: [
      { type: "team_size", value: "Minimum 2 people", confidence: 0.7 }
    ],
    timeline: [
      { type: "duration", value: "Project duration: 12-24 months", confidence: 0.8 }
    ],
    documents: [
      { type: "required_documents", value: "Business plan, CV, project description...", confidence: 0.9 }
    ],
    technical: [
      { type: "technical_requirement", value: "TRL level 4-6 required", confidence: 0.75 }
    ],
    legal: [
      { type: "legal_requirement", value: "Must be registered in Austria", confidence: 0.9 }
    ],
    impact: [
      { type: "economic_impact", value: "Job creation, regional growth", confidence: 0.8 }
    ],
    application: [
      { type: "application_process", value: "Online application via FFG portal", confidence: 0.9 }
    ],
    funding_details: [
      { type: "use_of_funds", value: "Personnel costs, equipment, R&D infrastructure", confidence: 0.85 }
    ],
    restrictions: [
      { type: "restrictions", value: "No funding for pure marketing projects", confidence: 0.8 }
    ],
    terms: [
      { type: "terms", value: "Reporting required every 6 months", confidence: 0.75 }
    ],
    compliance: [
      { type: "compliance_requirement", value: "EU state aid rules apply", confidence: 0.9 }
    ]
  },
  type: "grant",
  url: "https://www.ffg.at",
  selectedAt: "2024-01-15T10:30:00.000Z",
  metadata: {
    funding_amount_min: 50000,
    funding_amount_max: 500000,
    currency: "EUR"
  }
}
```

### How They Use It:

**RequirementsModal:**
- Gets `programData.categorized_requirements` via props
- Maps section category → requirement category
- Extracts values: `["Minimum 20% own contribution required", "Up to 80% of eligible costs"]`
- Displays in UI

**aiHelper:**
- Reads `categorized_requirements` from localStorage
- Maps section name → requirement category
- Extracts values: `["Minimum 20% own contribution required", "Up to 80% of eligible costs"]`
- Includes in AI prompt
- AI generates content addressing these requirements

---

## 🔄 How Reco and llmExtract Work Together

### Architecture:

```
recommend.ts (API endpoint)
    ↓
generateProgramsWithLLM() → Basic programs (name, institution, funding, etc.)
    ↓
For each program:
    extractWithLLM() (from llmExtract.ts) → Detailed 15 categories
    ↓
Combine: Basic program + 15 categories
    ↓
Return to frontend
```

### Key Points:

1. **recommend.ts** = API endpoint that orchestrates the flow
2. **generateProgramsWithLLM()** = Generates basic program suggestions (like ChatGPT)
3. **extractWithLLM()** = Extracts detailed requirements (15 categories) from program text
4. **Two LLM calls:**
   - Call 1: Generate programs (basic info)
   - Call 2-N: Extract requirements (detailed, per program)

### Why Two Calls?

- **Separation of concerns:** Generation vs. extraction
- **Reusability:** `extractWithLLM()` can be used elsewhere
- **Quality:** Detailed extraction requires different prompt than generation

---

## ✅ Summary

**Complete Flow:**
1. User answers Q&A → `answers` object
2. Frontend calls API → `POST /api/programs/recommend`
3. API calls `generateProgramsWithLLM()` → Basic programs
4. API calls `extractWithLLM()` for each → 15 categories
5. API combines → Complete programs with requirements
6. Frontend receives → Programs with 15 categories
7. Frontend scores/displays → Top 5 programs
8. User selects → Stored in localStorage
9. Editor loads → Reads from localStorage
10. RequirementsModal → Gets via props, displays requirements
11. aiHelper → Reads from localStorage, includes in AI prompts

**Data Format:**
- **15 categories** extracted by `llmExtract.ts`
- **Same format** used by both reco (scoring) and editor (AI prompts, display)
- **localStorage** transmission from ProgramFinder to Editor

**Both components get the same data and use it the same way!** ✅

---

**Last Updated:** 2024-01-XX
**Status:** Complete detailed flow documented

