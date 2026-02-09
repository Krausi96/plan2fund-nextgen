# Current Document Import Structure Analysis

## Current Implementation Overview

The document import/processing system is currently **distributed** across multiple files and directories without a centralized entrypoint.

## Current Structure Mapping

### Proposed Structure vs Current Reality

| Proposed Component | Current Location | Status |
|-------------------|------------------|---------|
| `doc-import/ingest.ts` | ❌ **Missing** | No centralized entrypoint |
| `doc-import/extract.ts` | ✅ **Exists** (partial) | Distributed across extractors |
| `doc-import/sanitize.ts` | ✅ **Exists** (partial) | Content security validator present |
| `doc-import/structure.ts` | ✅ **Exists** (partial) | Structure building and detection present |
| `doc-import/enhance.ts` | ❌ **Missing** | No LLM enhancement layer |

## Current File Organization

### Entry Points (Centralized)
```
features/editor/components/
  └── DocumentUploadPanel.tsx                       # Single unified upload handler

features/editor/lib/utils/
  └── processUploadedDocument.ts                    # Centralized processing entry point

features/editor/lib/utils/1-document-flows/document-flows/processing/
  └── documentProcessor.ts                         # Main processing orchestrator (unchanged)
```

### Extraction Layer
```
features/editor/lib/utils/1-document-flows/document-flows/processing/extractors/
  ├── pdfExtractor.ts                              # PDF text extraction
  ├── docxExtractor.ts                             # DOCX text extraction
  └── txtExtractor.ts                              # Plain text extraction

features/editor/lib/utils/1-document-flows/document-flows/processing/utils/
  └── extractionUtils.ts                           # Section extraction logic
```

### Security/Sanitization
```
features/editor/lib/utils/1-document-flows/document-flows/processing/security/
  └── contentSecurityValidator.ts                  # Content validation and sanitization
```

### Structure Detection & Building
```
features/editor/lib/utils/1-document-flows/document-flows/processing/detection/
  └── documentStructureDetector.ts                 # Structure detection logic

features/editor/lib/utils/1-document-flows/document-flows/processing/structure/
  └── buildInitialStructure.ts                     # Structure building
```

### Enhancement Layer (MISSING)
```
❌ No LLM enhancement layer for:
  - Summary generation
  - Section intent detection
  - Gap analysis
  - Content improvement suggestions
```

## Key Issues with Previous Structure

1. **No Centralized Entrypoint**: Multiple components handled uploads independently
2. **Missing LLM Enhancement**: No post-processing enhancement layer
3. **Scattered Logic**: Processing logic spread across many files
4. **Inconsistent Interfaces**: Different upload handlers had different APIs

## Proposed Centralized Structure

Creating a centralized `doc-import/` module would consolidate:

```
features/editor/lib/doc-import/
  ├── ingest.ts              # Unified entrypoint for all document types
  ├── extract.ts             # Text extraction + metadata extraction
  ├── sanitize.ts            # Content security validation
  ├── structure.ts           # Structure detection + building
  └── enhance.ts             # LLM-powered enhancement layer
```

## Benefits of Centralization

1. **Single Responsibility**: One module handles all document ingestion
2. **Consistent API**: Unified interface for all document processing
3. **Extensible**: Easy to add new document types or processing steps
4. **Testable**: Centralized logic is easier to unit test
5. **Maintainable**: Clear separation of concerns

## Completed Implementation

1. ✅ Created centralized [processUploadedDocument.ts](file:///c:/Users/kevin/plan2fund/one_prompt_webapp_agent_package/plan2fund-nextgen/features/editor/lib/utils/processUploadedDocument.ts) as unified entry point
2. ✅ Consolidated existing extraction logic
3. ✅ Moved security validation to central module
4. ❌ Implement LLM enhancement layer (remaining)
5. ✅ Created unified entrypoint [DocumentUploadPanel.tsx](file:///c:/Users/kevin/plan2fund/one_prompt_webapp_agent_package/plan2fund-nextgen/features/editor/components/DocumentUploadPanel.tsx)
6. ✅ Refactored existing upload handlers to use new module