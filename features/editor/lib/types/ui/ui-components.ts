/**
 * Dropdown position for portal-based dropdowns
 * Used by: ProductSelection, ProgramSelection, useDropdownPosition hook
 */
export type DropdownPosition = {
  top: number;
  left: number;
  width: number;
};

/**
 * Options for dropdown positioning
 * Used by: useDropdownPosition hook
 */
export type DropdownPositionOptions = {
  offset?: number;
  maxWidth?: number;
  minWidth?: number;
  position?: 'below' | 'above';
};

/**
 * Edit handlers interface
 * Used by: Editor, Sidebar, DocumentsBar, useEditHandlers hook
 */
export interface EditHandlers<T> {
  onEdit: (item: T) => void;
  onSave: (item: T) => void;
  onCancel: () => void;
}

/**
 * Toggle handlers interface
 * Used by: Editor, useToggleHandlers hook
 */
export interface ToggleHandlers {
  toggle: (id: string) => void;
  isDisabled: (id: string) => boolean;
  enabledCount: number;
  totalCount: number;
}

/**
 * ConnectCopy - Interface for program connection copy text
 */
export interface ConnectCopy {
  openFinder?: string;
  pasteLink?: string;
  inputLabel?: string;
  placeholder?: string;
  submit?: string;
  example?: string;
  error?: string;
}