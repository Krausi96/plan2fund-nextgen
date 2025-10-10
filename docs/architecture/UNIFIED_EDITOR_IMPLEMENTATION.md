# 🏗️ UNIFIED EDITOR IMPLEMENTATION GUIDE

**Last Updated**: 2024-12-19  
**Status**: Ready for implementation  
**Estimated Time**: 8-12 hours

---

## 🎯 **ARCHITECTURE OVERVIEW**

### **Single Page Architecture:**
The new editor will be **ONE MAIN COMPONENT** (`UnifiedEditor.tsx`) that orchestrates all features, but each feature is a **separate modular component** that can be enabled/disabled.

```
UnifiedEditor.tsx (Main Component - 1 file)
├── ProductSelector.tsx (Module)
├── TemplateSelector.tsx (Module)
├── SectionManager.tsx (Module)
├── AIAssistant.tsx (Module)
├── ReadinessChecker.tsx (Module)
├── ExportManager.tsx (Module)
└── CollaborationManager.tsx (Module)
```

### **Key Design Principles:**
1. **Single Entry Point** - One editor handles all flows
2. **Modular Features** - Each feature is a separate component
3. **Centralized State** - All state managed in one place
4. **Progressive Enhancement** - Features work together seamlessly
5. **Fallback Handling** - Graceful degradation when data missing

---

## 📁 **DETAILED FILE STRUCTURE**

### **1. Main Editor Component (1 file):**

#### **`src/components/editor/UnifiedEditor.tsx`** (300-400 lines)
```typescript
// Main orchestrator component
export default function UnifiedEditor() {
  const {
    // State
    product,
    template,
    sections,
    content,
    progress,
    isLoading,
    error,
    
    // Actions
    setProduct,
    setTemplate,
    updateSection,
    saveContent,
    exportDocument,
    loadProgramData
  } = useEditorState();

  return (
    <div className="unified-editor h-screen flex flex-col">
      {/* Top Bar */}
      <EditorHeader 
        product={product}
        template={template}
        onSave={saveContent}
        onExport={exportDocument}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <ProductSelector 
            selected={product}
            onSelect={setProduct}
          />
          <TemplateSelector 
            selected={template}
            onSelect={setTemplate}
          />
          <SectionManager 
            sections={sections}
            onUpdate={updateSection}
          />
          <ProgressTracker 
            progress={progress}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <SectionEditor 
            sections={sections}
            content={content}
            onUpdate={updateSection}
          />
        </div>
        
        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          <AIAssistant 
            sections={sections}
            content={content}
            onInsert={updateSection}
          />
          <ReadinessChecker 
            sections={sections}
            content={content}
          />
          <ExportManager 
            content={content}
            onExport={exportDocument}
          />
          <CollaborationManager 
            content={content}
          />
        </div>
      </div>
    </div>
  );
}
```

### **2. State Management (2 files):**

#### **`src/components/editor/EditorState.tsx`** (200-300 lines)
```typescript
// Centralized state management using React Context
interface EditorState {
  // Core state
  product: Product | null;
  template: Template | null;
  sections: EditorSection[];
  content: Record<string, string>;
  progress: ProgressState;
  
  // UI state
  activeSection: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Feature state
  aiAssistant: AIAssistantState;
  readiness: ReadinessState;
  collaboration: CollaborationState;
}

export const EditorContext = createContext<EditorState | null>(null);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<EditorState>({
    product: null,
    template: null,
    sections: [],
    content: {},
    progress: {},
    activeSection: null,
    isLoading: false,
    error: null,
    aiAssistant: {},
    readiness: {},
    collaboration: {}
  });

  // Actions
  const setProduct = (product: Product) => {
    setState(prev => ({ ...prev, product }));
  };

  const setTemplate = (template: Template) => {
    setState(prev => ({ ...prev, template }));
  };

  const updateSection = (sectionId: string, content: string) => {
    setState(prev => ({
      ...prev,
      content: { ...prev.content, [sectionId]: content }
    }));
  };

  const saveContent = async () => {
    // Save logic
  };

  const exportDocument = async (format: string) => {
    // Export logic
  };

  return (
    <EditorContext.Provider value={{ state, setState, actions: {
      setProduct,
      setTemplate,
      updateSection,
      saveContent,
      exportDocument
    }}}>
      {children}
    </EditorContext.Provider>
  );
}

export const useEditorState = () => {
  const context = useContext(EditorContext);
  if (!context) throw new Error('useEditorState must be used within EditorProvider');
  return context;
};
```

#### **`src/lib/editor/EditorEngine.ts`** (400-500 lines)
```typescript
// Core business logic
export class EditorEngine {
  private state: EditorState;
  private dataProvider: EditorDataProvider;

  constructor(state: EditorState, dataProvider: EditorDataProvider) {
    this.state = state;
    this.dataProvider = dataProvider;
  }

  // Product management
  async loadProduct(productId: string): Promise<Product> {
    const product = await this.dataProvider.getProduct(productId);
    return product;
  }

  // Template management
  async loadTemplate(templateId: string): Promise<Template> {
    const template = await this.dataProvider.getTemplate(templateId);
    return template;
  }

  // Section management
  async loadSections(productId: string, templateId: string): Promise<EditorSection[]> {
    const product = await this.loadProduct(productId);
    const template = await this.loadTemplate(templateId);
    
    // Merge product-specific sections with template sections
    const sections = this.mergeSections(product.sections, template.sections);
    return sections;
  }

  // Content management
  async saveContent(content: Record<string, string>): Promise<void> {
    await this.dataProvider.saveContent(content);
  }

  // Export management
  async exportDocument(content: Record<string, string>, format: string): Promise<string> {
    const exporter = new ExportEngine();
    return await exporter.export(content, format);
  }

  // Progress calculation
  calculateProgress(sections: EditorSection[], content: Record<string, string>): ProgressState {
    const totalSections = sections.length;
    const completedSections = sections.filter(section => 
      content[section.id] && content[section.id].trim().length > 0
    ).length;
    
    const progress = (completedSections / totalSections) * 100;
    
    return {
      overall: progress,
      sections: sections.map(section => ({
        id: section.id,
        completed: !!(content[section.id] && content[section.id].trim().length > 0),
        progress: this.calculateSectionProgress(section, content[section.id])
      }))
    };
  }

  private mergeSections(productSections: EditorSection[], templateSections: EditorSection[]): EditorSection[] {
    // Merge logic
    return [...productSections, ...templateSections];
  }

  private calculateSectionProgress(section: EditorSection, content: string): number {
    // Calculate section-specific progress
    return 0;
  }
}
```

### **3. Data Layer (3 files):**

#### **`src/lib/data/EditorDataProvider.ts`** (300-400 lines)
```typescript
// Data provider for editor
export class EditorDataProvider {
  private apiClient: APIClient;

  constructor(apiClient: APIClient) {
    this.apiClient = apiClient;
  }

  // Product data
  async getProduct(productId: string): Promise<Product> {
    const response = await this.apiClient.get(`/api/programmes/${productId}/requirements`);
    return response.data;
  }

  // Template data
  async getTemplate(templateId: string): Promise<Template> {
    const response = await this.apiClient.get(`/api/templates/${templateId}`);
    return response.data;
  }

  // Section data
  async getSections(productId: string): Promise<EditorSection[]> {
    const response = await this.apiClient.get(`/api/programmes/${productId}/requirements`);
    return response.data.editor || [];
  }

  // Content management
  async saveContent(content: Record<string, string>): Promise<void> {
    await this.apiClient.post('/api/editor/content', { content });
  }

  // Load content
  async loadContent(documentId: string): Promise<Record<string, string>> {
    const response = await this.apiClient.get(`/api/editor/content/${documentId}`);
    return response.data;
  }
}
```

#### **`src/lib/data/EditorDataTransformer.ts`** (200-300 lines)
```typescript
// Data transformation utilities
export class EditorDataTransformer {
  // Transform web scraper data to editor format
  static transformScrapedData(scrapedData: any): EditorSection[] {
    return scrapedData.map((item: any) => ({
      id: item.id,
      title: item.section_name,
      description: item.prompt,
      required: item.required,
      template: item.template || '',
      guidance: item.ai_guidance || '',
      hints: item.hints || [],
      wordCount: {
        min: item.word_count_min,
        max: item.word_count_max
      }
    }));
  }

  // Transform template data to editor format
  static transformTemplateData(templateData: any): EditorSection[] {
    return templateData.sections.map((section: any) => ({
      id: section.key,
      title: section.title,
      description: section.guidance || '',
      required: section.required || false,
      template: section.content_template || '',
      guidance: section.guidance || '',
      hints: section.hints || [],
      wordCount: {
        min: section.minTokens,
        max: section.maxTokens
      }
    }));
  }

  // Merge product and template data
  static mergeProductAndTemplate(productSections: EditorSection[], templateSections: EditorSection[]): EditorSection[] {
    const merged = [...productSections];
    
    templateSections.forEach(templateSection => {
      const existingIndex = merged.findIndex(section => section.id === templateSection.id);
      if (existingIndex >= 0) {
        // Merge with existing section
        merged[existingIndex] = {
          ...merged[existingIndex],
          ...templateSection,
          required: merged[existingIndex].required || templateSection.required
        };
      } else {
        // Add new section
        merged.push(templateSection);
      }
    });
    
    return merged;
  }
}
```

#### **`src/types/editor.ts`** (100-200 lines)
```typescript
// Editor type definitions
export interface Product {
  id: string;
  name: string;
  type: 'grant' | 'loan' | 'equity' | 'visa';
  sections: EditorSection[];
  requirements: any;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  sections: EditorSection[];
  route: string;
}

export interface EditorSection {
  id: string;
  title: string;
  description: string;
  required: boolean;
  template: string;
  guidance: string;
  hints: string[];
  wordCount: {
    min?: number;
    max?: number;
  };
  order: number;
}

export interface ProgressState {
  overall: number;
  sections: SectionProgress[];
}

export interface SectionProgress {
  id: string;
  completed: boolean;
  progress: number;
}

export interface AIAssistantState {
  isOpen: boolean;
  messages: ChatMessage[];
  currentSection: string | null;
}

export interface ReadinessState {
  score: number;
  dimensions: ReadinessDimension[];
}

export interface CollaborationState {
  isEnabled: boolean;
  teamMembers: TeamMember[];
  currentUser: User;
}
```

### **4. Feature Modules (8 files):**

#### **`src/components/editor/modules/ProductSelector.tsx`** (100-150 lines)
```typescript
// Product/plan type selector
export default function ProductSelector({ 
  selected, 
  onSelect 
}: { 
  selected: Product | null; 
  onSelect: (product: Product) => void; 
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/programs?enhanced=true');
      const data = await response.json();
      setProducts(data.programs || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Select Program</h3>
      {loading ? (
        <div className="text-center py-4">Loading...</div>
      ) : (
        <div className="space-y-2">
          {products.map(product => (
            <div
              key={product.id}
              className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                selected?.id === product.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => onSelect(product)}
            >
              <div className="font-medium">{product.name}</div>
              <div className="text-sm text-gray-600">{product.type}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### **`src/components/editor/modules/TemplateSelector.tsx`** (100-150 lines)
```typescript
// Template selection
export default function TemplateSelector({ 
  selected, 
  onSelect 
}: { 
  selected: Template | null; 
  onSelect: (template: Template) => void; 
}) {
  const [templates, setTemplates] = useState<Template[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  return (
    <div className="p-4 border-b border-gray-200">
      <h3 className="text-lg font-semibold mb-3">Select Template</h3>
      <div className="space-y-2">
        {templates.map(template => (
          <div
            key={template.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              selected?.id === template.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelect(template)}
          >
            <div className="font-medium">{template.name}</div>
            <div className="text-sm text-gray-600">{template.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### **`src/components/editor/modules/SectionManager.tsx`** (200-300 lines)
```typescript
// Section management
export default function SectionManager({ 
  sections, 
  onUpdate 
}: { 
  sections: EditorSection[]; 
  onUpdate: (sectionId: string, updates: Partial<EditorSection>) => void; 
}) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-3">Sections</h3>
      <div className="space-y-2">
        {sections.map(section => (
          <div
            key={section.id}
            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
              activeSection === section.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => setActiveSection(section.id)}
          >
            <div className="font-medium">{section.title}</div>
            <div className="text-sm text-gray-600">{section.description}</div>
            {section.required && (
              <div className="text-xs text-red-600 mt-1">Required</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### **`src/components/editor/modules/ProgressTracker.tsx`** (100-150 lines)
```typescript
// Progress tracking
export default function ProgressTracker({ 
  progress 
}: { 
  progress: ProgressState; 
}) {
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-3">Progress</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Overall Progress</span>
            <span>{Math.round(progress.overall)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress.overall}%` }}
            />
          </div>
        </div>
        
        <div className="space-y-2">
          {progress.sections.map(section => (
            <div key={section.id} className="flex items-center justify-between text-sm">
              <span className="truncate">{section.id}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-200 rounded-full h-1">
                  <div 
                    className="bg-green-500 h-1 rounded-full"
                    style={{ width: `${section.progress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {section.completed ? '✓' : '○'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

#### **`src/components/editor/modules/AIAssistant.tsx`** (300-400 lines)
```typescript
// AI Assistant (enhanced version of EnhancedAIChat)
export default function AIAssistant({ 
  sections, 
  content, 
  onInsert 
}: { 
  sections: EditorSection[]; 
  content: Record<string, string>; 
  onInsert: (sectionId: string, content: string) => void; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');

    // Get AI response
    try {
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          sections,
          content
        })
      });

      const data = await response.json();
      
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">AI Assistant</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-blue-600 hover:text-blue-800"
        >
          {isOpen ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {isOpen && (
        <div className="space-y-4">
          <div className="h-64 overflow-y-auto border rounded-lg p-3 bg-gray-50">
            {messages.map(message => (
              <div
                key={message.id}
                className={`mb-2 p-2 rounded ${
                  message.type === 'user' 
                    ? 'bg-blue-100 ml-4' 
                    : 'bg-white mr-4'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask AI for help..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

#### **`src/components/editor/modules/ReadinessChecker.tsx`** (200-300 lines)
```typescript
// Readiness Checker (enhanced version of RequirementsChecker)
export default function ReadinessChecker({ 
  sections, 
  content 
}: { 
  sections: EditorSection[]; 
  content: Record<string, string>; 
}) {
  const [readiness, setReadiness] = useState<ReadinessState | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    calculateReadiness();
  }, [sections, content]);

  const calculateReadiness = async () => {
    try {
      const response = await fetch('/api/editor/readiness', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sections, content })
      });

      const data = await response.json();
      setReadiness(data.readiness);
    } catch (error) {
      console.error('Error calculating readiness:', error);
    }
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Readiness Check</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-blue-600 hover:text-blue-800"
        >
          {isOpen ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {isOpen && readiness && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {readiness.score}/100
            </div>
            <div className="text-sm text-gray-600">Readiness Score</div>
          </div>
          
          <div className="space-y-2">
            {readiness.dimensions.map(dimension => (
              <div key={dimension.id} className="flex items-center justify-between text-sm">
                <span>{dimension.title}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full ${
                        dimension.score >= 80 ? 'bg-green-500' :
                        dimension.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${dimension.score}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {dimension.score}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

#### **`src/components/editor/modules/ExportManager.tsx`** (150-200 lines)
```typescript
// Export Manager (enhanced version of ExportSettings)
export default function ExportManager({ 
  content, 
  onExport 
}: { 
  content: Record<string, string>; 
  onExport: (format: string) => void; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState('pdf');

  const handleExport = () => {
    onExport(exportFormat);
    setIsOpen(false);
  };

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Export</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-blue-600 hover:text-blue-800"
        >
          {isOpen ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {isOpen && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Export Format</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="pdf">PDF</option>
              <option value="docx">Word Document</option>
              <option value="html">HTML</option>
              <option value="txt">Plain Text</option>
            </select>
          </div>
          
          <button
            onClick={handleExport}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Export Document
          </button>
        </div>
      )}
    </div>
  );
}
```

#### **`src/components/editor/modules/CollaborationManager.tsx`** (200-300 lines)
```typescript
// Collaboration Manager (enhanced version of existing)
export default function CollaborationManager({ 
  content 
}: { 
  content: Record<string, string>; 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Collaboration</h3>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-blue-600 hover:text-blue-800"
        >
          {isOpen ? 'Hide' : 'Show'}
        </button>
      </div>
      
      {isOpen && (
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Team Members</h4>
            <div className="space-y-2">
              {teamMembers.map(member => (
                <div key={member.id} className="flex items-center space-x-2 text-sm">
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    {member.name.charAt(0)}
                  </div>
                  <span>{member.name}</span>
                  <span className="text-gray-500">({member.role})</span>
                </div>
              ))}
            </div>
          </div>
          
          <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            Invite Team Member
          </button>
        </div>
      )}
    </div>
  );
}
```

### **5. Shared Components (3 files):**

#### **`src/components/editor/components/SectionEditor.tsx`** (200-300 lines)
```typescript
// Individual section editor
export default function SectionEditor({ 
  sections, 
  content, 
  onUpdate 
}: { 
  sections: EditorSection[]; 
  content: Record<string, string>; 
  onUpdate: (sectionId: string, content: string) => void; 
}) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const activeSectionData = sections.find(s => s.id === activeSection);

  return (
    <div className="flex-1 flex flex-col">
      {activeSectionData ? (
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">{activeSectionData.title}</h2>
            <p className="text-gray-600 mb-6">{activeSectionData.description}</p>
            
            <RichTextEditor
              value={content[activeSectionData.id] || ''}
              onChange={(value) => onUpdate(activeSectionData.id, value)}
              placeholder={activeSectionData.template}
              guidance={activeSectionData.guidance}
              hints={activeSectionData.hints}
              wordCount={activeSectionData.wordCount}
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Select a section to start editing
        </div>
      )}
    </div>
  );
}
```

#### **`src/components/editor/components/RichTextEditor.tsx`** (300-400 lines)
```typescript
// Rich text editor component
export default function RichTextEditor({ 
  value, 
  onChange, 
  placeholder, 
  guidance, 
  hints, 
  wordCount 
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  guidance?: string;
  hints?: string[];
  wordCount?: { min?: number; max?: number };
}) {
  const [showGuidance, setShowGuidance] = useState(false);

  const currentWordCount = value.trim().split(/\s+/).filter(word => word.length > 0).length;

  const getWordCountColor = () => {
    if (!wordCount) return 'text-gray-500';
    if (wordCount.min && currentWordCount < wordCount.min) return 'text-red-500';
    if (wordCount.max && currentWordCount > wordCount.max) return 'text-red-500';
    return 'text-green-500';
  };

  return (
    <div className="space-y-4">
      {/* Guidance */}
      {guidance && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-blue-900">AI Guidance</h4>
            <button
              onClick={() => setShowGuidance(!showGuidance)}
              className="text-blue-600 hover:text-blue-800"
            >
              {showGuidance ? 'Hide' : 'Show'}
            </button>
          </div>
          {showGuidance && (
            <p className="text-blue-800 text-sm">{guidance}</p>
          )}
        </div>
      )}

      {/* Hints */}
      {hints && hints.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Hints</h4>
          <ul className="text-yellow-800 text-sm space-y-1">
            {hints.map((hint, index) => (
              <li key={index}>• {hint}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Text Editor */}
      <div className="border rounded-lg">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-96 p-4 border-0 rounded-lg resize-none focus:outline-none"
        />
      </div>

      {/* Word Count */}
      {wordCount && (
        <div className="flex justify-between items-center text-sm">
          <span className={getWordCountColor()}>
            {currentWordCount} words
          </span>
          {wordCount.min && (
            <span className="text-gray-500">
              Min: {wordCount.min}
            </span>
          )}
          {wordCount.max && (
            <span className="text-gray-500">
              Max: {wordCount.max}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

#### **`src/components/editor/components/FinancialTables.tsx`** (200-300 lines)
```typescript
// Financial tables component
export default function FinancialTables({ 
  content 
}: { 
  content: Record<string, string>; 
}) {
  const [tables, setTables] = useState<any[]>([]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Financial Tables</h3>
      <div className="space-y-4">
        {tables.map((table, index) => (
          <div key={index} className="border rounded-lg p-4">
            <h4 className="font-medium mb-2">{table.title}</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    {table.headers.map((header: string, i: number) => (
                      <th key={i} className="text-left py-2 px-3">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row: any[], i: number) => (
                    <tr key={i} className="border-b">
                      {row.map((cell: any, j: number) => (
                        <td key={j} className="py-2 px-3">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🔄 **DATA FLOW IMPLEMENTATION**

### **1. Web Scraper → Editor:**
```
WebScraperService → categorized_requirements → Database
    ↓
EditorDataProvider.getProduct() → EditorDataTransformer.transformScrapedData()
    ↓
EditorEngine.loadSections() → UnifiedEditor → SectionManager
```

### **2. Recommendation → Editor:**
```
/reco → /editor?programId=X&route=Y&product=Z
    ↓
UnifiedEditor → ProductSelector → EditorEngine.loadProduct()
    ↓
TemplateSelector → EditorEngine.loadTemplate()
    ↓
SectionManager → SectionEditor
```

### **3. Template → Editor:**
```
TemplateSelector → EditorDataProvider.getTemplate()
    ↓
EditorDataTransformer.transformTemplateData()
    ↓
EditorEngine.mergeSections() → SectionManager
```

### **4. AI Assistant → Editor:**
```
AIAssistant → /api/ai/assistant → AI response
    ↓
SectionEditor → RichTextEditor → onUpdate()
    ↓
EditorEngine.saveContent() → Database
```

---

## 🎯 **IMPLEMENTATION STEPS**

### **Phase 1: Core Architecture (2-3 hours)**
1. Create `UnifiedEditor.tsx` - Main component
2. Create `EditorState.tsx` - State management
3. Create `EditorEngine.ts` - Business logic
4. Create `EditorDataProvider.ts` - Data layer

### **Phase 2: Feature Modules (3-4 hours)**
1. Create `ProductSelector.tsx`
2. Create `TemplateSelector.tsx`
3. Create `SectionManager.tsx`
4. Create `ProgressTracker.tsx`

### **Phase 3: AI & Features (2-3 hours)**
1. Create `AIAssistant.tsx`
2. Create `ReadinessChecker.tsx`
3. Create `ExportManager.tsx`
4. Create `CollaborationManager.tsx`

### **Phase 4: Integration (1-2 hours)**
1. Connect web scraper data flow
2. Connect recommendation data flow
3. Add fallback handling
4. Testing and refinement

**Total: 8-12 hours for complete implementation**

---

## 🎯 **KEY BENEFITS**

### **1. Single Source of Truth:**
- One main component (`UnifiedEditor.tsx`)
- Centralized state management
- Consistent data flow

### **2. Modular Design:**
- Each feature is a separate component
- Features can be enabled/disabled
- Easy to add new features

### **3. Better User Experience:**
- All features work together
- Consistent interface
- Progress tracking
- AI guidance

### **4. Maintainable Code:**
- Clear separation of concerns
- Reusable components
- Easy to test and debug

### **5. Scalable:**
- Easy to add new features
- Easy to modify existing features
- Easy to integrate with other systems

---

## 📊 **SUMMARY**

The new unified editor architecture consolidates 27 fragmented files into a **clean, modular system** with:

- ✅ **One main component** (`UnifiedEditor.tsx`) orchestrates everything
- ✅ **8 feature modules** that can be enabled/disabled
- ✅ **Centralized state management** for consistency
- ✅ **Unified data flow** from web scraper to editor
- ✅ **Better user experience** with all features integrated
- ✅ **Maintainable code** with clear separation of concerns

**The new architecture will be much cleaner, more maintainable, and provide a better user experience!** 🚀
