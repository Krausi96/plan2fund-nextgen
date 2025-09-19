# Recommendation Engine - Full Audit & Implementation Phases

## Executive Summary

**Mission**: Audit the entire Recommendation Engine (wizard, inline AI help, rules, results, no-match, freshness). Prove with user-side demos and system-side traces that it works as intended: deterministic, explainable, fresh, and simple for non-technical users.

## Current State Analysis

### ✅ Existing Components (What's Working)
- **Wizard Framework**: `src/components/reco/Wizard.tsx` with survey/freetext modes
- **Scoring Engine**: `src/lib/recoEngine.ts` with HARD/SOFT rule classifications  
- **Decision Tree**: `src/lib/decisionTree.ts` with conditional logic
- **Results Display**: `pages/results.tsx` with match scores and confidence
- **Zero Match Fallback**: `src/components/fallback/ZeroMatchFallback.tsx` with gap tickets
- **Feature Flags**: `src/lib/featureFlags.ts` with all required flags
- **AI Components**: `src/components/plan/AIChat.tsx` (in editor)
- **Data Structure**: `data/questions.json` with universal + branching questions

### ❌ Critical Gaps Identified

#### User-Side Issues
1. **❌ Program Type Upfront**: Current decision tree starts with program type selection - conflicts with requirement
2. **❌ AI Help Location**: AI assistance is only in plan editor, not inline with wizard
3. **❌ Simple Explanations**: Results show technical scores but lack plain-language "Why it fits" bullets
4. **❌ No-Match Flow**: Missing "Proceed anyway → Editor with QBank" functionality

#### System-Side Issues
1. **❌ Source Register**: No data freshness/integrity tracking system
2. **❌ Rule Traceability**: No explicit HARD/SOFT/UNCERTAIN rule traces for personas
3. **❌ Latency Monitoring**: No P95 performance tracking
4. **❌ Route Documentation**: No current route inventory

## Implementation Phases

---

## Phase 1: User-Side Proofs (A) - 3-4 weeks

### 1.1 Wizard-First, AI-Help Optional

**Current State**: Decision tree starts with program type selection
**Target**: Wizard asks ~10 core questions, program/category emerges as outcome

#### Tasks:
- [ ] **Refactor Decision Tree Logic** (`src/lib/decisionTree.ts`)
  - Remove program type as first question
  - Make program type the *outcome* of universal questions
  - Auto-classify based on q1_country, q2_entity_stage, q4_theme, q8_funding_types

- [ ] **Implement Inline AI Help** (New: `src/components/reco/InlineAIHelper.tsx`)
  - Create "CANVA AI BUSINESS PLAN" style assistant
  - Convert messy text → structured chips
  - Feed back into wizard answers
  - Add AI toggle in wizard interface

- [ ] **Update Wizard Flow** (`src/components/reco/Wizard.tsx`)
  - Remove program type pre-selection
  - Limit micro-overlays to max 3
  - Improve "I don't know" handling with low confidence continuation

**Deliverables**:
- Demo video: Wizard without program type selection
- Demo video: AI Help converting text → chips → wizard continues

### 1.2 Results Page: Simple & Human

**Current State**: Technical match scores, basic reason display
**Target**: Program cards with %, plain-language bullets, simple explanations

#### Tasks:
- [ ] **Enhanced Results Display** (`pages/results.tsx`)
  - Add inferred program category display (Grant/Loan/Visa)
  - Generate 3-5 plain-language "Why it fits" bullets tied to answers
  - Add 1-2 "Risks/Next steps" bullets
  - Improve buttons: "Open details" • "Start plan in Editor"

- [ ] **Result Card Components** (New: `src/components/reco/ResultCard.tsx`)
  - Clean card design without technical UI bars
  - Simple percentage display
  - Human-readable explanations

- [ ] **Explanation Engine** (`src/lib/explanationEngine.ts`)
  - Convert rule matches to plain language
  - Map answer combinations to human explanations
  - Generate risk assessments

**Deliverables**:
- Screenshots of result cards with % + simple explanations
- A/B test old vs new results display

### 1.3 No-Match Fallback

**Current State**: Zero match fallback exists but missing "Proceed anyway" flow
**Target**: Show Nearest 3 + "what to change" + Proceed anyway → Editor with QBank

#### Tasks:
- [ ] **Enhanced Fallback Component** (`src/components/fallback/ZeroMatchFallback.tsx`)
  - Show top 3 nearest matches with gap analysis
  - Add "what to change to qualify" recommendations
  - Implement "Proceed anyway" → Editor flow

- [ ] **QBank Integration** (`src/components/plan/QBank.tsx`)
  - Create questionnaire bank for Editor
  - List missing/uncertain items first
  - Integrate with existing Editor component

**Deliverables**:
- Demo: No-match → Nearest 3 + change recommendations + Proceed anyway → Editor QBank

### 1.4 Inline AI Help Guardrails

**Current State**: AI exists but not with proper guardrails
**Target**: Explain/clarify → chips, never invent programs, off-topic redirect

#### Tasks:
- [ ] **AI Guardrails System** (`src/lib/aiGuardrails.ts`)
  - Program invention detection and blocking
  - URL collection for unknown programs → suggestion tickets
  - Off-topic detection and polite redirect

- [ ] **Program Suggestion Tickets** (`src/lib/programSuggestions.ts`)
  - Create ticket system for unknown programs
  - Store URLs and context
  - Integration with existing gap ticket system

**Deliverables**:
- Demo: AI clarifying → chips
- Demo: Off-topic → redirect  
- Demo: Unknown program → Suggestion ticket created

---

## Phase 2: System-Side Proofs (B) - 4-5 weeks

### 2.1 Decision Tree Auto-Compilation

**Current State**: Hard-coded decision tree
**Target**: Tree built from parsed program rules, regenerates on rule changes

#### Tasks:
- [ ] **Rule Parser System** (`src/lib/ruleParser.ts`)
  - Parse program eligibility rules into structured format
  - Calculate information value for question ordering
  - Auto-generate decision tree nodes

- [ ] **Tree Generation Engine** (`src/lib/treeGenerator.ts`)
  - Build tree from parsed rules
  - Optimize question order by information gain
  - Handle rule changes and regeneration

- [ ] **Rule Change Detection** (`src/lib/ruleChangeDetector.ts`)
  - Monitor program rule changes
  - Trigger tree regeneration
  - Create diff views for before/after comparison

**Deliverables**:
- One-pager: Before/after tree when program rule edited (diff view)

### 2.2 Rule Model: Deterministic & Explainable

**Current State**: Basic HARD/SOFT classification exists
**Target**: Every rule classified as HARD/SOFT/UNCERTAIN with full traceability

#### Tasks:
- [ ] **Rule Classification System** (`src/lib/ruleClassification.ts`)
  - Formalize HARD (must), SOFT (boost), UNCERTAIN (clarify) categories
  - Map all program rules to classifications
  - Create rule evaluation engine

- [ ] **Explanation Tracing** (`src/lib/explanationTracer.ts`)
  - Track rule evaluations from input to output
  - Generate explanation bullets from rule matches
  - Link Match % to specific rule outcomes

- [ ] **Persona Trace Generator** (`src/lib/personaTraces.ts`)
  - Create trace system for B2C_FOUNDER, SME_LOAN, VISA personas
  - Document: inputs → normalized chips → rule outcomes → final % → bullets

**Deliverables**:
- Rule traces for 3 personas showing full decision chain
- Documentation of HARD/SOFT/UNCERTAIN rule classifications

### 2.3 Freshness & Data Integrity

**Current State**: No data freshness system
**Target**: Source Register for top 20 AT programs with diff bot and PR review

#### Tasks:
- [ ] **Source Register System** (`src/lib/sourceRegister.ts`)
  - Track URL, type (HTML/PDF/FAQ), extraction method, last-checked, hash
  - Store reviewer information and validation status
  - Handle manual marking when auto-extraction fails

- [ ] **Data Diff Bot** (`scripts/data-diff-bot.js`)
  - Monitor program sources for changes
  - Generate change proposals as PRs
  - Preserve excerpts with dates (no AI rephrasing)

- [ ] **PR Review Workflow** (`.github/workflows/program-data-review.yml`)
  - Automated diff generation
  - Review assignment system
  - Auto-update rules/tree after merge

**Deliverables**:
- Source Register table for top 20 AT programs
- Example data PR diff
- Confirmation that rules/tree update after merge

### 2.4 Skip & Uncertainty Handling

**Current State**: Skip functionality exists but micro-overlay logic needs refinement
**Target**: Max 3 micro-overlays, graceful uncertainty handling, QBank population

#### Tasks:
- [ ] **Uncertainty Engine** (`src/lib/uncertaintyEngine.ts`)
  - Track UNCERTAIN field markings
  - Intelligent micro-overlay triggering (max 3)
  - Fallback to nearest matches when unresolved

- [ ] **QBank Population** (`src/lib/qbankPopulator.ts`)
  - Generate missing items list for Editor
  - Prioritize by importance to program matching
  - Integration with existing Editor workflow

**Deliverables**:
- Demo: Multiple skips → max 3 overlays → results → Editor QBank populated

---

## Phase 3: Acceptance Criteria Validation (C) - 2-3 weeks

### 3.1 Performance & Monitoring

**Current State**: No performance tracking
**Target**: P95 ≤ 2.5s latency monitoring

#### Tasks:
- [ ] **Performance Monitoring** (`src/lib/performanceMonitor.ts`)
  - Implement P95 latency tracking
  - Add performance benchmarks for Vercel deployment
  - Create performance dashboard

- [ ] **Load Testing** (`tests/performance/load-tests.js`)
  - Test recommendation engine under load
  - Verify 2.5s P95 requirement
  - Identify bottlenecks and optimizations

**Deliverables**:
- Latency snapshot showing P95 ≤ 2.5s
- Performance monitoring dashboard

### 3.2 Feature Flags & Route Inventory

**Current State**: Feature flags exist but need documentation
**Target**: Document all flags with current values and active routes

#### Tasks:
- [ ] **Feature Flag Documentation** (`docs/FEATURE_FLAGS.md`)
  - Document all flags with descriptions and current values
  - Verify RECO_DECISION_TREE=ON, AI_HELPER_ON=ON, etc.
  - Create flag management interface

- [ ] **Route Inventory** (`docs/ROUTE_INVENTORY.md`)
  - List all active pages/components
  - Identify and disable/remove legacy routes
  - Create route mapping documentation

**Deliverables**:
- Feature flag list with current values
- Complete route inventory with legacy cleanup

### 3.3 End-to-End Testing & Validation

**Current State**: Basic tests exist
**Target**: Full acceptance criteria validation

#### Tasks:
- [ ] **Integration Tests** (`tests/integration/recommendation-flow.test.ts`)
  - Test complete wizard → results → editor flow
  - Verify all user-side proofs work
  - Test system-side proof traceability

- [ ] **Persona Journey Tests** (`tests/personas/journey-tests.ts`)
  - Test 3 personas (Founder, SME loan, Visa) end-to-end
  - Verify rule traces and explanations
  - Validate acceptance criteria

**Deliverables**:
- Comprehensive test suite passing all acceptance criteria
- Demo videos showing complete user journeys

---

## Success Metrics & Acceptance Criteria

### ✅ User-Side Requirements
- [ ] Wizard flow works without Program Type selection
- [ ] AI Help produces chips but doesn't invent programs  
- [ ] Results show simple explanation (% + bullets)
- [ ] No-match shows Nearest 3 + Proceed anyway → Editor with QBank

### ✅ System-Side Requirements
- [ ] 3 persona traces prove rule-based logic
- [ ] Source Register + PR diff show program freshness pipeline
- [ ] Skips handled gracefully (max 3 overlays, QBank in Editor)
- [ ] Decision tree auto-compiled from program rules

### ✅ Technical Requirements
- [ ] P95 ≤ 2.5s latency
- [ ] Feature flags & routes documented
- [ ] All components deterministic and explainable

## Risk Assessment

### High Risk
- **Decision Tree Refactor**: Major logic change affecting core functionality
- **AI Integration**: Complex inline assistant with guardrails
- **Performance**: Meeting 2.5s P95 requirement on Vercel

### Medium Risk
- **Data Freshness**: Building robust source monitoring system
- **Rule Traceability**: Comprehensive explanation generation
- **UI/UX Changes**: Simplifying results without losing functionality

### Low Risk
- **Feature Flags**: System already exists, just needs documentation
- **Testing**: Building on existing test infrastructure
- **Documentation**: Straightforward documentation tasks

## Timeline Summary

- **Phase 1 (User-Side)**: 3-4 weeks
- **Phase 2 (System-Side)**: 4-5 weeks  
- **Phase 3 (Validation)**: 2-3 weeks
- **Total Duration**: 9-12 weeks

## Next Steps

1. **Start with Phase 1.1**: Refactor decision tree to remove program type upfront
2. **Parallel Development**: Begin work on inline AI helper component
3. **Stakeholder Review**: Get approval on UI/UX changes for results page
4. **Infrastructure Setup**: Begin performance monitoring implementation

---

*This document provides the complete roadmap for implementing the Recommendation Engine audit specification. Each phase builds on the previous one while delivering concrete user value and system improvements.*