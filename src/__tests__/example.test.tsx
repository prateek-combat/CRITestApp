import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Example component for testing
function ExampleComponent({ text }: { text: string }) {
  return <div data-testid="example">{text}</div>;
}

describe('Example Test Suite', () => {
  it('renders the component correctly', () => {
    render(<ExampleComponent text="Hello World" />);

    const element = screen.getByTestId('example');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent('Hello World');
  });

  it('handles different props', () => {
    render(<ExampleComponent text="Test Content" />);

    const element = screen.getByTestId('example');
    expect(element).toHaveTextContent('Test Content');
  });
});

// Example API test
describe('API Testing Example', () => {
  it('should handle API responses', async () => {
    // Mock fetch response
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: 'healthy' }),
    });

    const response = await fetch('/api/health');
    const data = await response.json();

    expect(response.ok).toBe(true);
    expect(data.status).toBe('healthy');
  });
});

// Example utility function test
function addNumbers(a: number, b: number): number {
  return a + b;
}

describe('Utility Functions', () => {
  it('should add numbers correctly', () => {
    expect(addNumbers(2, 3)).toBe(5);
    expect(addNumbers(-1, 1)).toBe(0);
    expect(addNumbers(0, 0)).toBe(0);
  });
});
