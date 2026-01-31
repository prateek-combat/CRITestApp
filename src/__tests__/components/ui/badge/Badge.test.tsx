import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Badge from '@/components/ui/badge/Badge';

describe('Badge Component', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<Badge>Test Badge</Badge>);
      const badge = screen.getByText('Test Badge');
      expect(badge).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<Badge>Custom Content</Badge>);
      expect(screen.getByText('Custom Content')).toBeInTheDocument();
    });

    it('should render with start icon', () => {
      const StartIcon = () => <span data-testid="start-icon">🔔</span>;
      render(<Badge startIcon={<StartIcon />}>With Icon</Badge>);
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('should render with end icon', () => {
      const EndIcon = () => <span data-testid="end-icon">✓</span>;
      render(<Badge endIcon={<EndIcon />}>With Icon</Badge>);
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
      expect(screen.getByText('With Icon')).toBeInTheDocument();
    });

    it('should render with both start and end icons', () => {
      const StartIcon = () => <span data-testid="start-icon">🔔</span>;
      const EndIcon = () => <span data-testid="end-icon">✓</span>;
      render(
        <Badge startIcon={<StartIcon />} endIcon={<EndIcon />}>
          Both Icons
        </Badge>
      );
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    });
  });

  describe('variants', () => {
    it('should render light variant by default', () => {
      const { container } = render(<Badge>Light Badge</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-ink/10', 'text-ink');
    });

    it('should render solid variant', () => {
      const { container } = render(<Badge variant="solid">Solid Badge</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-ink', 'text-parchment');
    });
  });

  describe('colors with archival theme', () => {
    it('should render primary color with light variant', () => {
      const { container } = render(
        <Badge variant="light" color="primary">
          Primary
        </Badge>
      );
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-ink/10', 'text-ink');
    });

    it('should render success color with moss theme', () => {
      const { container } = render(
        <Badge variant="light" color="success">
          Success
        </Badge>
      );
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-moss/12', 'text-moss');
    });

    it('should render warning color with copper theme', () => {
      const { container } = render(
        <Badge variant="light" color="warning">
          Warning
        </Badge>
      );
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-copper/12', 'text-copper');
    });

    it('should render info color with slateblue theme', () => {
      const { container } = render(
        <Badge variant="light" color="info">
          Info
        </Badge>
      );
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-slateblue/12', 'text-slateblue');
    });

    it('should render error color', () => {
      const { container } = render(
        <Badge variant="light" color="error">
          Error
        </Badge>
      );
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-red-50', 'text-red-600');
    });

    it('should render light color with parchment background', () => {
      const { container } = render(
        <Badge variant="light" color="light">
          Light
        </Badge>
      );
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-parchment', 'text-ink/70');
    });

    it('should render dark color', () => {
      const { container } = render(
        <Badge variant="light" color="dark">
          Dark
        </Badge>
      );
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-ink', 'text-parchment');
    });
  });

  describe('solid variant colors', () => {
    it('should render solid success with moss theme', () => {
      const { container } = render(
        <Badge variant="solid" color="success">
          Success
        </Badge>
      );
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-moss', 'text-parchment');
    });

    it('should render solid warning with copper theme', () => {
      const { container } = render(
        <Badge variant="solid" color="warning">
          Warning
        </Badge>
      );
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-copper', 'text-parchment');
    });

    it('should render solid info with slateblue theme', () => {
      const { container } = render(
        <Badge variant="solid" color="info">
          Info
        </Badge>
      );
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-slateblue', 'text-parchment');
    });
  });

  describe('sizes', () => {
    it('should render medium size by default', () => {
      const { container } = render(<Badge>Medium</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-sm');
    });

    it('should render small size', () => {
      const { container } = render(<Badge size="sm">Small</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-theme-xs');
    });

    it('should render medium size explicitly', () => {
      const { container } = render(<Badge size="md">Medium</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass('text-sm');
    });
  });

  describe('base styles', () => {
    it('should include base styling classes', () => {
      const { container } = render(<Badge>Test</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toHaveClass(
        'inline-flex',
        'items-center',
        'px-2.5',
        'py-0.5',
        'justify-center',
        'gap-1',
        'rounded-full',
        'font-medium'
      );
    });
  });

  describe('combination of props', () => {
    it('should handle all props together', () => {
      const StartIcon = () => <span data-testid="start-icon">📊</span>;
      const EndIcon = () => <span data-testid="end-icon">→</span>;

      const { container } = render(
        <Badge
          variant="solid"
          color="success"
          size="sm"
          startIcon={<StartIcon />}
          endIcon={<EndIcon />}
        >
          Complete Badge
        </Badge>
      );

      const badge = container.querySelector('span');
      expect(badge).toHaveClass('bg-moss', 'text-parchment', 'text-theme-xs');
      expect(screen.getByTestId('start-icon')).toBeInTheDocument();
      expect(screen.getByTestId('end-icon')).toBeInTheDocument();
      expect(screen.getByText('Complete Badge')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should render as a span element', () => {
      const { container } = render(<Badge>Accessible</Badge>);
      const badge = container.querySelector('span');
      expect(badge?.tagName).toBe('SPAN');
    });

    it('should preserve icon accessibility', () => {
      const AccessibleIcon = () => (
        <span role="img" aria-label="notification">
          🔔
        </span>
      );
      render(<Badge startIcon={<AccessibleIcon />}>Notification</Badge>);
      const icon = screen.getByRole('img', { name: 'notification' });
      expect(icon).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should render with empty string children', () => {
      const { container } = render(<Badge>{''}</Badge>);
      const badge = container.querySelector('span');
      expect(badge).toBeInTheDocument();
    });

    it('should render with numeric children', () => {
      render(<Badge>{42}</Badge>);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('should render with React fragment children', () => {
      render(
        <Badge>
          <>
            Multiple <strong>parts</strong>
          </>
        </Badge>
      );
      expect(screen.getByText('Multiple')).toBeInTheDocument();
      expect(screen.getByText('parts')).toBeInTheDocument();
    });
  });

  describe('archival design system alignment', () => {
    it('should use archival color tokens for primary', () => {
      const { container } = render(<Badge color="primary">Primary</Badge>);
      const badge = container.querySelector('span');
      // Verifies ink color usage
      expect(badge?.className).toMatch(/ink/);
    });

    it('should use archival opacity values', () => {
      const { container } = render(<Badge color="success">Success</Badge>);
      const badge = container.querySelector('span');
      // Verifies moss with /12 opacity
      expect(badge?.className).toMatch(/moss\/12/);
    });

    it('should use parchment color for light backgrounds', () => {
      const { container } = render(<Badge color="light">Light</Badge>);
      const badge = container.querySelector('span');
      expect(badge?.className).toMatch(/parchment/);
    });
  });
});
