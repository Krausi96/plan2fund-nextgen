# Editor & Template Changes Required

## Overview
This document outlines the changes needed in the editor and templates to align with the optimization recommendations, **adapted for a localStorage-based system (no database)**.

---

## 1. Template Configuration System (No Database)

### Current State
- Templates are hardcoded in `features/editor/templates.ts`
- Program-specific overrides are complex and embedded in code
- No runtime configuration system

### Required Changes

#### 1.1 Create Program Configuration Files (JSON)
Since you don't use a database, store program-specific configurations as JSON files:

**File Structure:**
```
data/
  program-configs/
    ffg_basis.json
    eic_accelerator.json
    horizon_europe.json
    bank_loan.json
    ...
```

**Example: `data/program-configs/ffg_basis.json`**
```json
{
  "programId": "ffg_basis",
  "programName": "FFG Basisprogramm",
  "fundingType": "grants",
  "templateOverrides": {
    "requiredSections": [
      "executive_summary",
      "project_description",
      "innovation_technology",
      "impact_assessment",
      "financial_plan"
    ],
    "optionalSections": [
      "consortium",
      "ethics_assessment"
    ],
    "wordCountOverrides": {
      "executive_summary": { "min": 300, "max": 500 },
      "project_description": { "min": 400, "max": 900 }
    },
    "additionalQuestions": [
      {
        "sectionId": "project_description",
        "text": "Explain your co-financing plan",
        "required": true
      }
    ],
    "evaluationCriteria": {
      "excellence": {
        "sections": ["innovation_technology", "project_description"],
        "requiredElements": ["novelty", "state_of_the_art", "technical_risks"]
      },
      "impact": {
        "sections": ["impact_assessment", "market_analysis"],
        "requiredElements": ["market_size", "user_pain_points", "societal_impact"]
      },
      "implementation": {
        "sections": ["team_qualifications", "timeline_milestones", "risk_assessment"],
        "requiredElements": ["team_competence", "work_plan", "risk_mitigation"]
      }
    }
  }
}
```

#### 1.2 Update `templates.ts` to Load Configs
Modify `getSections()` to merge master templates with program configs:

```typescript
// In features/editor/templates.ts

export async function getSections(
  fundingType: string,
  productType: string = 'submission',
  programId?: string,
  baseUrl?: string
): Promise<SectionTemplate[]> {
  // Get master template
  const masterSections = MASTER_SECTIONS[productType] || MASTER_SECTIONS.submission;
  
  // If programId provided, load and apply config
  if (programId) {
    const config = await loadProgramConfig(programId, baseUrl);
    if (config) {
      return applyProgramConfig(masterSections, config);
    }
  }
  
  return masterSections;
}

async function loadProgramConfig(programId: string, baseUrl?: string): Promise<ProgramConfig | null> {
  try {
    const apiUrl = baseUrl 
      ? `${baseUrl}/data/program-configs/${programId}.json`
      : typeof window !== 'undefined' 
        ? `/data/program-configs/${programId}.json`
        : `http://localhost:3000/data/program-configs/${programId}.json`;
    
    const response = await fetch(apiUrl);
    if (!response.ok) return null;
    
    return await response.json();
  } catch (error) {
    console.error('Error loading program config:', error);
    return null;
  }
}

function applyProgramConfig(
  masterSections: SectionTemplate[],
  config: ProgramConfig
): SectionTemplate[] {
  const { templateOverrides } = config;
  const result: SectionTemplate[] = [];
  
  // Process required sections
  const requiredIds = new Set(templateOverrides.requiredSections || []);
  const optionalIds = new Set(templateOverrides.optionalSections || []);
  
  for (const section of masterSections) {
    // Mark as required/optional based on config
    const isRequired = requiredIds.has(section.id);
    const isOptional = optionalIds.has(section.id);
    
    if (isRequired || isOptional || (!requiredIds.size && !optionalIds.size)) {
      const override: SectionTemplate = { ...section };
      
      // Apply word count overrides
      if (templateOverrides.wordCountOverrides?.[section.id]) {
        override.wordCountMin = templateOverrides.wordCountOverrides[section.id].min;
        override.wordCountMax = templateOverrides.wordCountOverrides[section.id].max;
      }
      
      // Mark required/optional
      if (isRequired) override.required = true;
      if (isOptional) override.required = false;
      
      // Add additional questions
      const additionalQuestions = templateOverrides.additionalQuestions?.filter(
        q => q.sectionId === section.id
      );
      if (additionalQuestions?.length) {
        override.questions = [
          ...(override.questions || []),
          ...additionalQuestions.map(q => ({
            text: q.text,
            required: q.required || false,
            placeholder: q.placeholder,
            hint: q.hint
          }))
        ];
      }
      
      result.push(override);
    }
  }
  
  return result;
}
```

---

## 2. Requirements Checker Enhancements

### Current State
- Only checks word counts and required fields
- No evaluation against program criteria
- No content heuristics

### Required Changes

#### 2.1 Create Requirements Checker Module
**File: `features/editor/utils/requirementsChecker.ts`**

```typescript
import { SectionTemplate } from '@templates';
import { BusinessPlan, Section } from '@/features/editor/types/plan';

export interface RequirementIssue {
  id: string;
  sectionId: string;
  severity: 'critical' | 'important' | 'nice-to-have';
  type: 'missing_field' | 'word_count' | 'content_heuristic' | 'evaluation_criteria';
  message: string;
  suggestion?: string;
  linkToSection?: string;
}

export interface RequirementsReport {
  overallProgress: number;
  issues: RequirementIssue[];
  bySection: Record<string, RequirementIssue[]>;
  bySeverity: {
    critical: RequirementIssue[];
    important: RequirementIssue[];
    'nice-to-have': RequirementIssue[];
  };
}

export async function checkRequirements(
  plan: BusinessPlan,
  programConfig?: ProgramConfig
): Promise<RequirementsReport> {
  const issues: RequirementIssue[] = [];
  
  // 1. Check word counts
  issues.push(...checkWordCounts(plan));
  
  // 2. Check required fields
  issues.push(...checkRequiredFields(plan));
  
  // 3. Check content heuristics
  issues.push(...checkContentHeuristics(plan));
  
  // 4. Check evaluation criteria (if program config provided)
  if (programConfig) {
    issues.push(...await checkEvaluationCriteria(plan, programConfig));
  }
  
  // Calculate progress
  const totalChecks = calculateTotalChecks(plan, programConfig);
  const passedChecks = totalChecks - issues.filter(i => i.severity === 'critical' || i.severity === 'important').length;
  const overallProgress = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
  
  return {
    overallProgress,
    issues,
    bySection: groupBySection(issues),
    bySeverity: {
      critical: issues.filter(i => i.severity === 'critical'),
      important: issues.filter(i => i.severity === 'important'),
      'nice-to-have': issues.filter(i => i.severity === 'nice-to-have')
    }
  };
}

function checkWordCounts(plan: BusinessPlan): RequirementIssue[] {
  const issues: RequirementIssue[] = [];
  
  for (const section of plan.sections) {
    const template = getSectionTemplate(section.id);
    if (!template) continue;
    
    const wordCount = countWords(section.content);
    
    if (wordCount < template.wordCountMin) {
      issues.push({
        id: `word_count_min_${section.id}`,
        sectionId: section.id,
        severity: 'important',
        type: 'word_count',
        message: `Section "${template.title}" has ${wordCount} words, but minimum is ${template.wordCountMin}`,
        suggestion: `Add approximately ${template.wordCountMin - wordCount} more words to meet the minimum requirement.`,
        linkToSection: section.id
      });
    }
    
    if (wordCount > template.wordCountMax) {
      issues.push({
        id: `word_count_max_${section.id}`,
        sectionId: section.id,
        severity: 'nice-to-have',
        type: 'word_count',
        message: `Section "${template.title}" has ${wordCount} words, but maximum is ${template.wordCountMax}`,
        suggestion: `Consider reducing by approximately ${wordCount - template.wordCountMax} words to meet the maximum requirement.`,
        linkToSection: section.id
      });
    }
  }
  
  return issues;
}

function checkContentHeuristics(plan: BusinessPlan): RequirementIssue[] {
  const issues: RequirementIssue[] = [];
  
  for (const section of plan.sections) {
    const content = section.content.toLowerCase();
    
    // Check for quantitative data (numbers, percentages)
    if (section.id === 'market_analysis' || section.id === 'market_opportunity') {
      const hasNumbers = /\d+/.test(section.content);
      const hasPercentages = /%|\d+\s*percent/i.test(section.content);
      
      if (!hasNumbers && !hasPercentages) {
        issues.push({
          id: `quantitative_data_${section.id}`,
          sectionId: section.id,
          severity: 'important',
          type: 'content_heuristic',
          message: `Market section should include quantitative data (market size, growth rates, percentages)`,
          suggestion: `Add specific numbers, market size estimates, or growth percentages to strengthen your market analysis.`,
          linkToSection: section.id
        });
      }
    }
    
    // Check for customer identification
    if (section.id === 'market_opportunity' || section.id === 'business_model_value_proposition') {
      const customerKeywords = ['customer', 'user', 'client', 'target', 'audience', 'buyer'];
      const hasCustomerMention = customerKeywords.some(keyword => content.includes(keyword));
      
      if (!hasCustomerMention) {
        issues.push({
          id: `customer_identification_${section.id}`,
          sectionId: section.id,
          severity: 'important',
          type: 'content_heuristic',
          message: `Section should clearly identify target customers or users`,
          suggestion: `Describe who your target customers are, their characteristics, and why they need your solution.`,
          linkToSection: section.id
        });
      }
    }
    
    // Check for value proposition
    if (section.id === 'business_model_value_proposition') {
      const valueKeywords = ['unique', 'different', 'advantage', 'benefit', 'value', 'usp'];
      const hasValueProp = valueKeywords.some(keyword => content.includes(keyword));
      
      if (!hasValueProp) {
        issues.push({
          id: `value_proposition_${section.id}`,
          sectionId: section.id,
          severity: 'critical',
          type: 'content_heuristic',
          message: `Value proposition section should clearly explain what makes your solution unique`,
          suggestion: `Describe your Unique Selling Point (USP) and how you differentiate from competitors.`,
          linkToSection: section.id
        });
      }
    }
    
    // Check for revenue model
    if (section.id === 'business_model_value_proposition' || section.id === 'financial_plan') {
      const revenueKeywords = ['pricing', 'revenue', 'monetization', 'income', 'sales', 'subscription', 'fee'];
      const hasRevenueModel = revenueKeywords.some(keyword => content.includes(keyword));
      
      if (!hasRevenueModel && section.id === 'business_model_value_proposition') {
        issues.push({
          id: `revenue_model_${section.id}`,
          sectionId: section.id,
          severity: 'important',
          type: 'content_heuristic',
          message: `Business model section should explain how you generate revenue`,
          suggestion: `Describe your pricing strategy, revenue streams, and monetization approach.`,
          linkToSection: section.id
        });
      }
    }
  }
  
  return issues;
}

async function checkEvaluationCriteria(
  plan: BusinessPlan,
  config: ProgramConfig
): Promise<RequirementIssue[]> {
  const issues: RequirementIssue[] = [];
  const { evaluationCriteria } = config.templateOverrides;
  
  if (!evaluationCriteria) return issues;
  
  // Check Excellence criteria
  if (evaluationCriteria.excellence) {
    const { sections, requiredElements } = evaluationCriteria.excellence;
    for (const sectionId of sections) {
      const section = plan.sections.find(s => s.id === sectionId);
      if (!section) continue;
      
      for (const element of requiredElements) {
        const content = section.content.toLowerCase();
        const hasElement = checkForElement(content, element);
        
        if (!hasElement) {
          issues.push({
            id: `excellence_${sectionId}_${element}`,
            sectionId,
            severity: 'critical',
            type: 'evaluation_criteria',
            message: `Excellence criteria: Section should address "${element}"`,
            suggestion: getExcellenceSuggestion(element),
            linkToSection: sectionId
          });
        }
      }
    }
  }
  
  // Check Impact criteria
  if (evaluationCriteria.impact) {
    const { sections, requiredElements } = evaluationCriteria.impact;
    for (const sectionId of sections) {
      const section = plan.sections.find(s => s.id === sectionId);
      if (!section) continue;
      
      for (const element of requiredElements) {
        const content = section.content.toLowerCase();
        const hasElement = checkForElement(content, element);
        
        if (!hasElement) {
          issues.push({
            id: `impact_${sectionId}_${element}`,
            sectionId,
            severity: 'critical',
            type: 'evaluation_criteria',
            message: `Impact criteria: Section should address "${element}"`,
            suggestion: getImpactSuggestion(element),
            linkToSection: sectionId
          });
        }
      }
    }
  }
  
  // Check Implementation criteria
  if (evaluationCriteria.implementation) {
    const { sections, requiredElements } = evaluationCriteria.implementation;
    for (const sectionId of sections) {
      const section = plan.sections.find(s => s.id === sectionId);
      if (!section) continue;
      
      for (const element of requiredElements) {
        const content = section.content.toLowerCase();
        const hasElement = checkForElement(content, element);
        
        if (!hasElement) {
          issues.push({
            id: `implementation_${sectionId}_${element}`,
            sectionId,
            severity: 'critical',
            type: 'evaluation_criteria',
            message: `Implementation criteria: Section should address "${element}"`,
            suggestion: getImplementationSuggestion(element),
            linkToSection: sectionId
          });
        }
      }
    }
  }
  
  return issues;
}

function checkForElement(content: string, element: string): boolean {
  const keywords: Record<string, string[]> = {
    'novelty': ['novel', 'new', 'innovative', 'unique', 'original', 'breakthrough'],
    'state_of_the_art': ['state of the art', 'existing', 'current', 'prior art', 'literature'],
    'technical_risks': ['risk', 'challenge', 'technical', 'mitigation', 'contingency'],
    'market_size': ['market size', 'tam', 'sam', 'som', 'market volume', '€', 'million', 'billion'],
    'user_pain_points': ['problem', 'pain', 'need', 'challenge', 'issue', 'difficulty'],
    'societal_impact': ['societal', 'social', 'environmental', 'impact', 'benefit', 'contribution'],
    'team_competence': ['team', 'experience', 'expertise', 'qualification', 'skill', 'background'],
    'work_plan': ['plan', 'timeline', 'milestone', 'deliverable', 'schedule', 'gantt'],
    'risk_mitigation': ['risk', 'mitigation', 'strategy', 'contingency', 'plan', 'measure']
  };
  
  const elementKeywords = keywords[element] || [element];
  return elementKeywords.some(keyword => content.includes(keyword));
}

function getExcellenceSuggestion(element: string): string {
  const suggestions: Record<string, string> = {
    'novelty': 'Explain what is novel about your approach compared to existing solutions. Describe the innovation clearly.',
    'state_of_the_art': 'Compare your solution with current state-of-the-art approaches and explain how you go beyond them.',
    'technical_risks': 'Identify technical risks and describe your mitigation strategies.'
  };
  return suggestions[element] || `Please address ${element} in this section.`;
}

function getImpactSuggestion(element: string): string {
  const suggestions: Record<string, string> = {
    'market_size': 'Quantify the market size using TAM/SAM/SOM framework or cite market research data.',
    'user_pain_points': 'Clearly describe the problems or pain points your target users face.',
    'societal_impact': 'Explain the broader societal, environmental, or economic impact of your project.'
  };
  return suggestions[element] || `Please address ${element} in this section.`;
}

function getImplementationSuggestion(element: string): string {
  const suggestions: Record<string, string> = {
    'team_competence': 'Describe team members\' relevant experience and qualifications that enable project success.',
    'work_plan': 'Provide a detailed work plan with milestones, deliverables, and timeline.',
    'risk_mitigation': 'Identify risks and describe specific mitigation strategies and contingency plans.'
  };
  return suggestions[element] || `Please address ${element} in this section.`;
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
}

function groupBySection(issues: RequirementIssue[]): Record<string, RequirementIssue[]> {
  const grouped: Record<string, RequirementIssue[]> = {};
  for (const issue of issues) {
    if (!grouped[issue.sectionId]) {
      grouped[issue.sectionId] = [];
    }
    grouped[issue.sectionId].push(issue);
  }
  return grouped;
}

function calculateTotalChecks(plan: BusinessPlan, config?: ProgramConfig): number {
  let total = 0;
  
  // Word count checks
  total += plan.sections.length * 2; // min and max
  
  // Required field checks
  for (const section of plan.sections) {
    const template = getSectionTemplate(section.id);
    if (template?.validationRules?.requiredFields) {
      total += template.validationRules.requiredFields.length;
    }
  }
  
  // Content heuristic checks (approximate)
  total += plan.sections.length * 2;
  
  // Evaluation criteria checks
  if (config?.templateOverrides?.evaluationCriteria) {
    const criteria = config.templateOverrides.evaluationCriteria;
    if (criteria.excellence) total += criteria.excellence.requiredElements.length;
    if (criteria.impact) total += criteria.impact.requiredElements.length;
    if (criteria.implementation) total += criteria.implementation.requiredElements.length;
  }
  
  return total;
}
```

#### 2.2 Update Requirements Modal
Update `features/editor/components/RequirementsModal.tsx` to use the new checker:

```typescript
// Add to RequirementsModal.tsx
import { checkRequirements, RequirementsReport } from '@/features/editor/utils/requirementsChecker';

// In component:
const [report, setReport] = useState<RequirementsReport | null>(null);

const runCheck = async () => {
  const selectedProgram = loadSelectedProgram();
  let programConfig = null;
  
  if (selectedProgram?.id) {
    programConfig = await loadProgramConfig(selectedProgram.id);
  }
  
  const report = await checkRequirements(plan, programConfig);
  setReport(report);
};
```

---

## 3. Where to Source Templates

### 3.1 Official Sources (Recommended)

1. **European Commission Business Plan Guidance**
   - URL: https://ec.europa.eu/programmes/erasmus-plus/project-result-content/5af53e70-0806-4f6b-98c8-084e7f2b7d72/Business_Plan.pdf
   - Sections: Executive Summary, Business Model, Management & Organisation, Marketing Plan, Financials, Appendix
   - **Action**: Download and extract section structures

2. **EIC Accelerator Guidelines**
   - URL: https://eic.ec.europa.eu/tips-applicants-eic-accelerator_en
   - Criteria: Excellence, Impact, Implementation
   - **Action**: Extract evaluation criteria and map to sections

3. **Austrian WKO Business Plan Guide**
   - URL: https://www.wko.at/gruendung/inhalte-businessplan
   - Sections: Standard Austrian business plan structure
   - **Action**: Review and align with current templates

4. **FFG Basisprogramm**
   - URL: https://www.ffg.at/
   - **Action**: Extract program-specific requirements

### 3.2 Competitor Analysis

1. **LivePlan**
   - URL: https://www.liveplan.com/blog/funding/slides-you-need
   - Features: Business Plan Builder, Financial Forecasts, AI Assistant
   - **Action**: Study their template structure and features

2. **Visible.vc Pitch Deck Guide**
   - URL: https://visible.vc/blog/required-slides-in-a-pitch-deck/
   - **Action**: Extract 10-slide pitch deck structure

### 3.3 Template Structure to Implement

Based on the document, implement these core sections:

**Master Template Sections:**
1. Executive Summary
2. Business Model & Value Proposition
3. Management & Organisation (Team & Qualifications)
4. Marketing Plan (Market Analysis, Go-to-Market)
5. Financials (Financial Plan, Preliminary Financial Overview)
6. Appendix (References, Supporting Documents)

**Additional Documents:**
1. Pitch Deck (10 slides: Title, Problem, Solution, Market, Business Model, Traction, Marketing, Competition, Team, Financials/Ask)
2. Financial Models (Sales Forecast, P&L, Cash Flow, Balance Sheet)
3. Application Forms (Pre-fill from business plan data)

---

## 4. Implementation Steps

### Phase 1: Template Configuration System
1. ✅ Create `data/program-configs/` directory
2. ✅ Create JSON config files for major programs (FFG, EIC, Bank Loans)
3. ✅ Update `templates.ts` to load and merge configs
4. ✅ Test with existing programs

### Phase 2: Requirements Checker
1. ✅ Create `requirementsChecker.ts` module
2. ✅ Implement word count checks
3. ✅ Implement content heuristics
4. ✅ Implement evaluation criteria checks
5. ✅ Update RequirementsModal to use new checker

### Phase 3: Template Sourcing
1. ✅ Download and review EU business plan guidance
2. ✅ Extract section structures
3. ✅ Update master templates to align with official sources
4. ✅ Add source citations to templates

### Phase 4: Additional Documents
1. ✅ Create pitch deck template (10 slides)
2. ✅ Create financial model templates
3. ✅ Implement auto-population from business plan
4. ✅ Add export functionality (PPTX, XLSX)

---

## 5. File Structure Changes

```
plan2fund-nextgen/
├── data/
│   └── program-configs/
│       ├── ffg_basis.json
│       ├── eic_accelerator.json
│       ├── horizon_europe.json
│       ├── bank_loan.json
│       └── ...
├── features/
│   └── editor/
│       ├── templates.ts (updated)
│       ├── utils/
│       │   └── requirementsChecker.ts (new)
│       └── components/
│           └── RequirementsModal.tsx (updated)
└── public/
    └── data/
        └── program-configs/ (copy for static serving)
```

---

## 6. Key Differences from Document

Since you don't use a database:

1. **Program Configs**: Store as JSON files instead of database tables
2. **User Feedback**: Store in localStorage instead of database
3. **Analytics**: Store in localStorage (can export to analytics service later)
4. **Template Updates**: Update JSON files instead of database records

---

## 7. Next Steps

1. **Immediate**: Create first program config JSON file (FFG Basisprogramm)
2. **Week 1**: Implement template configuration loading
3. **Week 2**: Build requirements checker with content heuristics
4. **Week 3**: Source and update templates from official sources
5. **Week 4**: Implement additional document generation

