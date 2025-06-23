import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
  // Pre-process content to escape problematic C++ template syntax
  const preprocessContent = (text: string): string => {
    // Escape C++ template syntax like std::shared_ptr<const Type>
    return (
      text
        // Escape std:: patterns with angle brackets
        .replace(/std::([a-zA-Z_]+)<([^>]+)>/g, (match, type, inner) => {
          return `std::${type}&lt;${inner}&gt;`;
        })
        // Escape other template patterns
        .replace(/([a-zA-Z_][a-zA-Z0-9_]*)<([^>]+)>/g, (match, type, inner) => {
          // Only escape if it looks like C++ and not HTML
          if (
            type === 'strong' ||
            type === 'em' ||
            type === 'h1' ||
            type === 'h2' ||
            type === 'h3' ||
            type === 'h4' ||
            type === 'h5' ||
            type === 'h6' ||
            type === 'p' ||
            type === 'div' ||
            type === 'span' ||
            type === 'blockquote' ||
            type === 'br'
          ) {
            return match; // Keep HTML tags as-is
          }
          return `${type}&lt;${inner}&gt;`;
        })
    );
  };

  const processedContent = preprocessContent(content);

  const components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';

      // For fenced code blocks (not inline)
      if (!inline) {
        return (
          <SyntaxHighlighter
            style={vs}
            language={language}
            PreTag="div"
            customStyle={{
              margin: '1rem 0',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              lineHeight: '1.5',
              padding: '1rem',
              backgroundColor: '#f8f9fa',
              border: '1px solid #e9ecef',
              overflow: 'auto',
              maxWidth: '100%',
            }}
            codeTagProps={{
              style: {
                fontFamily:
                  'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              },
            }}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        );
      }

      // Handle inline code
      return (
        <code
          className={className}
          {...props}
          style={{
            backgroundColor: '#f3f4f6',
            color: '#1f2937',
            borderRadius: '0.25rem',
            padding: '0.125rem 0.25rem',
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: '0.875rem',
            border: '1px solid #e5e7eb',
          }}
        >
          {children}
        </code>
      );
    },

    // Handle pre elements (code block containers)
    pre({ children }: any) {
      return <div style={{ margin: 0 }}>{children}</div>;
    },

    // Handle tables
    table({ children }: any) {
      return (
        <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
          <table
            style={{
              borderCollapse: 'collapse',
              width: '100%',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
            }}
          >
            {children}
          </table>
        </div>
      );
    },

    // Handle table headers
    th({ children }: any) {
      return (
        <th
          style={{
            border: '1px solid #e5e7eb',
            padding: '0.5rem',
            backgroundColor: '#f9fafb',
            fontWeight: 'bold',
            textAlign: 'left',
          }}
        >
          {children}
        </th>
      );
    },

    // Handle table cells
    td({ children }: any) {
      return (
        <td
          style={{
            border: '1px solid #e5e7eb',
            padding: '0.5rem',
          }}
        >
          {children}
        </td>
      );
    },
  };

  return (
    <div className={`prose max-w-none ${className}`}>
      <ReactMarkdown components={components} remarkPlugins={[remarkGfm]}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
