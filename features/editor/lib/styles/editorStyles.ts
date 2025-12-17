/**
 * ============================================================================
 * EDITOR UI STYLES
 * ============================================================================
 * 
 * Tailwind class strings and inline styles for UI components.
 * 
 * USED BY:
 *   - Sidebar.tsx
 *   - DocumentsBar.tsx
 *   - Editor.tsx
 *   - SectionCard.tsx
 *   - DocumentCard.tsx
 * ============================================================================
 */

/**
 * Section styles for different display modes
 */
export const SECTION_STYLES = {
  collapsed: {
    container: 'space-y-1',
    button: {
      disabled: 'opacity-50 cursor-not-allowed',
      active: 'bg-blue-600/40 border-blue-400',
      default: 'bg-white/5 border-white/10 hover:bg-white/10',
    },
  },
  cardContainer: 'space-y-2 flex flex-col items-center',
  card: {
    container: 'space-y-2',
    base: 'relative border rounded-lg p-2.5 transition-all overflow-hidden w-full max-w-[280px] group',
    item: {
      disabled: 'opacity-50 border-white/10',
      active: 'border-blue-400 bg-blue-600/20',
      required: 'border-amber-400 bg-amber-600/20',
      default: 'border-white/20 bg-white/5 hover:bg-white/10',
    },
    actions: 'absolute top-1 right-1 z-10 flex flex-col items-end gap-0.5',
    actionsRow: 'flex items-center gap-1',
    editButton: 'text-white/60 hover:text-white text-xs transition-opacity',
    checkbox: {
      base: 'w-3.5 h-3.5 rounded border-2 cursor-pointer text-blue-600 focus:ring-1 focus:ring-blue-500/50',
      disabled: 'border-white/30 bg-white/10',
      required: 'border-amber-500 bg-amber-600/30 opacity-90',
      default: 'border-blue-500 bg-blue-600/30',
    },
    content: 'flex flex-col items-center gap-1 pt-4 min-h-[50px] w-full',
    icon: 'text-2xl leading-none flex-shrink-0',
    titleContainer: 'w-full text-center min-h-[28px] flex items-center justify-center gap-1',
    title: 'text-[11px] font-semibold leading-snug text-white break-words line-clamp-2',
    titleDisabled: 'text-[11px] font-semibold leading-snug text-white/50 line-through break-words line-clamp-2',
    removeButton: 'text-red-300 hover:text-red-200 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100 pointer-events-auto',
    originBadge: 'inline-block select-none',
  },
  originTooltip: {
    container: 'relative group -translate-x-0.5',
    indicator: 'w-2 h-2 rounded-full bg-yellow-400/70 cursor-help',
    tooltip: 'absolute right-0 top-full mt-1 w-48 px-2 py-1.5 bg-blue-900/95 border border-blue-700/30 rounded-lg text-[9px] text-white/90 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50 whitespace-normal shadow-lg',
  },
  list: {
    container: 'space-y-2',
    item: {
      base: 'w-full rounded-lg border-2 px-3 py-2 transition-all',
      disabled: 'opacity-50 border-white/10',
      active: 'border-blue-400 bg-blue-600/20',
      required: 'border-amber-400 bg-amber-600/20',
      default: 'border-white/20 bg-white/5 hover:bg-white/10',
    },
  },
  emptyStateCard: 'px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-center max-w-[150px]',
  emptyStateCardCollapsed: 'px-2 py-3 bg-white/5 border border-white/10 rounded-lg text-center max-w-[150px]',
};

/**
 * Inline styles for common use cases
 */
export const INLINE_STYLES = {
  fullWidth: { width: '100%' },
  paddingBottom: { paddingBottom: '1rem' },
  paddingBottomLarge: { paddingBottom: '2rem' },
  overflowHidden: { overflow: 'hidden' },
  headerBorder: { borderBottom: '1px solid rgba(255, 255, 255, 0.1)' },
};

/**
 * Sidebar component styles
 */
export const SIDEBAR_STYLES = {
  container: (collapsed: boolean) => collapsed ? 'w-16' : 'w-80',
  sidebarStyle: (collapsed: boolean) => ({
    width: collapsed ? '64px' : '320px',
    minWidth: collapsed ? '64px' : '320px',
    maxWidth: collapsed ? '64px' : '320px',
  }),
  contentStyle: () => ({}),
  header: 'text-lg font-bold uppercase tracking-wide text-white mb-2 pb-2',
  legend: 'text-xs text-white/50 mb-2 flex items-center gap-2',
  newUserMessage: 'text-white/60 text-center py-4 text-sm',
  addButton: {
    active: 'w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2',
    inactive: 'w-full px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2',
  },
};

/**
 * Documents bar component styles
 */
export const DOCUMENTS_BAR_STYLES = {
  editFormContainer: 'border border-white/20 bg-white/10 rounded-lg p-4 mb-3',
  editFormInner: 'space-y-2',
  header: 'mb-2',
  headerTitle: 'text-lg font-bold uppercase tracking-wide text-white',
  scrollContainer: {
    className: 'flex gap-2 overflow-x-auto pb-2',
    style: { scrollbarWidth: 'thin' as const },
  },
  emptyStateCard: 'px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-center max-w-[150px] flex-shrink-0',
  emptyStateIcon: 'text-4xl mb-2 flex justify-center',
  emptyStateText: 'text-white/60 text-sm',
  addButton: {
    active: 'px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center justify-center gap-2 min-w-[120px]',
    inactive: 'px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2 min-w-[120px]',
  },
  documentCard: {
    base: 'relative border rounded-lg p-3 max-w-[150px] transition-all group',
    selected: 'border-blue-400 bg-blue-600/20',
    unselected: 'opacity-50 border-white/10',
    disabled: 'opacity-30 border-white/5 cursor-not-allowed',
    required: 'border-amber-400 bg-amber-600/20',
    default: 'border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer',
    actions: 'absolute top-1 right-1 z-10 flex items-center gap-1',
    editButton: 'text-white/60 hover:text-white text-xs transition-opacity',
    checkbox: {
      base: 'w-3.5 h-3.5 rounded border-2 cursor-pointer text-blue-600 focus:ring-1 focus:ring-blue-500/50',
      disabled: 'border-white/30 bg-white/10',
      required: 'border-amber-500 bg-amber-600/30 opacity-90',
      default: 'border-blue-500 bg-blue-600/30',
    },
    content: 'flex flex-col items-center gap-2 pt-4 min-h-[60px]',
    contentInner: 'w-full text-center',
    icon: 'text-2xl leading-none flex-shrink-0',
    iconLarge: 'text-3xl leading-none flex-shrink-0',
    title: 'text-xs font-semibold leading-snug text-white break-words line-clamp-2',
    titleDisabled: 'text-xs font-semibold leading-snug text-white/50 line-through break-words line-clamp-2',
    description: 'text-[10px] text-white/60 mt-1 line-clamp-2',
    originBadgeContainer: 'mt-1',
    removeButton: 'text-red-300 hover:text-red-200 text-xs font-bold px-1.5 py-0.5 rounded hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100',
  },
  coreProductCard: {
    base: 'relative border rounded-lg p-3 max-w-[150px] transition-all cursor-pointer',
    selected: 'border-blue-400 bg-blue-600/20',
    unselected: 'opacity-50 border-white/10',
    default: 'border-white/20 bg-white/5 hover:bg-white/10',
  },
  container: (showAddDocument: boolean) => ({
    minHeight: showAddDocument ? '200px' : 'auto',
  }),
};

/**
 * Editor component styles
 */
export const EDITOR_STYLES = {
  welcome: 'flex items-center justify-center h-full w-full',
  welcomeContent: 'text-center',
  welcomeIcon: 'text-6xl mb-4',
  welcomeTitle: 'text-xl font-semibold text-gray-800 mb-2',
  welcomeText: 'text-gray-600',
  container: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50',
  editorInner: 'bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col',
  header: 'flex items-center justify-between p-4 border-b',
  sectionTitle: 'text-xl font-semibold text-gray-900',
  closeButton: 'text-gray-500 hover:text-gray-700 text-2xl leading-none',
  content: 'flex-1 overflow-y-auto p-4',
  sectionContent: 'prose max-w-none',
  sectionId: 'text-sm text-gray-500 mt-4',
};

