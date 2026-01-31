import { designSystem, cn, componentStyles } from '@/lib/design-system';

describe('Design System', () => {
  describe('designSystem configuration', () => {
    it('should define spacing values', () => {
      expect(designSystem.spacing).toBeDefined();
      expect(designSystem.spacing.page).toBe(
        'p-3 md:p-4 lg:p-6 admin-content-wrapper'
      );
      expect(designSystem.spacing.pageWrapper).toBe('admin-page-container');
      expect(designSystem.spacing.card).toBe('p-3');
      expect(designSystem.spacing.compact).toBe('p-2');
      expect(designSystem.spacing.none).toBe('p-0');
    });

    it('should define gap values', () => {
      expect(designSystem.gaps).toBeDefined();
      expect(designSystem.gaps.page).toBe('space-y-3');
      expect(designSystem.gaps.section).toBe('space-y-3');
      expect(designSystem.gaps.content).toBe('space-y-2');
      expect(designSystem.gaps.items).toBe('space-y-1');
      expect(designSystem.gaps.inline).toBe('gap-2');
    });

    it('should define archival card styles', () => {
      expect(designSystem.card).toBeDefined();
      expect(designSystem.card.base).toBe('card-military rounded-lg');
      expect(designSystem.card.hover).toBe(
        'hover:shadow-tactical-lg transition-all duration-300'
      );
      expect(designSystem.card.glass).toBe('glass-tactical rounded-lg');
      expect(designSystem.card.gradient).toBe(
        'border-gradient-military rounded-lg bg-parchment/80'
      );
    });

    it('should define archival table styles', () => {
      expect(designSystem.table).toBeDefined();
      expect(designSystem.table.container).toBe(
        'table-tactical overflow-hidden'
      );
      expect(designSystem.table.header).toBe('bg-gradient-military');
      expect(designSystem.table.headerCell).toContain('text-ink/50');
      expect(designSystem.table.cell).toContain('text-ink');
      expect(designSystem.table.row).toContain('hover:bg-ink/5');
    });

    it('should define typography with ink color system', () => {
      expect(designSystem.text).toBeDefined();
      expect(designSystem.text.pageTitle).toBe('text-xl font-bold text-ink');
      expect(designSystem.text.pageSubtitle).toBe('text-sm text-ink/60');
      expect(designSystem.text.sectionTitle).toBe(
        'text-base font-semibold text-ink'
      );
      expect(designSystem.text.label).toBe('text-sm font-medium text-ink/70');
      expect(designSystem.text.body).toBe('text-sm text-ink');
      expect(designSystem.text.muted).toBe('text-sm text-ink/50');
      expect(designSystem.text.small).toBe('text-xs text-ink/50');
      expect(designSystem.text.gradient).toBe('gradient-text');
    });

    it('should define form styles with archival inputs', () => {
      expect(designSystem.form).toBeDefined();
      expect(designSystem.form.input).toBe(
        'input-tactical w-full rounded-md px-3 py-2 text-sm'
      );
      expect(designSystem.form.select).toBe(
        'input-tactical rounded-md px-3 py-2 text-sm'
      );
      expect(designSystem.form.label).toBe(
        'block text-sm font-medium text-ink/70 mb-1'
      );
      expect(designSystem.form.group).toBe('space-y-3');
    });

    it('should define badge styles', () => {
      expect(designSystem.badge).toBeDefined();
      expect(designSystem.badge.base).toBe('badge-tactical');
      expect(designSystem.badge.success).toBe('badge-success');
      expect(designSystem.badge.warning).toBe('badge-warning');
      expect(designSystem.badge.error).toBe('badge-error');
      expect(designSystem.badge.info).toBe('badge-info');
      expect(designSystem.badge.neutral).toBe(
        'badge-tactical bg-ink/5 text-ink/70 border-ink/10'
      );
    });

    it('should define button styles with copper focus ring', () => {
      expect(designSystem.button).toBeDefined();
      expect(designSystem.button.base).toContain('focus:ring-copper/40');
      expect(designSystem.button.group).toBe('flex items-center gap-2');
      expect(designSystem.button.iconButton).toContain('text-ink/70');
      expect(designSystem.button.iconButton).toContain('bg-parchment/80');
      expect(designSystem.button.primary).toContain('bg-ink');
      expect(designSystem.button.primary).toContain('text-parchment');
      expect(designSystem.button.secondary).toContain('bg-parchment/80');
      expect(designSystem.button.secondary).toContain('text-ink');
      expect(designSystem.button.danger).toContain('from-red-600');
    });

    it('should define modal styles with glass morphism', () => {
      expect(designSystem.modal).toBeDefined();
      expect(designSystem.modal.overlay).toBe('overlay-tactical');
      expect(designSystem.modal.container).toContain('z-50');
      expect(designSystem.modal.content).toContain('glass-tactical');
      expect(designSystem.modal.header).toContain('text-ink');
    });

    it('should define empty state styles', () => {
      expect(designSystem.emptyState).toBeDefined();
      expect(designSystem.emptyState.container).toBe('text-center py-8');
      expect(designSystem.emptyState.icon).toBe(
        'h-8 w-8 text-ink/30 mx-auto mb-2'
      );
      expect(designSystem.emptyState.text).toBe('text-sm text-ink/50');
    });

    it('should define loading states with ink color', () => {
      expect(designSystem.loading).toBeDefined();
      expect(designSystem.loading.spinner).toContain('border-ink/60');
      expect(designSystem.loading.container).toBe('flex justify-center py-8');
    });

    it('should define tactical shadows', () => {
      expect(designSystem.shadows).toBeDefined();
      expect(designSystem.shadows.sm).toBe('shadow-tactical-sm');
      expect(designSystem.shadows.md).toBe('shadow-tactical');
      expect(designSystem.shadows.lg).toBe('shadow-tactical-lg');
      expect(designSystem.shadows.xl).toBe('shadow-tactical-xl');
    });

    it('should define enhanced borders', () => {
      expect(designSystem.borders).toBeDefined();
      expect(designSystem.borders.default).toBe('border-tactical');
      expect(designSystem.borders.gradient).toBe('border-gradient-military');
      expect(designSystem.borders.input).toBe('input-tactical');
    });

    it('should define dividers', () => {
      expect(designSystem.dividers).toBeDefined();
      expect(designSystem.dividers.thin).toBe('divider-tactical');
      expect(designSystem.dividers.thick).toBe('divider-tactical-thick');
    });

    it('should define progress styles', () => {
      expect(designSystem.progress).toBeDefined();
      expect(designSystem.progress.container).toBe('progress-tactical');
      expect(designSystem.progress.bar).toBe('progress-tactical-bar');
    });

    it('should define gradients', () => {
      expect(designSystem.gradients).toBeDefined();
      expect(designSystem.gradients.military).toBe('bg-gradient-military');
      expect(designSystem.gradients.militaryDark).toBe(
        'bg-gradient-military-dark'
      );
      expect(designSystem.gradients.accent).toBe('bg-gradient-accent');
    });
  });

  describe('cn helper function', () => {
    it('should combine multiple class strings', () => {
      const result = cn('class1', 'class2', 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should filter out falsy values', () => {
      const result = cn('class1', undefined, 'class2', null, false, 'class3');
      expect(result).toBe('class1 class2 class3');
    });

    it('should handle empty input', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle all falsy values', () => {
      const result = cn(undefined, null, false);
      expect(result).toBe('');
    });

    it('should preserve spacing in class names', () => {
      const result = cn('px-4 py-2', 'text-sm');
      expect(result).toBe('px-4 py-2 text-sm');
    });

    it('should work with conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      );
      expect(result).toBe('base-class active-class');
    });
  });

  describe('componentStyles presets', () => {
    it('should provide pageContainer preset', () => {
      expect(componentStyles.pageContainer).toBe(
        designSystem.spacing.pageWrapper
      );
    });

    it('should provide contentWrapper preset', () => {
      expect(componentStyles.contentWrapper).toBe(designSystem.spacing.page);
    });

    it('should provide card preset', () => {
      expect(componentStyles.card).toContain('card-military');
      expect(componentStyles.card).toContain('hover:shadow-tactical-lg');
    });

    it('should provide table preset', () => {
      expect(componentStyles.table).toBe(designSystem.table.container);
    });

    it('should provide button presets', () => {
      expect(componentStyles.button.primary).toContain('bg-ink');
      expect(componentStyles.button.primary).toContain('text-parchment');
      expect(componentStyles.button.secondary).toContain('bg-parchment/80');
      expect(componentStyles.button.danger).toContain('from-red-600');
    });

    it('should provide modal presets', () => {
      expect(componentStyles.modal.overlay).toBe(designSystem.modal.overlay);
      expect(componentStyles.modal.container).toBe(
        designSystem.modal.container
      );
      expect(componentStyles.modal.content).toContain('glass-tactical');
    });
  });

  describe('type safety', () => {
    it('should be a const object', () => {
      // TypeScript compile-time check - if this compiles, the type is correct
      const test: typeof designSystem = designSystem;
      expect(test).toBeDefined();
    });

    it('should export DesignSystem type', () => {
      // This is a compile-time check
      type TestType = typeof designSystem;
      const test: TestType = designSystem;
      expect(test).toBeDefined();
    });
  });

  describe('archival theme color consistency', () => {
    it('should use ink color for text throughout', () => {
      expect(designSystem.text.pageTitle).toContain('text-ink');
      expect(designSystem.text.body).toContain('text-ink');
      expect(designSystem.table.cell).toContain('text-ink');
      expect(designSystem.modal.header).toContain('text-ink');
    });

    it('should use parchment color for backgrounds', () => {
      expect(designSystem.card.gradient).toContain('bg-parchment');
      expect(designSystem.button.primary).toContain('text-parchment');
      expect(designSystem.button.iconButton).toContain('bg-parchment');
    });

    it('should use copper color for focus states', () => {
      expect(designSystem.button.base).toContain('focus:ring-copper');
    });

    it('should use opacity values for archival aesthetic', () => {
      expect(designSystem.card.gradient).toContain('/80');
      expect(designSystem.text.pageSubtitle).toContain('/60');
      expect(designSystem.text.label).toContain('/70');
      expect(designSystem.text.muted).toContain('/50');
    });
  });

  describe('responsive design', () => {
    it('should include responsive spacing classes', () => {
      expect(designSystem.spacing.page).toContain('p-3');
      expect(designSystem.spacing.page).toContain('md:p-4');
      expect(designSystem.spacing.page).toContain('lg:p-6');
    });
  });

  describe('transition and animation', () => {
    it('should include transition classes', () => {
      expect(designSystem.card.hover).toContain('transition-all');
      expect(designSystem.table.row).toContain('transition-all');
    });

    it('should specify animation durations', () => {
      expect(designSystem.card.hover).toContain('duration-300');
      expect(designSystem.table.row).toContain('duration-200');
      expect(designSystem.button.base).toContain('duration-200');
    });
  });
});
