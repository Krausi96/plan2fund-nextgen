import React, { useState } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import {
  useSidebarState,
  useDocumentsBarState,
  useEditorStore,
  getSectionTitle,
} from '@/features/editor/lib';
import { AddSectionForm, TreeNodeRenderer, type TreeNode } from './';

export default function TreeNavigator() {
  const { t } = useI18n();
  const sidebarState = useSidebarState();
  const documentsState = useDocumentsBarState();
  
  // Local state for forms
  const [newSectionTitle, setNewSectionTitle] = useState('');
  
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
    selectedProductMeta = null
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
  
  // Get sections from document structure
  const sections = documentStructure?.sections || [];
  
  // State for tree expansion/collapse
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

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
        documentNode.children = sections.map((section: any) => ({
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
          children: [],
          level: 1,
        }));
      }
      
      // Add section add button as last child if document is expanded
      if (documentNode.isExpanded && !expandedSectionId && !isEditingSection) {
        documentNode.children = [
          ...(documentNode.children || []),
          {
            id: 'add-section-button-core',
            name: t('editor.desktop.sections.addButton' as any) || 'Add Section',
            type: 'add-section',
            icon: '+',
            parentId: 'core-product',
            children: [],
            level: 1,
            isSpecial: true,
          }
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
      
      // Add section add button as last child if document is expanded
      if (documentNode.isExpanded && !expandedSectionId && !isEditingSection) {
        documentNode.children = [
          ...(documentNode.children || []),
          {
            id: `add-section-button-${doc.id}`,
            name: t('editor.desktop.sections.addButton' as any) || 'Add Section',
            type: 'add-section',
            icon: '+',
            parentId: doc.id,
            children: [],
            level: 1,
            isSpecial: true,
          }
        ];
      }
      
      treeNodes.push(documentNode);
    });
    
    return treeNodes;
  }, [sections, disabledSections, activeSectionId, documents, disabledDocuments, clickedDocumentId, selectedProductMeta, expandedDocumentId, t, expandedNodes, expandedSectionId, isEditingSection]);

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
          <div key={node.id}>
            <div
              className="relative w-full px-3 py-1 transition-all flex items-center gap-2"
              style={{ 
                height: '36px',
                paddingLeft: `${12 + (level * 20)}px`
              }}
            >
              <span className="text-white/70 mr-1" style={{ width: '16px', textAlign: 'center', fontFamily: 'monospace' }}>
                └─
              </span>
              
              <button
                type="button"
                onClick={safeSidebarActions.toggleAddSection}
                className={`flex-1 py-1.5 rounded transition-colors text-xs font-medium flex items-center justify-center gap-1 ${
                  showAddSection 
                    ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400' 
                    : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                }`}
              >
                <span>+</span>
                <span>{node.name}</span>
              </button>
            </div>
            {showAddSection && (
              <div className="px-3 py-1" style={{ paddingLeft: `${12 + ((level + 1) * 20)}px` }}>
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
            }
            
            if (hasChildren) {
              toggleNode(node.id);
            }
          }}
          onMouseEnter={() => setHoveredNodeId(node.id)}
          onMouseLeave={() => setHoveredNodeId(null)}
          renderCheckbox={(node) => {
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
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-y-auto">
      {treeData.map(node => renderTreeNode(node, 0))}
    </div>
  );
}