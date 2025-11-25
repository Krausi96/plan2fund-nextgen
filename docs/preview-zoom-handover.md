## Preview Zoom Handover

**Author:** GPT-5.1 Codex  
**Date:** 2025-11-25  
**Status:** Complete – zoom controls now resize content while the page frame stays fixed

---

### Context
- The editor’s preview pane (`features/editor/components/layout/workspace/preview/PreviewWorkspace.tsx`) is supposed to show an A4-sized page rendered by `ExportRenderer`.
- Users expect the “Scale” buttons (90 %, 100 %, 110 %) to zoom in/out while keeping the full sheet visible.
- Pages themselves are rendered via `features/export/renderer/renderer.tsx` and styled heavily by rules in `styles/globals.css` (`.export-preview` + `.export-preview-page`).

### Problem (Resolved)
- Previous zoom implementation manipulated a CSS variable `--page-scale` that applied `transform: scale(...)` to `.export-preview-page`. Scaling the sheet itself caused it to overflow the viewport, so zooming in only revealed a cropped portion of the page.

### What Has Been Tried
1. **Nested content zoom:** Added a `page-content` wrapper within `.export-preview-page` and attempted to scale inner content instead of the sheet. Removed after it caused partial renders and layout drift.
2. **CSS variable approach:** Introduced `--content-zoom` plus `--page-scale`; removed after inconsistencies and clipping.
3. **Simplified revert:** Currently `PreviewWorkspace` just sets `--page-scale` to 0.40 / 0.47 / 0.55. This still scales the entire page, so zoom affects the sheet size and doesn’t keep it in view.
4. **Experimented with removing `.export-preview` scaling entirely** – but that results in full-size A4 (cannot fit the viewport) and still doesn’t provide a usable zoom experience.

### Current Code State
- `styles/globals.css`: `.export-preview` now exposes `--page-zoom` (default 1). A new `.export-preview-page-scaler` wrapper applies `transform: scale(var(--page-zoom))` while counter-scaling width/height to keep the sheet fully visible. Page margins are fixed at 1.5rem between sheets.
- `PreviewWorkspace.tsx`: presets set `--page-zoom` to 0.9 (90 %), 1 (100 %), or 1.1 (110 %).
- `renderer.tsx`: each `.export-preview-page` wraps its content (including page footers) with `.export-preview-page-scaler`, so only the inner content scales.

### Resolution Notes
1. Introduced `.export-preview-page-scaler` so we scale only the inner content and footer, not the sheet’s outer frame.
2. Added a `--page-zoom` custom property that defaults to 1 and is the single source of truth for zoom levels.
3. Updated the zoom presets in `PreviewWorkspace` to pass 0.9 / 1.0 / 1.1 to `--page-zoom`.
4. Fixed global styles to remove the old sheet-level scaling, keep constant page spacing, and ensure the scaler wrapper counter-balances the transform with `width`/`height: calc(100% / zoom)`.
5. Manually tested each preset; the entire A4 sheet remains visible while content becomes larger/smaller as expected.

### Files to Focus On
- `features/editor/components/layout/workspace/preview/PreviewWorkspace.tsx`
- `features/export/renderer/renderer.tsx`
- `styles/globals.css` (section around `.export-preview` and `.export-preview-page`)

### Notes
- User is frustrated; expect this handover to prioritize a reliable UX over clever transforms.
- No need to retain previous experiments; a clean reimplementation is acceptable.

