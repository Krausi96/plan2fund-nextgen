import { useEffect, useRef } from 'react';
import { METADATA_SECTION_ID, isMetadataSection } from '@/features/editor/lib/hooks/useEditorStore';
import type { BusinessPlan } from '@/features/editor/lib/types/plan';

/**
 * Hook for auto-activating editor when plan loads or activeSectionId changes
 */
export function useEditorAutoActivation(
  plan: BusinessPlan | null,
  activeSectionId: string | null,
  activeQuestionId: string | null,
  editingSectionId: string | null,
  isConfiguratorOpen: boolean,
  disabledSections: Set<string>,
  setActiveSection: (sectionId: string) => void,
  setActiveQuestion: (questionId: string) => void,
  setEditingSectionId: (sectionId: string | null) => void,
  handleSectionSelect: (sectionId: string, source: 'user' | 'scroll' | 'preview') => void
) {
  const sectionChangeSourceRef = useRef<'user' | 'scroll' | 'preview'>('scroll');
  const suppressNavigationRef = useRef(false);
  const previousConfiguratorOpenRef = useRef(isConfiguratorOpen);

  // Track configurator state changes to suppress navigation when closing
  useEffect(() => {
    if (previousConfiguratorOpenRef.current && !isConfiguratorOpen) {
      suppressNavigationRef.current = true;
      sectionChangeSourceRef.current = 'scroll';
      setTimeout(() => {
        suppressNavigationRef.current = false;
      }, 500);
    }
    previousConfiguratorOpenRef.current = isConfiguratorOpen;
  }, [isConfiguratorOpen]);

  // Auto-activate editor when plan loads or activeSectionId changes
  useEffect(() => {
    if (!plan) return;
    if (isConfiguratorOpen) return;
    if (suppressNavigationRef.current) return;
    if (!activeSectionId) return;
    
    const isMetadataSectionCheck = isMetadataSection(activeSectionId);
    
    if (disabledSections.has(activeSectionId) && !isConfiguratorOpen && sectionChangeSourceRef.current === 'user') {
      const firstEnabledSection = plan.sections.find(s => !disabledSections.has(s.id));
      if (firstEnabledSection) {
        sectionChangeSourceRef.current = 'user';
        setActiveSection(firstEnabledSection.id);
      } else {
        sectionChangeSourceRef.current = 'user';
        setActiveSection(METADATA_SECTION_ID);
      }
      return;
    }
    
    if (!isConfiguratorOpen && 
        !suppressNavigationRef.current &&
        (!disabledSections.has(activeSectionId)) && 
        sectionChangeSourceRef.current !== 'scroll' &&
        (sectionChangeSourceRef.current === 'user' || sectionChangeSourceRef.current === 'preview') &&
        (!editingSectionId || editingSectionId !== activeSectionId)) {
      setEditingSectionId(activeSectionId);
    }
    
    if (!isConfiguratorOpen && !isMetadataSectionCheck) {
      const section = plan.sections.find(s => s.id === activeSectionId);
      if (section && !activeQuestionId && section.questions[0]?.id) {
        setActiveQuestion(section.questions[0].id);
      }
    }

    if (!isConfiguratorOpen && (sectionChangeSourceRef.current === 'user' || sectionChangeSourceRef.current === 'preview')) {
      const scrollToSection = () => {
        const scrollContainer = document.getElementById('preview-scroll-container');
        if (!scrollContainer) {
          return false;
        }

        let sectionElement = scrollContainer.querySelector(`[data-section-id="${activeSectionId}"]`) as HTMLElement;
        
        if (!sectionElement) {
          const exportPreview = scrollContainer.querySelector('.export-preview');
          if (exportPreview) {
            sectionElement = exportPreview.querySelector(`[data-section-id="${activeSectionId}"]`) as HTMLElement;
          }
        }

        if (!sectionElement) {
          sectionElement = document.querySelector(`[data-section-id="${activeSectionId}"]`) as HTMLElement;
        }

        if (sectionElement) {
          const isMetadataSectionScroll = isMetadataSection(activeSectionId);
          sectionElement.scrollIntoView({
            behavior: 'smooth',
            block: isMetadataSectionScroll ? 'start' : 'center',
            inline: 'nearest'
          });
          return true;
        }
        
        return false;
      };

      requestAnimationFrame(() => {
        if (!scrollToSection()) {
          const retries = [100, 300, 500, 1000, 2000];
          let retryIndex = 0;
          
          const retryScroll = () => {
            if (retryIndex < retries.length) {
              setTimeout(() => {
                if (scrollToSection()) {
                  return;
                }
                retryIndex++;
                retryScroll();
              }, retries[retryIndex]);
            }
          };
          
          retryScroll();
        }
      });
    }
    
    if (!suppressNavigationRef.current && sectionChangeSourceRef.current !== 'scroll') {
      sectionChangeSourceRef.current = 'scroll';
    }
  }, [activeSectionId, plan, activeQuestionId, editingSectionId, setActiveSection, setActiveQuestion, setEditingSectionId, isConfiguratorOpen, disabledSections]);

  const handleSectionSelectWrapper = (sectionId: string, source: 'user' | 'scroll' | 'preview' = 'user') => {
    sectionChangeSourceRef.current = source;
    suppressNavigationRef.current = false;
    handleSectionSelect(sectionId, source);
  };

  return {
    sectionChangeSourceRef,
    suppressNavigationRef,
    handleSectionSelect: handleSectionSelectWrapper
  };
}

