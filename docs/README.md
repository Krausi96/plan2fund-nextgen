# Plan2Fund - Complete Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [User Journey](#user-journey)
3. [Technical Architecture](#technical-architecture)
4. [Data Model](#data-model)
5. [Feature Flags](#feature-flags)
6. [Development Workflow](#development-workflow)
7. [GDPR Compliance](#gdpr-compliance)
8. [Deployment](#deployment)
9. [Agent Guidelines](#agent-guidelines)

## Project Overview

Plan2Fund is a funding recommendation platform that helps entrepreneurs and organizations find suitable funding programs through intelligent matching algorithms. The platform provides two main entry paths: a structured Wizard survey and an AI-powered free-text intake, both leading to personalized funding recommendations.

**Target Users:** Entrepreneurs, startups, research organizations, and non-profits seeking funding in Austria and the EU.

**Stack:** Next.js 14 (pages-router) · TypeScript · Tailwind CSS · Supabase · Stripe · Resend

## User Journey

### Entry Paths

#### 1. Wizard → Results
- **Path:** `/reco` → Structured survey → `/results`
- **Method:** Step-by-step questionnaire with 10 universal questions
- **Persona Modes:** Strict (exact matching) or Explorer (flexible matching)
- **Flow:** Questions → Micro-questions (if needed) → Scoring → Results

#### 2. AI Intake → Results  
- **Path:** `/reco` → Free text input → `/results`
- **Method:** Natural language description with signal extraction
- **Processing:** AI analyzes text to extract structured signals (location, sector, stage, funding type, TRL)
- **Flow:** Free text → Signal chips → Same scoring engine → Results

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

### Scoring/Recommendations

#### Scoring Engine Architecture
- **Primary:** `recoEngine.ts` - Main scoring logic with persona modes
- **Secondary:** `scoring.ts` - Detailed breakdown scoring (fit, readiness, effort, confidence)
- **Integration:** Both engines work together for comprehensive scoring

#### Rule Types
- **HARD rules:** Binary filters - must pass or program marked "Not Eligible"
- **SOFT rules:** Influence fit score - more matches = higher percentage
- **UNCERTAIN rules:** Flagged for manual review or user clarification

#### Scoring Components
1. **Fit (40%):** Based on soft rule matches and requirement alignment
2. **Readiness (30%):** Document availability vs. requirements, penalizes skipped questions
3. **Effort (20%):** Inverted program complexity (1=easy, 5=complex)
4. **Confidence (10%):** Data freshness and understanding quality

### Results & Debug
- **Program cards:** Name, type, score, eligibility, confidence
- **Debug panel:** Expandable scoring breakdown for top 3 programs
- **Signal mapping:** Shows how user inputs map to program requirements
- **Path to Editor:** "Continue to Plan" button for eligible programs

## Technical Architecture

### Core Components
- **Wizard:** `src/components/reco/Wizard.tsx` - Survey interface
- **Results:** `pages/results.tsx` - Recommendation display
- **Scoring:** `src/lib/recoEngine.ts` + `src/lib/scoring.ts` - Recommendation logic
- **API:** `pages/api/recommend.ts` - Backend processing

### Data Flow
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

### APIs (pages-router)
- `/pages/api/recommend.ts` — survey pipeline
- `/pages/api/recommend/free-text.ts` — Canva-like intake → signals extraction
- `/pages/api/intake/plan.ts` — plan intake → chapter skeleton JSON
- `/pages/api/stripe/webhook.ts` — finalize payments
- `/lib/email.ts` — Resend helpers

### Environment Variables
See `.env.example`. Mirror values in Vercel:
- `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_CHECKOUT_ENABLED`, `NEXT_PUBLIC_EXPORT_ENABLED`, `NEXT_PUBLIC_AI_ENABLED`
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`, `RESEND_FROM`, `SESSION_COOKIE_NAME=pf_session`
- Optional LLM: `LLM_PROVIDER`, `OPENAI_API_KEY` or Azure/Vertex equivalents

### Storage
- Supabase Storage bucket `exports` (signed URLs only)
- Client-side localStorage for session data
- No server persistence: Stateless API design

## Data Model

### Core Data Files
- `data/questions.json` - Universal question definitions (10 questions)
- `data/programs.json` - Funding program database
- `data/registry/` - Specialized program registries (banks, grants, visa)

### Supabase Tables
- `profiles` (reserved)
- `reco_sessions` - One per recommendation run
- `reco_answers` - One per question answered
- `reco_results` - Score, reason, program_id
- `plan_documents` - One per plan
- `plan_versions` - Autosave snapshots
- `uploads` - Files in storage
- `orders` - Pending → paid status
- `payments` - Provider receipt
- `exports` - Artifact path, hash
- `journey_events` - Page milestones
- `intake_submissions` - Form submissions

### RLS Strategy (no sign-in at MVP)
- All app tables include `session_id text`
- RLS compares `session_id` to header `x-pf-session` (client supplies it via Supabase global headers)
- Optional: if using custom JWT, compare to claim `pf_session`

## Feature Flags

- `CHECKOUT_ENABLED=false` → renders PayButton disabled + info tooltip
- `EXPORT_ENABLED=false` → masks exports behind paywall or watermark
- `AI_ENABLED=false` → keeps vector/LLM features off until MVP is live

## Development Workflow

### Agent Loop — Execution & Update Cycle

**Core rule:** Work from the **repo**. Do not request extra instructions from chat unless a secret or external approval is required.

#### 1) Pre-flight (once per session)
- Confirm access: GitHub (repo read/write), Vercel (env), Supabase (URL/keys), Stripe (test), Resend (domain), optional LLM
- Read tech and product documentation
- Verify `.env` via `.env.local` or Vercel env (mirror of `.env.example`)

#### 2) Sync
- `git pull --rebase`
- Scan **BACKLOG.md** and **CHANGELOG.md**. Update your plan in a new branch if needed

#### 3) Build Steps (MVP scope)
- **Reco (3a)** — Survey + Canva-like Free-Text Intake → Signals + EduPanel → `reco_*`, `intake_submissions`
- **Plan (3b)** — Canva-like Intake → chapter skeletons → Editor autosave/snapshots → Preview metrics
- **Platform** — Cookie middleware (`pf_session`), Supabase migrations + RLS, Stripe Checkout (flag), Export (flag), Resend emails

#### 4) Flags & Compliance
- Feature flags: `CHECKOUT_ENABLED`, `EXPORT_ENABLED`, `AI_ENABLED` (keep false in production until legal OK)
- GDPR: pseudonymous `pf_session`, no PII before checkout, DSR via support email, no trackers

#### 5) CI/CD
- Commit in small, testable slices. Keep `main` deployable
- If Vercel build fails: read logs, fix, re-commit, re-deploy

#### 6) Update Loop
- After each change set:
  - Update **CHANGELOG.md** (what/why/how to verify)
  - Update **BACKLOG.md** (move Done → link to PR/commit; add next TODOs)
  - Keep docs as the **single source of truth**

### Testing Strategy
- **Smoke Tests:** `scripts/smoke.mjs` - Verify critical paths and data integrity
- **Manual Testing:** Wizard flow, AI intake flow, results page, error states
- **Run:** `npm run smoke`

## GDPR Compliance

### Baseline (MVP)
- **No sign-in.** Use pseudonymous cookie `pf_session`; no PII until Checkout
- **Data minimization.** Only store content needed for reco/plan/checkout/export
- **RLS.** Scope by `session_id` (header `x-pf-session`)
- **No analytics trackers at MVP**
- **Data Subject Requests.** Provide support email. Add deletion/export on request
- **Email.** Transactional only (Resend). Verify sending domain
- **LLM.** Keep `AI_ENABLED=false` in production until legal & DPA signed with EU-region provider

## Deployment

### Build Process
1. **Install:** `npm ci`
2. **Validate:** `npm run validate` (if available)
3. **Smoke Test:** `npm run smoke`
4. **Build:** `npm run build`
5. **Deploy:** Push to main branch

### Environment Setup
- **Node.js:** v22.17.1+
- **Package Manager:** npm
- **Build Tool:** Next.js
- **Styling:** Tailwind CSS
- **Hosting:** Vercel (Node 18+), `pnpm build`
- **Database:** Supabase (Postgres + Auth + Storage)

### Logging
- `journey_events` for page milestones
- Minimal server logs in API routes; no 3rd-party trackers at MVP

## Agent Guidelines

### Acceptance Criteria (MVP)
- **Reco:** ≤8 Qs, reasons + unmet reqs, Canva-like Intake + Signals + EduPanel
- **Plan:** Intake → editable chapters, autosave + snapshots, calculators, preview metrics
- **Pricing/Checkout/Export** behind flags; GDPR-safe; confirmation email on paid

### Key Files to Monitor
- `src/components/reco/Wizard.tsx` - Survey interface
- `pages/results.tsx` - Results display
- `src/lib/recoEngine.ts` - Main scoring logic
- `src/lib/scoring.ts` - Detailed scoring breakdown
- `pages/api/recommend.ts` - API endpoint
- `data/questions.json` - Question definitions
- `data/programs.json` - Program database

### Error Handling
- Graceful degradation for missing data
- User-friendly error messages
- Fallback mechanisms for AI processing
- Comprehensive error logging

### Performance Considerations
- Client-side processing for most logic
- Efficient data structures for scoring
- Minimal API calls
- Optimized bundle size

---

**Last Updated:** 2025-09-15  
**Version:** 1.0.0  
**Status:** MVP Development