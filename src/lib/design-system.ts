// Centralized design system configuration for consistent UI across all pages
// Tuned for the archival/ink + parchment visual system

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

  // Border & Shadows - Archival theme
  card: {
    base: 'card-military rounded-lg',
    hover: 'hover:shadow-tactical-lg transition-all duration-300',
    glass: 'glass-tactical rounded-lg',
    gradient: 'border-gradient-military rounded-lg bg-parchment/80',
  },

  // Tables - Archival styling
  table: {
    container: 'table-tactical overflow-hidden',
    header: 'bg-gradient-military',
    headerCell:
      'px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-ink/50',
    cell: 'px-3 py-2 text-sm text-ink',
    row: 'hover:bg-ink/5 transition-all duration-200',
  },

  // Typography
  text: {
    pageTitle: 'text-xl font-bold text-ink',
    pageSubtitle: 'text-sm text-ink/60',
    sectionTitle: 'text-base font-semibold text-ink',
    label: 'text-sm font-medium text-ink/70',
    body: 'text-sm text-ink',
    muted: 'text-sm text-ink/50',
    small: 'text-xs text-ink/50',
    gradient: 'gradient-text',
  },

  // Forms - Archival inputs
  form: {
    input: 'input-tactical w-full rounded-md px-3 py-2 text-sm',
    select: 'input-tactical rounded-md px-3 py-2 text-sm',
    label: 'block text-sm font-medium text-ink/70 mb-1',
    group: 'space-y-3',
  },

  // Status badges - Archival styling
  badge: {
    base: 'badge-tactical',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
    neutral: 'badge-tactical bg-ink/5 text-ink/70 border-ink/10',
  },

  // Buttons - Archival styling
  button: {
    base: 'relative inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-copper/40 focus:ring-offset-1',
    group: 'flex items-center gap-2',
    iconButton:
      'rounded-lg p-2 text-ink/70 bg-parchment/80 border border-ink/15 hover:bg-parchment hover:border-ink/25 hover:text-ink hover:shadow-md transition-all duration-200',
    primary:
      'bg-ink text-parchment hover:bg-ink/90 border border-ink/80 shadow-lg hover:shadow-xl px-4 py-2 text-sm font-medium',
    secondary:
      'bg-parchment/80 text-ink border border-ink/20 hover:bg-parchment hover:border-ink/30 shadow-sm hover:shadow-md px-4 py-2 text-sm font-medium',
    danger:
      'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 border-2 border-red-700/50 shadow-lg hover:shadow-xl px-4 py-2 text-sm font-medium',
  },

  // Modals - Enhanced with glass morphism
  modal: {
    overlay: 'overlay-tactical',
    container: 'fixed inset-0 z-50 flex items-center justify-center p-4',
    content:
      'glass-tactical w-full max-w-md transform rounded-lg p-4 shadow-tactical-xl transition-all',
    header: 'text-lg font-semibold text-ink mb-3',
  },

  // Empty states
  emptyState: {
    container: 'text-center py-8',
    icon: 'h-8 w-8 text-ink/30 mx-auto mb-2',
    text: 'text-sm text-ink/50',
  },

  // Loading states
  loading: {
    spinner:
      'h-6 w-6 animate-spin rounded-full border-2 border-ink/60 border-t-transparent',
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
  // Background gradients
  gradients: {
    military: 'bg-gradient-military',
    militaryDark: 'bg-gradient-military-dark',
    accent: 'bg-gradient-accent',
  },
} as const;

export type DesignSystem = typeof designSystem;

// Helper function to combine classes
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Preset component combinations
export const componentStyles = {
  pageContainer: cn(designSystem.spacing.pageWrapper),
  contentWrapper: cn(designSystem.spacing.page),
  card: cn(designSystem.card.base, designSystem.card.hover),
  table: cn(designSystem.table.container),
  button: {
    primary: cn(designSystem.button.base, designSystem.button.primary),
    secondary: cn(designSystem.button.base, designSystem.button.secondary),
    danger: cn(designSystem.button.base, designSystem.button.danger),
  },
  modal: {
    overlay: designSystem.modal.overlay,
    container: designSystem.modal.container,
    content: cn(designSystem.modal.content),
  },
};
