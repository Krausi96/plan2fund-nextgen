import React, { useState } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import {
  useSidebarState,
  useDocumentsBarState,
  useEditorStore,
  getSectionTitle,
} from '@/features/editor/lib';

type TreeNode = {
  id: string;
  name: string;
  type: 'document' | 'section' | 'add-document' | 'add-section';
  parentId?: string;
  children?: TreeNode[];
  isDisabled?: boolean;
  isActive?: boolean;
  isRequired?: boolean;
  isCustom?: boolean;
  icon?: string;
  origin?: string;
  isExpanded?: boolean;
  level?: number;
  isSpecial?: boolean;
};



export default function TreeNavigator() {
  const { t } = useI18n();
  const sidebarState = useSidebarState();
  const documentsState = useDocumentsBarState();
  
  // Local state for forms
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newDocumentName, setNewDocumentName] = useState('');
  
  const { 
    sections = [], 
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
    showAdd: showAddDocument = false,
    isEditing: isEditingDocument = false
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
  const { expandedSectionId, expandedDocumentId } = useEditorStore((state) => ({
    expandedSectionId: state.expandedSectionId,
    expandedDocumentId: state.expandedDocumentId,
  }));
  
  // State for tree expansion/collapse
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set()); // Collapsed by default
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Debug logging
  React.useEffect(() => {
    // Removed debug logs for production
  }, [sidebarState, documentsState, sections, documents, selectedProductMeta, showAddDocument]);

  // Create hierarchical tree structure with documents as parents and sections as children
  const treeData = React.useMemo<TreeNode[]>(() => {
    const treeNodes: TreeNode[] = [];
    
    // Add document add button when explicitly adding a document
    // REMOVED: This was creating duplicate buttons - persistent button handles this now
    // if (showAddDocument) {
    //   treeNodes.push({
    //     id: 'add-document-button',
    //     name: t('editor.desktop.documents.addButton' as any) || 'Add Document',
    //     type: 'add-document',
    //     icon: '+',
    //     children: [],
    //     level: 0,
    //     isSpecial: true,
    //   });
    // }
    
    // Add core product document if selected
    if (selectedProductMeta && !expandedDocumentId) {
      const translatedLabel = t(selectedProductMeta.label as any) || selectedProductMeta.label || 'No selection';
      
      // Create document node
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
          icon: '🧾',
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
      
      // TODO: Add sections for this document if they exist
      // This would require document-specific sections which aren't implemented yet
      
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
    
    // Debug logging for treeData
    // Removed for production
    
    return treeNodes;
  }, [sections, disabledSections, activeSectionId, documents, disabledDocuments, clickedDocumentId, selectedProductMeta, expandedDocumentId, t, expandedNodes, expandedSectionId, isEditingSection]);

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

  // Render tree node with proper indentation and tree characters
  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = node.isExpanded ?? expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isHovered = hoveredNodeId === node.id;
    const isSelected = node.type === 'section' ? node.id === activeSectionId : node.id === clickedDocumentId;
    
    // Special styling for product documents
    const isProductDoc = node.id === 'core-product';
    
    // Special styling for special sections (References, Appendices, etc.)
    const isSpecialSection = [
      'references',
      'appendices', 
      'metadata',
      'ancillary'
    ].includes(node.id);
    
    // Handle special button nodes
    if (node.isSpecial) {
      // REMOVED: Add document button handling - now handled by persistent button
      // if (node.type === 'add-document') {
      //   return (
      //     <div key={node.id} className="px-3 py-1">
      //       <button
      //         type="button"
      //         onClick={safeDocumentsBarActions.toggleAddDocument}
      //         className={`w-full py-2 rounded transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
      //           showAddDocument 
      //             ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400' 
      //             : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
      //         }`}
      //       >
      //         <span>+</span>
      //         <span>{node.name}</span>
      //       </button>
      //       {showAddDocument && renderAddDocumentForm()}
      //     </div>
      //   );
      // }
      
      if (node.type === 'add-section') {
        return (
          <div key={node.id}>
            {/* Tree prefix with proper characters */}
            <div
              className="relative w-full px-3 py-1 transition-all flex items-center gap-2"
              style={{ 
                height: '36px',
                paddingLeft: `${12 + (level * 20)}px`
              }}
            >
              {/* Tree connector */}
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
                {renderAddSectionForm()}
              </div>
            )}
          </div>
        );
      }
    }
    
    // Tree characters
    const getTreePrefix = (nodeLevel: number, isLastChild: boolean, hasChildrenNodes: boolean) => {
      if (nodeLevel === 0) {
        return hasChildrenNodes ? '▾ ' : '▸ ';
      } else {
        return isLastChild ? '└─ ' : '├─ ';
      }
    };
    
    return (
      <div key={node.id}>
        {/* Node row */}
        <div
          className={`relative w-full px-3 py-2 transition-all flex items-center gap-2 cursor-pointer ${
            node.isDisabled
              ? 'opacity-50 text-white/50'
              : isSelected
              ? 'bg-blue-600/20 text-white'
              : isProductDoc
              ? 'bg-purple-600/20 text-white'
              : isSpecialSection
              ? 'bg-emerald-600/20 text-white'
              : node.isRequired
              ? 'bg-amber-600/20 text-white'
              : 'text-white hover:bg-white/10'
          }`}
          style={{ 
            height: '36px',
            paddingLeft: `${12 + (level * 20)}px`
          }}
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
        >
          {/* Tree prefix with proper characters */}
          <span className="text-white/70 mr-1" style={{ width: '16px', textAlign: 'center', fontFamily: 'monospace' }}>
            {getTreePrefix(level, false, !!hasChildren)}
          </span>
          
          {/* Icon */}
          {node.icon && (
            <span className="flex-shrink-0">{node.icon}</span>
          )}
          
          {/* Node name - already translated in tree data construction */}
          <span className={`flex-1 text-sm font-medium truncate ${node.isDisabled ? 'line-through' : ''}`}>
            {node.name}
          </span>
          
          {/* Controls */}
          <div 
            className="flex items-center gap-1 flex-shrink-0"
            style={{ opacity: (isHovered || isSelected) ? 1 : 0, transition: 'opacity 0.2s' }}
          >
            {/* Checkbox */}
            {node.type === 'section' && safeSidebarActions.toggleSection && (
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
            )}
            
            {node.type === 'document' && safeDocumentsBarActions.toggleDocument && !isProductDoc && (
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
                    : node.isRequired
                    ? 'border-amber-500 bg-amber-600/30'
                    : 'border-blue-500 bg-blue-600/30'
                } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
              />
            )}
            
            {/* Edit button */}
            {node.type === 'section' && safeSidebarActions.editSection && node.isCustom && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  safeSidebarActions.editSection(node as any);
                }}
                className="text-white/60 hover:text-white text-xs p-1 rounded hover:bg-white/20 transition-colors"
              >
                ✏️
              </button>
            )}
            
            {node.type === 'document' && safeDocumentsBarActions.editDocument && node.isCustom && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  safeDocumentsBarActions.editDocument(node as any);
                }}
                className="text-white/60 hover:text-white text-xs p-1 rounded hover:bg-white/20 transition-colors"
              >
                ✏️
              </button>
            )}
            
            {/* Remove button for custom items */}
            {node.isCustom && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (node.type === 'section') {
                    safeSidebarActions.removeCustomSection(node.id);
                  } else {
                    safeDocumentsBarActions.removeCustomDocument(node.id);
                  }
                }}
                className="text-red-400 hover:text-red-200 text-sm font-bold w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 transition-colors"
                title="Remove custom item"
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => (
              renderTreeNode(child, level + 1)
            ))}
          </div>
        )}
      </div>
    );
  };

  // Render add section form
  const renderAddSectionForm = () => {
    if (!showAddSection || expandedSectionId || isEditingSection) return null;
    
    return (
      <div className="w-full p-3 border border-blue-400 bg-blue-600/10 rounded-lg mb-2">
        <h4 className="text-sm font-bold text-white mb-2">
          {t('editor.desktop.sections.custom.title' as any) || 'Add a custom section'}
        </h4>
        <input
          type="text"
          value={newSectionTitle}
          onChange={(e) => setNewSectionTitle(e.target.value)}
          placeholder={t('editor.desktop.sections.custom.titlePlaceholder' as any) || 'e.g. Financial Plan'}
          className="w-full px-3 py-2 mb-2 bg-slate-900/50 border border-white/30 rounded text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-400"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (newSectionTitle.trim()) {
                safeSidebarActions.addCustomSection(newSectionTitle.trim());
                setNewSectionTitle('');
                safeSidebarActions.toggleAddSection();
              }
            }}
            disabled={!newSectionTitle.trim()}
            className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-white/10 disabled:text-white/40 text-white text-sm font-semibold rounded transition-colors"
          >
            {t('editor.desktop.sections.custom.add' as any) || 'Add'}
          </button>
          <button
            type="button"
            onClick={() => {
              setNewSectionTitle('');
              safeSidebarActions.toggleAddSection();
            }}
            className="flex-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded transition-colors"
          >
            {t('editor.desktop.sections.custom.cancel' as any) || 'Cancel'}
          </button>
        </div>
      </div>
    );
  };

  // Render add document form
  const renderAddDocumentForm = () => {
    if (!showAddDocument || expandedDocumentId || isEditingDocument) return null;
    
    return (
      <div className="w-full p-3 border border-blue-400 bg-blue-600/10 rounded-lg mb-2">
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
    );
  };





  return (
    <div className="flex flex-col h-full">
      {/* Header with separator */}
      <div className="flex-shrink-0 mb-1 px-3 pt-0.5">
        <div className="flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.5)', paddingBottom: '0.5rem',paddingTop:'0.5rem' }}>
          <h2 className="text-xl font-semibold tracking-wide text-white text-center flex-1">
            {t('editor.desktop.sections.title' as any) || 'Sections & Documents'}
          </h2>
        </div>
      </div>
      
      {/* Forms are rendered within tree nodes - no duplicate rendering needed */}
      
      {/* Debug info - Removed as requested */}
      
      {/* Tree nodes - Unified hierarchical tree */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2" style={{ scrollbarWidth: 'thin' }}>
        <div className="px-3">
          {/* Show empty state without Add Document button for new users */}
          {treeData.length === 0 && !selectedProductMeta && !showAddDocument ? (
            <div className="px-4 py-4 bg-white/5 border border-white/10 rounded-lg text-center flex flex-col items-center justify-center space-y-3">
              <div className="text-5xl flex justify-center">
                <span className="text-5xl">📄</span>
              </div>
              <div>
                <div className="text-white font-semibold text-base">
                  {t('editor.desktop.documents.noDocumentsYet' as any) || 'No Documents Yet'}
                </div>
              </div>
              <div className="text-white/60 text-sm max-w-xs">
                {t('editor.desktop.documents.emptyStateHint' as any) || 'Select a product first to begin creating your documents.'}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Persistent Add Document Button - Always visible when product selected, documents exist, or add mode is active */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={safeDocumentsBarActions.toggleAddDocument}
                  className={`w-full py-2 rounded transition-colors text-sm font-medium flex items-center justify-start pl-4 gap-2 ${
                    showAddDocument 
                      ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400' 
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                  style={{ height: '36px' }}
                >
                  <span className="flex-shrink-0 text-lg font-bold">+</span>
                  <span className="flex-shrink-0 text-lg">📄</span>
                  <span className="flex-1 text-left">{t('editor.desktop.documents.addButton' as any) || 'Add Document'}</span>
                </button>
                {showAddDocument && renderAddDocumentForm()}
              </div>
              
              {/* Document tree */}
              {treeData.map(node => renderTreeNode(node, 0))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}