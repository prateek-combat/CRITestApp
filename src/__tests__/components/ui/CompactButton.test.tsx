import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  CompactButton,
  CompactIconButton,
} from '@/components/ui/CompactButton';
import { Plus, Trash, Settings } from 'lucide-react';

describe('CompactButton', () => {
  describe('rendering', () => {
    it('should render with text children', () => {
      render(<CompactButton>Click Me</CompactButton>);
      expect(screen.getByText('Click Me')).toBeInTheDocument();
    });

    it('should render with icon only', () => {
      const { container } = render(<CompactButton icon={Plus} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render with both icon and text', () => {
      const { container } = render(
        <CompactButton icon={Settings}>Settings</CompactButton>
      );
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render as button element by default', () => {
      const { container } = render(<CompactButton>Test</CompactButton>);
      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button?.type).toBe('button');
    });
  });

  describe('variants with archival theme', () => {
    it('should render secondary variant by default', () => {
      const { container } = render(<CompactButton>Default</CompactButton>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-parchment/80', 'text-ink');
    });

    it('should render primary variant with ink background', () => {
      const { container } = render(
        <CompactButton variant="primary">Primary</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-ink', 'text-parchment');
    });

    it('should render secondary variant with parchment background', () => {
      const { container } = render(
        <CompactButton variant="secondary">Secondary</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-parchment/80', 'text-ink');
    });

    it('should render danger variant', () => {
      const { container } = render(
        <CompactButton variant="danger">Delete</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('from-red-600', 'to-red-700');
    });

    it('should render ghost variant with transparent background', () => {
      const { container } = render(
        <CompactButton variant="ghost">Ghost</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('bg-transparent', 'text-ink/70');
    });
  });

  describe('sizes', () => {
    it('should render small size by default', () => {
      const { container } = render(<CompactButton>Small</CompactButton>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-3', 'py-1.5', 'text-sm');
    });

    it('should render extra small size', () => {
      const { container } = render(
        <CompactButton size="xs">Extra Small</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-2', 'py-1', 'text-xs');
    });

    it('should render medium size', () => {
      const { container } = render(
        <CompactButton size="md">Medium</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('px-4', 'py-2', 'text-sm');
    });

    it('should apply correct icon size for xs', () => {
      const { container } = render(
        <CompactButton size="xs" icon={Plus}>
          XS
        </CompactButton>
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-3', 'w-3');
    });

    it('should apply correct icon size for sm', () => {
      const { container } = render(
        <CompactButton size="sm" icon={Plus}>
          SM
        </CompactButton>
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-4', 'w-4');
    });

    it('should apply correct icon size for md', () => {
      const { container } = render(
        <CompactButton size="md" icon={Plus}>
          MD
        </CompactButton>
      );
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('h-4', 'w-4');
    });
  });

  describe('interaction', () => {
    it('should call onClick when clicked', () => {
      const handleClick = jest.fn();
      render(<CompactButton onClick={handleClick}>Click</CompactButton>);

      fireEvent.click(screen.getByText('Click'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const handleClick = jest.fn();
      render(
        <CompactButton onClick={handleClick} disabled>
          Disabled
        </CompactButton>
      );

      fireEvent.click(screen.getByText('Disabled'));
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', () => {
      const handleClick = jest.fn();
      render(
        <CompactButton onClick={handleClick} loading>
          Loading
        </CompactButton>
      );

      fireEvent.click(screen.getByText('Loading'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should apply disabled styles when disabled', () => {
      const { container } = render(
        <CompactButton disabled>Disabled</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('cursor-not-allowed', 'opacity-50');
      expect(button).toBeDisabled();
    });

    it('should apply disabled styles when loading', () => {
      const { container } = render(
        <CompactButton loading>Loading</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('cursor-not-allowed', 'opacity-50');
      expect(button).toBeDisabled();
    });
  });

  describe('loading state', () => {
    it('should show spinner when loading', () => {
      const { container } = render(
        <CompactButton loading>Loading</CompactButton>
      );
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should hide content when loading', () => {
      const { container } = render(
        <CompactButton loading icon={Plus}>
          Save
        </CompactButton>
      );
      // The content wrapper has opacity-0, not the first flex container
      const content = container.querySelector('span.flex.items-center');
      expect(content).toHaveClass('opacity-0');
    });

    it('should show content when not loading', () => {
      const { container } = render(
        <CompactButton icon={Plus}>Save</CompactButton>
      );
      const content = container.querySelector('.flex.items-center');
      expect(content).not.toHaveClass('opacity-0');
    });
  });

  describe('button types', () => {
    it('should support submit type', () => {
      const { container } = render(
        <CompactButton type="submit">Submit</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button?.type).toBe('submit');
    });

    it('should support reset type', () => {
      const { container } = render(
        <CompactButton type="reset">Reset</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button?.type).toBe('reset');
    });

    it('should support button type', () => {
      const { container } = render(
        <CompactButton type="button">Button</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button?.type).toBe('button');
    });
  });

  describe('custom props', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <CompactButton className="custom-class">Custom</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should set title attribute', () => {
      const { container } = render(
        <CompactButton title="Tooltip text">Hover</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button?.title).toBe('Tooltip text');
    });
  });

  describe('base styles', () => {
    it('should include copper focus ring', () => {
      const { container } = render(<CompactButton>Test</CompactButton>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('focus:ring-copper/40');
    });

    it('should include transition classes', () => {
      const { container } = render(<CompactButton>Test</CompactButton>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('transition-all', 'duration-200');
    });

    it('should include rounded corners', () => {
      const { container } = render(<CompactButton>Test</CompactButton>);
      const button = container.querySelector('button');
      expect(button).toHaveClass('rounded-md');
    });
  });

  describe('archival design system alignment', () => {
    it('should use ink/parchment color tokens', () => {
      const { container } = render(
        <CompactButton variant="primary">Primary</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button?.className).toMatch(/ink/);
      expect(button?.className).toMatch(/parchment/);
    });

    it('should use copper for focus ring', () => {
      const { container } = render(<CompactButton>Test</CompactButton>);
      const button = container.querySelector('button');
      expect(button?.className).toMatch(/copper/);
    });

    it('should use archival opacity values', () => {
      const { container } = render(
        <CompactButton variant="secondary">Secondary</CompactButton>
      );
      const button = container.querySelector('button');
      expect(button?.className).toMatch(/parchment\/80/);
    });
  });
});

describe('CompactIconButton', () => {
  describe('rendering', () => {
    it('should render with icon', () => {
      const { container } = render(<CompactIconButton icon={Settings} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should not render children', () => {
      render(<CompactIconButton icon={Plus} />);
      // Icon button should only show the icon, no text
      const button = screen.getByRole('button');
      expect(button.textContent).toBe('');
    });

    it('should apply custom padding override', () => {
      const { container } = render(<CompactIconButton icon={Plus} />);
      const button = container.querySelector('button');
      expect(button?.className).toMatch(/!p-1/);
    });

    it('should preserve custom className', () => {
      const { container } = render(
        <CompactIconButton icon={Plus} className="custom-icon-class" />
      );
      const button = container.querySelector('button');
      expect(button).toHaveClass('custom-icon-class');
    });
  });

  describe('interaction', () => {
    it('should handle click events', () => {
      const handleClick = jest.fn();
      render(<CompactIconButton icon={Trash} onClick={handleClick} />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should respect disabled state', () => {
      const handleClick = jest.fn();
      render(<CompactIconButton icon={Trash} onClick={handleClick} disabled />);

      const button = screen.getByRole('button');
      fireEvent.click(button);
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('variants', () => {
    it('should support all variants', () => {
      const { rerender, container } = render(
        <CompactIconButton icon={Plus} variant="primary" />
      );
      let button = container.querySelector('button');
      expect(button).toHaveClass('bg-ink');

      rerender(<CompactIconButton icon={Plus} variant="danger" />);
      button = container.querySelector('button');
      expect(button).toHaveClass('from-red-600');
    });
  });

  describe('accessibility', () => {
    it('should support title for accessibility', () => {
      const { container } = render(
        <CompactIconButton icon={Plus} title="Add item" />
      );
      const button = container.querySelector('button');
      expect(button?.title).toBe('Add item');
    });
  });
});
