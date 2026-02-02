import React, { useState } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import {
  useSidebarState,
  useDocumentsBarState,
  useEditorStore,
  getSectionTitle,
} from '@/features/editor/lib';
import { AddSectionForm, TreeNodeRenderer } from './components';
import { sortSectionsByCanonicalOrder } from '@/features/editor/lib';
import type { TreeNode } from '@/features/editor/lib/types/types';

export default function TreeNavigator() {
  const { t } = useI18n();
  const sidebarState = useSidebarState();
  const documentsState = useDocumentsBarState();
  
  // Local state for forms
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newDocumentName, setNewDocumentName] = useState('');
  
  const { 
    disabledSections = new Set(), 
    actions: sidebarActions, 
    activeId: activeSectionId = null,
    showAdd: showAddSection = false,
    isEditing: isEditingSection = false
  } = sidebarState || {};
  
  const { 
    documents = [], 
    disabledDocuments = new Set(), 
    actions: documentsBarActions, 
    clickedId: clickedDocumentId = null,
    selectedProductMeta = null,
    showAdd: showAddDocument = false
  } = documentsState || {};
  
  // Provide fallback actions to prevent undefined errors
  const safeSidebarActions = sidebarActions || {
    setActiveSectionId: () => {},
    toggleSection: () => {},
    editSection: () => {},
    cancelEdit: () => {},
    toggleAddSection: () => {},
    addCustomSection: () => {},
    removeCustomSection: () => {},
  };
  
  const safeDocumentsBarActions = documentsBarActions || {
    setClickedDocumentId: () => {},
    toggleDocument: () => {},
    editDocument: () => {},
    cancelEdit: () => {},
    toggleAddDocument: () => {},
    removeCustomDocument: () => {},
  };
  
  // Get additional state from store
  const { expandedSectionId, expandedDocumentId, documentStructure } = useEditorStore((state) => ({
    expandedSectionId: state.expandedSectionId,
    expandedDocumentId: state.expandedDocumentId,
    documentStructure: state.setupWizard.documentStructure
  }));
  
  // Get sections from document structure and sort them
  const sections = React.useMemo(() => {
    const rawSections = documentStructure?.sections || [];
    return sortSectionsByCanonicalOrder(rawSections);
  }, [documentStructure]);
  
  // State for tree expansion/collapse
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [expandedSubsections, setExpandedSubsections] = useState<Record<string, boolean>>({});

  // Toggle node expansion
  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  };

  // Create hierarchical tree structure
  const treeData = React.useMemo<TreeNode[]>(() => {
    const treeNodes: TreeNode[] = [];
    
    // Add core product document if selected
    if (selectedProductMeta && !expandedDocumentId) {
      const translatedLabel = t(selectedProductMeta.label as any) || selectedProductMeta.label || 'No selection';
      
      const documentNode: TreeNode = {
        id: 'core-product',
        name: translatedLabel,
        type: 'document',
        isDisabled: false,
        isActive: clickedDocumentId === 'core-product',
        isRequired: true,
        isCustom: false,
        origin: 'product',
        icon: selectedProductMeta.icon || '📄',
        children: [],
        level: 0,
        isExpanded: expandedNodes.has('core-product'),
      };
      
      // Add sections as children of the document
      if (sections && sections.length > 0) {
        documentNode.children = sections.map((section: any) => {
          // Create subsection children if they exist
          const subsections = section.rawSubsections || section.fields?.subchapters || [];
          const subsectionChildren = subsections?.map((subsection: any) => ({
            id: `${section.id}-subsection-${subsection.id}`,
            name: t(`editor.subsection.${subsection.id}` as any) !== `editor.subsection.${subsection.id}` ? t(`editor.subsection.${subsection.id}` as any) : subsection.title,
            type: 'subsection' as const,
            parentId: section.id,
            isDisabled: disabledSections?.has?.(section.id) || false,
            isActive: false, // Subsections don't have active state
            isRequired: false,
            isCustom: false,
            origin: 'template',
            icon: '📌',
            children: [],
            level: 2,
          })) || [];
          
          // Handle subsections with expand/collapse functionality
          let finalSubsectionChildren = subsectionChildren;
          const isSubsectionsExpanded = expandedSubsections[section.id] ?? false;
          
          if (subsectionChildren.length > 4) {
            // Show only first 4 unless expanded
            finalSubsectionChildren = isSubsectionsExpanded 
              ? subsectionChildren 
              : subsectionChildren.slice(0, 4);
            
            // Add "Show more" or "Show less" indicator as a special node
            const toggleNode = {
              id: `${section.id}-toggle`,
              name: isSubsectionsExpanded 
                ? `(${t('editor.ui.showLess' as any) || 'Show less'})` 
                : `+${subsectionChildren.length - 4} ${t('editor.ui.more' as any) || 'more'}`,
              type: 'toggle-subsections' as const,
              parentId: section.id,
              isDisabled: false,
              isActive: false,
              isRequired: false,
              isCustom: false,
              origin: 'template',
              icon: isSubsectionsExpanded ? '▴' : '▾',
              children: [],
              level: 2,
            };
            finalSubsectionChildren = [...finalSubsectionChildren, toggleNode];
          }
          
          return {
            id: section.id,
            name: getSectionTitle(section.id, section.title || section.name || 'Untitled Section', t),
            type: 'section',
            parentId: 'core-product',
            isDisabled: disabledSections?.has?.(section.id) || false,
            isActive: section.id === activeSectionId,
            isRequired: section.required,
            isCustom: section.origin === 'custom',
            origin: section.origin || 'template',
            icon: section.id === 'metadata' ? '📕' : 
                  section.id === 'ancillary' ? '📑' : 
                  section.id === 'references' ? '📚' : 
                  section.id === 'tables_data' ? '📊' : 
                  section.id === 'figures_images' ? '🖼️' : 
                  section.id === 'appendices' ? '📎' : '🧾',
            children: finalSubsectionChildren,
            level: 1,
          };
        });
      }
      
      // Add section add button as first child if document is expanded
      if (documentNode.isExpanded && !expandedSectionId && !isEditingSection) {
        documentNode.children = [
          {
            id: 'add-section-button-core',
            name: t('editor.desktop.program.addSection' as any) || 'Add Section',
            type: 'add-section',
            icon: '+',
            parentId: 'core-product',
            children: [],
            level: 1,
            isSpecial: true,
          },
          ...(documentNode.children || [])
        ];
      }
      
      treeNodes.push(documentNode);
    }
    
    // Add regular documents with their sections
    documents.forEach((doc: any) => {
      const documentNode: TreeNode = {
        id: doc.id,
        name: doc.name || 'Untitled Document',
        type: 'document',
        isDisabled: disabledDocuments?.has?.(doc.id) || false,
        isActive: doc.id === clickedDocumentId,
        isRequired: doc.required,
        isCustom: doc.origin === 'custom',
        origin: doc.origin || 'template',
        icon: '📄',
        children: [],
        level: 0,
        isExpanded: expandedNodes.has(doc.id),
      };
      
      // Add section add button as first child if document is expanded
      if (documentNode.isExpanded && !expandedSectionId && !isEditingSection) {
        documentNode.children = [
          {
            id: `add-section-button-${doc.id}`,
            name: t('editor.desktop.program.addSection' as any) || 'Add Section',
            type: 'add-section',
            icon: '+',
            parentId: doc.id,
            children: [],
            level: 1,
            isSpecial: true,
          },
          ...(documentNode.children || [])
        ];
      }
      
      // Add sections to document if they exist
      if (sections && sections.length > 0) {
        // Filter sections that belong to this document
        const docSections = sections.filter((section: any) => section.documentId === doc.id);
        
        docSections.forEach((section: any) => {
          // Create subsection children if they exist
          const subsections = section.rawSubsections || section.fields?.subchapters || [];
          const subsectionChildren = subsections?.map((subsection: any) => ({
            id: `${section.id}-subsection-${subsection.id}`,
            name: t(`editor.subsection.${subsection.id}` as any) !== `editor.subsection.${subsection.id}` ? t(`editor.subsection.${subsection.id}` as any) : subsection.title,
            type: 'subsection' as const,
            parentId: section.id,
            isDisabled: disabledSections?.has?.(section.id) || false,
            isActive: false, // Subsections don't have active state
            isRequired: false,
            isCustom: false,
            origin: 'template',
            icon: '📌',
            children: [],
            level: 2,
          })) || [];
          
          // Handle subsections with expand/collapse functionality
          let finalSubsectionChildren = subsectionChildren;
          const isSubsectionsExpanded = expandedSubsections[section.id] ?? false;
          
          if (subsectionChildren.length > 4) {
            // Show only first 4 unless expanded
            finalSubsectionChildren = isSubsectionsExpanded 
              ? subsectionChildren 
              : subsectionChildren.slice(0, 4);
            
            // Add "Show more" or "Show less" indicator as a special node
            const toggleNode = {
              id: `${section.id}-toggle`,
              name: isSubsectionsExpanded 
                ? `(${t('editor.ui.showLess' as any) || 'Show less'})` 
                : `+${subsectionChildren.length - 4} ${t('editor.ui.more' as any) || 'more'}`,
              type: 'toggle-subsections' as const,
              parentId: section.id,
              isDisabled: false,
              isActive: false,
              isRequired: false,
              isCustom: false,
              origin: 'template',
              icon: isSubsectionsExpanded ? '▴' : '▾',
              children: [],
              level: 2,
            };
            finalSubsectionChildren = [...finalSubsectionChildren, toggleNode];
          }
          
          const sectionNode: TreeNode = {
            id: section.id,
            name: getSectionTitle(section.id, section.title || section.name || 'Untitled Section', t),
            type: 'section',
            parentId: 'core-product',
            isDisabled: disabledSections?.has?.(section.id) || false,
            isActive: false, // Subsections don't have active state
            isRequired: section.required,
            isCustom: section.origin === 'custom',
            origin: section.origin || 'template',
            icon: section.id === 'metadata' ? '📕' : 
                  section.id === 'ancillary' ? '📑' : 
                  section.id === 'references' ? '📚' : 
                  section.id === 'tables_data' ? '📊' : 
                  section.id === 'figures_images' ? '🖼️' : 
                  section.id === 'appendices' ? '📎' : '🧾',
            children: finalSubsectionChildren,
            level: 1,
          };
          
          documentNode.children = [...(documentNode.children || []), sectionNode];
        });
      }
      
      treeNodes.push(documentNode);
    });
    
    return treeNodes;
  }, [sections, disabledSections, activeSectionId, documents, disabledDocuments, clickedDocumentId, selectedProductMeta, expandedDocumentId, t, expandedNodes, expandedSectionId, isEditingSection, expandedSubsections]);

  // Render tree node with proper indentation and tree characters
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = node.isExpanded ?? expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isHovered = hoveredNodeId === node.id;
    const isSelected = node.type === 'section' ? node.id === activeSectionId : node.id === clickedDocumentId;
    
    // Special styling identifiers
    const isProductDoc = node.id === 'core-product';
    const isSpecialSection = [
      'references',
      'appendices', 
      'metadata',
      'ancillary',
      'tables_data',
      'figures_images'
    ].includes(node.id);

    // Handle special button nodes
    if (node.isSpecial) {
      if (node.type === 'add-section') {
        return (
          <div key={node.id} className="my-1.5">
            <button
              type="button"
              onClick={safeSidebarActions.toggleAddSection}
              className={`relative w-full px-4 py-1 rounded transition-colors text-xs font-medium flex items-center justify-start gap-1.5 ${
                showAddSection 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
              style={{ 
                height: '36px',
                paddingLeft: '32px'
              }}
            >
              <span className="text-white mr-0.5">+</span>
              <span>📄</span>
              <span>{t('editor.desktop.program.addSection' as any) || 'Add Section'}</span>
            </button>
            {showAddSection && (
              <div className="px-3 py-0" style={{ paddingLeft: '12px' }}>
                <AddSectionForm
                  newSectionTitle={newSectionTitle}
                  setNewSectionTitle={setNewSectionTitle}
                  onAdd={() => {
                    if (newSectionTitle.trim()) {
                      safeSidebarActions.addCustomSection(newSectionTitle);
                      setNewSectionTitle('');
                    }
                  }}
                  onCancel={() => safeSidebarActions.toggleAddSection()}
                />
              </div>
            )}
          </div>
        );
      }
    }
    
    return (
      <div key={node.id}>
        <TreeNodeRenderer
          node={node}
          level={level}
          hasChildren={!!hasChildren}
          isHovered={isHovered}
          isSelected={isSelected}
          isProductDoc={isProductDoc}
          isSpecialSection={isSpecialSection}
          paddingLeft={12 + (level * 20)}
          onClick={() => {
            if (node.type === 'section' && !node.isDisabled) {
              safeSidebarActions.setActiveSectionId(node.id, 'sidebar');
            } else if (node.type === 'document' && !node.isDisabled) {
              safeDocumentsBarActions.setClickedDocumentId(node.id);
            } else if (node.type === 'toggle-subsections') {
              // Toggle subsections visibility
              setExpandedSubsections(prev => ({
                ...prev,
                [node.parentId!]: !(prev[node.parentId!] ?? false)
              }));
              return; // Don't toggle the node itself
            }
            
            if (hasChildren) {
              toggleNode(node.id);
            }
          }}
          onMouseEnter={() => setHoveredNodeId(node.id)}
          onMouseLeave={() => setHoveredNodeId(null)}
          renderCheckbox={(node: TreeNode) => {
            if (node.type === 'section' && safeSidebarActions.toggleSection) {
              return (
                <input
                  type="checkbox"
                  checked={!node.isDisabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    safeSidebarActions.toggleSection(node.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`w-4 h-4 rounded border-2 cursor-pointer ${
                    node.isDisabled
                      ? 'border-white/30 bg-white/10'
                      : node.isRequired
                      ? 'border-amber-500 bg-amber-600/30'
                      : 'border-blue-500 bg-blue-600/30'
                  } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
                />
              );
            }
            
            if (node.type === 'document' && safeDocumentsBarActions.toggleDocument && !isProductDoc) {
              return (
                <input
                  type="checkbox"
                  checked={!node.isDisabled}
                  onChange={(e) => {
                    e.stopPropagation();
                    safeDocumentsBarActions.toggleDocument(node.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`w-4 h-4 rounded border-2 cursor-pointer ${
                    node.isDisabled
                      ? 'border-white/30 bg-white/10'
                      : 'border-blue-500 bg-blue-600/30'
                  } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
                />
              );
            }
            
            return null;
          }}
        />
        
        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children!.map((child: TreeNode) => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with separator */}
      <div className="flex-shrink-0 mb-1 px-3 pt-0.5">
        <div className="flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.5)', paddingBottom: '0.5rem', paddingTop: '0.5rem' }}>
          <h2 className="text-xl font-semibold tracking-wide text-white text-center flex-1">
            {t('editor.desktop.sections.title' as any) || 'Sections & Documents'}
          </h2>
        </div>
      </div>
      
      {/* Tree content with proper scrolling */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2" style={{ scrollbarWidth: 'thin' }}>
        <div className="px-3">
          {/* Persistent Add Document Button - Original Style */}
          <div className="mb-2 mt-2">
            <button
              type="button"
              onClick={safeDocumentsBarActions.toggleAddDocument}
              className={`relative w-full px-4 py-2 rounded transition-colors text-sm font-medium flex items-center justify-start gap-2 ${
                showAddDocument 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <span className="text-white mr-1.5">+</span>
              <span>🧾</span>
              <span>{t('editor.desktop.documents.addButton' as any) || 'Add Document'}</span>
            </button>
            
            {showAddDocument && (
              <div className="w-full p-3 border border-blue-400 bg-blue-600/10 rounded-lg mt-2">
                <h4 className="text-sm font-bold text-white mb-2">
                  {t('editor.desktop.documents.custom.title' as any) || 'Add a custom document'}
                </h4>
                <input
                  type="text"
                  value={newDocumentName}
                  onChange={(e) => setNewDocumentName(e.target.value)}
                  placeholder={t('editor.desktop.documents.custom.titlePlaceholder' as any) || 'e.g. Market Research'}
                  className="w-full px-3 py-2 mb-2 bg-slate-900/50 border border-white/30 rounded text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-400"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (newDocumentName.trim()) {
                        // TODO: Implement add custom document
                        console.log('Add custom document:', newDocumentName.trim());
                        setNewDocumentName('');
                        safeDocumentsBarActions.toggleAddDocument();
                      }
                    }}
                    disabled={!newDocumentName.trim()}
                    className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/40 text-white text-sm font-semibold rounded transition-colors"
                  >
                    {t('editor.desktop.documents.custom.add' as any) || 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setNewDocumentName('');
                      safeDocumentsBarActions.toggleAddDocument();
                    }}
                    className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
                  >
                    {t('editor.desktop.documents.custom.cancel' as any) || 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Tree Nodes */}
          <div>
            {treeData.map(node => renderTreeNode(node, 0))}
          </div>
        </div>
      </div>
    </div>
  );
}