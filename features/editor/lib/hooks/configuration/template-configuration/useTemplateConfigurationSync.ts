import { useEffect, useRef } from 'react';
import type { SectionTemplate, DocumentTemplate } from '@templates';

/**
 * Hook to sync template configuration changes to parent component
 * Notifies parent when templates change
 */
export function useTemplateConfigurationSync(
  disabledSections: Set<string>,
  disabledDocuments: Set<string>,
  customSections: SectionTemplate[],
  customDocuments: DocumentTemplate[],
  isConfiguratorOpen: boolean,
  suppressNavigationRef: React.MutableRefObject<boolean>,
  handleTemplateUpdate: (update: {
    disabledSectionIds: string[];
    disabledDocumentIds: string[];
    customSections?: SectionTemplate[];
    customDocuments?: DocumentTemplate[];
  }) => void
) {
  const lastUpdateKeyRef = useRef<string>('');
  
  useEffect(() => {
    // Don't trigger hydration if configurator is open or we're suppressing navigation
    if (isConfiguratorOpen || suppressNavigationRef.current) {
      return;
    }
    
    const updateKey = JSON.stringify({
      disabled: Array.from(disabledSections).sort(),
      docs: Array.from(disabledDocuments).sort(),
      customSections: customSections.map(s => s.id).sort(),
      customDocuments: customDocuments.map(d => d.id).sort()
    });
    
    if (lastUpdateKeyRef.current === updateKey) {
      return;
    }
    
    lastUpdateKeyRef.current = updateKey;
    
    handleTemplateUpdate({
      disabledSectionIds: Array.from(disabledSections).sort(),
      disabledDocumentIds: Array.from(disabledDocuments).sort(),
      customSections: customSections.length > 0 ? customSections : undefined,
      customDocuments: customDocuments.length > 0 ? customDocuments : undefined
    });
  }, [disabledSections, disabledDocuments, customSections, customDocuments, isConfiguratorOpen, suppressNavigationRef, handleTemplateUpdate]);
}

