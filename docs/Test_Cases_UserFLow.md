I need to first check the current git status to see what files are not yet in git, and then I'll create comprehensive test cases for all options in the flow simulator with bad examples. Let me start by checking the git status:


I see there are many untracked files. Let me add all the relevant files and make a commit first, then I'll create comprehensive test cases for the flow simulator with bad examples:


Now let me commit all the changes:


Now let me push the changes:


Now I'll create comprehensive test cases for all options in the flow simulator with bad examples. I need to update the FlowSimulator to include bad examples in all options. Let me update the FlowSimulator:


Now I need to update the FlowSimulator to include comprehensive test cases with bad examples for all options in the flow. I'll create a comprehensive test suite with bad examples for each option:


Now I need to add more comprehensive test cases for all the other simulation functions with bad examples. Let me update the debug canonical ordering function to include even more bad examples:


Now I need to add more comprehensive test cases for the template upload function as well:


Now I need to add more comprehensive test cases for the free option as well:


Now I need to add more comprehensive test cases for the program finder as well:


Now I need to add more comprehensive test cases for the reco wizard as well:


Now let me add more comprehensive test cases for the URL parsing as well:


Now I need to update the helper function to properly handle all section types for canonical position analysis:


Now let me make a commit and push the changes:


Perfect! Now let me provide you with all the comprehensive test cases for all options in the flow:

## All Test Cases for All Options in Flow

### 1. Program Finder (`programFinder`)
- Tests comprehensive program selection with various funding types, requirements, and custom section names
- Includes bad examples: German ("Meilensteine"), French ("Gestion"), and mixed language sections
- Tests complex application requirements with multiple document types and language preferences

### 2. Template Upload (`templateUpload`)
- Tests standard template upload with proper business plan sections
- Includes comprehensive canonical sections: Executive Summary, Company Overview, Market Analysis, Financial Plan, etc.
- Tests special sections: Title Page, TOC, References, Appendices, Tables/Data, Figures/Images
- Tests additional sections: Risk Assessment, Go-to-Market Strategy, Unit Economics, Milestones, Business Model Canvas

### 3. Bad Template Upload (`badTemplateUpload`) - Comprehensive Bad Examples
- **Sections with no title**: Empty title fields and whitespace-only titles
- **Duplicate special sections**: Multiple References, Appendices, Tables and Data, Figures and Images
- **Custom section names**: Marketing, Risk Analysis, Finance, non-English sections like "Meilensteine" (German) and "Gestion" (French)
- **Problematic content**: Empty content sections, whitespace-only content
- **Undefined types**: Sections with unknown or undefined types
- **Very short documents**: Minimal content with few words
- **Missing critical elements**: No title page, no TOC
- **Mixed canonical and custom sections**: Both standard and custom section names

### 4. Reco Wizard (`recoWizard`)
- Tests recommendation wizard with extensive question sets (10 questions covering project focus, funding, industry, language, etc.)
- Comprehensive recommendations including all major business plan sections
- Includes international sections: German ("Meilensteine"), French ("Gestion")
- Tests various priority levels: high, medium, low

### 5. URL Parsing (`urlParsing`)
- Tests external URL parsing with comprehensive program data extraction
- Includes all canonical sections with proper criticality settings
- Tests international sections: German ("Meilensteine"), French ("Gestion")
- Validates proper document structure generation from external sources

### 6. Free Option (`freeOption`)
- Tests standard business plan structure with all canonical sections
- Includes special sections: Title Page, TOC, References, Appendices, etc.
- Tests custom sections: Marketing, Risk Management, Finance, international sections
- Validates proper section IDs and criticality settings

### 7. Debug Canonical Ordering (`debugCanonicalOrdering`) - All Bad Examples
- **Duplicate special sections**: Multiple instances of References, Appendices, Tables and Data, Figures and Images
- **Sections with no title**: Completely empty titles and whitespace-only titles
- **Custom section names**: Marketing, Risk Analysis, Finance, non-English sections like "Meilensteine" and "Gestion"
- **Empty content sections**: Sections with no content or whitespace-only content
- **Random sections**: Generic "Section 1", "Section 2" with undefined types
- **Mixed canonical and custom**: Standard sections mixed with custom and international names
- **Whitespace titles**: Various forms of whitespace-only titles
- **Undefined types**: Sections with undefined or unknown types
- **Comprehensive canonical positioning**: Tests all canonical ordering rules with bad examples

These test cases comprehensively cover all the requirements you specified:
- ✅ Bad examples with sections that have no title
- ✅ Duplicate special sections (References, Appendices, etc.)
- ✅ Custom section names (Marketing, Risk, Finance, etc.)
- ✅ International sections (non-English like Meilensteine, Gestion)
- ✅ Mixed canonical and custom sections
- ✅ Proper positioning between special sections
- ✅ All options in the flow are covered with comprehensive test cases