// Centralized design system configuration for consistent UI across all pages
// Enhanced with military theme and global border styles

export const designSystem = {
  // Spacing
  spacing: {
    page: 'p-3 md:p-4 lg:p-6 admin-content-wrapper',
    pageWrapper: 'admin-page-container',
    card: 'p-3',
    compact: 'p-2',
    none: 'p-0',
  },

  // Gaps
  gaps: {
    page: 'space-y-3',
    section: 'space-y-3',
    content: 'space-y-2',
    items: 'space-y-1',
    inline: 'gap-2',
  },

  // Border & Shadows - Enhanced with military theme
  card: {
    base: 'card-military rounded-lg',
    hover: 'hover:shadow-tactical-lg transition-all duration-300',
    glass: 'glass-tactical rounded-lg',
    gradient: 'border-gradient-military rounded-lg bg-white',
  },

  // Tables - Enhanced with tactical styling
  table: {
    container: 'table-tactical overflow-hidden',
    header: 'bg-gradient-military',
    headerCell:
      'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500',
    cell: 'px-3 py-2 text-sm text-gray-900',
    row: 'hover:bg-gray-50 transition-all duration-200',
  },

  // Typography
  text: {
    pageTitle: 'text-xl font-bold text-gray-900',
    pageSubtitle: 'text-sm text-gray-600',
    sectionTitle: 'text-base font-semibold text-gray-900',
    label: 'text-sm font-medium text-gray-700',
    body: 'text-sm text-gray-900',
    muted: 'text-sm text-gray-500',
    small: 'text-xs text-gray-500',
    gradient: 'gradient-text',
  },

  // Forms - Enhanced with tactical inputs
  form: {
    input: 'input-tactical w-full rounded-md px-3 py-2 text-sm',
    select: 'input-tactical rounded-md px-3 py-2 text-sm',
    label: 'block text-sm font-medium text-gray-700 mb-1',
    group: 'space-y-3',
  },

  // Status badges - Enhanced with tactical styling
  badge: {
    base: 'badge-tactical',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    neutral: 'badge-tactical bg-gray-100 text-gray-700 border-gray-200',
  },

  // Buttons - Enhanced with military styling
  button: {
    base: 'btn-military',
    group: 'flex items-center gap-2',
    iconButton:
      'rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all duration-200',
    primary: 'btn-military bg-gradient-military-dark text-white',
    secondary: 'btn-military border-tactical bg-white text-gray-700',
    danger: 'btn-military bg-gradient-accent text-white',
  },

  // Modals - Enhanced with glass morphism
  modal: {
    overlay: 'overlay-tactical',
    container: 'fixed inset-0 z-50 flex items-center justify-center p-4',
    content:
      'glass-tactical w-full max-w-md transform rounded-lg p-4 shadow-tactical-xl transition-all',
    header: 'text-lg font-semibold text-gray-900 mb-3',
  },

  // Empty states
  emptyState: {
    container: 'text-center py-8',
    icon: 'h-8 w-8 text-gray-300 mx-auto mb-2',
    text: 'text-sm text-gray-500',
  },

  // Loading states
  loading: {
    spinner:
      'h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent',
    container: 'flex justify-center py-8',
  },

  // Shadows - Tactical shadow system
  shadows: {
    sm: 'shadow-tactical-sm',
    md: 'shadow-tactical',
    lg: 'shadow-tactical-lg',
    xl: 'shadow-tactical-xl',
  },

  // Borders - Enhanced border styles
  borders: {
    default: 'border-tactical',
    gradient: 'border-gradient-military',
    input: 'input-tactical',
  },

  // Dividers
  dividers: {
    thin: 'divider-tactical',
    thick: 'divider-tactical-thick',
  },

  // Progress bars
  progress: {
    container: 'progress-tactical',
    bar: 'progress-tactical-bar',
  },

  // Container styles
  containers: {
    base: 'container-tactical',
    page: 'admin-page-container',
    content: 'admin-content-wrapper',
    glass: 'glass-tactical',
    card: 'card-military',
  },

  // Background gradients
  gradients: {
    military: 'bg-gradient-military',
    militaryDark: 'bg-gradient-military-dark',
    accent: 'bg-gradient-accent',
  },
};

// Helper function to combine classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Preset component combinations
export const componentStyles = {
  pageContainer: cn(designSystem.containers.page),
  contentWrapper: cn(designSystem.spacing.page),
  card: cn(designSystem.containers.card, designSystem.card.hover),
  table: cn(designSystem.table.container),
  button: {
    primary: cn(designSystem.button.base, designSystem.button.primary),
    secondary: cn(designSystem.button.base, designSystem.button.secondary),
    danger: cn(designSystem.button.base, designSystem.button.danger),
  },
  modal: {
    overlay: designSystem.modal.overlay,
    container: designSystem.modal.container,
    content: cn(designSystem.modal.content, designSystem.containers.glass),
  },
};
