import React from 'react';
import type { TreeNode } from '@/features/editor/lib/types/types';

interface TreeNodeRendererProps {
  node: TreeNode;
  level: number;
  hasChildren: boolean;
  isHovered: boolean;
  isSelected: boolean;
  isProductDoc: boolean;
  isSpecialSection: boolean;
  paddingLeft: number;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  renderCheckbox?: (node: TreeNode) => React.ReactNode;
}

export function TreeNodeRenderer({
  node,
  level,
  hasChildren,
  isHovered,
  isSelected,
  isProductDoc,
  isSpecialSection,
  paddingLeft,
  onClick,
  onMouseEnter,
  onMouseLeave,
  renderCheckbox
}: TreeNodeRendererProps) {
  // Get tree prefix characters
  const getTreePrefix = (nodeLevel: number, isLastChild: boolean, hasChildrenNodes: boolean) => {
    if (nodeLevel === 0) {
      return hasChildrenNodes ? '▾ ' : '▸ ';
    } else {
      return isLastChild ? '└─ ' : '├─ ';
    }
  };

  // Get background styling class
  const getBackgroundClass = () => {
    if (node.isDisabled) return 'opacity-50 text-white/50';
    if (isSelected) return 'bg-blue-600/20 text-white';
    if (isProductDoc) return 'bg-purple-600/20 text-white';
    if (isSpecialSection) return 'bg-emerald-600/20 text-white';
    if (node.isRequired) return 'bg-amber-600/20 text-white';
    return 'text-white hover:bg-white/10';
  };

  return (
    <div
      className={`relative w-full px-3 py-2 transition-all flex items-center gap-2 cursor-pointer ${getBackgroundClass()}`}
      style={{ 
        height: '36px',
        paddingLeft: `${paddingLeft}px`
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Tree prefix with proper characters */}
      <span className="text-white/70 mr-1" style={{ width: '16px', textAlign: 'center', fontFamily: 'monospace' }}>
        {getTreePrefix(level, false, !!hasChildren)}
      </span>
      
      {/* Icon */}
      {node.icon && (
        <span className="flex-shrink-0">{node.icon}</span>
      )}
      
      {/* Node name */}
      <span className={`flex-1 text-sm font-medium truncate ${node.isDisabled ? 'line-through' : ''}`}>
        {node.name}
      </span>
      
      {/* Controls */}
      <div 
        className="flex items-center gap-1 flex-shrink-0"
        style={{ opacity: (isHovered || isSelected) ? 1 : 0, transition: 'opacity 0.2s' }}
      >
        {renderCheckbox?.(node)}
      </div>
    </div>
  );
}