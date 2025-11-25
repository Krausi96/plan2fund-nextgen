# AI-Assisted Editor UX Improvement Plan

This document translates the stakeholder briefs (“UX Improvement Plan” and “Extended UX Plan”) into actionable implementation steps grounded in the current Plan2Fund editor code base. Each section contrasts today’s behavior with the desired experience and lists the practical steps to get there.

## 1. Merge Product + Program Templates

**Current state**
- During hydration the editor loads a single template set based on product type and ignores funding-program overrides. There is no deduplication between base and program-specific prompts, so users see every question separately even if they overlap.

```244:289:features/editor/hooks/useEditorStore.ts
  hydrate: async (product, context) => {
    ...
    const templates = await getSections('grants', product, context?.programId, baseUrl);
    const sections = templates.map((template) =>
      buildSectionFromTemplate(template, savedSections, questionStates)
    );
    ...
  },
```

**Implementation steps**
1. **Template merge service**: extend `features/editor/templates.ts` so `getSections` composes (a) the base master template for the selected product and (b) the program-specific schema returned by `/api/programs/[id]/requirements`. Add fuzzy-key mapping to flag question collisions (e.g., “market_analysis” vs “competition”) and produce a normalized merged section array.
2. **Prompt fusion rules**: create a utility (e.g., `mergeQuestions.ts`) that merges overlapping prompts into a single `question` record with combined guidance, priority of required flags, and metadata showing which program(s) requested it. Store origin tags so hints/tooltips can mention the program-specific nuance.
3. **Progressive disclosure metadata**: add `visibility` metadata to each merged question (e.g., `essential`, `advanced`, `programOnly`). Update `buildSectionFromTemplate` to respect this, defaulting advanced/program-only questions to collapsed state in the UI.
4. **Testing hooks**: add unit tests around the merge service to ensure no required program question is dropped and duplication count decreases versus the naive union.

## 2. Streamline the Workspace Experience

**Current state**
- The central workspace renders a single active question card per section and exposes the other prompts as pills. There is no guided one-question-at-a-time mode, no section overview/wizard toggle, and expanded metadata/ancillary panels live outside this flow.

```68:226:features/editor/components/layout/shell/SectionWorkspace.tsx
  const activeQuestion =
    section.questions.find((q) => q.id === activeQuestionId) ?? section.questions[0] ?? null;
  ...
  {section && section.questions.length > 1 && (
    <div className="pb-3 border-b border-white/30 mb-3 relative z-10">
      ...
      {section.questions.map((q, index) => (
        <button
          key={q.id}
          role="tab"
          onClick={(e) => {
            e.stopPropagation();
            onSelectQuestion(q.id);
          }}
        >
```

**Implementation steps**
1. **Section overview rail**: add a collapsible section intro component (short summary, checklist) above the question card pulling copy from the merged template metadata.
2. **Guided vs Outline toggle**: introduce a workspace-level mode switch. In Guided mode, keep the current single-question presentation but add “Next/Previous” navigation and a progress bar (“Question 2 of 6”). In Outline mode, render accordions for every question in the section (collapsed by default) to satisfy users who want the big picture.
3. **One-question wizard**: add an optional full-screen “Focus Mode” triggered from the section header. Reuse the existing question card but present it in a modal/wizard that advances sequentially, showing completion indicators and allowing jump back.
4. **Progressive disclosure UI**: respect the `visibility` metadata from the merge service—only show “essential” questions by default and gate advanced/program-specific prompts behind an expandable group labeled e.g., “Additional questions for AWS Pre-Seed”.
5. **Autosave feedback**: add subtle “Saved • 12:04” indicators near the text area and maintain the existing autosave logic, so users feel safe navigating between modes.

## 3. AI Assistant as a Real-Time Co-Writer

**Current state**
- The right panel has an AI tab that reacts to the selected question. It offers three quick actions (outline, improve, data) and shows the latest suggestion, but it relies on a single `questionMeta` payload and manual copy/insert buttons. There is no proactive suggestion feed, no per-section memory summary, and no inline autocomplete.

```1:189:features/editor/components/layout/right-panel/RightPanel.tsx
const tabs = ['ai','data','preview'];
...
{effectiveView === 'ai' && (
  {question ? (
    <div>
      ...
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Button onClick={() => handleQuickAsk('outline')}>Draft outline</Button>
        <Button onClick={() => handleQuickAsk('improve')}>Improve answer</Button>
        <Button onClick={() => handleQuickAsk('data')}>Suggest data/KPIs</Button>
      </div>
      ...
      {question.suggestions && (
        <div>
          <p>Latest response</p>
          <div>
            <Button onClick={() => navigator.clipboard.writeText(suggestion)}>Copy</Button>
            <Button onClick={...}>Insert</Button>
```

```34:82:features/editor/engine/sectionAiClient.ts
export async function generateSectionContent({ sectionTitle, context, program, questionMeta, ... }) {
  const payload = {
    message: context,
    context: {
      sectionId: sectionTitle,
      currentContent: context,
      programType: program.type ?? 'grant',
      questionPrompt: questionMeta?.questionPrompt,
      ...
    },
```

**Implementation steps**
1. **Context assembler**: build a memoized selector in `useEditorStore` that compiles recent answers, datasets, KPIs, and requirement checker gaps into a structured context object. Feed this into `generateSectionContent` so the AI has holistic plan awareness.
2. **Memory ribbon UI**: above the assistant controls, show a “AI knows” chip list (e.g., product, target market, revenue goal) extracted from earlier sections to reinforce trust.
3. **Inline suggestion stream**: replace the single latest suggestion block with a threaded feed where the AI can push sentence-level or paragraph-level options. Include quick actions: “Insert”, “Replace selection”, “Ask follow-up”.
4. **Autocomplete hooks**: integrate lightweight inline completions inside `SimpleTextEditor` by listening for pauses and requesting short continuations from the AI when the user opts in (Tab to accept, ESC to ignore).
5. **Section-aware intents**: expand quick actions per category (e.g., in Financial sections surface “Build table from KPIs”; in Market sections surface “Draft SWOT”). This can be managed via a mapping derived from section categories.
6. **Assistant presence cues**: add subtle pulsing icon near the editor when the user stops typing for N seconds, prompting “Need ideas? Open the assistant.”

## 4. Requirements Checker 2.0

**Current state**
- Requirements validation lives only inside the preview tab, triggered manually by the “Run check” button. Feedback is scoped to the currently selected question and is primarily word count/keyword hints; there is no section checklist, no soft vs hard requirement distinction, and no entry points elsewhere in the UI.

```225:337:features/editor/components/layout/right-panel/RightPanel.tsx
{effectiveView === 'preview' && (
  ...
  <div className="border-t ...">
    <div className="flex items-center justify-between mb-3">
      <p>Requirements validation</p>
      <Button onClick={() => { setRequirementsChecked(true); onRunRequirements(); }}>
        Run check
      </Button>
    </div>
    {!requirementsChecked ? (
      <p>Run the checker...</p>
    ) : (
      <RequirementSummary ... />
    )}
```

**Implementation steps**
1. **Background section checks**: move `validateQuestionRequirements` into a background effect that runs whenever a question/section changes. Persist its results in store state so UI components can read them without extra clicks.
2. **Sidebar checklist**: extend `Sidebar.tsx` to display per-section requirement badges (green/yellow/red dots) and provide a hover tooltip summarizing unmet program requirements. Clicking a badge should jump directly to the first unmet prompt.
3. **Inline badges**: add subtle callouts under the section header (e.g., “Needs competitor analysis per i2b”) with contextual tooltips explaining why the requirement matters.
4. **Soft vs hard rules**: enhance the template metadata to tag each rule with `severity`. Update validation logic to prevent exporting/submitting when any “hard” rule fails while allowing the user to dismiss soft recommendations with a “Not applicable” reason stored in state.
5. **Final review modal**: before enabling export/preview share, show a summary modal listing any unresolved hard requirements and offering “AI help me fix this” buttons that trigger targeted assistant prompts.
6. **Positive feedback**: when a section passes all checks, display a short celebratory micro-animation near the completion badge to reinforce progress.

## 5. Conversational, Story-First Prompts

**Current state**
- Question prompts render directly from the template `prompt` text without contextual framing, and the interaction remains form-like despite the stylized card. There is no conditional logic to skip irrelevant prompts, and the placeholder text rarely explains why the question matters.

```229:259:features/editor/components/layout/shell/SectionWorkspace.tsx
<p className="text-2xl font-semibold ...">
  {question.prompt}
</p>
<SimpleTextEditor
  content={question.answer ?? ''}
  onChange={onChange}
  placeholder={question.placeholder}
/>
```

**Implementation steps**
1. **Prompt rewriting layer**: introduce a mapper that converts structured template metadata into conversational copy (e.g., “Tell us about who needs your product and why it matters”). Store both the formal “requirement label” and the conversational variant so the UI can display one while the checker uses the other.
2. **Contextual reason strings**: surface a short “Why we ask” tooltip beneath each prompt, referencing the funding program when relevant (e.g., “AWS Pre-Seed reviewers look for a clear USP here.”).
3. **Adaptive follow-ups**: implement lightweight branching—after the user answers “Who are your customers?”, automatically surface a follow-up chip like “Great. Want to outline how you’ll reach them?” that opens the next marketing prompt.
4. **Conditional visibility**: capture early answers (e.g., “Do you hold any patents?”). If the user selects “No”, auto-mark the subsequent patent detail question as “N/A” while still providing an override option.
5. **Story prompts & examples**: embed optional “story starter” accordions per section with micro-examples from the UX plan. Reuse the Data panel’s attachments to show how KPIs or datasets can enrich the story.
6. **Micro-interactions**: after each submission, display a brief acknowledgment (emoji or text) reinforcing the conversational feel without being distracting.

## 6. Secure, Transparent Preview Mode

**Current state**
- The preview tab already offers a live renderer with watermark and zoom controls, but users can freely select and copy text and there is no blurred/locked mode or gated export flow beyond the watermark toggle.

```332:409:features/editor/components/layout/workspace/preview/PreviewWorkspace.tsx
<div className="flex items-center gap-2">
  ...
  <label>
    <input type="checkbox" checked={showWatermark} onChange={...} />
    Watermark
  </label>
  ...
</div>
...
<ExportRenderer
  plan={planDocument}
  showWatermark={showWatermark}
  watermarkText="DRAFT"
  previewMode={viewMode === 'page' ? 'formatted' : 'preview'}
/>
```

**Implementation steps**
1. **Read-only overlay**: wrap the preview in a transparent overlay that blocks text selection/right-click by default. Show a banner explaining “Copy is disabled in Preview—use Export to share securely.”
2. **Blur/Unlock flow**: add an optional blur state (CSS filter) that keeps text legible for the author but discourages screenshots. Provide an “Unlock clarity” button that records the action and temporarily removes the blur.
3. **Watermarked screenshots**: extend `ExportRenderer` props to support tiled diagonal watermarks (e.g., service logo + “Draft”) that render both on-screen and in exported PDFs.
4. **Secure export CTA**: place “Download PDF (protected)” and “Share link” buttons directly under the preview. Tie them into the requirements checker so exports are blocked until hard requirements pass.
5. **Empty-section indicators**: if a section lacks content, render `[Section not completed yet]` (already in place) plus a “Jump to section” button that takes the user back into the editor, reinforcing the transparency loop.
6. **Analytics hooks**: log preview unlocks and export attempts to understand how often users encounter copy-protection friction and adjust thresholds accordingly.

---

### Recommended rollout order
1. Template merging + progressive disclosure (foundation for everything else).
2. Workspace modes & conversational prompts (immediate UX win once templates are merged).
3. Requirement checker 2.0 (ensures compliance as more adaptive prompts arrive).
4. AI co-writer enhancements (builds on richer context + checker data).
5. Secure preview upgrades (last-mile polish, easier once requirements gating exists).

Following this order keeps dependencies manageable and aligns with the stakeholder priority of reducing cognitive load while improving compliance and trust.

