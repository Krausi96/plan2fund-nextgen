import { useCallback } from 'react';
import type { SectionTemplate, DocumentTemplate } from '@templates';
import { useEditorStore } from '@/features/editor/lib/hooks/core/store/index';
import type { Section } from '@/features/editor/lib/types/plan';
import { isAdditionalDocument, getDocumentSections } from '@/features/editor/lib/helpers/editorHelpers';

/**
 * Hook for template configuration management handlers
 * Wraps template management functions with navigation suppression
 */
export function useTemplateConfigurationHandlers(
  toggleSectionBase: (sectionId: string) => void,
  addCustomDocumentBase: (name: string, description: string, onComplete?: () => void) => DocumentTemplate | undefined,
  setCustomSections: React.Dispatch<React.SetStateAction<SectionTemplate[]>>,
  setCustomDocuments: React.Dispatch<React.SetStateAction<DocumentTemplate[]>>,
  setDisabledSections: React.Dispatch<React.SetStateAction<Set<string>>>,
  setDisabledDocuments: React.Dispatch<React.SetStateAction<Set<string>>>,
  setExpandedSectionId: React.Dispatch<React.SetStateAction<string | null>>,
  setExpandedDocumentId: React.Dispatch<React.SetStateAction<string | null>>,
  setEditingSection: React.Dispatch<React.SetStateAction<SectionTemplate | null>>,
  setEditingDocument: React.Dispatch<React.SetStateAction<DocumentTemplate | null>>,
  setEditingSectionId: (sectionId: string | null) => void,
  setShowAddSection: React.Dispatch<React.SetStateAction<boolean>>,
  setShowAddDocument: React.Dispatch<React.SetStateAction<boolean>>,
  setNewSectionTitle: React.Dispatch<React.SetStateAction<string>>,
  setNewSectionDescription: React.Dispatch<React.SetStateAction<string>>,
  setNewDocumentName: React.Dispatch<React.SetStateAction<string>>,
  setNewDocumentDescription: React.Dispatch<React.SetStateAction<string>>,
  customSections: SectionTemplate[],
  clickedDocumentId: string | null,
  sectionChangeSourceRef: React.MutableRefObject<'user' | 'scroll' | 'preview'>,
  suppressNavigationRef: React.MutableRefObject<boolean>,
  lastUpdateKeyRef: React.MutableRefObject<string>
) {
  const toggleSection = useCallback((sectionId: string) => {
    sectionChangeSourceRef.current = 'scroll';
    suppressNavigationRef.current = true;
    toggleSectionBase(sectionId);
    setTimeout(() => {
      suppressNavigationRef.current = false;
    }, 150);
  }, [toggleSectionBase, sectionChangeSourceRef, suppressNavigationRef]);

  const addCustomSection = useCallback((newSectionTitle: string, newSectionDescription: string) => {
    if (!newSectionTitle.trim()) {
      return;
    }
    
    const currentPlan = useEditorStore.getState().plan;
    const isAdditionalDoc = isAdditionalDocument(currentPlan, clickedDocumentId);
    
    if (isAdditionalDoc && clickedDocumentId && currentPlan) {
      const sectionId = `custom_section_${Date.now()}`;
      const newSection: Section = {
        id: sectionId,
        title: newSectionTitle.trim(),
        description: newSectionDescription.trim() || 'Benutzerdefinierter Abschnitt',
        questions: [],
        datasets: [],
        kpis: [],
        media: [],
        collapsed: false,
        category: 'custom',
        progress: 0
      };
      
      const documentSections = currentPlan.metadata?.documentSections || {};
      const currentDocumentSections = getDocumentSections(currentPlan, clickedDocumentId);
      
      useEditorStore.setState({
        plan: {
          ...currentPlan,
          id: currentPlan.id || `plan_${Date.now()}`,
          metadata: {
            ...currentPlan.metadata,
            documentSections: {
              ...documentSections,
              [clickedDocumentId]: [...currentDocumentSections, newSection]
            }
          }
        }
      });
      
      const newSectionTemplate: SectionTemplate = {
        id: sectionId,
        title: newSectionTitle.trim(),
        description: newSectionDescription.trim() || 'Benutzerdefinierter Abschnitt',
        required: false,
        wordCountMin: 0,
        wordCountMax: 0,
        order: 1000 + customSections.length,
        category: 'custom',
        prompts: ['Beschreibe hier den Inhalt deines Abschnitts'],
        questions: [],
        validationRules: {
          requiredFields: [],
          formatRequirements: []
        },
        origin: 'custom',
        visibility: 'advanced'
      };
      setCustomSections(prev => [...prev, newSectionTemplate]);
    } else {
      const newSection: SectionTemplate = {
        id: `custom_section_${Date.now()}`,
        title: newSectionTitle.trim(),
        description: newSectionDescription.trim() || 'Benutzerdefinierter Abschnitt',
        required: false,
        wordCountMin: 0,
        wordCountMax: 0,
        order: 1000 + customSections.length,
        category: 'custom',
        prompts: ['Beschreibe hier den Inhalt deines Abschnitts'],
        questions: [],
        validationRules: {
          requiredFields: [],
          formatRequirements: []
        },
        origin: 'custom',
        visibility: 'advanced'
      };
      setCustomSections(prev => [...prev, newSection]);
    }
    
    setNewSectionTitle('');
    setNewSectionDescription('');
    setShowAddSection(false);
    lastUpdateKeyRef.current = '';
  }, [customSections.length, clickedDocumentId, setCustomSections, setNewSectionTitle, setNewSectionDescription, setShowAddSection, lastUpdateKeyRef]);

  const addCustomDocument = useCallback((newDocumentName: string, newDocumentDescription: string) => {
    const newDocument = addCustomDocumentBase(newDocumentName, newDocumentDescription, () => {
      setEditingSectionId(null);
    });
    if (newDocument) {
      setCustomDocuments(prev => [...prev, newDocument]);
      setNewDocumentName('');
      setNewDocumentDescription('');
      setShowAddDocument(false);
    }
  }, [addCustomDocumentBase, setCustomDocuments, setNewDocumentName, setNewDocumentDescription, setShowAddDocument, setEditingSectionId]);

  const toggleAddBadge = useCallback((type: 'section' | 'document') => {
    if (type === 'section') {
      setShowAddSection(prev => {
        if (prev) {
          setNewSectionTitle('');
          setNewSectionDescription('');
        }
        return !prev;
      });
    } else {
      setShowAddDocument(prev => {
        if (prev) {
          setNewDocumentName('');
          setNewDocumentDescription('');
        }
        return !prev;
      });
    }
  }, [setShowAddSection, setShowAddDocument, setNewSectionTitle, setNewSectionDescription, setNewDocumentName, setNewDocumentDescription]);

  const handleSaveItem = useCallback((item: SectionTemplate | DocumentTemplate, type: 'section' | 'document') => {
    if (type === 'section') {
      const section = item as SectionTemplate;
      if (section.origin === 'custom') {
        setCustomSections(prev => prev.map(s => s.id === section.id ? section : s));
      } else {
        const updatedSection = { 
          ...section, 
          id: `custom_${section.id}_${Date.now()}`,
          origin: 'custom' as const 
        };
        setCustomSections(prev => [...prev, updatedSection]);
        setDisabledSections(prev => new Set([...prev, section.id]));
      }
      setExpandedSectionId(null);
      setEditingSection(null);
    } else {
      const document = item as DocumentTemplate;
      if (document.origin === 'custom') {
        setCustomDocuments(prev => prev.map(d => d.id === document.id ? document : d));
      } else {
        const updatedDocument = { 
          ...document, 
          id: `custom_${document.id}_${Date.now()}`,
          origin: 'custom' as const 
        };
        setCustomDocuments(prev => [...prev, updatedDocument]);
        setDisabledDocuments(prev => new Set([...prev, document.id]));
      }
      setExpandedDocumentId(null);
      setEditingDocument(null);
    }
  }, [setCustomSections, setCustomDocuments, setDisabledSections, setDisabledDocuments, setExpandedSectionId, setExpandedDocumentId, setEditingSection, setEditingDocument]);

  return {
    toggleSection,
    addCustomSection,
    addCustomDocument,
    toggleAddBadge,
    handleSaveItem
  };
}

