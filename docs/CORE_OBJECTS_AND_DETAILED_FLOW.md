# 🧱 CORE OBJECTS & DETAILED FLOW DOCUMENTATION

## 🎯 SYSTEM OVERVIEW

This document describes the exact data flow and object transformations in the Plan2Fund system. Everything in the system converts into exactly 6 core objects - no exceptions.

---

# 🧱 CORE OBJECTS (ONLY THESE MATTER)
────────────────────────────────

## 1. ProjectProfile
**Location:** `platform/core/types/project.ts`
**Purpose:** Base context containing all user business information
**Fields:**
```typescript
interface ProjectProfile {
  id: string;
  userId: string;
  businessName: string;
  country: string;
  businessStage: BusinessStage;
  industry: string;
  businessObjective: string;
  createdAt: Date;
  updatedAt: Date;
}
```
**Usage:** Passed to every analyzer and generator as base context

## 2. FundingProgram
**Location:** `platform/core/types/program.ts`
**Purpose:** Standardized funding program representation
**Fields:**
```typescript
interface FundingProgram {
  id: string;
  name: string;
  description: string;
  fundingType: FundingType;
  maxAmount: number;
  minAmount: number;
  requiredDocuments: DocumentRequirement[];
  requiredSections: SectionRequirement[];
  financialRequirements: FinancialRequirement[];
  eligibilityCriteria: EligibilityCriterion[];
  evaluationCriteria: EvaluationCriterion[];
  applicationProcess: ApplicationStep[];
}
```
**Normalization Rules:**
- All funding types mapped to standardized enum
- Documents converted to structured requirements
- Sections standardized with IDs and descriptions
- Financial data normalized to common format

## 3. ParsedDocument
**Location:** `platform/core/types/document.ts`
**Purpose:** Analyzed document with detected structure
**Fields:**
```typescript
interface ParsedDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  detectedSections: DetectedSection[];
  detectedHeadings: Heading[];
  financialData: FinancialData | null;
  weaknesses: DocumentWeakness[];
  missingSections: string[];
  sanitizedContent: string;
  createdAt: Date;
}
```
**Processing Pipeline:**
1. Security sanitization (remove scripts, malicious content)
2. Structure detection (headings, sections, tables)
3. Financial data extraction
4. Weakness identification
5. Missing section detection

## 4. DocumentStructure ⭐ MOST IMPORTANT
**Location:** `platform/core/types/index.ts`
**Purpose:** Single source of truth for document organization
**Fields:**
```typescript
interface DocumentStructure {
  projectId: string;
  programId?: string;
  sections: SectionDefinition[];
  documents: DocumentDefinition[];
  requiredSections: string[];
  missingSections: string[];
  aiPrompts: Record<string, string>;
  validationRules: ValidationRule[];
  evidenceRequirements: EvidenceRequirement[];
}
```
**Creation Process:**
- Merge program requirements
- Integrate uploaded content structure
- Apply template if present
- Validate completeness
- Attach AI generation prompts

## 5. Blueprint
**Location:** `platform/generation/blueprint/index.ts`
**Purpose:** AI instruction layer with generation parameters
**Fields:**
```typescript
interface Blueprint {
  projectId: string;
  structureReference: DocumentStructure;
  programAlignment?: FundingProgram;
  generationPrompts: SectionPrompt[];
  toneGuidelines: ToneGuideline[];
  referenceMaterials: ReferenceMaterial[];
  documentSettings: DocumentSetting[];
  evidenceInstructions: EvidenceInstruction[];
}
```
**Components:**
- Section-specific AI prompts
- Program alignment instructions
- Tone and style guidelines
- Reference material pointers
- Evidence collection guidance

## 6. Plan
**Location:** `platform/core/types/project.ts`
**Purpose:** Editable business plan with actual content
**Fields:**
```typescript
interface Plan {
  projectId: string;
  sections: PlanSection[];
  financialProjections: FinancialProjection[];
  metadata: PlanMetadata;
  lastGeneratedAt: Date;
  version: number;
}

interface PlanSection {
  id: string;
  title: string;
  content: string;
  placeholders: Placeholder[];
  financialPlaceholders: FinancialPlaceholder[];
  status: SectionStatus;
  aiSuggestions: AISuggestion[];
}
```
**Lifecycle:**
- Generated from Blueprint
- Loaded into editor
- Continuously updated by user
- Enhanced by AI assistant

⚠️ **STRICT RULE:** If any component creates its own custom format → it MUST be removed and converted to one of these 6 core objects.

✅ **Golden Rule:** Everything in the system converts INTO these 6 objects only.

---

# ────────────────────────────────
STEP-BY-STEP FLOW (REAL PIPELINE)
────────────────────────────────

## STEP 1 — USER CREATES PROJECT
**Trigger:** User fills project creation form
**File:** `platform/core/store/useProjectStore.ts`
**Function:** `createProject()`
**Implementation:**
```typescript
const createProject = async (data: ProjectFormData) => {
  const profile: ProjectProfile = {
    id: generateId(),
    userId: currentUser.id,
    businessName: data.businessName,
    country: data.country,
    businessStage: data.businessStage,
    industry: data.industry,
    businessObjective: data.objective,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  await saveToDatabase(profile);
  setProjectProfile(profile);
  return profile;
};
```
**Output:** `ProjectProfile` object
**Nothing else is created at this stage.**

This becomes the base context passed to all subsequent operations.

## STEP 2A — PROGRAM SELECTED
**Trigger:** User selects program via recommendation or manual selection
**Files Involved:**
- `platform/reco/components/ProgramFinder.tsx` (UI)
- `platform/analysis/internal/programPersistence.ts` (storage)
- `platform/analysis/program-flow/normalizer.ts` (normalization)

**Input Sources:**
1. Raw program JSON from external APIs
2. Recommendation engine results
3. Manual program selection

**Processing Flow:**
```typescript
// Entry point: platform/reco/lib/programPersistence.ts
async function persistSelectedProgram(rawProgram: any, projectId: string) {
  // Step 1: Normalize raw data
  const normalized = await normalizeProgramData(rawProgram);
  
  // Step 2: Validate against schema
  const validated = validateFundingProgram(normalized);
  
  // Step 3: Store in database
  await database.programs.save({
    ...validated,
    projectId,
    selectionDate: new Date()
  });
  
  return validated;
}

// Normalization: platform/analysis/program-flow/normalizer.ts
async function normalizeProgramData(rawData: any): Promise<FundingProgram> {
  return {
    id: rawData.id || generateId(),
    name: rawData.name,
    description: rawData.description,
    fundingType: mapFundingType(rawData.type),
    maxAmount: parseCurrency(rawData.maxAmount),
    minAmount: parseCurrency(rawData.minAmount),
    requiredDocuments: normalizeDocuments(rawData.documents),
    requiredSections: normalizeSections(rawData.sections),
    financialRequirements: normalizeFinancialReq(rawData.financials),
    eligibilityCriteria: normalizeEligibility(rawData.eligibility),
    evaluationCriteria: normalizeEvaluation(rawData.evaluation),
    applicationProcess: normalizeProcess(rawData.process)
  };
}
```

**Normalization Requirements:**
- ✅ **Funding Type Mapping:** Convert vendor-specific types to standard enum
- ✅ **Document Standardization:** Structure documents with IDs, names, descriptions
- ✅ **Section Alignment:** Map program sections to standard section IDs
- ✅ **Financial Data Parsing:** Convert currency formats, extract key metrics
- ✅ **Eligibility Criteria:** Structure requirements with operators and values
- ✅ **Evaluation Standards:** Create standardized scoring criteria

**Output:** Single `FundingProgram` object stored in database
**Restriction:** No intermediate formats allowed - direct conversion only.

## STEP 2B — DOCUMENT UPLOAD
**Trigger:** User uploads existing business document
**Primary File:** `platform/analysis/documentAnalyzer.ts`
**Supporting Files:**
- `platform/analysis/internal/document-flows/documentProcessor.ts`
- `platform/analysis/internal/document-flows/processUploadedDocument.ts`
- `platform/analysis/internal/document-flows/structureDetection.ts`
- `platform/ai/parsers/sanitizers.ts`

**Complete Processing Pipeline:**

```typescript
// Entry point: platform/analysis/documentAnalyzer.ts
async function analyzeDocument(file: File, projectId: string): Promise<ParsedDocument> {
  // Step 1: Initial processing
  const processed = await processUploadedDocument(file);
  
  // Step 2: Security sanitization
  const sanitized = await sanitizeDocumentContent(processed.content);
  
  // Step 3: Structure analysis
  const structure = await detectDocumentStructure(sanitized);
  
  // Step 4: Financial data extraction
  const financials = await extractFinancialData(structure);
  
  // Step 5: Quality assessment
  const weaknesses = await identifyDocumentWeaknesses(structure);
  const missingSections = await findMissingRequiredSections(structure, projectId);
  
  // Step 6: Create normalized object
  const parsedDocument: ParsedDocument = {
    id: generateId(),
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    detectedSections: structure.sections,
    detectedHeadings: structure.headings,
    financialData: financials,
    weaknesses,
    missingSections,
    sanitizedContent: sanitized,
    createdAt: new Date()
  };
  
  // Step 7: Store in database
  await database.documents.save({
    ...parsedDocument,
    projectId
  });
  
  return parsedDocument;
}
```

**Detailed Normalization Steps:**

1. **Security Sanitization** (`platform/ai/parsers/sanitizers.ts`):
   ```typescript
   function sanitizeDocumentContent(content: string): Promise<string> {
     return content
       .replace(/<script[^>]*>.*?<\/script>/gi, '') // Remove scripts
       .replace(/on\w+\s*=\s*["'][^"']*[\"']/gi, '') // Remove event handlers
       .replace(/javascript:/gi, '') // Remove javascript protocols
       .trim();
   }
   ```

2. **Structure Detection** (`platform/analysis/internal/document-flows/structureDetection.ts`):
   ```typescript
   async function detectDocumentStructure(content: string) {
     const headings = extractHeadings(content);
     const sections = groupContentByHeadings(content, headings);
     const tables = extractTables(content);
     const lists = extractLists(content);
     
     return { headings, sections, tables, lists };
   }
   ```

3. **Financial Extraction**:
   ```typescript
   async function extractFinancialData(structure: DocumentStructure) {
     const revenue = findMonetaryValues(structure, 'revenue');
     const expenses = findMonetaryValues(structure, 'expenses');
     const projections = findFinancialProjections(structure);
     
     return {
       historicalRevenue: revenue,
       operatingExpenses: expenses,
       financialProjections: projections
     };
   }
   ```

4. **Quality Assessment**:
   ```typescript
   async function identifyDocumentWeaknesses(structure: DocumentStructure) {
     const weaknesses = [];
     
     if (!hasExecutiveSummary(structure)) {
       weaknesses.push({
         type: 'missing_section',
         severity: 'high',
         suggestion: 'Add executive summary'
       });
     }
     
     if (!hasMarketAnalysis(structure)) {
       weaknesses.push({
         type: 'missing_section',
         severity: 'medium',
         suggestion: 'Include market analysis'
       });
     }
     
     return weaknesses;
   }
   ```

**Output:** Single `ParsedDocument` object with fully analyzed and normalized content
**Rule:** System never handles raw text - always wrapped in `ParsedDocument` structure.

## STEP 2C — STANDARD TEMPLATE (FREE MODE)
**Trigger:** User selects "Start from Template" option
**Files Involved:**
- `platform/templates/catalog/products/businessPlanTemplate.ts`
- `platform/analysis/documentAnalyzer.ts` (reused)
- `platform/templates/general/templateConstants.ts`

**Process:** Templates undergo same analysis pipeline as uploaded documents

```typescript
// Entry point: platform/templates/actions/addCustomDocument.ts
async function createFromTemplate(templateId: string, projectId: string): Promise<ParsedDocument> {
  // Step 1: Load template
  const template = await loadTemplate(templateId);
  
  // Step 2: Convert to document-like structure
  const templateAsDocument = {
    content: template.content,
    structure: template.structure,
    metadata: {
      source: 'template',
      templateId: templateId
    }
  };
  
  // Step 3: Apply same document analysis pipeline
  const parsedDocument = await analyzeDocumentLikeContent(
    templateAsDocument,
    projectId
  );
  
  return parsedDocument;
}

// Reuse document analyzer with template content
async function analyzeDocumentLikeContent(contentObj: any, projectId: string): Promise<ParsedDocument> {
  // Same pipeline as STEP 2B but with template content
  const processed = await processTemplateContent(contentObj.content);
  const sanitized = await sanitizeDocumentContent(processed);
  const structure = await detectDocumentStructure(sanitized);
  
  // Template-specific processing
  const placeholders = identifyTemplatePlaceholders(structure);
  const defaultContent = generateDefaultSectionContent(structure);
  
  return {
    id: generateId(),
    fileName: `template-${contentObj.metadata.templateId}.txt`,
    fileType: 'text/plain',
    fileSize: sanitized.length,
    detectedSections: structure.sections.map(section => ({
      ...section,
      isPlaceholder: true,
      defaultContent: defaultContent[section.id]
    })),
    detectedHeadings: structure.headings,
    financialData: null, // Templates typically don't have financials
    weaknesses: [],
    missingSections: [],
    sanitizedContent: sanitized,
    createdAt: new Date()
  };
}
```

**Key Principle:** Templates are NOT treated as special cases
- ✅ Same security sanitization applied
- ✅ Same structure detection used
- ✅ Same weakness identification performed
- ✅ Output is IDENTICAL `ParsedDocument` format

**Template Catalog Location:** `platform/templates/catalog/products/`
- Business plan templates
- Executive summary templates
- Financial projection templates

**Output:** `ParsedDocument` object indistinguishable from uploaded documents

## STEP 3 — STRUCTURE BUILD (MOST IMPORTANT STEP)
**Trigger:** User clicks "Generate Structure" or automatic after steps 1-2C
**Primary File:** `platform/generation/structure/structureBuilder.ts`
**Dependencies:** All previous steps must complete first

**Input Matrix:**
| Input | Required | Source |
|-------|----------|---------|
| ProjectProfile | ✅ Always | Step 1 |
| FundingProgram | ❌ Optional | Step 2A |
| Uploaded ParsedDocument | ❌ Optional | Step 2B |
| Template ParsedDocument | ❌ Optional | Step 2C |

**Core Algorithm - Structure Builder:**

```typescript
// Entry point: platform/generation/structure/structureBuilder.ts
async function buildDocumentStructure(inputs: StructureInputs): Promise<DocumentStructure> {
  const { projectProfile, fundingProgram, uploadedDoc, templateDoc } = inputs;
  
  // Step 1: Initialize base structure
  let structure: Partial<DocumentStructure> = {
    projectId: projectProfile.id,
    programId: fundingProgram?.id,
    sections: [],
    documents: [],
    requiredSections: [],
    missingSections: [],
    aiPrompts: {},
    validationRules: [],
    evidenceRequirements: []
  };
  
  // Step 2: Apply program requirements (highest priority)
  if (fundingProgram) {
    structure = await integrateProgramRequirements(structure, fundingProgram);
  }
  
  // Step 3: Merge uploaded document structure
  if (uploadedDoc) {
    structure = await mergeUploadedDocument(structure, uploadedDoc);
  }
  
  // Step 4: Apply template structure
  if (templateDoc) {
    structure = await mergeTemplateStructure(structure, templateDoc);
  }
  
  // Step 5: Final validation and cleanup
  structure = await validateAndFinalize(structure);
  
  // Step 6: Generate AI prompts
  structure.aiPrompts = await generateSectionPrompts(structure);
  
  // Step 7: Attach validation rules
  structure.validationRules = await generateValidationRules(structure);
  
  // Step 8: Store in database
  await database.structures.save(structure as DocumentStructure);
  
  return structure as DocumentStructure;
}

// Program requirement integration
async function integrateProgramRequirements(
  structure: Partial<DocumentStructure>, 
  program: FundingProgram
): Promise<Partial<DocumentStructure>> {
  
  // Add required sections
  const requiredSections = program.requiredSections.map(req => ({
    id: req.sectionId,
    title: req.title,
    description: req.description,
    isRequired: true,
    programSource: program.id
  }));
  
  // Add required documents
  const requiredDocs = program.requiredDocuments.map(doc => ({
    id: doc.documentId,
    name: doc.name,
    description: doc.description,
    isRequired: true,
    evidenceType: doc.evidenceType
  }));
  
  // Mark sections as required
  const requiredSectionIds = requiredSections.map(s => s.id);
  
  return {
    ...structure,
    sections: [...structure.sections || [], ...requiredSections],
    documents: [...structure.documents || [], ...requiredDocs],
    requiredSections: [...structure.requiredSections || [], ...requiredSectionIds]
  };
}

// Content merging logic
async function mergeUploadedDocument(
  structure: Partial<DocumentStructure>,
  document: ParsedDocument
): Promise<Partial<DocumentStructure>> {
  
  // Convert detected sections to standard format
  const contentSections = document.detectedSections.map(detected => ({
    id: generateSectionId(detected.title),
    title: detected.title,
    content: detected.content,
    sourceDocument: document.id,
    isFromUpload: true
  }));
  
  // Identify missing required sections
  const existingSectionIds = contentSections.map(s => s.id);
  const missingRequired = structure.requiredSections?.filter(
    reqId => !existingSectionIds.includes(reqId)
  ) || [];
  
  return {
    ...structure,
    sections: [...structure.sections || [], ...contentSections],
    missingSections: [...structure.missingSections || [], ...missingRequired]
  };
}
```

**Normalization Performed:**
1. **Section List Creation:** Unified section definitions from all sources
2. **Document List Generation:** Required evidence documentation
3. **Requirement Marking:** Clear distinction between required/optional
4. **Gap Analysis:** Identification of missing sections
5. **AI Prompt Attachment:** Custom prompts per section
6. **Validation Rule Generation:** Automated quality checks
7. **Evidence Requirements:** Documentation needed for each section

**Single Source of Truth Principle:**
- ✅ Only ONE `DocumentStructure` definition allowed per project
- ✅ Stored in `platform/core/types/index.ts`
- ✅ Referenced by ALL subsequent steps
- ✅ If duplicates exist → system deletes conflicting versions

**Output:** Complete `DocumentStructure` object ready for AI processing

## STEP 4 — BLUEPRINT CREATION
**Trigger:** Document structure is built and validated
**Primary File:** `platform/generation/blueprint/index.ts`
**Purpose:** Create AI instruction layer with generation parameters

**Required Inputs:**
- ✅ `ProjectProfile` (from Step 1)
- ✅ `DocumentStructure` (from Step 3)
- ❌ `FundingProgram` (optional, from Step 2A)

**Blueprint Generation Process:**

```typescript
// Entry point: platform/generation/blueprint/index.ts
async function createBlueprint(inputs: BlueprintInputs): Promise<Blueprint> {
  const { projectProfile, documentStructure, fundingProgram } = inputs;
  
  // Step 1: Generate section-specific prompts
  const sectionPrompts = await generateSectionPrompts(documentStructure, projectProfile);
  
  // Step 2: Create program alignment instructions
  const alignmentInstructions = fundingProgram 
    ? await createProgramAlignment(fundingProgram, documentStructure)
    : [];
  
  // Step 3: Define tone and style guidelines
  const toneGuidelines = await determineAppropriateTone(projectProfile, fundingProgram);
  
  // Step 4: Compile reference materials
  const references = await gatherReferenceMaterials(projectProfile, documentStructure);
  
  // Step 5: Set document configuration
  const documentSettings = await configureDocumentSettings(documentStructure);
  
  // Step 6: Create evidence collection instructions
  const evidenceInstructions = await createEvidenceInstructions(documentStructure);
  
  // Assemble final blueprint
  const blueprint: Blueprint = {
    projectId: projectProfile.id,
    structureReference: documentStructure,
    programAlignment: fundingProgram || undefined,
    generationPrompts: sectionPrompts,
    toneGuidelines,
    referenceMaterials: references,
    documentSettings,
    evidenceInstructions
  };
  
  // Store blueprint
  await database.blueprints.save(blueprint);
  
  return blueprint;
}

// Section prompt generation
async function generateSectionPrompts(
  structure: DocumentStructure,
  profile: ProjectProfile
): Promise<SectionPrompt[]> {
  
  return structure.sections.map(section => {
    const basePrompt = structure.aiPrompts[section.id] || DEFAULT_SECTION_PROMPT;
    
    return {
      sectionId: section.id,
      prompt: customizePrompt(basePrompt, {
        businessName: profile.businessName,
        industry: profile.industry,
        country: profile.country,
        businessStage: profile.businessStage,
        sectionTitle: section.title,
        sectionDescription: section.description
      }),
      contextRequirements: [
        `Focus on ${profile.industry} industry in ${profile.country}`,
        `Business stage: ${profile.businessStage}`,
        `Align with: ${section.title} requirements`
      ],
      outputFormat: 'professional_business_writing',
      lengthGuidance: 'comprehensive_but_concise'
    };
  });
}

// Program alignment creation
async function createProgramAlignment(
  program: FundingProgram,
  structure: DocumentStructure
): Promise<AlignmentInstruction[]> {
  
  return program.evaluationCriteria.map(criteria => ({
    criterionId: criteria.id,
    description: criteria.description,
    weight: criteria.weight,
    alignmentPrompt: `Emphasize how this addresses: ${criteria.description}`,
    requiredEvidence: criteria.requiredEvidenceTypes
  }));
}
```

**Blueprint Components Detailed:**

1. **Section Generation Prompts:**
   - Custom AI instructions per document section
   - Context-aware prompting with business details
   - Industry-specific guidance
   - Length and format specifications

2. **Program Alignment Instructions:**
   - Mapping to evaluation criteria
   - Emphasis areas for funding success
   - Required evidence highlighting
   - Scoring optimization guidance

3. **Tone Guidelines:**
   - Professional business writing style
   - Industry-appropriate terminology
   - Confidence level calibration
   - Cultural sensitivity considerations

4. **Reference Materials:**
   - Industry benchmarks
   - Market data sources
   - Regulatory references
   - Best practice examples

5. **Document Settings:**
   - Formatting specifications
   - Section ordering rules
   - Content hierarchy
   - Submission requirements

6. **Evidence Instructions:**
   - Required documentation list
   - Evidence collection guidance
   - Supporting material suggestions
   - Verification requirements

**Output:** Complete `Blueprint` object containing all AI generation instructions

## STEP 5 — PLAN DRAFT GENERATION
**Trigger:** Blueprint is created and validated
**Primary File:** `platform/generation/plan/instantiation.ts`
**Alternative:** `platform/generation/plan/sectionWriter.ts` for iterative generation

**Generation Methods:**

### Method A: Bulk Generation (Fast)
```typescript
// Entry point: platform/generation/plan/instantiation.ts
async function generateFullDraft(blueprint: Blueprint): Promise<Plan> {
  const { projectProfile, structureReference, generationPrompts } = blueprint;
  
  // Generate all sections in parallel
  const sectionPromises = generationPrompts.map(prompt =>
    generateSectionContent(prompt, projectProfile)
  );
  
  const generatedSections = await Promise.all(sectionPromises);
  
  // Assemble complete plan
  const plan: Plan = {
    projectId: projectProfile.id,
    sections: generatedSections.map((content, index) => ({
      id: generateSectionId(generationPrompts[index].sectionId),
      title: generationPrompts[index].sectionTitle,
      content: content.text,
      placeholders: content.placeholders,
      financialPlaceholders: content.financialPlaceholders,
      status: 'generated',
      aiSuggestions: content.suggestions
    })),
    financialProjections: await generateFinancialProjections(blueprint),
    metadata: {
      generationMethod: 'bulk',
      blueprintVersion: blueprint.version,
      createdAt: new Date()
    },
    lastGeneratedAt: new Date(),
    version: 1
  };
  
  // Store plan
  await database.plans.save(plan);
  
  return plan;
}
```

### Method B: Iterative Generation (Higher Quality)
```typescript
// Entry point: platform/generation/plan/sectionWriter.ts
async function generateIterativeDraft(blueprint: Blueprint): Promise<Plan> {
  const planSections: PlanSection[] = [];
  
  // Generate sections one by one with refinement
  for (const prompt of blueprint.generationPrompts) {
    let content = await generateInitialContent(prompt, blueprint.projectProfile);
    
    // Apply program alignment
    if (blueprint.programAlignment) {
      content = await alignWithProgramRequirements(
        content,
        blueprint.programAlignment
      );
    }
    
    // Add quality improvements
    content = await enhanceContentQuality(content, prompt);
    
    planSections.push({
      id: generateSectionId(prompt.sectionId),
      title: prompt.sectionTitle,
      content: content.finalText,
      placeholders: content.placeholders,
      financialPlaceholders: content.financialPlaceholders,
      status: 'refined',
      aiSuggestions: content.improvementSuggestions
    });
  }
  
  const plan: Plan = {
    projectId: blueprint.projectProfile.id,
    sections: planSections,
    financialProjections: await generateDetailedFinancials(blueprint),
    metadata: {
      generationMethod: 'iterative',
      refinementRounds: 3,
      qualityScore: await calculatePlanQuality(planSections)
    },
    lastGeneratedAt: new Date(),
    version: 1
  };
  
  return plan;
}
```

**Plan Object Structure:**
```typescript
interface Plan {
  projectId: string;
  sections: PlanSection[];
  financialProjections: FinancialProjection[];
  metadata: {
    generationMethod: 'bulk' | 'iterative';
    blueprintVersion: number;
    refinementRounds?: number;
    qualityScore?: number;
    createdAt: Date;
  };
  lastGeneratedAt: Date;
  version: number;
}

interface PlanSection {
  id: string;
  title: string;
  content: string;
  placeholders: {
    id: string;
    type: 'business_data' | 'financial' | 'market';
    description: string;
    defaultValue?: string;
  }[];
  financialPlaceholders: {
    metric: string;
    year: number;
    currentValue?: number;
    source: 'projection' | 'historical' | 'estimate';
  }[];
  status: 'generated' | 'refined' | 'user_edited' | 'ai_improved';
  aiSuggestions: {
    type: 'improvement' | 'expansion' | 'clarification';
    suggestion: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}
```

**Content Generation Features:**
- ✅ **Smart Placeholders:** Auto-identified areas needing user input
- ✅ **Financial Integration:** Linked financial projections
- ✅ **Quality Metadata:** Tracking generation method and quality scores
- ✅ **AI Suggestions:** Built-in improvement recommendations
- ✅ **Version Control:** Track plan evolution

**Editor Loading:**
```typescript
// In editor component
useEffect(() => {
  if (plan) {
    loadPlanIntoEditor(plan);
    initializeAiAssistant(plan);
    setupAutoSave(plan.projectId);
  }
}, [plan]);
```

**User Experience:**
- ✅ Full written draft appears in editor immediately
- ✅ Placeholders highlighted for easy identification
- ✅ AI suggestions available inline
- ✅ Ready for user editing and refinement

**Output:** Complete `Plan` object loaded into editor UI

## STEP 6 — EDITOR + AI ASSISTANT
**Trigger:** User opens editor with generated plan
**Primary Files:**
- `pages/api/ai/assistant.ts` (API endpoint)
- `platform/ai/orchestrator.ts` (core logic)
- `features/editor/components/Editor/Editor.tsx` (UI)

**System State When Activated:**
- ✅ `ProjectProfile` exists (Step 1)
- ✅ `DocumentStructure` exists (Step 3)
- ✅ `Plan` exists with content (Step 5)
- ❌ `FundingProgram` may or may not exist (Step 2A)

**AI Assistant Architecture:**

```typescript
// Entry point: pages/api/ai/assistant.ts
async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { action, sectionId, prompt, context } = req.body;
  
  // Load required context
  const projectProfile = await loadProjectProfile(context.projectId);
  const documentStructure = await loadDocumentStructure(context.projectId);
  const currentPlan = await loadCurrentPlan(context.projectId);
  const fundingProgram = await loadFundingProgram(context.projectId);
  
  // Route to appropriate AI service
  const result = await aiOrchestrator.execute({
    action,
    sectionId,
    prompt,
    context: {
      projectProfile,
      documentStructure,
      currentPlan,
      fundingProgram
    }
  });
  
  res.status(200).json(result);
}

// Core orchestration: platform/ai/orchestrator.ts
class AIOrchestrator {
  async execute(request: AIRequest): Promise<AIResponse> {
    const { action, context } = request;
    
    switch (action) {
      case 'rewrite_section':
        return await this.rewriteSection(request);
      
      case 'improve_content':
        return await this.improveContent(request);
      
      case 'align_with_funding':
        return await this.alignWithFunding(request);
      
      case 'detect_weaknesses':
        return await this.detectWeaknesses(request);
      
      case 'suggest_missing_parts':
        return await this.suggestMissingParts(request);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  private async rewriteSection(request: AIRequest): Promise<AIResponse> {
    const { sectionId, prompt, context } = request;
    const section = context.currentPlan.sections.find(s => s.id === sectionId);
    
    const rewrittenContent = await this.llmClient.generate({
      prompt: this.buildRewritePrompt(prompt, section, context),
      temperature: 0.7,
      maxTokens: 2000
    });
    
    return {
      action: 'rewrite_section',
      sectionId,
      newContent: rewrittenContent,
      changes: this.calculateChanges(section.content, rewrittenContent)
    };
  }
  
  private async improveContent(request: AIRequest): Promise<AIResponse> {
    const { sectionId, context } = request;
    const section = context.currentPlan.sections.find(s => s.id === sectionId);
    
    const improvements = await this.llmClient.analyze({
      content: section.content,
      analysisType: 'content_improvement',
      context: {
        projectProfile: context.projectProfile,
        documentStructure: context.documentStructure,
        fundingProgram: context.fundingProgram
      }
    });
    
    return {
      action: 'improve_content',
      sectionId,
      suggestions: improvements.suggestions,
      improvedContent: improvements.enhancedContent
    };
  }
  
  private async alignWithFunding(request: AIRequest): Promise<AIResponse> {
    if (!request.context.fundingProgram) {
      return {
        action: 'align_with_funding',
        error: 'No funding program selected'
      };
    }
    
    const alignmentSuggestions = await this.generateAlignmentSuggestions(
      request.context.currentPlan,
      request.context.fundingProgram,
      request.context.documentStructure
    );
    
    return {
      action: 'align_with_funding',
      suggestions: alignmentSuggestions
    };
  }
  
  private async detectWeaknesses(request: AIRequest): Promise<AIResponse> {
    const weaknesses = await this.analyzePlanWeaknesses(
      request.context.currentPlan,
      request.context.documentStructure
    );
    
    return {
      action: 'detect_weaknesses',
      weaknesses: weaknesses.map(w => ({
        sectionId: w.sectionId,
        type: w.type,
        severity: w.severity,
        description: w.description,
        suggestion: w.suggestion
      }))
    };
  }
  
  private async suggestMissingParts(request: AIRequest): Promise<AIResponse> {
    const missingSuggestions = await this.identifyMissingContent(
      request.context.currentPlan,
      request.context.documentStructure
    );
    
    return {
      action: 'suggest_missing_parts',
      suggestions: missingSuggestions
    };
  }
}
```

**Available AI Actions:**

1. **Rewrite Section:**
   - Complete section regeneration
   - Style/tone adjustment
   - Length modification
   - Focus area changes

2. **Improve Content:**
   - Grammar and clarity enhancement
   - Professional tone improvement
   - Structure optimization
   - Impact amplification

3. **Align with Funding:**
   - Program requirement mapping
   - Evaluation criterion emphasis
   - Scoring optimization
   - Evidence integration

4. **Detect Weaknesses:**
   - Content gap identification
   - Quality assessment
   - Compliance checking
   - Risk highlighting

5. **Suggest Missing Parts:**
   - Required section identification
   - Content expansion opportunities
   - Evidence gaps
   - Supporting material needs

**Real-time Plan Updates:**
```typescript
// In editor component
const handleAiSuggestion = async (suggestion: AISuggestion) => {
  const updatedPlan = await applyAiSuggestion(currentPlan, suggestion);
  
  // Update local state
  setCurrentPlan(updatedPlan);
  
  // Save to database
  await savePlanVersion(updatedPlan);
  
  // Update UI
  updateEditorContent(suggestion.sectionId, suggestion.newContent);
};

// Auto-save with versioning
useEffect(() => {
  const autoSaveTimer = setTimeout(async () => {
    if (hasUnsavedChanges) {
      await savePlanWithVersion(currentPlan);
      setHasUnsavedChanges(false);
    }
  }, 3000);
  
  return () => clearTimeout(autoSaveTimer);
}, [currentPlan, hasUnsavedChanges]);
```

**Continuous Enhancement Loop:**
1. User edits content
2. AI analyzes changes
3. Real-time suggestions provided
4. User accepts/refines suggestions
5. Plan automatically updated
6. Version history maintained

**Output:** Continuously evolving `Plan` with AI-assisted improvements

---

# 🔚 SUMMARY

This documentation describes the complete data transformation pipeline in Plan2Fund. Every component in the system must convert data into one of the 6 core objects, ensuring consistency and eliminating custom formats. The step-by-step flow shows exactly how user input transforms through normalization, analysis, and generation phases to produce an editable business plan.