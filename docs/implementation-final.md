### Implementation Plan

**Phase 1 – Template Foundation**
- Build `mergeSections` and `mergeDocuments` utilities in `features/editor/templates.ts` to combine base + program schemas, dedupe questions, and attach `visibility`/severity metadata.
- Expand section/question/document types to store visibility, severity, origin tags, and custom flags.
- Update `useEditorStore` hydration to call the merge functions, persist optional-section toggles, `sectionOrder`, `layoutMode`, autosave timestamps, requirement results, and custom templates.
- Enhance requirement validation logic: severity-aware badges, per-question/section summaries, background recalculation, and selectors for UI.
- Add unit tests covering merge logic, metadata propagation, and requirement validation.

**Phase 2 – PlanConfigurator Wizard**
- Refactor `PlanConfigurator.tsx` into a two-step experience: 
  1) product/program selection, 
  2) merged section/document overview with toggles, drag-and-drop ordering, guidance previews, and additional-document upload slots.
- Persist wizard outcomes (chosen template, optional sections, document uploads) in store and wire hydration to honor them.
- Allow saving/reusing custom templates per program.

**Phase 3 – Workspace Split View & Modes**
- Introduce a reusable SplitPane component and embed `PreviewWorkspace` inline within `Workspace.tsx`.
- Implement layout modes in store/UI:
  - Guided: single question card, progress controls, autosave indicator.
  - Outline: section tree + multi-question form + preview.
  - Full Preview: preview pane expands, watermark + copy-protection overlay.
- Replace question rail with expandable horizontal chips supporting drag-reorder, completion/severity badges, and add/clone actions.
- Integrate requirement badges and summary bar components; clicking badges scrolls to the relevant question.

**Phase 4 – Editor & Prompt Enhancements**
- Update `QuestionCard`/`SimpleTextEditor` to use conversational prompts, “Why we ask” tooltips, inline KPI/image renderer, and AI insertion hooks.
- Support renaming/reordering sections/questions, cloning sections, and adding custom questions (flagged for validation).
- Respect `visibility` metadata for progressive disclosure (essential vs advanced/program-only groups).
- Add autosave status UI and inline severity badges beside question titles.

**Phase 5 – AI Assistant Drawers & Context Ribbon**
- Move AI/Data tabs into slide-out drawers that overlay the preview pane; keep requirements checker accessible via icon with issue count.
- Extend `sectionAiClient` payload with new context selector (section/question metadata, prior answers, requirement gaps, KPIs).
- Display a context ribbon (“AI knows …”) and convert suggestion area into a threaded stream with insert/replace actions and section-aware quick prompts.
- Add optional inline autocomplete (Tab accept) triggered after typing pauses.

**Phase 6 – Requirements Checker 2.0 & Secure Preview**
- Run validation continuously in background, surface per-section status in sidebar, inline badges, and a final-review modal gating exports until critical issues resolve or are marked “Not applicable”.
- Enhance preview security: watermark only in full-preview mode, blur/unlock flow, copy-protection overlay, secure export buttons tied to validation state, and telemetry for unlock/export events.

**Phase 7 – Testing & Instrumentation**
- Unit: merge utilities, requirement validation, new selectors.
- Component/snapshot: SectionWorkspace split view, badges, autosave indicator, PlanConfigurator wizard states.
- E2E: PlanConfigurator flow, drag-and-drop reordering (sections + question chips), inline preview behavior across modes, AI insertion into editor, requirement gating on export.
- Instrument telemetry for mode usage, template customization, requirement violations, AI adoption, and preview unlocks.

This phased plan builds the merged-template foundation first, then layers the new configurator, split workspace, richer editor experience, AI drawers, requirement system, and secure preview—matching the proposals’ priorities while keeping dependencies manageable.