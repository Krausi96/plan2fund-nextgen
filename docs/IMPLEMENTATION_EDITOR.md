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

