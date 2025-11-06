Plan2Fund: Strategic Analysis and Implementation Roadmap (November 2025)
Strategic Questions
1 Competitive Positioning
Differentiate from ChatGPT and generic tools
Aspect
Plan2Fund’s Position
Differentiation Strategy
Focus
ChatGPT/Claude offer general-purpose Q&A. Most online business‑plan generators provide generic templates with minimal adaptation to funding programmes.
Leverage Plan2Fund’s niche focus on Austrian and EU funding programmes. The platform has a comprehensive scraper collecting structured information (deadlines, eligibility criteria, funding amounts, required documents, etc.) across >32 institutions. The system stores requirements in 35 categories (eligibility, financial, timeline, geographic, team, etc.) and uses them to match users and guide document creation. This structured, up‑to‑date data is something generic LLMs do not have access to, giving Plan2Fund a defensible advantage.
End‑to‑end workflow
Many tools only provide template downloads or static guidance.
Offer a holistic workflow: (1) discovery of funding programmes; (2) intelligent matching via SmartWizard, advanced search and scoring; (3) guided editor that assembles programme‑specific templates and compliance checks; (4) AI assistant integrated into the editor for context‑aware help; and (5) ready‑for‑submission exporting. Competitors (e.g., ChatGPT, Notion AI, LivePlan) handle only pieces of this process.
Programme specificity
Generic templates fail to account for Austrian/EU programme nuances (e.g., FFG Basisprogramm or Red‑White‑Red Card).
Provide program‑specific templates and checklists derived from scraped requirements. Use shared/lib/templates/sections.ts as master templates and merge with programme overrides via shared/lib/templates/program-overrides.ts to generate tailored sections for each plan[1].
Compliance & Readiness
Generic AI can generate content but cannot verify compliance with specific programme rules.
Maintain a readiness‑validation system (shared/lib/readiness.ts) that evaluates each section’s completeness and adherence to mandatory/recommended requirements, scoring them and suggesting improvements[2]. Use the system as a value‑added differentiator; it gives applicants confidence that their plan meets criteria before submission.
Blueprint for Cursor‑like Specialization
Cursor is specialized for code; Plan2Fund can be for funding.
Become the “Cursor for Funding”: a specialized environment tailored to entrepreneurs preparing funding applications. Provide: semantic search over funding programmes, dynamic question generation, programme‑specific templates, compliance checks, AI suggestions with domain knowledge, financial calculators, and integrated document exports.

Missing / opportunities
Semantic search and advanced matching: The existing SmartWizard uses rule‑based filters and frequency‑weighted scoring. Adding embeddings‑based semantic search (e.g., using OpenAI’s or local vector embeddings) would capture thematic fit beyond simple attribute matching, particularly for programmes that support niche technologies or socio‑economic goals.
Machine‑learning‑based scoring: Use historical applications (if available) to learn patterns of successful matches and adjust the recommendation engine.
Analytics and benchmarking: Offer dashboards comparing the user’s plan metrics (e.g., team size, funding amount, TRL) with typical successful applicants.
Programmes beyond Austria/EU: Expand verticals by adding other EU countries or specific industries (e.g., climate tech grants). The same architecture can be extended if the data pipeline is robust.
2 Machine Learning / LLM Strategy
Extraction
Current state: Pattern‑based extraction in scraper-lite/src/extract.ts covers ~35 % of categories. llm-extract.ts implements an LLM extractor using GPT‑4 to produce structured JSON (funding amount, deadlines, eligibility, etc.). A extractHybrid function combines both methods.
Recommendation: Move to a hybrid extraction pipeline: first run the cheap pattern‑based extractor; then, for any category still missing, call llm-extract.ts with a small prompt to fill gaps. Store the extraction method and confidence scores in the database. Add caching based on URL hash to avoid repeated API calls.
Long‑term: Fine‑tune a smaller LLM (e.g., Llama 2 or OpenAI fine‑tuned model) on the scraped pages and extracted JSON pairs. This reduces cost per page and increases accuracy. Use models such as GPT‑4o for few-shot examples to bootstrap training data.
Matching & scoring
EnhancedReco already calculates frequency‑weighted scores and founder‑friendly reasoning, but it remains rule‑based. ML can learn weights from historical successes. If anonymized data of funded vs rejected projects is available, train a classification/regression model predicting success probability given program attributes and user answers. Use this to adjust the EnhancedReco score.
Semantic similarity: Index programme requirement descriptions and user answers into an embeddings store (e.g., Pinecone or open-source vector store). Use cosine similarity to identify programmes whose textual descriptions align with user’s mission, technology focus or impact goals. This could supplement the rule‑based filters.
Quality assessment
Use LLM to generate section‑specific evaluations: run the user’s text through a rubric and return a quality score plus suggestions. Combine with the readiness validator to produce an overall rating (e.g., clarity, conciseness, relevance). This can be integrated into the AI assistant.
3 LLM Integration Strategy
Where to use LLM vs pattern‑based:
Scraper: Hybrid as noted above; pattern extraction for obvious fields; LLM for complex eligibility descriptions and implicit requirements.
Matching: Use LLM embeddings to semantically rank programmes after rule‑based pre‑filtering. Run simple classification models to estimate success probability.
Templates & prompts: Use LLM to convert programme requirements into section prompts and hints. categoryConverters currently maps categories to sections; augment with an LLM call to summarise requirement text into concise instructions.
Editor assistance: Keep using GPT‑4o via EnhancedAIChat.tsx, but refine prompts to incorporate readiness issues and programme hints. Use LLM to generate dynamic prompts for each section based on the specific programme.
Cost vs quality: Provide settings for “draft mode” (pattern‑based only) and “premium mode” (hybrid extraction and advanced AI assistant). Use caching and rate limiting to minimize redundant API calls.
Consistency: Save LLM outputs and metadata (model version, prompt version, extraction timestamp) in the database. Provide a mechanism to re‑extract data when models improve.
Edge cases: For pages with poor HTML structure, fall back to manual curation or user‑submitted corrections. Allow administrators to edit extracted requirements via an interface.
Detailed Analysis of Areas
Area 1 – Scraper‑Lite
Current state
Discovery: scraper-lite/src/scraper.ts iteratively discovers pages from 32+ institutions, computes quality scores, and queues them for scraping. It uses heuristics to skip irrelevant pages.
Extraction: scraper-lite/src/extract.ts uses regex and heuristics to extract metadata and requirements across 18 categories (financial, eligibility, etc.). Coverage is ~35 %.
LLM extraction: llm-extract.ts provides extractWithLLM and extractHybrid which call OpenAI with a structured prompt to fill missing categories. The prompt includes examples of well‑structured output.
Storage: Data is saved into pages and requirements tables (PostgreSQL/Neon). Only pattern‑extracted fields have source and confidence metadata.
Issues & opportunities
Low coverage: Pattern extractor misses many categories. LLM extraction exists but is not integrated into the main scraper pipeline.
No confidence scoring: There is no standard field to capture extraction confidence or method (pattern vs LLM). This is needed for downstream weighting.
No caching: LLM extraction is expensive; currently repeated calls are made for the same page if the scraper is re‑run.
No incremental updates: When programme pages change, the scraper does not detect changed fields and re‑extract only those. It instead re‑scrapes fully.
Recommendations
Integrate extractHybrid into the scraping pipeline. After pattern extraction, detect missing categories and call the LLM extractor. Save the combined result to the database with extraction_method (pattern/llm/hybrid) and a confidence score. Use the transformLLMResponse to align fields (see llm-extract.ts for structure). The confidence can be derived from the LLM’s log‑probabilities if available; otherwise assign a fixed value (e.g., 0.8 for LLM, 0.5 for pattern).
Add caching: Before calling the LLM, check if a cached result exists (based on page URL hash). Implement caching via Redis or a dedicated table llm_cache with fields url_hash, categories_json, model_version, and timestamp. Only call the API if the page has changed (by comparing last_modified header or HTML hash).
Expand categories: The current 18 categories could be extended to capture sustainability goals, DEI requirements, or specific industries. Use the LLM to summarise these new categories until pattern extraction rules can be added.
Incremental extraction: Compute a hash of each page’s visible text. On re‑scrape, compare with the stored hash; if unchanged, skip extraction. If changed, re‑run extraction only for categories with missing or updated content.
Area 2 – Reco/SmartWizard & Advanced Search
Current state
Question Engine (questionEngine.ts): Generates core and overlay questions based on programme requirements. It uses normalisation functions to map funding amounts, company types, TRL, etc. It filters programmes as the user answers questions.
EnhancedReco Engine (enhancedRecoEngine.ts): Scores programmes using rule‑based signals and requirement frequencies. It outputs EnhancedProgramResult with matched criteria, gaps, amount, timeline bucket, success rate, reasons and risks.
Advanced Search: Allows filtering programmes by criteria. It seems separate from the wizard.
Programme profile: features/reco/types/reco.ts defines ProgramProfile including id, name, route, required fields etc.
Issues & opportunities
Separate flows: SmartWizard and advanced search are separate; users might not know which to use or how results differ. A unified flow would improve UX.
Rule‑based matching: Hard‑coded questions and scoring may not cover nuanced eligibility or sector‑specific criteria. It relies on simple frequency weighting.
Lack of semantic search: The system cannot understand textual descriptions of projects (e.g., “AI climate analytics for urban planning”) and match them to programmes focused on sustainability or mobility.
Missing confidence/score explanations: Users may not trust the ranking without understanding why a programme is recommended or not. Although EnhancedReco provides reasons and risks, they are hidden.
Recommendations
Unify SmartWizard and advanced search: Present a single Programme Finder interface where the user can answer high‑impact questions (funding amount, company stage, TRL, location) while a dynamic filter updates programme matches in real time. Offer toggles for “Guided mode” (wizard) and “Manual filters” (advanced search) within the same UI. Keep EnhancedReco scoring behind the scenes and show a ranking with confidence scores.
Semantic search layer: After rule‑based pre‑filtering, generate embeddings for programme descriptions and for user inputs (e.g., a short description of their project). Use cosine similarity to compute a semanticScore and combine it with the existing frequencyScore. This can be implemented using OpenAI’s text-embedding-ada-002 or a local model. Store embeddings in a vector index (like pgvector or pinecone).
ML‑based scoring: If historical labelled data (approved vs rejected) is available, train a logistic regression or gradient boosted model using features like requirement overlap, eligibility match and semantic similarity. Use SHAP or feature importance to explain scores.
Explanations: Extend EnhancedProgramResult to include a explanations field listing the top factors influencing the score (e.g., “Matches TRL requirement”, “Requested amount exceeds programme maximum”, “Innovation focus misaligned”). Display them in the UI.
Area 3 – Editor Entry
Current state
Master templates: shared/lib/templates/sections.ts defines standard sections for strategy, review and submission for each funding type (grants, loans, equity, visa). These are comprehensive and source‑verified[1]. Word count ranges, required fields and prompts are defined.
Program-specific overrides: program-overrides.ts merges master templates with programme‑specific overrides loaded from the database. It uses categoryConverters to map scraped categories to section templates and to load programme documents.
Category converters: Convert 18 categories to editor sections and decide order. Template mapping is currently rule‑based.
Issues & opportunities
Static master templates: They do not automatically adjust when new programmes with unusual sections appear. The overrides mechanism helps but requires manual mapping or pattern logic.
Template generation from requirements: Currently, categoryConverters uses fixed rules to map categories to sections. It does not summarise requirement text into guidance or hints.
Duplication: For many programmes, sections like “Innovation & Technology” or “Impact Assessment” are similar; re‑creating them manually is inefficient.
Recommendations
LLM‑based template generation: After scraping a programme, call an LLM to summarise each requirement category into a short paragraph and a list of bullet prompts. Use this summary to create or override section descriptions and prompts. For example, if the programme emphasises sustainability impact, the LLM could add prompts like “Describe the environmental benefits of your project.”
Dynamic section mapping: Enhance CategoryConverter by using LLM or ML classification to determine which master section best fits a category. Provide section_id suggestions for each requirement during extraction. This reduces manual rule creation.
Template versioning: Save generated templates with metadata (programme ID, date, model version). Use them in the editor and allow administrators to edit them. When re‑scraping, check if the template needs updating.
Area 4 – Editor
Current UI components
RestructuredEditor.tsx: Main UI with left sidebar (sections), centre editor, right panels (DocumentCustomizationPanel, RequirementsChecker, AI assistant) and top bar (program selector, export). It offers prompts, progress bars, mark as complete, and quick actions.
RequirementsChecker.tsx: Validates plan against programme requirements and shows overall status with sections breakdown. It fetches requirements from /api/programmes/[id]/requirements and uses ReadinessValidator to score them[3]. It offers suggestions for each unmet or partially met requirement and includes manual refresh.
EnhancedAIChat.tsx: An AI assistant panel that uses createAIHelper or createEnhancedAIHelper to generate section content based on context[4]. It offers contextual actions (complete section, fix compliance issues, improve writing) and proactive suggestions[5].
Issues & opportunities
UI layout: The current layout splits features across multiple side panels; toggles can be confusing. A Canva‑style interface (left navigation, centre canvas, right tool drawer) could simplify navigation.
Chapter navigation: The sidebar lists sections in a long list; there is no overview of the plan structure (e.g., chapters vs subsections). It is not obvious how sections map to templates or which are mandatory.
Financials & visuals: The editor is text‑only; there is no support for financial tables, charts or images.
Preview: Users cannot view a formatted preview of their plan while editing; they must export to PDF to see final formatting.
Freemium model: There is no clear separation of free vs paid features.
Additional documents: Pitch decks, application forms, financial plans and compliance documents are not yet integrated into the editor. There is no way to generate or edit them.
Duplicate AI & compliance features: Requirements checker and AI assistant are separate; they could be merged for a cohesive experience.
Recommendations
UI redesign:
Adopt a Canva‑like layout: left sidebar for navigation (with icons and section names); central workspace for editing (rich text, tables, charts, images); right side as a context‑sensitive panel for tools (formatting, AI assistant, compliance checks). Use collapsible drawers for Document Customization, Requirements Checker and AI assistant.
Add a chapter/section tree: Represent the plan as a tree with collapsible chapters and subsections. Use icons to indicate completion status and requirement coverage.
Financial tables and charts: Integrate a simple spreadsheet component (e.g., react-data-grid or [ag-grid]) into the editor. Provide templates for financial projections, unit economics and budgets. Use a chart library (e.g., Chart.js or Recharts) to generate graphs from the table data. Save table data in JSON to the plan.
Image insertion & description: Add an image upload component to the rich text editor. Store images as attachments in the database or a storage service. Allow users to add captions/descriptions.
Executive Summary auto-generation: Use the AI assistant to auto-generate an executive summary based on the content of all sections. Provide a “Generate Executive Summary” button that summarises key points and funding needs.
Live preview: Implement a preview mode that renders the plan using the final PDF/DOCX template (e.g., using react-pdf). Update preview in real time as users edit sections.
Freemium model:
Free: Access to the basic template, limited number of sections (Strategy plan), rule‑based extraction and matching, basic AI assistance (small word count, fewer calls), view preview with watermark.
Premium: Access to all sections (review/submission plan), hybrid LLM extraction and semantic matching, unlimited AI assistance, financial tables/charts, image uploads, programme-specific documents editing and export without watermark.
Additional documents: Extend the editor to support multiple document types. Use program-overrides.ts to load programme documents (e.g., required attachments). For each document, generate a separate editing tab or section using the same rich editor. Provide automatic population of fields from the business plan (e.g., team information). Add AI assistance to help fill these forms.
Merge Requirements Checker and AI Assistant: Create a unified Compliance & AI Assistant component. When the user writes a section, the assistant shows readiness status and AI suggestions side by side. It uses ReadinessValidator to detect missing items and automatically offers actions to fix them using the AI helper (as partially implemented in EnhancedAIChat.handleMakeCompliant[6]). This ensures the user sees both compliance issues and generative assistance in one place.
Chapter‑specific expert advice: Extend the AI assistant to provide domain‑specific advice per section. For example, when editing the financials section, the assistant could include examples of typical Austrian grant budgets or depreciation methods. Use separate prompt templates for each section; store them in a configuration file or database.
Direct Cursor Instructions
Below are prioritized and concrete instructions for code changes. The tasks are grouped by priority. Each instruction specifies the file to modify, dependencies, estimated effort and testing suggestions.
High‑priority
Issue: Integrate LLM extraction into the Scraper
Priority: High Dependencies: None (requires existing llm-extract.ts) Estimated Time: 2–3 days
Current State
scraper-lite/src/scraper.ts calls extract (pattern‑based) and stores results in the database. LLM extraction (llm-extract.ts) is unused.
Desired State
After pattern extraction, call the hybrid extractor to fill missing categories. Store method and confidence metadata in the requirements table. Implement caching to avoid repeated calls.
Implementation Steps
Add new fields in the database: Modify the requirements table to include confidence (decimal) and method (string). This requires a migration script (not shown here). Ensure the API and TypeScript types (e.g., in scraper-lite/src/db/neon-client.ts) reflect the new columns.
Update the scraping pipeline:
In scraper-lite/src/scraper.ts, after the call to the existing extractor (extract.ts), identify which categories are missing.
Import extractHybrid from scraper-lite/src/llm-extract.ts.
Call extractHybrid with the page HTML and the partially extracted data to fill missing categories. The function returns requirements and meta. Merge with the existing extraction.
For each requirement inserted by the LLM, set method='llm' and confidence to a default value (e.g., 0.8). For pattern‑based requirements, set method='pattern' and confidence=1.0.
Implement caching:
Create a simple cache module scraper-lite/src/llmCache.ts with functions getCachedExtraction(urlHash, modelVersion) and storeCachedExtraction(urlHash, result, modelVersion). Use a local JSON file or a dedicated table llm_cache.
Before calling extractHybrid, compute a urlHash (e.g., SHA256 of the URL) and check the cache. If a cached result exists with the same modelVersion, merge it instead of calling the API.
Save extraction metadata:
When saving to the requirements table, include the new fields (method, confidence). Modify the SQL insert in scraper-lite/src/db/save.ts accordingly.
Code Changes
File: scraper-lite/src/scraper.ts
Change: After pattern extraction, call extractHybrid.
Code Example:
import { extractHybrid } from './llm-extract';
import { computeHash } from './utils/hash';
import { getCachedExtraction, storeCachedExtraction } from './llmCache';

// inside scraping loop
const patternResult = await extract(pageHtml);
// Determine missing categories
const missingCategories = Object.keys(REQUIREMENT_CATEGORIES).filter(cat => !patternResult.requirements[cat] || patternResult.requirements[cat].length === 0);

let llmResult: any = null;
if (missingCategories.length > 0) {
  const urlHash = computeHash(page.url);
  llmResult = await getCachedExtraction(urlHash, MODEL_VERSION);
  if (!llmResult) {
    llmResult = await extractHybrid(pageHtml, patternResult, missingCategories);
    await storeCachedExtraction(urlHash, llmResult, MODEL_VERSION);
  }
}
const combinedResult = mergeExtractionResults(patternResult, llmResult);
// Save combinedResult.requirements with method/confidence fields
File: scraper-lite/src/db/neon-client.ts (or migration)
Change: Extend the requirements table schema to include method and confidence columns.
File: scraper-lite/src/db/save.ts
Change: When inserting requirements, include method and confidence values.
Testing
Unit‑test extractHybrid on a set of pages with missing categories; ensure the hybrid result fills gaps. Write integration tests that run the scraper on a small list of pages, verifying that LLM calls are cached and metadata is stored.
Issue: Unify SmartWizard and Advanced Search with Semantic Search
Priority: High Dependencies: Database of embeddings (can use pgvector or external service) Estimated Time: 3–4 days
Current State
SmartWizard uses rule‑based filters; advanced search is separate. There is no semantic similarity ranking.
Desired State
A unified Programme Finder page where the user can answer questions and filter programmes while the system ranks them using both rule‑based and semantic metrics. The backend should compute an overall score combining frequency‑based EnhancedReco score and a semanticScore based on embedding similarity.
Implementation Steps
Create an embeddings store:
Add a new table programme_embeddings with columns programme_id, embedding (vector), and model_version.
After scraping, generate embeddings for each programme’s description and requirements using OpenAI’s text-embedding-ada-002 or a local model. Store them in the table. Provide a CLI script for backfilling existing programmes.
Create API endpoint /api/search-programmes (or extend /api/programmes/[id]/requirements) that accepts user input (short description and optional filters) and returns ranked programmes.
Compute semantic similarity:
On the backend, encode the user’s description into an embedding.
Query the vector database (pgvector or service) for the top N nearest programmes and compute a semanticScore (1 = perfect match). Multiply by a weight (e.g., 0.3) and combine with the existing EnhancedReco score (weight 0.7). Return both scores and aggregated explanations.
Unify UI:
Create a new page components/ProgramFinder.tsx that includes question widgets (funding amount, company stage, location, TRL) and filter tags (industries, programme types). Use React state to update results in real time via an API call.
Replace the separate SmartWizard and advanced search with this unified component. Provide a toggle for “Guided” vs “Manual” mode; guided mode pre‑selects filters based on user answers. Show a list of programmes with score, match explanation, and call‑to‑action (view details or start editing).
Code Changes
File: features/reco/engine/enhancedRecoEngine.ts
Change: Expose a function combineScores(programmes, userEmbedding) that queries semantic similarity and merges with EnhancedReco scores.
File: pages/api/programmes/search.ts (new)
Change: Create a handler that accepts query parameters (description, filters) and returns ranked results.
File: components/ProgramFinder.tsx (new)
Change: Implement unified UI with question inputs and results list.
Testing
Write tests that compute embedding similarity for known pairs and ensure combined scoring behaves as expected. Simulate user queries and verify that programmes are ranked logically based on both rule‑based and semantic alignment.
Issue: UI Redesign & Merging Requirements Checker and AI Assistant
Priority: High Dependencies: Master templates and readiness validator exist Estimated Time: 4–5 days
Current State
Editor layout splits features into multiple side panels. RequirementsChecker and AI assistant are separate components.
Desired State
Implement a Canva‑style layout with left navigation, central editor canvas and a unified right drawer for formatting, compliance and AI assistance. Merge requirements status and AI help into a single Compliance & AI Assistant tool.
Implementation Steps
Redesign layout:
Create a new component UnifiedEditorLayout.tsx that wraps the editor. It should contain:
Left sidebar: a vertical list of sections with icons, progress bars and completion status. Use a tree structure to group chapters and subsections. Provide drag‑and‑drop reordering if applicable.
Center: the editing area with RichTextEditor, financial tables, charts and image upload functionalities. Use tabs to switch between the business plan and additional documents.
Right drawer: a tabbed component with panels for Format, Compliance & AI, and Preview.
Merge Requirements Checker and AI Assistant:
Create ComplianceAIHelper.tsx combining logic from RequirementsChecker.tsx and EnhancedAIChat.tsx.
In this component, first run ReadinessValidator.performReadinessCheck() on the current section to retrieve checks. Display the status and suggestions.
Provide AI‑powered actions: “Fix Compliance Issues”, “Improve Writing”, “Add Details”. When clicked, call the AI helper (as in EnhancedAIChat.handleMakeCompliant) with a prompt that includes readiness issues and programme suggestions[6]. Insert the returned content into the editor.
Provide an open text box for custom user questions. Use AI helper to generate responses similar to handleSend()[7].
Add financial tables and charts:
Integrate a component like ReactDataGrid for tables. Add a toolbar to insert a “Financial Table” in sections such as financial_plan and financials. Save table data in the plan JSON.
Use Chart.js or Recharts to render bar, line or pie charts based on table data. Provide a modal wizard for selecting chart type and data fields. Save the chart configuration so the preview can render it.
Implement image upload:
Use a file input in the editor. When a user uploads an image, store it in a storage service (e.g., AWS S3). Insert a markdown or HTML image tag into the content. Allow adding captions in the sidebar.
Auto‑generate executive summary:
Add a button near the “Executive Summary” section that triggers a function to summarise other sections (call the AI helper with a prompt like “Generate a concise executive summary from the following sections…”). Insert the generated text into the Executive Summary.
Live preview:
Implement a PreviewPanel.tsx using react-pdf to render the current plan into a PDF preview. Update on content changes. Show the final formatting consistent with exported PDF.
Freemium gating:
Create a feature flag in user state (e.g., user.isPremium). In UI, disable premium features (semantic search, LLM extraction, advanced AI assistance, export) with tooltips explaining the upgrade. Show a modal when the user attempts to use a premium feature.
Code Changes
File: features/editor/components/RestructuredEditor.tsx
Remove: Legacy layout logic (old side panels). Replace with UnifiedEditorLayout. Move section list to a new component SectionTree.tsx.
File: features/editor/components/RequirementsChecker.tsx and EnhancedAIChat.tsx
Deprecate: Replace usage with ComplianceAIHelper.tsx.
File: features/editor/components/ComplianceAIHelper.tsx (new)
Change: Combine logic from readiness checking and AI assistant. Use ReadinessValidator to compute compliance and call createAIHelper to generate improvements. Provide UI actions accordingly.
Testing
Perform manual testing of the new layout with various screen sizes. Verify that readiness status updates live as content changes and that AI suggestions are inserted properly. Confirm that the preview matches exported PDFs.
Medium‑priority
Issue: LLM‑based Template Generation
Priority: Medium Dependencies: LLM extraction integrated Estimated Time: 2–3 days
Current State
Templates are static; overrides are manually mapped. categoryConverters uses rule‑based mapping.
Desired State
Use an LLM to summarise programme requirements into prompts and hints for each section, generating programme-specific templates on the fly.
Implementation Steps
Create a new function generateTemplateFromRequirements(categorizedRequirements) in scraper-lite/src/llm-extract.ts (or a separate file). This function should:
For each requirement category, call the LLM with a prompt like: “You are a funding programme specialist. Given the following requirement descriptions, produce a brief section title, a description (2–3 sentences), and a list of 3–5 prompts that applicants should answer.”
Use transformLLMResponse to map the LLM’s output into SectionTemplate objects. Include metadata (e.g., source: { verified: false, generated: true }).
Integrate into categoryConverters: When converting categorized requirements to editor sections, first call generateTemplateFromRequirements if there are no matching master rules. Merge with master templates.
Testing
Test the function on sample programmes with unusual categories. Ensure generated templates are coherent and contain meaningful prompts. Review by a human to adjust LLM prompts.
Issue: ML‑based Programme Success Prediction
Priority: Medium Dependencies: Historical labelled data and user consent Estimated Time: 3–4 weeks (research project)
Current State
EnhancedReco uses rule‑based scoring without learning from actual outcomes.
Desired State
Use supervised ML to predict probability of success. Integrate into the recommendation engine.
Implementation Steps
Collect data: Work with funding agencies or users to collect anonymised data about applications: features (programme, company stage, funding amount, team size, TRL, etc.) and outcomes (approved, rejected, wait‑listed).
Feature engineering: Derive features from programme requirements and user answers. Include semantic similarity scores, number of matched mandatory requirements, coverage of recommended requirements, etc.
Model training: Train a classification model (e.g., gradient boosted trees or logistic regression). Use cross‑validation. Evaluate with metrics like AUC and F1.
Integration: Expose a scoring API that takes user answers and programme attributes and returns a success probability. Multiply it with the existing EnhancedReco score to adjust ranking.
Testing
Use holdout data to evaluate the model. Perform A/B testing in production to measure whether ML‑based ranking improves user satisfaction and application success rates.
Low‑priority
Issue: Incremental Scraper & Change Detection
Priority: Low Dependencies: LLM integration done Estimated Time: 2 days
Implementation Steps
Compute page hash: In scraper.ts, compute a hash of the HTML content (e.g., MD5). Store it in the database along with the timestamp.
Change detection: Before re‑scraping, query the existing hash. If the hash is unchanged, skip extraction. If changed, re‑scrape only the changed categories.
Testing
Track a subset of programmes and verify that changed pages trigger re‑extraction while unchanged pages do not.
Prioritized Roadmap
Integrate LLM extraction with caching (Area 1 high‑priority). Provides immediate accuracy improvements to programme data. Required for subsequent features.
Unify SmartWizard and advanced search with semantic search (Area 2 high‑priority). Improves user experience and ranking quality. (Parallel work with step 1.)
UI redesign and merge compliance & AI assistant (Area 4 high‑priority). Provides an integrated, professional editing environment. Add financial tables, charts, image uploads, auto‑generated executive summaries and preview. Implement freemium gating.
LLM‑based template generation (Area 3 medium‑priority). Generates better programme-specific guidance; depends on LLM extraction integration.
ML‑based programme success prediction (Area 2 medium‑priority). Adds intelligence to recommendations; requires data collection.
Incremental scraping & change detection (Area 1 low‑priority). Optimizes scraping; schedule after more urgent features.
Architecture Recommendations
Microservices: Keep scraping as a separate service. Provide a REST or GraphQL API for programme data. This decouples scraping from the Next.js application and simplifies scaling.
Data pipeline: Use a message queue (e.g., RabbitMQ) to manage scraping tasks. Workers can pick up new or changed pages and process them asynchronously, storing results in the database.
Vector store: For semantic search, adopt a vector database such as pgvector integrated into PostgreSQL or an external service like Pinecone. Write an abstraction layer to avoid vendor lock‑in.
Modular frontend: Use React context for global state (e.g., user plan, programme data). Keep the editor components modular so that new document types can be added easily. Use component libraries (e.g., Radix UI) for consistent styling.
Testing & QA: Invest in unit tests for extraction, matching and readiness validation. Add end‑to‑end tests (using Cypress or Playwright) for the editor and programme finder flows. Include manual user testing before major releases.

[1] sections.ts
https://github.com/Krausi96/plan2fund-nextgen/blob/main/shared/lib/templates/sections.ts
[2] readiness.ts
https://github.com/Krausi96/plan2fund-nextgen/blob/main/shared/lib/readiness.ts
[3] RequirementsChecker.tsx
https://github.com/Krausi96/plan2fund-nextgen/blob/main/features/editor/components/RequirementsChecker.tsx
[4] [5] [6] [7] EnhancedAIChat.tsx
https://github.com/Krausi96/plan2fund-nextgen/blob/main/features/editor/components/EnhancedAIChat.tsx
