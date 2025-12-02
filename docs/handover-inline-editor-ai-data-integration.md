# Handover: InlineSectionEditor AI & Data Integration

## **Status: Ready for Implementation** 🔴

### **Overview**
The RightPanel component (containing AI Assistant and Data Tab) was removed, but the functionality needs to be integrated into `InlineSectionEditor.tsx`. This document outlines the implementation plan to merge AI and Data functionality into the inline editor card.

---

## **Current State**

### **Files Involved:**
- ✅ `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx` (exists, ~695 lines)
- ❌ `features/editor/components/layout/Right-Panel/RightPanel.tsx` (removed)
- ❌ `features/editor/components/layout/Right-Panel/DataPanel.tsx` (removed, had lint errors)
- ❌ `features/editor/components/layout/Right-Panel/AIPanel.tsx` (removed)

### **Current InlineSectionEditor Structure:**
```tsx
// Current props include:
onAIHelp: () => void;  // Currently just a callback button
onDataHelp: () => void; // Currently just a callback button
```

### **Current Positioning Logic:**
- Editor positions itself relative to `#preview-scroll-container`
- Uses `calculatePosition()` to find target section/question element
- Positions editor next to or below the selected section
- Width: 320px (`EDITOR_WIDTH`)
- Max height: 420px (`EDITOR_MAX_HEIGHT`)

---

## **Required Changes**

### **1. Add Tab System to InlineSectionEditor**

#### **Implementation:**
```tsx
// Add tab state at component level
const [activeTab, setActiveTab] = useState<'ai' | 'data' | 'context'>('ai');

// Replace current AI/Data buttons (lines ~676-683) with tabs
<div className="flex gap-1 border-b border-white/20 mb-2">
  <button 
    onClick={() => setActiveTab('ai')}
    className={`px-3 py-2 text-sm ${activeTab === 'ai' ? 'border-b-2 border-blue-500' : ''}`}
  >
    💬 AI
  </button>
  <button 
    onClick={() => setActiveTab('data')}
    className={`px-3 py-2 text-sm ${activeTab === 'data' ? 'border-b-2 border-blue-500' : ''}`}
  >
    📊 Data
  </button>
  <button 
    onClick={() => setActiveTab('context')}
    className={`px-3 py-2 text-sm ${activeTab === 'context' ? 'border-b-2 border-blue-500' : ''}`}
  >
    📋 Context
  </button>
</div>
```

#### **Location:**
- Add tabs **after** the question navigation (around line ~550-600)
- Place **before** the answer textarea
- Keep tabs visible and accessible

---

### **2. Integrate Conversational AI Interface**

#### **Current State:**
- `onAIHelp` callback exists but functionality was in removed RightPanel
- Need to implement conversational chat interface

#### **Required Implementation:**

**A. Add AI Chat State:**
```tsx
const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
const [aiInput, setAiInput] = useState('');
const [isAiLoading, setIsAiLoading] = useState(false);
```

**B. Create AI Tab Content:**
```tsx
{activeTab === 'ai' && (
  <div className="flex flex-col h-full">
    {/* Quick Actions */}
    <div className="flex gap-2 mb-2">
      <Button size="sm" onClick={handleAIDraft}>Draft</Button>
      <Button size="sm" onClick={handleAIImprove}>Improve</Button>
      <Button size="sm" onClick={handleAISuggestData}>Suggest Data</Button>
    </div>
    
    {/* Chat Messages */}
    <div className="flex-1 overflow-y-auto mb-2 space-y-2">
      {aiMessages.map((msg, idx) => (
        <div key={idx} className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-100' : 'bg-gray-100'}`}>
          {msg.content}
        </div>
      ))}
    </div>
    
    {/* Input */}
    <div className="flex gap-2">
      <input
        value={aiInput}
        onChange={(e) => setAiInput(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleAISend()}
        placeholder="Ask AI for help..."
        className="flex-1 px-2 py-1 border rounded"
      />
      <Button onClick={handleAISend} disabled={isAiLoading}>Send</Button>
    </div>
  </div>
)}
```

**C. Implement AI Functions:**
```tsx
const handleAIDraft = async () => {
  // Call AI service to draft answer for current question
  // Use activeQuestion, section, plan context
};

const handleAIImprove = async () => {
  // Call AI service to improve existing answer
  // Use current answer content
};

const handleAISuggestData = async () => {
  // Call AI service to suggest data structures
  // Based on question requirements
};

const handleAISend = async () => {
  if (!aiInput.trim()) return;
  setIsAiLoading(true);
  // Add user message
  setAiMessages(prev => [...prev, {role: 'user', content: aiInput}]);
  // Call AI service
  // Add assistant response
  setAiMessages(prev => [...prev, {role: 'assistant', content: response}]);
  setIsAiLoading(false);
  setAiInput('');
};
```

**D. Context-Aware AI:**
- Pass `activeQuestion`, `section`, `plan` to AI service
- Include template requirements if available
- Reference previous sections for cross-section awareness
- Use question prompt and helper text as context

---

### **3. Embed Compact DataPanel**

#### **Current State:**
- `onDataHelp` callback exists
- Data creation callbacks exist: `onDatasetCreate`, `onKpiCreate`, `onMediaCreate`
- Attach callbacks exist: `onAttachDataset`, `onAttachKpi`, `onAttachMedia`

#### **Required Implementation:**

**A. Create Data Tab Content:**
```tsx
{activeTab === 'data' && (
  <div className="flex flex-col h-full">
    {/* Quick Add Buttons */}
    <div className="flex gap-2 mb-2">
      <Button size="sm" onClick={handleCreateTable}>📊 Table</Button>
      <Button size="sm" onClick={handleCreateKPI}>📈 KPI</Button>
      <Button size="sm" onClick={handleCreateMedia}>🖼️ Media</Button>
    </div>
    
    {/* Data Library (filtered by section) */}
    <div className="flex-1 overflow-y-auto mb-2">
      <h4 className="text-sm font-semibold mb-2">Library</h4>
      
      {/* Datasets */}
      <div className="mb-4">
        <h5 className="text-xs font-medium mb-1">Datasets</h5>
        {section?.datasets?.map(dataset => (
          <div key={dataset.id} className="flex items-center justify-between p-2 border rounded mb-1">
            <span className="text-xs">{dataset.name}</span>
            <Button size="sm" onClick={() => handleAttachDataset(dataset)}>Attach</Button>
          </div>
        ))}
      </div>
      
      {/* KPIs */}
      <div className="mb-4">
        <h5 className="text-xs font-medium mb-1">KPIs</h5>
        {section?.kpis?.map(kpi => (
          <div key={kpi.id} className="flex items-center justify-between p-2 border rounded mb-1">
            <span className="text-xs">{kpi.name}</span>
            <Button size="sm" onClick={() => handleAttachKpi(kpi)}>Attach</Button>
          </div>
        ))}
      </div>
      
      {/* Media */}
      <div>
        <h5 className="text-xs font-medium mb-1">Media</h5>
        {section?.media?.map(asset => (
          <div key={asset.id} className="flex items-center justify-between p-2 border rounded mb-1">
            <span className="text-xs">{asset.name}</span>
            <Button size="sm" onClick={() => handleAttachMedia(asset)}>Attach</Button>
          </div>
        ))}
      </div>
    </div>
  </div>
)}
```

**B. Implement Data Functions:**
```tsx
const handleCreateTable = () => {
  // Open modal/form to create dataset
  // Call onDatasetCreate when done
};

const handleCreateKPI = () => {
  // Open modal/form to create KPI
  // Call onKpiCreate when done
};

const handleCreateMedia = () => {
  // Open file picker or drag-drop
  // Call onMediaCreate when done
};

const handleAttachDataset = (dataset: Dataset) => {
  if (activeQuestionId && onAttachDataset) {
    onAttachDataset(dataset);
  }
};

const handleAttachKpi = (kpi: KPI) => {
  if (activeQuestionId && onAttachKpi) {
    onAttachKpi(kpi);
  }
};

const handleAttachMedia = (asset: MediaAsset) => {
  if (activeQuestionId && onAttachMedia) {
    onAttachMedia(asset);
  }
};
```

**C. Filter Data by Section:**
- Show only data from current `section`
- If no section data, show empty state with "Create" prompts
- Allow creating new data directly from tab

---

### **4. Add Context Tab**

#### **Required Implementation:**

```tsx
{activeTab === 'context' && (
  <div className="flex flex-col h-full overflow-y-auto">
    {/* Requirements Validation */}
    <div className="mb-4">
      <h4 className="text-sm font-semibold mb-2">Requirements</h4>
      {validation && (
        <div className="space-y-1">
          {validation.required && (
            <div className="text-xs text-red-600">⚠️ Required field</div>
          )}
          {validation.minWords && (
            <div className="text-xs text-yellow-600">
              Min words: {validation.minWords} (current: {wordCount})
            </div>
          )}
          {validation.maxWords && (
            <div className="text-xs text-yellow-600">
              Max words: {validation.maxWords} (current: {wordCount})
            </div>
          )}
        </div>
      )}
    </div>
    
    {/* Related Sections */}
    <div className="mb-4">
      <h4 className="text-sm font-semibold mb-2">Related Sections</h4>
      <div className="space-y-1 text-xs">
        {/* Find related sections based on template structure */}
        {relatedSections.map(rel => (
          <div key={rel.id} className="text-blue-600 cursor-pointer hover:underline">
            {rel.title}
          </div>
        ))}
      </div>
    </div>
    
    {/* Program Requirements */}
    {programRequirements && (
      <div className="mb-4">
        <h4 className="text-sm font-semibold mb-2">Program Requirements</h4>
        <div className="text-xs text-gray-600">
          {programRequirements.description}
        </div>
      </div>
    )}
    
    {/* Section Metadata */}
    <div>
      <h4 className="text-sm font-semibold mb-2">Metadata</h4>
      <div className="text-xs space-y-1">
        <div>Word count: {wordCount}</div>
        <div>Completion: {completionPercentage}%</div>
        <div>Questions answered: {answeredCount}/{totalQuestions}</div>
      </div>
    </div>
  </div>
)}
```

---

### **5. Improve Positioning: Keep Editor Between Selected Sections**

#### **Current Positioning Logic:**
- Editor positions relative to `activeQuestionId` or `sectionId`
- Uses `calculatePosition()` function (lines ~106-215)
- Positions to the right or below target element

#### **Required Enhancement:**

**A. Position Between Sections:**
```tsx
// In calculatePosition(), add logic to position between sections
const findSectionBounds = () => {
  const currentSection = document.querySelector(`[data-section-id="${sectionId}"]`);
  const nextSection = currentSection?.nextElementSibling as HTMLElement;
  
  if (currentSection && nextSection) {
    const currentRect = currentSection.getBoundingClientRect();
    const nextRect = nextSection.getBoundingClientRect();
    const scrollRect = scrollContainer.getBoundingClientRect();
    
    // Position editor in the gap between sections
    const gapTop = currentRect.bottom - scrollRect.top + scrollTop;
    const gapBottom = nextRect.top - scrollRect.top + scrollTop;
    const gapHeight = gapBottom - gapTop;
    
    if (gapHeight > EDITOR_MAX_HEIGHT) {
      // Center vertically in gap
      const centerTop = gapTop + (gapHeight - EDITOR_MAX_HEIGHT) / 2;
      return {
        top: centerTop,
        left: scrollLeft + (scrollRect.width - EDITOR_WIDTH) / 2,
        placement: 'between' as const
      };
    }
  }
  return null;
};
```

**B. Update Position Calculation:**
- First try to position between current and next section
- If gap too small, fall back to current logic (right or below)
- Ensure editor stays visible within viewport

**C. Scroll to Keep Editor Visible:**
```tsx
// After calculating position, ensure editor is in viewport
useEffect(() => {
  if (position.visible && editorRef.current) {
    const editorRect = editorRef.current.getBoundingClientRect();
    const scrollContainer = document.getElementById('preview-scroll-container');
    
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      
      // If editor is below viewport, scroll down
      if (editorRect.bottom > containerRect.bottom) {
        scrollContainer.scrollBy({
          top: editorRect.bottom - containerRect.bottom + 20,
          behavior: 'smooth'
        });
      }
      
      // If editor is above viewport, scroll up
      if (editorRect.top < containerRect.top) {
        scrollContainer.scrollBy({
          top: editorRect.top - containerRect.top - 20,
          behavior: 'smooth'
        });
      }
    }
  }
}, [position, sectionId, activeQuestionId]);
```

---

## **File Modifications**

### **Primary File:**
- `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx`

### **Changes Required:**

1. **Add Tab State** (line ~80)
   - Add `activeTab` state

2. **Replace AI/Data Buttons** (lines ~676-683)
   - Remove button callbacks
   - Add tab navigation UI

3. **Add Tab Content Sections** (after question navigation, before answer textarea)
   - AI Tab: Conversational interface
   - Data Tab: Compact data panel
   - Context Tab: Requirements and metadata

4. **Enhance Positioning** (lines ~106-215)
   - Add "between sections" positioning logic
   - Improve scroll-to-visible behavior

5. **Add AI Service Integration**
   - Create or import AI service functions
   - Implement chat interface
   - Add context-aware prompts

6. **Update Props Interface** (lines ~15-40)
   - Remove `onAIHelp` and `onDataHelp` (or keep as optional)
   - Ensure data callbacks are properly typed

---

## **Implementation Steps**

### **Step 1: Add Tab System**
1. Add `activeTab` state
2. Create tab navigation UI
3. Add conditional rendering for each tab
4. Test tab switching

### **Step 2: Implement AI Tab**
1. Add AI chat state
2. Create chat UI components
3. Implement quick actions (Draft, Improve, Suggest Data)
4. Integrate with AI service
5. Test conversation flow

### **Step 3: Implement Data Tab**
1. Create data library UI
2. Implement quick add buttons
3. Add attach functionality
4. Filter data by section
5. Test data creation and attachment

### **Step 4: Implement Context Tab**
1. Add requirements validation display
2. Find and display related sections
3. Show program requirements if available
4. Display section metadata
5. Test all context information

### **Step 5: Enhance Positioning**
1. Add "between sections" positioning logic
2. Improve scroll-to-visible behavior
3. Test positioning in various scenarios
4. Ensure editor stays visible

### **Step 6: Clean Up**
1. Remove unused `onAIHelp`/`onDataHelp` props (or make optional)
2. Update Editor.tsx to remove RightPanel references
3. Test all functionality
4. Fix any lint errors

---

## **Key Considerations**

### **Performance:**
- Lazy load AI responses (don't block UI)
- Virtualize long data lists if needed
- Debounce scroll/position updates

### **UX:**
- Keep editor width at 320px (or make expandable)
- Ensure tabs don't overwhelm the editor
- Preserve question navigation and answer textarea prominence
- Make tabs accessible (keyboard navigation, ARIA labels)

### **State Management:**
- AI conversation history per question (reset when question changes)
- Data library should reflect current section
- Context should update when section/question changes

### **Error Handling:**
- Handle AI service errors gracefully
- Show loading states
- Provide fallback UI if data unavailable

---

## **Testing Checklist**

- [ ] Tabs appear and switch correctly
- [ ] AI tab shows conversational interface
- [ ] AI quick actions work (Draft, Improve, Suggest Data)
- [ ] AI chat sends/receives messages
- [ ] Data tab shows section data library
- [ ] Data quick add buttons work (Table, KPI, Media)
- [ ] Data attach functionality works
- [ ] Context tab shows requirements validation
- [ ] Context tab shows related sections
- [ ] Context tab shows program requirements
- [ ] Context tab shows section metadata
- [ ] Editor positions between sections when possible
- [ ] Editor scrolls to stay visible
- [ ] Editor maintains position on scroll
- [ ] All functionality works with different section/question combinations
- [ ] No console errors
- [ ] No lint errors

---

## **Reference**

- Architecture document: `c:\Users\kevin\Downloads\Reviewing the architecture document.txt`
- Current InlineSectionEditor: `features/editor/components/layout/Workspace/Content/InlineSectionEditor.tsx`
- Editor.tsx: `features/editor/components/Editor.tsx` (for prop passing)

---

**Good luck with the implementation! 🚀**

