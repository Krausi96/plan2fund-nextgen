# Right Panel Overflow Issue - Handover

## Problem
Right panel (Data/Preview tabs) overflows the left panel and content is not scrollable. AI tab works because it has less content.

## Files Modified
- `features/editor/components/Editor.tsx` - RightPanel component (lines ~2509-2809) and wrapper div (line 1733)
- `features/editor/components/InlineTableCreator.tsx` - DataPanel component (line 415+)

## What Was Attempted
- Added `overflow-y-auto` to content area (line 2539)
- Added `flex-1` and `min-h-0` constraints throughout flex chain
- Removed maxHeight constraints to allow `items-stretch` to align panel heights
- Modified DataPanel structure to use flex layout

## Current State
- Content area has `overflow-y-auto` but DataPanel/PreviewPane children don't respect scrollable container bounds
- Both panels should end at same height (via `items-stretch` on parent)
- Right panel content should scroll when exceeding available space

## Next Steps
Review flex layout chain: parent wrapper → RightPanel → content area → DataPanel/PreviewPane. Verify height constraint chain and ensure children respect parent's scrollable area.

