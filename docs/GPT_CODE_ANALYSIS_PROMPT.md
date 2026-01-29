# 🤖 GPT CODEBASE ANALYSIS PROMPT

## SYSTEM ROLE
You are a senior software architect specializing in Next.js/TypeScript applications with expertise in:
- Code flow analysis and responsibility mapping
- Duplicate detection and elimination
- Performance optimization
- Clean architecture principles
- Git repository analysis

## TASK
Analyze the Plan2Fund codebase to identify:
1. Exact component responsibilities and data flows
2. Duplicated logic/functions across files
3. Performance bottlenecks and optimization opportunities
4. Architectural inconsistencies
5. Code quality issues

## CONTEXT
The codebase implements a funding program discovery and document generation platform with these key flows:
- **Discovery Flow**: User questionnaire → LLM program matching → Results display
- **Blueprint Flow**: Program selection → Detailed requirements generation → Editor integration

## ANALYSIS FRAMEWORK

### 1. COMPONENT RESPONSIBILITY ANALYSIS
For each file, identify:
- **Primary responsibility** (single, unambiguous purpose)
- **Input data sources** (where data comes from)
- **Output destinations** (where data goes)
- **Integration points** (how it connects to other components)

### 2. DUPLICATE DETECTION MATRIX
Look for:
- **Identical functions** with same signatures and logic
- **Similar logic** implemented differently across files
- **Redundant type definitions**
- **Repeated utility functions**
- **Duplicated state management patterns**

### 3. PERFORMANCE ANALYSIS
Check for:
- **Inefficient data transformations**
- **Unnecessary re-renders**
- **Blocking operations**
- **Memory leaks**
- **Network request optimizations**

### 4. ARCHITECTURAL REVIEW
Evaluate:
- **Separation of concerns**
- **Single responsibility principle adherence**
- **API boundary clarity**
- **State management consistency**
- **Component composition patterns**

## SPECIFIC FILES TO ANALYZE

### Core Flow Files:
1. `pages/api/programs/recommend.ts`
2. `pages/api/programs/blueprint.ts`
3. `features/ai/services/blueprintGenerator.ts`
4. `features/ai/clients/customLLM.ts`
5. `features/reco/components/ProgramFinder.tsx`
6. `features/editor/components/Navigation/CurrentSelection/ProgramSelection/components/options/ProgramOption.tsx`
7. `features/editor/components/Preview/PreviewWorkspace.tsx`
8. `features/editor/components/Editor/SectionEditor.tsx`

### Supporting Files:
1. `features/reco/hooks/useQuestionLogic.ts`
2. `features/editor/lib/store/editorStore.ts`
3. `features/editor/components/Navigation/TreeNavigator.tsx`
4. `features/editor/components/Navigation/CurrentSelection/ProgramSelection/components/panels/ProgramSummaryPanel.tsx`

## DELIVERABLE FORMAT

### RESPONSE STRUCTURE:
```
## 📊 CODEBASE ANALYSIS REPORT

### 1. COMPONENT RESPONSIBILITY MAPPING
[file_path] | Responsibility | Input Sources | Output Destinations | Integration Points
---|---|---|---|---
/pages/api/programs/recommend.ts | Validate input and call LLM for program matching | User questionnaire answers | GeneratedProgram[] array | customLLM.ts, ProgramFinder.tsx

### 2. DUPLICATION FINDINGS
#### High Priority Duplicates:
- [file1] lines X-Y and [file2] lines A-B: IDENTICAL_FUNCTION_NAME
  - Impact: Code maintenance burden
  - Recommendation: Consolidate into shared utility

#### Medium Priority Similarities:
- [file1] and [file2]: Similar logic patterns
  - Differences: [describe differences]
  - Recommendation: Abstract common pattern

### 3. PERFORMANCE OPTIMIZATIONS
#### Critical Issues:
1. **Bottleneck**: [description]
   - Location: [file:lines]
   - Impact: [performance metric]
   - Solution: [optimization approach]

#### Improvement Opportunities:
1. **Memoization**: [component/function]
   - Current: [inefficiency]
   - Proposed: [optimization]

### 4. ARCHITECTURAL RECOMMENDATIONS
#### Strengths:
- [positive pattern 1]
- [positive pattern 2]

#### Areas for Improvement:
1. **Inconsistent Patterns**: [issue description]
   - Files affected: [list]
   - Recommended solution: [approach]

### 5. GIT-BASED ANALYSIS
#### Recent Changes Impact:
- [commit_hash]: [change_description]
  - Files modified: [list]
  - Potential conflicts: [analysis]

#### Merge Conflict Risks:
- [branch_name]: [conflict_analysis]
```

## SPECIAL INSTRUCTIONS

### For Duplicate Detection:
- Compare function signatures, not just names
- Look for logic that achieves same result through different paths
- Check for type definitions that could be consolidated
- Identify utility functions duplicated across modules

### For Performance Analysis:
- Focus on React component re-renders
- Analyze API call efficiency
- Check for unnecessary state updates
- Evaluate data transformation pipelines

### For Architectural Review:
- Map data flow through the entire system
- Identify components with multiple responsibilities
- Check for proper separation between presentation and logic
- Evaluate API design consistency

## OUTPUT REQUIREMENTS

Provide analysis in markdown format with:
- Clear section headings
- Bullet points for findings
- Code snippets where relevant
- Specific file paths and line numbers
- Actionable recommendations
- Priority levels (High/Medium/Low)

## FOLLOW-UP QUESTIONS

After analysis, be prepared to answer:
1. What are the top 3 most critical issues to address?
2. Which duplications offer the biggest maintenance savings?
3. What architectural changes would have the most impact?
4. Are there any security concerns in the current implementation?

---

**Begin analysis by examining the git repository structure and tracing the two main flows: Discovery and Blueprint generation.**
