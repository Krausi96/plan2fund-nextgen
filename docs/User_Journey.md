# User Journey (Plan2Fund)

## Overview

Plan2Fund is a funding recommendation platform that helps entrepreneurs and organizations find suitable funding programs through two main entry paths: a structured Wizard survey and an AI-powered free-text intake. Both paths lead to the same scoring engine and results page, providing personalized funding recommendations based on user responses.

**Target Users:** Entrepreneurs, startups, research organizations, and non-profits seeking funding in Austria and the EU.

## Entry Paths# Plan2Fund — Updated User Journey (Business + Data

# Architecture)

Version: 2025-09-

## 1) Purpose

This document aligns the desired business flow with the current Next.js repository. It explains the screens,
the data objects they read/write in Supabase, and how payments/exports are gated with feature flags. It
replaces any prior draft and serves as the source of truth for the MVP build and polishing agent.

## 2) Stack Snapshot

- Web: Next.js 14 (pages router present), TypeScript, Tailwind
- Backend: Supabase (Postgres + Auth + Storage), API routes (Server Actions later if app/ router is
introduced)
- Payments: Stripe Checkout (feature-flagged)
- Email: Resend (order confirmations; later notifications)
- Hosting: Vercel
- Flags: CHECKOUT_ENABLED, EXPORT_ENABLED, AI_ENABLED

## 3) Primary Flow (Business View → Data Touchpoints)

A. Landing “Welcome/Choose Path” (/)

- Business: Explain value, let the user choose Find Funding (Reco) or Business Plan.
- Data: Anonymous view; optional session_id cookie.

B. Recommendation Wizard (/reco)

- Business: One question per screen, show progress; ends with ranked Top-5 programs with reason and
% fit.
- Data: reco_sessions (one per run), reco_answers (one per question), reco_results (score, reason,
program_id).

C. Business Plan Editor (/plan)

- Business: Sidebar chapters, editable sections, autosave, versioning; user can start here directly or via
results.
- Data: plan_documents (one per plan), plan_versions (autosave snapshots), uploads (files in storage).

D. Preview & Pricing (/preview, /pricing)

- Business: Completeness meter, complexity score and price; CTA to purchase.
- Data: reads plan_documents + rollup metrics; creates draft order when user proceeds.

E. Checkout (/checkout)

- Business: Stripe Checkout if CHECKOUT_ENABLED=true; else disabled stub.
- Data: orders (pending → paid); payments (provider receipt), webhooks update order statuses.

F. Export (/export)

- Business: Generate DOCX/PDF; if EXPORT_ENABLED=false or unpaid, show masked preview with
watermark.
- Data: exports (artifact path, hash), files in Supabase Storage.

G. Thank You & After-Sales (/thank-you)

- Business: Show downloads, email confirmations, prompt for revision request.
- Data: reads last paid order and associated export links.


## 4) Screens & Components

Global: Header, Footer, LanguageSwitcher, Breadcrumbs (from /reco or /plan onward), ProgressBar,
SaveIndicator, Toasts
Reco: WizardStep, QuestionCard, ResultsList, ResultCard
Plan: PlanShell, ChapterSidebar, EditorArea (rich text/markdown), VersionBar, Attachments
Checkout/Export: OrderSummary, PayButton (flagged), ExportLocker, PreviewPane
Utilities: FeatureFlag, RequireAuth (if needed later)

## 5) Data Model (Supabase)

profiles(id, email, name, created_at)
reco_sessions(id, user_id nullable, started_at, completed_at)
reco_answers(id, session_id, qkey, value)
reco_results(id, session_id, program_id, score, fit_reason, effort_estimate)
plan_documents(id, user_id, title, status, created_at, updated_at)
plan_versions(id, plan_id, content_json, notes, created_at)
uploads(id, user_id, plan_id nullable, path, mime, size, created_at)
orders(id, user_id, plan_id, amount_cents, currency, status[pending|paid|failed], created_at)
payments(id, order_id, provider, provider_id, amount_cents, status, created_at)
exports(id, plan_id, order_id, kind[pdf|docx], path, created_at)
journey_events(id, user_id nullable, name, payload_json, created_at)

## 6) Feature Flags

CHECKOUT_ENABLED=false → renders PayButton disabled + info tooltip
EXPORT_ENABLED=false → masks exports behind paywall or watermark
AI_ENABLED=false → keeps vector/LLM features off until MVP is live

## 7) Error States & Non-Technical Explanations

- If Vercel build fails: the app won’t deploy, but your code is safe on GitHub. The agent fixes code, commits
again, and Vercel retries automatically.
- If Stripe is off: users can still see prices but cannot pay; that’s intentional until testing is complete.
- Supabase Studio works like a spreadsheet for your database; you can view answers, plans, and orders
without coding.

## 8) Metrics (MVP)

- Wizard completion rate, time to first result
- Plans created, versions per plan, preview-to-checkout CTR
- Paid orders, export success rate

## 9) Next Steps (for the Agent)

1) Finalize business logic for 3a and 3b (questions catalog, scoring rules, plan chapter schema, autosave
cadence) and wire routes/components; document data flow inline.
2) Set up tech stack access (Supabase project + keys, Stripe keys + webhook on /api/stripe/webhook,
Resend key). Add .env and feature flags; fix Vercel deployment.
3) Ship a functioning MVP: end-to-end reco→plan→preview→(checkout flagged)→export (flagged). Add
minimal tests (smoke + data writes).

## 10) Agent Execution Prompt (Polish & Build)


Role: Senior Next.js + Supabase + Stripe engineer. Objectives: clean repo, fix build, implement missing
pages/components, wire Supabase tables, add API routes, integrate Stripe Checkout (flagged), produce a
running MVP on Vercel.
Constraints: keep dependencies minimal, no ORM, use Supabase JS client, use Tailwind, maintain feature
flags.
Deliverables: green Vercel deploy, updated README with env setup, SQL for tables, test plan, and
checklists mapping to this document.




### 1. Wizard → Results
- **Path:** `/reco` → Structured survey → `/results`
- **Method:** Step-by-step questionnaire with 10 universal questions
- **Persona Modes:** Strict (exact matching) or Explorer (flexible matching)
- **Flow:** Questions → Micro-questions (if needed) → Scoring → Results

### 2. AI Intake → Results  
- **Path:** `/reco` → Free text input → `/results`
- **Method:** Natural language description with signal extraction
- **Processing:** AI analyzes text to extract structured signals (location, sector, stage, funding type, TRL)
- **Flow:** Free text → Signal chips → Same scoring engine → Results

## Wizard Logic

### Universal Questions (10 groups)
The Wizard uses 10 core universal questions that apply to all users:

1. **Country/Region** (`q1_country`): Austria only, EU (incl. Austria), Outside EU
2. **Entity Stage** (`q2_entity_stage`): Pre-company, Incorporated <6m, 6-36m, >36m, Research org, Non-profit
3. **Company Size** (`q3_company_size`): Micro (0-9), Small (10-49), Medium (50-249), Large (250+)
4. **Theme** (`q4_theme`): Innovation/Digital, Sustainability, Health/Life Sciences, Space, Industry, Other
5. **Maturity/TRL** (`q5_maturity_trl`): TRL 1-2, 3-4, 5-6, 7-8, 9+
6. **R&D in Austria** (`q6_rnd_in_at`): Yes, No, Unsure
7. **Collaboration** (`q7_collaboration`): None, Research institutions, Companies, Both
8. **Funding Types** (`q8_funding_types`): Grants, Loans, Guarantees, Equity/Blended
9. **Team Diversity** (`q9_team_diversity`): Women ownership >25%, No, Unknown
10. **Environmental Benefit** (`q10_env_benefit`): Strong, Some, None

### Overlay Questions (0-3 per group)
- **Micro-questions:** Dynamically generated based on coverage gaps
- **Trigger:** After main questions, system identifies missing critical attributes
- **Purpose:** Improve recommendation accuracy for top candidate programs
- **Limit:** Maximum 3 questions per overlay group

### Doctor-Style Logic
- **Progressive disclosure:** Core questions first, then targeted follow-ups
- **Skip logic:** Questions adapt based on previous answers
- **Branching rules:** 5 predefined rules that affect program visibility and scoring
- **Coverage analysis:** System identifies gaps and suggests micro-questions

## AI Intake Logic

### Signal Extraction
The AI intake processes free-text descriptions to extract structured signals:

- **Location signals:** Vienna, Austria, Germany, etc.
- **Sector signals:** Food, Technology, Creative, etc.
- **Stage signals:** Startup, Growth, etc.
- **Funding type signals:** Loan, Grant, Investment, etc.
- **TRL signals:** Prototype (TRL 3-4), Market (TRL 7-9), etc.

### Signal Chips
- **Visual feedback:** Extracted signals displayed as chips
- **Coverage meter:** Shows percentage of signals captured
- **Guidance:** Suggests survey completion if coverage <50%

### Same Scoring Engine
Both Wizard and AI Intake use identical scoring logic:
- **Import:** Both call `scorePrograms()` from `recoEngine.ts`
- **Normalization:** Free-text signals converted to same format as survey answers
- **Consistency:** Identical recommendation quality regardless of entry path

## Scoring/Recommendations

### Scoring Engine Architecture
- **Primary:** `recoEngine.ts` - Main scoring logic with persona modes
- **Secondary:** `scoring.ts` - Detailed breakdown scoring (fit, readiness, effort, confidence)
- **Integration:** Both engines work together for comprehensive scoring

### Rule Types
- **HARD rules:** Binary filters - must pass or program marked "Not Eligible"
- **SOFT rules:** Influence fit score - more matches = higher percentage
- **UNCERTAIN rules:** Flagged for manual review or user clarification

### Scoring Components
1. **Fit (40%):** Based on soft rule matches and requirement alignment
2. **Readiness (30%):** Document availability vs. requirements, penalizes skipped questions
3. **Effort (20%):** Inverted program complexity (1=easy, 5=complex)
4. **Confidence (10%):** Data freshness and understanding quality

### "Why This Appears" Logic
- **Rule matching:** Shows which rules triggered matches/failures
- **Score breakdown:** Displays individual component scores
- **Eligibility reasoning:** Explains why programs are/aren't eligible
- **Confidence levels:** High/Medium/Low based on data quality

## Results & Debug

### Results Page Features
- **Program cards:** Name, type, score, eligibility, confidence
- **Debug panel:** Expandable scoring breakdown for top 3 programs
- **Signal mapping:** Shows how user inputs map to program requirements
- **Path to Editor:** "Continue to Plan" button for eligible programs

### Debug Information
- **Scoring breakdown:** Fit, readiness, effort, confidence percentages
- **Rule analysis:** Which rules matched or failed
- **Eligibility details:** Specific requirements not met
- **Confidence reasoning:** Why confidence level was assigned

### Signal → Field → Rule Mapping
- **User answers** → **Normalized signals** → **Rule evaluation** → **Score calculation**
- **Transparency:** Users can see exactly why programs were recommended
- **Traceability:** Full audit trail from input to recommendation

## Export & Next Steps

### Available Actions
1. **Continue to Plan:** Prefill plan with program-specific hints
2. **Program Details:** View detailed program information
3. **Report Mismatch:** Flag incorrect program information
4. **Add Custom Program:** Exploration mode for untracked programs
5. **Adjust Answers:** Return to survey with different responses

### Export Options
- **Results persistence:** Stored in localStorage for session continuity
- **Plan integration:** Seamless transition to business plan creation
- **Document generation:** Future PDF export capabilities

## Assumptions & Limits

### Current Limitations
- **No document uploads:** Readiness scoring based on required vs. available docs (not actual uploads)
- **Limited AI processing:** Free-text analysis is basic keyword matching
- **Static program data:** No real-time updates from funding sources
- **Austria/EU focus:** Limited geographic coverage
- **No application tracking:** Results are recommendations only, not application management

### Technical Assumptions
- **Browser storage:** Relies on localStorage for data persistence
- **Client-side processing:** Most logic runs in browser, not server
- **Single session:** No multi-user or collaboration features
- **Desktop-first:** Mobile optimization may be limited

### Future Enhancements
- **Real-time data:** Live program updates and availability
- **Document management:** Actual file uploads and validation
- **Advanced AI:** More sophisticated natural language processing
- **Multi-language:** Support for German and other EU languages
- **Application tracking:** Full lifecycle management from recommendation to application

## Data Flow Summary

```
User Input (Survey/Free-text) 
    ↓
Normalization (recoEngine.ts)
    ↓
Scoring (recoEngine.ts + scoring.ts)
    ↓
Results Page (results.tsx)
    ↓
Debug Info + Next Actions
    ↓
Plan Integration (if eligible)
```

Both entry paths converge at the normalization step, ensuring consistent user experience regardless of input method.
