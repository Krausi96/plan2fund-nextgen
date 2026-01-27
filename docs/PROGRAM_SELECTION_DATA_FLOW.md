# Program Selection Data Flow Analysis

## Three Synchronized Pathways

All three methods create the same `ProgramProfile` structure that feeds the blueprint panel.

### 1. Search/Wizard Method (Working)
**Components:** EditorProgramFinder → recommend.ts → CustomLLM
**Data Flow:**
```
User Answers → recommend.ts → CustomLLM Prompt → 
ProgramProfile with application_requirements → 
normalizeFundingProgram() → 
generateDocumentStructureFromProfile() → 
Blueprint Panel Display
```

**Example Output from CustomLLM:**
```json
{
  "id": "aws-innovation-grant-2024",
  "name": "AWS Innovation Grant",
  "description": "Support for innovative technology projects in Austria",
  "funding_types": ["grant"],
  "application_requirements": {
    "documents": [
      {
        "document_name": "Project Proposal",
        "required": true,
        "format": "pdf",
        "authority": "AWS",
        "reuseable": false
      },
      {
        "document_name": "Budget Plan",
        "required": true,
        "format": "excel",
        "authority": "AWS", 
        "reuseable": true
      }
    ],
    "sections": [
      {
        "title": "Executive Summary",
        "required": true,
        "subsections": [
          { "title": "Project Overview", "required": true },
          { "title": "Innovation Aspects", "required": true }
        ]
      },
      {
        "title": "Technical Description",
        "required": true,
        "subsections": [
          { "title": "Technology Used", "required": true },
          { "title": "Development Plan", "required": true }
        ]
      }
    ],
    "financial_requirements": {
      "financial_statements_required": ["Profit & Loss", "Cashflow"],
      "years_required": [1, 3],
      "co_financing_proof_required": true,
      "own_funds_proof_required": true
    }
  }
}
```

### 2. URL Parsing Method (TODO Implementation)
**Components:** ProgramOption → URL Parser → ProgramProfile
**Missing Logic:**
```typescript
// TODO: Implement in EditorProgramFinder
const handleUrlSubmit = async () => {
  // Parse URL to extract program info
  // Convert to ProgramProfile structure
  // Same application_requirements format as above
};
```

### 3. Manual Entry Method (Working)
**Components:** ProgramOption → Form → ProgramProfile
**Data Flow:**
```
Form Inputs → createProgramProfile() → 
Same ProgramProfile structure → 
Same blueprint generation pipeline
```

## Blueprint Panel Synchronization

All three methods feed the same data structure to:
- `normalizeFundingProgram()` in Program.utils.ts
- `generateDocumentStructureFromProfile()` function
- Blueprint panel renderer components

## Testing with Real Example

To test with "AWS GRANT Innovation":
1. Use Search/Wizard method to get real LLM response
2. Verify application_requirements are parsed correctly
3. Check blueprint panel displays documents/sections/financial requirements
4. Compare with manual entry method using same program data
5. Plan URL parsing implementation to match the same structure

The key is that regardless of entry method, all create the same `ProgramProfile` interface with `application_requirements` field that drives the blueprint generation.