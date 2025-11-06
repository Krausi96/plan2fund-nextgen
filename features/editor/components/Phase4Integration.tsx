// ========= PLAN2FUND — PHASE 4 INTEGRATION =========
// Comprehensive integration of all Phase 4 features: Business Plan Editor Structure, UI Navigation, Entry Points, Templates & Formatting, and Collaboration
// NOW WITH INTEGRATED STATE MANAGEMENT (replaces EditorState)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import ExportRenderer from '@/features/export/renderer/renderer';
import { PlanDocument } from '@/shared/types/plan';
import { ProgramProfile } from '@/features/reco/types/reco';
import { useUser } from '@/shared/contexts/UserContext';
import { EditorProduct } from '@/features/editor/types/editor';
import { savePlanSections } from '@/shared/lib/planStore';
import { getSections } from '@/shared/lib/templates';
import analytics from '@/shared/lib/analytics';

// Phase 4 Components
import EntryPointsManager from './EntryPointsManager';
import DocumentCustomizationPanel from './DocumentCustomizationPanel';
import RichTextEditor from './RichTextEditor';
import RestructuredEditorNew from './RestructuredEditorNew';


// FormattingConfig interface removed - functionality moved to DocumentCustomizationPanel

interface Phase4IntegrationProps {
  initialPlan?: PlanDocument;
  programProfile?: ProgramProfile;
  onPlanChange?: (plan: PlanDocument) => void;
  onProgramProfileChange?: (profile: ProgramProfile) => void;
  onProductChange?: (product: EditorProduct) => void;
}

export default function Phase4Integration({
  initialPlan,
  programProfile,
  onPlanChange,
  onProgramProfileChange,
  onProductChange
}: Phase4IntegrationProps) {
  const router = useRouter();
  const { userProfile, isLoading: isUserLoading } = useUser();
  
  // Core state
  const [plan, setPlan] = useState<PlanDocument | null>(initialPlan || null);
  const [sections, setSections] = useState<any[]>([]);
  const [activeSection, setActiveSection] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Multi-user client state
  const [clients, setClients] = useState<Array<{ id: string; name: string }>>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  
  // Load clients on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const { multiUserDataManager } = require('@/shared/lib/multiUserDataManager');
      const loadedClients = multiUserDataManager.listClients();
      setClients(loadedClients);
      if (loadedClients.length > 0 && !activeClientId) {
        setActiveClientId(loadedClients[0].id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Phase 4 UI state - Simplified UI
  const [showEntryPoints, setShowEntryPoints] = useState(false);
  const [showDocumentCustomization, setShowDocumentCustomization] = useState(true); // Visible by default so user can see it
  const [focusMode, setFocusMode] = useState(false); // Focus mode for distraction-free writing
  const [showSectionSearch, setShowSectionSearch] = useState(false); // Quick section search
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false); // Keyboard shortcuts help
  const [showSectionExample, setShowSectionExample] = useState(false); // Section example/template
  const [requirementsProgress, setRequirementsProgress] = useState(0);
  const [requirementsStatus, setRequirementsStatus] = useState<'loading' | 'complete' | 'incomplete' | 'error'>('loading');
  const saveDebounceRef = useRef<any>(null);
  const [showInlinePreview, setShowInlinePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewStyle, setPreviewStyle] = useState<{ fontFamily?: string; fontSize?: number; lineHeight?: number }>({});
  
  // ============================================================================
  // INTEGRATED STATE MANAGEMENT (from EditorState)
  // ============================================================================

  // Update requirements progress when content changes
  const updateRequirementsProgress = async () => {
    if (!plan || !programProfile) return;
    
    try {
      setRequirementsStatus('loading');
      
      // Get current plan content for all sections
      const planContent = sections.reduce((acc, section) => {
        acc[section.key] = section.content || '';
        return acc;
      }, {} as Record<string, string>);
      
      // Fetch requirements from API and validate (FIXED: now uses scraper-lite data)
      try {
        const response = await fetch(`/api/programmes/${programProfile.programId}/requirements`);
        if (response.ok) {
          const data = await response.json();
          const { transformCategorizedToProgramRequirements, ReadinessValidator } = await import('@/shared/lib/readiness');
          
          const transformed = transformCategorizedToProgramRequirements(
            data.categorized_requirements || {},
            { id: programProfile.programId, ...data }
          );
          
          if (transformed) {
            const validator = new ReadinessValidator(transformed, planContent);
            const checks = await validator.performReadinessCheck();
            const completedChecks = checks.filter(check => check.status === 'complete').length;
            const totalChecks = checks.length;
            const progress = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;
            
            setRequirementsProgress(progress);
            setRequirementsStatus(progress === 100 ? 'complete' : progress > 0 ? 'incomplete' : 'error');
            return; // Success - exit early
          }
        }
      } catch (apiError) {
        console.warn('Could not fetch requirements from API, using fallback:', apiError);
      }
      
      // Fallback to old method if API fails
      const { createReadinessValidator } = await import('@/shared/lib/readiness');
      const validator = await createReadinessValidator(programProfile.route || 'grant', planContent);
      
      if (validator) {
        const checks = await validator.performReadinessCheck();
        const completedChecks = checks.filter(check => check.status === 'complete').length;
        const totalChecks = checks.length;
        const progress = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;
        
        setRequirementsProgress(progress);
        setRequirementsStatus(progress === 100 ? 'complete' : progress > 0 ? 'incomplete' : 'error');
      } else {
        setRequirementsStatus('error');
      }
    } catch (error) {
      console.error('Error updating requirements progress:', error);
      setRequirementsStatus('error');
    }
  };

  // Update progress when sections change
  useEffect(() => {
    if (sections.length > 0) {
      updateRequirementsProgress();
    }
  }, [sections, programProfile]);
  
  // Editor state (integrated from EditorState)
  const [product, setProductState] = useState<EditorProduct | null>(null);
  const [content, setContent] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Helper function to save content (simplified - no EditorEngine wrapper)
  const saveContentDirect = useCallback(async (contentMap: Record<string, string>) => {
    try {
      // Save to localStorage as fallback
      if (typeof window !== 'undefined') {
        const planData = {
          content: contentMap,
          documentId: plan?.id || 'current-plan',
          lastSaved: new Date().toISOString()
        };
        localStorage.setItem('currentPlan', JSON.stringify(planData));
      }
    } catch (error) {
      console.warn('Save to localStorage failed:', error);
    }
  }, [plan]);

  // Initialize plan and sections
  useEffect(() => {
    if (initialPlan) {
      setPlan(initialPlan);
      setSections(initialPlan.sections || []);
      setIsLoading(false);
    } else if (userProfile && !isUserLoading) {
      // Load user's plan or create new one
      loadUserPlan();
    }
  }, [initialPlan, userProfile, isUserLoading]);

  // AI Generate handler - defined after handleSectionChange
  const handleAIGenerate = useCallback(async () => {
    if (!sections[activeSection] || !plan) return;
    
    try {
      const { createAIHelper } = await import('@/features/editor/engine/aiHelper');
      const { loadUserAnswers } = await import('@/shared/lib/planStore');
      const userAnswers = typeof window !== 'undefined' ? loadUserAnswers() : {};
      
      const programForAI = programProfile ? {
        id: programProfile.programId,
        name: programProfile.programId,
        type: programProfile.route || 'grant',
        amount: '',
        eligibility: [],
        requirements: [],
        score: 100,
        reasons: [],
        risks: []
      } : null;
      
      const aiHelper = createAIHelper({
        maxWords: sections[activeSection]?.wordCountMax || 500,
        sectionScope: sections[activeSection]?.title || '',
        programHints: {},
        userAnswers: userAnswers,
        tone: plan?.tone || 'neutral',
        language: plan?.language || 'en'
      });
      
      const context = sections[activeSection]?.prompts?.join('\n') || sections[activeSection]?.description || '';
      const response = await aiHelper.generateSectionContent(
        sections[activeSection].title,
        context,
        programForAI || { id: 'unknown', name: 'Program', type: 'grant', amount: '', eligibility: [], requirements: [], score: 100, reasons: [], risks: [] }
      );
      
      if (response.content && sections[activeSection]) {
        // Directly update section instead of using handleSectionChange to avoid circular dependency
        const sectionKey = sections[activeSection].key;
        setSections(prev => {
          const updated = prev.map(section =>
            section.key === sectionKey ? { ...section, content: response.content } : section
          );
          if (plan) {
            setPlan({ ...plan, sections: updated });
            if (onPlanChange) {
              onPlanChange({ ...plan, sections: updated });
            }
          }
          return updated;
        });
      }
    } catch (error) {
      console.error('Error generating content:', error);
    }
  }, [sections, activeSection, plan, programProfile, onPlanChange]);

  // Enhanced Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Only handle shortcuts when not typing in input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Ctrl+G for AI generate (only when not in editor)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g' && !target.isContentEditable) {
          e.preventDefault();
          handleAIGenerate();
          return;
        }
        // Ctrl+S for save (always works)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
          e.preventDefault();
          const contentMap = sections.reduce((acc: Record<string,string>, s: any) => { acc[s.key] = s.content || ''; return acc; }, {});
          setIsSaving(true);
          saveContentDirect(contentMap).catch(()=>{}).finally(()=>setIsSaving(false));
          return;
        }
        return;
      }

      // Global shortcuts (when not typing)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const contentMap = sections.reduce((acc: Record<string,string>, s: any) => { acc[s.key] = s.content || ''; return acc; }, {});
        setIsSaving(true);
        saveContentDirect(contentMap).catch(()=>{}).finally(()=>setIsSaving(false));
        return;
      }
      
      // Ctrl+G for AI generate
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        handleAIGenerate();
        return;
      }
      
      // Ctrl+F for focus mode
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && !e.shiftKey) {
        e.preventDefault();
        setFocusMode(!focusMode);
        return;
      }
      
      // Ctrl+K for section search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSectionSearch(!showSectionSearch);
        return;
      }
      
      // ? for shortcuts help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
        e.preventDefault();
        setShowShortcutsHelp(!showShortcutsHelp);
        return;
      }
      
      // Navigation
      if (e.key === 'ArrowUp' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setActiveSection((idx) => Math.max(0, idx - 1));
      } else if (e.key === 'ArrowDown' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setActiveSection((idx) => Math.min(sections.length - 1, idx + 1));
      } else if (e.key === 'ArrowUp' && !e.ctrlKey && !e.metaKey) {
        // Regular arrow up (only when not in editor)
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          setActiveSection((idx) => Math.max(0, idx - 1));
        }
      } else if (e.key === 'ArrowDown' && !e.ctrlKey && !e.metaKey) {
        // Regular arrow down (only when not in editor)
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          setActiveSection((idx) => Math.min(sections.length - 1, idx + 1));
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sections, focusMode, showSectionSearch, activeSection, handleAIGenerate]);

  // Load program sections when programProfile changes
  useEffect(() => {
    if (programProfile && programProfile.programId) {
      loadProgramSections(programProfile.programId);
    }
  }, [programProfile]);


  const loadUserPlan = async () => {
    setIsLoading(true);
    try {
      // In a real implementation, this would load from the database
      const defaultPlan: PlanDocument = {
        id: `plan_${Date.now()}`,
        ownerId: userProfile?.id || 'anonymous',
        product: 'submission',
        route: 'grant',
        language: 'en',
        tone: 'neutral',
        targetLength: 'standard',
        settings: {
          includeTitlePage: true,
          includePageNumbers: true,
          citations: 'simple' as const,
          captions: true,
          graphs: {}
        },
        sections: [],
        addonPack: false,
        versions: []
      };
      setPlan(defaultPlan);
      setSections(defaultPlan.sections || []);
    } catch (error) {
      console.error('Error loading user plan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProgramSections = async (programId: string) => {
    setIsLoading(true);
    try {
      console.log('Loading program sections for:', programId);
      
      // Try to load program data (non-fatal)
      let programData: any = null;
      try {
        const response = await fetch(`/api/programmes/${programId}/requirements`);
        if (response.ok) {
          const data = await response.json();
          programData = {
            id: programId,
            name: data.program_name || `Program ${programId}`,
            type: data.program_type || 'grant',
            description: data.description,
            funding_amount_min: data.funding_amount_min,
            funding_amount_max: data.funding_amount_max
          };
        }
      } catch (e) {
        console.warn('Program data not available, continuing with template fallback');
      }
      
      // Determine product type from plan, product state, or default to submission
      const productType = product?.type || plan?.product || 'submission';
      console.log('Loading sections with product type:', productType, 'for program:', programId);
      
      // Determine funding type from program data or default to grants
      const fundingType = programData?.type 
        ? (programData.type.includes('loan') ? 'bankLoans' : 
           programData.type.includes('equity') ? 'equity' : 
           programData.type.includes('visa') ? 'visa' : 'grants')
        : 'grants';
      
      // Load sections directly from unified template system
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      let templateSections = await getSections(fundingType, productType, programId, baseUrl);
      
      // Transform template sections to editor format
      let sections = templateSections.map((section: any) => ({
        key: section.id,
        id: section.id,
        title: section.title,
        content: '',
        status: 'missing' as const,
        wordCount: 0,
        required: section.required !== false,
        order: section.order !== undefined ? section.order : 999,
        description: section.description || '',
        prompts: section.prompts || [],
        wordCountMin: section.wordCountMin || 50,
        wordCountMax: section.wordCountMax || 5000,
        tables: undefined,
        figures: [],
        fields: undefined,
        sources: []
      }));
      
      // CRITICAL FIX: Prefill sections with wizard answers from appStore (single source of truth)
      try {
        if (typeof window !== 'undefined') {
          const { loadUserAnswers } = await import('@/shared/lib/planStore');
          const userAnswers = loadUserAnswers();
          
          if (Object.keys(userAnswers).length > 0) {
            
            // Use prefill engine to generate content from answers
            if (Object.keys(userAnswers).length > 0 && programData) {
              try {
                const { mapAnswersToSections, mapWizardAnswersToPrefillFormat } = await import('@/features/intake/engine/prefill');
                
                // Map wizard answers to prefill format (Priority 4)
                const prefillAnswers = mapWizardAnswersToPrefillFormat(userAnswers);
                console.log('🔄 Mapped wizard answers to prefill format:', { wizard: userAnswers, prefill: prefillAnswers });
                
                // Merge wizard answers with prefill answers (prefill takes precedence)
                const mergedAnswers = { ...userAnswers, ...prefillAnswers };
                
                // Create program object for prefill
                const programForPrefill = {
                  id: programData.id,
                  name: programData.name || programData.title,
                  type: programData.type || 'grant',
                  amount: programData.funding_amount_min ? `${programData.funding_amount_min}-${programData.funding_amount_max || ''}` : '',
                  eligibility: [],
                  requirements: [],
                  score: 100,
                  reasons: [],
                  risks: []
                };
                
                // Generate prefilled content using merged answers
                const prefilledSections = mapAnswersToSections(mergedAnswers, programForPrefill);
                
                // Merge prefilled content into sections
                sections = sections.map((section: any) => {
                  // Try matching by section ID/key
                  const sectionId = section.id || (section as any).key || '';
                  const sectionKeyLower = sectionId.toLowerCase();
                  
                  // Find matching prefill (try exact match first, then partial)
                  let prefill: any = null;
                  
                  // Try exact match
                  if (prefilledSections[sectionId]) {
                    prefill = prefilledSections[sectionId];
                  }
                  // Try by section key variations
                  else if (sectionKeyLower.includes('executive') || sectionKeyLower.includes('summary')) {
                    prefill = prefilledSections.executive_summary;
                  } else if (sectionKeyLower.includes('business') || sectionKeyLower.includes('description')) {
                    prefill = prefilledSections.business_description;
                  } else if (sectionKeyLower.includes('market')) {
                    prefill = prefilledSections.market_analysis;
                  } else if (sectionKeyLower.includes('financial')) {
                    prefill = prefilledSections.financial_projections;
                  } else if (sectionKeyLower.includes('team')) {
                    prefill = prefilledSections.team;
                  } else if (sectionKeyLower.includes('timeline')) {
                    prefill = prefilledSections.timeline;
                  }
                  
                  // Apply prefill if found
                  if (prefill && prefill.content) {
                    return {
                      ...section,
                      content: prefill.content,
                      status: prefill.hasTBD ? ('needs_fix' as const) : ('aligned' as const)
                    } as any;
                  }
                  
                  return section;
                });
                
                console.log('✅ Prefilled sections with wizard answers');
              } catch (prefillError) {
                console.warn('Could not prefill sections:', prefillError);
                // Continue without prefill - non-fatal
              }
            }
          }
        }
      } catch (localStorageError) {
        console.warn('Could not read localStorage for prefill:', localStorageError);
        // Continue without prefill - non-fatal
      }
      
      // PRIORITY 1: Generate content using AIHelper if sections have prompts but no content
      const sectionsWithContent = await Promise.all(sections.map(async (section: any) => {
        // If section has content (from prefill), use it
        if (section.content && section.content.trim().length > 0 && !section.content.includes('[TBD:')) {
          return section;
        }
        
        // If section has prompts but no content, generate using AIHelper
        if ((section.prompts?.length > 0 || section.description) && programData) {
          try {
            const { createAIHelper } = await import('@/features/editor/engine/aiHelper');
            const { loadUserAnswers } = await import('@/shared/lib/planStore');
            const userAnswers = typeof window !== 'undefined' ? loadUserAnswers() : {};
            
            const programForAI = {
              id: programData.id || programId,
              name: programData.name || 'Program',
              type: programData.type || 'grant',
              amount: programData.funding_amount_min ? `${programData.funding_amount_min}-${programData.funding_amount_max || ''}` : '',
              eligibility: [],
              requirements: [],
              score: 100,
              reasons: [],
              risks: []
            };
            
            const aiHelper = createAIHelper({
              maxWords: section.word_count_max || 500,
              sectionScope: section.title || section.section_name,
              programHints: {},
              userAnswers: userAnswers,
              tone: 'neutral',
              language: 'en'
            });
            
            const aiResponse = await aiHelper.generateSectionContent(
              section.title || section.section_name,
              section.prompts?.join(' ') || section.description || '',
              programForAI
            );
            
            // Use AI-generated content if available
            if (aiResponse.content && aiResponse.content.trim().length > 0) {
              return {
                ...section,
                content: aiResponse.content,
                status: 'aligned' as const
              };
            }
          } catch (aiError) {
            console.warn('AI content generation failed for section:', section.id, aiError);
            // Continue with template/prompt as fallback
          }
        }
        
        // Fallback: Use template/prompt as initial content (but mark as needs work)
        return {
          ...section,
          content: section.content || section.prompts?.join(' ') || section.description || '',
          status: (section.status || 'missing') as 'aligned' | 'missing' | 'needs_fix'
        };
      }));
      
      // Helper function to initialize tables/figures for financial sections
      const initializeEditableSections = (section: any) => {
        const sectionId = (section.id || '').toLowerCase();
        const sectionTitle = (section.title || section.section_name || '').toLowerCase();
        const isFinancial = sectionId.includes('financial') || sectionTitle.includes('financial') || 
                           sectionId.includes('revenue') || sectionTitle.includes('revenue') ||
                           sectionId.includes('budget') || sectionTitle.includes('budget') ||
                           section.category === 'financial';
        
        let tables: any = undefined;
        let figures: any[] = [];
        
        if (isFinancial) {
          // Initialize financial tables
          tables = {
            revenue: {
              columns: ['Year 1', 'Year 2', 'Year 3'],
              rows: [
                { label: 'Revenue Stream 1', values: [0, 0, 0] },
                { label: 'Revenue Stream 2', values: [0, 0, 0] },
                { label: 'Total Revenue', values: [0, 0, 0] }
              ]
            },
            costs: {
              columns: ['Year 1', 'Year 2', 'Year 3'],
              rows: [
                { label: 'Personnel', values: [0, 0, 0] },
                { label: 'Operations', values: [0, 0, 0] },
                { label: 'Marketing', values: [0, 0, 0] },
                { label: 'Total Costs', values: [0, 0, 0] }
              ]
            },
            cashflow: {
              columns: ['Year 1', 'Year 2', 'Year 3'],
              rows: [
                { label: 'Starting Cash', values: [0, 0, 0] },
                { label: 'Cash In', values: [0, 0, 0] },
                { label: 'Cash Out', values: [0, 0, 0] },
                { label: 'Ending Cash', values: [0, 0, 0] }
              ]
            },
            useOfFunds: {
              columns: ['Category', 'Amount', 'Percentage'],
              rows: [
                { label: 'Product Development', values: [0, 0] },
                { label: 'Marketing', values: [0, 0] },
                { label: 'Operations', values: [0, 0] },
                { label: 'Total', values: [0, 100] }
              ]
            }
          };
          
          // Initialize figures for charts
          figures = [
            { id: 'revenue_chart', type: 'line', title: 'Revenue Projections', description: 'Revenue growth over time' },
            { id: 'costs_chart', type: 'bar', title: 'Cost Breakdown', description: 'Cost distribution by category' }
          ];
        }
        
        return { tables, figures: figures || [] };
      };
      
      // Create sections with preserved order and initialized editable sections
      const mappedSections = sectionsWithContent.map((section: any) => {
        const { tables, figures } = initializeEditableSections(section);
        const sectionKey = section.id || section.key || `section_${Date.now()}`;
        const sectionTitle = section.title || section.section_name || 'Untitled Section';
        const sectionOrder = section.order !== undefined && section.order !== null ? section.order : 999; // Preserve order, default to 999 if missing
        
        return {
          key: sectionKey,
          title: sectionTitle,
          content: section.content || '',
          status: (section.status || (section.content && section.content.trim().length > 0 ? 'aligned' : 'missing')) as 'aligned' | 'missing' | 'needs_fix',
          wordCount: (section.content || '').split(/\s+/).filter((w: string) => w.length > 0).length,
          required: section.required !== false,
          order: sectionOrder, // PRESERVE ORDER FROM SOURCE
          // CRITICAL: Pass template properties for user guidance
          description: section.description || section.guidance || '', // What this section is about
          prompts: section.prompts || [], // Questions to help users write
          wordCountMin: section.wordCountMin || 50, // Actual minimum from template
          wordCountMax: section.wordCountMax || 5000, // Actual maximum from template
          tables: tables || section.tables, // Initialize or use existing
          figures: figures || section.figures || [], // Initialize or use existing
          fields: section.fields,
          sources: section.sources || []
        };
      });
      
      // Sort sections by order (ascending)
      const sortedSections = mappedSections.sort((a, b) => (a.order || 999) - (b.order || 999));
      
      // Create a new plan with the program's sections (now with generated content and proper ordering)
      const newPlan: PlanDocument = {
        id: `plan_${Date.now()}`,
        ownerId: userProfile?.id || 'anonymous',
        product: 'submission',
        route: 'grant',
        language: 'en',
        tone: 'neutral',
        targetLength: 'standard',
        settings: {
          includeTitlePage: true,
          includePageNumbers: true,
          citations: 'simple' as const,
          captions: true,
          graphs: {}
        },
        sections: sortedSections, // SORTED BY ORDER
        addonPack: false,
        versions: []
      };
      
      setPlan(newPlan);
      setSections(newPlan.sections);
      if (programData) setProductState(programData);
      
      console.log('✅ Loaded program sections with generated content:', sectionsWithContent.length);
    } catch (error) {
      console.error('Error loading program sections:', error);
      setError(error instanceof Error ? error.message : 'Failed to load program sections');
    } finally {
      setIsLoading(false);
    }
  };

  // If no program selected, load fallback template sections for default product
  useEffect(() => {
    if (!programProfile && sections.length === 0) {
      // Defer until setProduct is defined
      const doLoad = async () => {
        try {
          await setProduct({ id: 'submission', name: 'Business Plan', type: 'grant', description: 'Default template' } as any);
        } catch (e) {
          console.warn('Fallback template load failed', e);
        }
      };
      doLoad();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programProfile, sections.length]);

  const handlePlanChange = (newPlan: PlanDocument) => {
    setPlan(newPlan);
    setSections(newPlan.sections || []);
    if (onPlanChange) {
      onPlanChange(newPlan);
    }
  };

  // Available for parent components to use
  const handleProgramProfileChange = (profile: ProgramProfile) => {
    console.log('Program profile changed:', profile);
    if (onProgramProfileChange) {
      onProgramProfileChange(profile);
    }
  };


  const handleSectionChange = (sectionKey: string, content: string) => {
    // Update sections for UI
    const updatedSections = sections.map(section =>
      section.key === sectionKey ? { ...section, content } : section
    );
    setSections(updatedSections);
    
    // Update content state and calculate progress (from EditorState integration)
    updateSection(sectionKey, content);
    
    if (plan) {
      const updatedPlan = { ...plan, sections: updatedSections };
      handlePlanChange(updatedPlan);
    }

    // Debounced persist to storage and planStore
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        const contentMap = updatedSections.reduce((acc: Record<string,string>, s: any) => {
          acc[s.key] = s.content || '';
          return acc;
        }, {});
        await saveContentDirect(contentMap);
        savePlanSections(updatedSections.map((s: any) => ({ id: s.key, title: s.title, content: s.content || '', tables: s.tables, figures: s.figures, sources: s.sources })));
        
        // Save to dashboard if user is logged in
        if (userProfile && plan) {
          const { savePlanToDashboard } = await import('@/shared/lib/planStore');
          const { multiUserDataManager } = await import('@/shared/lib/multiUserDataManager');
          
          // Use current active client ID from state
          const currentClientId = activeClientId || undefined;
          
          // Calculate completion percentage from sections
          const totalSections = updatedSections.length;
          const completedSections = updatedSections.filter((s: any) => s.content && s.content.trim().length > 0).length;
          const completionPercentage = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
          
          // Save plan to dashboard
          savePlanToDashboard({
            id: plan.id || `plan_${Date.now()}`,
            userId: userProfile.id,
            clientId: currentClientId,
            title: plan.sections?.[0]?.title || 'Business Plan',
            programType: programProfile?.route?.toUpperCase() || 'GRANT',
            programId: programProfile?.programId,
            sections: updatedSections,
            status: completionPercentage === 100 ? 'completed' : 'in_progress'
          });
          
          // If client context exists, assign plan to client
          if (currentClientId) {
            multiUserDataManager.assignPlanToClient(
              { id: plan.id || `plan_${Date.now()}`, clientId: currentClientId },
              currentClientId
            );
          }
        }
      } catch (e) {
        console.warn('Save (debounced) failed, fallback handled by provider/planStore');
      } finally {
        setIsSaving(false);
      }
    }, 400);
  };

  const handleSectionStatusChange = (sectionKey: string, status: 'missing' | 'needs_fix' | 'aligned') => {
    const updatedSections = sections.map(section =>
      section.key === sectionKey ? { ...section, status } : section
    );
    setSections(updatedSections);
    
    if (plan) {
      const updatedPlan = { ...plan, sections: updatedSections };
      handlePlanChange(updatedPlan);
    }
  };


  // ============================================================================
  // INTEGRATED EDITOR STATE FUNCTIONS (from EditorState)
  // ============================================================================


  // Set product and load sections (exposed for parent components to use)
  // This function is available for parent components to call via ref or props
  const setProduct = useCallback(async (product: EditorProduct) => {
    console.log('setProduct called with:', product);
    setIsLoading(true);
    try {
      setProductState(product);
      setError(null);
      
      // Notify parent component
      if (onProductChange) {
        onProductChange(product);
      }
      
      // Load sections for this product
      // Determine product type from product or plan
      const productType = product.type || plan?.product || 'submission';
      
      // Determine funding type from product
      const fundingType = product.type 
        ? (product.type.includes('loan') ? 'bankLoans' : 
           product.type.includes('equity') ? 'equity' : 
           product.type.includes('visa') ? 'visa' : 'grants')
        : 'grants';
      
      // Load sections directly from unified template system
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      const templateSections = await getSections(fundingType, productType, product.id, baseUrl);
      
      // Transform template sections to editor format
      const sections = templateSections.map((section: any) => ({
        key: section.id,
        id: section.id,
        title: section.title,
        content: '',
        status: 'missing' as const,
        wordCount: 0,
        required: section.required !== false,
        order: section.order !== undefined ? section.order : 999,
        description: section.description || '',
        prompts: section.prompts || [],
        wordCountMin: section.wordCountMin || 50,
        wordCountMax: section.wordCountMax || 5000,
        tables: undefined,
        figures: [],
        fields: undefined,
        sources: []
      }));
      setSections(sections);
      
      // Initialize content if empty
      const initialContent = sections.reduce((acc, section) => {
        if (!content[section.id]) {
          acc[section.id] = (section as any).content_template || '';
        }
        return acc;
      }, { ...content });
      setContent(initialContent);
      
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  }, [content, onProductChange]);

  // Make functions available for debugging/development
  if (typeof window !== 'undefined') {
    (window as any).phase4Integration = {
      setProduct,
      handleProgramProfileChange
    };
  }

  // Update section content
  const updateSection = useCallback((sectionId: string, newContent: string) => {
    setContent(prev => ({ ...prev, [sectionId]: newContent }));
  }, []);


  // Loading state
  if (isLoading || isUserLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div>Loading Phase 4 Editor...</div>
        </div>
      </div>
    );
  }

  // No plan state
  if (!plan) {
    return (
      <div className="p-6">
        <EntryPointsManager
          currentPlan={null}
          programProfile={programProfile}
          onPlanSwitch={handlePlanChange}
          onDocumentTypeChange={(type) => console.log('Document type changed:', type)}
          showWizardEntry={true}
          showDirectEditor={true}
          showPlanSwitching={true}
        />
      </div>
    );
  }

  // Use RestructuredEditorNew for Canva-style layout (new redesign)
  if (plan && sections.length > 0) {
    return (
      <RestructuredEditorNew
        plan={plan}
        sections={sections}
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
        onActiveSectionChange={setActiveSection}
        onSectionStatusChange={handleSectionStatusChange}
        onPlanChange={handlePlanChange}
        programProfile={programProfile}
        product={product}
        requirementsProgress={requirementsProgress}
        requirementsStatus={requirementsStatus}
        onAIGenerate={handleAIGenerate}
        onSave={async () => {
          const contentMap = sections.reduce((acc: Record<string,string>, s: any) => { acc[s.key] = s.content || ''; return acc; }, {});
          setIsSaving(true);
          try {
            await saveContentDirect(contentMap);
            savePlanSections(sections.map((s: any) => ({ id: s.key, title: s.title, content: s.content || '', tables: s.tables, figures: s.figures, sources: s.sources })));
          } finally {
            setIsSaving(false);
          }
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">P</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {product ? product.name : 'Business Plan Editor'}
              </h1>
                  <p className="text-sm text-gray-500">
                    {plan.route} • {sections.length} sections
                  </p>
                </div>
              </div>
              
              {/* Client Selector (if multi-user mode) - Hidden to reduce clutter */}
              {false && clients.length > 0 && (
                <div className="flex items-center gap-2 border-l pl-6">
                  <span className="text-sm text-gray-600 font-medium">Client:</span>
                  <select
                    value={activeClientId || ''}
                    onChange={(e) => {
                      setActiveClientId(e.target.value || null);
                      analytics.trackUserAction('editor_client_switched', { clientId: e.target.value });
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Progress Indicator - Enhanced with tooltip */}
              <div className="flex items-center space-x-2 group relative">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${sections.length > 0 ? Math.round((sections.filter(s => s.status === 'aligned').length / sections.length) * 100) : 0}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-gray-700">
                  {sections.filter(s => s.status === 'aligned').length}/{sections.length}
                </span>
                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    {sections.length > 0 ? Math.round((sections.filter(s => s.status === 'aligned').length / sections.length) * 100) : 0}% Complete
                  </div>
                </div>
              </div>
              
              {/* Product/Program Switcher - More visible */}
              <div className="flex items-center gap-2">
                {/* Product Type Dropdown */}
                <select
                  value={product?.type || plan?.product || 'submission'}
                  onChange={(e) => {
                    const newProduct = { id: product?.id || 'default', type: e.target.value as any, name: e.target.value };
                    setProduct(newProduct);
                    if (onProductChange) onProductChange(newProduct);
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Select document type"
                >
                  <option value="strategy">📊 Strategy</option>
                  <option value="review">🔍 Review</option>
                  <option value="submission">📝 Submission</option>
                </select>
                
                {/* Funding Type Dropdown */}
                <select
                  value={programProfile?.route || plan?.route || 'grant'}
                  onChange={(e) => {
                    const newRoute = e.target.value as any;
                    if (programProfile) {
                      if (onProgramProfileChange) {
                        onProgramProfileChange({ ...programProfile, route: newRoute });
                      }
                    } else {
                      router.push(`/editor?product=${product?.type || 'submission'}&route=${newRoute}`);
                    }
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title="Select funding type"
                >
                  <option value="grant">🎯 Grants</option>
                  <option value="bankLoans">🏦 Loans</option>
                  <option value="equity">💼 Equity</option>
                  <option value="visa">✈️ Visa</option>
                </select>
                
                <button
                  onClick={() => setShowEntryPoints(true)}
                  className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  title="Switch Program"
                >
                  🔄
                </button>
                <button
                  onClick={() => setShowShortcutsHelp(!showShortcutsHelp)}
                  className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  title="Keyboard shortcuts (?)"
                >
                  ⌨️
                </button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setFocusMode(!focusMode)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title={`Focus Mode ${focusMode ? 'Off' : 'On'} (Ctrl+F)`}
              >
                {focusMode ? '👁️ Exit Focus' : '🎯 Focus Mode'}
              </button>
              <button
                onClick={() => {
                  const previewUrl = programProfile?.programId 
                    ? `/preview?programId=${programProfile.programId}`
                    : '/preview';
                  router.push(previewUrl);
                }}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                title="Preview"
              >
                👁️ Preview
              </button>
              <button
                onClick={() => {
                  const contentMap = sections.reduce((acc: Record<string,string>, s: any) => { acc[s.key] = s.content || ''; return acc; }, {});
                  setIsSaving(true);
                  saveContentDirect(contentMap).catch(()=>{}).finally(()=>setIsSaving(false));
                  savePlanSections(sections.map((s: any) => ({ id: s.key, title: s.title, content: s.content || '' })));
                }}
                className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                title="Save (Ctrl+S)"
              >
                {isSaving ? 'Saving…' : '💾 Save'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className={`grid grid-cols-1 gap-6 lg:gap-8 transition-all duration-300 ${
          focusMode ? 'lg:grid-cols-1' : 'lg:grid-cols-4'
        }`}>
          {/* Sidebar - Sections & Document Customization */}
          {!focusMode && (
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Sections Panel */}
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4 sm:p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Sections</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSectionSearch(!showSectionSearch)}
                      className="px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors"
                      title="Search sections (Ctrl+K)"
                    >
                      🔍
                    </button>
                    <button
                      onClick={() => setShowDocumentCustomization(!showDocumentCustomization)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                        showDocumentCustomization 
                          ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                          : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                      }`}
                      title={showDocumentCustomization ? "Hide Document Settings" : "Show Document Settings"}
                    >
                      {showDocumentCustomization ? '📄 Hide' : '⚙️'}
                    </button>
                  </div>
                </div>
                
                {/* Section Search */}
                {showSectionSearch && (
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search sections... (Ctrl+K)"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') setShowSectionSearch(false);
                        if (e.key === 'Enter' && e.currentTarget.value) {
                          const found = sections.findIndex(s => 
                            s.title.toLowerCase().includes(e.currentTarget.value.toLowerCase())
                          );
                          if (found >= 0) {
                            setActiveSection(found);
                            setShowSectionSearch(false);
                          }
                        }
                      }}
                      onChange={(e) => {
                        if (e.target.value) {
                          const found = sections.findIndex(s => 
                            s.title.toLowerCase().includes(e.target.value.toLowerCase())
                          );
                          if (found >= 0) {
                            // Highlight but don't auto-jump
                          }
                        }
                      }}
                    />
                    <div className="mt-2 max-h-48 overflow-y-auto space-y-1">
                      {sections
                        .map((section, idx) => (
                          <button
                            key={section.key}
                            onClick={() => {
                              setActiveSection(idx);
                              setShowSectionSearch(false);
                            }}
                            className="w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 transition-colors"
                          >
                            {section.order || idx + 1}. {section.title}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  {/* Sections are already sorted by order, display them */}
                  {sections.map((section, index) => {
                    const sectionNumber = section.order || index + 1;
                    return (
                      <button
                        key={section.key}
                        onClick={() => setActiveSection(index)}
                        className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                          index === activeSection
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            <span className={`text-xs font-mono flex-shrink-0 ${
                              index === activeSection ? 'text-blue-100' : 'text-gray-400'
                            }`}>
                              {sectionNumber < 10 ? `0${sectionNumber}` : sectionNumber}
                            </span>
                            <span className={`font-medium text-sm truncate ${
                              index === activeSection ? 'text-white' : 'text-gray-700'
                            }`}>
                              {section.title}
                            </span>
                          </div>
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ml-2 ${
                            section.status === 'aligned' ? 'bg-green-500' : 
                            section.status === 'needs_fix' ? 'bg-yellow-500' : 'bg-gray-300'
                          }`} title={
                            section.status === 'aligned' ? 'Complete' : 
                            section.status === 'needs_fix' ? 'Needs review' : 'Not started'
                          }></div>
                        </div>
                        {section.content && section.content.trim().length > 0 && (
                          <div className={`text-xs mt-1 truncate ${
                            index === activeSection ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {section.content.replace(/<[^>]*>/g, '').substring(0, 40)}...
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Document Customization Panel */}
              {showDocumentCustomization && (
                <div className="bg-white/90 rounded-2xl border border-gray-200 p-6 space-y-4">
                  <DocumentCustomizationPanel
                    currentConfig={{
                      tone: (plan?.tone || 'neutral') as any,
                      language: plan?.language || 'en',
                      tableOfContents: true,
                      pageNumbers: !!plan?.settings?.includePageNumbers,
                      fontFamily: 'Arial',
                      fontSize: 12,
                      lineSpacing: 1.5,
                      margins: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
                      titlePage: {
                        enabled: !!plan?.settings?.includeTitlePage,
                        title: plan?.settings?.titlePage?.title || 'Business Plan',
                        subtitle: plan?.settings?.titlePage?.subtitle || '',
                        author: plan?.settings?.titlePage?.author || '',
                        date: plan?.settings?.titlePage?.date || new Date().toLocaleDateString(),
                      },
                      citations: {
                        enabled: (plan?.settings?.citations || 'simple') === 'simple',
                        style: 'apa',
                      },
                      figures: {
                        enabled: true,
                        tableOfFigures: true,
                        chartDescriptions: true,
                      },
                    }}
                    onConfigChange={async (config) => {
                      try {
                        if (!plan) return;
                        const updated = {
                          ...plan,
                          tone: (config.tone as any) || plan.tone,
                          language: (config.language as any) || plan.language,
                          settings: {
                            ...plan.settings,
                            includeTitlePage: !!config.titlePage?.enabled,
                            includePageNumbers: !!config.pageNumbers,
                            citations: config.citations?.enabled ? 'simple' : 'none',
                            captions: true,
                            graphs: plan.settings.graphs || {},
                            titlePage: {
                              title: config.titlePage?.title,
                              subtitle: config.titlePage?.subtitle,
                              author: config.titlePage?.author,
                              date: config.titlePage?.date
                            },
                            // Save formatting settings to plan.settings.formatting
                            formatting: {
                              fontFamily: config.fontFamily || plan.settings.formatting?.fontFamily || 'Arial',
                              fontSize: config.fontSize || plan.settings.formatting?.fontSize || 12,
                              lineSpacing: config.lineSpacing || plan.settings.formatting?.lineSpacing || 1.6,
                              margins: config.margins || plan.settings.formatting?.margins || {
                                top: 2.5,
                                bottom: 2.5,
                                left: 2.5,
                                right: 2.5
                              }
                            }
                          }
                        } as PlanDocument;
                        handlePlanChange(updated);
                        // persist immediately
                        savePlanSections((updated.sections || []).map((s: any) => ({ id: s.key, title: s.title, content: s.content || '', tables: s.tables, figures: s.figures })));
                        // store minimal preview settings for Preview page (backward compatibility)
                        try {
                          const previewSettings = {
                            theme: config.fontFamily ? (config.fontFamily.toLowerCase().includes('serif') ? 'serif' : 'sans') : 'sans',
                            fontSize: (config.fontSize || 14),
                            spacing: (config.lineSpacing || 1.6),
                            showTableOfContents: !!config.tableOfContents,
                            showPageNumbers: !!config.pageNumbers
                          };
                          // Use appStore as single source of truth
                          const { savePlanSettings } = await import('@/shared/lib/planStore');
                          savePlanSettings(previewSettings);
                          setPreviewStyle({
                            fontFamily: config.fontFamily,
                            fontSize: config.fontSize,
                            lineHeight: config.lineSpacing
                          });
                        } catch {}
                      } catch {}
                    }}
                    onTemplateSelect={(template) => {
                      console.log('Template selected:', template);
                    }}
                    onExport={(format) => {
                      console.log('Export requested:', format);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
          )}

          {/* Main Editor Area */}
          <div className={focusMode ? 'lg:col-span-1' : 'lg:col-span-3'}>

          {/* Error Display */}
          {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Section Wizard */}
            {sections.length > 0 && activeSection < sections.length && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-200/50 p-4 sm:p-6 lg:p-8">
                {/* Section Header */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="text-sm font-medium text-gray-500 bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                          Step {sections[activeSection]?.order || activeSection + 1} of {sections.length}
                        </div>
                        {sections[activeSection]?.required && (
                          <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">Required</span>
                        )}
                      </div>
                      <div className="flex items-start gap-4">
                        <div className="flex-1">
                          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                            {sections[activeSection]?.title}
                          </h2>
                          {sections[activeSection]?.description && (
                            <p className="text-gray-600 text-sm leading-relaxed mb-2">
                              {sections[activeSection].description}
                            </p>
                          )}
                        </div>
                        {/* Word count target - Enhanced */}
                        {sections[activeSection]?.wordCountMin && sections[activeSection]?.wordCountMax && (
                          <div className="text-right bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3 min-w-[140px]">
                            <div className="text-xs font-medium text-blue-600 mb-1">Target length</div>
                            <div className="text-lg font-bold text-blue-700">
                              {sections[activeSection].wordCountMin} - {sections[activeSection].wordCountMax}
                            </div>
                            <div className="text-xs text-blue-600 mt-0.5">words</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Enhanced Guidance Section */}
                  <div className="space-y-3 mb-4">
                    {/* Prompts/Questions to guide user */}
                    {sections[activeSection]?.prompts && sections[activeSection].prompts.length > 0 && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                              <span className="text-white text-sm">💡</span>
                            </div>
                            <h3 className="text-sm font-semibold text-blue-900">
                              What to include:
                            </h3>
                          </div>
                          {!sections[activeSection]?.content || sections[activeSection].content.trim().length === 0 ? (
                            <button
                              onClick={handleAIGenerate}
                              className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
                              title="Generate content using AI (Ctrl+G)"
                            >
                              <span>✨</span> Generate with AI
                            </button>
                          ) : null}
                        </div>
                        <ul className="space-y-2.5">
                          {sections[activeSection].prompts.map((prompt: string, idx: number) => (
                            <li key={idx} className="text-sm text-blue-900 flex items-start gap-2.5">
                              <span className="text-blue-500 mt-1 font-bold">•</span>
                              <span className="leading-relaxed">{prompt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Section Example/Template - Collapsible */}
                    {sections[activeSection]?.description && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <button
                          onClick={() => setShowSectionExample(!showSectionExample)}
                          className="w-full flex items-center justify-between text-left"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-amber-600">📋</span>
                            <span className="text-sm font-semibold text-amber-900">See example structure</span>
                          </div>
                          <svg 
                            className={`w-5 h-5 text-amber-600 transition-transform ${showSectionExample ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {showSectionExample && (
                          <div className="mt-3 pt-3 border-t border-amber-200">
                            <div className="text-sm text-amber-800 bg-white rounded-lg p-4 border border-amber-100">
                              <p className="font-medium mb-2">Example structure:</p>
                              <p className="text-amber-700 leading-relaxed whitespace-pre-line">
                                {sections[activeSection].description}
                              </p>
                              <button
                                onClick={() => {
                                  // Copy example description as starting point
                                  if (sections[activeSection] && !sections[activeSection].content) {
                                    handleSectionChange(sections[activeSection].key, sections[activeSection].description || '');
                                  }
                                }}
                                className="mt-3 px-3 py-1.5 text-xs font-medium bg-amber-600 text-white rounded hover:bg-amber-700 transition-colors"
                              >
                                Use as starting point
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rich Text Editor */}
                <div className="space-y-6">
                  {/* Enhanced Quick Actions Bar - Show when empty */}
                  {(!sections[activeSection]?.content || sections[activeSection].content.trim().length === 0) && (
                    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-2 border-purple-300 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <span className="text-white text-2xl">✨</span>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-base font-bold text-gray-900 mb-1">Ready to start writing?</h4>
                          <p className="text-sm text-gray-600 mb-3">Let AI help you create a professional {sections[activeSection]?.title?.toLowerCase()} section</p>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleAIGenerate}
                              className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:scale-105"
                              title="Or press Ctrl+G"
                            >
                              <span>✨</span> Generate with AI
                            </button>
                            <span className="text-xs text-gray-500">or</span>
                            <button
                              onClick={() => setShowSectionExample(true)}
                              className="px-4 py-2 text-sm font-medium text-purple-700 bg-white border border-purple-300 rounded-xl hover:bg-purple-50 transition-colors"
                            >
                              📋 View Template
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <RichTextEditor
                    content={sections[activeSection]?.content || ''}
                    onChange={(content) => handleSectionChange(sections[activeSection].key, content)}
                    section={sections[activeSection]}
                    guidance={sections[activeSection]?.description || sections[activeSection]?.guidance || ''}
                    placeholder={
                      sections[activeSection]?.prompts && sections[activeSection].prompts.length > 0
                        ? `Start by answering: ${sections[activeSection].prompts[0]}...`
                        : sections[activeSection]?.description
                          ? `Write about: ${sections[activeSection].description.substring(0, 60)}...`
                          : `Enter content for ${sections[activeSection]?.title || 'this section'}...`
                    }
                    minLength={sections[activeSection]?.wordCountMin || 50}
                    maxLength={sections[activeSection]?.wordCountMax || 5000}
                    showWordCount={true}
                    showGuidance={false} // We show description and prompts above instead
                    showFormatting={true}
                  />

                  {/* Attachments Editor */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200/70 space-y-4">
                    {/* Financial Table quick editor */}
                    {sections[activeSection]?.tables?.financials && (
                      <div>
                        <div className="font-medium text-gray-800 mb-2">Financials (quick edit)</div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr>
                                <th className="text-left p-2">Item</th>
                                {sections[activeSection].tables.financials.columns.map((c: string, idx: number) => (
                                  <th key={idx} className="text-right p-2">{c}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {sections[activeSection].tables.financials.rows.map((row: any, rIdx: number) => (
                                <tr key={rIdx}>
                                  <td className="p-2">{row.label}</td>
                                  {row.values.map((v: number, cIdx: number) => (
                                    <td key={cIdx} className="p-2 text-right">
                                      <input
                                        type="number"
                                        className="w-24 border rounded px-2 py-1 text-right"
                                        value={v}
                                        onChange={(e) => {
                                          const next = [...sections];
                                          const val = Number(e.target.value || 0);
                                          next[activeSection] = { ...next[activeSection], tables: { ...next[activeSection].tables, financials: { ...next[activeSection].tables.financials, rows: next[activeSection].tables.financials.rows.map((rr: any, i: number) => i===rIdx ? { ...rr, values: rr.values.map((vv: number, j: number) => j===cIdx ? val : vv) } : rr) } } };
                                          setSections(next);
                                          if (plan) handlePlanChange({ ...plan, sections: next });
                                        }}
                                      />
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Figures quick editor */}
                    {sections[activeSection]?.figures && (
                      <div>
                        <div className="font-medium text-gray-800 mb-2">Figures</div>
                        <div className="space-y-2">
                          {sections[activeSection].figures.map((fig: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-2">
                              <select
                                value={fig.type}
                                onChange={(e) => {
                                  const next = [...sections];
                                  const f = { ...fig, type: e.target.value };
                                  next[activeSection] = { ...next[activeSection], figures: next[activeSection].figures.map((ff: any, i: number) => i===idx ? f : ff) } as any;
                                  setSections(next);
                                  if (plan) handlePlanChange({ ...plan, sections: next });
                                }}
                                className="border rounded px-2 py-1"
                              >
                                <option value="bar">Bar</option>
                                <option value="line">Line</option>
                                <option value="donut">Donut</option>
                              </select>
                              <input
                                className="flex-1 border rounded px-2 py-1"
                                placeholder="Caption"
                                value={fig.caption || ''}
                                onChange={(e) => {
                                  const next = [...sections];
                                  const f = { ...fig, caption: e.target.value };
                                  next[activeSection] = { ...next[activeSection], figures: next[activeSection].figures.map((ff: any, i: number) => i===idx ? f : ff) } as any;
                                  setSections(next);
                                  if (plan) handlePlanChange({ ...plan, sections: next });
                                }}
                              />
                              <input
                                className="flex-1 border rounded px-2 py-1"
                                placeholder="Alt text"
                                value={fig.altText || ''}
                                onChange={(e) => {
                                  const next = [...sections];
                                  const f = { ...fig, altText: e.target.value };
                                  next[activeSection] = { ...next[activeSection], figures: next[activeSection].figures.map((ff: any, i: number) => i===idx ? f : ff) } as any;
                                  setSections(next);
                                  if (plan) handlePlanChange({ ...plan, sections: next });
                                }}
                              />
                              <button
                                className="px-2 py-1 text-red-700 border border-red-300 rounded"
                                onClick={() => {
                                  const next = [...sections];
                                  next[activeSection] = { ...next[activeSection], figures: next[activeSection].figures.filter((_: any, i: number) => i!==idx) } as any;
                                  setSections(next);
                                  if (plan) handlePlanChange({ ...plan, sections: next });
                                }}
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sources editor */}
                    <div>
                      <div className="font-medium text-gray-800 mb-2">Sources</div>
                      <div className="space-y-2">
                        {(sections[activeSection]?.sources || []).map((src: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input className="flex-1 border rounded px-2 py-1" placeholder="Title" value={src.title || ''} onChange={(e)=>{
                              const next = [...sections];
                              const list = [...(next[activeSection].sources||[])];
                              list[idx] = { ...list[idx], title: e.target.value };
                              next[activeSection] = { ...next[activeSection], sources: list } as any;
                              setSections(next);
                              if (plan) handlePlanChange({ ...plan, sections: next });
                            }} />
                            <input className="flex-1 border rounded px-2 py-1" placeholder="URL" value={src.url || ''} onChange={(e)=>{
                              const next = [...sections];
                              const list = [...(next[activeSection].sources||[])];
                              list[idx] = { ...list[idx], url: e.target.value };
                              next[activeSection] = { ...next[activeSection], sources: list } as any;
                              setSections(next);
                              if (plan) handlePlanChange({ ...plan, sections: next });
                            }} />
                            <button className="px-2 py-1 text-red-700 border border-red-300 rounded" onClick={()=>{
                              const next = [...sections];
                              const list = (next[activeSection].sources||[]).filter((_: any, i: number)=> i!==idx);
                              next[activeSection] = { ...next[activeSection], sources: list } as any;
                              setSections(next);
                              if (plan) handlePlanChange({ ...plan, sections: next });
                            }}>Remove</button>
                          </div>
                        ))}
                        <button className="px-3 py-1 border rounded text-sm" onClick={()=>{
                          const next = [...sections];
                          const list = [ ...(next[activeSection].sources||[]), { title: '', url: '' } ];
                          next[activeSection] = { ...next[activeSection], sources: list } as any;
                          setSections(next);
                          if (plan) handlePlanChange({ ...plan, sections: next });
                        }}>+ Add source</button>
                      </div>
                    </div>
                  </div>

                  {/* Requirements Progress - Always visible */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-gray-700">Requirements</span>
                        <span className="text-xs font-semibold text-gray-700">
                          {requirementsProgress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                        <div 
                          className={`h-1.5 rounded-full transition-all ${
                            requirementsStatus === 'complete' ? 'bg-green-500' :
                            requirementsStatus === 'incomplete' ? 'bg-yellow-500' :
                            requirementsStatus === 'error' ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${requirementsProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-600">
                        {requirementsStatus === 'complete' && '✅ All requirements met'}
                        {requirementsStatus === 'incomplete' && '⚠️ Some requirements pending'}
                        {requirementsStatus === 'error' && '❌ Error checking requirements'}
                        {requirementsStatus === 'loading' && 'Checking...'}
                        {!programProfile && 'No program selected'}
                      </div>
                    </div>

                  {/* Section Navigation & Actions */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    {/* Navigation Buttons */}
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                        disabled={activeSection === 0}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Previous section (Ctrl+↑)"
                      >
                        ← Previous
                      </button>
                      <button
                        onClick={() => setShowSectionSearch(true)}
                        className="px-3 py-2 text-xs text-gray-600 hover:text-gray-900 transition-colors border border-gray-300 rounded"
                        title="Jump to section (Ctrl+K)"
                      >
                        🔍 Jump
                      </button>
                      <button
                        onClick={() => setActiveSection(Math.min(sections.length - 1, activeSection + 1))}
                        disabled={activeSection === sections.length - 1}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Next section (Ctrl+↓)"
                      >
                        Next →
                      </button>
                    </div>

                {/* Section Status - Simplified */}
                <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSectionStatusChange(sections[activeSection].key, 'aligned')}
                        className="px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                      >
                        ✓ Complete
                      </button>
                      <button
                        onClick={() => handleSectionStatusChange(sections[activeSection].key, 'needs_fix')}
                        className="px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                      >
                        ⚠ Review
                      </button>
                  </div>
                </div>
              </div>
            </div>
          )}

            {/* No Sections State - Enhanced onboarding */}
            {sections.length === 0 && (
              <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-2xl border-2 border-dashed border-blue-200 p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Let's Get Started!</h3>
                <p className="text-gray-600 mb-2 max-w-md mx-auto">
                  Choose a funding program to get started. We'll create a customized business plan with all the sections you need.
                </p>
                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setShowEntryPoints(true)}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
                  >
                    🎯 Choose Your Program
                  </button>
                  <div className="text-sm text-gray-500">
                    <p className="mb-1">Or start with:</p>
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={() => router.push('/reco')}
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        Recommendation Wizard
                      </button>
                      <span>•</span>
                      <button
                        onClick={() => router.push('/editor?product=strategy&route=grant')}
                        className="text-blue-600 hover:text-blue-700 underline"
                      >
                        Quick Start Template
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note: AI Assistant is now integrated in RestructuredEditorNew via ComplianceAIHelper */}

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowShortcutsHelp(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">⌨️ Keyboard Shortcuts</h3>
                <button
                  onClick={() => setShowShortcutsHelp(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Content</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Generate with AI</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+G</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Save</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+S</kbd>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Navigation</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Previous section</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+↑</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Next section</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+↓</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Jump to section</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+K</kbd>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">View</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Focus mode</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Ctrl+F</kbd>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-gray-600">Show shortcuts</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">?</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Entry Points Modal */}
          {showEntryPoints && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Entry Points</h3>
                <button
                  onClick={() => setShowEntryPoints(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <EntryPointsManager
                currentPlan={plan}
                programProfile={programProfile}
                onPlanSwitch={handlePlanChange}
                onDocumentTypeChange={(type) => console.log('Document type changed:', type)}
                showWizardEntry={true}
                showDirectEditor={true}
                showPlanSwitching={true}
              />
                </div>
              </div>
            </div>
          )}
      {/* Inline Preview Drawer */}
      {showInlinePreview && plan && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={()=>setShowInlinePreview(false)} />
          <div className="absolute top-0 right-0 h-full w-full md:w-[520px] bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <div className="font-semibold">Formatted Preview</div>
              <button className="text-gray-500 hover:text-gray-800" onClick={()=>setShowInlinePreview(false)}>✕</button>
            </div>
            <div className="p-4" style={{ fontFamily: previewStyle.fontFamily || undefined, fontSize: previewStyle.fontSize ? `${previewStyle.fontSize}px` : undefined, lineHeight: previewStyle.lineHeight ? String(previewStyle.lineHeight) : undefined }}>
              <ExportRenderer
                plan={{
                  ...plan,
                  sections: sections.map((s: any) => ({ key: s.key, title: s.title, content: s.content || '', status: s.status, tables: s.tables, figures: s.figures }))
                } as any}
                showWatermark={false}
                previewMode={'formatted'}
                previewSettings={{ showWordCount: false, showCharacterCount: false, showCompletionStatus: false, enableRealTimePreview: false }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
