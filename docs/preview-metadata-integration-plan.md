# Preview Workspace – Metadata Integration Plan

## Objectives
- Reduce the disconnect between the live preview and metadata/formal sections.
- Provide inline editing touchpoints for title-page data, appendices, and formalien without overwhelming the workspace.

## Recommended Additions Around the Preview
1. **Collapsible Title Sheet Editor**
   - Pin a slim panel above the faux page that reveals title, subtitle, tagline, contact info, and submission date.
   - Inline fields mirror `plan.titlePage` schema; edits debounce into the existing editor store.
   - Show completion pills (✅ / ⚠️) so users know whether export will include a polished title page.

2. **Metadata Drawer on the Right Edge**
   - Sliding drawer with tabs for “Identity”, “Contacts”, and “Regulatory”.
   - Each tab surfaces structured inputs (logo upload, addresses, compliance statements) with context-sensitive hints.
   - Drawer stays synced with metadata workspace so power users can still open the dedicated view.

3. **Appendix / Formalien Tabs Beneath the Preview**
   - Add a secondary tab strip (`Main Narrative`, `Appendix`, `Formalien`) that swaps the rendered dataset while keeping the page chrome identical.
   - When the user switches tabs, load the relevant section bundle (already persisted separately) and reuse `ExportRenderer`.
   - Provide quick links (“Open appendix editor”) to jump to the full workspace when deeper edits are required.

## What Remains in Metadata View
- Bulk imports (CSV uploads for team directory, capitalization tables) that require multi-step flows.
- AI-assisted prompts for generating legal boilerplate or disclaimers.
- Advanced formatting controls (custom fonts, page size, advanced numbering).

## Implementation Sequencing
1. **Shared Preview Context**
   - Promote preview-specific UI state (active tab, metadata drawer expansion, current section focus) into a dedicated hook so RightPanel and Preview page stay in sync.

2. **Title Panel Integration**
   - Build the collapsible block first; leverage existing `plan.titlePage` bindings to prove out inline metadata editing.

3. **Appendix Tab**
   - Refactor data loader to fetch `plan.appendices` alongside `plan.sections`.
   - Update `convertSectionToPlanSection` helper to accept a category flag so renderer can apply alternate numbering.

4. **Metadata Drawer**
   - Reuse field components from metadata workspace; render them in a narrow layout and gate optional ones behind accordions.

5. **Formalien Workflow**
   - Once the appendix tab is stable, add a second tab that surfaces formal sections (certifications, declarations) with editable blocks plus checklist indicators.

## Future Enhancements
- Plug the page footer “Page X of Y” bar into real pagination metrics once the export engine exposes them.
- Allow authors to add reviewer comments directly in the preview margin, anchored to sections/paragraphs.
- Provide status badges (e.g., “Title page 80% complete”) that aggregate metadata completeness across tabs.


