# Custom Section Translation Implementation

## Problem
Custom section titles (e.g., "Finanzplan") don't translate when switching languages. Users expect bilingual business plans where section titles change with language selection.

## Goal
Enable custom section titles to translate automatically when switching between German/English.

## Implementation Plan

### Phase 1: Data Structure (30 mins)
- [ ] Create bilingual section title storage
- [ ] Update section creation to accept dual-language input
- [ ] Modify existing section data to support translations

### Phase 2: UI Updates (45 mins)
- [ ] Enhance Add Section form with language tabs
- [ ] Add translation toggle in section editor header
- [ ] Implement language-aware title display in TreeNavigator

### Phase 3: Integration (30 mins)
- [ ] Connect to i18n language switcher
- [ ] Ensure state persistence across sessions
- [ ] Handle mixed-language content scenarios

### Phase 4: Testing (30 mins)
- [ ] Verify "Finanzplan" ↔ "Financial Plan" translation
- [ ] Test existing custom sections
- [ ] Validate no regressions in core functionality

## Technical Approach

### Storage Format
```typescript
interface CustomSection {
  id: string;
  titles: {
    de: string;
    en: string;
  };
  content: string;
  // ... existing fields
}
```

### Key Files to Modify
- `features/editor/lib/store/editorStore.ts` - Section creation/update logic
- `features/editor/components/Navigation/TreeNavigator.tsx` - Title display
- `features/editor/components/Editor/SectionEditor.tsx` - Editor header
- `shared/i18n/translations/{de,en}.json` - Add translation keys

## Success Criteria
- [ ] Custom sections translate automatically on language switch
- [ ] Existing sections maintain backward compatibility
- [ ] No performance degradation
- [ ] Clean UI/UX for bilingual workflow

## Dependencies
None - Self-contained feature

## Estimated Time
2.5 hours total