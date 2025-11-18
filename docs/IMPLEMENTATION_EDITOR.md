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

## Step 2 – Right Panel & Data Tab UX Parity ⏳ (next)
Goal: Bring the right column to Layout v3 parity.
- Sticky tab bar with contextual info banner (category-specific guidance).
- Primary action buttons: `Add Table`, `Add KPI`, `Add Media`.
- Streamlined item cards with attach/edit/view/delete actions, Prev/Next navigation, and section/question context.
- Prep quick-add templates per section category.

## Step 3 – Shared Metadata & Attachment Sync
Goal: Normalize dataset/KPI/media metadata (`relatedQuestions[]`, tags, source, timestamps) and switch question attachments to reference IDs so edits propagate automatically.

## Step 4 – AI Assistant Modes
Goal: Provide guidance vs expert prompts, per-question conversation history, and richer payloads (question status, unmet requirements, attachment metadata).

## Step 5 – Smarter Requirements Engine & Gating
Goal: Replace the legacy word-count check with per-question validations (status vs unknown, tolerance bands, required keywords, attachment gating) and introduce export acknowledgments.

## Step 6 – Financial Automation (KPIs & Variables)
Goal: Leverage dataset structure + template knowledge to auto-suggest KPIs, tag financial variables, and lay groundwork for opt-in formulas without bloating the UI.

---

**Notes**
- Keep this document updated after each step (what shipped, open questions, follow-ups).
- When a step spans multiple PRs, add dated bullet sub-entries so we can trace progress quickly.

