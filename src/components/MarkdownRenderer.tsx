import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = '',
}) => {
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
      <ReactMarkdown
        components={CodeBlock}
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
