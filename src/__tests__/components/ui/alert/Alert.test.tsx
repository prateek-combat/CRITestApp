import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Alert from '@/components/ui/alert/Alert';

describe('Alert Component', () => {
  describe('rendering', () => {
    it('should render with title and message', () => {
      render(
        <Alert
          variant="info"
          title="Information"
          message="This is an informational message"
        />
      );

      expect(screen.getByText('Information')).toBeInTheDocument();
      expect(
        screen.getByText('This is an informational message')
      ).toBeInTheDocument();
    });

    it('should render appropriate icon for each variant', () => {
      const { container } = render(
        <Alert
          variant="success"
          title="Success"
          message="Operation completed"
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render without link by default', () => {
      render(<Alert variant="info" title="Info" message="Message" />);

      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should render link when showLink is true', () => {
      render(
        <Alert
          variant="info"
          title="Info"
          message="Message"
          showLink={true}
          linkHref="/help"
          linkText="Get Help"
        />
      );

      const link = screen.getByRole('link', { name: 'Get Help' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/help');
    });

    it('should use default link text when not specified', () => {
      render(
        <Alert variant="info" title="Info" message="Message" showLink={true} />
      );

      expect(screen.getByText('Learn more')).toBeInTheDocument();
    });

    it('should use default link href when not specified', () => {
      render(
        <Alert variant="info" title="Info" message="Message" showLink={true} />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', '#');
    });
  });

  describe('success variant with moss theme', () => {
    it('should apply moss color classes', () => {
      const { container } = render(
        <Alert
          variant="success"
          title="Success"
          message="Operation completed"
        />
      );

      const alertContainer = container.querySelector('div.rounded-xl');
      expect(alertContainer).toHaveClass('border-moss/30', 'bg-moss/10');
    });

    it('should apply moss color to icon', () => {
      const { container } = render(
        <Alert
          variant="success"
          title="Success"
          message="Operation completed"
        />
      );

      const iconContainer = container.querySelector('.text-moss');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render success icon', () => {
      const { container } = render(
        <Alert
          variant="success"
          title="Success"
          message="Operation completed"
        />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      // Success icon has a checkmark path
      expect(svg?.querySelector('path')).toBeInTheDocument();
    });
  });

  describe('warning variant with copper theme', () => {
    it('should apply copper color classes', () => {
      const { container } = render(
        <Alert variant="warning" title="Warning" message="Please be careful" />
      );

      const alertContainer = container.querySelector('div.rounded-xl');
      expect(alertContainer).toHaveClass('border-copper/30', 'bg-copper/10');
    });

    it('should apply copper color to icon', () => {
      const { container } = render(
        <Alert variant="warning" title="Warning" message="Please be careful" />
      );

      const iconContainer = container.querySelector('.text-copper');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render warning icon', () => {
      const { container } = render(
        <Alert variant="warning" title="Warning" message="Please be careful" />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('error variant', () => {
    it('should apply error color classes', () => {
      const { container } = render(
        <Alert variant="error" title="Error" message="Something went wrong" />
      );

      const alertContainer = container.querySelector('div.rounded-xl');
      expect(alertContainer).toHaveClass('border-red-300', 'bg-red-50');
    });

    it('should apply red color to icon', () => {
      const { container } = render(
        <Alert variant="error" title="Error" message="Something went wrong" />
      );

      const iconContainer = container.querySelector('.text-red-600');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render error icon', () => {
      const { container } = render(
        <Alert variant="error" title="Error" message="Something went wrong" />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('info variant with slateblue theme', () => {
    it('should apply slateblue color classes', () => {
      const { container } = render(
        <Alert variant="info" title="Info" message="Important information" />
      );

      const alertContainer = container.querySelector('div.rounded-xl');
      expect(alertContainer).toHaveClass(
        'border-slateblue/30',
        'bg-slateblue/10'
      );
    });

    it('should apply slateblue color to icon', () => {
      const { container } = render(
        <Alert variant="info" title="Info" message="Important information" />
      );

      const iconContainer = container.querySelector('.text-slateblue');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render info icon', () => {
      const { container } = render(
        <Alert variant="info" title="Info" message="Important information" />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('archival design system alignment', () => {
    it('should use ink color for title', () => {
      const { container } = render(
        <Alert variant="info" title="Test Title" message="Test message" />
      );

      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('text-ink');
    });

    it('should use ink color with opacity for message', () => {
      const { container } = render(
        <Alert variant="info" title="Title" message="Test message" />
      );

      const message = screen.getByText('Test message');
      expect(message).toHaveClass('text-ink/60');
    });

    it('should use archival opacity values for backgrounds', () => {
      const { container } = render(
        <Alert variant="success" title="Success" message="Done" />
      );

      const alertContainer = container.querySelector('div.rounded-xl');
      expect(alertContainer?.className).toMatch(/\/10/); // bg opacity
      expect(alertContainer?.className).toMatch(/\/30/); // border opacity
    });

    it('should use rounded-xl for archival card style', () => {
      const { container } = render(
        <Alert variant="info" title="Info" message="Message" />
      );

      const alertContainer = container.querySelector('div.rounded-xl');
      expect(alertContainer).toHaveClass('rounded-xl');
    });
  });

  describe('layout and structure', () => {
    it('should have proper spacing classes', () => {
      const { container } = render(
        <Alert variant="info" title="Info" message="Message" />
      );

      const alertContainer = container.querySelector('div.rounded-xl');
      expect(alertContainer).toHaveClass('p-4');
    });

    it('should use flexbox for icon and content', () => {
      const { container } = render(
        <Alert variant="info" title="Info" message="Message" />
      );

      const contentWrapper = container.querySelector('.flex.items-start');
      expect(contentWrapper).toHaveClass('gap-3');
    });

    it('should apply proper typography styles', () => {
      render(
        <Alert variant="info" title="Test Title" message="Test message" />
      );

      const title = screen.getByText('Test Title');
      expect(title).toHaveClass('text-sm', 'font-semibold');

      const message = screen.getByText('Test message');
      expect(message).toHaveClass('text-sm');
    });
  });

  describe('link styling', () => {
    it('should apply archival link styles', () => {
      render(
        <Alert
          variant="info"
          title="Info"
          message="Message"
          showLink={true}
          linkText="Read more"
        />
      );

      const link = screen.getByRole('link', { name: 'Read more' });
      expect(link).toHaveClass(
        'text-ink/60',
        'underline',
        'text-sm',
        'font-medium'
      );
    });

    it('should have proper spacing for link', () => {
      render(
        <Alert variant="info" title="Info" message="Message" showLink={true} />
      );

      const link = screen.getByRole('link');
      expect(link).toHaveClass('mt-3');
    });
  });

  describe('accessibility', () => {
    it('should use semantic heading for title', () => {
      render(<Alert variant="info" title="Important Info" message="Message" />);

      const heading = screen.getByRole('heading', { level: 4 });
      expect(heading).toHaveTextContent('Important Info');
    });

    it('should render link with proper href', () => {
      render(
        <Alert
          variant="info"
          title="Info"
          message="Message"
          showLink={true}
          linkHref="/documentation"
          linkText="View docs"
        />
      );

      const link = screen.getByRole('link', { name: 'View docs' });
      expect(link).toHaveAttribute('href', '/documentation');
    });
  });

  describe('edge cases', () => {
    it('should handle long titles', () => {
      const longTitle =
        'This is a very long title that might wrap to multiple lines in the alert component';
      render(<Alert variant="info" title={longTitle} message="Message" />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle long messages', () => {
      const longMessage =
        'This is a very long message that contains multiple sentences and might need to wrap across several lines to display all the important information to the user.';
      render(<Alert variant="info" title="Title" message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle empty link text gracefully', () => {
      render(
        <Alert
          variant="info"
          title="Info"
          message="Message"
          showLink={true}
          linkText=""
        />
      );

      const link = screen.getByRole('link');
      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent('');
    });
  });

  describe('variant consistency', () => {
    it('should render all variants with consistent structure', () => {
      const variants: Array<'success' | 'error' | 'warning' | 'info'> = [
        'success',
        'error',
        'warning',
        'info',
      ];

      variants.forEach((variant) => {
        const { container, unmount } = render(
          <Alert variant={variant} title="Title" message="Message" />
        );

        // Each variant should have an icon
        expect(container.querySelector('svg')).toBeInTheDocument();

        // Each variant should have a title
        expect(screen.getByText('Title')).toBeInTheDocument();

        // Each variant should have a message
        expect(screen.getByText('Message')).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('icon rendering', () => {
    it('should render unique icons for each variant', () => {
      const variants: Array<'success' | 'error' | 'warning' | 'info'> = [
        'success',
        'error',
        'warning',
        'info',
      ];

      const iconPaths: string[] = [];

      variants.forEach((variant) => {
        const { container, unmount } = render(
          <Alert variant={variant} title="Title" message="Message" />
        );

        const svg = container.querySelector('svg');
        const path = svg?.querySelector('path')?.getAttribute('d');

        if (path) {
          // Each variant should have a different icon path
          expect(iconPaths).not.toContain(path);
          iconPaths.push(path);
        }

        unmount();
      });

      // Should have 4 unique icon paths
      expect(iconPaths.length).toBe(4);
    });
  });
});
