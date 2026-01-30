export type TreeNode = {
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