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

  const CodeBlock = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : 'text';

      // For code blocks, make them much more compact
      if (!inline) {
        return (
          <code
            className={className}
            {...props}
            style={{
              backgroundColor: '#f3f4f6',
              color: '#1f2937',
              borderRadius: '0.375rem',
              padding: '0.25rem 0.5rem',
              fontFamily:
                'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
              fontSize: '0.875rem',
              border: '1px solid #e5e7eb',
              display: 'inline-block',
              lineHeight: '1.4',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {String(children).replace(/\n$/, '')}
          </code>
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
  };

  return (
    <div className={`prose max-w-none ${className}`}>
      <ReactMarkdown components={CodeBlock} remarkPlugins={[remarkGfm]}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
