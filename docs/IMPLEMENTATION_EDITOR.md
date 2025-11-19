# Editor Revamp Implementation Plan

Status tracker for the editor revamp described in:
- `docs/SECTION_1_WALKTHROUGH.md`
- `docs/EDITOR_WORKFLOW_HANDOVER.md`
- `docs/EDITOR_LAYOUT_V3.md`

Use this file to log execution order, decisions, and checkpoints so we can keep context without duplicating the original specs.

## Step 1 – Foundational Data Model Upgrades ✅ (done)
- Added `QuestionStatus` lifecycle (`blank | draft | complete | unknown`) plus optional note/timestamp.
- Persisted per-question state outside the legacy content blob (new `saveQuestionStates/loadQuestionStates` helpers).
- Updated the editor store to:
  - Rehydrate question statuses on load.
  - Recalculate section progress from “completed” prompts only.
  - Provide a “Mark as unknown” toggle with optional note and visible badge.
- Minimal-input heuristic now ensures only meaningful responses count as draft/complete.

## Step 2 – Right Panel & Data Tab UX Parity ✅ (done – 2025-11-18)
Goal: Bring the right column to Layout v3 parity.
- Rebuilt the Data tab inside the sticky right column with the Layout v3 hierarchy (info banner, CTA row, quick-add templates, and modern library cards).
- Replaced the category-specific copy with a single neutral guidance banner plus live stat chips (counts of datasets/KPIs/media and how many are linked to the active prompt) so the top of the panel feels interactive without hard-coded blurbs.
- Primary actions (`Add table`, `Add KPI`, `Add media`) sit at the top and open inline composers without disrupting the list below.
- Quick-add presets are now AI-driven: the Data tab points users to the Assistant for structure ideas, and whatever the assistant returns gets dropped into the existing composers (manual creation still works via the CTA buttons).
- Library cards now show type icons, attachment badges, Prev/Next navigation, and updated action buttons while keeping attach/edit/view/delete workflows intact.
- Existing dataset/KPI/media creation plus attach flows remain unchanged; automation hooks deferred until layout is battle-tested.

## Step 3 – Shared Metadata & Attachment Sync ✅ (done – 2025-11-18)
Goal: Normalize dataset/KPI/media metadata (`relatedQuestions[]`, tags, source, timestamps) and switch question attachments to reference IDs so edits propagate automatically.
- Introduced shared metadata across datasets/KPIs/media (`createdAt/updatedAt/source/relatedQuestions[]`) so every data item knows which prompts rely on it.
- Question attachments now store lightweight references (`{attachmentId, attachmentType}`) instead of cloning the asset, meaning any edit to a dataset/KPI/media instantly updates every prompt that references it.
- Attach/detach flows keep `relatedQuestions[]` in sync, and the Data tab + preview pane read from those references (legacy inline attachments continue to render but no longer get duplicated).
- Preview/export rendering resolves attachment references back to the source entity, so KPIs always show the latest values and datasets/media reuse the canonical metadata.

## Step 4 – AI Assistant Modes ✅ (done – 2025-01-XX)
Goal: Turn the assistant into a context-aware coach that reacts to each question's status, attaches evidence suggestions, and keeps coaching scoped per prompt.
- Back-end wiring: AI requests now include question status, stripped answer, attachment summary, and lightweight requirement hints so guidance mode (blank/unknown) differs from critique mode (draft/complete). Conversations are stored per question (`sectionId::questionId`).
- Quick actions wired: "Ask for structure" button in Data tab now jumps directly to Assistant tab with 'data' intent, enabling seamless flow from structure request to AI suggestions.
- Remaining UX work (future enhancements):
  1. **Conversation timeline UI** – show the per-question history (like a mini chat log) so users can revisit past answers and insert/copy any turn.
  2. **Action buttons** – add quick actions next to each suggestion (e.g., "Create KPI from suggestion", "Insert outline", "Preview table structure") so AI output flows straight into the Data tab composers or attachments.
  3. **Evidence assist** – when AI recommends adding a dataset/KPI/media, surface the existing catalog (what's already in the section) and let users attach with one click, or spawn a pre-filled composer.

## Step 5 – Smarter Requirements Engine & Gating ✅ (done – 2025-01-XX)
Goal: Enforce template-level compliance (status, word-count bands, required subtopics, attachment gating) before export, feeding those signals to both the Preview tab and the AI assistant.
- Scope covers template metadata only (per-section `validationRules` + `requiredAssets`). Program-specific requirements remain advisory for now (displayed in the requirements tab + AI hints) until we define deterministic rules per program.
- Implementation complete:
  1. ✅ Validate each required question is either `complete` or explicitly `unknown` (status validation).
  2. ✅ Check word counts against template `wordCountMin/Max` (±10% tolerance) and flag short/long answers.
  3. ✅ Map `validationRules.requiredFields` to simple heuristics (presence of field names/variations in answer) and warn if missing.
  4. ✅ Enforce `requiredAssets` (tables/KPIs/media) by ensuring attachments exist before marking a question complete.
  5. ✅ Surface validation results in the Preview tab with per-question details; pass blocking errors and warnings into the AI context so the assistant can explain how to fix them.
- The `validateQuestionRequirements()` function computes comprehensive validation per question, and results are displayed in the Preview tab with error/warning severity indicators. AI context now includes structured validation results for better guidance.

## Step 6 – Financial Automation (KPIs & Variables) ✅ (done – 2025-01-XX)
Goal: Leverage dataset structure + template knowledge to auto-suggest KPIs, tag financial variables, and lay groundwork for opt-in formulas without bloating the UI.
- Implementation complete:
  1. ✅ **Financial variable detection** – Automatically detects revenue, cost, budget, funding, profit, and margin columns in datasets based on naming patterns and context.
  2. ✅ **Auto-tagging** – Datasets are automatically tagged with financial variable types when created (e.g., 'financial', 'revenue', 'cost' tags).
  3. ✅ **KPI auto-suggestion** – When viewing a dataset, the system suggests relevant KPIs based on detected financial variables:
     - Total Revenue, Average Revenue (for revenue columns)
     - Total Cost (for cost columns)
     - Net Profit (when both revenue and cost exist)
     - Total Budget, Total Funding (for budget/funding columns)
     - Growth Rate KPIs (for time-series data)
  4. ✅ **One-click KPI creation** – Users can create suggested KPIs directly from dataset cards with pre-filled values and formulas.
  5. ✅ **Formula suggestion infrastructure** – `suggestFormulas()` function provides formula suggestions for dataset cells (opt-in, can be integrated into UI later).
- The system uses pattern matching on column names, dataset names, and descriptions to identify financial variables with confidence scores. KPI suggestions appear in expanded dataset cards with a "Create" button for instant KPI creation.

---

**Notes**
- Keep this document updated after each step (what shipped, open questions, follow-ups).
- When a step spans multiple PRs, add dated bullet sub-entries so we can trace progress quickly.

