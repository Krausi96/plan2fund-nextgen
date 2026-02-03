/**
 * TreeNode - Represents nodes in the tree navigation structure
 * Used by: TreeNavigator, TreeNodeRenderer
 */
export type TreeNode = {
  id: string;
  name: string;
  type: 'document' | 'section' | 'subsection' | 'add-document' | 'add-section' | 'show-more' | 'toggle-subsections';
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