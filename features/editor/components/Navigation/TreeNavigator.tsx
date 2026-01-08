import React, { useState, useMemo } from 'react';
import { useI18n } from '@/shared/contexts/I18nContext';
import {
  useSidebarState,
  useDocumentsBarState,
} from '@/features/editor/lib';
import type { SectionTemplate, DocumentTemplate } from '@/features/editor/lib/types/types';

// Tree node types
type TreeNode = {
  id: string;
  type: 'document' | 'section' | 'root';
  title: string;
  icon?: string;
  isDisabled: boolean;
  isRequired?: boolean;
  isCustom?: boolean;
  origin?: 'template' | 'custom';
  children?: TreeNode[];
  level: number;
  parentId?: string;
};

type TreeNavigatorProps = {
  collapsed?: boolean;
};

export default function TreeNavigator({ collapsed = false }: TreeNavigatorProps) {
  const { t } = useI18n();
  
  // Get both documents and sections state
  const {
    documents,
    disabledDocuments,
    actions: documentActions,
    selectedProductMeta,
    showAddDocument,
    expandedDocumentId,
    clickedDocumentId,
  } = useDocumentsBarState();
  
  const {
    sections,
    disabledSections,
    actions: sectionActions,
    isEditing,
    editingSection,
    showAddSection,
    activeSectionId,
  } = useSidebarState();
  
  // Local state for expanded nodes
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Create hierarchical tree structure
  const treeData = useMemo<TreeNode[]>(() => {
    // Create root node for the main document
    const rootNode: TreeNode = {
      id: 'business-plan-root',
      type: 'root',
      title: selectedProductMeta 
        ? (t(selectedProductMeta.label as any) || selectedProductMeta.label || 'Business Plan')
        : 'Business Plan',
      icon: selectedProductMeta?.icon || '📄',
      isDisabled: false,
      level: 0,
    };
    
    // Convert documents to tree nodes
    const documentNodes: TreeNode[] = documents.map((doc: DocumentTemplate) => ({
      id: doc.id,
      type: 'document',
      title: doc.name,
      icon: '📄',
      isDisabled: disabledDocuments.has(doc.id),
      isRequired: doc.required ?? false,
      isCustom: doc.origin === 'custom',
      origin: doc.origin,
      level: 1,
      parentId: 'business-plan-root',
    }));
    
    // Convert sections to tree nodes
    const sectionNodes: TreeNode[] = sections.map((section: SectionTemplate) => ({
      id: section.id,
      type: 'section',
      title: section.title,
      icon: '📋',
      isDisabled: disabledSections.has(section.id),
      isRequired: section.required ?? false,
      isCustom: section.origin === 'custom',
      origin: section.origin,
      level: 1,
      parentId: 'business-plan-root',
    }));
    
    // Combine all children under root
    rootNode.children = [...documentNodes, ...sectionNodes];
    
    return [rootNode];
  }, [
    documents,
    sections,
    disabledDocuments,
    disabledSections,
    selectedProductMeta,
    t
  ]);
  
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
  
  // Handle node selection
  const selectNode = (node: TreeNode) => {
    if (node.isDisabled) return;
    
    if (node.type === 'document') {
      documentActions.setClickedDocumentId(node.id);
    } else if (node.type === 'section') {
      sectionActions.setActiveSectionId(node.id, 'sidebar');
    }
  };
  
  // Render tree node recursively
  const renderTreeNode = (node: TreeNode) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = 
      (node.type === 'document' && clickedDocumentId === node.id) ||
      (node.type === 'section' && activeSectionId === node.id);
    
    // Calculate padding based on level (36-40px height)
    const paddingLeft = node.level * 16 + 8; // 16px per level + base padding
    const rowHeight = node.level === 0 ? '40px' : '36px'; // Root slightly taller
    
    return (
      <div key={node.id}>
        {/* Node row */}
        <div
          className={`relative flex items-center w-full rounded-lg transition-all cursor-pointer group ${
            node.isDisabled
              ? 'opacity-50'
              : isSelected
              ? 'border-blue-400 bg-blue-600/20'
              : node.isRequired
              ? 'border-amber-400 bg-amber-600/20'
              : 'border-white/20 bg-white/5 hover:bg-white/10'
          }`}
          style={{
            height: rowHeight,
            paddingLeft: `${paddingLeft}px`,
            paddingRight: '8px',
            borderWidth: '1px',
            marginBottom: '2px'
          }}
          onClick={() => selectNode(node)}
          onMouseEnter={() => {}}
          onMouseLeave={() => {}}
        >
          {/* Expand/Collapse indicator for nodes with children */}
          {node.children && node.children.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="mr-2 text-white/60 hover:text-white transition-colors flex-shrink-0"
              style={{ width: '16px', height: '16px' }}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          
          {/* Icon */}
          {node.icon && (
            <span className="mr-2 flex-shrink-0 text-sm leading-none">
              {node.icon}
            </span>
          )}
          
          {/* Title */}
          <span 
            className={`flex-1 text-sm font-medium truncate ${
              node.isDisabled ? 'text-white/50 line-through' : 'text-white'
            }`}
          >
            {node.title}
          </span>
          
          {/* Action buttons - show on hover or selection */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Toggle checkbox */}
            {node.type === 'document' && (
              <input
                type="checkbox"
                checked={!node.isDisabled}
                onChange={(e) => {
                  e.stopPropagation();
                  documentActions.toggleDocument(node.id);
                }}
                className={`w-3.5 h-3.5 rounded border-2 cursor-pointer ${
                  node.isDisabled
                    ? 'border-white/30 bg-white/10'
                    : node.isRequired
                    ? 'border-amber-500 bg-amber-600/30 opacity-90'
                    : 'border-blue-500 bg-blue-600/30'
                } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
              />
            )}
            
            {node.type === 'section' && (
              <input
                type="checkbox"
                checked={!node.isDisabled}
                onChange={(e) => {
                  e.stopPropagation();
                  sectionActions.toggleSection(node.id);
                }}
                className={`w-3.5 h-3.5 rounded border-2 cursor-pointer ${
                  node.isDisabled
                    ? 'border-white/30 bg-white/10'
                    : node.isRequired
                    ? 'border-amber-500 bg-amber-600/30 opacity-90'
                    : 'border-blue-500 bg-blue-600/30'
                } text-blue-600 focus:ring-1 focus:ring-blue-500/50`}
              />
            )}
            
            {/* Edit button */}
            {node.isCustom && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (node.type === 'document' && documentActions.editDocument) {
                    documentActions.editDocument(documents.find(d => d.id === node.id)!);
                  } else if (node.type === 'section' && sectionActions.editSection) {
                    sectionActions.editSection(sections.find(s => s.id === node.id)!);
                  }
                }}
                className="text-white/60 hover:text-white text-xs transition-opacity"
              >
                ✏️
              </button>
            )}
            
            {/* Remove button for custom items */}
            {node.isCustom && node.type === 'document' && documentActions.removeCustomDocument && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  documentActions.removeCustomDocument(node.id);
                }}
                className="text-red-400 hover:text-red-200 text-base font-bold w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 transition-colors"
              >
                ×
              </button>
            )}
            
            {node.isCustom && node.type === 'section' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sectionActions.removeCustomSection(node.id);
                }}
                className="text-red-400 hover:text-red-200 text-base font-bold w-5 h-5 flex items-center justify-center rounded hover:bg-red-500/20 transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>
        
        {/* Children */}
        {isExpanded && node.children && node.children.length > 0 && (
          <div className="ml-4">
            {node.children.map((child) => renderTreeNode(child))}
          </div>
        )}
      </div>
    );
  };
  
  // Handle add buttons
  const renderAddButtons = () => {
    if (collapsed) return null;
    
    return (
      <div className="flex gap-2 mb-3 px-2">
        {/* Add Document Button */}
        {!expandedDocumentId && (
          <button
            type="button"
            onClick={documentActions.toggleAddDocument}
            className={`flex-1 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 p-2 ${
              showAddDocument 
                ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400' 
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
            style={{ height: '40px' }}
          >
            <span className="text-lg leading-none">＋</span>
            <span className="text-[10px] font-semibold">Add Doc</span>
          </button>
        )}
        
        {/* Add Section Button */}
        {!showAddDocument && !expandedDocumentId && (
          <button
            type="button"
            onClick={sectionActions.toggleAddSection}
            className={`flex-1 rounded-lg transition-colors flex flex-col items-center justify-center gap-1 p-2 ${
              showAddSection 
                ? 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400' 
                : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
            }`}
            style={{ height: '40px' }}
          >
            <span className="text-lg leading-none">＋</span>
            <span className="text-[10px] font-semibold">Add Sec</span>
          </button>
        )}
      </div>
    );
  };
  
  // Render add forms
  const renderAddForms = () => {
    // Document add form
    if (showAddDocument && !collapsed) {
      return (
        <div className="p-3 border border-blue-400 bg-blue-600/10 rounded-lg mb-2 mx-2">
          <input
            type="text"
            placeholder={t('editor.desktop.documents.custom.titlePlaceholder' as any) || 'Document name'}
            className="w-full px-2 py-1 mb-2 bg-slate-900/50 border border-white/30 rounded text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-400"
            autoFocus
          />
          <div className="flex gap-1">
            <button className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded">
              Add
            </button>
            <button 
              onClick={documentActions.toggleAddDocument}
              className="flex-1 px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }
    
    // Section add form
    if (showAddSection && !collapsed) {
      return (
        <div className="p-3 border border-blue-400 bg-blue-600/10 rounded-lg mb-2 mx-2">
          <input
            type="text"
            placeholder={t('editor.desktop.sections.custom.titlePlaceholder' as any) || 'Section title'}
            className="w-full px-2 py-1 mb-2 bg-slate-900/50 border border-white/30 rounded text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-blue-400"
            autoFocus
          />
          <div className="flex gap-1">
            <button className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded">
              Add
            </button>
            <button 
              onClick={sectionActions.toggleAddSection}
              className="flex-1 px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // Render edit forms
  const renderEditForms = () => {
    if (isEditing && editingSection) {
      return (
        <div className="p-3 border border-blue-400 bg-blue-600/10 rounded-lg mb-2 mx-2">
          <h4 className="text-sm font-bold text-white mb-2">Edit Section</h4>
          <input
            type="text"
            value={editingSection.title || ''}
            className="w-full px-2 py-1 mb-2 bg-slate-900/50 border border-white/30 rounded text-white text-sm"
          />
          <div className="flex gap-1">
            <button className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded">
              Save
            </button>
            <button 
              onClick={sectionActions.cancelEdit}
              className="flex-1 px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Add buttons */}
      {renderAddButtons()}
      
      {/* Add forms */}
      {renderAddForms()}
      
      {/* Edit forms */}
      {renderEditForms()}
      
      {/* Tree content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pr-2" style={{ scrollbarWidth: 'thin' }}>
        <div className="space-y-1">
          {treeData.map((node) => renderTreeNode(node))}
        </div>
      </div>
    </div>
  );
}